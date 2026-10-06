# AI COMMERCE AGENT — DESIGN SPECIFICATION

## 1. PURPOSE

The AI Commerce Agent is a customer-facing AI assistant for the clothing e-commerce platform.

The chatbot must provide a human-like shopping and customer-support experience while strictly enforcing:

- Customer authentication
- Customer data isolation
- Order ownership
- 14-day cancellation/return policy
- Backend authorization
- Order-status rules
- Secure tool execution
- Conversation privacy

The AI Agent must never become the source of truth for customer or commerce data.

The architecture is:

React
    ↓
Python AI Agent
    ↓
Spring Boot
    ↓
PostgreSQL


============================================================
2. MOST IMPORTANT PRIVACY REQUIREMENT
============================================================

Every chatbot conversation belongs to exactly one authenticated customer.

Customer A must NEVER see:

- Customer B's conversations
- Customer B's messages
- Customer B's orders
- Customer B's cart
- Customer B's wishlist
- Customer B's addresses
- Customer B's profile
- Customer B's returns
- Customer B's cancellations
- Customer B's support conversations
- Customer B's AI history

The chatbot must never use a global conversation query.

NEVER DO THIS:

SELECT * FROM ai_conversations;

for a customer-facing request.

Instead, every customer request must be scoped to the authenticated customer.

Conceptually:

SELECT *
FROM ai_conversations
WHERE user_id = authenticated_user_id
ORDER BY last_activity_at DESC;

The authenticated_user_id MUST come from the trusted authentication context.

It must NOT come from:

- Chat message
- URL parameter
- Request body
- LLM output
- Frontend-provided arbitrary user ID


============================================================
3. CUSTOMER IDENTITY
============================================================

The system must establish the authenticated customer before accessing:

- Conversations
- Orders
- Cart
- Wishlist
- Addresses
- Profile
- Returns
- Cancellations

The AI model must NEVER decide who the customer is.

The trusted request context should contain:

customerId
email
roles
authenticated
sessionId

Example:

AuthenticationContext:
    customerId = 123
    email = customer@example.com
    roles = CUSTOMER
    authenticated = true
    sessionId = xyz


============================================================
4. CHAT PRIVACY
============================================================

When a customer opens the chatbot:

The system must load only:

- Their conversations
- Their messages
- Their own current session
- Their own customer-specific data

The chatbot must not display:

- Other customers' chats
- Global conversation history
- Other customers' order history
- Other users' support tickets

If the database currently returns all conversations to every customer, this is a critical security vulnerability and MUST be fixed.


============================================================
5. ADMIN CHAT ACCESS
============================================================

There are two completely different visibility levels.

CUSTOMER:

Can see:
- Own conversations
- Own messages
- Own orders
- Own AI actions

ADMIN:

Can see:
- Customer conversations
- Customer messages
- Customer/order context

But only if the authenticated account has the appropriate ADMIN role.

A normal CUSTOMER request must NEVER receive admin conversation data.

Backend authorization must enforce this.

The frontend must not be responsible for hiding unauthorized conversations.

Security must be enforced by Spring Boot.


============================================================
6. TRACK ORDER EXPERIENCE
============================================================

The chatbot must provide a "Track Order" option.

The customer should not immediately receive every order in the database.

When the customer selects:

Track Order

the AI Agent should request the customer's eligible orders from Spring Boot.

Only orders belonging to the authenticated customer may be returned.


============================================================
7. TRACK ORDER LIST
============================================================

The Track Order screen should display only the logged-in customer's orders.

The list should prioritize orders that are:

1. Pending
2. Processing
3. Confirmed
4. Packed
5. Shipped
6. Out for delivery
7. Delivered and still inside the 14-day return/cancellation window
8. Orders with an active return request
9. Orders with an active cancellation request
10. Other relevant active order states

Completed/expired orders can be hidden from the primary Track Order list and can remain available under full order history.


============================================================
8. 14-DAY POLICY
============================================================

Cancellation and return actions are available only within 14 days from the purchase/order date.

The policy is based on:

orderDate / purchaseDate

NOT on:

- Chat date
- Current date alone
- Product upload date
- Delivery date
- AI conversation date

Unless the business backend explicitly changes the rule in the future.

The backend must calculate:

daysSincePurchase = currentDate - purchaseDate

The action is eligible only if:

daysSincePurchase <= 14

and the order status/business rules allow the action.


============================================================
9. IMPORTANT DATE RULE
============================================================

The source of truth for the purchase date must come from Spring Boot.

The AI Agent must NOT calculate eligibility using a date supplied by the user.

Example:

User:
"I bought this two weeks ago."

The AI Agent must retrieve the actual purchase date from Spring Boot.

The backend then decides eligibility.


