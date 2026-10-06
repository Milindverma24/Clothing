import pytest
from app.tools import registry
from app.core.constants import PermissionLevel


def test_registry_contains_required_tools():
    required = [
        "search_products",
        "get_product",
        "get_orders",
        "get_order",
        "check_cancellation_eligibility",
        "cancel_order",
        "get_cart",
        "add_to_cart",
        "search_knowledge_base",
        "create_support_ticket",
        "escalate_to_human"
    ]
    for tool_name in required:
        defn = registry.get_definition(tool_name)
        assert defn is not None, f"Missing tool definition: {tool_name}"
        assert registry.get_handler(tool_name) is not None, f"Missing handler: {tool_name}"


def test_destructive_tool_requires_confirmation():
    cancel_def = registry.get_definition("cancel_order")
    assert cancel_def.permission_level == PermissionLevel.DESTRUCTIVE
    assert cancel_def.requires_confirmation is True
    assert cancel_def.requires_auth is True
