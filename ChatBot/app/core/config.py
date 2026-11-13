"""
Application configuration loaded from environment variables.

Required in production
----------------------
  AI_SERVICE_API_KEY   — shared secret between this service and Spring Boot.
                         Must be at least 32 characters. No default in production.
  JWT_SECRET           — HS256 signing key shared with Spring Boot.
                         Required only when JWT_VERIFICATION_MODE=local (default).
  DATABASE_URL         — PostgreSQL async URL for conversation persistence.

Optional / have safe defaults
------------------------------
  AI_PROVIDER          — LLM provider: mock | openai | groq | gemini | custom_openai
  MODEL_BASE_URL       — Custom OpenAI-compatible endpoint (e.g. Colab + llama.cpp)
  MODEL_API_KEY        — API key for the above custom endpoint
  MODEL_NAME           — Model name sent to the custom endpoint
  MODEL_TIMEOUT_SECONDS— Per-request timeout for the custom model endpoint
  FALLBACK_PROVIDER    — Provider to use when primary fails: groq | openai | gemini
  FALLBACK_API_KEY     — API key for the fallback provider
  FALLBACK_MODEL       — Model name for the fallback provider
"""

import os
import sys
from typing import List, Optional
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # --- Application ---
    AI_AGENT_ENV: str = Field(default="development")
    LOG_LEVEL: str = Field(default="INFO")
    HOST: str = Field(default="0.0.0.0")
    PORT: int = Field(default=8001)

    # --- CORS ---
    CORS_ORIGINS: str = Field(default="http://localhost:5173,http://localhost:3000")

    # --- Primary LLM Provider ---
    # Supported: mock | openai | groq | gemini | custom_openai
    # Use "custom_openai" for a self-hosted llama.cpp / vLLM server on Colab.
    AI_PROVIDER: str = Field(default="mock")
    AI_API_KEY: str = Field(default="")
    AI_MODEL: str = Field(default="gpt-4o-mini")
    AI_TEMPERATURE: float = Field(default=0.2)

    # --- Custom / Self-hosted Model Endpoint (Colab + llama.cpp) ---
    # Set AI_PROVIDER=custom_openai and configure these.
    MODEL_BASE_URL: Optional[str] = Field(default=None)
    MODEL_API_KEY: Optional[str] = Field(default=None)
    MODEL_NAME: Optional[str] = Field(default="qwen2.5-7b-instruct")
    MODEL_TIMEOUT_SECONDS: int = Field(default=60)

    # --- Fallback Provider (used when primary is unavailable) ---
    # Leave blank to disable fallback and return a friendly unavailable message.
    # IMPORTANT: Enabling fallback sends customer messages to a third-party
    # provider. Ensure your privacy policy covers this. Never enable silently.
    FALLBACK_PROVIDER: Optional[str] = Field(default=None)   # groq | openai | gemini
    FALLBACK_API_KEY: Optional[str] = Field(default=None)
    FALLBACK_MODEL: Optional[str] = Field(default=None)
    FALLBACK_TIMEOUT_SECONDS: int = Field(default=30)

    # --- Embeddings & RAG ---
    EMBEDDING_PROVIDER: str = Field(default="mock")
    EMBEDDING_MODEL: str = Field(default="text-embedding-3-small")
    RAG_TOP_K: int = Field(default=5)
    RAG_CHUNK_SIZE: int = Field(default=800)
    RAG_CHUNK_OVERLAP: int = Field(default=100)

    # --- Spring Boot Commerce Backend ---
    SPRING_BOOT_BASE_URL: str = Field(default="http://localhost:8080")
    # This secret must match AI_SERVICE_API_KEY in the Spring Boot environment.
    # In production: generate with `python -c "import secrets; print(secrets.token_hex(32))"`
    # and set in both services. Never commit the actual value to source control.
    AI_SERVICE_API_KEY: str = Field(default="")

    # --- JWT Verification ---
    # "local"    — verify JWT signature here using JWT_SECRET (requires sharing the secret).
    # "delegate" — call Spring Boot /api/auth/me to verify (no secret sharing needed).
    JWT_VERIFICATION_MODE: str = Field(default="local")
    # Required when JWT_VERIFICATION_MODE=local. Must match jwt.secret in Spring Boot.
    JWT_SECRET: Optional[str] = Field(default=None)

    # --- Database ---
    # Development: file-based SQLite (data persists between restarts)
    # Production: use asyncpg PostgreSQL URL
    #   postgresql+asyncpg://user:password@host:5432/ai_agent_db
    DATABASE_URL: str = Field(default="sqlite+aiosqlite:///./ai_agent.db")

    # --- Safety Limits ---
    MAX_AGENT_STEPS: int = Field(default=10)
    MAX_TOOL_CALLS: int = Field(default=8)
    MAX_RETRIES: int = Field(default=2)
    REQUEST_TIMEOUT_SECONDS: int = Field(default=30)
    RATE_LIMIT_PER_MINUTE: int = Field(default=30)
    MAX_MESSAGE_LENGTH: int = Field(default=2000)   # characters per user message
    MAX_CONTEXT_MESSAGES: int = Field(default=20)   # messages loaded into context window
    ENABLE_ORDER_CANCEL_AGENT: bool = Field(default=True)
    ENABLE_HUMAN_HANDOFF: bool = Field(default=True)

    @property
    def cors_origin_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    @property
    def is_production(self) -> bool:
        return self.AI_AGENT_ENV.lower() in ("production", "prod")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()

