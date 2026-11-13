"""
Admin monitoring endpoints for the AI Commerce Agent.

All routes in this module require an authenticated user with the ADMIN role.
Unauthenticated or non-admin callers receive 401/403 — no data is returned.

These endpoints expose conversation transcripts and audit logs that contain
customer data. Access must be strictly limited to administrators.
"""

from fastapi import APIRouter, Depends, HTTPException, Header, Request
from pydantic import BaseModel, HttpUrl
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional

from app.db.database import get_db
from app.db.models import Conversation, Message, ToolCall, AuditLog
from app.core.security import extract_auth_context, AuthenticationContext
from app.core.config import settings
from app.core.logging import logger
from app.services.llm_service import llm_service

router = APIRouter(prefix="/api/admin", tags=["Admin Operations"])


class ModelUrlUpdateRequest(BaseModel):
    model_base_url: str
    api_key: Optional[str] = None
    model_name: Optional[str] = None


def _require_admin_or_service_key(
    auth: AuthenticationContext,
    x_ai_service_key: Optional[str] = None
) -> None:
    """
    Authorizes either an authenticated administrator OR an internal service
    call presenting the valid AI_SERVICE_API_KEY (e.g. from the Colab notebook).
    """
    if x_ai_service_key and settings.AI_SERVICE_API_KEY:
        if x_ai_service_key.strip() == settings.AI_SERVICE_API_KEY.strip():
            return

    if not auth.authenticated:
        raise HTTPException(
            status_code=401,
            detail="Authentication required to access admin resources.",
        )
    if not auth.is_admin:
        raise HTTPException(
            status_code=403,
            detail="Administrator privilege required.",
        )


def _require_admin(auth: AuthenticationContext) -> None:
    """
    Raises HTTP 401 if the caller is not authenticated,
    or HTTP 403 if the caller is authenticated but not an admin.

    Call this at the start of every admin endpoint handler.
    """
    if not auth.authenticated:
        raise HTTPException(
            status_code=401,
            detail="Authentication required to access admin resources.",
        )
    if not auth.is_admin:
        raise HTTPException(
            status_code=403,
            detail="Administrator privilege required.",
        )


@router.get("/conversations")
async def list_conversations(
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    auth: AuthenticationContext = Depends(extract_auth_context),
):
    """Admin monitoring: list recent customer chat sessions."""
    _require_admin(auth)

    # Clamp limit to prevent accidentally fetching the entire table.
    clamped_limit = min(limit, 500)

    stmt = (
        select(Conversation)
        .order_by(Conversation.last_activity_at.desc())
        .limit(clamped_limit)
    )
    res = await db.execute(stmt)
    convs = res.scalars().all()

    logger.info(
        "Admin %s retrieved %d conversation summaries.",
        auth.customer_id or auth.email,
        len(convs),
    )

    return {
        "conversations": [
            {
                "id": c.id,
                # user_id is intentionally included for admin monitoring.
                # Never expose this in customer-facing endpoints.
                "user_id": c.user_id,
                "title": c.title,
                "status": c.status,
                "current_state": c.current_state,
                "message_count": c.message_count,
                "started_at": c.started_at.isoformat() if c.started_at else None,
                "last_activity_at": (
                    c.last_activity_at.isoformat() if c.last_activity_at else None
                ),
            }
            for c in convs
        ]
    }


