# AI Commerce Agent

A production-ready Python AI Agent microservice for the clothing e-commerce platform.

The AI Commerce Agent provides a 24/7 conversational shopping and customer-support experience.

It allows customers to:

- Search products
- Ask questions
- Find products
- Track orders
- Select an order
- Cancel eligible orders
- Return eligible orders
- Exchange eligible orders
- Manage cart
- Manage wishlist
- Ask policy questions
- Get RAG-powered answers
- Contact human support

The system is designed around strict customer privacy.

A customer can only access their own:

- Conversations
- Messages
- Orders
- Cart
- Wishlist
- Addresses
- Profile
- Returns
- Cancellations

The system must never expose another customer's data.

Core Architecture:

AI Agent = Intelligence + Orchestration

Spring Boot = Authentication + Authorization + Business Logic + Transactions

PostgreSQL = Commerce Source of Truth

React = Customer Experience


============================================================
1. ARCHITECTURE
============================================================

Customer
   |
   v
React Storefront
   |
   v
Python AI Agent
   |
   v
Spring Boot
   |
   v
PostgreSQL


The Python AI Agent is not the business authority.

The AI Agent understands the customer request and decides which tool may be required.

Spring Boot decides whether that operation is actually allowed.


============================================================
2. MAIN CUSTOMER FLOW
============================================================

Customer opens chatbot.

        |
        v

Chatbot displays:

[Track Order]
[Find Products]
[My Cart]
[My Wishlist]
[Returns]
[Store Policies]
[Talk to Support]

        |
        v

Customer selects:

Track Order

        |
        v

Spring Boot identifies authenticated customer.

        |
        v

Only that customer's trackable orders are returned.

        |
        v

Customer clicks an order.

        |
        v

The chatbot displays actions available for that order.

        |
        v

Customer selects an action.

        |
        v

Spring Boot verifies:

- Ownership
- Order status
- Purchase date
- 14-day policy
- Business rules

        |
        v

Action executes.

        |
        v

Backend confirms result.

        |
        v

Chatbot displays the result.


============================================================
3. TRACK ORDER
============================================================

The Track Order feature is a major feature of the chatbot.

When the customer clicks:

Track Order

the chatbot should retrieve only the authenticated customer's relevant orders.

Preferred endpoint:

GET /api/my/orders/trackable


The endpoint must never return:

- Other users' orders
- Global orders
- Admin orders
- Random orders


============================================================
4. TRACKABLE ORDERS
============================================================

Track Order should prioritize:

- Pending
- Confirmed
- Processing
- Packed
- Shipped
- Out for delivery
- Delivered within 14-day window
- Return requested
- Cancellation requested

The exact status mapping should match the Spring Boot order system.


============================================================
5. ORDER CARD

Example:

+----------------------------------------------+
| Order #ORD-1024                              |
|                                              |
| Black Casual Shirt                           |
| Size: M                                     |
| Quantity: 1                                 |
|                                              |
| Ordered: 05 Oct 2026                         |
| Status: Shipped                              |
|                                              |
| [View Order]                                 |
+----------------------------------------------+


Another order:

+----------------------------------------------+
| Order #ORD-1020                              |
|                                              |
| White T-Shirt                               |
| Size: L                                     |
|                                              |
| Ordered: 02 Oct 2026                         |
| Status: Delivered                            |
| Return window: Active                        |
|                                              |
| [View Order]                                 |
+----------------------------------------------+


============================================================
6. SELECT ORDER FIRST
============================================================

The chatbot should NOT immediately show all actions.

The user first selects:

Track Order

Then:

Order List

Then:

User clicks one order.

Then:

Action Menu

This provides a clean and safe UX.


============================================================
7. ACTION MENU
============================================================

Example:

Order #ORD-1024

Black Casual Shirt

Status:
Shipped

What would you like to do?

[Track Order]
[Cancel Order]
[Return Order]
[Exchange Order]
[View Details]
[Contact Support]

Only eligible actions should be active.


============================================================
8. DYNAMIC ACTIONS
============================================================

The actions shown must depend on:

- Order status
- Purchase date
- 14-day window
- Backend business rules
- Existing return status
- Existing cancellation status

The frontend must never decide final eligibility.


============================================================
9. 14-DAY RULE
============================================================

Cancellation and return are allowed only within 14 days from the date the order was purchased.

The purchase date comes from Spring Boot.

Example:

Purchase date:
01 October 2026

Current date:
10 October 2026

Days elapsed:
9

Return:
Eligible if all backend conditions pass.

Cancellation:
Eligible if all backend conditions pass.


