from typing import Optional, List, Any, Dict
from datetime import datetime, timezone
from app.services.springboot_client import springboot_client
from app.schemas.tool import ToolResult
from app.core.exceptions import OrderNotEligibleError
from app.core.logging import logger


async def get_orders(customer_token: Optional[str] = None, **kwargs) -> ToolResult:
    """Retrieves authenticated customer's recent orders."""
    if not customer_token:
        return ToolResult(
            success=False,
            tool_name="get_orders",
            status="FAILED",
            message="Please sign in to view and track your orders."
        )

    try:
        orders = await springboot_client.get_orders(customer_token)
        if not orders:
            return ToolResult(
                success=True,
                tool_name="get_orders",
                status="COMPLETED",
                data=[],
                message="You don't have any placed orders in your account yet. Once you place an order, you can track its delivery, items, and status right here!"
            )
        return ToolResult(
            success=True,
            tool_name="get_orders",
            status="COMPLETED",
            data=[o.model_dump() for o in orders],
            message=f"Found {len(orders)} recent order(s)."
        )
    except Exception as e:
        logger.error(f"Error in get_orders tool: {e}")
        return ToolResult(
            success=False,
            tool_name="get_orders",
            status="FAILED",
            error=str(e),
            message="Could not retrieve your orders."
        )


async def get_order(order_id: int, customer_token: Optional[str] = None, **kwargs) -> ToolResult:
    """Retrieves details of a specific order."""
    if not customer_token:
        return ToolResult(
            success=False,
            tool_name="get_order",
            status="FAILED",
            message="Please sign in to view order details."
        )

    try:
        order = await springboot_client.get_order(order_id, customer_token)
        if order:
            return ToolResult(
                success=True,
                tool_name="get_order",
                status="COMPLETED",
                data=order.model_dump(),
                message=f"Retrieved order #{order_id} (Status: {order.status})."
            )
        return ToolResult(
            success=False,
            tool_name="get_order",
            status="FAILED",
            message=f"Order #{order_id} could not be found."
        )
    except Exception as e:
        return ToolResult(
            success=False,
            tool_name="get_order",
            status="FAILED",
            error=str(e),
            message=f"Could not load order #{order_id}."
        )


async def check_cancellation_eligibility(order_id: int, customer_token: Optional[str] = None, **kwargs) -> ToolResult:
    """Checks whether an order can be cancelled and returns confirmation details."""
    if not customer_token:
        return ToolResult(
            success=False,
            tool_name="check_cancellation_eligibility",
            status="FAILED",
            message="Please sign in to manage your order."
        )

    try:
        eligibility = await springboot_client.get_cancellation_eligibility(order_id, customer_token)
        if eligibility.eligible:
            return ToolResult(
                success=True,
                tool_name="check_cancellation_eligibility",
                status="CONFIRMATION_REQUIRED",
                requires_confirmation=True,
                confirmation_payload={
                    "type": "CANCEL_ORDER",
                    "resource_id": str(order_id),
                    "summary": f"Cancel Order #{order_id}",
                    "details": eligibility.model_dump()
                },
                message=f"Your order #{order_id} is eligible for cancellation. This action cannot be undone. Would you like me to cancel it?"
            )
        return ToolResult(
            success=False,
            tool_name="check_cancellation_eligibility",
            status="FAILED",
            message=eligibility.reason or f"Order #{order_id} is not eligible for cancellation."
        )
    except Exception as e:
        return ToolResult(
            success=False,
            tool_name="check_cancellation_eligibility",
            status="FAILED",
            error=str(e),
            message="Could not verify cancellation eligibility."
        )


