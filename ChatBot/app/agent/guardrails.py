import re
import time
from typing import Dict, Any, List, Optional
from collections import defaultdict
from app.core.constants import PermissionLevel
from app.core.exceptions import (
    AuthorizationError,
    AuthenticationError,
    RateLimitError,
    ConfirmationRequiredError,
    ValidationError
)
from app.core.security import AuthenticationContext
from app.core.config import settings
from app.tools import registry


class Guardrails:
    """Deterministic security guardrails protecting system boundaries."""

    # Prompt injection patterns
    INJECTION_PATTERNS = [
        r"ignore\s+(all\s+)?(previous|prior)\s+instructions",
        r"system\s*prompt",
        r"show\s+me\s+your\s+rules",
        r"delete\s+the\s+database",
        r"drop\s+table",
        r"select\s+\*\s+from",
        r"execute\s+sql",
        r"make\s+me\s+admin",
        r"pretend\s+you\s+are",
        r"reveal\s+secret",
    ]
    INJECTION_REGEX = re.compile("|".join(INJECTION_PATTERNS), re.IGNORECASE)

    def __init__(self):
        # In-memory sliding window rate limiter
        self._request_timestamps = defaultdict(list)

    def check_rate_limit(self, identifier: str):
        """Enforces sliding-window rate limiting."""
        now = time.time()
        window = 60.0
        timestamps = self._request_timestamps[identifier]

        # Prune older timestamps
        self._request_timestamps[identifier] = [t for t in timestamps if now - t < window]

        if len(self._request_timestamps[identifier]) >= settings.RATE_LIMIT_PER_MINUTE:
            raise RateLimitError("Rate limit exceeded. Please wait a moment before sending another message.")

        self._request_timestamps[identifier].append(now)

    def inspect_prompt_injection(self, text: str):
        """Detects prompt injection attempts."""
        if self.INJECTION_REGEX.search(text):
            raise AuthorizationError("Your request contains disallowed instructions and cannot be processed.")

    def validate_tool_permission(
        self,
        tool_name: str,
        auth_context: AuthenticationContext
    ):
        """Enforces deterministic permission tiers outside the LLM."""
        definition = registry.get_definition(tool_name)
        if not definition:
            raise ValidationError(f"Tool '{tool_name}' is not registered.")

        # Authentication check
        if definition.requires_auth and not auth_context.authenticated:
            raise AuthenticationError(f"Please sign in to perform this action.")

        # Permission level checks
        if definition.permission_level == PermissionLevel.ADMIN_ONLY and not auth_context.is_admin:
            raise AuthorizationError("Administrative privilege required.")

    def validate_confirmation(
        self,
        tool_name: str,
        has_user_confirmed: Optional[bool],
        pending_action: Optional[Dict[str, Any]]
    ):
        """Ensures destructive actions have verified confirmation."""
        definition = registry.get_definition(tool_name)
        if definition and definition.requires_confirmation:
            if not has_user_confirmed:
                raise ConfirmationRequiredError("This operation requires explicit confirmation.")
            if not pending_action:
                raise ValidationError("No pending action found to confirm.")

    def sanitize_output(self, text: str) -> str:
        """Strips accidental leakage of system instructions or credentials."""
        # Redact raw API keys or passwords if detected
        sanitized = re.sub(r"ai-agent-[a-zA-Z0-9_-]+", "[REDACTED_KEY]", text)
        sanitized = re.sub(r"eyJ[a-zA-Z0-9_\-\.]+", "[REDACTED_JWT]", sanitized)
        return sanitized


guardrails = Guardrails()