Example:

Purchase date:
01 September 2026

Current date:
06 October 2026

Days elapsed:
35

Return:
Not eligible.

Cancellation:
Not eligible.


============================================================
10. IMPORTANT

The AI Agent must not independently decide the 14-day eligibility.

Spring Boot must be the final authority.

Example backend response:

{
  "orderId": "ORD-123",
  "returnEligible": true,
  "cancelEligible": true,
  "daysSincePurchase": 5,
  "returnWindowDays": 14
}


============================================================
11. TRACKING
============================================================

When the customer clicks:

Track Order

for a selected order:

Show:

Order number
Product
Order date
Current status
Tracking number
Carrier
Expected delivery
Shipping timeline

Example:

Order #ORD-1024

Black Casual Shirt

Status:

Confirmed
   |
Packed
   |
Shipped
   |
Out for Delivery
   |
Delivered

Current:
Shipped

Tracking:
TRACK12345

Carrier:
Example Carrier

Expected Delivery:
08 Oct 2026


Only backend-provided information should be displayed.


============================================================
12. CANCEL ORDER
============================================================

Cancellation flow:

Track Order
    |
    v
Select Order
    |
    v
Cancel Order
    |
    v
Check backend eligibility
    |
    v
Check 14-day rule
    |
    v
Show confirmation
    |
    v
Customer confirms
    |
    v
Spring Boot cancels order
    |
    v
Backend confirms
    |
    v
Chatbot displays success


Example:

Cancel Order?

Order #ORD-1024

Black Casual Shirt
₹1,299

This order is eligible for cancellation.

Are you sure?

[Confirm Cancellation]
[Keep Order]


============================================================
13. RETURN ORDER
============================================================

Return flow:

Track Order
    |
    v
Select Order
    |
    v
Return Order
    |
    v
Backend checks:
    - Ownership
    - Purchase date
    - 14-day rule
    - Return eligibility
    - Order status
    |
    v
If eligible:
    Show return options
    |
    v
Customer confirms
    |
    v
Spring Boot creates return
    |
    v
Backend confirms
    |
    v
Chatbot displays return information


============================================================
14. EXCHANGE ORDER
============================================================

If exchange is supported:

Track Order
    |
    v
Select Order
    |
    v
Exchange Order
    |
    v
Check eligibility
    |
    v
Select replacement variant
    |
    v
Confirm
    |
    v
Spring Boot processes exchange
    |
    v
Verify
    |
    v
Display result


============================================================
15. ORDER DETAILS
============================================================

Order details should include:

Order number
Order date
Product image
Product name
Variant
Size
Color
Quantity
Price
Subtotal
Discount
Shipping
Total
Current status
Tracking information
Return eligibility
Cancellation eligibility

For historical orders, use snapshot information stored with the order.


============================================================
16. PRIVACY — CRITICAL

This is one of the most important parts of the AI Agent.

A customer must NEVER see another customer's chatbot history.

A customer must NEVER see another customer's orders.

A customer must NEVER see another customer's messages.

A customer must NEVER see another customer's cart.

A customer must NEVER see another customer's wishlist.

A customer must NEVER see another customer's address.

A customer must NEVER see another customer's support conversation.


============================================================
17. CURRENT PRIVACY BUG

If the existing system is showing all chats for every user, this must be fixed immediately.

If the existing system is showing all orders when a customer clicks Track Order, this must also be fixed immediately.

The problem is likely caused by queries that are not filtering by the authenticated customer.

The backend must be changed so that every customer request is automatically scoped to the authenticated customer.


============================================================
18. CORRECT CHAT QUERY

Conceptually:

SELECT *
FROM ai_conversations
WHERE user_id = authenticated_user_id
ORDER BY last_activity_at DESC;


Incorrect:

SELECT *
FROM ai_conversations
ORDER BY last_activity_at DESC;


The second query must NEVER be used for a customer-facing endpoint.


============================================================
19. CORRECT ORDER QUERY

Conceptually:

SELECT *
FROM orders
WHERE customer_id = authenticated_customer_id
ORDER BY purchase_date DESC;


Incorrect:

SELECT *
FROM orders
ORDER BY purchase_date DESC;


The second query can expose every customer's order and must never be used for customer Track Order.


============================================================
20. AUTHENTICATED CUSTOMER ID

The customer ID must come from:

JWT/session authentication

or another trusted backend authentication mechanism.

Never from:

Request body
Frontend local storage
Query parameter
Chat message
LLM output


============================================================
21. CHAT REQUEST

Recommended:

POST /api/chat