============================================================
10. TRACK ORDER CARD
============================================================

When Track Order is selected, show order cards.

Example:

+------------------------------------------------+
| Order #ORD-1024                                |
|                                                |
| Black Casual Shirt                             |
| Size: M                                        |
| Quantity: 1                                    |
|                                                |
| Ordered: 05 Oct 2026                           |
| Status: Shipped                                |
|                                                |
| [View Order]                                   |
+------------------------------------------------+

Another:

+------------------------------------------------+
| Order #ORD-1021                                |
|                                                |
| White T-Shirt                                  |
| Size: L                                        |
|                                                |
| Ordered: 01 Oct 2026                           |
| Status: Delivered                              |
| Return window: 9 days remaining                |
|                                                |
| [View Order]                                   |
+------------------------------------------------+


============================================================
11. USER MUST SELECT AN ORDER
============================================================

The chatbot should NOT immediately show:

- Cancel
- Return
- Exchange
- Track
- Modify

for every order.

Instead:

Track Order
    ↓
Show customer's orders
    ↓
Customer clicks an order
    ↓
Show actions for that selected order

This prevents confusion and accidental actions.


============================================================
12. SELECTED ORDER SCREEN
============================================================

When the customer clicks an order:

Show:

Order number
Product image
Product name
Variant
Size
Color
Quantity
Price
Order date
Current status
Shipping information
Expected delivery if available
14-day eligibility status

Then show only the actions applicable to that order.

Example:

+------------------------------------------------+
| Order #ORD-1024                                |
|                                                |
| Black Casual Shirt                             |
| Size: M                                        |
|                                                |
| Status: Shipped                                |
| Ordered: 05 Oct 2026                           |
|                                                |
| [Track Order]                                  |
| [Cancel Order]                                 |
| [Return Order]                                 |
| [View Details]                                 |
+------------------------------------------------+


============================================================
13. DYNAMIC ORDER ACTIONS
============================================================

Actions must be determined by backend order status and policy.

Possible actions:

TRACK_ORDER
VIEW_DETAILS
CANCEL_ORDER
RETURN_ORDER
EXCHANGE_ORDER
CONTACT_SUPPORT

The UI should never blindly display every action.

Example:

If order is shipped:

Show:
- Track Order
- View Details
- Cancel if backend says eligible
- Return if within 14 days and backend says eligible
- Contact Support

If order is delivered and within 14 days:

Show:
- View Details
- Return
- Exchange if supported
- Contact Support

If order is older than 14 days:

Show:
- View Details
- Contact Support

Do not show Return or Cancel if they are not eligible.


============================================================
14. TRACK ORDER ACTION
============================================================

When the customer clicks:

Track Order

the chatbot should show the current tracking state.

Example:

Order #ORD-1024

Status:

Order Confirmed
      ↓
Packed
      ↓
Shipped
      ↓
Out for Delivery
      ↓
Delivered

Current status:

SHIPPED

Tracking information:

Carrier:
Example Carrier

Tracking ID:
TRACK12345

Expected delivery:
08 Oct 2026

Only information returned by Spring Boot may be displayed.


============================================================
15. CANCEL ORDER FLOW
============================================================

Cancellation is a destructive operation.

Flow:

Customer selects Track Order
        ↓
Customer selects Order #ORD-1024
        ↓
Customer clicks Cancel Order
        ↓
AI requests cancellation eligibility
        ↓
Spring Boot checks:
    - Ownership
    - Order status
    - Purchase date
    - 14-day rule
    - Other business rules
        ↓
If eligible:
    Show confirmation
        ↓
Customer clicks Confirm Cancellation
        ↓
Spring Boot performs cancellation
        ↓
Backend confirms success
        ↓
AI shows result


============================================================
16. CANCEL CONFIRMATION UI
============================================================

Example:

Cancel Order?

Order #ORD-1024

Black Casual Shirt
₹1,299

This order is eligible for cancellation.

Are you sure you want to cancel this order?

[Confirm Cancellation]
[Keep Order]


============================================================
17. CANCEL ORDER SECURITY
============================================================

The cancel operation must validate:

1. Customer authentication
2. Customer ownership
3. Order existence
4. Order status
5. Purchase date
6. 14-day eligibility
7. Current backend business rules
8. Confirmation
9. Idempotency

The AI Agent must NOT perform the cancellation itself.

Spring Boot must perform the actual transaction.


============================================================
18. RETURN ORDER FLOW
============================================================

Return flow:

Track Order
    ↓
Select Order
    ↓
Return Order
    ↓
Spring Boot checks:
    - Customer ownership
    - Purchase date
    - 14-day rule
    - Return eligibility
    - Product/order status
    ↓
If eligible:
    Show return confirmation/details
    ↓
