import time
import json
import uuid
from typing import Optional, List, Dict, Any, Tuple
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import (
    IntentType,
    ConversationState,
    MessageType,
    SenderType,
    ActionStatus
)
from app.core.security import AuthenticationContext
from app.schemas.chat import (
    ChatRequest,
    ChatResponse,
    ActionPayload,
    SourceCitation
)
from app.schemas.product import ProductDTO
from app.schemas.order import OrderDTO
from app.agent.intent import intent_detector
from app.agent.guardrails import guardrails
from app.agent.planner import planner
from app.agent.executor import executor
from app.agent.memory import memory
from app.services.conversation_service import conversation_service
from app.services.llm_service import llm_service
from app.services.springboot_client import springboot_client
from app.core.logging import logger
from app.core.exceptions import AICommerceBaseException


def format_size_chart_markdown_table(chart_data: dict, highlight_size: str = None) -> str:
    """Format a clean, beautiful Markdown table for the size chart."""
    entries = chart_data.get("entries", [])
    if not entries:
        return ""

    unit = chart_data.get("unit", "IN")
    u_suffix = "\"" if unit == "IN" else " cm"
    cols = chart_data.get("measurementColumns") or ["chest", "waist", "shoulder"]

    headers = ["Size"] + [c.capitalize() for c in cols]
    header_row = "| " + " | ".join(headers) + " |"
    sep_row = "| " + " | ".join([":---" if i == 0 else "---:" for i in range(len(headers))]) + " |"

    rows = []
    for e in entries:
        sz = e.get("size", "")
        is_highlight = highlight_size and sz.strip().upper() == highlight_size.strip().upper()

        row_cells = []
        if is_highlight:
            row_cells.append(f"**{sz} (Recommended)**")
        else:
            row_cells.append(f"**{sz}**")

        for c in cols:
            fmt = e.get(f"{c}Formatted")
            if not fmt:
                min_v = e.get(f"{c}Min")
                max_v = e.get(f"{c}Max")
                if min_v is not None and max_v is not None:
                    fmt = f"{min_v:g}-{max_v:g}{u_suffix}"
                elif min_v is not None:
                    fmt = f"{min_v:g}{u_suffix}"
                else:
                    fmt = "—"
            if is_highlight:
                row_cells.append(f"**{fmt}**")
            else:
                row_cells.append(str(fmt))

        rows.append("| " + " | ".join(row_cells) + " |")

    return "\n".join([header_row, sep_row] + rows)