Request:

{
  "conversationId": "conv-123",
  "message": "Track my order"
}


Do NOT send:

{
  "customerId": "123",
  "conversationId": "conv-123",
  "message": "Track my order"
}

The backend already knows the customer.


============================================================
22. TRACK ORDER API

Recommended:

GET /api/my/orders/trackable


The backend identifies the current customer automatically.

Response:

{
  "orders": [
    {
      "id": "ORD-1024",
      "productName": "Black Casual Shirt",
      "productImageUrl": "/images/1024.jpg",
      "purchaseDate": "2026-10-05",
      "status": "SHIPPED",
      "returnEligible": true,
      "cancelEligible": true
    }
  ]
}


============================================================
23. ORDER ACTION API

After selecting an order, the frontend can request:

GET /api/my/orders/{orderId}/actions


Response:

{
  "orderId": "ORD-1024",
  "actions": [
    "TRACK_ORDER",
    "CANCEL_ORDER",
    "RETURN_ORDER",
    "VIEW_DETAILS"
  ]
}


Spring Boot must verify that:

order.customerId == authenticatedCustomerId


============================================================
24. CANCEL API

Example:

POST /api/my/orders/{orderId}/cancel


Spring Boot checks:

1. Authentication
2. Ownership
3. Order existence
4. Order status
5. Purchase date
6. 14-day rule
7. Other cancellation rules
8. Idempotency

Only then can cancellation occur.


============================================================
25. RETURN API

Example:

POST /api/my/orders/{orderId}/return


Spring Boot checks:

1. Authentication
2. Ownership
3. Purchase date
4. 14-day rule
5. Return eligibility
6. Existing return
7. Other business rules


============================================================
26. CONVERSATION API

Customer:

GET /api/my/conversations

This must return only:

authenticated customer's conversations.


============================================================
27. CONVERSATION MESSAGES

Customer:

GET /api/my/conversations/{conversationId}/messages

Backend must verify:

conversation.userId == authenticatedUserId


============================================================
28. IDOR PROTECTION

The system must protect against:

Insecure Direct Object Reference.

Example:

Customer A owns:

conversation-100

Customer B owns:

conversation-200

Customer A tries:

GET /api/my/conversations/conversation-200/messages


Response:

403 Forbidden

or:

404 Not Found


No data should be returned.


============================================================
29. ORDER IDOR PROTECTION

Customer A owns:

ORD-100

Customer B owns:

ORD-200

Customer A requests:

GET /api/my/orders/ORD-200


Backend must reject the request.


============================================================
30. ADMIN ACCESS

Admins may access:

/api/admin/ai-conversations

But customers must not.

Customer:

ROLE_CUSTOMER

Admin:

ROLE_ADMIN


============================================================
31. ADMIN CHAT MONITORING

Admin UI can show:

Customer
Conversation
Messages
Order context
Tool calls
RAG sources
Errors
Feedback

Customer UI can show only:

Their own conversations
Their own messages
Their own orders


============================================================
32. CART

The AI Agent should support:

View cart
Add product
Remove product
Update quantity

All cart operations must be scoped to the authenticated customer.


============================================================
33. WISHLIST

The AI Agent should support:

View wishlist
Add product
Remove product

All wishlist operations must be scoped to the authenticated customer.


============================================================
34. PRODUCT SEARCH

The chatbot should support:

black shirt
blak shirt
blk tshrt
mens casual shirt
navy blue casual
shirts under 1500
black shirt for party

Search should support:

- Fuzzy matching
- Trigram similarity
- Full-text search
- Synonyms
- Natural-language filters
- Semantic search where appropriate


============================================================
35. RAG

RAG should answer stable questions such as:

- Return policy
- Shipping policy
- Size guide
- Product care
- Store information
- FAQ
- Terms
- Privacy policy

Live customer/order data must come from Spring Boot.


============================================================
36. LIVE DATA

The AI Agent must use Spring Boot for:

Current price
Stock
Order status
Tracking
Return eligibility
Cancellation eligibility
Refund status
Customer profile
Cart
Wishlist


============================================================
37. SECURITY PRINCIPLE

The AI Agent may understand:

"Cancel my latest order."

But it must not directly cancel the order.

It must:

Understand
    |
    v
Find customer's order
    |
    v
Spring Boot authorization
    |
    v
14-day eligibility
    |
    v
Order-status eligibility
    |
    v
Confirmation
    |
    v
Spring Boot transaction
    |
    v
Verify
    |
    v
Respond


============================================================
38. NO FALSE SUCCESS

Never say:

