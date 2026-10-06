from app.core.constants import ConversationState


class ConversationStateMachine:
    """Tracks and transitions conversation session state."""

    VALID_TRANSITIONS = {
        ConversationState.IDLE: [ConversationState.UNDERSTANDING, ConversationState.FAILED],
        ConversationState.UNDERSTANDING: [ConversationState.RETRIEVING, ConversationState.PLANNING, ConversationState.FAILED],
        ConversationState.RETRIEVING: [ConversationState.PLANNING, ConversationState.COMPLETED, ConversationState.FAILED],
        ConversationState.PLANNING: [ConversationState.WAITING_FOR_CONFIRMATION, ConversationState.EXECUTING, ConversationState.COMPLETED, ConversationState.FAILED],
        ConversationState.WAITING_FOR_CONFIRMATION: [ConversationState.EXECUTING, ConversationState.COMPLETED, ConversationState.FAILED],
        ConversationState.EXECUTING: [ConversationState.VERIFYING, ConversationState.FAILED],
        ConversationState.VERIFYING: [ConversationState.COMPLETED, ConversationState.FAILED],
        ConversationState.COMPLETED: [ConversationState.IDLE, ConversationState.UNDERSTANDING],
        ConversationState.FAILED: [ConversationState.IDLE, ConversationState.ESCALATED],
        ConversationState.ESCALATED: [ConversationState.IDLE, ConversationState.COMPLETED]
    }

    @classmethod
    def can_transition(cls, from_state: ConversationState, to_state: ConversationState) -> bool:
        allowed = cls.VALID_TRANSITIONS.get(from_state, [])
        return to_state in allowed


state_machine = ConversationStateMachine()
