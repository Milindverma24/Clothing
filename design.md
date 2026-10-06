# DESIGN.md
# AI SHOPPING ASSISTANT — COMPLETE UI/UX DESIGN SYSTEM

## 1. PURPOSE

This document defines the complete UI/UX design for the AI Shopping Assistant chatbot of the premium clothing e-commerce platform.

The chatbot is not a basic question-answering interface.

It is an interactive AI shopping assistant that allows customers to:

- Search products
- Discover products
- Get product recommendations
- View product details
- Check product availability
- Select product sizes
- Open size guides
- Choose Men/Boys or Women/Girls size guides
- Choose Adult/Kids where required
- Find the recommended size
- Add products to cart
- Update cart
- Remove products from cart
- Manage wishlist
- View orders
- Track orders
- View live order details
- Cancel eligible orders
- Request returns
- Track returns
- Request exchanges where supported
- Check delivery information
- Apply and validate coupons
- Ask store-policy questions
- Contact support
- Maintain private conversations

The chatbot must feel like a premium fashion assistant integrated into the storefront.

It must NOT look like a generic customer-support chatbot.

==================================================
2. DESIGN PHILOSOPHY
==================================================

CORE PRINCIPLE:

"The interface should disappear behind the clothing."

The chatbot should feel:

- Premium
- Minimal
- Elegant
- Fast
- Helpful
- Conversational
- Trustworthy
- Responsive
- Commerce-focused

Avoid:

- Excessive gradients
- Neon colors
- Gaming-style UI
- Futuristic AI dashboards
- Excessive animations
- Large colorful chatbot bubbles
- Technical AI terminology
- Unnecessary cards
- Overloaded interfaces
- Dark futuristic themes

The chatbot must visually belong to the clothing storefront.

==================================================
3. DESIGN LANGUAGE
==================================================

Primary visual language:

- White
- Black
- Grayscale
- Soft off-white
- Subtle borders
- Premium typography
- Large whitespace
- High-quality product imagery
- Minimal rounded corners

The UI should resemble a modern premium fashion brand.

==================================================
4. COLOR SYSTEM
==================================================

Primary:
#111111

Secondary:
#555555

Background:
#FFFFFF

Soft Background:
#F7F7F7

Card:
#FFFFFF

Border:
#E7E7E7

Muted:
#8A8A8A

Success:
#2F6B45

Warning:
#A66A00

Error:
#B42318

Disabled:
#B8B8B8

Use accent colors only for meaningful states and interactions.
Do not use large gradients.
Do not use neon colors.

==================================================
5. TYPOGRAPHY
==================================================

Use the same typography as the main storefront.

Preferred fonts:
- Inter
- Manrope
- DM Sans
- Existing project font

Typography:
- Chatbot title: 18–20px, font-weight: 600
- Section title: 15–17px, font-weight: 600
- Message: 14–15px, line-height: 1.5
- Button: 13–14px, font-weight: 500
- Metadata: 11–12px, muted color
- Product price: 15–17px, font-weight: 600

Do not use extremely large typography inside the chatbot.

==================================================
6. CHATBOT ENTRY POINT
==================================================

The chatbot should appear as a floating button on the storefront.

Desktop:
Position: right: 24px, bottom: 24px
Size: 56px × 56px

Use:
- Minimal AI/chat icon
- Clean background
- Subtle border/shadow
- No excessive animation

Hover tooltip:
"AI Shopping Assistant"

The chatbot button must not cover important page controls.

==================================================
7. CHATBOT WINDOW
==================================================

Desktop size:
Width: 400px–440px
Height: 600px–720px
Maximum height: 90vh

The chatbot should have three main sections:
1. Header
2. Conversation area
3. Input area

==================================================
8. MOBILE CHATBOT
==================================================

On mobile, the chatbot should become a full-screen experience.

Requirements:
- No horizontal scrolling
- Touch targets >= 44px
- Input remains easily accessible
- Conversation area scrolls
- Header remains accessible
- Close button always available

==================================================
9. CHAT HEADER
==================================================

Include:
- AI icon
- AI Shopping Assistant
- Online/available indicator
- Conversation menu
- Close button

Menu options:
- New Conversation
- Conversation History
- Help
- Clear Conversation

Never display internal technical information (model name, API provider, tool calls, RAG details, database details).