async def cancel_order(order_id: Any, reason: str = "Changed mind", customer_token: Optional[str] = None, **kwargs) -> ToolResult:
    """Executes cancellation through Spring Boot Order Service and verifies updated database state."""
    if not customer_token:
        return ToolResult(
            success=False,
            tool_name="cancel_order",
            status="FAILED",
            message="Please sign in to cancel your order."
        )

    try:
        # Step 1: Call Spring Boot cancellation API
        await springboot_client.cancel_order(order_id, customer_token, reason=reason)

        # Step 2: Post-action verification (Live state from Spring Boot / PostgreSQL)
        verified_data = await springboot_client.get_raw_order_detail(order_id, customer_token)
        ord_num = (verified_data.get("orderId") if verified_data else None) or str(order_id)
        verified_status = (verified_data.get("status") if verified_data else None) or "CANCELLED"

        card = {
            "card_type": "ORDER_STATUS",
            "id": verified_data.get("id") if verified_data else order_id,
            "title": f"Order #{ord_num}",
            "subtitle": "CANCELLED",
            "price": float(verified_data.get("total", 0.0)) if verified_data else 0.0,
            "data": verified_data or {"orderId": ord_num, "status": "CANCELLED"}
        }

        actions = [
            {"label": "🔍 Show Order", "action": f"SHOW_ORDER_{ord_num}", "style": "primary"},
            {"label": "💬 Contact Support", "action": "HUMAN_SUPPORT", "style": "secondary"}
        ]

        return ToolResult(
            success=True,
            tool_name="cancel_order",
            status="COMPLETED",
            message=f"Your order {ord_num} has been cancelled successfully.\n• **Status:** **CANCELLED**\n• **Cancellation:** **COMPLETED**\n• **Refund:** Initiated to original payment method.",
            cards=[card],
            actions=actions,
            data=verified_data or {"orderId": ord_num, "status": verified_status}
        )
    except OrderNotEligibleError as e:
        return ToolResult(
            success=False,
            tool_name="cancel_order",
            status="FAILED",
            message=str(e)
        )
    except Exception as e:
        logger.error(f"Error cancelling order #{order_id}: {e}")
        return ToolResult(
            success=False,
            tool_name="cancel_order",
            status="FAILED",
            error=str(e),
            message=f"We could not cancel order #{order_id} at this time. Please try again or contact support."
        )


async def order_product(
    product_id: Optional[int] = None,
    query: Optional[str] = None,
    size: Optional[str] = None,
    quantity: int = 1,
    address: Optional[str] = None,
    payment_method: str = "UPI",
    customer_token: Optional[str] = None,
    **kwargs
) -> ToolResult:
    """Places an order directly for a product by ID or search term."""
    product = None
    if product_id:
        product = await springboot_client.get_product(product_id)
    if not product and query:
        results = await springboot_client.search_products(query=query, limit=1)
        if results:
            product = results[0]

    if not product:
        return ToolResult(
            success=False,
            tool_name="order_product",
            status="FAILED",
            message="I couldn't locate the piece you requested. Please provide a product name or Product ID (e.g. 'Order product 101')."
        )

    chosen_size = (size or "M").upper()
    unit_price = float(product.basePrice or 0.0)
    qty = max(1, quantity)

    order_items = [{
        "productId": product.id,
        "productName": product.name,
        "name": product.name,
        "size": chosen_size,
        "quantity": qty,
        "unitPrice": unit_price,
        "finalPrice": unit_price * qty,
        "price": unit_price,
        "imageUrl": product.imageUrl or f"/images/{product.id}.jpg"
    }]

    res = await springboot_client.create_order(
        items=order_items,
        address=address or "Customer Default Address, Mumbai, Maharashtra 400001",
        payment_method=payment_method,
        customer_token=customer_token
    )

    if "error" in res:
        err_msg = str(res["error"])
        if "Authentication required" in err_msg or "Unauthorized" in err_msg:
            return ToolResult(
                success=False,
                tool_name="order_product",
                status="FAILED",
                message="To complete your order, please sign in to your CLOTHING account."
            )
        return ToolResult(
            success=False,
            tool_name="order_product",
            status="FAILED",
            message=f"Could not place order: {err_msg}"
        )

    order_num = res.get("orderNumber") or f"ORD-{res.get('id', 'NEW')}"
    trk_num = res.get("trackingNumber") or "TRK-PENDING"
    total_val = float(res.get("total") or (unit_price * qty))

    confirmation_card = {
        "card_type": "ORDER_CONFIRMATION",
        "id": res.get("id"),
        "title": f"Order #{order_num}",
        "subtitle": f"{product.name} (Size: {chosen_size})",
        "price": total_val,
        "image": product.imageUrl,
        "url": "/account/orders",
        "data": {
            "orderNumber": order_num,
            "trackingNumber": trk_num,
            "total": total_val,
            "status": res.get("status", "CONFIRMED"),
            "carrier": res.get("carrier", "BlueDart Express"),
            "items": order_items
        }
    }

    return ToolResult(
        success=True,
        tool_name="order_product",
        status="COMPLETED",
        data=res,
        cards=[confirmation_card],
        message=f"Done! Your order for **{product.name}** (Size: {chosen_size}, Qty: {qty}) has been placed!\n• **Order ID:** `{order_num}`\n• **Total:** ₹{total_val:,.2f}\n• **Tracking:** `{trk_num}`\n• **Payment:** {payment_method}\n\nYou can view live tracking in your Account Orders."
    )