"Your order has been cancelled."

until Spring Boot confirms:

success = true


============================================================
39. NO CROSS-USER DATA

Never return:

Customer A's order to Customer B.

Never return:

Customer A's conversation to Customer B.

Never return:

Customer A's cart to Customer B.

Never return:

Customer A's wishlist to Customer B.


============================================================
40. TESTING

Mandatory security tests:

Test 1:
Customer A cannot view Customer B's conversation.

Test 2:
Customer A cannot view Customer B's messages.

Test 3:
Customer A cannot view Customer B's order.

Test 4:
Customer A cannot cancel Customer B's order.

Test 5:
Customer A cannot return Customer B's order.

Test 6:
Customer A cannot view Customer B's cart.

Test 7:
Customer A cannot view Customer B's wishlist.

Test 8:
Customer A cannot access admin AI conversations.

Test 9:
Order older than 14 days cannot be cancelled.

Test 10:
Order older than 14 days cannot be returned.

Test 11:
Order inside 14 days can be returned if backend says eligible.

Test 12:
Order inside 14 days can be cancelled if backend says eligible.

Test 13:
Cancelled order cannot be cancelled again.

Test 14:
Returned order cannot create duplicate return.

Test 15:
Track Order only returns authenticated customer's orders.


============================================================
41. ENVIRONMENT

Recommended:

AI_AGENT_ENV=development

AI_PROVIDER=openai

AI_API_KEY=

AI_MODEL=

EMBEDDING_MODEL=

SPRING_BOOT_BASE_URL=http://localhost:8080

AI_SERVICE_API_KEY=

DATABASE_URL=

RAG_TOP_K=5

MAX_AGENT_STEPS=10

MAX_TOOL_CALLS=10

MAX_RETRIES=3

REQUEST_TIMEOUT_SECONDS=30

RATE_LIMIT_PER_MINUTE=30


============================================================
42. LOCAL DEVELOPMENT

React:

http://localhost:5173

Spring Boot:

http://localhost:8080

Python AI Agent:

http://localhost:8001

PostgreSQL:

localhost:5432


Run AI Agent:

uvicorn app.main:app --reload --host 0.0.0.0 --port 8001


============================================================
43. FRONTEND AI WIDGET

React component:

<AIChatWidget />

The widget should contain:

- Welcome message
- Quick actions
- Track Order
- Product Search
- Cart
- Wishlist
- Policy questions
- Human support
- Message history


============================================================
44. TRACK ORDER UI

Initial chatbot:

+--------------------------------------+
| AI Shopping Assistant               |
+--------------------------------------+
| Hi! How can I help you?             |
|                                      |
| [Track Order]                        |
| [Find Products]                      |
| [My Cart]                            |
| [My Wishlist]                        |
| [Returns]                            |
| [Store Policies]                     |
| [Talk to Support]                    |
+--------------------------------------+


Click Track Order:

+--------------------------------------+
| Your Orders                          |
+--------------------------------------+
|                                      |
| #ORD-1024                            |
| Black Casual Shirt                   |
| Shipped                              |
|                                      |
| [View Order]                         |
|                                      |
| #ORD-1020                            |
| White T-Shirt                        |
| Delivered                            |
| Return window active                 |
|                                      |
| [View Order]                         |
+--------------------------------------+


Click View Order:

+--------------------------------------+
| Order #ORD-1024                     |
+--------------------------------------+
| Black Casual Shirt                   |
| Size M                               |
| ₹1,299                               |
|                                      |
| Status: Shipped                      |
|                                      |
| [Track Order]                        |
| [Cancel Order]                       |
| [Return Order]                       |
| [View Details]                       |
| [Contact Support]                    |
+--------------------------------------+


============================================================
45. MOBILE UI

The chatbot must work on:

- Desktop
- Tablet
- Mobile

Order cards should be touch friendly.

Action buttons should be clearly separated.

Destructive actions should be visually distinguishable from normal actions.


============================================================
46. CONFIRMATION UX

Cancellation:

+--------------------------------------+
| Cancel Order                         |
+--------------------------------------+
| Order #ORD-1024                     |
|                                      |
| Black Casual Shirt                   |
| ₹1,299                               |
|                                      |
| This order is eligible for           |
| cancellation.                        |
|                                      |
| Are you sure?                        |
|                                      |
| [Confirm Cancellation]               |
| [Keep Order]                         |
+--------------------------------------+


============================================================
47. RETURN UX

