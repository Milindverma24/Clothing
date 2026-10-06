from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.database import get_db
from app.db.models import Conversation, Message, ToolCall, AuditLog
from app.core.security import extract_auth_context, AuthenticationContext

router = APIRouter(prefix="/api/admin", tags=["Admin Operations"])


@router.get("/conversations")
async def list_conversations(
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    auth: AuthenticationContext = Depends(extract_auth_context)
):
    """Admin monitoring endpoint to view recent customer sessions."""
    stmt = select(Conversation).order_by(Conversation.last_activity_at.desc()).limit(limit)
    res = await db.execute(stmt)
    convs = res.scalars().all()
    return {
        "conversations": [
            {
                "id": c.id,
                "user_id": c.user_id,
                "title": c.title,
                "status": c.status,
                "current_state": c.current_state,
                "message_count": c.message_count,
                "started_at": c.started_at.isoformat() if c.started_at else None,
                "last_activity_at": c.last_activity_at.isoformat() if c.last_activity_at else None
            }
            for c in convs
        ]
    }


@router.get("/conversations/{conversation_id}/audit")
async def conversation_audit(
    conversation_id: str,
    db: AsyncSession = Depends(get_db),
    auth: AuthenticationContext = Depends(extract_auth_context)
):
    """Admin inspection of full transcript, tool calls, and execution latencies."""
    msg_stmt = select(Message).where(Message.conversation_id == conversation_id).order_by(Message.sequence_number)
    tc_stmt = select(ToolCall).where(ToolCall.conversation_id == conversation_id).order_by(ToolCall.created_at)

    messages = (await db.execute(msg_stmt)).scalars().all()
    tool_calls = (await db.execute(tc_stmt)).scalars().all()

    return {
        "conversation_id": conversation_id,
        "messages": [
            {
                "sender": m.sender_type,
                "type": m.message_type,
                "content": m.content,
                "intent": m.intent,
                "created_at": m.created_at.isoformat() if m.created_at else None
            }
            for m in messages
        ],
        "tool_calls": [
            {
                "tool_name": tc.tool_name,
                "status": tc.status,
                "latency_ms": tc.latency_ms,
                "created_at": tc.created_at.isoformat() if tc.created_at else None
            }
            for tc in tool_calls
        ]
    }
