from typing import Dict, Any, Callable, Optional, List
from app.core.constants import PermissionLevel
from app.schemas.tool import ToolDefinition, ToolResult
from app.tools.product_tools import search_products, get_product
from app.tools.order_tools import (
    get_orders,
    get_order,
    check_cancellation_eligibility,
    cancel_order,
    order_product,
    track_order,
    request_return_and_refund,
    show_order,
    return_order
)
from app.tools.cart_tools import get_cart, add_to_cart
from app.tools.rag_tools import search_knowledge_base
from app.tools.support_tools import create_support_ticket, escalate_to_human
from app.tools.size_tools import (
    get_size_chart,
    get_product_size_chart,
    get_size_recommendation,
    convert_size_measurement
)


class ToolRegistry:
    """Central registry enforcing schemas, permissions, and tool execution."""

    def __init__(self):
        self._tools: Dict[str, ToolDefinition] = {}
        self._handlers: Dict[str, Callable] = {}
        self._register_default_tools()

    def register(self, definition: ToolDefinition, handler: Callable):
        self._tools[definition.name] = definition
        self._handlers[definition.name] = handler

    def get_definition(self, name: str) -> Optional[ToolDefinition]:
        return self._tools.get(name)

    def get_handler(self, name: str) -> Optional[Callable]:
        return self._handlers.get(name)

    def list_definitions(self) -> List[ToolDefinition]:
        return list(self._tools.values())

    def _register_default_tools(self):
        # 1. Product Tools (PUBLIC_READ)
        self.register(
            ToolDefinition(
                name="search_products",
                description="Search clothing products by query, category, color, or price.",
                permission_level=PermissionLevel.PUBLIC_READ,
                requires_auth=False,
                requires_confirmation=False,
                parameters_schema={
                    "type": "object",
                    "properties": {
                        "query": {"type": "string", "description": "Search text"},
                        "category": {"type": "string", "description": "Category or article type"},
                        "color": {"type": "string", "description": "Base color"},
                        "max_price": {"type": "number", "description": "Maximum budget in INR"}
                    }
                }
            ),
            search_products
        )

        self.register(
            ToolDefinition(
                name="get_product",
                description="Get detailed product variant and inventory info by product ID.",
                permission_level=PermissionLevel.PUBLIC_READ,
                requires_auth=False,
                parameters_schema={
                    "type": "object",
                    "properties": {
                        "product_id": {"type": "integer", "description": "Product ID"}
                    },
                    "required": ["product_id"]
                }
            ),
            get_product
        )

        # 2. Order Tools (CUSTOMER_READ / DESTRUCTIVE)
        self.register(
            ToolDefinition(
                name="get_orders",
                description="Retrieve authenticated customer's recent orders and statuses.",
                permission_level=PermissionLevel.CUSTOMER_READ,
                requires_auth=True,
                parameters_schema={"type": "object", "properties": {}}
            ),
            get_orders
        )

        self.register(
            ToolDefinition(
                name="get_order",
                description="Retrieve single order details, item snapshots, and tracking.",
                permission_level=PermissionLevel.CUSTOMER_READ,
                requires_auth=True,
                parameters_schema={
                    "type": "object",
                    "properties": {
                        "order_id": {"type": "integer", "description": "Order ID"}
                    },
                    "required": ["order_id"]
                }
            ),
            get_order
        )

        self.register(
            ToolDefinition(
                name="check_cancellation_eligibility",
                description="Verify if an order can be cancelled and request explicit confirmation.",
                permission_level=PermissionLevel.CUSTOMER_READ,
                requires_auth=True,
                requires_confirmation=True,
                parameters_schema={
                    "type": "object",
                    "properties": {
                        "order_id": {"type": "integer", "description": "Order ID"}
                    },
                    "required": ["order_id"]
                }
            ),
            check_cancellation_eligibility
        )

        self.register(
            ToolDefinition(
                name="cancel_order",
                description="Cancel an eligible order with Spring Boot after explicit confirmation.",
                permission_level=PermissionLevel.DESTRUCTIVE,
                requires_auth=True,
                requires_confirmation=True,
                requires_idempotency=True,
                parameters_schema={
                    "type": "object",
                    "properties": {
                        "order_id": {"type": "integer", "description": "Order ID"}
                    },
                    "required": ["order_id"]
                }
            ),
            cancel_order
        )

        self.register(
            ToolDefinition(
                name="order_product",
                description="Place an order for a clothing item by product ID or search terms with size and payment options.",
                permission_level=PermissionLevel.CUSTOMER_WRITE,
                requires_auth=False,
                requires_confirmation=False,
                parameters_schema={
                    "type": "object",
                    "properties": {
                        "product_id": {"type": "integer", "description": "Product ID"},
                        "query": {"type": "string", "description": "Product name or search keywords"},
                        "size": {"type": "string", "description": "Size (S, M, L, XL)"},
                        "quantity": {"type": "integer", "default": 1},
                        "payment_method": {"type": "string", "default": "UPI"}
                    }
                }
            ),
            order_product
        )

        self.register(
            ToolDefinition(
                name="track_order",
                description="Track live delivery status and carrier updates using tracking number (TRK-...) or Order ID.",
                permission_level=PermissionLevel.PUBLIC_READ,
                requires_auth=False,
                parameters_schema={
                    "type": "object",
                    "properties": {
                        "tracking_number": {"type": "string", "description": "Carrier tracking number"},
                        "order_id": {"type": "integer", "description": "Order ID"},
                        "order_number": {"type": "string", "description": "Order reference"}
                    }
                }
            ),
            track_order
        )

        self.register(
            ToolDefinition(
                name="request_return_and_refund",
                description="Initiate an autonomous return and refund request via UPI ID or tracking number with threshold safety check.",
                permission_level=PermissionLevel.CUSTOMER_WRITE,
                requires_auth=True,
                parameters_schema={
                    "type": "object",
                    "properties": {
                        "order_id": {"type": "integer", "description": "Order ID"},
                        "tracking_number": {"type": "string", "description": "Tracking number"},
                        "order_number": {"type": "string", "description": "Order number"},
                        "reason": {"type": "string", "description": "Reason for return"},
                        "upi_id": {"type": "string", "description": "UPI ID for refund payout"},
                        "pickup_date": {"type": "string", "description": "Courier pickup date"}
                    }
                }
            ),
            request_return_and_refund
        )

        self.register(
            ToolDefinition(
                name="show_order",
                description="Fetch fresh, live order details, tracking information, and current cancellation and return eligibility from Spring Boot.",
                permission_level=PermissionLevel.CUSTOMER_READ,
                requires_auth=True,
                parameters_schema={
                    "type": "object",
                    "properties": {
                        "order_id": {"type": "string", "description": "Order reference or numeric ID"}
                    },
                    "required": ["order_id"]
                }
            ),
            show_order
        )

        self.register(
            ToolDefinition(
                name="return_order",
                description="Submit a return request for a delivered order within the 14-day purchase window.",
                permission_level=PermissionLevel.CUSTOMER_WRITE,
                requires_auth=True,
                parameters_schema={
                    "type": "object",
                    "properties": {
                        "order_id": {"type": "string", "description": "Order reference or ID"},
                        "reason": {"type": "string", "description": "Reason for return"}
                    },
                    "required": ["order_id"]
                }
            ),
            return_order
        )

        # 3. Cart Tools (CUSTOMER_READ / CUSTOMER_WRITE)
        self.register(
            ToolDefinition(
                name="get_cart",
                description="View items in current shopping bag.",
                permission_level=PermissionLevel.CUSTOMER_READ,
                requires_auth=True,
                parameters_schema={"type": "object", "properties": {}}
            ),
            get_cart
        )

        self.register(
            ToolDefinition(
                name="add_to_cart",
                description="Add a specific variant to customer shopping bag.",
                permission_level=PermissionLevel.CUSTOMER_WRITE,
                requires_auth=True,
                parameters_schema={
                    "type": "object",
                    "properties": {
                        "variant_id": {"type": "integer", "description": "Variant ID"},
                        "quantity": {"type": "integer", "default": 1}
                    },
                    "required": ["variant_id"]
                }
            ),
            add_to_cart
        )

        # 4. RAG & Store Policy Tools (PUBLIC_READ)
        self.register(
            ToolDefinition(
                name="search_knowledge_base",
                description="Search store policies (returns, refunds, shipping, sizing guides).",
                permission_level=PermissionLevel.PUBLIC_READ,
                requires_auth=False,
                parameters_schema={
                    "type": "object",
                    "properties": {
                        "query": {"type": "string", "description": "Policy question"}
                    },
                    "required": ["query"]
                }
            ),
            search_knowledge_base
        )

        # 5. Support Tools (PUBLIC_READ / CUSTOMER_WRITE)
        self.register(
            ToolDefinition(
                name="create_support_ticket",
                description="File a customer service support ticket.",
                permission_level=PermissionLevel.CUSTOMER_WRITE,
                requires_auth=False,
                parameters_schema={
                    "type": "object",
                    "properties": {
                        "summary": {"type": "string"},
                        "issue": {"type": "string"},
                        "order_id": {"type": "integer"}
                    },
                    "required": ["summary", "issue"]
                }
            ),
            create_support_ticket
        )

        self.register(
            ToolDefinition(
                name="escalate_to_human",
                description="Escalate conversation to a human support agent.",
                permission_level=PermissionLevel.PUBLIC_READ,
                requires_auth=False,
                parameters_schema={
                    "type": "object",
                    "properties": {
                        "reason": {"type": "string"}
                    },
                    "required": ["reason"]
                }
            ),
            escalate_to_human
        )

        # 6. Size Guide & Recommendation Tools (PUBLIC_READ)
        self.register(
            ToolDefinition(
                name="get_size_chart",
                description="Fetch authoritative category/gender size chart from backend.",
                permission_level=PermissionLevel.PUBLIC_READ,
                requires_auth=False,
                parameters_schema={
                    "type": "object",
                    "properties": {
                        "gender": {"type": "string", "description": "MEN, WOMEN, BOYS, GIRLS"},
                        "audience": {"type": "string", "description": "ADULT, KIDS"},
                        "category": {"type": "string", "description": "SHIRT, TROUSER, DRESS, etc."},
                        "unit": {"type": "string", "description": "IN or CM"}
                    }
                }
            ),
            get_size_chart
        )

        self.register(
            ToolDefinition(
                name="get_product_size_chart",
                description="Fetch product-specific or product-aware size guide.",
                permission_level=PermissionLevel.PUBLIC_READ,
                requires_auth=False,
                parameters_schema={
                    "type": "object",
                    "properties": {
                        "product_id": {"type": "integer", "description": "Product ID"},
                        "unit": {"type": "string", "description": "IN or CM"}
                    },
                    "required": ["product_id"]
                }
            ),
            get_product_size_chart
        )

        self.register(
            ToolDefinition(
                name="get_size_recommendation",
                description="Calculate rule-based size recommendation from configured ranges.",
                permission_level=PermissionLevel.PUBLIC_READ,
                requires_auth=False,
                parameters_schema={
                    "type": "object",
                    "properties": {
                        "measurements": {"type": "object", "description": "e.g. {'chest': 39}"},
                        "product_id": {"type": "integer"},
                        "gender": {"type": "string"},
                        "audience": {"type": "string"},
                        "category": {"type": "string"},
                        "unit": {"type": "string"}
                    },
                    "required": ["measurements"]
                }
            ),
            get_size_recommendation
        )

        self.register(
            ToolDefinition(
                name="convert_size_measurement",
                description="Convert measurement value between IN and CM.",
                permission_level=PermissionLevel.PUBLIC_READ,
                requires_auth=False,
                parameters_schema={
                    "type": "object",
                    "properties": {
                        "value": {"type": "number"},
                        "from_unit": {"type": "string"},
                        "to_unit": {"type": "string"}
                    },
                    "required": ["value"]
                }
            ),
            convert_size_measurement
        )


registry = ToolRegistry()