+--------------------------------------+
| Return Order                         |
+--------------------------------------+
| Order #ORD-1020                     |
|                                      |
| White T-Shirt                        |
|                                      |
| Return window: 8 days remaining      |
|                                      |
| Select reason:                       |
| [Wrong Size]                         |
| [Damaged]                            |
| [Wrong Product]                      |
| [Other]                              |
|                                      |
| [Continue]                           |
+--------------------------------------+


============================================================
48. EXPIRED RETURN UX

+--------------------------------------+
| Return Unavailable                   |
+--------------------------------------+
| This order is outside the 14-day     |
| return window.                       |
|                                      |
| [Contact Support]                    |
| [View Order]                         |
+--------------------------------------+


============================================================
49. ERROR UX

If order retrieval fails:

"I couldn't retrieve your orders right now.
Please try again."


If cancellation fails:

"I couldn't cancel this order.
The store system returned an error."


If order is not eligible:

"This order is not eligible for cancellation."


Never fabricate success.


============================================================
50. PRODUCTION PRINCIPLE

The chatbot should feel like a human assistant.

But behind the scenes it must behave like a secure application.

LLM:
Language + Understanding + Planning

Spring Boot:
Identity + Authorization + Business Rules + Transactions

PostgreSQL:
Data

React:
Experience


============================================================
51. FINAL FLOW

CUSTOMER

    |
    v

OPEN CHAT

    |
    v

TRACK ORDER

    |
    v

GET ONLY MY ORDERS

    |
    v

SELECT ONE ORDER

    |
    v

SHOW AVAILABLE ACTIONS

    |
    +----------------------+
    |                      |
    v                      v

TRACK                 CANCEL / RETURN
    |                      |
    v                      v
SHOW STATUS          CHECK ELIGIBILITY
                           |
                           v
                     CHECK 14 DAYS
                           |
                           v
                       CONFIRM
                           |
                           v
                    SPRING BOOT
                           |
                           v
                       VERIFY
                           |
                           v
                       RESULT


============================================================
52. NON-NEGOTIABLE RULES
============================================================

RULE 1:

A customer can only see their own chats.


RULE 2:

A customer can only see their own orders.


RULE 3:

A customer can only operate on their own orders.


RULE 4:

14-day cancellation and return policy must be enforced.


RULE 5:

Spring Boot is the final authority.


RULE 6:

The LLM cannot bypass authorization.


RULE 7:

Frontend hiding is not security.


RULE 8:

Every conversation must belong to a customer.


RULE 9:

Every order operation must verify ownership.


RULE 10:

No action can be claimed successful without backend confirmation.


RULE 11:

Admin conversations are visible only to authorized admins.


RULE 12:

No direct commerce database mutation from the AI Agent.


RULE 13:

No arbitrary SQL.


RULE 14:

No customer ID supplied by the LLM or frontend can override authenticated identity.


RULE 15:

The Track Order feature must never show another customer's orders.


============================================================
53. FINAL SYSTEM ARCHITECTURE
============================================================

                         CUSTOMER
                            |
                            v
                  +-------------------+
                  | React Storefront  |
                  |                   |
                  | AIChatWidget      |
                  +---------+---------+
                            |
                            v
                  +-------------------+
                  | Python AI Agent   |
                  |                   |
                  | LLM               |
                  | RAG               |
                  | Agent             |
                  | Tools             |
                  | Guardrails        |
                  +---------+---------+
                            |
                            v
                  +-------------------+
                  |   Spring Boot     |
                  |                   |
                  | Authentication    |
                  | Authorization     |
                  | Orders            |
                  | Cart              |
                  | Wishlist          |
                  | Returns           |
                  | Transactions      |
                  +---------+---------+
                            |
                            v
                  +-------------------+
                  |    PostgreSQL     |
                  |                   |
                  | Commerce Data     |
                  +-------------------+


FINAL PRINCIPLE:

The AI Agent can understand what the customer wants.

The AI Agent can recommend what action should happen.

But Spring Boot must decide whether the action is allowed.

The database must only return data belonging to the authenticated customer.

The customer must never see another customer's conversation or order.

Track Order must show only the authenticated customer's relevant orders.

After selecting an order, the customer sees only the actions available for that specific order.

Cancellation and return are allowed only within 14 days from the purchase/order date, subject to all backend business rules.

Every destructive action requires appropriate confirmation.

Every action must be verified after execution.

The complete system must prioritize:

PRIVACY
SECURITY
CUSTOMER DATA ISOLATION
AUTHORIZATION
14-DAY POLICY ENFORCEMENT
CORRECT ORDER OWNERSHIP
NO HALLUCINATION
NO FALSE SUCCESS