==================================================
10. WELCOME SCREEN
==================================================

When there is no active conversation:

AI Shopping Assistant
Hello 👋
Find something you'll love, check your size, manage your orders, or ask me anything.

Quick actions:
[ Search Products ] [ Track Order ]
[ Size Guide ] [ My Cart ]
[ Wishlist ] [ Recommendations ]

==================================================
11. QUICK ACTIONS
==================================================

Quick actions should be compact premium buttons.
- Subtle border
- White background
- Small icon
- Clear label
- Minimal hover state

==================================================
12. CHAT MESSAGE SYSTEM
==================================================

The chatbot supports:
TEXT, PRODUCT_CARD, PRODUCT_GRID, ORDER_CARD, ORDER_DETAILS,
SIZE_GUIDE, SIZE_RECOMMENDATION, CART, WISHLIST, TRACKING,
RETURN_STATUS, CANCELLATION_STATUS, EXCHANGE_STATUS,
CONFIRMATION, ERROR, SUPPORT_TICKET, LOADING.

==================================================
13. USER MESSAGE
==================================================

User messages appear on the right.
- Background: #111111
- Text: #FFFFFF
- Border radius: 16px
- Maximum width: 80%

==================================================
14. AI MESSAGE
==================================================

AI messages appear on the left.
- Background: #F7F7F7
- Text: #111111
- Border: #E7E7E7
- Border radius: 16px
- Do not use speech-tail bubbles.

==================================================
15. PRODUCT CARD & CAROUSEL
==================================================

Show only real backend information.
Possible fields: image, name, category, price, availability, rating, sizes, wishlist.
Never invent price, stock, rating, size, or product ID.

==================================================
17–31. SIZE GUIDE & FIT EXPERIENCE
==================================================

Determine recipient first:
"Who are you shopping for?" [ MEN / BOYS ] [ WOMEN / GIRLS ]
"Adult or Kids?" [ Adult ] [ Kids ]
"Which type of clothing?" [ Shirts / T-Shirts ] [ Trousers / Jeans ]

Visual Size Chart:
- Minimal silhouette illustration
- Measurement labels & guidelines
- Unit switch: [ CM ] [ IN ] with mathematically accurate conversion
- [ FIND MY SIZE ] measurement inputs
- Backend calculation determines recommendation
- Disclaimer: "Size recommendations are based on the available size chart. Fit can vary by product, brand, and style."

==================================================
32–50. ORDER TRACKING, SHOW ORDER, CANCEL & RETURN
==================================================

- Track Order: GET /api/my/orders/trackable strictly scoped to authenticated customer.
- Show Order: GET /api/my/orders/{orderId} always fetches live backend state.
- Order timeline: Clean vertical or horizontal sequence with dots.
- Cancel Order: Mandatory confirmation modal -> Spring Boot transaction -> status becomes CANCELLED -> Cancel button disappears.
- Return Order: 14-day window strictly from purchase/order date -> select reason -> confirmation -> Spring Boot transaction -> status becomes RETURN_REQUESTED -> Return button disappears.
- TanStack Query cache invalidation across trackable-orders and order details.

==================================================
51–53. CART, WISHLIST, SUPPORT
==================================================

- Cart: Real backend items, quantities, subtotal, checkout button.
- Wishlist: Real authenticated saved items.
- Support: Order issue, delivery issue, return issue, payment issue -> ticket created via backend.

==================================================
54–57. LOADING & ERROR STATES
==================================================

- Subtle skeleton loader and typing dots (● ● ●).
- Never display internal processing steps ("Calling Spring Boot...", "Executing SQL...", "LLM thinking...").
- Friendly error messages with retry actions.

==================================================
80–81. ARCHITECTURE & NON-NEGOTIABLE RULES
==================================================

1. Never trust customerId from frontend.
2. Never trust order ownership from AI.
3. Never expose another customer's order or conversation.
4. Never implement cancellation or return only in React.
5. Never claim cancellation or return succeeded before backend confirmation.
6. 14-day return eligibility starts from ORDER DATE.
7. Show Order must fetch latest backend state.
8. Never hallucinate live commerce or size measurement data.
9. Destructive actions require confirmation.
10. Spring Boot is the business authority; PostgreSQL is the source of truth.
