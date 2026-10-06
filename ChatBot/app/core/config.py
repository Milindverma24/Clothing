import os
from typing import List
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # App
    AI_AGENT_ENV: str = Field(default="development")
    LOG_LEVEL: str = Field(default="INFO")
    HOST: str = Field(default="0.0.0.0")
    PORT: int = Field(default=8001)

    # CORS
    CORS_ORIGINS: str = Field(default="http://localhost:5173,http://localhost:3000")

    # LLM
    AI_PROVIDER: str = Field(default="mock")  # mock, openai, gemini, groq, anthropic
    AI_API_KEY: str = Field(default="mock-key")
    AI_MODEL: str = Field(default="gpt-4o-mini")
    AI_TEMPERATURE: float = Field(default=0.2)

    # Embeddings & RAG
    EMBEDDING_PROVIDER: str = Field(default="mock")
    EMBEDDING_MODEL: str = Field(default="text-embedding-3-small")
    RAG_TOP_K: int = Field(default=5)
    RAG_CHUNK_SIZE: int = Field(default=800)
    RAG_CHUNK_OVERLAP: int = Field(default=100)

    # Spring Boot Commerce Backend
    SPRING_BOOT_BASE_URL: str = Field(default="http://localhost:8080")
    AI_SERVICE_API_KEY: str = Field(default="ai-agent-internal-secret-key")

    # Unified System Database (Conversations & audits synced to Spring Boot unified DB)
    DATABASE_URL: str = Field(default="sqlite+aiosqlite:///:memory:")

    # Safety limits & Guards
    MAX_AGENT_STEPS: int = Field(default=10)
    MAX_TOOL_CALLS: int = Field(default=8)
    MAX_RETRIES: int = Field(default=2)
    REQUEST_TIMEOUT_SECONDS: int = Field(default=30)
    RATE_LIMIT_PER_MINUTE: int = Field(default=30)
    ENABLE_ORDER_CANCEL_AGENT: bool = Field(default=True)
    ENABLE_HUMAN_HANDOFF: bool = Field(default=True)

    @property
    def cors_origin_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
