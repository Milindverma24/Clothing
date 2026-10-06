import json
import httpx
from typing import AsyncGenerator, Dict, Any, List, Optional
from app.core.config import settings
from app.core.logging import logger
from app.core.exceptions import LLMError


class LLMService:
    """Multi-provider LLM abstraction layer."""

    def __init__(self):
        self.provider = settings.AI_PROVIDER.lower()
        self.api_key = settings.AI_API_KEY
        self.model = settings.AI_MODEL
        self.temperature = settings.AI_TEMPERATURE

    async def generate(
        self,
        messages: List[Dict[str, str]],
        system_prompt: Optional[str] = None,
        response_format: Optional[str] = None,
    ) -> str:
        """Generates a complete response from the configured LLM provider."""
        if self.provider == "mock" or not self.api_key or self.api_key == "mock-key":
            return await self._mock_generate(messages, system_prompt, response_format)

        if self.provider in ["openai", "groq"]:
            return await self._openai_compatible_generate(messages, system_prompt, response_format)
        elif self.provider == "gemini":
            return await self._gemini_generate(messages, system_prompt)
        else:
            # Fallback to mock if provider is unknown
            logger.warning(f"Unknown or unconfigured AI_PROVIDER '{self.provider}'. Using built-in engine.")
            return await self._mock_generate(messages, system_prompt, response_format)

    async def generate_stream(
        self,
        messages: List[Dict[str, str]],
        system_prompt: Optional[str] = None,
    ) -> AsyncGenerator[str, None]:
        """Streams text chunks from the configured LLM provider."""
        if self.provider == "mock" or not self.api_key or self.api_key == "mock-key":
            full_text = await self._mock_generate(messages, system_prompt)
            # Yield in small human-like chunks
            words = full_text.split(" ")
            for i in range(0, len(words), 3):
                chunk = " ".join(words[i : i + 3]) + " "
                yield chunk
            return

        # OpenAI-compatible streaming
        url = "https://api.openai.com/v1/chat/completions"
        if self.provider == "groq":
            url = "https://api.groq.com/openai/v1/chat/completions"

        full_msgs = []
        if system_prompt:
            full_msgs.append({"role": "system", "content": system_prompt})
        full_msgs.extend(messages)

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": self.model,
            "messages": full_msgs,
            "temperature": self.temperature,
            "stream": True,
        }

        try:
            async with httpx.AsyncClient(timeout=settings.REQUEST_TIMEOUT_SECONDS) as client:
                async with client.stream("POST", url, headers=headers, json=payload) as response:
                    async for line in response.aiter_lines():
                        if line.startswith("data: ") and line != "data: [DONE]":
                            data_str = line[6:]
                            try:
                                chunk_json = json.loads(data_str)
                                delta = chunk_json["choices"][0]["delta"].get("content", "")
                                if delta:
                                    yield delta
                            except Exception:
                                continue
        except Exception as e:
            logger.error(f"Streaming error with {self.provider}: {e}")
            yield "I encountered a momentary connection issue. Please try again."

    async def _openai_compatible_generate(
        self,
        messages: List[Dict[str, str]],
        system_prompt: Optional[str] = None,
        response_format: Optional[str] = None,
    ) -> str:
        url = "https://api.openai.com/v1/chat/completions"
        if self.provider == "groq":
            url = "https://api.groq.com/openai/v1/chat/completions"

        full_msgs = []
        if system_prompt:
            full_msgs.append({"role": "system", "content": system_prompt})
        full_msgs.extend(messages)

        payload: Dict[str, Any] = {
            "model": self.model,
            "messages": full_msgs,
            "temperature": self.temperature,
        }
        if response_format == "json":
            payload["response_format"] = {"type": "json_object"}

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        try:
            async with httpx.AsyncClient(timeout=settings.REQUEST_TIMEOUT_SECONDS) as client:
                res = await client.post(url, headers=headers, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    return data["choices"][0]["message"]["content"]
                else:
                    logger.error(f"LLM API Error: {res.status_code} - {res.text}")
                    raise LLMError(f"LLM provider error ({res.status_code})")
        except Exception as e:
            logger.error(f"Error calling LLM: {e}")
            return await self._mock_generate(messages, system_prompt, response_format)

    async def _gemini_generate(
        self,
        messages: List[Dict[str, str]],
        system_prompt: Optional[str] = None,
    ) -> str:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.api_key}"
        contents = []
        for m in messages:
            role = "user" if m["role"] == "user" else "model"
            contents.append({"role": role, "parts": [{"text": m["content"]}]})

        body: Dict[str, Any] = {"contents": contents}
        if system_prompt:
            body["systemInstruction"] = {"parts": [{"text": system_prompt}]}

        try:
            async with httpx.AsyncClient(timeout=settings.REQUEST_TIMEOUT_SECONDS) as client:
                res = await client.post(url, json=body)
                if res.status_code == 200:
                    data = res.json()
                    return data["candidates"][0]["content"]["parts"][0]["text"]
                raise LLMError(f"Gemini API returned status {res.status_code}")
        except Exception as e:
            logger.error(f"Error calling Gemini: {e}")
            return await self._mock_generate(messages, system_prompt)

    async def _mock_generate(
        self,
        messages: List[Dict[str, str]],
        system_prompt: Optional[str] = None,
        response_format: Optional[str] = None,
    ) -> str:
        """Deterministic, intelligent local generator for zero-API-key testing and offline development."""
        last_user_msg = ""
        for m in reversed(messages):
            if m.get("role") == "user":
                last_user_msg = m.get("content", "").lower()
                break

        if response_format == "json":
            # Return structured intent or plan
            if any(w in last_user_msg for w in ["cancel", "cancellation"]):
                return json.dumps({
                    "intent": "ORDER_CANCEL",
                    "confidence": 0.98,
                    "entities": {"action": "cancel"}
                })
            elif any(w in last_user_msg for w in ["return", "exchange"]):
                return json.dumps({
                    "intent": "RETURN_REQUEST",
                    "confidence": 0.95,
                    "entities": {"action": "return"}
                })
            elif any(w in last_user_msg for w in ["cart", "bag", "add to cart"]):
                return json.dumps({
                    "intent": "CART_ADD",
                    "confidence": 0.92,
                    "entities": {"action": "add"}
                })
            elif any(w in last_user_msg for w in ["order", "track", "package", "status"]):
                return json.dumps({
                    "intent": "ORDER_STATUS",
                    "confidence": 0.95,
                    "entities": {}
                })
            elif any(w in last_user_msg for w in ["policy", "shipping time", "delivery", "days"]):
                return json.dumps({
                    "intent": "POLICY_QUESTION",
                    "confidence": 0.90,
                    "entities": {}
                })
            else:
                return json.dumps({
                    "intent": "PRODUCT_SEARCH",
                    "confidence": 0.90,
                    "entities": {"query": last_user_msg}
                })

        # Regular natural conversational response for offline/mock mode
        if any(w in last_user_msg for w in ["hi", "hello", "hey", "namaste", "morning", "evening"]):
            return (
                "Hello! Welcome to CLOTHING. I am your 24/7 personal shopping assistant.\n\n"
                "I can help you discover items in our collection, track recent orders, answer questions about "
                "sizing and fabric care, or explain our store policies. How can I help you today?"
            )

        if any(w in last_user_msg for w in ["thank", "thx", "appreciate", "bye", "goodbye"]):
            return "You're very welcome! If you need any more recommendations or have questions about your wardrobe, I'm always right here. Have a wonderful day!"

        if any(w in last_user_msg for w in ["size", "fit", "small", "medium", "large", "chest"]):
            return (
                "Our apparel follows standard regular fits:\n"
                "• S (38\" chest), M (40\" chest), L (42\" chest), XL (44\" chest), XXL (46\" chest).\n"
                "For relaxed streetwear looks, we recommend sizing up one size."
            )

        if any(w in last_user_msg for w in ["fabric", "cotton", "material", "wash", "care", "shrink"]):
            return (
                "We use premium 100% combed long-staple cotton and pre-shrunk 380 GSM fleece. "
                "For care: machine wash cold with similar colors and hang dry in shade to maintain color depth and texture."
            )

        if any(w in last_user_msg for w in ["pay", "payment", "upi", "cod", "card", "cash"]):
            return (
                "We accept all major secure payment options:\n"
                "• UPI (Google Pay, PhonePe, Paytm)\n"
                "• Debit & Credit Cards (Visa, MasterCard, RuPay, Amex)\n"
                "• Cash on Delivery (COD) on orders up to ₹5,000 across eligible pincodes."
            )

        if any(w in last_user_msg for w in ["ship", "deliver", "days", "timeline", "charge"]):
            return (
                "Standard delivery takes 3–5 business days in metros and 5–7 business days nationwide. "
                "Shipping is 100% FREE on all orders above ₹999!"
            )

        if any(w in last_user_msg for w in ["return", "refund", "exchange"]):
            return (
                "We offer a 7-day hassle-free return and exchange policy from the date of delivery. "
                "Items must be unused with tags attached. Refunds are processed within 5–7 business days."
            )

        if any(w in last_user_msg for w in ["contact", "support", "email", "phone", "call", "help"]):
            return (
                "Our customer concierge team is available Monday to Saturday, 9:00 AM to 8:00 PM IST.\n"
                "• Email: support@clothing.com\n"
                "• Phone: +91 98112 34567\n"
                "You can also ask me to 'talk to a human' directly in this chat!"
            )

        if any(w in last_user_msg for w in ["wear", "outfit", "pair", "style", "recommend", "suggestion"]):
            return (
                "For a clean, modern aesthetic:\n"
                "• Try pairing a classic Black or Navy shirt with relaxed light trousers and white sneakers.\n"
                "• For casual weekends, our heavyweight boxy tees and comfort shorts make an effortless combination.\n"
                "Let me know what colors or vibes you like, and I'll find pieces from our live catalog for you!"
            )

        # Context-aware general answer
        return (
            f"Regarding your query about '{last_user_msg}': "
            "At CLOTHING, we focus on timeless everyday movement wear and effortless shopping. "
            "You can ask me to search specific colors and styles, check your order status, or explore our store policies!"
        )


llm_service = LLMService()
