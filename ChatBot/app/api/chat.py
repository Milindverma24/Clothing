"""
Customer-facing chat API endpoints.

Streaming note
--------------
The /api/chat/stream endpoint uses SSE. When AI_PROVIDER=mock (offline) or
when AI_PROVIDER=custom_openai (Colab), the full response is generated first
and then split into word-chunks for a typewriter effect. This is NOT model
streaming; it is UI animation over a complete response.

When AI_PROVIDER=groq or openai, the agent calls the LLM's streaming API and
yields actual token deltas. The difference is transparent to the client but
important to understand for latency expectations.

Important: Cloudflare Quick Tunnels buffer SSE responses. If you use a Quick
Tunnel for the Colab model endpoint, true streaming is not guaranteed. Use
a named Cloudflare Tunnel or test streaming over a direct HTTPS connection.

Guest conversation security
----------------------------
Guest conversations are bound by both their UUID and a session-capability
token (`X-Guest-Session-Token` header). The token is generated on the client,
stored in localStorage, and sent with every request. This prevents an attacker
from reading a guest conversation by guessing its UUID.
"""

import json
import asyncio
import secrets
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Header, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.database import get_db
from app.db.models import Conversation, Message, Feedback
from app.core.security import extract_auth_context, AuthenticationContext
from app.schemas.chat import ChatRequest, ChatResponse, FeedbackRequest
from app.schemas.common import APIResponse
from app.agent.agent import commerce_agent
from app.core.config import settings
from app.core.logging import logger

router = APIRouter(prefix="/api", tags=["Chat"])


def _check_message_length(message: str) -> None:
    """Enforce message length limit to prevent abuse."""
    if len(message) > settings.MAX_MESSAGE_LENGTH:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Message exceeds the maximum allowed length of "
                f"{settings.MAX_MESSAGE_LENGTH} characters."
            ),
        )


def _verify_conversation_access(
    conv: Conversation,
    auth_context: AuthenticationContext,
    guest_session_token: Optional[str],
) -> None:
    """
    Enforces conversation ownership for both authenticated and guest users.

    Authenticated users:
      - conversation.user_id must match auth_context.customer_id.

    Guest users (conv.user_id is None):
      - The guest_session_token stored on the conversation must match the
        X-Guest-Session-Token header sent by the client.
      - This prevents IDOR on guest conversations via UUID guessing.
    """
    if auth_context.authenticated and auth_context.customer_id:
        # Authenticated path
        if conv.user_id and conv.user_id != auth_context.customer_id:
            raise HTTPException(
                status_code=403,
                detail="Access denied: this conversation belongs to another user.",
            )
    else:
        # Guest path — require session capability token
        stored_token = conv.guest_session_token if hasattr(conv, "guest_session_token") else None
        if stored_token:
            if not guest_session_token:
                raise HTTPException(
                    status_code=403,
                    detail="Access denied: guest session token required.",
                )
            if not secrets.compare_digest(stored_token, guest_session_token):
                raise HTTPException(
                    status_code=403,
                    detail="Access denied: invalid guest session token.",
                )


# ---------------------------------------------------------------------------
# Chat endpoints
# ---------------------------------------------------------------------------

@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(
    request: ChatRequest,
    auth_context: AuthenticationContext = Depends(extract_auth_context),
    db: AsyncSession = Depends(get_db),
    x_guest_session_token: Optional[str] = Header(default=None, alias="X-Guest-Session-Token"),
):
    """Primary conversational commerce endpoint."""
    _check_message_length(request.message)
    try:
        response = await commerce_agent.process_chat(
            request=request,
            auth_context=auth_context,
            db=db,
            guest_session_token=x_guest_session_token or request.session_id,
        )
        return response
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error in chat endpoint: %s", e, exc_info=True)
        raise HTTPException(
            status_code=getattr(e, "status_code", 500),
            detail=getattr(
                e,
                "message",
                "I couldn't complete that request right now. Please try again.",
            ),
        )