# ---------------------------------------------------------------------------
# Startup security assertions
# ---------------------------------------------------------------------------

def _validate_settings() -> None:
    """
    Validates required settings at import time.
    Raises SystemExit in production with helpful error messages.
    Logs warnings in development.
    """
    errors: List[str] = []
    warnings: List[str] = []

    # --- AI_SERVICE_API_KEY ---
    if not settings.AI_SERVICE_API_KEY:
        msg = (
            "AI_SERVICE_API_KEY is not set. "
            "Spring Boot will reject all service-to-service requests from this agent."
        )
        (errors if settings.is_production else warnings).append(msg)
    elif len(settings.AI_SERVICE_API_KEY) < 32:
        msg = "AI_SERVICE_API_KEY is shorter than 32 characters. Use a stronger secret in production."
        warnings.append(msg)

    # --- JWT_SECRET (only required for local verification) ---
    if settings.JWT_VERIFICATION_MODE == "local" and not settings.JWT_SECRET:
        msg = (
            "JWT_SECRET is not set but JWT_VERIFICATION_MODE=local. "
            "Customer JWTs cannot be verified. "
            "Either set JWT_SECRET or switch to JWT_VERIFICATION_MODE=delegate."
        )
        (errors if settings.is_production else warnings).append(msg)

    # --- In-memory database in production ---
    if ":memory:" in settings.DATABASE_URL and settings.is_production:
        errors.append(
            "DATABASE_URL points to an in-memory SQLite database in production. "
            "All conversation history will be lost on every restart. "
            "Set DATABASE_URL to a persistent PostgreSQL connection string."
        )
    elif ":memory:" in settings.DATABASE_URL:
        warnings.append(
            "DATABASE_URL is in-memory SQLite. Conversation history will not persist across restarts. "
            "This is acceptable for development but not for production."
        )

    # --- Fallback provider consent ---
    if settings.FALLBACK_PROVIDER and not settings.FALLBACK_API_KEY:
        warnings.append(
            f"FALLBACK_PROVIDER={settings.FALLBACK_PROVIDER} is set but FALLBACK_API_KEY is empty. "
            "Fallback will be disabled until a key is provided."
        )

    import logging
    _log = logging.getLogger(__name__)

    for w in warnings:
        _log.warning("[CONFIG WARNING] %s", w)

    if errors:
        for e in errors:
            _log.error("[CONFIG ERROR] %s", e)
        sys.exit(
            f"[FATAL] {len(errors)} configuration error(s) prevent safe startup in production. "
            "See error messages above."
        )


_validate_settings()
