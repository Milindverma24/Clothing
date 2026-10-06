from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.models import Conversation, Message, ToolCall, AuditLog, utc_now
from app.core.constants import SenderType, MessageType, ConversationState


class ConversationService:
    """Manages persistence of conversation sessions and messages."""

    async def get_or_create_conversation(
        self,
        db: AsyncSession,
        conversation_id: Optional[str] = None,
        session_id: str = "default_session",
        user_id: Optional[str] = None
    ) -> Conversation:
        if conversation_id:
            stmt = select(Conversation).where(Conversation.id == conversation_id)
            res = await db.execute(stmt)
            conv = res.scalar_one_or_none()
            if conv:
                if user_id and not conv.user_id:
                    conv.user_id = user_id
                conv.last_activity_at = utc_now()
                return conv

        # Create new conversation
        new_conv = Conversation(
            session_id=session_id,
            user_id=user_id,
            status="ACTIVE",
            current_state=ConversationState.IDLE.value
        )
        db.add(new_conv)
        await db.flush()
        return new_conv

    async def add_message(
        self,
        db: AsyncSession,
        conversation_id: str,
        sender: SenderType,
        content: str,
        message_type: MessageType = MessageType.TEXT,
        intent: Optional[str] = None,
        payload: Optional[dict] = None
    ) -> Message:
        # Determine sequence number
        stmt = select(Conversation).where(Conversation.id == conversation_id)
        res = await db.execute(stmt)
        conv = res.scalar_one_or_none()
        seq = 1
        if conv:
            conv.message_count += 1
            conv.last_activity_at = utc_now()
            seq = conv.message_count

        msg = Message(
            conversation_id=conversation_id,
            sender_type=sender.value if hasattr(sender, "value") else str(sender),
            message_type=message_type.value if hasattr(message_type, "value") else str(message_type),
            content=content,
            sequence_number=seq,
            intent=intent,
            payload=payload
        )
        db.add(msg)
        await db.flush()
        return msg

    async def set_pending_action(
        self,
        db: AsyncSession,
        conversation: Conversation,
        action_data: Optional[dict]
    ):
        conversation.pending_action = action_data
        if action_data:
            conversation.current_state = ConversationState.WAITING_FOR_CONFIRMATION.value
        else:
            conversation.current_state = ConversationState.COMPLETED.value
        await db.flush()

    async def record_tool_call(
        self,
        db: AsyncSession,
        conversation_id: str,
        tool_name: str,
        permission: str,
        status: str,
        args_redacted: Optional[dict] = None,
        result_redacted: Optional[dict] = None,
        latency_ms: Optional[float] = None
    ) -> ToolCall:
        tc = ToolCall(
            conversation_id=conversation_id,
            tool_name=tool_name,
            tool_permission=permission,
            status=status,
            arguments_redacted=args_redacted,
            result_redacted=result_redacted,
            latency_ms=latency_ms
        )
        db.add(tc)
        await db.flush()
        return tc

    async def record_audit_log(
        self,
        db: AsyncSession,
        action_type: str,
        status: str,
        conversation_id: Optional[str] = None,
        user_id: Optional[str] = None,
        operation_id: Optional[str] = None,
        metadata: Optional[dict] = None
    ):
        audit = AuditLog(
            conversation_id=conversation_id,
            user_id=user_id,
            action_type=action_type,
            status=status,
            operation_id=operation_id,
            metadata_json=metadata
        )
        db.add(audit)
        await db.flush()


conversation_service = ConversationService()
