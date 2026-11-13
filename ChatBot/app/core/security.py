"""
Authentication context extraction and JWT verification.

Security model
--------------
Customer JWTs are issued and signed by Spring Boot using HS256.

The Python agent verifies the signature here using the shared JWT_SECRET
environment variable. This ensures that an attacker cannot craft a forged
token claiming arbitrary customer_id or roles.

TWO options are supported — configure JWT_VERIFICATION_MODE:

  "local"    (default) — verify signature locally using JWT_SECRET.
             Faster. Requires JWT_SECRET to be kept in sync with Spring Boot.

  "delegate" — call GET /api/auth/me on Spring Boot with the raw Bearer token.
             Slower (one extra HTTP call per request) but zero secret sharing.
             If Spring Boot rejects the token, the agent treats the user as guest.

Guest access
------------
Requests without an Authorization header result in an unauthenticated
AuthenticationContext (authenticated=False). Most read-only flows are
still served. Mutation tools will reject unauthenticated callers.
"""

import os
import jwt
import httpx
from typing import Optional, List
from pydantic import BaseModel
from fastapi import Request, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.config import settings
from app.core.logging import logger

security_bearer = HTTPBearer(auto_error=False)


class AuthenticationContext(BaseModel):
    customer_id: Optional[str] = None
    email: Optional[str] = None
    name: Optional[str] = None
    roles: List[str] = []
    authenticated: bool = False
    # raw_token is kept for forwarding to Spring Boot via X-User-Bearer.
    # It must NEVER be returned to the browser or logged.
    raw_token: Optional[str] = None

    @property
    def is_customer(self) -> bool:
        return self.authenticated and (
            "CUSTOMER" in self.roles or "USER" in self.roles or len(self.roles) == 0
        )

    @property
    def is_admin(self) -> bool:
        return self.authenticated and "ADMIN" in self.roles


def _extract_token(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials],
) -> Optional[str]:
    """Returns the raw Bearer token string, or None if absent."""
    if credentials:
        return credentials.credentials
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        return auth_header.split(" ", 1)[1]
    return None


def _verify_local(token: str) -> AuthenticationContext:
    """Verifies JWT signature locally using JWT_SECRET (HS256)."""
    secret = settings.JWT_SECRET
    if not secret:
        raise ValueError("JWT_SECRET is not configured; cannot verify token locally.")
    try:
        payload = jwt.decode(
            token,
            secret,
            algorithms=["HS256"],
            options={"verify_exp": True},
        )
    except jwt.ExpiredSignatureError:
        logger.debug("JWT rejected: expired.")
        return AuthenticationContext(authenticated=False)
    except jwt.InvalidTokenError as e:
        logger.debug("JWT rejected: %s", e)
        return AuthenticationContext(authenticated=False)

    customer_id = str(
        payload.get("sub") or payload.get("userId") or payload.get("id") or ""
    )
    email = payload.get("email")
    name = payload.get("name")
    role = payload.get("role") or payload.get("roles") or ["CUSTOMER"]
    roles = [role] if isinstance(role, str) else list(role)

    return AuthenticationContext(
        customer_id=customer_id if customer_id else None,
        email=email,
        name=name,
        roles=roles,
        authenticated=bool(customer_id),
        raw_token=token,
    )


async def _verify_delegate(token: str) -> AuthenticationContext:
    """
    Verifies identity by calling Spring Boot /api/auth/me.

    Spring Boot performs the cryptographic check; we trust its response.
    This path avoids sharing JWT_SECRET with the Python service.
    """
    url = f"{settings.SPRING_BOOT_BASE_URL}/api/auth/me"
    headers = {
        "Authorization": f"Bearer {token}",
        "X-AI-Service-Key": settings.AI_SERVICE_API_KEY,
    }
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(url, headers=headers)
            if resp.status_code == 200:
                data = resp.json().get("data") or resp.json()
                customer_id = str(data.get("id") or data.get("userId") or "")
                email = data.get("email")
                name = data.get("name") or data.get("fullName")
                roles_raw = data.get("roles") or data.get("role") or ["CUSTOMER"]
                roles = [roles_raw] if isinstance(roles_raw, str) else list(roles_raw)
                return AuthenticationContext(
                    customer_id=customer_id if customer_id else None,
                    email=email,
                    name=name,
                    roles=roles,
                    authenticated=bool(customer_id),
                    raw_token=token,
                )
    except Exception as e:
        logger.warning("Failed to delegate JWT verification to Spring Boot: %s", e)
    return AuthenticationContext(authenticated=False)


async def extract_auth_context(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
) -> AuthenticationContext:
    """
    FastAPI dependency: extracts and verifies the customer's JWT.

    Returns an AuthenticationContext. Never raises for missing/invalid tokens —
    those result in an unauthenticated context. Tool-level guardrails enforce
    authentication requirements per operation.
    """
    token = _extract_token(request, credentials)
    if not token:
        return AuthenticationContext(authenticated=False)

    mode = getattr(settings, "JWT_VERIFICATION_MODE", "local").lower()

    try:
        if mode == "delegate":
            return await _verify_delegate(token)
        else:
            return _verify_local(token)
    except Exception as e:
        logger.error("Unexpected error during JWT verification: %s", e)
        return AuthenticationContext(authenticated=False)
