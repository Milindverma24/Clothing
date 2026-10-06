import logging
import json
import re
from datetime import datetime, timezone
from typing import Any, Dict
from app.core.config import settings

# Sensitive keys to redact
SENSITIVE_PATTERNS = [
    r"password",
    r"token",
    r"api[_-]?key",
    r"secret",
    r"cvv",
    r"credit[_-]?card",
    r"card[_-]?number",
    r"authorization",
]
SENSITIVE_REGEX = re.compile("|".join(SENSITIVE_PATTERNS), re.IGNORECASE)


def redact_sensitive_data(data: Any) -> Any:
    """Recursively redacts sensitive keys and values from dicts/lists."""
    if isinstance(data, dict):
        redacted = {}
        for k, v in data.items():
            if SENSITIVE_REGEX.search(str(k)):
                redacted[k] = "[REDACTED]"
            else:
                redacted[k] = redact_sensitive_data(v)
        return redacted
    elif isinstance(data, list):
        return [redact_sensitive_data(item) for item in data]
    return data


class JSONFormatter(logging.Formatter):
    """Formats log records as structured JSON."""
    def format(self, record: logging.LogRecord) -> str:
        log_obj: Dict[str, Any] = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }

        # Include structured extras if present
        if hasattr(record, "structured_data") and isinstance(record.structured_data, dict):
            log_obj.update(redact_sensitive_data(record.structured_data))

        if record.exc_info:
            log_obj["exception"] = self.formatException(record.exc_info)

        return json.dumps(log_obj)


def setup_logger(name: str = "ai_agent") -> logging.Logger:
    logger = logging.getLogger(name)
    logger.setLevel(getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO))
    
    # Avoid duplicate handlers
    if not logger.handlers:
        handler = logging.StreamHandler()
        handler.setFormatter(JSONFormatter())
        logger.addHandler(handler)
        logger.propagate = False

    return logger


logger = setup_logger()
