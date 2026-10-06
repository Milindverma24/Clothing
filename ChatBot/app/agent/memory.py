from typing import Dict, Any, Optional
from collections import defaultdict


class ConversationMemory:
    """Manages conversational working memory across multiple chat turns."""

    def __init__(self):
        # In-memory working context keyed by conversation_id
        self._contexts: Dict[str, Dict[str, Any]] = defaultdict(dict)

    def get_context(self, conversation_id: str) -> Dict[str, Any]:
        return self._contexts[conversation_id]

    def update_context(self, conversation_id: str, key: str, value: Any):
        self._contexts[conversation_id][key] = value

    def update_entities(self, conversation_id: str, new_entities: Dict[str, Any]):
        """Merges new extracted entities while preserving prior conversational context."""
        ctx = self._contexts[conversation_id]
        for k, v in new_entities.items():
            if v is not None:
                ctx[k] = v

    def clear(self, conversation_id: str):
        if conversation_id in self._contexts:
            del self._contexts[conversation_id]


memory = ConversationMemory()