@router.post("/chat/stream")
async def chat_stream_endpoint(
    request: ChatRequest,
    auth_context: AuthenticationContext = Depends(extract_auth_context),
    db: AsyncSession = Depends(get_db),
    x_guest_session_token: Optional[str] = Header(default=None, alias="X-Guest-Session-Token"),
):
    """
    Server-Sent Events (SSE) streaming endpoint.

    Streaming behaviour depends on AI_PROVIDER:
      - mock / custom_openai with Colab: full response computed first, then
        yielded as word-chunk deltas (UI animation, not model streaming).
      - groq / openai: real token streaming from the provider.

    If the model server is unavailable, an error event is yielded immediately
    rather than leaving the client in an indefinite loading state.
    """
    _check_message_length(request.message)

    async def event_generator():
        try:
            yield f"event: message_start\ndata: {json.dumps({'status': 'CONNECTING'})}\n\n"
            await asyncio.sleep(0.05)

            response: ChatResponse = await commerce_agent.process_chat(
                request=request,
                auth_context=auth_context,
                db=db,
                guest_session_token=x_guest_session_token or request.session_id,
            )

            # For real streaming providers (groq/openai), llm_service.generate_stream
            # yields tokens. For mock/custom_openai we simulate a typewriter effect.
            # Either way the client receives the same SSE event structure.
            words = response.message.split(" ")
            for i in range(0, len(words), 3):
                chunk = " ".join(words[i : i + 3]) + " "
                yield f"event: text_delta\ndata: {json.dumps({'delta': chunk})}\n\n"
                await asyncio.sleep(0.04)

            payload_data = {
                "conversation_id": response.conversation_id,
                "message_id": response.message_id,
                "type": response.type.value,
                "requires_confirmation": response.requires_confirmation,
                "action": response.action.model_dump() if response.action else None,
                "products": [p.model_dump() for p in response.products],
                "order": response.order.model_dump() if response.order else None,
                "sources": [s.model_dump() for s in response.sources],
            }
            yield f"event: message_complete\ndata: {json.dumps(payload_data)}\n\n"

        except Exception as e:
            logger.error("Error in SSE stream: %s", e, exc_info=True)
            # Always yield a terminal error event so the client can display a
            # retry message instead of spinning forever.
            yield (
                f"event: error\ndata: {json.dumps({'message': 'I encountered an error. Please try again.'})}\n\n"
            )

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/conversations/{conversation_id}")
async def get_conversation_history(
    conversation_id: str,
    auth_context: AuthenticationContext = Depends(extract_auth_context),
    db: AsyncSession = Depends(get_db),
    x_guest_session_token: Optional[str] = Header(default=None, alias="X-Guest-Session-Token"),
):
    """
    Retrieves conversation history.

    Ownership is enforced for both authenticated users and anonymous guests.
    See _verify_conversation_access() for the full security model.
    """
    stmt = select(Conversation).where(Conversation.id == conversation_id)
    res = await db.execute(stmt)
    conv = res.scalar_one_or_none()

    if not conv:
        # Return 404 instead of 403 to avoid leaking conversation existence.
        raise HTTPException(status_code=404, detail="Conversation not found.")

    _verify_conversation_access(conv, auth_context, x_guest_session_token)

    msg_stmt = (
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.sequence_number)
        .limit(settings.MAX_CONTEXT_MESSAGES * 2)  # Pagination guard
    )
    msg_res = await db.execute(msg_stmt)
    messages = msg_res.scalars().all()

    return {
        "conversation_id": conv.id,
        "title": conv.title,
        "status": conv.status,
        "messages": [
            {
                "id": m.id,
                "sender": m.sender_type,
                "type": m.message_type,
                "content": m.content,
                "created_at": m.created_at.isoformat() if m.created_at else None,
                "payload": m.payload,
            }
            for m in messages
        ],
    }


@router.post("/feedback")
async def submit_feedback(
    feedback: FeedbackRequest,
    auth_context: AuthenticationContext = Depends(extract_auth_context),
    db: AsyncSession = Depends(get_db),
):
    """Records customer feedback (positive/negative) for continuous improvement."""
    if feedback.rating.upper() not in ("POSITIVE", "NEGATIVE"):
        raise HTTPException(status_code=400, detail="Rating must be POSITIVE or NEGATIVE.")

    fb = Feedback(
        conversation_id=feedback.conversation_id,
        message_id=feedback.message_id,
        user_id=auth_context.customer_id,
        rating=feedback.rating.upper(),
        feedback_text=feedback.feedback,
    )
    db.add(fb)
    await db.commit()
    return {"success": True, "message": "Feedback submitted successfully."}
