from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from pydantic import BaseModel, Field
from app.core.constants import IntentType, ActionStatus, MessageType
from app.schemas.product import ProductDTO
from app.schemas.order import OrderDTO


class PageContext(BaseModel):
    page: Optional[str] = None
    product_id: Optional[int] = None
    order_id: Optional[int] = None
    category: Optional[str] = None


class ActionPayload(BaseModel):
    type: str  # CANCEL_ORDER, RETURN_REQUEST, ADD_TO_CART, etc.
    resource_id: Optional[str] = None
    status: ActionStatus = ActionStatus.NONE
    summary: Optional[str] = None
    requires_confirmation: bool = False
    details: Dict[str, Any] = Field(default_factory=dict)


class SourceCitation(BaseModel):
    title: str
    document_name: str
    page_number: Optional[int] = None
    snippet: Optional[str] = None


class ChatRequest(BaseModel):
    conversation_id: Optional[str] = None
    session_id: Optional[str] = None
    message: str = Field(..., min_length=1, max_length=2000)
    context: Optional[PageContext] = None
    confirmed_action: Optional[bool] = None  # True if user clicked [Confirm], False if [Cancel]


class ChatResponse(BaseModel):
    conversation_id: str
    message_id: str
    type: MessageType = MessageType.TEXT
    intent: IntentType = IntentType.GENERAL_QUESTION
    message: str
    requires_confirmation: bool = False
    action: Optional[ActionPayload] = None
    products: List[ProductDTO] = Field(default_factory=list)
    cards: List[Dict[str, Any]] = Field(default_factory=list)
    actions: List[Dict[str, Any]] = Field(default_factory=list)
    order: Optional[OrderDTO] = None
    cart: Optional[Dict[str, Any]] = None
    sources: List[SourceCitation] = Field(default_factory=list)
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class FeedbackRequest(BaseModel):
    conversation_id: str
    message_id: str
    rating: str  # POSITIVE, NEGATIVE
    feedback: Optional[str] = None
