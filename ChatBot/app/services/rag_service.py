from typing import List, Dict, Any, Optional
from app.schemas.chat import SourceCitation
from app.core.logging import logger

# Authoritative pre-seeded store policies as required by AGENTS.md (Section 38)
DEFAULT_POLICY_DOCS = [
    {
        "title": "Returns & Refunds Policy",
        "document_name": "returns-refunds-exchanges.pdf",
        "page_number": 3,
        "keywords": ["return", "refund", "exchange", "money back", "return policy", "window"],
        "content": (
            "We offer a 7-day hassle-free return and exchange policy from the date of delivery. "
            "Items must be unused, unwashed, and in their original packaging with tags intact. "
            "Refunds are credited to the original payment method within 5–7 business days after warehouse inspection."
        )
    },
    {
        "title": "Shipping & Delivery Policy",
        "document_name": "shipping-delivery.pdf",
        "page_number": 1,
        "keywords": ["shipping", "delivery", "track", "courier", "charges", "timeline", "bhopal", "delhi", "mumbai"],
        "content": (
            "Standard shipping takes 3–5 business days across major metro cities, and 5–7 days for all other regions. "
            "Free standard shipping is automatically applied on all orders exceeding ₹999. "
            "Express next-day delivery is available in select tier-1 cities."
        )
    },
    {
        "title": "Order Cancellation Policy",
        "document_name": "orders.pdf",
        "page_number": 2,
        "keywords": ["cancel", "cancellation", "abort order", "stop delivery"],
        "content": (
            "Orders can be cancelled at any time while in 'PENDING', 'CONFIRMED', or 'PROCESSING' state before warehouse dispatch. "
            "Once an order is marked as 'SHIPPED', automated cancellation is no longer possible; customers may initiate a free return once delivered."
        )
    },
    {
        "title": "Size & Fit Guide",
        "document_name": "size-guide.pdf",
        "page_number": 4,
        "keywords": ["size", "fit", "small", "medium", "large", "chest", "waist", "measurements"],
        "content": (
            "Our tops and shirts follow standard regular fit unless designated as 'Boxy' or 'Oversized'. "
            "Size S corresponds to 38-inch chest, Size M to 40-inch chest, Size L to 42-inch chest, and Size XL to 44-inch chest. "
            "If between sizes, we recommend sizing up for casual apparel."
        )
    },
    {
        "title": "Payment Methods & Security",
        "document_name": "payments.pdf",
        "page_number": 1,
        "keywords": ["payment", "card", "upi", "cod", "cash on delivery", "net banking"],
        "content": (
            "We support all major payment options: UPI (Google Pay, PhonePe, Paytm), Credit & Debit cards (Visa, Mastercard, RuPay), "
            "Net Banking, and Cash on Delivery (COD) for eligible pin codes up to ₹5,000."
        )
    },
    {
        "title": "Customer Care & Human Escalation",
        "document_name": "customer-support.pdf",
        "page_number": 1,
        "keywords": ["human", "support", "agent", "executive", "representative", "contact", "email", "phone", "help"],
        "content": (
            "Our customer concierge team is available Monday to Saturday, 9:00 AM to 8:00 PM IST. "
            "You can contact us via email at support@nova.com or call +91 98112 34567. "
            "You can also ask to 'talk to a human' directly in this chat widget for instant escalation."
        )
    },
    {
        "title": "Brand & Store Catalog",
        "document_name": "about-brand.pdf",
        "page_number": 1,
        "keywords": ["brand", "store", "about", "what do you sell", "catalog", "clothing", "collection", "apparel"],
        "content": (
            "Nova is a modern apparel brand crafting minimalist, functional movement wear for everyday life. "
            "Our catalog features premium 100% combed cotton t-shirts, classic oxford and casual shirts, 380 GSM heavyweight boxy hoodies, "
            "relaxed trousers, and everyday comfort footwear for men and unisex wear."
        )
    },
    {
        "title": "Fabric & Garment Care",
        "document_name": "fabric-care.pdf",
        "page_number": 1,
        "keywords": ["fabric", "material", "wash", "care", "cotton", "iron", "shrink", "quality"],
        "content": (
            "Our garments use premium breathable long-staple cotton and pre-shrunk fleece fabrics. "
            "For longevity: Machine wash cold (below 30°C) with similar colors, turn inside out, and dry in shade. "
            "Do not iron directly over graphics or embroidery."
        )
    },
    {
        "title": "Coupons, Offers & Discounts",
        "document_name": "coupons-offers.pdf",
        "page_number": 1,
        "keywords": ["coupon", "discount", "offer", "promo", "voucher", "deal", "code", "welcome"],
        "content": (
            "New customers enjoy 10% off their first order with coupon code 'WELCOME10' at checkout. "
            "Free shipping is automatically applied on all orders exceeding ₹999 across India."
        )
    }
]


class RAGService:
    """Retrieval-Augmented Generation service for store documentation."""

    async def search_knowledge_base(self, query: str, top_k: int = 2) -> List[Dict[str, Any]]:
        """Searches grounded policy documents matching the user's inquiry."""
        q_lower = query.lower()
        scored_docs = []

        for doc in DEFAULT_POLICY_DOCS:
            score = 0
            # Keyword matching score
            for kw in doc["keywords"]:
                if kw in q_lower:
                    score += 3
            # Term overlap score
            for word in q_lower.split():
                if len(word) > 3 and word in doc["content"].lower():
                    score += 1

            if score > 0:
                scored_docs.append((score, doc))

        # Sort by relevance
        scored_docs.sort(key=lambda x: x[0], reverse=True)
        results = [item[1] for item in scored_docs[:top_k]]
        return results

    def extract_sources(self, docs: List[Dict[str, Any]]) -> List[SourceCitation]:
        """Converts retrieved doc chunks into structured citations for the UI."""
        citations = []
        for doc in docs:
            citations.append(SourceCitation(
                title=doc["title"],
                document_name=doc["document_name"],
                page_number=doc.get("page_number"),
                snippet=doc["content"][:160] + "..."
            ))
        return citations


rag_service = RAGService()
