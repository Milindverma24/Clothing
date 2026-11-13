import json
import httpx
from typing import AsyncGenerator, Dict, Any, List, Optional
from app.core.config import settings
from app.core.logging import logger
from app.core.exceptions import LLMError


class LLMService:
    """Multi-provider LLM abstraction layer with Colab support, fallback routing, and health checks."""

    def __init__(self):
        self.provider = settings.AI_PROVIDER.lower()
        self.api_key = settings.AI_API_KEY
        self.model = settings.AI_MODEL
        self.temperature = settings.AI_TEMPERATURE

        # Custom self-hosted endpoint (e.g. Google Colab + llama.cpp / vLLM + Cloudflare Tunnel)
        self.model_base_url = settings.MODEL_BASE_URL
        self.custom_api_key = settings.MODEL_API_KEY
        self.custom_model_name = settings.MODEL_NAME or "qwen2.5-7b-instruct"
        self.custom_timeout = settings.MODEL_TIMEOUT_SECONDS

        # Fallback provider configuration
        self.fallback_provider = (settings.FALLBACK_PROVIDER or "").lower()
        self.fallback_api_key = settings.FALLBACK_API_KEY
        self.fallback_model = settings.FALLBACK_MODEL
        self.fallback_timeout = settings.FALLBACK_TIMEOUT_SECONDS

        # Tracking active provider for telemetry
        self.last_active_provider = self.provider

    def update_model_endpoint(
        self,
        base_url: str,
        api_key: Optional[str] = None,
        model_name: Optional[str] = None
    ) -> None:
        """Dynamically updates the self-hosted model endpoint (called by Colab registration)."""
        self.model_base_url = base_url.strip()
        if api_key is not None:
            self.custom_api_key = api_key.strip()
        if model_name:
            self.custom_model_name = model_name.strip()
        self.provider = "custom_openai"
        logger.info(f"Model endpoint dynamically updated: {self.model_base_url} (model: {self.custom_model_name})")

    async def check_health(self) -> Dict[str, Any]:
        """Probes the configured model endpoint to check readiness."""
        if self.provider == "mock":
            return {"status": "ONLINE", "provider": "mock", "latency_ms": 0}

        target_url = self._get_chat_url(self.provider)
        probe_url = target_url.replace("/chat/completions", "/models")

        headers = {}
        key = self._get_api_key(self.provider)
        if key:
            headers["Authorization"] = f"Bearer {key}"

        start_time = httpx.get_uptime() if hasattr(httpx, "get_uptime") else 0
        try:
            import time
            t0 = time.time()
            async with httpx.AsyncClient(timeout=5.0) as client:
                res = await client.get(probe_url, headers=headers)
                latency = round((time.time() - t0) * 1000, 2)
                if res.status_code == 200:
                    return {
                        "status": "ONLINE",
                        "provider": self.provider,
                        "endpoint": self.model_base_url or target_url,
                        "latency_ms": latency
                    }
                else:
                    return {
                        "status": "DEGRADED",
                        "provider": self.provider,
                        "status_code": res.status_code,
                        "latency_ms": latency
                    }
        except Exception as e:
            return {
                "status": "OFFLINE",
                "provider": self.provider,
                "error": str(e)
            }

    async def generate(
        self,
        messages: List[Dict[str, str]],
        system_prompt: Optional[str] = None,
        response_format: Optional[str] = None,
    ) -> str:
        """Generates a complete response, automatically routing through fallback if primary fails."""
        # 1. Primary provider execution
        try:
            if self.provider == "mock" or (self.provider != "custom_openai" and (not self.api_key or self.api_key == "mock-key")):
                self.last_active_provider = "mock"
                return await self._mock_generate(messages, system_prompt, response_format)

            self.last_active_provider = self.provider
            if self.provider in ["openai", "groq", "custom_openai"]:
                return await self._openai_compatible_generate(
                    messages=messages,
                    system_prompt=system_prompt,
                    response_format=response_format,
                    provider_type=self.provider
                )
            elif self.provider == "gemini":
                return await self._gemini_generate(messages, system_prompt)
            else:
                logger.warning(f"Unknown AI_PROVIDER '{self.provider}'. Falling back to built-in synthesizer.")
                return await self._mock_generate(messages, system_prompt, response_format)

        except Exception as primary_error:
            logger.warning(f"Primary LLM ({self.provider}) failed: {primary_error}")

            # 2. Fallback provider execution
            if self.fallback_provider and self.fallback_api_key:
                logger.info(f"Attempting fallback LLM provider: {self.fallback_provider}")
                try:
                    self.last_active_provider = f"fallback_{self.fallback_provider}"
                    if self.fallback_provider in ["openai", "groq"]:
                        return await self._openai_compatible_generate(
                            messages=messages,
                            system_prompt=system_prompt,
                            response_format=response_format,
                            provider_type=self.fallback_provider,
                            use_fallback=True
                        )
                    elif self.fallback_provider == "gemini":
                        return await self._gemini_generate(messages, system_prompt, use_fallback=True)
                except Exception as fallback_error:
                    logger.error(f"Fallback LLM ({self.fallback_provider}) failed: {fallback_error}")

            # 3. Graceful degradation: offline context-aware synthesis
            logger.info("Using built-in resilient response synthesizer.")
            self.last_active_provider = "mock_fallback"
            return await self._mock_generate(messages, system_prompt, response_format)

    async def generate_stream(
        self,
        messages: List[Dict[str, str]],
        system_prompt: Optional[str] = None,
    ) -> AsyncGenerator[str, None]:
        """Streams text chunks from the provider with graceful fallback to simulated typewriter."""
        if self.provider in ["groq", "openai"]:
            url = self._get_chat_url(self.provider)
            headers = {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}
            full_msgs = []
            if system_prompt:
                full_msgs.append({"role": "system", "content": system_prompt})
            full_msgs.extend(messages)
            payload = {
                "model": self.model,
                "messages": full_msgs,
                "temperature": self.temperature,
                "stream": True,
            }

            try:
                async with httpx.AsyncClient(timeout=settings.REQUEST_TIMEOUT_SECONDS) as client:
                    async with client.stream("POST", url, headers=headers, json=payload) as response:
                        if response.status_code == 200:
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
                            return
            except Exception as e:
                logger.warning(f"Streaming failed on {self.provider}: {e}")

        # Simulated fluid delta streaming for mock / custom_openai / fallback
        full_text = await self.generate(messages, system_prompt)
        words = full_text.split(" ")
        for i in range(0, len(words), 3):
            chunk = " ".join(words[i : i + 3]) + " "
            yield chunk

    def _get_chat_url(self, provider_type: str, use_fallback: bool = False) -> str:
        if use_fallback:
            if self.fallback_provider == "groq":
                return "https://api.groq.com/openai/v1/chat/completions"
            elif self.fallback_provider == "openai":
                return "https://api.openai.com/v1/chat/completions"

        if provider_type == "groq":
            return "https://api.groq.com/openai/v1/chat/completions"
        elif provider_type == "custom_openai":
            base = (self.model_base_url or "http://localhost:8000").rstrip("/")
            if base.endswith("/v1"):
                return f"{base}/chat/completions"
            return f"{base}/v1/chat/completions"
        return "https://api.openai.com/v1/chat/completions"

    def _get_api_key(self, provider_type: str, use_fallback: bool = False) -> str:
        if use_fallback:
            return self.fallback_api_key or ""
        if provider_type == "custom_openai":
            return self.custom_api_key or ""
        return self.api_key or ""

    def _get_model(self, provider_type: str, use_fallback: bool = False) -> str:
        if use_fallback:
            return self.fallback_model or "llama-3.1-8b-instant"
        if provider_type == "custom_openai":
            return self.custom_model_name or "qwen2.5-7b-instruct"
        return self.model or "gpt-4o-mini"

    async def _openai_compatible_generate(
        self,
        messages: List[Dict[str, str]],
        system_prompt: Optional[str] = None,
        response_format: Optional[str] = None,
        provider_type: str = "openai",
        use_fallback: bool = False
    ) -> str:
        url = self._get_chat_url(provider_type, use_fallback)
        api_key = self._get_api_key(provider_type, use_fallback)
        model_name = self._get_model(provider_type, use_fallback)
        timeout = self.fallback_timeout if use_fallback else (self.custom_timeout if provider_type == "custom_openai" else settings.REQUEST_TIMEOUT_SECONDS)

        full_msgs = []
        if system_prompt:
            full_msgs.append({"role": "system", "content": system_prompt})
        full_msgs.extend(messages)

        payload: Dict[str, Any] = {
            "model": model_name,
            "messages": full_msgs,
            "temperature": self.temperature,
        }
        if response_format == "json":
            payload["response_format"] = {"type": "json_object"}

        headers = {"Content-Type": "application/json"}
        if api_key:
            headers["Authorization"] = f"Bearer {api_key}"

        async with httpx.AsyncClient(timeout=timeout) as client:
            res = await client.post(url, headers=headers, json=payload)
            if res.status_code == 200:
                data = res.json()
                return data["choices"][0]["message"]["content"]
            else:
                logger.error(f"LLM Error ({provider_type}): {res.status_code} - {res.text}")
                raise LLMError(f"Provider {provider_type} returned status {res.status_code}")

    async def _gemini_generate(
        self,
        messages: List[Dict[str, str]],
        system_prompt: Optional[str] = None,
        use_fallback: bool = False
    ) -> str:
        key = self.fallback_api_key if use_fallback else self.api_key
        model = self.fallback_model if use_fallback else self.model
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}"

        contents = []
        for m in messages:
            role = "user" if m["role"] == "user" else "model"
            contents.append({"role": role, "parts": [{"text": m["content"]}]})

        body: Dict[str, Any] = {"contents": contents}
        if system_prompt:
            body["systemInstruction"] = {"parts": [{"text": system_prompt}]}

        timeout = self.fallback_timeout if use_fallback else settings.REQUEST_TIMEOUT_SECONDS
        async with httpx.AsyncClient(timeout=timeout) as client:
            res = await client.post(url, json=body)
            if res.status_code == 200:
                data = res.json()
                return data["candidates"][0]["content"]["parts"][0]["text"]
            raise LLMError(f"Gemini API returned status {res.status_code}")

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

        if any(w in last_user_msg for w in ["hi", "hello", "hey", "namaste", "morning", "evening"]):
            return (
                "Hello! Welcome to Nova. I am your 24/7 personal shopping assistant.\n\n"
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

        return (
            f"Regarding your query about '{last_user_msg}': "
            "At Nova, we focus on timeless everyday movement wear and effortless shopping. "
            "You can ask me to search specific colors and styles, check your order status, or explore our store policies!"
        )


llm_service = LLMService()
