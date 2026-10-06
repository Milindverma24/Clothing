import math
from typing import List
from app.core.config import settings
from app.core.logging import logger


class EmbeddingService:
    """Generates vector embeddings for RAG retrieval."""

    def __init__(self):
        self.provider = settings.EMBEDDING_PROVIDER
        self.model = settings.EMBEDDING_MODEL

    async def get_embedding(self, text: str) -> List[float]:
        """Generates embedding vector (normalized 128-dim for mock, or provider API)."""
        if self.provider == "mock" or not settings.AI_API_KEY or settings.AI_API_KEY == "mock-key":
            # Deterministic, normalized pseudo-embedding based on hash
            vec = [0.0] * 64
            for i, char in enumerate(text[:256]):
                idx = (ord(char) + i) % 64
                vec[idx] += 1.0
            norm = math.sqrt(sum(x * x for x in vec)) or 1.0
            return [x / norm for x in vec]

        # In production with OpenAI/etc:
        try:
            import httpx
            async with httpx.AsyncClient(timeout=10) as client:
                res = await client.post(
                    "https://api.openai.com/v1/embeddings",
                    headers={"Authorization": f"Bearer {settings.AI_API_KEY}"},
                    json={"model": self.model, "input": text}
                )
                if res.status_code == 200:
                    return res.json()["data"][0]["embedding"]
        except Exception as e:
            logger.error(f"Error fetching embedding from provider: {e}")

        # Fallback
        return [0.0] * 64


embedding_service = EmbeddingService()
