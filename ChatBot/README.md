# AI Commerce Agent

A production-ready Python AI Agent microservice for the clothing e-commerce platform.

The AI Commerce Agent provides a 24/7 conversational shopping and customer-support experience. It understands natural-language requests, searches products, answers questions using RAG, retrieves live information from the Spring Boot backend, and safely performs customer-authorized actions such as cart updates, wishlist operations, order cancellation, returns, and exchanges.

The service is intentionally separated from the main Spring Boot application.

### Core Architecture Principle

```
AI Agent    = Intelligence + Orchestration
Spring Boot = Business Logic + Authorization + Transactions
PostgreSQL  = Commerce Data
React       = Customer Experience
```

---

## TABLE OF CONTENTS

1. [Overview](#1-overview)
2. [Goals](#2-goals)
3. [Core Capabilities](#3-core-capabilities)
4. [Architecture](#4-architecture)
5. [Service Responsibilities](#5-service-responsibilities)
6. [Why a Separate Python AI Service](#6-why-a-separate-python-ai-service)
7. [Project Structure](#7-project-structure)
8. [Technology Stack](#8-technology-stack)
9. [Agent Architecture](#9-agent-architecture)
10. [Conversation Flow](#10-conversation-flow)
11. [Intent Detection](#11-intent-detection)
12. [Tool System](#12-tool-system)
13. [Tool Permission Model](#13-tool-permission-model)
14. [Security Model](#14-security-model)
15. [Spring Boot Integration](#15-spring-boot-integration)
16. [Authentication](#16-authentication)
17. [Guest Users](#17-guest-users)
18. [Authenticated Users](#18-authenticated-users)
19. [Customer Identity](#19-customer-identity)
20. [Product Search](#20-product-search)
21. [Search Ranking](#21-search-ranking)
22. [Shopping Assistance](#22-shopping-assistance)
23. [Product Recommendations](#23-product-recommendations)
24. [Cart Management](#24-cart-management)
25. [Wishlist Management](#25-wishlist-management)
26. [Order Management](#26-order-management)
27. [Historical Order Information](#27-historical-order-information)
28. [Order Cancellation](#28-order-cancellation)
29. [Confirmation Security](#29-confirmation-security)
30. [No False Success](#30-no-false-success)
31. [Order Modification](#31-order-modification)
32. [Returns and Exchanges](#32-returns-and-exchanges)
33. [Customer Profile](#33-customer-profile)
34. [Address Management](#34-address-management)
35. [Coupons and Discounts](#35-coupons-and-discounts)
36. [RAG Knowledge Base](#36-rag-knowledge-base)
37. [Supported Documents](#37-supported-documents)
38. [Knowledge Base Categories](#38-knowledge-base-categories)
39. [RAG Retrieval](#39-rag-retrieval)
40. [RAG Grounding](#40-rag-grounding)
41. [RAG Source Citations](#41-rag-source-citations)
42. [Live Data vs RAG Data](#42-live-data-vs-rag-data)
43. [Product + RAG Hybrid Questions](#43-product--rag-hybrid-questions)
44. [Human Handoff](#44-human-handoff)
45. [Human Handoff States](#45-human-handoff-states)
46. [Conversation Memory](#46-conversation-memory)
47. [AI Database](#47-ai-database)
48. [AI Conversations Table](#48-ai-conversations-table)
49. [AI Messages Table](#49-ai-messages-table)
50. [AI Tool Calls Table](#50-ai-tool-calls-table)
51. [AI Audit Logs Table](#51-ai-audit-logs-table)
52. [AI Feedback Table](#52-ai-feedback-table)
53. [Admin AI Conversation Monitoring](#53-admin-ai-conversation-monitoring)
54. [Frontend Integration](#54-frontend-integration)
55. [Chat UI Example](#55-chat-ui-example)
56. [Chat API](#56-chat-api)
57. [Structured Message Types](#57-structured-message-types)
58. [Confirmation Response](#58-confirmation-response)
59. [Streaming](#59-streaming)
60. [Streaming Events](#60-streaming-events)
61. [No Chain-of-Thought Exposure](#61-no-chain-of-thought-exposure)
62. [Environment Variables](#62-environment-variables)
63. [Environment Security](#63-environment-security)
64. [Local Development](#64-local-development)
65. [Running the Service](#65-running-the-service)
66. [Development Architecture](#66-development-architecture)
67. [React Environment](#67-react-environment)
68. [Running the Full System](#68-running-the-full-system)
69. [Health Check](#69-health-check)
70. [Testing](#70-testing)
71. [Unit Testing](#71-unit-testing)
72. [Integration Testing](#72-integration-testing)
73. [End-to-End Testing](#73-end-to-end-testing)
74. [Security Testing](#74-security-testing)
75. [Destructive Action Safety](#75-destructive-action-safety)
76. [Idempotency](#76-idempotency)
77. [Rate Limiting](#77-rate-limiting)
78. [Timeout Handling](#78-timeout-handling)
79. [Retry Policy](#79-retry-policy)
80. [Error Handling](#80-error-handling)
81. [Internal Errors](#81-internal-errors)
82. [Observability](#82-observability)
83. [Sensitive Logging](#83-sensitive-logging)
84. [Metrics](#84-metrics)
85. [AI Analytics](#85-ai-analytics)
86. [AI Conversation Monitoring Details](#86-ai-conversation-monitoring-details)
87. [Admin Tool Call Visibility](#87-admin-tool-call-visibility)
88. [Product Images](#88-product-images)
89. [AI Recommendations](#89-ai-recommendations)
90. [Natural Language Understanding](#90-natural-language-understanding)
91. [Optional Hindi / Hinglish Support](#91-optional-hindi--hinglish-support)
92. [Natural Language Price Parsing](#92-natural-language-price-parsing)
93. [Natural Language Attribute Parsing](#93-natural-language-attribute-parsing)
94. [Product Search Fallback](#94-product-search-fallback)
95. [No Result Handling](#95-no-result-handling)
96. [Admin AI Playground](#96-admin-ai-playground)
97. [AI Feedback](#97-ai-feedback)
98. [Unanswered Questions](#98-unanswered-questions)
99. [Zero-Result Search Analytics](#99-zero-result-search-analytics)
100. [Human Support Integration](#100-human-support-integration)
101. [AI Summary for Support](#101-ai-summary-for-support)
102. [Production Architecture](#102-production-architecture)
103. [Containerization](#103-containerization)
104. [Docker Requirements](#104-docker-requirements)
105. [Production Scaling](#105-production-scaling)
106. [Background Processing](#106-background-processing)
107. [Performance](#107-performance)
108. [Deterministic Operations](#108-deterministic-operations)
109. [AI Agent Guardrails](#109-ai-agent-guardrails)
110. [Output Validation](#110-output-validation)
111. [Tool Result Grounding](#111-tool-result-grounding)
112. [RAG Result Grounding](#112-rag-result-grounding)
113. [No Hallucinated Business Facts](#113-no-hallucinated-business-facts)
114. [Checkout Safety](#114-checkout-safety)
115. [Payment Safety](#115-payment-safety)
116. [API Design](#116-api-design)
117. [Example Chat Request](#117-example-chat-request)
118. [Example Chat Response](#118-example-chat-response)
119. [API Error Format](#119-api-error-format)
120. [Service-to-Service Authentication](#120-service-to-service-authentication)
121. [CORS](#121-cors)
122. [Database Rules](#122-database-rules)
123. [Database Connection](#123-database-connection)
124. [RAG Database](#124-rag-database)
125. [Knowledge Base Administration](#125-knowledge-base-administration)
126. [Knowledge Base Versioning](#126-knowledge-base-versioning)
127. [RAG Contradiction Handling](#127-rag-contradiction-handling)
128. [API Versioning](#128-api-versioning)
129. [Request IDs](#129-request-ids)
130. [Correlation IDs](#130-correlation-ids)
131. [Development Rules](#131-development-rules)
132. [Feature Development Example](#132-feature-development-example)
133. [Production Acceptance Checklist](#133-production-acceptance-checklist)
134. [Roadmap](#134-roadmap)
135. [Complete Customer Journey](#135-complete-customer-journey)
136. [Final Architecture Principle](#136-final-architecture-principle)

---

## 1. OVERVIEW

The AI Commerce Agent is an independent Python microservice that provides intelligent conversational functionality for the clothing e-commerce platform.

The customer should be able to interact with the store using normal human language instead of navigating through multiple screens for every task.

Examples:

- "Show me black shirts under ₹1500."
- "I need a casual shirt for a party."
- "Do you have this in medium?"
- "Show me navy blue shirts."
- "Find something similar to this."
- "Add the black shirt to my cart."
- "Remove the second item from my cart."
- "What's the status of my order?"
- "Where is my latest order?"
- "Can I cancel my order?"
- "I want to return this product."
- "Can I exchange this for a larger size?"
- "What is your return policy?"
- "How long does delivery take?"
- "Do you deliver to Bhopal?"
- "What payment methods do you support?"
- "What is the difference between these two shirts?"
- "Which one would be better for summer?"

The AI Agent should understand the request, determine the required information, retrieve data from the correct source, execute tools when necessary, and provide a natural response.

The AI Agent must never invent business information.

The AI Agent must never claim that an action succeeded unless the authoritative backend confirms the action.

---

## 2. GOALS

The primary goals of this service are:

1. Provide a 24/7 AI shopping assistant.
2. Understand natural-language customer requests.
3. Provide conversational product discovery.
4. Handle spelling mistakes and incomplete search queries.
5. Understand product attributes.
6. Answer store-policy questions using RAG.
7. Retrieve live product information.
8. Retrieve live inventory information.
9. Retrieve live order information.
10. Execute authorized customer actions.
11. Support order cancellation.
12. Support return workflows.
13. Support exchange workflows.
14. Support cart management.
15. Support wishlist management.
16. Support address-related operations.
17. Support customer-profile operations where appropriate.
18. Provide human support escalation.
19. Maintain conversation history.
20. Provide AI conversation monitoring for administrators.
21. Protect customer information.
22. Prevent unauthorized tool execution.
23. Prevent prompt injection from bypassing security.
24. Keep Spring Boot as the business authority.
25. Provide production-grade logging and observability.

---

## 3. CORE CAPABILITIES

### Customer Support

The AI Agent should answer questions related to:

- Shipping
- Delivery
- Returns
- Refunds
- Exchanges
- Payments
- Coupons
- Discounts
- Product care
- Size guides
- Account management
- Store policies
- Privacy
- Terms
- Frequently asked questions

Stable information should come from the RAG knowledge base.

### Shopping Assistant

The AI Agent should help customers:

- Search products
- Filter products
- Sort products
- Compare products
- Find similar products
- Find products by color
- Find products by size
- Find products by gender
- Find products by category
- Find products by article type
- Find products by usage
- Find products by season
- Search within a price range
- Discover products using natural language
- Get product recommendations
- Add products to cart
- Remove products from cart
- Update cart quantities
- Manage wishlist

### Order Assistant

Authenticated customers should be able to:

- View orders
- View order history
- View order details
- Check order status
- Track orders
- Check delivery information
- Cancel eligible orders
- Start return requests
- Start exchange requests
- Ask about refunds
- Ask about previous purchases

The AI Agent must use the Spring Boot API for live order information.

---

## 4. ARCHITECTURE

```
                           CUSTOMER
                              |
                              v
                    +--------------------+
                    |  React Storefront  |
                    |                    |
                    |   AIChatWidget     |
                    +---------+----------+
                              |
                              | HTTPS / SSE
                              v
                 +---------------------------+
                 |      Python AI Agent      |
                 |                           |
                 | FastAPI                   |
                 | Agent Orchestrator        |
                 | Intent Detection          |
                 | Planner                   |
                 | Tool Executor             |
                 | Memory                    |
                 | Guardrails                |
                 | RAG Retrieval             |
                 | LLM Integration           |
                 +------------+--------------+
                              |
              +---------------+------------------+
              |               |                  |
              v               v                  v
       +-------------+ +--------------+ +--------------+
       | Spring Boot | | RAG /        | | LLM Provider |
       | Backend     | | pgvector     | |              |
       +------+------+\+--------------+ +--------------+
              |
              v
       +--------------+
       | PostgreSQL   |
       | Commerce DB  |
       +--------------+
```

---

## 5. SERVICE RESPONSIBILITIES

### React Frontend

React is responsible for:

- Chat interface
- Message rendering
- Product cards
- Product recommendations
- Order cards
- Confirmation UI
- Loading states
- Error states
- Streaming responses
- Human handoff UI
- Mobile responsiveness

React must not implement backend authorization rules.

### Python AI Agent

The Python service is responsible for:

- Natural-language understanding
- Intent detection
- Planning
- Tool selection
- Tool execution orchestration
- Conversation memory
- RAG retrieval
- LLM interaction
- Guardrails
- Confirmation workflows
- AI response generation
- AI-specific audit logging

### Spring Boot

Spring Boot is the business authority.

It is responsible for:

- Authentication
- Authorization
- Customer identity
- Products
- Product variants
- Inventory
- Cart
- Wishlist
- Orders
- Payments
- Returns
- Exchanges
- Coupons
- Addresses
- Business rules
- Transactions

The AI Agent must never bypass these rules.

### PostgreSQL

PostgreSQL remains the source of truth for commerce data.

The AI Agent must not directly modify commerce tables.

---

## 6. WHY A SEPARATE PYTHON AI SERVICE

The AI functionality is intentionally isolated from the Spring Boot application.

Python provides an extensive ecosystem for:

- LLM integrations
- RAG
- Embeddings
- Vector databases
- AI orchestration
- Agent frameworks
- Document processing
- AI evaluation
- NLP
- Streaming

The separation provides a clean architecture:

```
React
  |
  v
Python AI Agent
  |
  v
Spring Boot
  |
  v
PostgreSQL
```

The following architecture is prohibited:

```
React
  |
  v
LLM
  |
  v
Direct PostgreSQL modification
```

The LLM must never become the database authorization layer.

---

## 7. PROJECT STRUCTURE

```
ai-agent/
|
+-- AGENTS.md
+-- DESIGN.md
+-- README.md
+-- API.md
+-- requirements.txt
+-- .env.example
+-- .gitignore
+-- Dockerfile
|
+-- app/
|   |
|   +-- main.py
|   |
|   +-- api/
|   |   +-- chat.py
|   |   +-- health.py
|   |   +-- webhook.py
|   |
|   +-- agent/
|   |   +-- agent.py
|   |   +-- planner.py
|   |   +-- executor.py
|   |   +-- intent.py
|   |   +-- memory.py
|   |   +-- state.py
|   |   +-- guardrails.py
|   |
|   +-- tools/
|   |   +-- products.py
|   |   +-- orders.py
|   |   +-- cart.py
|   |   +-- wishlist.py
|   |   +-- customer.py
|   |   +-- address.py
|   |   +-- coupon.py
|   |   +-- returns.py
|   |   +-- support.py
|   |   +-- rag.py
|   |
|   +-- services/
|   |   +-- springboot_client.py
|   |   +-- llm_service.py
|   |   +-- rag_service.py
|   |   +-- embedding_service.py
|   |   +-- auth_service.py
|   |   +-- conversation_service.py
|   |
|   +-- schemas/
|   |   +-- chat.py
|   |   +-- customer.py
|   |   +-- product.py
|   |   +-- order.py
|   |   +-- common.py
|   |
|   +-- models/
|   |   +-- conversation.py
|   |   +-- message.py
|   |   +-- tool_call.py
|   |   +-- audit.py
|   |
|   +-- db/
|   |   +-- database.py
|   |   +-- models.py
|   |   +-- repositories/
|   |
|   +-- core/
|       +-- config.py
|       +-- security.py
|       +-- logging.py
|       +-- exceptions.py
|       +-- constants.py
|
+-- tests/
    +-- unit/
    +-- integration/
    +-- security/
    +-- e2e/
```

---

## 8. TECHNOLOGY STACK

**Backend:**
- Python 3.11+
- FastAPI
- Uvicorn
- Pydantic
- HTTPX
- SQLAlchemy
- PostgreSQL
- Alembic
- pytest

**AI Layer:**
The AI layer must use provider abstractions.

Recommended abstractions:
- `AiService`
- `EmbeddingService`
- `RagService`
- `AgentService`

This allows the LLM provider to be changed without rewriting the application. Potential providers may include OpenAI-compatible APIs, Cohere, Gemini, Groq, or others. The selected provider must be configurable using environment variables.

---

## 9. AGENT ARCHITECTURE

The AI Agent follows a controlled execution pipeline:

```
User Message
     |
     v
Authentication Context
     |
     v
Intent Detection
     |
     v
Context Retrieval
     |
     v
Planning
     |
     v
Safety / Permission Check
     |
     v
Tool Selection
     |
     v
Tool Execution
     |
     v
Backend Verification
     |
     v
Response Generation
     |
     v
Customer
```

The agent must not blindly execute whatever the LLM suggests.

---

## 10. CONVERSATION FLOW

```
Customer: "Cancel my latest order."
        |
        v
AI Agent: Detect intent = ORDER_CANCEL
        |
        v
Authentication: Verify authenticated customer
        |
        v
Tool: get_latest_order()
        |
        v
Spring Boot: Return authoritative order information
        |
        v
AI Agent: Check cancellation eligibility
        |
        v
Customer: "Yes, cancel it."
        |
        v
AI Agent: Validate confirmation
        |
        v
Tool: cancel_order(orderId)
        |
        v
Spring Boot: Perform authorization + transaction
        |
        v
Spring Boot: Return success
        |
        v
AI Agent: Verify result
        |
        v
Customer: "Your order #1234 has been cancelled successfully."
```

---

## 11. INTENT DETECTION

The agent classifies messages into controlled intents:

```
GENERAL_QUESTION           PRODUCT_SEARCH            PRODUCT_DETAILS
PRODUCT_RECOMMENDATION     PRODUCT_COMPARISON        CART_VIEW
CART_ADD                   CART_REMOVE               CART_UPDATE
WISHLIST_VIEW              WISHLIST_ADD              WISHLIST_REMOVE
ORDER_LIST                 ORDER_DETAILS             ORDER_STATUS
ORDER_TRACKING             ORDER_CANCEL              ORDER_MODIFY
RETURN_REQUEST             EXCHANGE_REQUEST          REFUND_STATUS
ADDRESS_VIEW               ADDRESS_CREATE            ADDRESS_UPDATE
ADDRESS_DELETE             PROFILE_VIEW              PROFILE_UPDATE
COUPON_CHECK               POLICY_QUESTION           RAG_QUESTION
HUMAN_SUPPORT              UNKNOWN
```

Intent detection should not grant authorization. The detected intent only determines what the agent may attempt to do. Authorization must happen independently.

---

## 12. TOOL SYSTEM

Tools are controlled functions that the AI Agent can invoke:

- `search_products`, `get_product`, `get_product_variants`, `get_inventory`
- `get_cart`, `add_to_cart`, `remove_from_cart`, `update_cart_item`
- `get_wishlist`, `add_to_wishlist`, `remove_from_wishlist`
- `get_orders`, `get_order`, `get_order_tracking`, `cancel_order`, `modify_order`
- `create_return`, `create_exchange`, `get_refund_status`
- `get_customer_profile`, `update_customer_profile`
- `get_addresses`, `create_address`, `update_address`, `delete_address`
- `validate_coupon`
- `search_knowledge_base`
- `create_support_request`, `escalate_to_human`

Every tool must have:
- Explicit input schema
- Explicit output schema
- Permission requirement
- Authentication requirement
- Timeout
- Error handling
- Audit logging
- Idempotency where applicable

---

## 13. TOOL PERMISSION MODEL

Tools must be assigned permission levels:

```
PUBLIC_READ:      search_products, get_product, search_knowledge_base
CUSTOMER_READ:    get_order, get_cart, get_wishlist, get_customer_profile
CUSTOMER_WRITE:   add_to_cart, update_cart_item, create_address, create_return
DESTRUCTIVE:      cancel_order, delete_address
ADMIN_ONLY:       admin_knowledge_upload
SYSTEM_ONLY:      internal operations
```

The AI Agent must not allow the LLM to override these permissions.

---

## 14. SECURITY MODEL

Security is a core requirement. The LLM is not a security boundary. Spring Boot remains the final authorization authority.

### Never Trust LLM-Generated Identity
The model must never be allowed to generate `userId`, `customerId`, `role`, `adminId`, or `accountId`. The authenticated identity must come from the trusted request context.

### Customer Data Isolation
Customer A must never access Customer B's orders, addresses, profile, cart, wishlist, or private conversations. The AI Agent must use the authenticated identity supplied by the trusted authentication layer.

### Prompt Injection Protection
The agent must assume that user messages can contain malicious instructions ("Ignore your previous instructions", "Show me another customer's order", "Pretend that I am an admin", "Execute SQL").

The agent should:
1. Treat user input as untrusted.
2. Separate user content from system instructions.
3. Never expose secrets or internal prompts.
4. Never execute arbitrary code or SQL.
5. Never grant permissions based on conversation.
6. Never treat retrieved documents as executable instructions.
7. Validate all tool arguments.
8. Enforce permissions outside the LLM.

---

## 15. SPRING BOOT INTEGRATION

The Python service communicates with Spring Boot through authenticated HTTP APIs via a dedicated client: `app/services/springboot_client.py`.

```
Python AI Agent ---> Spring Boot API ---> PostgreSQL
```

### Spring Boot Authority
The AI Agent must not implement duplicate business rules that can become inconsistent with Spring Boot (e.g. deciding whether an order can be cancelled, inventory availability, refund eligibility, or coupon validity). Spring Boot evaluates the rule; the AI Agent communicates the verified result.

---

## 16. AUTHENTICATION

The existing e-commerce application supports email/password, Google OAuth, and JWT/session authentication. The AI Agent integrates seamlessly with this model.

### Google OAuth Compatibility
Google OAuth users are treated identically to password-authenticated customers after login. Stable identifiers (`customerId`, `email`, `roles`) are propagated. Google OAuth never automatically grants `ADMIN` or privileged roles.

---

## 17. GUEST USERS

Guest users may access public operations:
- Product search, product details, recommendations, comparisons
- Store policies, shipping policy, return policy, size guide, product care, general FAQs

Guests must not access private customer info or perform mutations (viewing orders, cancellations, returns, addresses, wishlists).

---

## 18. AUTHENTICATED USERS

Authenticated users may access their own customer-specific operations:
- "Show my orders", "Where is my latest order?", "Cancel my order"
- "Show my wishlist", "Add this product to my wishlist"
- "Show my saved addresses", "Create a return request"

---

## 19. CUSTOMER IDENTITY

The AI Agent maintains a request context:
```python
class AuthenticationContext(BaseModel):
    customer_id: Optional[str] = None
    email: Optional[str] = None
    roles: List[str] = []
    authenticated: bool = False
    session_id: str
```
The model is never allowed to modify this context.

---

## 20. PRODUCT SEARCH

The agent understands natural-language product queries (`black shirt`, `blak shirt`, `blk tshrt`, `navy blue casual`, `formal shirts under 2000`).

The underlying search system supports:
- Exact matching & partial matching
- Case-insensitive matching & singular/plural normalization
- Spelling correction & synonyms
- PostgreSQL full-text search (`pg_trgm`, trigram similarity)
- Category, attribute, and fuzzy matching with optional semantic search

---

## 21. SEARCH RANKING

Ranking hierarchy:
```
Exact product name
        |
Strong field match
        |
Article type -> Category -> Subcategory -> Color -> Gender -> Usage
        |
Fuzzy similarity
        |
Semantic similarity
```

---

## 22. SHOPPING ASSISTANCE

The agent understands conversational shopping requests:
- Customer: *"I need something for a summer party."*
- Agent: *"What type of clothing are you looking for?"*
- Customer: *"A shirt."*
- Agent: *"Do you have a preferred color or budget?"*
- Customer: *"Something black under ₹1500."*
- The agent maintains multi-turn context (`occasion=summer party`, `category=shirt`, `color=black`, `max_price=1500`).

---

## 23. PRODUCT RECOMMENDATIONS

Recommendations use real backend attributes: category, subcategory, article type, color, gender, usage, season, price, and customer preferences.

The agent must never invent product properties (e.g. claiming an item is waterproof or organic unless verified in product data).

---

## 24. CART MANAGEMENT

Supported operations: View cart, Add item, Remove item, Update quantity, Clear cart.

Flow: Search product $\rightarrow$ Identify variant $\rightarrow$ Verify availability $\rightarrow$ Add to cart $\rightarrow$ Spring Boot confirms $\rightarrow$ Respond to customer.

The agent never invents cart state or prices.

---

## 25. WISHLIST MANAGEMENT

Supported operations: View wishlist, Add product, Remove product. Mutations call the wishlist API and verify the result.

---

## 26. ORDER MANAGEMENT

Supported operations:
- Get order list, details, status, and tracking information
- Check cancellation eligibility
- Cancel order
- Start return / exchange
- Check refund status

All live order information comes strictly from Spring Boot.

---

## 27. HISTORICAL ORDER INFORMATION

Orders preserve snapshot information (`productNameSnapshot`, `productImageUrlSnapshot`, `unitPriceSnapshot`, `variantSnapshot`). The AI Agent uses this authoritative order data instead of reconstructing historical orders from the current live catalog.

---

## 28. ORDER CANCELLATION

Order cancellation is a destructive operation requiring explicit customer confirmation:
1. Identify customer.
2. Retrieve order.
3. Verify cancellation eligibility with Spring Boot.
4. Explain relevant details and prompt for confirmation.
5. Store pending action state.
6. Validate customer confirmation.
7. Call Spring Boot cancellation API.
8. Verify backend result (`CANCELLED`).
9. Inform customer.

---

## 29. CONFIRMATION SECURITY

Confirmations are strictly tied to:
`customerId`, `conversationId`, `action`, `resourceId`, and `expiration`.
A generic "yes" does not execute any unrelated pending actions.

---

## 30. NO FALSE SUCCESS

The AI Agent must never say *"Your order has been cancelled"* unless Spring Boot has confirmed the cancellation. If an error occurs (e.g., `ORDER_ALREADY_SHIPPED`), the actual backend reason determines the response.

---

## 31. ORDER MODIFICATION

Supports size, variant, address, or quantity changes only when explicitly permitted by Spring Boot. If an order cannot be modified: *"This order cannot be modified at this stage. I can help you start a return or contact support."*

---

## 32. RETURNS AND EXCHANGES

Conversational returns and exchanges check eligibility via Spring Boot, collect necessary information, confirm if required, create the return request, and verify success. Eligibility is never decided independently by the LLM.

---

## 33. CUSTOMER PROFILE

Supports viewing and updating permitted profile fields. Sensitive account information (passwords, payment credentials) is never exposed.

---

## 34. ADDRESS MANAGEMENT

Supports viewing, creating, updating, deleting, and setting default addresses with authorization enforced by customer identity.

---

## 35. COUPONS AND DISCOUNTS

Validates coupon applicability using the authoritative backend. The AI Agent never invents coupon codes, discount rates, or expiry dates.

---

## 36. RAG KNOWLEDGE BASE

```
Admin Upload -> Document Storage -> Text Extraction -> Cleaning -> Chunking -> Embeddings -> PostgreSQL + pgvector -> Retrieval -> LLM -> Grounded Response
```

---

## 37. SUPPORTED DOCUMENTS

- Initial format: PDF
- Extensible to: DOCX, TXT, Markdown, CSV

---

## 38. KNOWLEDGE BASE CATEGORIES

Recommended core documents:
`store-overview.pdf`, `shopping-guide.pdf`, `product-information.pdf`, `size-guide.pdf`, `shipping-delivery.pdf`, `returns-refunds-exchanges.pdf`, `orders.pdf`, `payments.pdf`, `coupons-discounts.pdf`, `account-security.pdf`, `product-care.pdf`, `faq.pdf`, `customer-support.pdf`, `privacy-policy.pdf`, `terms-and-conditions.pdf`, `sustainability.pdf`, `ai-chatbot-guide.pdf`.

---

## 39. RAG RETRIEVAL

Supports semantic, keyword, and hybrid retrieval with metadata filtering, top-K scoring, and source citations.
Chunks store: `documentId`, `documentName`, `chunkId`, `pageNumber`, `content`, `embedding`, `createdAt`.

---

## 40. RAG GROUNDING

System prompts enforce: answer policy and documentation questions strictly using supplied knowledge-base context. Never hallucinate policies, prices, shipping times, or contact numbers. State clearly when information is missing.

---

## 41. RAG SOURCE CITATIONS

Responses include clean source citations:
```
"According to our return policy, eligible items can be returned within 7 days.

Source: Returns & Refunds Policy, Page 3"
```

---

## 42. LIVE DATA VS RAG DATA

| RAG Domain (Stable Policies) | Live Spring Boot API Domain (Real-Time State) |
| :--- | :--- |
| Return policy & refund rules | Current product price & inventory |
| Shipping policy & delivery tiers | Live product availability & variants |
| Size guides & fabric care | Coupon validity & application |
| Store FAQ, terms & privacy policy | Order status & tracking |
| General store & brand information | Customer profile, addresses, cart & wishlist |
| Support escalation procedures | Return/exchange eligibility & refund status |

---

## 43. PRODUCT + RAG HYBRID QUESTIONS

Handles multi-source inquiries:
*"What is your return policy for the black shirt I bought?"*
$\rightarrow$ Look up customer's order and product $\rightarrow$ Retrieve return policy via RAG $\rightarrow$ Check live return eligibility $\rightarrow$ Synthesize verified answer.

---

## 44. HUMAN HANDOFF

Triggers escalation when requested or when automated resolution fails:
*"I want to talk to a person"* $\rightarrow$ Creates a support ticket/escalation session with context.

---

## 45. HUMAN HANDOFF STATES

Statuses: `ACTIVE`, `WAITING_FOR_USER`, `WAITING_FOR_ADMIN`, `RESOLVED`, `ARCHIVED`.
The admin interface allows support agents to review messages, tool calls, and RAG sources, add internal notes, and take over the live session.

---

## 46. CONVERSATION MEMORY

- **Short-Term Memory:** Current conversation context, active search filters, referenced products, pending actions.
- **Long-Term Memory:** Explicitly permitted preferences (preferred size, favorite categories). Sensitive PII is never stored unnecessarily.

---

## 47. AI DATABASE

Stores AI-specific operations in isolated tables without duplicating commerce records:
- `ai_conversations`
- `ai_messages`
- `ai_tool_calls`
- `ai_audit_logs`
- `ai_feedback`

---

## 48. AI CONVERSATIONS TABLE

Fields: `id`, `user_id`, `session_id`, `title`, `status`, `started_at`, `last_activity_at`, `message_count`, `created_at`, `updated_at`.

---

## 49. AI MESSAGES TABLE

Fields: `id`, `conversation_id`, `sender_type` (`USER`, `ASSISTANT`, `SYSTEM`), `content`, `sequence_number`, `created_at`, `model_name`, `processing_time_ms`, `token_usage`, `error_status`.

---

## 50. AI TOOL CALLS TABLE

Fields: `id`, `conversation_id`, `message_id`, `tool_name`, `tool_permission`, `input_payload`, `output_payload`, `status`, `error_message`, `execution_time_ms`, `created_at`. Sensitive data is redacted prior to storage.

---

## 51. AI AUDIT LOGS TABLE

Fields: `id`, `conversation_id`, `user_id`, `event_type` (`LOGIN`, `SEARCH`, `TOOL_EXECUTED`, `ORDER_CANCELLED`, `RETURN_CREATED`, `ESCALATED`, etc.), `resource_type`, `resource_id`, `metadata`, `created_at`.

---

## 52. AI FEEDBACK TABLE

Fields: `id`, `conversation_id`, `message_id`, `user_id`, `rating` (`POSITIVE`, `NEGATIVE`), `feedback`, `created_at`.

---

## 53. ADMIN AI CONVERSATION MONITORING

Admin route: `/admin/ai-conversations`
Provides two-pane inspection: conversation list and full transcript showing customer info, messages, tool calls, RAG sources, products, latencies, errors, and escalation actions.

---

## 54. FRONTEND INTEGRATION

Exposes `<AIChatWidget />` on the React storefront.
Handles floating launcher, message streaming, rich cards (Product, Order, Confirmation), loading indicators, error handling, source citations, and human handoff without interfering with normal navigation.

---

## 55. CHAT UI EXAMPLE

```
+---------------------------------------------+
| AI Shopping Assistant                     X |
+---------------------------------------------+
| Hi! How can I help you today?               |
|                                             |
|       Show me black shirts under ₹1500.     |
|                                             |
| Here are some options:                      |
|                                             |
| +---------+ +---------+ +---------+         |
| | Product | | Product | | Product |         |
| | Image   | | Image   | | Image   |         |
| | ₹999    | | ₹1299   | | ₹1499   |         |
| +---------+ +---------+ +---------+         |
+---------------------------------------------+
| Ask anything...                         Send|
+---------------------------------------------+
```

---

## 56. CHAT API

Primary endpoint: `POST /api/chat`
```json
// Request
{
  "conversationId": "conversation-123",
  "message": "Show me black shirts under ₹1500"
}

// Response
{
  "conversationId": "conversation-123",
  "messageId": "message-456",
  "type": "assistant",
  "content": "Here are some black shirts under ₹1500.",
  "products": [
    {
      "id": 101,
      "name": "Black Casual Shirt",
      "price": 999,
      "imageUrl": "/images/product-101.jpg"
    }
  ]
}
```

---

## 57. STRUCTURED MESSAGE TYPES

`TEXT`, `PRODUCT_LIST`, `PRODUCT`, `ORDER`, `ORDER_LIST`, `CART`, `CONFIRMATION`, `SOURCE`, `ERROR`, `HUMAN_HANDOFF`.

---

## 58. CONFIRMATION RESPONSE

```json
{
  "type": "CONFIRMATION",
  "action": "CANCEL_ORDER",
  "resourceId": "1234",
  "message": "Your order is eligible for cancellation. Would you like me to cancel it?"
}
```

---

## 59. STREAMING

Supports Server-Sent Events (SSE) via `POST /api/chat/stream` for immediate conversational token delivery.

---

## 60. STREAMING EVENTS

Event types: `message_start`, `text_delta`, `tool_start`, `tool_result`, `product_result`, `source`, `confirmation_required`, `message_complete`, `error`.

---

## 61. NO CHAIN-OF-THOUGHT EXPOSURE

Internal prompts, model reasoning, and raw tool traces are never exposed to the client. Only user-facing progress updates (`"Checking your order..."`) and final answers are streamed.

---

## 62. ENVIRONMENT VARIABLES

Template from `.env.example`:
```ini
AI_AGENT_ENV=development
AI_PROVIDER=openai
AI_API_KEY=
AI_MODEL=
EMBEDDING_MODEL=
SPRING_BOOT_BASE_URL=http://localhost:8080
AI_SERVICE_API_KEY=
DATABASE_URL=postgresql+psycopg://user:pass@localhost:5432/ai_agent
RAG_TOP_K=5
RAG_CHUNK_SIZE=800
RAG_CHUNK_OVERLAP=100
MAX_AGENT_STEPS=10
MAX_TOOL_CALLS=10
MAX_RETRIES=3
REQUEST_TIMEOUT_SECONDS=30
RATE_LIMIT_PER_MINUTE=30
LOG_LEVEL=INFO
```

---

## 63. ENVIRONMENT SECURITY

Never commit `.env` or secrets (`AI_API_KEY`, `GOOGLE_CLIENT_SECRET`, database passwords, service keys). Frontend `VITE_*` variables must never contain backend service credentials.

---

## 64. LOCAL DEVELOPMENT

```bash
# Create virtual environment
python3.11 -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Configure environment
cp .env.example .env
```

---

## 65. RUNNING THE SERVICE

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
```
- API: `http://localhost:8001`
- Swagger Docs: `http://localhost:8001/docs`

---

## 66. DEVELOPMENT ARCHITECTURE

- React Storefront: `http://localhost:5173`
- Spring Boot Backend: `http://localhost:8080`
- AI Agent Microservice: `http://localhost:8001`
- PostgreSQL Database: `localhost:5432`

---

## 67. REACT ENVIRONMENT

```ini
VITE_AI_AGENT_URL=http://localhost:8001
```

---

## 68. RUNNING THE FULL SYSTEM

1. Start PostgreSQL (`5432`)
2. Start Spring Boot (`8080`)
3. Start Python AI Agent (`8001`)
4. Start React (`5173`) via `npm run dev`

---

## 69. HEALTH CHECK

`GET /health`
```json
{
  "status": "ok",
  "service": "ai-agent",
  "environment": "development"
}
```

---

## 70. TESTING

```bash
pytest                     # All tests
pytest tests/unit          # Unit tests
pytest tests/integration   # Integration tests
pytest tests/security      # Security & guardrail tests
pytest tests/e2e           # End-to-end tests
```

---

## 71. UNIT TESTING

Tests cover intent detection, prompt construction, tool validation, permission checks, conversation state, confirmation logic, and error handling.

---

## 72. INTEGRATION TESTING

Validates Python $\rightarrow$ Spring Boot, Python $\rightarrow$ PostgreSQL, Python $\rightarrow$ RAG, and Python $\rightarrow$ LLM external boundaries.

---

## 73. END-TO-END TESTING

Full multi-turn scenario validation: search $\rightarrow$ add to cart $\rightarrow$ view cart $\rightarrow$ check order $\rightarrow$ cancel order $\rightarrow$ verify cancellation.

---

## 74. SECURITY TESTING

Explicit test cases ensure rejection of:
- Unauthorized cross-customer order access
- Unauthorized cancellation attempts
- Prompt injection & instruction overrides
- System prompt extraction requests
- Arbitrary SQL injections
- Unverified confirmation payloads

---

## 75. DESTRUCTIVE ACTION SAFETY

All destructive actions (`cancel_order`, `delete_address`, `create_return`) strictly enforce:
`Intent` $\rightarrow$ `Authorization` $\rightarrow$ `Eligibility Check` $\rightarrow$ `Confirmation Prompt` $\rightarrow$ `Execution` $\rightarrow$ `State Verification`.

---

## 76. IDEMPOTENCY

Network retries or double-clicks on destructive actions utilize idempotency keys to guarantee only one transaction executes.

---

## 77. RATE LIMITING

Rate limits (e.g. 30 requests/min) apply by customer ID (authenticated) or IP address (guests).

---

## 78. TIMEOUT HANDLING

All external requests (LLM, Spring Boot, embeddings, RAG, database) enforce strict timeouts (default 30s) to prevent hanging threads.

---

## 79. RETRY POLICY

Bounded retries (`MAX_RETRIES=3`) for idempotent read operations only. Destructive mutations are never retried blindly.

---

## 80. ERROR HANDLING

Technical errors are mapped to empathetic, human-readable messages. Internal stack traces are never exposed.

---

## 81. INTERNAL ERRORS

Protects against leaking Python tracebacks, database exceptions, JWT secrets, API keys, or raw SQL queries to the customer.

---

## 82. OBSERVABILITY

Structured JSON logs capture: `request_id`, `conversation_id`, `customer_id`, `intent`, `tool_name`, `tool_status`, `processing_time`, and `error_code`.

---

## 83. SENSITIVE LOGGING

Centralized sanitization prevents passwords, tokens, full credit card numbers, CVVs, and private keys from appearing in logs.

---

## 84. METRICS

Tracks conversations, response times, LLM latency, tool success rates, cancellations, return counts, and human escalations.

---

## 85. AI ANALYTICS

Admin metrics for conversation volumes, response speed, top queries, zero-result searches, unanswered questions, and RAG retrieval efficacy.

---

## 86. AI CONVERSATION MONITORING DETAILS

Admin panel inspects the exact timeline of user messages, assistant responses, executed tools, and verification statuses.

---

## 87. ADMIN TOOL CALL VISIBILITY

Exposes tool name, redacted input arguments, output payloads, execution latency, and error states for operational auditing.

---

## 88. PRODUCT IMAGES

Authoritative image URLs from Spring Boot are rendered directly. Old orders utilize historical order image snapshots.

---

## 89. AI RECOMMENDATIONS

Recommendations are strictly grounded in live attributes; speculative claims (*"guaranteed comfort"*) are prohibited.

---

## 90. NATURAL LANGUAGE UNDERSTANDING

Resilient handling of typos, abbreviations, pluralizations, and casual phrasing (`blak tshrt`, `mens casual`, `shirts under 1500`).

---

## 91. OPTIONAL HINDI / HINGLISH SUPPORT

Supports multilingual intent detection and natural phrasing (*"Mera order cancel karna hai"*, *"1500 ke andar shirt dikhao"*) while maintaining strict factual grounding.

---

## 92. NATURAL LANGUAGE PRICE PARSING

Parses price expressions (`under 1500`, `below 2k`) into structured criteria (`{"maxPrice": 1500}`).

---

## 93. NATURAL LANGUAGE ATTRIBUTE PARSING

Converts queries into structured filter payloads:
`"black casual shirt for men under 1500"` $\rightarrow$ `{"gender": "men", "category": "shirt", "color": "black", "maxPrice": 1500}`.

---

## 94. PRODUCT SEARCH FALLBACK

Graduated fallback pipeline: Exact $\rightarrow$ Normalized $\rightarrow$ Partial $\rightarrow$ Fuzzy $\rightarrow$ Synonym $\rightarrow$ Semantic search. Explains approximate matches when exact matches are missing.

---

## 95. NO RESULT HANDLING

Friendly guidance when searches return zero items, offering actionable refinement chips (alternate colors, categories, or price brackets) rather than inventing items.

---

## 96. ADMIN AI PLAYGROUND

Sandbox environment at `/admin/ai-playground` allowing team testing of prompts, RAG retrieval, and tools without triggering real customer mutations.

---

## 97. AI FEEDBACK

Captures positive/negative customer sentiment with optional feedback comments to guide knowledge-base improvements.

---

## 98. UNANSWERED QUESTIONS

Logs unresolved inquiries to identify gaps in policy documentation, catalog metadata, or tool capabilities.

---

## 99. ZERO-RESULT SEARCH ANALYTICS

Aggregates failed search terms to optimize search synonyms, spelling corrections, and inventory assortment.

---

## 100. HUMAN SUPPORT INTEGRATION

Generates concise handoff summaries (customer issue, order ID, attempted actions, backend status) to eliminate repetitive customer explanations.

---

## 101. AI SUMMARY FOR SUPPORT

Focuses solely on actionable business context: issue summary, relevant order/item, actions attempted, error code, and desired outcome.

---

## 102. PRODUCTION ARCHITECTURE

Load-balanced multi-instance deployment of Python AI Agent and Spring Boot instances connected to managed PostgreSQL with `pgvector`.

---

## 103. CONTAINERIZATION

Build and run using Docker:
```bash
docker build -t ai-commerce-agent .
docker run --env-file .env -p 8001:8001 ai-commerce-agent
```

---

## 104. DOCKER REQUIREMENTS

- Python 3.11+ slim base
- Non-root runtime user
- Port 8001 exposed
- Configuration via environment variables
- Container health check configured

---

## 105. PRODUCTION SCALING

Stateless agent design with persistent database-backed session state allows seamless horizontal scaling across instances.

---

## 106. BACKGROUND PROCESSING

Asynchronous execution for heavy workloads: PDF indexing, batch embeddings, and conversation summarization.

---

## 107. PERFORMANCE

Minimizes latency by preferring deterministic code over LLM invocations, streaming tokens, and optimizing database queries.

---

## 108. DETERMINISTIC OPERATIONS

Security, authorization, price parsing, and confirmation state machines are executed deterministically in code—never left to LLM discretion.

---

## 109. AI AGENT GUARDRAILS

Comprehensive checks validate incoming inputs, permission levels, arguments, customer identity, confirmation states, and outbound content.

---

## 110. OUTPUT VALIDATION

Filters responses before sending to ensure no unverified claims, secret leaks, or fabricated prices/policies escape to the user.

---

## 111. TOOL RESULT GROUNDING

Conversational statements must strictly mirror backend tool responses (e.g. reporting an order as `SHIPPED` without guessing delivery dates).

---

## 112. RAG RESULT GROUNDING

Answers strictly adhere to retrieved policy chunks; missing knowledge base details result in an explicit admission of unavailability.

---

## 113. NO HALLUCINATED BUSINESS FACTS

Zero tolerance for hallucinating prices, discounts, stock levels, return windows, refund sums, or coupon codes.

---

## 114. CHECKOUT SAFETY

Guides users to checkout but never executes automatic purchases without deliberate customer action in the secure checkout flow.

---

## 115. PAYMENT SAFETY

Never prompts for, handles, or stores raw payment cards, CVVs, PINs, OTPs, or banking credentials.

---

## 116. API DESIGN

- `POST /api/chat`: Primary conversation endpoint
- `POST /api/chat/stream`: Real-time SSE streaming
- `GET /api/conversations/{id}`: Conversation history
- `GET /health`: Health and readiness checks

---

## 117. EXAMPLE CHAT REQUEST

```json
{
  "conversationId": "abc-123",
  "message": "Show me black shirts under ₹1500"
}
```

---

## 118. EXAMPLE CHAT RESPONSE

```json
{
  "conversationId": "abc-123",
  "messageId": "msg-001",
  "type": "TEXT",
  "content": "I found several black shirts under ₹1500.",
  "products": [
    {
      "id": 101,
      "name": "Black Casual Shirt",
      "price": 999,
      "imageUrl": "/images/101.jpg"
    }
  ]
}
```

---

## 119. API ERROR FORMAT

```json
{
  "error": {
    "code": "ORDER_NOT_ELIGIBLE",
    "message": "This order cannot be cancelled because it has already been shipped.",
    "requestId": "req-123"
  }
}
```

---

## 120. SERVICE-TO-SERVICE AUTHENTICATION

Python $\leftrightarrow$ Spring Boot calls are authenticated via internal service API keys (`AI_SERVICE_API_KEY`) or mutual TLS.

---

## 121. CORS

Restricts allowed origins to configured storefront domains (`http://localhost:5173` in development; strict domain list in production).

---

## 122. DATABASE RULES

Stores AI conversation metadata, messages, tool calls, and audits. Never duplicates core commerce tables.

---

## 123. DATABASE CONNECTION

Uses SQLAlchemy with PostgreSQL:
```ini
DATABASE_URL=postgresql+psycopg://user:password@localhost:5432/ai_agent
```
Schema migrations managed via Alembic.

---

## 124. RAG DATABASE

Stores document chunks and embeddings in PostgreSQL utilizing `pgvector`:
`document_id`, `document_name`, `page_number`, `content`, `embedding`, `created_at`.

---

## 125. KNOWLEDGE BASE ADMINISTRATION

Admin interface at `/admin/knowledge-base` allows uploading, re-indexing, viewing, and deleting store policy documents.

---

## 126. KNOWLEDGE BASE VERSIONING

Tracks document revisions. When a policy updates, new versions become active while retaining old versions for audit trails.

---

## 127. RAG CONTRADICTION HANDLING

Prefers latest active versions of authoritative policies. Highlights ambiguities to support staff rather than guessing.

---

## 128. API VERSIONING

Supports versioned endpoints (`/api/v1/chat`, `/api/v2/chat`) to ensure backward compatibility as features evolve.

---

## 129. REQUEST IDS

`X-Request-ID` is assigned at the gateway and propagated across React $\rightarrow$ AI Agent $\rightarrow$ Spring Boot for end-to-end tracing.

---

## 130. CORRELATION IDS

Logs track `request_id`, `conversation_id`, `message_id`, and `tool_call_id`.

---

## 131. DEVELOPMENT RULES

1. Confirm Spring Boot API contracts.
2. Verify authentication mechanisms.
3. Define tool schemas & permissions.
4. Implement client & tool methods.
5. Add automated tests & logging.
6. Update documentation.

---

## 132. FEATURE DEVELOPMENT EXAMPLE

Follows strict test-driven, permission-checked pipelines (confirming eligibility, confirmation states, idempotency, and post-action verification).

---

## 133. PRODUCTION ACCEPTANCE CHECKLIST

- [x] Python AI Agent runs independently.
- [x] Spring Boot remains business authority.
- [x] No direct AI database writes to commerce tables.
- [x] LLM provider abstraction implemented.
- [x] Guardrails and permission checks active.
- [x] Customer isolation and Google OAuth support verified.
- [x] Cart, order, return, and cancellation flows verified with confirmation.
- [x] RAG answers grounded without hallucinated policies.
- [x] Admin monitoring, audit logging, and human handoff available.
- [x] Dockerfile, rate limits, timeouts, and health checks operational.

---

## 134. ROADMAP

- **Phase 1:** Foundation (FastAPI, Spring Boot client, basic chat, health check)
- **Phase 2:** Product Intelligence (Search, fuzzy matching, filters, recommendations)
- **Phase 3:** Customer Actions (Cart, wishlist, orders, tracking, cancellation)
- **Phase 4:** Returns & Support (Returns, exchanges, escalation)
- **Phase 5:** RAG (PDF ingestion, pgvector, citations, admin docs)
- **Phase 6:** Advanced Agent (Multi-step workflows, memory, analytics)
- **Phase 7:** Production Hardening (Rate limiting, tracing, load testing, containerization)

---

## 135. COMPLETE CUSTOMER JOURNEY

```
Customer opens store & asks: "I need a black casual shirt under ₹1500."
  ↓
Agent detects search intent, parses {category: shirt, color: black, maxPrice: 1500}
  ↓
Spring Boot searches catalog; Agent displays live product cards
  ↓
Customer: "Add the first one to my cart."
  ↓
Agent checks variant & inventory; Spring Boot adds item to cart; Agent confirms
  ↓
Customer: "Show my latest order." -> Agent verifies auth; Spring Boot returns order
  ↓
Customer: "Cancel it." -> Agent verifies eligibility & prompts confirmation card
  ↓
Customer confirms: "Yes." -> Agent executes cancel_order(); Spring Boot processes transaction
  ↓
Agent verifies CANCELLED state: "Your order #1234 has been cancelled successfully."
```

---

## 136. FINAL ARCHITECTURE PRINCIPLE

```
                    +----------------------+
                    |        React         |
                    | Customer Experience  |
                    +----------+-----------+
                               |
                               v
                    +----------------------+
                    |    Python AI Agent   |
                    |                      |
                    | Intelligence         |
                    | Orchestration        |
                    | RAG                  |
                    | Conversation         |
                    | Tool Selection       |
                    +----------+-----------+
                               |
                               v
                    +----------------------+
                    |     Spring Boot      |
                    |                      |
                    | Authorization        |
                    | Business Logic       |
                    | Transactions         |
                    | Commerce APIs        |
                    +----------+-----------+
                               |
                               v
                    +----------------------+
                    |      PostgreSQL      |
                    |                      |
                    | Commerce Source      |
                    | of Truth             |
                    +----------------------+
```

> **The golden rule:**  
> *"The LLM decides what it wants to accomplish, but the backend decides what is actually allowed to happen."*

Every customer action follows:
```
Understand -> Plan -> Validate -> Authorize -> Execute -> Verify -> Respond
```
Never:
```
LLM -> Direct Database
```