Customer confirms
    ↓
Spring Boot creates return
    ↓
Backend confirms
    ↓
AI displays return status


============================================================
19. RETURN WINDOW
============================================================

Return is available only within 14 days from purchase/order date.

Example:

Purchase date:
01 Oct 2026

Current date:
10 Oct 2026

Days elapsed:
9

Return:
ELIGIBLE if all other backend rules pass.


Example:

Purchase date:
01 Sep 2026

Current date:
06 Oct 2026

Days elapsed:
35

Return:
NOT ELIGIBLE under the 14-day rule.


============================================================
20. EXCHANGE
============================================================

If exchange is supported by the commerce backend:

Track Order
    ↓
Select Order
    ↓
Exchange Order
    ↓
Check eligibility
    ↓
Select replacement variant
    ↓
Confirm
    ↓
Spring Boot processes exchange
    ↓
Verify result
    ↓
Display result

Exchange must also obey the 14-day rule unless the backend explicitly defines a different policy.


============================================================
21. NO MANUAL ELIGIBILITY
============================================================

The Python AI Agent must NOT decide:

"Your order is eligible."

unless that information comes from the backend.

The AI Agent may explain:

"Your order is eligible according to the store's current policy."

only after Spring Boot has confirmed eligibility.


============================================================
22. ORDER DATA MODEL
============================================================

Orders should provide information such as:

id
orderNumber
customerId
purchaseDate
status
totalAmount
currency
items
shippingAddress
trackingNumber
carrier
estimatedDelivery
returnEligible
cancelEligible
exchangeEligible

The final structure must match the Spring Boot API.


============================================================
23. ORDER OWNERSHIP
============================================================

Every order request must be scoped by authenticated customer.

Conceptually:

GET /api/orders/my

or:

GET /api/orders/{orderId}

where Spring Boot verifies:

order.customerId == authenticatedCustomerId

Never trust:

GET /api/orders/{orderId}?customerId=123

where customerId is supplied by the frontend.

The authenticated identity must come from the security context.


============================================================
24. CHAT CONVERSATION OWNERSHIP
============================================================

Every AI conversation must belong to one user.

ai_conversations:

id
user_id
session_id
title
status
created_at
updated_at

Every query must enforce:

conversation.user_id == authenticated_user_id

Example:

GET /api/conversations

must return only the current user's conversations.


============================================================
25. MESSAGE OWNERSHIP
============================================================

Messages must always be reached through a customer-owned conversation.

Never expose:

GET /api/messages

without customer scoping.

Correct:

GET /api/conversations/{conversationId}/messages

Spring Boot must verify:

conversation.userId == authenticatedUserId


============================================================
26. CHAT SESSION ISOLATION
============================================================

Every browser session should receive its own conversation/session identifier.

Example:

sessionId:
abc-123

conversationId:
conv-1001

The frontend should not be allowed to switch to another user's conversation ID.

The backend must verify ownership every time.


============================================================
27. CHAT API SECURITY
============================================================

Customer request:

POST /api/chat

The backend should identify:

authenticatedCustomerId

The request body should contain:

conversationId
message

It should NOT contain:

customerId

The customer ID must be derived from authentication.


============================================================
28. PREVENT IDOR
============================================================

The system must specifically defend against IDOR:

Insecure Direct Object Reference.

Example attack:

Customer A changes:

conversationId=100

to:

conversationId=200

and attempts to view Customer B's conversation.

Backend must return:

403 Forbidden

or:

404 Not Found

depending on security design.

No Customer B data should be returned.


============================================================
29. ORDER IDOR PROTECTION
============================================================

The same protection applies to orders.

Customer A must not be able to request:

GET /api/orders/Customer-B-Order

and receive that order.

Spring Boot must verify ownership.


============================================================
30. ADMIN SEPARATION
============================================================

Admin endpoints must be separate from customer endpoints.

Customer:

/api/chat
/api/my-orders
/api/my-conversations

Admin:

/api/admin/ai-conversations
/api/admin/ai-conversations/{id}

Admin endpoints require ADMIN authorization.

A normal CUSTOMER token must never access admin endpoints.


============================================================
31. CHATBOT HOME
============================================================

When the user opens the chatbot, provide clear actions.

Example:

Hi! How can I help you?

[Track Order]

[Find Products]

[Return an Order]

[Cancel an Order]

[My Cart]

[My Wishlist]

[Store Policies]

[Talk to Support]

The options should adapt to authentication state.


============================================================
32. TRACK ORDER QUICK ACTION
============================================================

When the user clicks:

Track Order

the chatbot should call:

GET /api/my/orders/trackable

or equivalent Spring Boot endpoint.

The backend should return only the authenticated customer's trackable/eligible orders.