@router.get("/conversations/{conversation_id}/audit")
async def conversation_audit(
    conversation_id: str,
    db: AsyncSession = Depends(get_db),
    auth: AuthenticationContext = Depends(extract_auth_context),
):
    """Admin inspection: full transcript, tool calls, and execution latencies."""
    _require_admin(auth)

    msg_stmt = (
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.sequence_number)
    )
    tc_stmt = (
        select(ToolCall)
        .where(ToolCall.conversation_id == conversation_id)
        .order_by(ToolCall.created_at)
    )

    messages = (await db.execute(msg_stmt)).scalars().all()
    tool_calls = (await db.execute(tc_stmt)).scalars().all()

    logger.info(
        "Admin %s retrieved audit for conversation %s.",
        auth.customer_id or auth.email,
        conversation_id,
    )

    return {
        "conversation_id": conversation_id,
        "messages": [
            {
                "sender": m.sender_type,
                "type": m.message_type,
                "content": m.content,
                "intent": m.intent,
                "created_at": m.created_at.isoformat() if m.created_at else None,
            }
            for m in messages
        ],
        "tool_calls": [
            {
                "tool_name": tc.tool_name,
                "permission": tc.tool_permission,
                "status": tc.status,
                "latency_ms": tc.latency_ms,
                "created_at": tc.created_at.isoformat() if tc.created_at else None,
            }
            for tc in tool_calls
        ],
    }


@router.get("/audit-logs")
async def list_audit_logs(
    limit: int = 100,
    action_type: str | None = None,
    db: AsyncSession = Depends(get_db),
    auth: AuthenticationContext = Depends(extract_auth_context),
):
    """Admin inspection: system-wide tool execution audit log."""
    _require_admin(auth)

    clamped_limit = min(limit, 1000)
    stmt = select(AuditLog).order_by(AuditLog.created_at.desc()).limit(clamped_limit)
    if action_type:
        stmt = stmt.where(AuditLog.action_type == action_type.upper())

    logs = (await db.execute(stmt)).scalars().all()

    return {
        "audit_logs": [
            {
                "id": log.id,
                "user_id": log.user_id,
                "conversation_id": log.conversation_id,
                "action_type": log.action_type,
                "tool_name": log.tool_name,
                "status": log.status,
                "created_at": log.created_at.isoformat() if log.created_at else None,
            }
            for log in logs
        ]
    }


@router.post("/update-model-url")
@router.post("/model-url")
async def update_model_url(
    payload: ModelUrlUpdateRequest,
    auth: AuthenticationContext = Depends(extract_auth_context),
    x_ai_service_key: Optional[str] = Header(default=None, alias="X-AI-Service-Key"),
):
    """
    Automated URL registration endpoint for Google Colab Quick Tunnel.

    When a Colab notebook starts or restarts, it posts its new Cloudflare
    tunnel URL to this endpoint. The endpoint verifies authentication (either
    via X-AI-Service-Key or Admin JWT), updates the in-flight model URL,
    and runs a health probe to verify connection.
    """
    _require_admin_or_service_key(auth, x_ai_service_key)

    url_str = payload.model_base_url.strip()
    if not (url_str.startswith("http://") or url_str.startswith("https://")):
        raise HTTPException(status_code=400, detail="Invalid URL: must begin with http:// or https://")

    # Update dynamic endpoint in llm_service
    llm_service.update_model_endpoint(
        base_url=url_str,
        api_key=payload.api_key,
        model_name=payload.model_name
    )

    # Perform immediate health check
    health = await llm_service.check_health()

    logger.info(f"Registered model URL: {url_str}. Health probe: {health.get('status')}")

    return {
        "success": True,
        "message": "Model endpoint updated successfully.",
        "model_base_url": url_str,
        "provider": llm_service.provider,
        "health": health
    }


@router.get("/model-status")
async def get_model_status(
    auth: AuthenticationContext = Depends(extract_auth_context),
):
    """Checks the health and latency of the currently configured model endpoint."""
    _require_admin(auth)
    health = await llm_service.check_health()
    return {
        "provider": llm_service.provider,
        "active_provider_used": llm_service.last_active_provider,
        "model_base_url": llm_service.model_base_url,
        "model_name": llm_service.custom_model_name,
        "fallback_configured": bool(llm_service.fallback_provider and llm_service.fallback_api_key),
        "fallback_provider": llm_service.fallback_provider or None,
        "health": health
    }

