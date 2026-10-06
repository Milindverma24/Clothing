import jwt
from typing import Optional, List
from pydantic import BaseModel
from fastapi import Request, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.config import settings

security_bearer = HTTPBearer(auto_error=False)


class AuthenticationContext(BaseModel):
    customer_id: Optional[str] = None
    email: Optional[str] = None
    name: Optional[str] = None
    roles: List[str] = []
    authenticated: bool = False
    raw_token: Optional[str] = None

    @property
    def is_customer(self) -> bool:
        return self.authenticated and ("CUSTOMER" in self.roles or len(self.roles) == 0 or "USER" in self.roles)

    @property
    def is_admin(self) -> bool:
        return self.authenticated and "ADMIN" in self.roles


def extract_auth_context(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer)
) -> AuthenticationContext:
    """
    Extracts customer identity from Bearer token or request headers.
    Does NOT trust body inputs for identity.
    """
    token = None
    if credentials:
        token = credentials.credentials
    else:
        # Check Authorization header manually if needed
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ", 1)[1]

    if not token:
        # Guest user context
        return AuthenticationContext(authenticated=False)

    try:
        # Decode without verification if signature key is managed solely by Spring Boot,
        # but inspect payload fields: sub, email, role, name, exp.
        # Spring Boot independently validates the token upon receiving requests!
        payload = jwt.decode(token, options={"verify_signature": False})
        customer_id = str(payload.get("sub") or payload.get("userId") or payload.get("id") or "")
        email = payload.get("email")
        name = payload.get("name")
        role = payload.get("role") or payload.get("roles") or ["CUSTOMER"]
        roles = [role] if isinstance(role, str) else list(role)

        return AuthenticationContext(
            customer_id=customer_id if customer_id else None,
            email=email,
            name=name,
            roles=roles,
            authenticated=True,
            raw_token=token
        )
    except Exception:
        # Invalid token format -> Fallback to unauthenticated guest
        return AuthenticationContext(authenticated=False)
