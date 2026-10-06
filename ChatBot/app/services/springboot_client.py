import httpx
from typing import Optional, List, Dict, Any
from app.core.config import settings
from app.core.logging import logger
from app.core.exceptions import SpringBootError, OrderNotEligibleError
from app.schemas.product import ProductDTO
from app.schemas.order import OrderDTO, CancellationEligibilityDTO, OrderItemDTO


def _parse_order_items(raw_items: Any) -> List[OrderItemDTO]:
    parsed = []
    if isinstance(raw_items, list):
        for it in raw_items:
            if isinstance(it, dict):
                p_id = it.get("productId") or it.get("id")
                p_name = it.get("productName") or it.get("name") or "Garment"
                img = it.get("imageUrl") or it.get("image") or it.get("productImageUrl")
                u_price = float(it.get("unitPrice") or it.get("price") or 0.0)
                tot_price = float(it.get("finalPrice") or it.get("totalPrice") or (u_price * float(it.get("quantity") or 1)))
                parsed.append(OrderItemDTO(
                    id=it.get("id"),
                    productId=p_id,
                    productName=p_name,
                    name=p_name,
                    productImageUrl=img,
                    imageUrl=img,
                    image=img,
                    size=it.get("size") or "M",
                    color=it.get("color") or "Black",
                    quantity=int(it.get("quantity") or 1),
                    unitPrice=u_price,
                    price=u_price,
                    totalPrice=tot_price,
                    finalPrice=tot_price
                ))
            elif isinstance(it, OrderItemDTO):
                parsed.append(it)
    return parsed


