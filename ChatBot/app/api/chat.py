import json
import asyncio
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.database import get_db
from app.db.models import Conversation, Message, Feedback
from app.core.security import extract_auth_context, AuthenticationContext
from app.schemas.chat import ChatRequest, ChatResponse, FeedbackRequest
from app.schemas.common import APIResponse
from app.agent.agent import commerce_agent
from app.core.logging import logger

router = APIRouter(prefix="/api", tags=["Chat"])


@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(
    request: ChatRequest,
    auth_context: AuthenticationContext = Depends(extract_auth_context),
    db: AsyncSession = Depends(get_db)
):
    """Primary conversational commerce endpoint."""
    try:
        response = await commerce_agent.process_chat(
            request=request,
            auth_context=auth_context,
            db=db
        )
        return response
    except Exception as e:
        logger.error(f"Error in chat endpoint: {e}", exc_info=True)
        raise HTTPException(
            status_code=getattr(e, "status_code", 500),
            detail=getattr(e, "message", "I couldn't complete that request right now. Please try again.")
        )


@router.post("/chat/stream")
async def chat_stream_endpoint(
    request: ChatRequest,
    auth_context: AuthenticationContext = Depends(extract_auth_context),
    db: AsyncSession = Depends(get_db)
):
    """Server-Sent Events (SSE) streaming endpoint for live message delivery."""
    async def event_generator():
        try:
            # Yield initial connect event
            yield f"event: message_start\ndata: {json.dumps({'status': 'CONNECTING'})}\n\n"
            await asyncio.sleep(0.05)

            # Process chat action through agent
            response: ChatResponse = await commerce_agent.process_chat(
                request=request,
                auth_context=auth_context,
                db=db
            )

            # Stream text deltas word by word for fluid typewriter effect
            words = response.message.split(" ")
            for i in range(0, len(words), 3):
                chunk = " ".join(words[i : i + 3]) + " "
                yield f"event: text_delta\ndata: {json.dumps({'delta': chunk})}\n\n"
                await asyncio.sleep(0.04)

            # Yield rich payload (products, order, confirmation, sources)
            payload_data = {
                "conversation_id": response.conversation_id,
                "message_id": response.message_id,
                "type": response.type.value,
                "requires_confirmation": response.requires_confirmation,
                "action": response.action.model_dump() if response.action else None,
                "products": [p.model_dump() for p in response.products],
                "order": response.order.model_dump() if response.order else None,
                "sources": [s.model_dump() for s in response.sources]
            }
            yield f"event: message_complete\ndata: {json.dumps(payload_data)}\n\n"

        except Exception as e:
            logger.error(f"Error in SSE stream: {e}", exc_info=True)
            yield f"event: error\ndata: {json.dumps({'message': 'I encountered an error while processing your request.'})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )


@router.get("/conversations/{conversation_id}")
async def get_conversation_history(
    conversation_id: str,
    auth_context: AuthenticationContext = Depends(extract_auth_context),
    db: AsyncSession = Depends(get_db)
):
    """Retrieves conversation history and past messages."""
    stmt = select(Conversation).where(Conversation.id == conversation_id)
    res = await db.execute(stmt)
    conv = res.scalar_one_or_none()

    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Data isolation: If conversation belongs to another customer, reject access
    if conv.user_id and auth_context.customer_id and conv.user_id != auth_context.customer_id:
        raise HTTPException(status_code=403, detail="Access denied to this conversation.")

    msg_stmt = select(Message).where(Message.conversation_id == conversation_id).order_by(Message.sequence_number)
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
                "payload": m.payload
            }
            for m in messages
        ]
    }


@router.post("/feedback")
async def submit_feedback(
    feedback: FeedbackRequest,
    auth_context: AuthenticationContext = Depends(extract_auth_context),
    db: AsyncSession = Depends(get_db)
):
    """Records customer feedback (positive/negative) for continuous improvement."""
    fb = Feedback(
        conversation_id=feedback.conversation_id,
        message_id=feedback.message_id,
        user_id=auth_context.customer_id,
        rating=feedback.rating.upper(),
        feedback_text=feedback.feedback
    )
    db.add(fb)
    await db.commit()
    return {"success": True, "message": "Feedback submitted successfully."}
