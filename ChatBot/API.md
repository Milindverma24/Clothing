# AI Commerce Agent — API Specification (`API.md`)

> **Version:** 1.0.0  
> **Base URL:** `http://localhost:8001` (Dev)  
> **Protocol:** HTTP/1.1 & HTTP/2 with Server-Sent Events (SSE)

---

## 1. Endpoints Overview

| Method | Path | Description | Access Tier |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/chat` | Primary synchronous chat endpoint | Public / Customer |
| `POST` | `/api/chat/stream` | Real-time Server-Sent Events (SSE) stream | Public / Customer |
| `GET` | `/api/conversations/{id}` | Retrieve past conversation messages | Customer / Owner |
| `POST` | `/api/feedback` | Submit message feedback (positive/negative) | Customer |
| `GET` | `/health` | Liveness & Readiness probe | Public |
| `GET` | `/health/dependencies` | Deep check for Spring Boot, DB, and LLM | System / Admin |
| `GET` | `/api/admin/conversations` | Admin session list & monitoring | Admin Only |
| `POST` | `/api/admin/takeover` | Support agent human takeover | Admin Only |
| `POST` | `/api/admin/knowledge/upload` | Admin PDF policy upload & indexer | Admin Only |

---

## 2. Authentication & Identity Propagation

Clients send an optional Bearer JWT token in the `Authorization` header:
```http
Authorization: Bearer <jwt_token>
```
- If present, the AI Agent verifies the token or extracts customer identity (`customer_id`, `email`, `role`).
- If absent, the session operates in **Guest** mode.
- Internal service-to-service communication with Spring Boot uses:
```http
X-AI-Service-Key: <AI_SERVICE_API_KEY>
Authorization: Bearer <customer_jwt>
```

---

## 3. Client API Specifications

### 3.1 Synchronous Chat (`POST /api/chat`)

#### Request Body
```json
{
  "conversation_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "message": "Can I cancel my latest order?",
  "context": {
    "page": "/account/orders",
    "product_id": null,
    "order_id": 1234
  }
}
```

#### Response Body (200 OK)
```json
{
  "conversation_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "message_id": "8fb3295c-9196-419b-a0f5-ec75704a20b0",
  "type": "CONFIRMATION",
  "intent": "ORDER_CANCEL",
  "message": "Your order #1234 is eligible for cancellation. This action cannot be undone. Would you like me to proceed with cancelling it?",
  "requires_confirmation": true,
  "action": {
    "type": "CANCEL_ORDER",
    "resource_id": "1234",
    "status": "PENDING_CONFIRMATION",
    "summary": "Cancel Order #1234"
  },
  "products": [],
  "order": {
    "id": 1234,
    "order_number": "ORD-1234",
    "status": "PROCESSING",
    "total": 1899.00,
    "items": [
      {
        "name": "Men Navy Blue Casual Shirt",
        "image_url": "/images/37812.jpg",
        "quantity": 1,
        "price": 1899.00,
        "size": "M"
      }
    ]
  },
  "sources": [],
  "created_at": "2026-10-03T00:30:00Z"
}
```

---

### 3.2 Real-time Streaming (`POST /api/chat/stream`)

Streams Server-Sent Events with `text/event-stream` media type.

#### Event Sequence:
1. `event: message_start`  
   `data: {"conversation_id": "...", "message_id": "..."}`
2. `event: tool_start`  
   `data: {"status_text": "Checking order cancellation eligibility..."}`
3. `event: text_delta`  
   `data: {"delta": "I checked your order #1234."}`
4. `event: action_prompt`  
   `data: {"type": "CONFIRMATION", "action": "CANCEL_ORDER", ...}`
5. `event: message_complete`  
   `data: {"status": "COMPLETED"}`

---

## 4. Dependencies on Spring Boot (`SPRING_BOOT_BASE_URL`)

The AI Agent relies on Spring Boot for all authoritative business data:

| Endpoint | Method | Purpose in AI Agent |
| :--- | :--- | :--- |
| `/api/products` | `GET` | List catalog products |
| `/api/products/search?q={query}` | `GET` | Full-text & trigram product search |
| `/api/products/{id}` | `GET` | Product variant & inventory details |
| `/api/orders` | `GET` | Authenticated customer's order history |
| `/api/orders/{id}` | `GET` | Single order status & item snapshots |
| `/api/orders/{id}/cancel` | `POST` | Authoritative cancellation transaction |
| `/api/cart` | `GET` | Customer active shopping bag |
| `/api/cart/items` | `POST` | Add item/variant to bag |
| `/api/cart/items/{id}` | `DELETE` | Remove item from bag |
| `/api/wishlist` | `GET` | Customer wishlist |
| `/api/wishlist/items` | `POST` | Save item for later |
| `/api/addresses` | `GET` | Customer saved shipping addresses |
| `/api/coupons/validate` | `POST` | Authoritative coupon check |
