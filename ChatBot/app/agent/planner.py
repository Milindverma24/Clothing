from typing import Dict, Any, Optional
from app.core.constants import IntentType
from app.schemas.agent import AgentPlan, ExecutionPlanStep
from app.schemas.chat import PageContext
from app.core.security import AuthenticationContext


class Planner:
    """Builds explicit tool execution plans based on intent and context."""

    def plan(
        self,
        intent: IntentType,
        entities: Dict[str, Any],
        context: Optional[PageContext] = None,
        auth_context: Optional[AuthenticationContext] = None,
        pending_action: Optional[Dict[str, Any]] = None,
        confirmed: Optional[bool] = None
    ) -> AgentPlan:
        steps = []

        # 1. User is responding to a pending confirmation (e.g. Cancel Order)
        if pending_action and confirmed is True:
            action_type = pending_action.get("type")
            if action_type == "CANCEL_ORDER":
                order_id = int(pending_action.get("resource_id"))
                steps.append(ExecutionPlanStep(
                    step_id=1,
                    tool_name="cancel_order",
                    arguments={"order_id": order_id},
                    description=f"Cancel order #{order_id} after customer confirmed",
                    requires_confirmation=True
                ))
                return AgentPlan(intent=IntentType.ORDER_CANCEL, steps=steps)

        # 2. Intent-specific planning
        if intent == IntentType.PRODUCT_SEARCH:
            search_query = entities.get("query", "")
            steps.append(ExecutionPlanStep(
                step_id=1,
                tool_name="search_products",
                arguments={
                    "query": search_query,
                    "category": entities.get("category"),
                    "color": entities.get("color"),
                    "max_price": entities.get("max_price"),
                    "limit": 8
                },
                description="Search clothing products matching criteria"
            ))

        elif intent == IntentType.ORDER_CREATE:
            steps.append(ExecutionPlanStep(
                step_id=1,
                tool_name="order_product",
                arguments={
                    "product_id": entities.get("product_id"),
                    "query": entities.get("query"),
                    "size": entities.get("size"),
                    "quantity": entities.get("quantity", 1),
                    "payment_method": "UPI"
                },
                description="Place in-chat order for requested product"
            ))

        elif intent == IntentType.ORDER_TRACKING:
            order_id = entities.get("order_id") or entities.get("order_number")
            tracking_number = entities.get("tracking_number")
            if order_id and not tracking_number:
                steps.append(ExecutionPlanStep(
                    step_id=1,
                    tool_name="show_order",
                    arguments={"order_id": order_id},
                    description=f"Fetch latest live order details for #{order_id}"
                ))
            else:
                steps.append(ExecutionPlanStep(
                    step_id=1,
                    tool_name="track_order",
                    arguments={
                        "tracking_number": tracking_number,
                        "order_id": order_id,
                        "order_number": entities.get("order_number")
                    },
                    description="Track delivery status and carrier updates"
                ))

        elif intent in [IntentType.ORDER_RETURN_REFUND, IntentType.RETURN_REQUEST]:
            order_id = entities.get("order_id") or entities.get("order_number")
            if order_id:
                steps.append(ExecutionPlanStep(
                    step_id=1,
                    tool_name="return_order",
                    arguments={
                        "order_id": order_id,
                        "reason": entities.get("reason", "Product does not fit")
                    },
                    description=f"Submit return request for order #{order_id} via Spring Boot"
                ))
            else:
                steps.append(ExecutionPlanStep(
                    step_id=1,
                    tool_name="track_order",
                    arguments={},
                    description="Retrieve recent trackable orders to identify return candidates"
                ))

        elif intent == IntentType.ORDER_CANCEL:
            order_id = entities.get("order_id") or entities.get("order_number") or (context.order_id if context else None)
            if order_id:
                steps.append(ExecutionPlanStep(
                    step_id=1,
                    tool_name="cancel_order",
                    arguments={"order_id": order_id, "reason": entities.get("reason", "Changed my mind")},
                    description=f"Cancel order #{order_id} via Spring Boot",
                    requires_confirmation=False
                ))
            else:
                steps.append(ExecutionPlanStep(
                    step_id=1,
                    tool_name="track_order",
                    arguments={},
                    description="Retrieve recent trackable orders to identify which to cancel"
                ))

        elif intent in [IntentType.ORDER_STATUS, IntentType.ORDER_LIST]:
            order_id = entities.get("order_id") or entities.get("order_number") or (context.order_id if context else None)
            if order_id:
                steps.append(ExecutionPlanStep(
                    step_id=1,
                    tool_name="show_order",
                    arguments={"order_id": order_id},
                    description=f"Fetch live details and actions for order #{order_id}"
                ))
            else:
                steps.append(ExecutionPlanStep(
                    step_id=1,
                    tool_name="track_order",
                    arguments={},
                    description="Fetch trackable orders for authenticated customer"
                ))

        elif intent == IntentType.CART_VIEW:
            steps.append(ExecutionPlanStep(
                step_id=1,
                tool_name="get_cart",
                arguments={},
                description="Retrieve customer's active cart"
            ))

        elif intent in [
            IntentType.POLICY_QUESTION,
            IntentType.RETURN_POLICY,
            IntentType.PAYMENT_QUESTION,
            IntentType.SHIPPING_QUESTION,
            IntentType.GENERAL_QUESTION
        ]:
            steps.append(ExecutionPlanStep(
                step_id=1,
                tool_name="search_knowledge_base",
                arguments={"query": entities.get("query") or intent.value.lower().replace("_", " ")},
                description="Search authoritative store knowledge base"
            ))

        elif intent == IntentType.SIZE_GUIDE:
            measurements = entities.get("measurements")
            product_id = entities.get("product_id") or (context.product_id if context else None)
            gender = entities.get("size_gender")
            audience = entities.get("size_audience")
            category = entities.get("size_category")
            unit = entities.get("unit", "IN")

            if measurements:
                steps.append(ExecutionPlanStep(
                    step_id=1,
                    tool_name="get_size_recommendation",
                    arguments={
                        "measurements": measurements,
                        "product_id": product_id,
                        "gender": gender or "MEN",
                        "audience": audience or "ADULT",
                        "category": category or "SHIRT",
                        "unit": unit
                    },
                    description="Calculate size recommendation from database ranges"
                ))
            elif entities.get("find_my_size"):
                # Customer requested to find their size: prompt for measurements
                return AgentPlan(intent=intent, steps=[])
            elif product_id and not entities.get("switch_gender"):
                steps.append(ExecutionPlanStep(
                    step_id=1,
                    tool_name="get_product_size_chart",
                    arguments={
                        "product_id": product_id,
                        "unit": unit
                    },
                    description=f"Fetch product size guide for #{product_id}"
                ))
            elif gender and audience and category:
                steps.append(ExecutionPlanStep(
                    step_id=1,
                    tool_name="get_size_chart",
                    arguments={
                        "gender": gender,
                        "audience": audience,
                        "category": category,
                        "unit": unit
                    },
                    description=f"Fetch {gender} {audience} {category} size chart"
                ))

        elif intent == IntentType.STORE_INFO:
            steps.append(ExecutionPlanStep(
                step_id=1,
                tool_name="search_knowledge_base",
                arguments={"query": "about brand catalog"},
                description="Retrieve brand catalog info"
            ))
            steps.append(ExecutionPlanStep(
                step_id=2,
                tool_name="search_products",
                arguments={"query": "shirt", "limit": 3},
                description="Retrieve featured signature apparel items"
            ))

        elif intent == IntentType.STYLING_ADVICE:
            search_query = entities.get("query") or entities.get("category") or "shirt"
            steps.append(ExecutionPlanStep(
                step_id=1,
                tool_name="search_products",
                arguments={
                    "query": search_query,
                    "category": entities.get("category"),
                    "color": entities.get("color"),
                    "limit": 3
                },
                description="Retrieve matching apparel for styling recommendation"
            ))

        elif intent == IntentType.HUMAN_SUPPORT:
            steps.append(ExecutionPlanStep(
                step_id=1,
                tool_name="escalate_to_human",
                arguments={"reason": "Customer requested human support"},
                description="Initiate human support handoff"
            ))

        return AgentPlan(intent=intent, steps=steps)


planner = Planner()