============================================================
33. TRACKABLE ORDER DEFINITION
============================================================

Trackable orders can include:

- Pending
- Confirmed
- Processing
- Packed
- Shipped
- Out for delivery
- Delivered within active 14-day return window
- Orders with active cancellation request
- Orders with active return request

The exact list should be configurable based on business rules.


============================================================
34. ORDER SELECTION
============================================================

The chatbot should render each order as a clickable card.

When the customer clicks the card:

selectedOrderId

is stored temporarily in conversation state.

The backend must still verify ownership when performing every action.

Frontend selection is NOT authorization.


============================================================
35. ACTION MENU
============================================================

After selecting an order:

Example:

Order #ORD-1024

What would you like to do?

[Track Order]

[Cancel Order]

[Return Order]

[Exchange Order]

[View Details]

[Contact Support]

Only eligible options should be enabled.


============================================================
36. DISABLED ACTIONS
============================================================

If an action is not eligible, the UI may show it as disabled with an explanation.

Example:

[Cancel Order - Not Available]

Reason:
This order has already been delivered and the cancellation window has passed.

However, the backend must still enforce the rule.

Frontend disabling is only UX.


============================================================
37. EXPIRED 14-DAY WINDOW
============================================================

Example:

Order #ORD-1001

Purchase date:
01 September 2026

Today:
06 October 2026

Return window:
Expired

Show:

[View Details]
[Track Order]
[Contact Support]

Do not show an active Return or Cancel button.


============================================================
38. ACTIVE 14-DAY WINDOW
============================================================

Example:

Order #ORD-1020

Purchase date:
02 October 2026

Today:
06 October 2026

Days elapsed:
4

Show appropriate actions:

[Track Order]
[Cancel Order]
[Return Order]
[Exchange Order]
[View Details]


============================================================
39. ALREADY RETURNED
============================================================

If an order already has a return:

Show:

Return Requested

Return ID:
RET-1234

Status:
PENDING

Do not allow the customer to create duplicate returns unless Spring Boot explicitly allows it.


============================================================
40. ALREADY CANCELLED
============================================================

If an order is cancelled:

Show:

Order Cancelled

Cancelled on:
date

Do not show:

Cancel Order

Again.


============================================================
41. ALREADY SHIPPED
============================================================

If cancellation is not possible because the order has shipped:

The backend should return:

cancelEligible = false

The chatbot should explain:

"This order can no longer be cancelled because it has already been shipped."

Do not allow the AI to bypass the backend.


============================================================
42. PRIVACY UI
============================================================

The chatbot should never show another customer's name or order.

Avoid generic messages like:

"Here are all available orders."

Instead:

"Here are your eligible orders."

The backend must guarantee this.


============================================================
43. CONVERSATION HISTORY UI
============================================================

The customer's chat history should show:

My Conversations

Only conversations belonging to the authenticated customer.

Example:

Today
- Order cancellation help
- Black shirts
- Delivery question

Yesterday
- Return request

Never:

All Conversations

for a normal customer.


============================================================
44. ADMIN CHAT MONITORING
============================================================

Admin dashboard can show:

Customer
Conversation
Messages
Orders involved
Tool calls
RAG sources
AI responses
Human handoff

But this page must require:

ROLE_ADMIN

and must be protected at the Spring Boot level.


============================================================
45. ERROR HANDLING
============================================================

If the backend cannot retrieve orders:

"I couldn't retrieve your orders right now. Please try again."

Never:

"Here are your orders"

with stale or guessed information.


============================================================
46. NO HALLUCINATION
============================================================

The AI must never invent:

- Order numbers
- Order status
- Tracking number
- Delivery date
- Purchase date
- Return eligibility
- Cancellation eligibility
- Refund amount
- Return status

All must come from authoritative backend data.


============================================================
47. DESIGN PRINCIPLE
============================================================

The chatbot should feel conversational but behave like a secure application.

The LLM handles:

- Language understanding
- Intent detection
- Conversation
- Planning
- Explanation

The backend handles:

- Identity
- Authorization
- Ownership
- Eligibility
- Transactions
- Business rules
- Data


============================================================
48. FINAL CUSTOMER FLOW
============================================================

OPEN CHAT
    ↓
TRACK ORDER
    ↓
GET ONLY MY ORDERS
    ↓
DISPLAY ORDER CARDS
    ↓
CLICK ONE ORDER
    ↓
DISPLAY AVAILABLE ACTIONS
    ↓
CLICK ACTION
    ↓
SPRING BOOT AUTHORIZATION
    ↓
CHECK 14-DAY RULE
    ↓
CHECK ORDER STATUS
    ↓
CONFIRM IF REQUIRED
    ↓
EXECUTE
    ↓
VERIFY
    ↓
DISPLAY RESULT