class SpringBootClient:
    """Centralized HTTPX client for Spring Boot Commerce Backend."""

    def __init__(self, base_url: Optional[str] = None):
        self.base_url = (base_url or settings.SPRING_BOOT_BASE_URL).rstrip("/")
        self.timeout = settings.REQUEST_TIMEOUT_SECONDS

    def _headers(self, customer_token: Optional[str] = None) -> Dict[str, str]:
        headers = {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "X-AI-Service-Key": settings.AI_SERVICE_API_KEY,
        }
        if customer_token:
            headers["Authorization"] = f"Bearer {customer_token}"
        return headers

    async def search_products(
        self,
        query: str,
        limit: int = 10,
        category: Optional[str] = None,
        color: Optional[str] = None,
        max_price: Optional[float] = None
    ) -> List[ProductDTO]:
        """Searches products via Spring Boot API."""
        url = f"{self.base_url}/api/products/search"
        params = {"q": query}
        if category:
            params["category"] = category
        if color:
            params["color"] = color

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                res = await client.get(url, params=params, headers=self._headers())
                if res.status_code == 200:
                    data = res.json().get("data", {})
                    content = data.get("content", [])
                    products = []
                    for item in content:
                        price = float(item.get("basePrice") or 0.0)
                        if max_price is not None and price > max_price:
                            continue
                        
                        img = item.get("imageUrl")
                        images = item.get("images") or []
                        if not img and images:
                            img = images[0]

                        products.append(ProductDTO(
                            id=item["id"],
                            externalProductId=item.get("externalProductId"),
                            name=item["name"],
                            slug=item.get("slug"),
                            description=item.get("description"),
                            gender=item.get("gender"),
                            masterCategory=item.get("masterCategory"),
                            subCategory=item.get("subCategory"),
                            articleType=item.get("articleType"),
                            baseColour=item.get("baseColour"),
                            season=item.get("season"),
                            usageCategory=item.get("usageCategory"),
                            basePrice=price,
                            compareAtPrice=item.get("compareAtPrice"),
                            status=item.get("status", "ACTIVE"),
                            badge=item.get("badge"),
                            imageUrl=img,
                            images=images,
                            availableSizes=item.get("availableSizes", []),
                            inventory=item.get("inventory", 100)
                        ))
                        if len(products) >= limit:
                            break
                    return products
                elif res.status_code == 404:
                    return []
                else:
                    logger.warning(f"Product search returned status {res.status_code}: {res.text}")
                    return []
        except Exception as e:
            logger.error(f"Error calling Spring Boot search_products: {e}")
            return []

    async def get_product(self, product_id: int) -> Optional[ProductDTO]:
        """Retrieves single product details from Spring Boot."""
        url = f"{self.base_url}/api/products/{product_id}"
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                res = await client.get(url, headers=self._headers())
                if res.status_code == 200:
                    payload = res.json().get("data", {})
                    images = [img["imageUrl"] for img in payload.get("images", []) if "imageUrl" in img]
                    main_img = images[0] if images else None
                    return ProductDTO(
                        id=payload["id"],
                        externalProductId=payload.get("externalProductId"),
                        name=payload["name"],
                        slug=payload.get("slug"),
                        description=payload.get("description"),
                        gender=payload.get("gender"),
                        masterCategory=payload.get("masterCategory"),
                        subCategory=payload.get("subCategory"),
                        articleType=payload.get("articleType"),
                        baseColour=payload.get("baseColour"),
                        basePrice=float(payload.get("basePrice", 0.0)),
                        compareAtPrice=payload.get("compareAtPrice"),
                        status=payload.get("status", "ACTIVE"),
                        badge=payload.get("badge"),
                        imageUrl=main_img,
                        images=images,
                        variants=payload.get("variants", []),
                        inventory=sum(v.get("stock", 0) for v in payload.get("variants", []))
                    )
                return None
        except Exception as e:
            logger.error(f"Error calling get_product: {e}")
            return None

    async def get_trackable_orders(self, customer_token: Optional[str] = None) -> List[Dict[str, Any]]:
        """Retrieves trackable orders for authenticated customer from /api/my/orders/trackable."""
        if not customer_token:
            return []

        url = f"{self.base_url}/api/my/orders/trackable"
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                res = await client.get(url, headers=self._headers(customer_token))
                if res.status_code == 200:
                    json_data = res.json()
                    data = json_data.get("data") if isinstance(json_data, dict) else json_data
                    if isinstance(data, list):
                        return data
        except Exception as e:
            logger.error(f"Error calling {url}: {e}")
        return []

    async def get_orders(self, customer_token: Optional[str] = None) -> List[OrderDTO]:
        """Retrieves authenticated customer's orders from Spring Boot."""
        if not customer_token:
            return []

        # Try trackable/my orders first, then customer account orders, then public orders
        for url in [f"{self.base_url}/api/my/orders/trackable", f"{self.base_url}/api/account/orders", f"{self.base_url}/api/orders"]:
            try:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    res = await client.get(url, headers=self._headers(customer_token))
                    if res.status_code == 200:
                        json_data = res.json()
                        if isinstance(json_data, list):
                            data = json_data
                        elif isinstance(json_data, dict):
                            data = json_data.get("data") or json_data.get("content") or json_data.get("orders") or []
                            if not isinstance(data, list):
                                data = []
                        else:
                            data = []

                        if not data and (url.endswith("/api/orders") or url.endswith("/api/account/orders")):
                            continue

                        orders = []
                        for item in data:
                            if not isinstance(item, dict):
                                continue
                            orders.append(OrderDTO(
                                id=item.get("id"),
                                orderNumber=item.get("orderNumber") or item.get("orderId") or f"ORD-{item.get('id')}",
                                status=item.get("status", "PROCESSING"),
                                totalAmount=float(item.get("totalAmount") or item.get("total") or 0.0),
                                shippingFee=float(item.get("shippingFee") or 0.0),
                                placedAt=item.get("createdAt") or item.get("orderDate") or item.get("placedAt"),
                                trackingNumber=item.get("trackingNumber") or (item.get("tracking", {}).get("trackingNumber") if isinstance(item.get("tracking"), dict) else None),
                                returnStatus=item.get("returnStatus") or (item.get("return", {}).get("status") if isinstance(item.get("return"), dict) else None),
                                approvalType=item.get("approvalType"),
                                refundAmount=float(item.get("refundAmount")) if item.get("refundAmount") is not None else None,
                                refundUpiId=item.get("refundUpiId"),
                                refundReference=item.get("refundReference"),
                                returnTrackingNumber=item.get("returnTrackingNumber"),
                                pickupDate=item.get("pickupDate"),
                                pickupAddress=item.get("pickupAddress"),
                                canCancel=item.get("cancellation", {}).get("eligible") if isinstance(item.get("cancellation"), dict) else item.get("status") in ["PENDING", "CONFIRMED", "PROCESSING"],
                                canReturn=item.get("return", {}).get("eligible") if isinstance(item.get("return"), dict) else (item.get("status") in ["DELIVERED", "CONFIRMED", "SHIPPED"] and (not item.get("returnStatus") or item.get("returnStatus") == "NONE")),
                                items=_parse_order_items(item.get("items", []))
                            ))
                        return orders
            except Exception as e:
                logger.error(f"Error calling {url}: {e}")
                continue

        return []

    async def get_order(self, order_id: Any, customer_token: Optional[str] = None) -> Optional[OrderDTO]:
        """Retrieves single order details."""
        if not customer_token:
            return None

        for url in [f"{self.base_url}/api/my/orders/{order_id}", f"{self.base_url}/api/account/orders/{order_id}", f"{self.base_url}/api/orders/{order_id}"]:
            try:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    res = await client.get(url, headers=self._headers(customer_token))
                    if res.status_code == 200:
                        json_data = res.json()
                        if isinstance(json_data, dict) and "data" in json_data and isinstance(json_data["data"], dict):
                            item = json_data["data"]
                        elif isinstance(json_data, dict):
                            item = json_data
                        else:
                            item = {}

                        if item.get("id") or item.get("orderNumber") or item.get("orderId"):
                            ord_num = item.get("orderNumber") or item.get("orderId") or f"ORD-{item.get('id')}"
                            return OrderDTO(
                                id=item.get("id"),
                                orderNumber=ord_num,
                                status=item.get("status", "PROCESSING"),
                                totalAmount=float(item.get("totalAmount") or item.get("total") or 0.0),
                                shippingFee=float(item.get("shippingFee") or 0.0),
                                placedAt=item.get("createdAt") or item.get("orderDate") or item.get("placedAt"),
                                trackingNumber=item.get("trackingNumber") or (item.get("tracking", {}).get("trackingNumber") if isinstance(item.get("tracking"), dict) else None),
                                returnStatus=item.get("returnStatus") or (item.get("return", {}).get("status") if isinstance(item.get("return"), dict) else None),
                                approvalType=item.get("approvalType"),
                                refundAmount=float(item.get("refundAmount")) if item.get("refundAmount") is not None else None,
                                refundUpiId=item.get("refundUpiId"),
                                refundReference=item.get("refundReference"),
                                returnTrackingNumber=item.get("returnTrackingNumber"),
                                pickupDate=item.get("pickupDate"),
                                pickupAddress=item.get("pickupAddress"),
                                canCancel=item.get("cancellation", {}).get("eligible") if isinstance(item.get("cancellation"), dict) else item.get("status") in ["PENDING", "CONFIRMED", "PROCESSING"],
                                canReturn=item.get("return", {}).get("eligible") if isinstance(item.get("return"), dict) else (item.get("status") in ["DELIVERED", "CONFIRMED", "SHIPPED"] and (not item.get("returnStatus") or item.get("returnStatus") == "NONE")),
                                items=_parse_order_items(item.get("items", []))
                            )
            except Exception as e:
                logger.error(f"Error calling {url}: {e}")
                continue

        return None

    async def get_raw_order_detail(self, order_id: Any, customer_token: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Retrieves raw live order detail from /api/my/orders/{orderId}."""
        if not customer_token:
            return None
        url = f"{self.base_url}/api/my/orders/{order_id}"
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                res = await client.get(url, headers=self._headers(customer_token))
                if res.status_code == 200:
                    json_data = res.json()
                    return json_data.get("data") if isinstance(json_data, dict) else json_data
        except Exception as e:
            logger.error(f"Error calling {url}: {e}")
        return None

    async def get_cancellation_eligibility(self, order_id: Any, customer_token: Optional[str] = None) -> CancellationEligibilityDTO:
        """Asks Spring Boot if order is eligible for cancellation."""
        order = await self.get_order(order_id, customer_token)
        if not order:
            return CancellationEligibilityDTO(
                orderId=order_id if isinstance(order_id, int) else 0,
                eligible=False,
                status="NOT_FOUND",
                reason="Order not found or access denied."
            )

        if order.status in ["PENDING", "CONFIRMED", "PROCESSING"]:
            return CancellationEligibilityDTO(
                orderId=order.id or 0,
                eligible=True,
                status=order.status,
                totalRefundAmount=order.totalAmount
            )
        else:
            return CancellationEligibilityDTO(
                orderId=order.id or 0,
                eligible=False,
                status=order.status,
                reason=f"Order is already {order.status.lower()} and cannot be cancelled automatically."
            )

    async def cancel_order(self, order_id: Any, customer_token: Optional[str] = None, reason: str = "Changed mind", idempotency_key: Optional[str] = None) -> Dict[str, Any]:
        """Executes cancellation transaction on Spring Boot /api/my/orders/{orderId}/cancel."""
        if not customer_token:
            raise SpringBootError("Authentication required to cancel order.")

        headers = self._headers(customer_token)
        if idempotency_key:
            headers["Idempotency-Key"] = idempotency_key

        payload = {"reason": reason}

        for url in [f"{self.base_url}/api/my/orders/{order_id}/cancel", f"{self.base_url}/api/orders/{order_id}/cancel"]:
            try:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    res = await client.post(url, json=payload, headers=headers)
                    if res.status_code in [200, 204]:
                        data = res.json()
                        return data.get("data") if isinstance(data, dict) and "data" in data else data
                    error_msg = res.json().get("message", "Cancellation rejected by backend.") if "application/json" in res.headers.get("content-type", "") else res.text
                    raise OrderNotEligibleError(error_msg)
            except OrderNotEligibleError:
                raise
            except Exception as e:
                logger.error(f"Error calling {url}: {e}")
                continue

        raise SpringBootError("Failed to cancel order on Spring Boot.")

    async def get_cart(self, customer_token: Optional[str] = None) -> Dict[str, Any]:
        """Retrieves customer's active shopping cart."""
        if not customer_token:
            return {"items": [], "subtotal": 0.0, "total": 0.0}

        url = f"{self.base_url}/api/cart"
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                res = await client.get(url, headers=self._headers(customer_token))
                if res.status_code == 200:
                    return res.json().get("data", {})
                return {"items": [], "subtotal": 0.0, "total": 0.0}
        except Exception as e:
            logger.error(f"Error calling get_cart: {e}")
            return {"items": [], "subtotal": 0.0, "total": 0.0}

    async def add_to_cart(self, variant_id: int, quantity: int = 1, customer_token: Optional[str] = None) -> bool:
        """Adds product variant to customer cart."""
        if not customer_token:
            return False

        url = f"{self.base_url}/api/cart/items"
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                res = await client.post(
                    url,
                    json={"variantId": variant_id, "quantity": quantity},
                    headers=self._headers(customer_token)
                )
                return res.status_code in [200, 201]
        except Exception as e:
            logger.error(f"Error calling add_to_cart: {e}")
            return False

    async def create_order(
        self,
        items: List[Dict[str, Any]],
        name: str = "Customer",
        email: str = "customer@nova.demo",
        phone: str = "",
        address: str = "Customer Address on File",
        city: str = "Mumbai",
        state: str = "Maharashtra",
        postal_code: str = "400001",
        payment_method: str = "UPI",
        customer_token: Optional[str] = None
    ) -> Dict[str, Any]:
        """Creates a confirmed order directly on Spring Boot."""
        url = f"{self.base_url}/api/account/orders"
        payload = {
            "name": name,
            "email": email,
            "phone": phone,
            "address": address,
            "city": city,
            "state": state,
            "postalCode": postal_code,
            "paymentMethod": payment_method,
            "orderSource": "AI_CHATBOT",
            "items": items
        }
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                res = await client.post(url, json=payload, headers=self._headers(customer_token))
                if res.status_code in [200, 201]:
                    data = res.json()
                    return data.get("data") or data
                logger.warning(f"Order creation failed: {res.status_code} - {res.text}")
                return {"error": res.text}
        except Exception as e:
            logger.error(f"Error calling create_order: {e}")
            return {"error": str(e)}

    async def track_order_by_number(self, tracking_or_order_number: str) -> Optional[Dict[str, Any]]:
        """Tracks an order by carrier tracking number or order number."""
        clean = tracking_or_order_number.strip()
        url = f"{self.base_url}/api/orders/track/{clean}"
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                res = await client.get(url, headers=self._headers())
                if res.status_code == 200:
                    data = res.json()
                    return data.get("data") or data
        except Exception as e:
            logger.error(f"Error calling track_order_by_number: {e}")
        return None

    async def request_return(
        self,
        order_id: Optional[Any] = None,
        tracking_or_order_number: Optional[str] = None,
        reason: str = "Size / Fit issue",
        comment: Optional[str] = None,
        upi_id: Optional[str] = None,
        pickup_address: Optional[str] = None,
        refund_amount: Optional[float] = None,
        items: Optional[List[Dict[str, Any]]] = None,
        customer_token: Optional[str] = None,
        idempotency_key: Optional[str] = None
    ) -> Dict[str, Any]:
        """Submits a return & refund request to Spring Boot."""
        headers = self._headers(customer_token)
        if idempotency_key:
            headers["Idempotency-Key"] = idempotency_key

        payload = {
            "reason": reason,
            "comment": comment or "Requested via 24/7 AI Chatbot Concierge",
            "upiId": upi_id,
            "trackingOrOrderNumber": tracking_or_order_number,
            "pickupAddress": pickup_address,
            "refundAmount": refund_amount,
            "items": items or []
        }

        urls = []
        if order_id:
            urls.append(f"{self.base_url}/api/my/orders/{order_id}/return")
            urls.append(f"{self.base_url}/api/account/orders/{order_id}/return")
        else:
            urls.append(f"{self.base_url}/api/account/orders/return")

        for url in urls:
            try:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    res = await client.post(url, json=payload, headers=headers)
                    if res.status_code == 200:
                        data = res.json()
                        return data.get("data") or data
                    err_json = res.json() if "application/json" in res.headers.get("content-type", "") else {}
                    err_msg = err_json.get("message") or err_json.get("error") or res.text
                    return {"error": err_msg}
            except Exception as e:
                logger.error(f"Error calling {url}: {e}")
                continue
        return {"error": "Could not connect to return service"}

    async def sync_conversation_turn(
        self,
        user_message: str,
        assistant_message: str,
        conversation_id: Optional[int] = None,
        session_id: Optional[str] = None,
        user_name: Optional[str] = None,
        user_email: Optional[str] = None,
        intent: Optional[str] = None,
        product_ids: Optional[List[int]] = None,
        sources: Optional[List[Dict[str, Any]]] = None,
        latency_ms: int = 150,
        model_name: str = "ai-agent-v2",
        error_status: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """Syncs chat turns into the unified Spring Boot database."""
        url = f"{self.base_url}/api/chat/sync-turn"
        payload = {
            "conversationId": conversation_id,
            "sessionId": session_id or "anonymous-session",
            "userName": user_name or "Guest Customer",
            "userEmail": user_email,
            "userMessage": user_message,
            "assistantMessage": assistant_message,
            "intent": intent,
            "productIds": product_ids or [],
            "sources": sources or [],
            "latencyMs": latency_ms,
            "modelName": model_name,
            "errorStatus": error_status
        }
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                res = await client.post(url, json=payload, headers=self._headers())
                if res.status_code == 200:
                    data = res.json()
                    return data.get("data") or data
                logger.warning(f"Sync conversation turn failed: {res.status_code} - {res.text}")
        except Exception as e:
            logger.error(f"Error syncing conversation turn: {e}")
        return None

    async def get_size_chart(
        self,
        gender: str = "MEN",
        audience: str = "ADULT",
        category: str = "SHIRT",
        unit: str = "IN"
    ) -> Optional[Dict[str, Any]]:
        """Retrieves authoritative size guide from Spring Boot backend."""
        url = f"{self.base_url}/api/size-guides"
        params = {
            "gender": gender,
            "audience": audience,
            "category": category,
            "unit": unit
        }
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                res = await client.get(url, params=params, headers=self._headers())
                if res.status_code == 200:
                    data = res.json()
                    return data.get("data") or data
                logger.warning(f"Failed to fetch size guide: {res.status_code} - {res.text}")
        except Exception as e:
            logger.error(f"Error fetching size guide: {e}")
        return None

    async def get_product_size_chart(
        self,
        product_id: int,
        unit: str = "IN"
    ) -> Optional[Dict[str, Any]]:
        """Retrieves product-specific or product-aware size guide."""
        url = f"{self.base_url}/api/products/{product_id}/size-guide"
        params = {"unit": unit}
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                res = await client.get(url, params=params, headers=self._headers())
                if res.status_code == 200:
                    data = res.json()
                    return data.get("data") or data
                logger.warning(f"Failed to fetch product size guide: {res.status_code} - {res.text}")
        except Exception as e:
            logger.error(f"Error fetching product size guide: {e}")
        return None

    async def recommend_size(
        self,
        product_id: Optional[int] = None,
        gender: Optional[str] = None,
        audience: Optional[str] = "ADULT",
        category: Optional[str] = None,
        measurements: Optional[Dict[str, float]] = None,
        unit: str = "IN"
    ) -> Optional[Dict[str, Any]]:
        """Calculates size recommendation based on real PostgreSQL ranges via Spring Boot."""
        url = f"{self.base_url}/api/size-guides/recommend"
        payload = {
            "productId": product_id,
            "gender": gender,
            "audience": audience,
            "category": category,
            "measurements": measurements or {},
            "unit": unit
        }
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                res = await client.post(url, json=payload, headers=self._headers())
                if res.status_code == 200:
                    data = res.json()
                    return data.get("data") or data
                logger.warning(f"Failed to calculate size recommendation: {res.status_code} - {res.text}")
        except Exception as e:
            logger.error(f"Error calculating size recommendation: {e}")
        return None


springboot_client = SpringBootClient()