async def track_order(
    tracking_number: Optional[str] = None,
    order_id: Optional[int] = None,
    order_number: Optional[str] = None,
    customer_token: Optional[str] = None,
    **kwargs
) -> ToolResult:
    """Tracks status and shipment details of an order using tracking number or ID."""
    clean_tracking = (tracking_number or order_number or "").strip()

    if clean_tracking:
        order_data = await springboot_client.track_order_by_number(clean_tracking)
        if order_data:
            ord_num = order_data.get("orderNumber") or f"ORD-{order_data.get('id')}"
            st = order_data.get("status", "IN_TRANSIT")
            carrier = order_data.get("carrier") or "BlueDart Express"
            trk = order_data.get("trackingNumber") or clean_tracking
            total_val = float(order_data.get("total") or order_data.get("totalAmount") or 0.0)
            ret_st = order_data.get("returnStatus")
            ref_ref = order_data.get("refundReference")
            ret_trk = order_data.get("returnTrackingNumber")

            subtitle = st
            if ret_st == "APPROVED":
                subtitle = f"Return Approved (Ref: {ref_ref or 'Active'})"
            elif ret_st == "AWAITING_APPROVAL":
                subtitle = "⚠️ Under Atelier Review"
            elif ret_st == "REFUNDED":
                subtitle = f"Refund Credited (Ref: {ref_ref or 'Done'})"
            elif ret_st == "RETURNED":
                subtitle = f"Item Received & Verified"

            card = {
                "card_type": "ORDER_STATUS",
                "id": order_data.get("id"),
                "title": f"Order #{ord_num}",
                "subtitle": subtitle,
                "price": total_val,
                "data": order_data
            }

            actions = []
            if order_data.get("canCancel") or st in ["PENDING", "CONFIRMED", "PROCESSING"]:
                actions.append({"label": f"❌ Cancel Order #{ord_num}", "action": f"CANCEL_{ord_num}", "style": "destructive"})
            actions.append({"label": "📦 View Orders Queue", "action": "TRACK_ORDER", "style": "secondary"})

            msg_lines = [
                f"📦 **Shipment Tracking for Order #{ord_num}**:",
                f"• **Order Status:** **{st}**",
                f"• **Carrier:** {carrier}",
                f"• **Outbound Tracking:** `{trk}`",
            ]
            if ret_st and ret_st != "NONE":
                msg_lines.append(f"• **Return Status:** **{ret_st}**")
            # Products ordered in this package
            raw_items = order_data.get("items", [])
            if raw_items:
                msg_lines.append("• **Products Ordered:**")
                for it in raw_items:
                    it_name = it.get("productName") or it.get("name") or "Garment"
                    it_sz = it.get("size", "M")
                    it_qty = it.get("quantity", 1)
                    it_pr = float(it.get("finalPrice") or it.get("price") or it.get("unitPrice") or 0.0)
                    msg_lines.append(f"  ↳ {it_name} (Size: {it_sz}, Qty: {it_qty}) — ₹{it_pr:,.2f}")

            return ToolResult(
                success=True,
                tool_name="track_order",
                status="COMPLETED",
                data=order_data,
                cards=[card],
                actions=actions,
                message="\n".join(msg_lines)
            )
        else:
            return ToolResult(
                success=False,
                tool_name="track_order",
                status="FAILED",
                actions=[
                    {"label": "📦 View Orders Queue", "action": "TRACK_ORDER", "style": "secondary"}
                ],
                message=f"I checked our logistics network, but could not find an active order matching tracking number `{clean_tracking}`. Please verify your tracking number or order number (e.g. TRK-... or ORD-...)."
            )

    if order_id and customer_token:
        order = await springboot_client.get_order(order_id, customer_token)
        if order:
            sub = order.status

            card = {
                "card_type": "ORDER_STATUS",
                "id": order.id,
                "title": f"Order #{order.orderNumber}",
                "subtitle": sub,
                "price": order.totalAmount,
                "data": order.model_dump()
            }
            actions = []
            if order.canCancel or order.status in ["PENDING", "CONFIRMED", "PROCESSING"]:
                actions.append({"label": f"❌ Cancel Order #{order.orderNumber}", "action": f"CANCEL_{order.orderNumber}", "style": "destructive"})
            actions.append({"label": "📦 View Orders Queue", "action": "TRACK_ORDER", "style": "secondary"})

            msg_lines = [
                f"📦 **Order #{order.orderNumber} Tracking**:",
                f"• **Status:** **{order.status}**",
                f"• **Tracking Number:** `{order.trackingNumber or 'Preparing for dispatch'}`",
                f"• **Total:** ₹{order.totalAmount:,.2f}"
            ]
            if order.returnStatus and order.returnStatus != "NONE":
                msg_lines.append(f"• **Return Status:** **{order.returnStatus}**")
            if order.items:
                msg_lines.append("• **Products Ordered:**")
                for it in order.items:
                    it_name = getattr(it, "productName", None) or getattr(it, "name", None) or "Garment"
                    it_sz = getattr(it, "size", None) or "M"
                    it_qty = getattr(it, "quantity", 1)
                    it_pr = float(getattr(it, "finalPrice", None) or getattr(it, "unitPrice", None) or getattr(it, "price", 0.0) or 0.0)
                    msg_lines.append(f"  ↳ {it_name} (Size: {it_sz}, Qty: {it_qty}) — ₹{it_pr:,.2f}")

            return ToolResult(
                success=True,
                tool_name="track_order",
                status="COMPLETED",
                data=order.model_dump(),
                cards=[card],
                actions=actions,
                message="\n".join(msg_lines)
            )

    if customer_token:
        trackable = await springboot_client.get_trackable_orders(customer_token)
        if not trackable:
            return ToolResult(
                success=True,
                tool_name="track_order",
                status="COMPLETED",
                data=[],
                cards=[],
                actions=[
                    {"label": "🔍 Browse Collection", "action": "SEARCH_SHIRTS", "style": "primary"},
                    {"label": "💬 Contact Support", "action": "HUMAN_SUPPORT", "style": "secondary"}
                ],
                message="You do not have any active trackable orders at this time. Only active orders or orders within the 14-day window are displayed."
            )

        cards = []
        actions = []
        lines = [
            f"📦 **Track Orders ({len(trackable)})**\n",
            "Here are your orders available for tracking and lifecycle management:\n"
        ]

        for item in trackable:
            ord_num = item.get("orderId") or item.get("orderNumber") or f"ORD-{item.get('id')}"
            st = item.get("status", "CONFIRMED")
            total = float(item.get("total", 0.0))
            items_list = item.get("items", [])
            first_item = items_list[0] if items_list else {}
            first_name = first_item.get("productName", "Garment")
            first_img = first_item.get("productImageUrlSnapshot") or first_item.get("imageUrl")
            first_qty = first_item.get("quantity", 1)

            cards.append({
                "card_type": "ORDER_STATUS",
                "id": item.get("id"),
                "title": f"Order #{ord_num}",
                "subtitle": st,
                "price": total,
                "data": item
            })

            lines.append(f"• **Order #{ord_num}** — **{st}** — ₹{total:,.2f}")
            if first_name:
                lines.append(f"   ↳ {first_name} (Qty: {first_qty})")
            lines.append("")

            # Distinct SHOW_ORDER action for each order
            actions.append({
                "label": f"🔍 Show Order #{ord_num}",
                "action": f"SHOW_ORDER_{ord_num}",
                "style": "primary"
            })

        lines.append("Select an order above to view live tracking details, cancellation options, or return options:")

        return ToolResult(
            success=True,
            tool_name="track_order",
            status="COMPLETED",
            data=trackable,
            cards=cards,
            actions=actions,
            message="\n".join(lines)
        )

    return ToolResult(
        success=False,
        tool_name="track_order",
        status="FAILED",
        actions=[
            {"label": "Sign In to View Orders", "action": "LOGIN", "style": "primary"},
            {"label": "🔍 Browse Collection", "action": "SEARCH_SHIRTS", "style": "secondary"}
        ],
        message="Please sign in to view and track your orders."
    )


