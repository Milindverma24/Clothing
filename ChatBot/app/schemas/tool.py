from typing import Any, Dict, Optional
from pydantic import BaseModel, Field
from app.core.constants import PermissionLevel


class ToolDefinition(BaseModel):
    name: str
    description: str
    permission_level: PermissionLevel
    requires_auth: bool = False
    requires_confirmation: bool = False
    requires_idempotency: bool = False
    timeout_seconds: int = 15
    allow_retries: bool = True
    parameters_schema: Dict[str, Any] = Field(default_factory=dict)


class ToolCallRequest(BaseModel):
    tool_name: str
    arguments: Dict[str, Any] = Field(default_factory=dict)
    operation_id: Optional[str] = None
    idempotency_key: Optional[str] = None


class ToolResult(BaseModel):
    success: bool
    tool_name: str
    operation_id: Optional[str] = None
    status: str = "COMPLETED"  # COMPLETED, FAILED, CONFIRMATION_REQUIRED
    message: Optional[str] = None
    data: Optional[Any] = None
    error: Optional[str] = None
    requires_confirmation: bool = False
    confirmation_payload: Optional[Dict[str, Any]] = None
    cards: Optional[Any] = None
    actions: Optional[Any] = None
