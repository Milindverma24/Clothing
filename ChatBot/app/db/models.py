import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    String,
    Text,
    Integer,
    Float,
    DateTime,
    Boolean,
    ForeignKey,
    JSON,
    Index,
)
from sqlalchemy.orm import relationship
from app.db.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Conversation(Base):
    __tablename__ = "ai_conversations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(64), nullable=True, index=True)
    session_id = Column(String(64), nullable=False, index=True)
    title = Column(String(255), default="Shopping Assistant")
    status = Column(String(32), default="ACTIVE")  # ACTIVE, ESCALATED, CLOSED
    current_state = Column(String(32), default="IDLE")  # ConversationState
    pending_action = Column(JSON, nullable=True)  # Stores pending confirmation action
    started_at = Column(DateTime, default=utc_now)
    last_activity_at = Column(DateTime, default=utc_now, onupdate=utc_now)
    message_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan", order_by="Message.sequence_number")
    tool_calls = relationship("ToolCall", back_populates="conversation", cascade="all, delete-orphan")


class Message(Base):
    __tablename__ = "ai_messages"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    conversation_id = Column(String(36), ForeignKey("ai_conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    sender_type = Column(String(16), nullable=False)  # USER, ASSISTANT, SYSTEM, TOOL
    message_type = Column(String(32), default="TEXT")  # TEXT, PRODUCT_LIST, ORDER, CONFIRMATION, etc.
    content = Column(Text, nullable=False)
    sequence_number = Column(Integer, default=1)
    intent = Column(String(64), nullable=True)
    model_name = Column(String(64), nullable=True)
    processing_time_ms = Column(Float, nullable=True)
    token_usage = Column(JSON, nullable=True)
    error_status = Column(String(64), nullable=True)
    payload = Column(JSON, nullable=True)  # Structured card or action payload
    created_at = Column(DateTime, default=utc_now)

    conversation = relationship("Conversation", back_populates="messages")


class ToolCall(Base):
    __tablename__ = "ai_tool_calls"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    conversation_id = Column(String(36), ForeignKey("ai_conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    message_id = Column(String(36), nullable=True, index=True)
    tool_name = Column(String(64), nullable=False, index=True)
    tool_permission = Column(String(32), nullable=False)
    operation_id = Column(String(64), nullable=True, index=True)
    arguments_redacted = Column(JSON, nullable=True)
    result_redacted = Column(JSON, nullable=True)
    status = Column(String(32), default="SUCCESS")  # SUCCESS, FAILED
    error_message = Column(Text, nullable=True)
    latency_ms = Column(Float, nullable=True)
    created_at = Column(DateTime, default=utc_now)

    conversation = relationship("Conversation", back_populates="tool_calls")


class AuditLog(Base):
    __tablename__ = "ai_audit_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(64), nullable=True, index=True)
    conversation_id = Column(String(36), nullable=True, index=True)
    operation_id = Column(String(64), nullable=True, index=True)
    action_type = Column(String(64), nullable=False, index=True)  # CANCEL_ORDER, RETURN_REQUEST, etc.
    tool_name = Column(String(64), nullable=True)
    status = Column(String(32), nullable=False)  # REQUESTED, CONFIRMED, EXECUTED, VERIFIED, FAILED
    metadata_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=utc_now, index=True)


class Feedback(Base):
    __tablename__ = "ai_feedback"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    conversation_id = Column(String(36), nullable=False, index=True)
    message_id = Column(String(36), nullable=False, index=True)
    user_id = Column(String(64), nullable=True)
    rating = Column(String(16), nullable=False)  # POSITIVE, NEGATIVE
    feedback_text = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)


class RAGDocument(Base):
    __tablename__ = "ai_rag_documents"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    title = Column(String(255), nullable=False)
    filename = Column(String(255), nullable=False)
    category = Column(String(64), nullable=False, index=True)  # policies, sizing, shipping, etc.
    version = Column(Integer, default=1)
    status = Column(String(32), default="INDEXED")
    chunk_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)


class RAGChunk(Base):
    __tablename__ = "ai_rag_chunks"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    document_id = Column(String(36), ForeignKey("ai_rag_documents.id", ondelete="CASCADE"), nullable=False, index=True)
    document_title = Column(String(255), nullable=False)
    page_number = Column(Integer, nullable=True)
    chunk_index = Column(Integer, default=0)
    content = Column(Text, nullable=False)
    embedding_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=utc_now)


# Indexing
Index("idx_audit_user_action", AuditLog.user_id, AuditLog.action_type)
Index("idx_tool_conv_status", ToolCall.conversation_id, ToolCall.status)