async def show_order(order_id: Any, customer_token: Optional[str] = None, **kwargs) -> ToolResult:
    """Fetches the latest live order state from Spring Boot and returns live tracking, cancellation, and return eligibility."""
    if not customer_token:
        return ToolResult(
            success=False,
            tool_name="show_order",
            status="FAILED",
            message="Please sign in to view order details."
        )

    raw_detail = await springboot_client.get_raw_order_detail(order_id, customer_token)
    if not raw_detail:
        return ToolResult(
            success=False,
            tool_name="show_order",
            status="FAILED",
            message=f"Order #{order_id} could not be found or access is denied."
        )

    ord_num = raw_detail.get("orderId") or raw_detail.get("orderNumber") or str(order_id)
    st = raw_detail.get("status", "CONFIRMED")
    total = float(raw_detail.get("total", 0.0))
    trk = raw_detail.get("tracking") or {}
    canc = raw_detail.get("cancellation") or {}
    ret = raw_detail.get("return") or {}
    items = raw_detail.get("items") or []

    card = {
        "card_type": "ORDER_STATUS",
        "id": raw_detail.get("id"),
        "title": f"Order #{ord_num}",
        "subtitle": st,
        "price": total,
        "data": raw_detail
    }

    actions = []
    # Dynamic actions matching prompt specifications
    avail_actions = raw_detail.get("availableActions") or []

    if "TRACK_ORDER" in avail_actions or (st in ["CONFIRMED", "PROCESSING", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY"] and st != "CANCELLED"):
        actions.append({"label": "🚚 Track Order", "action": f"TRACK_{ord_num}", "style": "primary"})

    if canc.get("eligible") or "CANCEL_ORDER" in avail_actions:
        actions.append({"label": "❌ Cancel Order", "action": f"CANCEL_{ord_num}", "style": "destructive"})

    if ret.get("eligible") or "RETURN_ORDER" in avail_actions:
        actions.append({"label": "📦 Return Order", "action": f"RETURN_{ord_num}", "style": "primary"})

    actions.append({"label": "🔍 View Details", "action": f"SHOW_ORDER_{ord_num}", "style": "secondary"})
    actions.append({"label": "💬 Contact Support", "action": "HUMAN_SUPPORT", "style": "secondary"})

    msg_lines = [
        f"📋 **Order #{ord_num} Details**:",
        f"• **Status:** **{st}**",
        f"• **Total:** ₹{total:,.2f}"
    ]

    if trk.get("trackingNumber"):
        carrier = trk.get("carrier") or "BlueDart Express"
        msg_lines.append(f"• **Carrier:** {carrier}")
        msg_lines.append(f"• **Tracking Number:** `{trk.get('trackingNumber')}`")

    if ret.get("eligible"):
        days_rem = ret.get("daysRemaining", 0)
        msg_lines.append(f"• **Return:** Eligible — **{days_rem} days remaining** (Window valid for 14 days from purchase)")
    elif ret.get("status") and ret.get("status") != "NONE":
        msg_lines.append(f"• **Return Status:** **{ret.get('status')}**")

    if canc.get("status") and canc.get("status") != "NONE":
        msg_lines.append(f"• **Cancellation Status:** **{canc.get('status')}**")

    if items:
        msg_lines.append("• **Products in this Order:**")
        for it in items:
            it_name = it.get("productName", "Garment")
            it_sz = it.get("size", "M")
            it_qty = it.get("quantity", 1)
            it_pr = float(it.get("price", 0.0))
            msg_lines.append(f"  ↳ {it_name} (Size: {it_sz}, Qty: {it_qty}) — ₹{it_pr:,.2f}")

    return ToolResult(
        success=True,
        tool_name="show_order",
        status="COMPLETED",
        data=raw_detail,
        cards=[card],
        actions=actions,
        message="\n".join(msg_lines)
    )


async def return_order(
    order_id: Any,
    reason: str = "Product does not fit",
    items: Optional[List[Dict[str, Any]]] = None,
    customer_token: Optional[str] = None,
    **kwargs
) -> ToolResult:
    """Submits return request through Spring Boot and returns updated live order state."""
    if not customer_token:
        return ToolResult(
            success=False,
            tool_name="return_order",
            status="FAILED",
            message="Please sign in to submit a return."
        )

    res = await springboot_client.request_return(
        order_id=order_id,
        reason=reason,
        items=items,
        customer_token=customer_token
    )

    if "error" in res:
        return ToolResult(
            success=False,
            tool_name="return_order",
            status="FAILED",
            message=str(res["error"])
        )

    # Fetch updated order state
    verified_data = await springboot_client.get_raw_order_detail(order_id, customer_token)
    ord_num = (verified_data.get("orderId") if verified_data else None) or str(order_id)

    card = {
        "card_type": "RETURN_CONFIRMATION",
        "id": verified_data.get("id") if verified_data else order_id,
        "title": f"Return Requested: #{ord_num}",
        "subtitle": "REQUESTED",
        "price": float(verified_data.get("total", 0.0)) if verified_data else 0.0,
        "data": {
            "orderNumber": ord_num,
            "returnStatus": "REQUESTED",
            "approvalType": "AUTONOMOUS",
            "refundAmount": verified_data.get("total") if verified_data else None,
            "refundReference": "RF-PENDING"
        }
    }

    actions = [
        {"label": f"🔍 Show Order #{ord_num}", "action": f"SHOW_ORDER_{ord_num}", "style": "primary"},
        {"label": "💬 Contact Support", "action": "HUMAN_SUPPORT", "style": "secondary"}
    ]

    return ToolResult(
        success=True,
        tool_name="return_order",
        status="COMPLETED",
        data=verified_data or res,
        cards=[card],
        actions=actions,
        message=f"Your return request has been submitted successfully.\n• **Return Status:** **REQUESTED**\n• **Order Status:** **RETURN_REQUESTED**\n• **Refund Status:** **PENDING**\n• **Reason:** {reason}"
    )


async def request_return_and_refund(order_id: Optional[Any] = None, reason: str = "Size / Fit issue", customer_token: Optional[str] = None, **kwargs) -> ToolResult:
    """Wrapper for return_order."""
    if order_id:
        return await return_order(order_id=order_id, reason=reason, customer_token=customer_token, **kwargs)
    return ToolResult(
        success=False,
        tool_name="request_return_and_refund",
        status="FAILED",
        message="Please specify the Order ID you wish to return."
    )


def _is_within_14_days(placed_at_str: Optional[str]) -> bool:
    """Checks whether an order was placed within the last 14 days."""
    if not placed_at_str:
        return True
    try:
        clean_str = str(placed_at_str).replace("Z", "+00:00")
        dt = datetime.fromisoformat(clean_str)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        now = datetime.now(timezone.utc)
        return (now - dt).total_seconds() <= 14 * 86400
    except Exception:
        return True
