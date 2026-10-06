import re
from typing import Dict, Any, Tuple, Optional
from app.core.constants import IntentType
from app.schemas.agent import IntentDetectionResult


class IntentDetector:
    """Robust natural-language intent detector with attribute & price extraction."""

    # Colors recognized in clothing store
    COLORS = ["black", "navy blue", "blue", "white", "red", "grey", "gray", "green", "brown", "olive", "purple", "pink", "yellow", "orange", "beige"]

    # Categories & Article Types
    CATEGORIES = {
        "shirt": ["shirt", "shirts", "shrt", "casual shirt", "formal shirt", "oxford"],
        "tshirt": ["tshirt", "t-shirt", "t-shirts", "tshirts", "tee", "tees", "tshrt", "polo"],
        "sandals": ["sandal", "sandals", "sandel", "floaters"],
        "flip flops": ["flip flop", "flip flops", "flipflop", "slippers", "slides"],
        "shoes": ["shoes", "shoe", "formal shoes", "sneakers", "footwear"],
        "sweatshirt": ["sweatshirt", "sweatshirts", "hoodie", "hoodies", "sweater", "fleece"],
        "trousers": ["trouser", "trousers", "pants", "pant", "jeans", "denim", "chinos", "cargos"]
    }

    # Apparel Keywords
    APPAREL_KEYWORDS = [
        "shirt", "shirts", "tshirt", "tshirts", "tee", "tees", "hoodie", "hoodies", "sweatshirt",
        "shoes", "sneakers", "sandals", "slippers", "flip flops", "jeans", "pants", "trousers",
        "outfit", "wear", "clothes", "clothing", "apparel", "dress", "jacket", "casual", "formal"
    ]

    def detect(self, message: str) -> IntentDetectionResult:
        text = message.lower().strip()
        entities: Dict[str, Any] = {}

        # 1. Price extraction (under 1500, below 2k, etc.)
        max_price = self._extract_price(text)
        if max_price:
            entities["max_price"] = max_price

        # 2. Color extraction
        for color in self.COLORS:
            if re.search(rf"\b{re.escape(color)}\b", text):
                entities["color"] = color.capitalize()
                break

        # 3. Category extraction
        for cat_name, variants in self.CATEGORIES.items():
            for v in variants:
                if re.search(rf"\b{re.escape(v)}\b", text):
                    entities["category"] = cat_name
                    break
            if "category" in entities:
                break

        # 4. Order & Product ID extraction
        action_prefix_match = re.search(r"^(?:SHOW_ORDER|CANCEL|RETURN|TRACK)[_:\s]+(ORD-[A-Z0-9]+|\d+)", message, re.IGNORECASE)
        if action_prefix_match:
            ref = action_prefix_match.group(1)
            if ref.upper().startswith("ORD-"):
                entities["order_number"] = ref.upper()
            else:
                entities["order_id"] = int(ref)

        order_match = re.search(r"(?:order\s*#?|#\s*|return\s+(?:order\s*)?|track\s+(?:order\s*)?|cancel\s+(?:order\s*)?|show\s+(?:order\s*)?|view\s+(?:order\s*)?)(\d{1,8})", text)
        if order_match and not re.search(r"(?:product|item|piece)\s*(?:#|id)?\s*\d+", text):
            entities["order_id"] = int(order_match.group(1))

        prod_match = re.search(r"(?:product|item|piece)\s*(?:#|id|no\.?)?\s*(\d{1,8})", text)
        if prod_match:
            entities["product_id"] = int(prod_match.group(1))

        # 5. Size extraction (S, M, L, XL, etc.)
        size_match = re.search(r"\b(?:size\s*[:=]?\s*|in\s+size\s+)?(xs|s|m|l|xl|xxl)\b", text)
        if size_match and ("size" in text or "in size" in text or any(k in text for k in ["order", "buy", "product", "shirt", "pant", "hoodie"])):
            entities["size"] = size_match.group(1).upper()

        # 6. Logistics tracking number & Order Number
        trk_match = re.search(r"(?:^|[^a-zA-Z0-9])(TRK-[A-Z0-9]+)\b", message, re.IGNORECASE)
        if trk_match:
            entities["tracking_number"] = trk_match.group(1).upper()

        ord_num_match = re.search(r"(?:^|[^a-zA-Z0-9])(ORD-[A-Z0-9]+)\b", message, re.IGNORECASE)
        if ord_num_match:
            entities["order_number"] = ord_num_match.group(1).upper()

        # 7. UPI ID extraction
        upi_match = re.search(r"\b([a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64})\b", text)
        if upi_match:
            entities["upi_id"] = upi_match.group(1)

        # 8. Size flow entity extraction
        if "men / boys" in text or "men" in text or "man" in text:
            entities["size_gender"] = "MEN"
        elif "women / girls" in text or "women" in text or "woman" in text:
            entities["size_gender"] = "WOMEN"
        elif "boy" in text:
            entities["size_gender"] = "BOYS"
            entities["size_audience"] = "KIDS"
        elif "girl" in text:
            entities["size_gender"] = "GIRLS"
            entities["size_audience"] = "KIDS"

        if "kid" in text or "child" in text:
            entities["size_audience"] = "KIDS"
            if entities.get("size_gender") == "MEN":
                entities["size_gender"] = "BOYS"
            elif entities.get("size_gender") == "WOMEN":
                entities["size_gender"] = "GIRLS"
        elif "adult" in text or "grown" in text:
            entities["size_audience"] = "ADULT"
            if entities.get("size_gender") == "BOYS":
                entities["size_gender"] = "MEN"
            elif entities.get("size_gender") == "GIRLS":
                entities["size_gender"] = "WOMEN"

        if re.search(r"\b(?:shirt|shirts|t-shirt|tshirt|tee|tees|top|tops|polo)\b", text):
            entities["size_category"] = "SHIRT"
        elif re.search(r"\b(?:trouser|trousers|pant|pants|jean|jeans|bottom|chinos)\b", text):
            entities["size_category"] = "TROUSER"
        elif re.search(r"\b(?:dress|dresses)\b", text):
            entities["size_category"] = "DRESS"

        if re.search(r"\b(?:cm|centimeter|centimeters)\b", text):
            entities["unit"] = "CM"
        elif re.search(r"\b(?:in|inch|inches|\")\b", text):
            entities["unit"] = "IN"

        if re.search(r"\b(?:find my size|check size|what size am i)\b", text):
            entities["find_my_size"] = True

        # Explicit measurement extractions (e.g. chest 39, waist 32, bust 36, etc.)
        meas: Dict[str, float] = {}
        chest_m = re.search(r"\b(?:chest|bust)\s*(?:is|:|=)?\s*(\d+(?:\.\d+)?)\b", text)
        if chest_m:
            meas["chest"] = float(chest_m.group(1))
            meas["bust"] = float(chest_m.group(1))
        waist_m = re.search(r"\bwaist\s*(?:is|:|=)?\s*(\d+(?:\.\d+)?)\b", text)
        if waist_m:
            meas["waist"] = float(waist_m.group(1))
        hip_m = re.search(r"\bhip\s*(?:is|:|=)?\s*(\d+(?:\.\d+)?)\b", text)
        if hip_m:
            meas["hip"] = float(hip_m.group(1))
        shoulder_m = re.search(r"\bshoulder\s*(?:is|:|=)?\s*(\d+(?:\.\d+)?)\b", text)
        if shoulder_m:
            meas["shoulder"] = float(shoulder_m.group(1))

        # Bare numbers with unit (e.g., 39 inches, 39 in, 99 cm)
        bare_m = re.search(r"\b(\d{2,3}(?:\.\d+)?)\s*(?:inches|inch|in|\"|cm)\b", text)
        if bare_m and not meas:
            val = float(bare_m.group(1))
            meas["chest"] = val
            meas["bust"] = val
            meas["waist"] = val

        if meas:
            entities["measurements"] = meas

        # Selected size click / mentions (e.g. "Select M", "Size M selected")
        select_sz_m = re.search(r"\b(?:select|choose|picked|selected)\s+(?:size\s+)?([xXsSmMlL]{1,3})\b", text) or re.search(r"\bsize\s+([xXsSmMlL]{1,3})\s+(?:selected|chosen|picked)\b", text)
        if select_sz_m:
            entities["selected_size"] = select_sz_m.group(1).upper()

        # 9. Intent Classification Rules (ordered by specificity)

        # Greetings & Salutations (pure greetings without product search)
        if re.search(r"^(hi|hello|hey|heyy|heya|namaste|good morning|good afternoon|good evening|yo|sup|what's up|how are you|howdy)[\s!.,?]*$", text):
            return IntentDetectionResult(intent=IntentType.GREETING, confidence=0.99, entities=entities)

        # Gratitude & Goodbyes
        if re.search(r"\b(thank you|thanks|thx|thank u|dhanyawad|bye|goodbye|see you|have a nice day|ok thanks|okay thanks)\b", text):
            return IntentDetectionResult(intent=IntentType.GRATITUDE, confidence=0.98, entities=entities)

        # Identity & Capabilities ("Who are you", "What can you do", "Help")
        if any(p in text for p in ["who are you", "what can you do", "how can you help", "what are your features", "what do you do"]) or text in ["help", "help me", "need help"]:
            return IntentDetectionResult(intent=IntentType.GENERAL_QUESTION, confidence=0.96, entities=entities)

        # Human Support Escalation
        if any(p in text for p in ["talk to human", "speak to human", "human support", "customer care", "talk to a person", "agent", "executive", "representative", "real person"]):
            return IntentDetectionResult(intent=IntentType.HUMAN_SUPPORT, confidence=0.98, entities=entities)

        # Show Order / View Order explicitly
        if re.search(r"^(?:show_order|view_order)", text) or any(p in text for p in ["show order", "show my order", "view order", "view my order", "order detail", "order details"]):
            return IntentDetectionResult(intent=IntentType.ORDER_STATUS, confidence=0.98, entities=entities)

        # Order Cancellation
        if re.search(r"^cancel_", text) or any(p in text for p in ["cancel my order", "cancel order", "cancellation", "order cancel karna", "abort order", "cancel that"]):
            return IntentDetectionResult(intent=IntentType.ORDER_CANCEL, confidence=0.96, entities=entities)

        # Return & Refund Policy (RAG)
        if any(p in text for p in ["return policy", "refund policy", "how to return", "exchange policy", "money back", "return window"]):
            return IntentDetectionResult(intent=IntentType.RETURN_POLICY, confidence=0.96, entities=entities)

        # Actionable Returns & Refunds
        if re.search(r"^return_", text) or re.search(r"\b(return|returns|refund|refunds|exchange|send back|wapas)\b", text):
            return IntentDetectionResult(intent=IntentType.ORDER_RETURN_REFUND, confidence=0.96, entities=entities)

        # Order Status & Tracking
        if re.search(r"^track_", text) or "tracking_number" in entities or any(p in text for p in ["where is my order", "order status", "track my order", "track order", "track package", "mera order kaha hai", "latest order", "my orders", "show orders", "track trk-"]):
            if "track" in text or "package" in text or "tracking_number" in entities or re.search(r"^track_", text):
                return IntentDetectionResult(intent=IntentType.ORDER_TRACKING, confidence=0.96, entities=entities)
            elif "list" in text or "my orders" in text or "show orders" in text:
                return IntentDetectionResult(intent=IntentType.ORDER_LIST, confidence=0.94, entities=entities)
            return IntentDetectionResult(intent=IntentType.ORDER_STATUS, confidence=0.95, entities=entities)

        # In-Chat Direct Ordering
        is_order_intent = any(text.startswith(p) for p in ["order", "buy", "purchase", "place order", "i want to buy", "i want to order", "order product", "buy product"]) or ("product_id" in entities and any(k in text for k in ["order", "buy", "purchase", "get", "need"]))
        if is_order_intent and not any(k in text for k in ["cancel", "return", "refund", "where is", "track"]):
            return IntentDetectionResult(intent=IntentType.ORDER_CREATE, confidence=0.96, entities=entities)

        # Cart Operations
        if any(p in text for p in ["add to cart", "add to bag", "put in cart", "buy this", "add the first", "add this shirt"]):
            return IntentDetectionResult(intent=IntentType.CART_ADD, confidence=0.94, entities=entities)
        if any(p in text for p in ["show my cart", "view cart", "show cart", "my bag", "what is in my cart", "cart mein kya hai"]):
            return IntentDetectionResult(intent=IntentType.CART_VIEW, confidence=0.94, entities=entities)

        # Brand / Store Collection Info
        if any(p in text for p in ["what do you sell", "what products", "tell me about your store", "about brand", "what kind of clothes", "about your company", "collection", "catalog"]):
            return IntentDetectionResult(intent=IntentType.STORE_INFO, confidence=0.93, entities=entities)

        # Styling Advice & Outfit Recommendations
        if any(p in text for p in ["what should i wear", "outfit ideas", "how to style", "pair with", "recommend an outfit", "what goes with", "style advice", "suggest an outfit"]):
            return IntentDetectionResult(intent=IntentType.STYLING_ADVICE, confidence=0.92, entities=entities)

        # Size & Fit Guide (authoritative trigger matching)
        size_triggers = [
            "size guide", "size chart", "sizing", "fit guide", "how does it fit",
            "true to size", "measurements", "chest size", "what size", "choose a size",
            "choose my size", "find my size", "which size", "what is the size",
            "help me choose a size", "what size am i", "what size should i",
            "size recommendation", "my size", "check size", "switch to women",
            "switch to men", "switch_to_women", "switch_to_men", "view_size_chart"
        ]
        if "switch" in text:
            entities["switch_gender"] = True

        is_size_query = any(p in text for p in size_triggers) or (
            ("size" in text or "measure" in text) and any(w in text for w in ["buy", "get", "choose", "help", "show", "chart", "guide", "fit", "find", "am i", "should i"])
        ) or (
            text in ["men / boys", "women / girls", "men", "women", "boys", "girls", "adult", "kids", "shirt / t-shirt", "trousers / jeans", "tops / shirts", "dresses", "find my size", "switch to women / girls", "switch to men / boys"]
        ) or text.startswith("size_") or text.startswith("measure_") or text.startswith("select_size_") or text.startswith("switch_") or (
            "selected_size" in entities
        ) or (
            "measurements" in entities and any(w in text for w in ["chest", "waist", "bust", "hip", "inch", "inches", "cm"])
        )

        if is_size_query:
            return IntentDetectionResult(intent=IntentType.SIZE_GUIDE, confidence=0.98, entities=entities)

        # Payment Methods
        if any(p in text for p in ["payment method", "how to pay", "cod", "cash on delivery", "upi", "gpay", "phonepe", "paytm", "credit card", "debit card", "emi"]):
            return IntentDetectionResult(intent=IntentType.PAYMENT_QUESTION, confidence=0.93, entities=entities)

        # Shipping & Delivery
        if any(p in text for p in ["shipping policy", "shipping charges", "free delivery", "how long does delivery take", "delivery time", "shipping time", "days to deliver"]):
            return IntentDetectionResult(intent=IntentType.SHIPPING_QUESTION, confidence=0.93, entities=entities)

        # Product Search & Discovery (if apparel terms, color, price or specific query present)
        has_apparel_cue = any(k in text for k in self.APPAREL_KEYWORDS) or "color" in entities or "category" in entities or "max_price" in entities
        clean_query = self._build_search_query(text, entities)
        entities["query"] = clean_query

        if has_apparel_cue or any(c in text for c in ["show", "find", "search", "buy", "check", "need"]):
            return IntentDetectionResult(intent=IntentType.PRODUCT_SEARCH, confidence=0.90, entities=entities)

        # General Conversational Question
        return IntentDetectionResult(intent=IntentType.GENERAL_QUESTION, confidence=0.85, entities={"query": text})

    def _extract_price(self, text: str) -> Optional[float]:
        """Extracts max price from natural language queries."""
        match = re.search(r"(?:under|below|less\s+than|within|ke\s+andar)\s*(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)\s*(k)?\b", text)
        if match:
            val = float(match.group(1))
            if match.group(2) == "k":
                val *= 1000
            return val

        match_alt = re.search(r"(\d+(?:\.\d+)?)\s*(k)?\s*(?:ke\s+andar|tak)\b", text)
        if match_alt:
            val = float(match_alt.group(1))
            if match_alt.group(2) == "k":
                val *= 1000
            return val

        return None

    def _build_search_query(self, text: str, entities: Dict[str, Any]) -> str:
        """Strips filler words and generates search keywords."""
        query = text
        fillers = [
            "show me", "find me", "i need", "looking for", "can you show", "please show",
            "kuch", "dikhao", "mujhe", "chahiye", "under", "below", "under ₹", "₹", "rs"
        ]
        for f in fillers:
            query = re.sub(rf"\b{re.escape(f)}\b", "", query)

        # Remove price digits from query string
        if "max_price" in entities:
            query = re.sub(r"\b\d+\b", "", query)

        return " ".join(query.split()).strip() or text


intent_detector = IntentDetector()
