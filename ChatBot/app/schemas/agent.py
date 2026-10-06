from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from app.core.constants import IntentType, ConversationState


class IntentDetectionResult(BaseModel):
    intent: IntentType
    confidence: float = 1.0
    entities: Dict[str, Any] = Field(default_factory=dict)
    clarification_needed: bool = False
    clarification_prompt: Optional[str] = None


class ExecutionPlanStep(BaseModel):
    step_id: int
    tool_name: str
    arguments: Dict[str, Any] = Field(default_factory=dict)
    description: str
    requires_confirmation: bool = False


class AgentPlan(BaseModel):
    intent: IntentType
    reasoning: Optional[str] = None  # Never exposed to customer!
    steps: List[ExecutionPlanStep] = Field(default_factory=list)


class AgentStateDTO(BaseModel):
    conversation_id: str
    current_state: ConversationState
    last_intent: Optional[IntentType] = None
    step_count: int = 0
    tool_call_count: int = 0
    pending_action: Optional[Dict[str, Any]] = None