class CommerceAgent:
    """Master AI Commerce Agent Orchestrator."""

    async def process_chat(
        self,
        request: ChatRequest,
        auth_context: AuthenticationContext,
        db: AsyncSession
    ) -> ChatResponse:
        start_time = time.time()
        
        # Robust multi-client isolation: ensure no two clients share a session
        if auth_context.customer_id:
            user_identifier = f"user_{auth_context.customer_id}"
        elif request.session_id:
            user_identifier = request.session_id
        elif request.conversation_id:
            user_identifier = request.conversation_id
        else:
            user_identifier = f"guest_{uuid.uuid4().hex[:12]}"

        # 1. Guardrail checks: Rate Limiting & Prompt Injection
        guardrails.check_rate_limit(user_identifier)
        guardrails.inspect_prompt_injection(request.message)

        # 2. Retrieve or create conversation session
        conv = await conversation_service.get_or_create_conversation(
            db=db,
            conversation_id=request.conversation_id,
            session_id=user_identifier,
            user_id=auth_context.customer_id
        )
        conversation_id = conv.id

        # 3. Persist incoming user message
        await conversation_service.add_message(
            db=db,
            conversation_id=conversation_id,
            sender=SenderType.USER,
            content=request.message
        )

        # 4. Intent detection & entity extraction
        intent_res = intent_detector.detect(request.message)
        intent = intent_res.intent
        memory.update_entities(conversation_id, intent_res.entities)
        merged_entities = memory.get_context(conversation_id)

        # Do not inherit prior tracking/order numbers if user didn't mention an explicit order in this message
        effective_entities = dict(merged_entities)
        has_explicit_order = any(k in intent_res.entities for k in ["order_id", "order_number", "tracking_number"])
        if not has_explicit_order:
            if intent == IntentType.ORDER_TRACKING:
                effective_entities.pop("order_id", None)
                effective_entities.pop("order_number", None)
                effective_entities.pop("tracking_number", None)
            elif intent in [IntentType.ORDER_RETURN_REFUND, IntentType.RETURN_REQUEST]:
                effective_entities.pop("order_id", None)
                effective_entities.pop("order_number", None)
        # Contextual size guide category selection when in active size flow
        if merged_entities.get("size_gender") and merged_entities.get("size_audience") and not merged_entities.get("size_category"):
            low_text = request.message.lower().strip()
            if any(c in low_text for c in ["shirt", "t-shirt", "tshirt", "tee", "top", "pant", "trouser", "jean", "dress"]):
                intent = IntentType.SIZE_GUIDE
                if any(c in low_text for c in ["shirt", "t-shirt", "tshirt", "tee", "polo"]):
                    effective_entities["size_category"] = "SHIRT"
                    memory.update_context(conversation_id, "size_category", "SHIRT")
                elif any(c in low_text for c in ["trouser", "pant", "bottom"]):
                    effective_entities["size_category"] = "TROUSER"
                    memory.update_context(conversation_id, "size_category", "TROUSER")
                elif "jean" in low_text:
                    effective_entities["size_category"] = "JEANS"
                    memory.update_context(conversation_id, "size_category", "JEANS")
                elif "dress" in low_text:
                    effective_entities["size_category"] = "DRESS"
                    memory.update_context(conversation_id, "size_category", "DRESS")
                elif "top" in low_text:
                    effective_entities["size_category"] = "TOP"
                    memory.update_context(conversation_id, "size_category", "TOP")

        # Fresh Size Guide flow reset
        if intent == IntentType.SIZE_GUIDE:
            msg_lower = request.message.lower()
            if any(p in msg_lower for p in ["size guide", "what size should i", "help me choose a size", "what size am i", "show size chart"]):
                if not any(g in msg_lower for g in ["men", "women", "boy", "girl"]):
                    effective_entities.pop("size_gender", None)
                    effective_entities.pop("size_audience", None)
                    effective_entities.pop("size_category", None)
                    memory.update_context(conversation_id, "size_gender", None)
                    memory.update_context(conversation_id, "size_audience", None)
                    memory.update_context(conversation_id, "size_category", None)
            elif "switch" in msg_lower and ("women" in msg_lower or "girl" in msg_lower):
                effective_entities["size_gender"] = "WOMEN"
                effective_entities.pop("size_category", None)
                memory.update_context(conversation_id, "size_gender", "WOMEN")
                memory.update_context(conversation_id, "size_category", None)
            elif "switch" in msg_lower and ("men" in msg_lower or "boy" in msg_lower):
                effective_entities["size_gender"] = "MEN"
                effective_entities.pop("size_category", None)
                memory.update_context(conversation_id, "size_gender", "MEN")
                memory.update_context(conversation_id, "size_category", None)

        # 5. Planning
        plan = planner.plan(
            intent=intent,
            entities=effective_entities,
            context=request.context,
            auth_context=auth_context,
            pending_action=conv.pending_action,
            confirmed=request.confirmed_action
        )

        # 6. Execution
        tool_results = await executor.execute_plan(
            plan=plan,
            auth_context=auth_context,
            customer_token=auth_context.raw_token,
            has_user_confirmed=request.confirmed_action,
            pending_action=conv.pending_action
        )

        # 7. Response Synthesis & Entity Mapping
        products: List[ProductDTO] = []
        cards: List[Dict[str, Any]] = []
        actions: List[Dict[str, Any]] = []
        order_dto: Optional[OrderDTO] = None
        action_payload: Optional[ActionPayload] = None
        sources: List[SourceCitation] = []
        final_message = ""
        msg_type = MessageType.TEXT
        requires_confirmation = False

        for tr in tool_results:
            # Audit tool execution
            await conversation_service.record_tool_call(
                db=db,
                conversation_id=conversation_id,
                tool_name=tr.tool_name,
                permission="VERIFIED",
                status=tr.status,
                args_redacted={},
                result_redacted={"status": tr.status},
                latency_ms=round((time.time() - start_time) * 1000, 2)
            )

            # Map products
            if tr.tool_name == "search_products" and tr.success and isinstance(tr.data, list):
                products = [ProductDTO(**p) for p in tr.data]
                if products:
                    final_message = f"Here are {len(products)} items matching your request. Click any piece below to open it on our store:"
                    msg_type = MessageType.PRODUCT_LIST
                    for p in products:
                        cards.append({
                            "card_type": "PRODUCT",
                            "id": p.id,
                            "title": p.name,
                            "subtitle": f"₹{p.basePrice:,.2f}" + (f" • {p.baseColour}" if p.baseColour else ""),
                            "price": p.basePrice,
                            "image": p.imageUrl or f"/images/{p.id}.jpg",
                            "url": f"/products/{p.slug or p.id}",
                            "slug": p.slug or str(p.id),
                            "data": p.model_dump()
                        })
                else:
                    final_message = "I couldn't find an exact match for that search in our current catalog. You can try searching with a different color, size, or category."

            # Map single product
            elif tr.tool_name == "get_product" and tr.success and isinstance(tr.data, dict):
                p_dto = ProductDTO(**tr.data)
                products = [p_dto]
                final_message = f"**{p_dto.name}** — ₹{p_dto.basePrice:,.0f}\n\n{p_dto.description or ''}"
                msg_type = MessageType.PRODUCT
                cards.append({
                    "card_type": "PRODUCT",
                    "id": p_dto.id,
                    "title": p_dto.name,
                    "subtitle": f"₹{p_dto.basePrice:,.2f}" + (f" • {p_dto.baseColour}" if p_dto.baseColour else ""),
                    "price": p_dto.basePrice,
                    "image": p_dto.imageUrl or f"/images/{p_dto.id}.jpg",
                    "url": f"/products/{p_dto.slug or p_dto.id}",
                    "slug": p_dto.slug or str(p_dto.id),
                    "data": p_dto.model_dump()
                })

            # Map orders
            elif tr.tool_name in ["get_orders", "get_order"] and tr.success:
                if isinstance(tr.data, list) and tr.data:
                    order_dto = OrderDTO(**tr.data[0])
                    lines = [
                        f"Here is your recent order **#{order_dto.orderNumber}**:",
                        f"• **Status**: {order_dto.status}",
                        f"• **Total Amount**: ₹{order_dto.totalAmount:,.2f}"
                    ]
                    if order_dto.trackingNumber:
                        lines.append(f"• **Tracking Number**: `{order_dto.trackingNumber}`")
                    final_message = "\n".join(lines)
                    msg_type = MessageType.ORDER
                    for o in tr.data:
                        od = OrderDTO(**o)
                        cards.append({
                            "card_type": "ORDER_STATUS",
                            "title": f"Order #{od.orderNumber}",
                            "subtitle": od.status,
                            "data": od.model_dump()
                        })
                elif isinstance(tr.data, dict) and tr.data:
                    order_dto = OrderDTO(**tr.data)
                    lines = [
                        f"Order **#{order_dto.orderNumber}** details:",
                        f"• **Status**: {order_dto.status}",
                        f"• **Total Amount**: ₹{order_dto.totalAmount:,.2f}"
                    ]
                    if order_dto.trackingNumber:
                        lines.append(f"• **Tracking Number**: `{order_dto.trackingNumber}`")
                    final_message = "\n".join(lines)
                    msg_type = MessageType.ORDER
                    cards.append({
                        "card_type": "ORDER_STATUS",
                        "title": f"Order #{order_dto.orderNumber}",
                        "subtitle": order_dto.status,
                        "data": order_dto.model_dump()
                    })
                else:
                    final_message = tr.message or "You have no recent orders."
                    if tr.status == "AUTH_REQUIRED" or "sign in" in (tr.message or "").lower():
                        actions.append({"label": "Sign In / Register", "action": "LOGIN", "style": "primary"})

            # Map cancellation confirmation request
            elif tr.tool_name == "check_cancellation_eligibility" and tr.requires_confirmation:
                requires_confirmation = True
                msg_type = MessageType.CONFIRMATION
                final_message = tr.message
                action_payload = ActionPayload(
                    type="CANCEL_ORDER",
                    resource_id=tr.confirmation_payload.get("resource_id"),
                    status=ActionStatus.PENDING_CONFIRMATION,
                    summary=tr.confirmation_payload.get("summary"),
                    requires_confirmation=True,
                    details=tr.confirmation_payload.get("details", {})
                )
                actions.append({"label": "Cancel Order", "action": "CONFIRM_CANCEL", "style": "destructive"})
                actions.append({"label": "Keep Order", "action": "KEEP_ORDER", "style": "secondary"})
                # Persist pending action in session
                await conversation_service.set_pending_action(db, conv, action_payload.model_dump())

            # Map verified order cancellation
            elif tr.tool_name == "cancel_order":
                if tr.success:
                    final_message = tr.message
                    action_payload = ActionPayload(
                        type="CANCEL_ORDER",
                        status=ActionStatus.SUCCESS,
                        summary="Order Cancellation Verified"
                    )
                    # Clear pending action after successful execution
                    await conversation_service.set_pending_action(db, conv, None)
                    await conversation_service.record_audit_log(
                        db=db,
                        action_type="CANCEL_ORDER",
                        status="VERIFIED",
                        conversation_id=conversation_id,
                        user_id=auth_context.customer_id
                    )
                else:
                    final_message = tr.message or "We could not complete the cancellation."

            # Map in-chat order creation
            elif tr.tool_name == "order_product":
                final_message = tr.message
                if getattr(tr, "cards", None):
                    cards.extend(tr.cards)
                if not tr.success and "sign in" in (tr.message or "").lower():
                    actions.append({"label": "Sign In to Order", "action": "LOGIN", "style": "primary"})

            # Map order tracking
            elif tr.tool_name == "track_order":
                final_message = tr.message
                if getattr(tr, "cards", None):
                    cards.extend(tr.cards)
                if getattr(tr, "actions", None):
                    actions.extend(tr.actions)
                if not tr.success and "sign in" in (tr.message or "").lower():
                    if not any(a.get("action") == "LOGIN" for a in actions):
                        actions.append({"label": "Sign In / Register", "action": "LOGIN", "style": "primary"})

            # Map live show order
            elif tr.tool_name == "show_order":
                final_message = tr.message
                if getattr(tr, "cards", None):
                    cards.extend(tr.cards)
                if getattr(tr, "actions", None):
                    actions.extend(tr.actions)
                if not tr.success and "sign in" in (tr.message or "").lower():
                    if not any(a.get("action") == "LOGIN" for a in actions):
                        actions.append({"label": "Sign In / Register", "action": "LOGIN", "style": "primary"})

            # Map return and refund requests
            elif tr.tool_name in ["return_order", "request_return_and_refund"]:
                final_message = tr.message
                if getattr(tr, "cards", None):
                    cards.extend(tr.cards)
                if getattr(tr, "actions", None):
                    actions.extend(tr.actions)
                if not tr.success and "sign in" in (tr.message or "").lower():
                    actions.append({"label": "Sign In / Register", "action": "LOGIN", "style": "primary"})

            # Map RAG policy responses
            elif tr.tool_name == "search_knowledge_base" and tr.success and isinstance(tr.data, dict):
                final_message = tr.data.get("content", "")
                sources = [SourceCitation(**s) for s in tr.data.get("sources", [])]
                if sources:
                    msg_type = MessageType.SOURCE

            # Map Human Escalation
            elif tr.tool_name == "escalate_to_human":
                msg_type = MessageType.ESCALATION
                final_message = tr.message
                conv.status = "ESCALATED"

            # Map size chart results
            elif tr.tool_name in ["get_size_chart", "get_product_size_chart"] and tr.success and isinstance(tr.data, dict):
                chart_data = tr.data
                chart_name = chart_data.get("name") or "Garment Size Guide"
                unit = chart_data.get("unit", "IN")
                table_md = format_size_chart_markdown_table(chart_data)

                meas_guide_lines = []
                for k, v in (chart_data.get("howToMeasure") or {}).items():
                    meas_guide_lines.append(f"• **{k}**: {v}")
                meas_guide_str = ("\n**How to Measure:**\n" + "\n".join(meas_guide_lines) + "\n") if meas_guide_lines else ""

                final_message = (
                    f"Here is the authoritative **{chart_name}** ({unit}):\n\n"
                    f"{table_md}\n"
                    f"{meas_guide_str}\n"
                    "Use the interactive visual chart below to view measurements or toggle between **[IN]** and **[CM]**. Click **Find My Size** to calculate your exact fit."
                )
                cards.append({
                    "card_type": "SIZE_CHART",
                    "id": chart_data.get("id"),
                    "title": chart_name,
                    "subtitle": f"{chart_data.get('gender', 'MEN')} • {chart_data.get('audience', 'ADULT')} • {chart_data.get('category', 'SHIRT')}",
                    "data": chart_data
                })
                actions.append({"label": "📏 Find My Size", "action": "FIND_MY_SIZE", "style": "primary"})
                g = str(chart_data.get("gender") or "MEN").upper()
                if "MEN" in g or "BOY" in g:
                    actions.append({"label": "👩 Switch to Women / Girls", "action": "SWITCH_TO_WOMEN", "style": "secondary"})
                else:
                    actions.append({"label": "👨 Switch to Men / Boys", "action": "SWITCH_TO_MEN", "style": "secondary"})
                actions.append({"label": "🔄 Change Category", "action": "SIZE_CHANGE_CAT", "style": "secondary"})

            # Map size recommendation results
            elif tr.tool_name == "get_size_recommendation" and tr.success and isinstance(tr.data, dict):
                rec_data = tr.data
                rec_size = rec_data.get("recommendedSize", "M")
                confidence = rec_data.get("confidence", "HIGH")
                fit = rec_data.get("fit", "Regular")
                chart_name = rec_data.get("chartName", "Size Chart")

                # Retrieve chart data (from backend response or fallback fetch)
                chart_data = rec_data.get("sizeChart")
                if not chart_data:
                    try:
                        chart_data = await springboot_client.get_size_chart(
                            gender=effective_entities.get("size_gender", "MEN"),
                            audience=effective_entities.get("size_audience", "ADULT"),
                            category=effective_entities.get("size_category", "SHIRT"),
                            unit=effective_entities.get("unit", "IN")
                        )
                    except Exception:
                        chart_data = None

                unit = (chart_data.get("unit") if chart_data else None) or rec_data.get("unit", "IN")
                table_md = ""
                if chart_data and isinstance(chart_data, dict):
                    table_md = format_size_chart_markdown_table(chart_data, highlight_size=rec_size)

                meas_lines = []
                for k, v in (rec_data.get("matchedMeasurements") or {}).items():
                    user_val = v.get("user")
                    fmt = v.get("formatted")
                    u = v.get("unit", "IN")
                    u_suffix = "\"" if u == "IN" else " cm"
                    meas_lines.append(f"• **{k.capitalize()}**: {fmt} (Your measurement: {user_val}{u_suffix})")

                meas_str = "\n".join(meas_lines)
                table_section = f"\n**{chart_name} ({unit}):**\n\n{table_md}\n" if table_md else ""

                final_message = (
                    f"Based on the configured **{chart_name}**, **{rec_size}** is the closest match for your body measurements.\n\n"
                    f"• **Recommended Size:** **{rec_size}**\n"
                    f"• **Fit Profile:** {fit} ({confidence} confidence)\n"
                    + (f"{meas_str}\n" if meas_str else "")
                    + table_section + "\n"
                    "*Size recommendations are based on the available size chart. Fit can vary by product, brand, and style.*"
                )
                cards.append({
                    "card_type": "SIZE_RECOMMENDATION",
                    "title": f"Recommended Size: {rec_size}",
                    "subtitle": f"Fit: {fit} • {chart_name}",
                    "data": {**rec_data, "sizeChart": chart_data}
                })

                if chart_data and isinstance(chart_data, dict):
                    cards.append({
                        "card_type": "SIZE_CHART",
                        "id": chart_data.get("id"),
                        "title": chart_name,
                        "subtitle": f"{chart_data.get('gender', 'MEN')} • {chart_data.get('audience', 'ADULT')} • {chart_data.get('category', 'SHIRT')}",
                        "data": {**chart_data, "highlightSize": rec_size}
                    })

                actions.append({"label": f"Select {rec_size}", "action": f"SELECT_SIZE_{rec_size}", "style": "primary"})
                actions.append({"label": "📊 View Full Size Chart", "action": "VIEW_SIZE_CHART", "style": "secondary"})

        # Fallback response if no specific tool result set message
        if not final_message:
            if intent == IntentType.SIZE_GUIDE:
                user_msg_lower = request.message.lower().strip()
                if "find my size" in user_msg_lower or "find_my_size" in user_msg_lower:
                    final_message = (
                        "Let's find your perfect size! What measurement do you have?\n\n"
                        "Please enter your measurement in inches or centimeters (for example: **'My chest is 39 inches'** or **'Waist 32'**):"
                    )
                    actions.extend([
                        {"label": "Chest 38\"", "action": "MEASURE_CHEST_38", "style": "secondary"},
                        {"label": "Chest 39\"", "action": "MEASURE_CHEST_39", "style": "secondary"},
                        {"label": "Chest 40\"", "action": "MEASURE_CHEST_40", "style": "secondary"},
                        {"label": "Waist 32\"", "action": "MEASURE_WAIST_32", "style": "secondary"}
                    ])
                elif effective_entities.get("selected_size"):
                    sz = effective_entities["selected_size"]
                    final_message = (
                        f"Size **{sz}** selected.\n\n"
                        f"Would you like to check whether **{sz}** is the right fit for your body measurements, or view the full size chart?"
                    )
                    actions.extend([
                        {"label": f"Check Size {sz}", "action": "FIND_MY_SIZE", "style": "primary"},
                        {"label": "📊 Size Guide", "action": "VIEW_SIZE_CHART", "style": "secondary"}
                    ])
                elif not effective_entities.get("size_gender"):
                    final_message = (
                        "**SIZE GUIDE**\n\n"
                        "Who are you shopping for?"
                    )
                    actions.extend([
                        {"label": "👨 Men / Boys", "action": "SIZE_GENDER_MEN", "style": "primary"},
                        {"label": "👩 Women / Girls", "action": "SIZE_GENDER_WOMEN", "style": "primary"}
                    ])
                elif not effective_entities.get("size_audience"):
                    final_message = "Is this for an adult or a child?"
                    actions.extend([
                        {"label": "Adult", "action": "SIZE_AUDIENCE_ADULT", "style": "primary"},
                        {"label": "Kids", "action": "SIZE_AUDIENCE_KIDS", "style": "secondary"}
                    ])
                elif not effective_entities.get("size_category"):
                    final_message = "Which type of clothing?"
                    gender_val = effective_entities.get("size_gender", "MEN")
                    if gender_val in ["WOMEN", "GIRLS"]:
                        actions.extend([
                            {"label": "Tops / Shirts", "action": "SIZE_CAT_TOP", "style": "primary"},
                            {"label": "Dresses", "action": "SIZE_CAT_DRESS", "style": "secondary"},
                            {"label": "Jeans / Trousers", "action": "SIZE_CAT_JEANS", "style": "secondary"}
                        ])
                    else:
                        actions.extend([
                            {"label": "Shirt / T-Shirt", "action": "SIZE_CAT_SHIRT", "style": "primary"},
                            {"label": "Trousers / Jeans", "action": "SIZE_CAT_TROUSER", "style": "secondary"}
                        ])

            elif intent == IntentType.GREETING:
                final_message = (
                    "Hello! Welcome to CLOTHING. I am your 24/7 personal shopping assistant.\n\n"
                    "I can help you with:\n"
                    "• Discovering items in our collection (e.g., 'Black shirts under ₹1500')\n"
                    "• Live order tracking & delivery status (e.g., 'Where is my order?')\n"
                    "• Returns, refunds, and exchange policies\n"
                    "• Size guide & outfit styling recommendations\n\n"
                    "What can I help you find or track today?"
                )
                actions.extend([
                    {"label": "🔍 Search Shirts", "action": "SEARCH_SHIRTS", "style": "secondary"},
                    {"label": "📦 Track Order", "action": "TRACK_ORDER", "style": "secondary"},
                    {"label": "↩️ Return Policy", "action": "RETURN_POLICY", "style": "secondary"}
                ])

            elif intent == IntentType.GRATITUDE:
                final_message = (
                    "You're very welcome! If you need any more recommendations or have questions about your orders, "
                    "I'm always right here. Happy shopping!"
                )

            elif intent == IntentType.STYLING_ADVICE and not products:
                final_message = (
                    "For a sharp, modern look, here are our styling team's favorite combinations:\n\n"
                    "• **Monochrome Minimal**: Pair a crisp Black Oxford Shirt with relaxed charcoal trousers and white sneakers.\n"
                    "• **Layered Smart Casual**: Wear an open Navy Blue shirt over an organic white ribbed tee.\n"
                    "• **Streetwear Comfort**: A Boxy Heavyweight Hoodie with dark wash denim and slides.\n\n"
                    "Would you like me to find items matching any of these styles for you?"
                )

            elif intent == IntentType.STORE_INFO and not products:
                final_message = (
                    "**About CLOTHING**\n\n"
                    "We design minimal, functional everyday movement wear crafted from premium sustainable fabrics. "
                    "Our lineup includes 100% combed cotton t-shirts, tailored oxford shirts, 380 GSM fleece hoodies, and comfort footwear.\n\n"
                    "Would you like me to show you our popular shirts or new arrivals?"
                )

            else:
                # Generate conversational response using LLM service
                llm_reply = await llm_service.generate(
                    messages=[{"role": "user", "content": request.message}],
                    system_prompt=(
                        "You are the intelligent digital personal shopper and customer concierge for CLOTHING, "
                        "a premium modern clothing brand. Answer clearly, accurately, and warmly in 1-2 concise paragraphs. "
                        "Connect your answer back to how the customer can shop, track orders, or manage their wardrobe."
                    )
                )
                final_message = llm_reply or "I am here to assist with product discovery, order tracking, returns, and bag management. How can I help you today?"

        # Sanitize final response
        clean_text = guardrails.sanitize_output(final_message)

        # 8. Persist Assistant Response in DB
        assistant_msg = await conversation_service.add_message(
            db=db,
            conversation_id=conversation_id,
            sender=SenderType.ASSISTANT,
            content=clean_text,
            message_type=msg_type,
            intent=intent.value,
            payload={
                "products": [p.model_dump() for p in products],
                "action": action_payload.model_dump() if action_payload else None,
                "sources": [s.model_dump() for s in sources]
            }
        )

        # 8b. Synchronize turn to Unified System Database via Spring Boot
        try:
            from app.services.springboot_client import springboot_client
            num_conv_id = None
            if request.conversation_id and str(request.conversation_id).isdigit():
                num_conv_id = int(request.conversation_id)
            
            p_ids = [p.id for p in products if p.id is not None]
            s_dicts = [s.model_dump() for s in sources]
            latency_ms = int((time.time() - start_time) * 1000)

            sync_res = await springboot_client.sync_conversation_turn(
                user_message=request.message,
                assistant_message=clean_text,
                conversation_id=num_conv_id,
                session_id=user_identifier,
                user_name=auth_context.name or (auth_context.email.split('@')[0].capitalize() if auth_context.email else "Customer"),
                user_email=auth_context.email,
                intent=intent.value if hasattr(intent, "value") else str(intent),
                product_ids=p_ids,
                sources=s_dicts,
                latency_ms=latency_ms
            )
            if sync_res and sync_res.get("conversationId"):
                conversation_id = str(sync_res.get("conversationId"))
        except Exception as e:
            logger.error(f"Error syncing chat turn to unified Spring Boot database: {e}")

        return ChatResponse(
            conversation_id=conversation_id,
            message_id=assistant_msg.id,
            type=msg_type,
            intent=intent,
            message=clean_text,
            requires_confirmation=requires_confirmation,
            action=action_payload,
            products=products,
            cards=cards,
            actions=actions,
            order=order_dto,
            sources=sources
        )


commerce_agent = CommerceAgent()
