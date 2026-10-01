# AGENTS.md

# Project: Premium Clothing E-Commerce Platform

This document defines the rules, architecture, engineering standards, product requirements, and development workflow that AI coding agents must follow when working on this project.

The project is a premium clothing e-commerce platform inspired by the visual restraint and interaction principles of modern black-and-white consumer brands.

The visual source of truth is:

[/design.md](file:///Users/milindverma/Desktop/Clothing/design.md)

Always read [design.md](file:///Users/milindverma/Desktop/Clothing/design.md) before making UI changes.

⸻

## 1. Core Objective

Build a production-ready clothing e-commerce platform with two major surfaces:

```
Customer Storefront
        +
Admin Management Dashboard
```

The customer application must provide:

* Product discovery.
* Categories.
* Collections.
* Search.
* Filters.
* Product details.
* Size selection.
* Color selection.
* Wishlist.
* Cart.
* Coupons.
* Checkout.
* Orders.
* Customer accounts.
* Reviews.
* Responsive mobile experience.

The admin application must provide complete control over:

* Products.
* Product variants.
* Categories.
* Collections.
* Inventory.
* Orders.
* Customers.
* Reviews.
* Coupons.
* Discounts.
* Analytics.
* Admin users.
* Permissions.
* Settings.
* Audit logs.

⸻

## 2. Design Source of Truth

The file:

[design.md](file:///Users/milindverma/Desktop/Clothing/design.md)

is the authoritative design-system document.

Do not introduce UI decisions that conflict with it without a strong reason.

Before changing:

* colors
* typography
* spacing
* border radius
* buttons
* cards
* navigation
* product grids
* responsive behavior
* shadows
* animations

check [design.md](file:///Users/milindverma/Desktop/Clothing/design.md).

⸻

## 3. Product Philosophy

The platform should feel:

* **Premium**
* **Minimal**
* **Modern**
* **Confident**
* **Fast**
* **Editorial**

The product itself is the visual hero.

The interface must never overpower the clothing.

Priority:

```
Product photography
      ↓
Product information
      ↓
Price
      ↓
CTA
      ↓
Supporting UI
```

Avoid unnecessary visual decoration.

⸻

## 4. Design Language

The core visual language is:

* Black
* White
* Grayscale
* Strong typography
* Large photography
* Pill controls
* Rounded cards
* Generous whitespace
* Minimal shadows

Primary brand color:
* `#000000`

Primary background:
* `#FFFFFF`

Interactive controls should generally use:
* `border-radius: 999px`

Cards should generally use:
* `border-radius: 16px`

Inputs should generally use:
* `border-radius: 8px`

⸻

## 5. Do Not Copy Uber

The project is inspired by Uber’s design principles.

Do **NOT**:

* Copy Uber’s logo.
* Use Uber’s branding.
* Use Uber proprietary assets.
* Use Uber’s exact website layout.
* Pretend the clothing brand is affiliated with Uber.
* Copy proprietary typography.
* Copy proprietary illustrations.

Use only general design principles such as:

* monochrome palette
* typography hierarchy
* pill controls
* whitespace
* editorial composition
* alternating dark/light sections

The clothing brand must have its own identity.

⸻

## 6. Recommended Technology Stack

Unless the existing project specifies otherwise, prefer:

### Frontend
* React
* TypeScript
* Vite
* Tailwind CSS
* React Router
* TanStack Query
* Zod
* React Hook Form

### Backend
Preferred:
* Spring Boot
* Java
* PostgreSQL
* Spring Data JPA
* Spring Security
* JWT / secure authentication

Alternative backend technologies may be used if the repository already uses another established architecture.

Do not rewrite the entire backend just to introduce a different framework.

⸻

## 7. Architecture

Use a clear separation:

```
Frontend
     ↓
REST API
     ↓
Service Layer
     ↓
Repository Layer
     ↓
PostgreSQL
```

Never put database logic directly inside controllers.

Preferred backend structure:

```
src/main/java/
└── com/brand/
    ├── config/
    ├── controller/
    ├── dto/
    ├── entity/
    ├── exception/
    ├── repository/
    ├── security/
    ├── service/
    └── util/
```

⸻

## 8. Frontend Structure

Preferred structure:

```
src/
├── assets/
├── components/
│   ├── ui/
│   ├── layout/
│   ├── product/
│   ├── cart/
│   ├── checkout/
│   └── admin/
│
├── pages/
│   ├── Home/
│   ├── Shop/
│   ├── Product/
│   ├── Collection/
│   ├── Search/
│   ├── Wishlist/
│   ├── Cart/
│   ├── Checkout/
│   ├── Account/
│   └── Admin/
│
├── hooks/
├── services/
├── api/
├── types/
├── utils/
├── constants/
├── routes/
└── styles/
```

⸻

## 9. Component Rules

Components should have a single responsibility.

**Bad:**
`ProductPage.tsx` containing:
* API calls
* cart logic
* product gallery
* review logic
* size selector
* coupon logic
* checkout logic

**Prefer:**
```
ProductPage
├── ProductGallery
├── ProductInfo
├── ColorSelector
├── SizeSelector
├── ProductActions
├── ProductDescription
├── ProductReviews
└── RelatedProducts
```

⸻

## 10. Reusability

Before creating a new UI component, check whether an existing component can be reused.

Prefer:
* `<Button />`
* `<Input />`
* `<Modal />`
* `<Drawer />`
* `<Badge />`
* `<ProductCard />`
* `<ProductGrid />`
* `<DataTable />`

over duplicating similar markup.

⸻

## 11. UI Consistency

Never create one-off styles for common components.

For example, do not create:
* `button-black`
* `button-dark`
* `button-main`
* `button-shop`
* `button-product`
* `button-checkout`

if they all represent the same primary CTA.

Use:
```tsx
<Button variant="primary" />
```

⸻

## 12. Customer Routes

The storefront should support:

* `/`
* `/shop`
* `/shop/men`
* `/shop/women`
* `/shop/sale`
* `/collections`
* `/collections/:slug`
* `/products/:slug`
* `/search`
* `/wishlist`
* `/cart`
* `/checkout`
* `/account`
* `/account/orders`
* `/account/orders/:id`
* `/account/profile`
* `/account/addresses`

⸻

## 13. Admin Routes

Admin routes:

* `/admin`
* `/admin/products`
* `/admin/products/new`
* `/admin/products/:id`
* `/admin/categories`
* `/admin/collections`
* `/admin/inventory`
* `/admin/orders`
* `/admin/orders/:id`
* `/admin/customers`
* `/admin/customers/:id`
* `/admin/reviews`
* `/admin/coupons`
* `/admin/discounts`
* `/admin/analytics`
* `/admin/settings`
* `/admin/users`
* `/admin/audit-logs`

⸻

## 14. Authentication

The system must distinguish between:
* Customer
* Admin
* Staff

Admin routes must never be accessible to ordinary customers.

Frontend route protection is required.

Backend authorization is mandatory.

Never rely only on frontend route protection.

⸻

## 15. Authorization

Use role-based access control (RBAC).

Roles:
* `SUPER_ADMIN`
* `ADMIN`
* `PRODUCT_MANAGER`
* `ORDER_MANAGER`
* `MARKETING_MANAGER`
* `SUPPORT_AGENT`

Example:

* **PRODUCT_MANAGER**: `products`, `categories`, `collections`, `inventory`
* **ORDER_MANAGER**: `orders`, `returns`, `refunds`
* **MARKETING_MANAGER**: `coupons`, `discounts`, `collections`
* **SUPER_ADMIN**: everything

⸻

## 16. Product Model

A product should support:

* `id`
* `name`
* `slug`
* `description`
* `shortDescription`
* `category`
* `collection`
* `brand`
* `basePrice`
* `compareAtPrice`
* `costPrice`
* `images`
* `videos`
* `variants`
* `tags`
* `status`
* `seoTitle`
* `seoDescription`
* `createdAt`
* `updatedAt`

⸻

## 17. Product Variant Model

Variants must support:

* `id`
* `productId`
* `sku`
* `size`
* `color`
* `price`
* `stock`
* `image`
* `status`

Example:

```
Oversized Tee
Black / S
Black / M
Black / L
Black / XL
White / S
White / M
White / L
White / XL
```

Inventory belongs to the variant, not only the product.

⸻

## 18. Product Status

Products may have:

* `DRAFT`
* `ACTIVE`
* `ARCHIVED`
* `OUT_OF_STOCK`

Do not permanently delete products unless the admin explicitly performs a destructive deletion.

Prefer archive/soft-delete behavior.

⸻

## 19. Categories

Categories should support:

* `id`
* `name`
* `slug`
* `description`
* `image`
* `parentCategory`
* `status`
* `sortOrder`

Support nested categories.

Example:

```
Men
├── T-Shirts
├── Shirts
├── Hoodies
└── Pants
```

⸻

## 20. Collections

Collections should support:

* `id`
* `name`
* `slug`
* `description`
* `image`
* `products`
* `startDate`
* `endDate`
* `status`

Examples:
* New Arrivals
* Essentials
* Summer 2026
* Streetwear
* Limited Edition
* Best Sellers

⸻

## 21. Inventory

Inventory must be variant-aware.

Track:
* SKU
* available quantity
* reserved quantity
* sold quantity
* low-stock threshold

Do not allow stock to become negative.

Use transactions when modifying inventory.

⸻

## 22. Inventory Reservation

When an order is created:

```
available stock
        ↓
reserve stock
        ↓
payment
        ↓
confirm order
```

If payment fails:

```
reserved stock
        ↓
release stock
```

Avoid overselling.

⸻

## 23. Cart

Cart items should contain:
* product
* variant
* quantity
* unitPrice
* discount
* total

Never trust prices sent from the frontend.

The backend must recalculate:
* price
* discount
* coupon
* tax
* shipping
* total

⸻

## 24. Cart Validation

When checkout begins, validate:
* Product exists
* Variant exists
* Variant is active
* Quantity is available
* Price is current
* Coupon is valid

If any condition fails, return a meaningful error.

⸻

## 25. Coupon System

Coupons must be validated on the backend.

Supported types:
* `PERCENTAGE`
* `FIXED_AMOUNT`
* `FREE_SHIPPING`

Optional restrictions:
* `minimumCartValue`
* `maximumDiscount`
* `usageLimit`
* `perCustomerLimit`
* `startDate`
* `expiryDate`
* `firstOrderOnly`
* `productRestrictions`
* `categoryRestrictions`
* `customerRestrictions`

⸻

## 26. Coupon Security

Never calculate coupon discounts only on the frontend.

**Bad:**
```javascript
// frontend:
total = total - coupon.discount
```

**Correct:**
```
frontend
    ↓
POST /api/coupons/validate
    ↓
backend validation
    ↓
discount calculation
    ↓
updated cart total
```

⸻

## 27. Order Lifecycle

Order states:
* `PENDING`
* `CONFIRMED`
* `PROCESSING`
* `PACKED`
* `SHIPPED`
* `OUT_FOR_DELIVERY`
* `DELIVERED`
* `CANCELLED`
* `RETURN_REQUESTED`
* `RETURNED`
* `REFUNDED`

Do not allow arbitrary status transitions.

Implement valid transitions.

Example:

```
PENDING
 ↓
CONFIRMED
 ↓
PROCESSING
 ↓
PACKED
 ↓
SHIPPED
 ↓
OUT_FOR_DELIVERY
 ↓
DELIVERED
```

⸻

## 28. Payment

Payment architecture must keep payment verification server-side.

Never trust:
```javascript
paymentSuccess = true
```
from the frontend.

The backend must verify payment using the payment provider.

Payment should be treated as:
* `INITIATED`
* `AUTHORIZED`
* `CAPTURED`
* `FAILED`
* `REFUNDED`

⸻

## 29. Checkout

Checkout should collect:
* name
* email
* phone
* address
* city
* state
* postalCode
* country
* paymentMethod

Before placing the order:
1. Validate address
2. Validate cart
3. Validate inventory
4. Validate coupon
5. Calculate totals
6. Create payment
7. Confirm payment
8. Create order
9. Update inventory

Use transactional logic wherever appropriate.

⸻

## 30. Order Total Calculation

Never trust frontend totals.

Backend calculation:

```
subtotal
    ↓
product discounts
    ↓
coupon discount
    ↓
shipping
    ↓
tax
    ↓
grand total
```

Example:

```
Subtotal:       ₹3,000
Product sale:   -₹300
Coupon:         -₹200
Shipping:       ₹0
Total:          ₹2,500
```

⸻

## 31. Wishlist

Wishlist should support:
* add product
* remove product
* view wishlist
* move to cart

Do not duplicate entire product objects in the wishlist.

Store references:
* `customerId`
* `productId`

⸻

## 32. Reviews

Reviews should support:
* rating
* title
* comment
* customer
* product
* verifiedPurchase
* status
* createdAt

Admin review states:
* `PENDING`
* `APPROVED`
* `HIDDEN`
* `FLAGGED`

Only approved reviews should appear publicly.

⸻

## 33. Search

Search should support:
* product name
* description
* SKU
* category
* collection
* tags

Search should tolerate basic differences in capitalization.

Example:
* `oversized tee`
* `Oversized Tee`
* `OVERSIZED`

⸻

## 34. Product Filtering

Filters:
* category
* size
* color
* price
* collection
* availability
* discount
* rating

Filtering should be handled server-side for large catalogs.

⸻

## 35. Sorting

Support:
* `recommended`
* `newest`
* `price_asc`
* `price_desc`
* `best_selling`
* `rating`

⸻

## 36. Pagination

Do not load hundreds of products into the browser at once.

Use:
* `page`
* `size`
* `sort`
* `filters`

or cursor pagination where appropriate.

⸻

## 37. API Design

Use RESTful APIs.

Examples:

```http
GET    /api/products
GET    /api/products/{id}
POST   /api/products
PUT    /api/products/{id}
DELETE /api/products/{id}

GET    /api/categories
POST   /api/categories
PUT    /api/categories/{id}
DELETE /api/categories/{id}

GET    /api/coupons
POST   /api/coupons
PUT    /api/coupons/{id}
DELETE /api/coupons/{id}
POST   /api/coupons/validate

GET    /api/orders
GET    /api/orders/{id}
POST   /api/orders
PATCH  /api/orders/{id}/status
```

⸻

## 38. API Response Format

Prefer consistent responses.

**Success:**
```json
{
  "success": true,
  "data": {},
  "message": "Product created successfully"
}
```

**Error:**
```json
{
  "success": false,
  "message": "Product not found",
  "code": "PRODUCT_NOT_FOUND"
}
```

**Validation Error:**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "name": "Product name is required",
    "price": "Price must be greater than zero"
  }
}
```

⸻

## 39. DTO Rules

Do not expose database entities directly through APIs.

Use DTOs.

Example:

```
ProductEntity
     ↓
ProductResponseDTO
```

For creation:
* `CreateProductRequest`

For updates:
* `UpdateProductRequest`

⸻

## 40. Backend Layering

Controllers should be thin.

**Correct:**
```
Controller
    ↓
Service
    ↓
Repository
```

**Bad:**
```
Controller
    ↓
database operations
    ↓
business logic
    ↓
discount calculation
```

⸻

## 41. Exception Handling

Use centralized exception handling.

Examples:
* `ProductNotFoundException`
* `CouponNotFoundException`
* `InvalidCouponException`
* `InsufficientStockException`
* `OrderNotFoundException`
* `UnauthorizedException`
* `ForbiddenException`

Return meaningful HTTP status codes.

⸻

## 42. Validation

Validate both:
* **Frontend** (improves UX)
* **Backend** (provides security)

Never assume frontend validation is sufficient.

⸻

## 43. Database

PostgreSQL is preferred.

Use relationships carefully.

Core tables:
* `users`
* `roles`
* `products`
* `product_variants`
* `product_images`
* `categories`
* `collections`
* `collection_products`
* `inventory`
* `carts`
* `cart_items`
* `wishlists`
* `wishlist_items`
* `coupons`
* `coupon_usage`
* `orders`
* `order_items`
* `payments`
* `addresses`
* `reviews`
* `audit_logs`

⸻

## 44. Database Rules

Use:
* primary keys
* foreign keys
* unique constraints
* indexes
* not-null constraints
* check constraints

Important unique fields:
* `product.slug`
* `variant.sku`
* `coupon.code`
* `user.email`

⸻

## 45. Indexing

Index frequently queried fields.

Examples:
* `products.slug`
* `products.status`
* `products.category_id`
* `products.created_at`
* `product_variants.sku`
* `product_variants.product_id`
* `orders.customer_id`
* `orders.status`
* `orders.created_at`
* `coupons.code`

Do not add indexes blindly.

⸻

## 46. Image Uploads

Do not store large image binaries directly inside PostgreSQL.

Use object storage.

Possible options:
* Cloudinary
* AWS S3
* Supabase Storage
* Cloudflare R2

Database stores:
* image URL
* public ID
* alt text
* sort order

⸻

## 47. Image Requirements

Product upload should support:
* multiple images
* image ordering
* primary image
* alt text
* variant-specific images

Recommended format:
* WebP / AVIF

Optimize images before delivery.

⸻

## 48. Admin Product Creation Flow

The product creation experience should be:

1. Basic information
2. Category
3. Pricing
4. Images
5. Variants
6. Inventory
7. SEO
8. Preview
9. Publish

Do not create an enormous single-page form if it becomes difficult to use.

⸻

## 49. Product Editor

Product editor should support:
* Save draft
* Preview
* Publish
* Archive
* Duplicate
* Delete

Autosave may be added later.

⸻

## 50. Admin Analytics

Analytics should expose:
* Revenue
* Orders
* Average order value
* Products sold
* Conversion rate
* New customers
* Returning customers
* Coupon usage
* Top products
* Top categories

Time filters:
* Today
* 7 days
* 30 days
* 90 days
* This year
* Custom range

⸻

## 51. Audit Logs

Every sensitive admin action should generate an audit log.

Track:
* `adminId`
* `action`
* `resource`
* `resourceId`
* `timestamp`
* `metadata`

Examples:
* `PRODUCT_CREATED`
* `PRODUCT_UPDATED`
* `PRODUCT_DELETED`
* `COUPON_CREATED`
* `COUPON_DISABLED`
* `ORDER_STATUS_CHANGED`
* `REFUND_ISSUED`
* `ADMIN_ROLE_CHANGED`

⸻

## 52. Security

Never commit:
* `.env`
* API keys
* JWT secrets
* database passwords
* payment secrets
* cloud credentials

Use `.env.example` for documentation.

⸻

## 53. Environment Variables

Example:

```env
DATABASE_URL=
DATABASE_USERNAME=
DATABASE_PASSWORD=
JWT_SECRET=
PAYMENT_API_KEY=
PAYMENT_SECRET=
STORAGE_BUCKET=
STORAGE_ACCESS_KEY=
STORAGE_SECRET_KEY=
```

Never hardcode secrets.

⸻

## 54. Authentication Security

Passwords must be hashed.

Never store plain text passwords.

Use a secure password hashing algorithm such as:
* BCrypt
* Argon2

⸻

## 55. JWT / Session Rules

If JWT authentication is used:

* Keep access tokens short-lived.
* Use refresh-token rotation where appropriate.
* Never expose sensitive tokens unnecessarily.
* Protect admin endpoints server-side.
* Handle expiration gracefully.
* Logout must invalidate the appropriate session/token mechanism.

⸻

## 56. CORS

Configure CORS explicitly.

Do not use:
```
Access-Control-Allow-Origin: *
```
for authenticated production admin APIs.

Allow only known frontend origins.

⸻

## 57. Rate Limiting

Consider rate limiting for:
* login
* signup
* coupon validation
* password reset
* reviews
* search
* checkout

Especially protect authentication endpoints.

⸻

## 58. Admin Security

Admin login should have stronger protections.

Recommended:
* RBAC
* session expiration
* audit logging
* rate limiting
* optional 2FA

Sensitive actions should require confirmation.

⸻

## 59. Error Handling in Frontend

Never expose raw backend exceptions to customers.

**Bad:**
```
org.hibernate.ConstraintViolationException...
```

**Good:**
```
Unable to add this item to your bag.
Please try again.
```

Admin users may receive more detailed diagnostic information where appropriate.

⸻

## 60. Loading UX

Every async operation must have a visible state.

Examples:
* Loading products...
* Creating product...
* Updating order...
* Applying coupon...
* Processing payment...

Avoid blank screens.

⸻

## 61. Optimistic Updates

Use optimistic updates only where rollback is safe.

Good candidates:
* wishlist
* cart quantity
* favorite

Avoid optimistic updates for:
* payment
* order creation
* refund
* inventory

⸻

## 62. Responsive Design

Every feature must work on:
* Mobile
* Tablet
* Desktop
* Large Desktop

Do not build desktop first and ignore mobile.

⸻

## 63. Mobile Rules

Minimum touch target:
* 44px

Mobile product grid:
* 2 columns

Product page:
```
image gallery
      ↓
product information
      ↓
size
      ↓
color
      ↓
CTA
```

Checkout should remain easy to complete with one hand.

⸻

## 64. Accessibility

Follow WCAG AA principles.

* Every image: `alt`
* Every form field: `label`
* Every icon-only button: `aria-label`
* Keyboard navigation must work.
* Focus states must be visible.

⸻

## 65. SEO

Product pages should include:
* `title`
* `meta description`
* `canonical URL`
* `OpenGraph metadata`
* `structured product data`

Use clean URLs:
* `/products/oversized-essential-tee`
*(not `/product?id=123`)*

⸻

## 66. Performance

Prioritize:
* fast initial load
* optimized images
* lazy loading
* code splitting
* API pagination
* caching
* minimal JavaScript

Do not load every admin feature into the customer bundle.

⸻

## 67. Frontend Data Fetching

Use a consistent server-state solution.

If TanStack Query is installed:
* `useQuery`
* `useMutation`
* query invalidation

Avoid manually duplicating loading/error/cache logic across components.

⸻

## 68. State Management

Use local state for local UI:
* modal
* dropdown
* selected size
* selected image

Use server state for:
* products
* orders
* customers
* inventory
* coupons

Use global state only when genuinely necessary.

⸻

## 69. Cart State

Cart may be persisted using:
* backend database for authenticated users.

Guest carts may use:
* `localStorage` and merge into the account after login.

⸻

## 70. Admin Tables

Admin tables should support:
* search
* filter
* sort
* pagination
* bulk actions
* row actions
* empty state
* loading state
* error state

⸻

## 71. Destructive Actions

Every destructive action needs confirmation.

Examples:
* Delete product
* Delete category
* Delete coupon
* Cancel order
* Refund order
* Disable admin

Confirmation must clearly explain the action.

⸻

## 72. Soft Delete

Prefer soft deletion for:
* products
* categories
* collections
* customers

where historical references may exist.

Orders and financial records should not be casually deleted.

⸻

## 73. Financial Records

Never mutate historical order totals after an order is completed.

Store:
* `unitPriceAtPurchase`
* `discountAtPurchase`
* `taxAtPurchase`
* `shippingAtPurchase`
* `finalTotal`

This protects historical accuracy if product prices change later.

⸻

## 74. Order Items

An order item should preserve:
* product name
* SKU
* variant
* size
* color
* quantity
* unit price
* discount
* final price

Do not depend entirely on the current product record.

⸻

## 75. Coupon Usage

When a coupon is successfully used, record:
* `couponId`
* `customerId`
* `orderId`
* `discountAmount`
* `usedAt`

This is required for usage limits and analytics.

⸻

## 76. Inventory Transactions

Inventory changes should be traceable.

Record:
* `variantId`
* `quantityChange`
* `reason`
* `reference`
* `adminId`
* `timestamp`

Reasons:
* `PURCHASE`
* `RETURN`
* `MANUAL_ADJUSTMENT`
* `RESTOCK`
* `DAMAGE`
* `CANCELLATION`

⸻

## 77. Testing

Every important business rule should have tests.

### Backend:
* Unit tests
* Integration tests
* Repository tests
* Controller tests

### Frontend:
* Component tests
* Interaction tests
* Critical flow tests

### Critical flows:
* Add to cart
* Apply coupon
* Checkout
* Create product
* Update inventory
* Change order status

⸻

## 78. Testing Business Logic

### Test coupon scenarios:
* valid coupon
* expired coupon
* inactive coupon
* minimum cart not reached
* usage limit reached
* customer usage limit reached
* product restriction
* category restriction

### Test inventory:
* enough stock
* exact stock
* insufficient stock
* zero stock
* concurrent purchase

⸻

## 79. Git Rules

Use meaningful commits.

**Good:**
* `feat: add product variant management`
* `feat: implement coupon validation`
* `fix: prevent negative inventory`
* `fix: handle expired JWT`
* `refactor: extract product service`
* `style: update product card spacing`

**Bad:**
* `update`
* `changes`
* `final`
* `final2`
* `new`

⸻

## 80. Before Editing Code

The agent must:

1. Inspect the existing project structure.
2. Read relevant files.
3. Understand existing architecture.
4. Check [design.md](file:///Users/milindverma/Desktop/Clothing/design.md).
5. Identify reusable components.
6. Avoid unnecessary rewrites.

Do not blindly replace existing files.

⸻

## 81. Before Adding Dependencies

Check whether the functionality already exists.

Do not add a package for something that can easily be implemented using the existing stack.

If a dependency is required:
1. Explain why it is required.
2. Verify compatibility.
3. Add the smallest necessary dependency.

⸻

## 82. Before Changing Database Schema

Check:
* existing entities
* existing migrations
* existing relationships
* existing API consumers

Do not break existing production data.

Prefer migrations.

Never casually drop tables.

⸻

## 83. UI Change Workflow

For UI tasks:

```
Read design.md
      ↓
Inspect existing component
      ↓
Reuse existing primitives
      ↓
Implement responsive version
      ↓
Check desktop
      ↓
Check mobile
      ↓
Check accessibility
```

⸻

## 84. Backend Feature Workflow

For backend features:

```
Requirement
    ↓
Entity / schema
    ↓
DTO
    ↓
Repository
    ↓
Service
    ↓
Validation
    ↓
Controller
    ↓
Exception handling
    ↓
Tests
```

⸻

## 85. New Feature Workflow

For a feature such as coupons:

```
Requirement
    ↓
Database model
    ↓
Backend service
    ↓
API
    ↓
Frontend API service
    ↓
UI
    ↓
Loading state
    ↓
Error state
    ↓
Success state
    ↓
Tests
```

Do not implement only the UI if the feature requires backend behavior.

⸻

## 86. Product Creation Feature

When implementing product creation, support:
* Product information
* Images
* Variants
* Sizes
* Colors
* SKU
* Price
* Compare-at price
* Inventory
* Category
* Collection
* Tags
* SEO
* Status

The admin must be able to save as draft and publish later.

⸻

## 87. Admin UX Principle

### Customer UI:
* Minimal
* Editorial
* Image-focused

### Admin UI:
* Efficient
* Dense
* Data-focused
* Functional

Do not force the customer storefront’s visual density into the admin dashboard.

Both should still share:
* Typography
* Color system
* Buttons
* Inputs
* Radius
* Spacing

⸻

## 88. Customer UX Principle

The customer should always understand:
* What am I looking at?
* How much does it cost?
* What sizes are available?
* What colors are available?
* Can I buy it?
* When will I receive it?
* Can I return it?

Avoid hiding essential information.

⸻

## 89. CTA Hierarchy

* **Primary**: `Add to bag`, `Buy now`, `Checkout`
* **Secondary**: `View collection`, `Continue shopping`, `View details`
* **Tertiary**: `Filter`, `Sort`, `Learn more`

Never give five buttons equal visual importance.

⸻

## 90. Product Page CTA

The product page should always make the primary action obvious.

* Preferred: `[ Add to bag ]`
* Secondary: `[ Buy now ]`
* If unavailable: `[ Notify me when available ]`

⸻

## 91. Out-of-Stock Products

Out-of-stock products should remain discoverable.

* Display: `OUT OF STOCK`
* Disable: `Add to bag`
* Optionally provide: `Notify me`

⸻

## 92. Low Stock

Display:
* `Only 3 left`

only when inventory is genuinely low.

Do not create fake scarcity.

⸻

## 93. Discounts

Display discounts clearly.

Example:
```
₹1,499   ₹1,999
          25% OFF
```

Never misrepresent a discount.

Backend must calculate the actual discount.

⸻

## 94. Admin Pricing

Admin should support:
* base price
* sale price
* compare-at price
* scheduled pricing

If scheduled pricing is implemented, backend controls activation.

⸻

## 95. Notifications

Useful admin notifications:
* Low stock
* New order
* Payment failure
* Return request
* Refund request
* Coupon expiring
* Product review pending

Do not overwhelm the admin with notifications.

⸻

## 96. Search UX

Search should support:
* recent searches
* popular searches
* product suggestions
* collection suggestions

Example:

```
Search "tee"
PRODUCTS
Oversized Tee
Essential Tee

COLLECTIONS
Essentials
New Arrivals
```

⸻

## 97. 404 Page

404 page should remain on-brand.

Example:

```
PAGE NOT FOUND
Looks like this piece isn't here.
[ Back to shop ]
```

Use the same typography and black/white system.

⸻

## 98. Empty Cart

Example:

```
YOUR BAG IS EMPTY
Nothing here yet.
[ Start shopping ]
```

⸻

## 99. Empty Wishlist

Example:

```
YOUR WISHLIST IS EMPTY
Save pieces you want to come back to.
[ Explore products ]
```

⸻

## 100. Final Agent Rules

Before considering a feature complete, verify:

- [ ] Requirement implemented
- [ ] Existing architecture respected
- [ ] [design.md](file:///Users/milindverma/Desktop/Clothing/design.md) followed
- [ ] Responsive
- [ ] Accessible
- [ ] Loading state implemented
- [ ] Error state implemented
- [ ] Empty state implemented
- [ ] Backend validation implemented
- [ ] Security considered
- [ ] Tests added where appropriate
- [ ] No secrets committed
- [ ] No duplicated components
- [ ] No unnecessary dependencies
- [ ] No console errors
- [ ] No broken API calls
- [ ] No hardcoded business logic in UI

⸻

## 101. Golden Rule

When making any implementation decision, prioritize:

```
Correctness
    ↓
Security
    ↓
User experience
    ↓
Maintainability
    ↓
Performance
    ↓
Visual polish
```

Never sacrifice security or correctness merely to make the interface look better.

⸻

## 102. Final Product Principle

The project should ultimately feel like a real premium clothing company rather than a demo project.

The customer experience should be:

```
Discover
    ↓
Explore
    ↓
Desire
    ↓
Select
    ↓
Buy
    ↓
Track
    ↓
Return / Review
```

The admin experience should be:

```
Create
    ↓
Manage
    ↓
Promote
    ↓
Sell
    ↓
Fulfill
    ↓
Analyze
    ↓
Improve
```

Every feature added to the platform should support one of these two journeys.

The agent must keep the system simple for customers and powerful for administrators.

⸻

## 103. Dataset & Product Catalog Architecture

### 1. Dataset Source & Overview
* Source: Locally downloaded Hugging Face dataset: `ashraq/fashion-product-images-small`.
* Record Count: Exactly 44,072 fashion product records.
* Licensing & Terms: The project must respect the licensing and usage terms of the source dataset (derived from Kaggle's Fashion Product Images Small). Do not claim that images are unrestricted for commercial use unless explicitly confirmed by the upstream license.

### 2. Dataset Location & Protection
* Location: Stored locally at:
  ```text
  fashion-product-images/
  └── data/
      ├── train-00000-of-00002-*.parquet
      └── train-00001-of-00002-*.parquet
  ```
* **Git Rules & Protection**:
  - The raw dataset is strictly local and must NEVER be committed to Git or pushed to GitHub.
  - Do NOT re-download the dataset.
  - Directories `fashion-product-images/`, `data/raw/`, and `data/processed/` must remain in `.gitignore`.
  - Do NOT store raw Parquet files or binary image blobs inside PostgreSQL.

### 3. Complete Dataset Schema
The Parquet dataset contains exactly these 11 fields:
1. `id` (`int64`): Unique source dataset product identifier.
2. `gender` (`string`): Target gender category (`Men`, `Women`, `Boys`, `Girls`, `Unisex`).
3. `masterCategory` (`string`): Main category (`Apparel`, `Accessories`, `Footwear`, `Personal Care`, etc.).
4. `subCategory` (`string`): Product sub-category (`Topwear`, `Bottomwear`, `Shoes`, `Watches`, `Bags`, etc.).
5. `articleType` (`string`): Specific item type (`Shirts`, `Tshirts`, `Jeans`, `Dresses`, `Casual Shoes`, etc.).
6. `baseColour` (`string`): Primary/base color (`Black`, `White`, `Navy Blue`, `Grey`, `Blue`, `Red`, etc.).
7. `season` (`string`): Season classification (`Summer`, `Fall`, `Winter`, `Spring`).
8. `year` (`float64`): Catalog year (represented as float64 in Parquet; converted safely to integer year).
9. `usage` (`string`): Usage classification (`Casual`, `Formal`, `Sports`, `Ethnic`, etc.).
10. `productDisplayName` (`string`): Original product display name / title.
11. `image` (`struct<bytes: binary, path: string>`): Embedded JPEG image binary bytes (`bytes`) and optional source path (`path`).

### 4. Product Field Mapping & Architecture
Map dataset fields into normalized application entities rather than forcing them into a single table:

```
Source Dataset                 Application Entities
──────────────                 ────────────────────
id                     ───►    Product.externalProductId (unique)
productDisplayName     ───►    Product.name
gender                 ───►    Product.gender
masterCategory         ───►    Product.masterCategory / Category
subCategory            ───►    Product.subCategory / Category
articleType            ───►    Product.articleType
baseColour             ───►    Product.baseColour / Variant.color
season                 ───►    Product.season
year                   ───►    Product.releaseYear (int)
usage                  ───►    Product.usage
image.bytes            ───►    ProductImage.imageUrl (file path or object URL)
```

**Non-Dataset Fields**:
* Do NOT invent fake dataset values for fields absent from the source dataset:
  - `price`, `salePrice`, `sizes`, `stock/inventory`, `SKU`, `description`, `discounts`, `ratings`, and `reviews`.
* These must be managed separately by the application's business logic, inventory services, and seed configurations.

### 5. Data Processing Pipeline
```
Hugging Face Dataset (Local)
             ↓
Local Parquet Files (fashion-product-images/data/*.parquet)
             ↓
Import Script (scripts/import_fashion_dataset.py)
             ↓
Validation & Deduplication
             ↓
Image Extraction (data/processed/images/{id}.jpg) + Metadata (products.jsonl / CSV)
             ↓
PostgreSQL Database (Source of Truth)
             ↓
Spring Boot REST API (Controllers → Services → Repositories → DTOs)
             ↓
React.js Storefront (Client-side discovery, filtering, and checkout)
```

### 6. Data Validation Rules
* **Deduplication**: `id` must be unique across all Parquet parts; duplicates must be eliminated before ingestion.
* **String Sanitization**: Clean whitespace from all string fields (`strip()`).
* **Name Validation**: `productDisplayName` must not be empty; fallback safely without corrupting data.
* **Year Conversion**: Convert `year` from `float64` to `int` safely handling `NaN` and boundary conditions (1900–2100).
* **Missing Values**: Use safe `null` representations; never create fake placeholder strings to disguise null values.

### 7. Image Extraction & Storage
* Binary Extraction: The `image.bytes` field contains raw JPEG data. The import script extracts each image to `data/processed/images/{id}.jpg`.
* Database Storage: PostgreSQL only stores image URLs / relative paths in `ProductImage` (`imageUrl`), never binary blobs.
* Provider Abstraction: The system must allow seamlessly replacing local filesystem paths with Cloudinary, AWS S3, Cloudflare R2, or Supabase Storage without changing the `Product` entity schema.

### 8. PostgreSQL Import & Idempotency Rules
* The database import process must be strictly idempotent using `externalProductId` as the unique constraint.
* Re-running the import must update existing records or skip them without creating duplicate products or variants.
* Never expose JPA entities directly to API responses; use structured DTOs (`ProductResponseDTO`, `ProductDetailDTO`).

### 9. Frontend Data Access Constraints
* The React frontend must **NEVER** directly access Parquet files, raw dataset directories, or Python scripts.
* All data flows strictly through the Spring Boot REST API (`/api/products`, `/api/categories`, etc.).
* Expose user-friendly terminology in the storefront:
  - `masterCategory` → `Category`
  - `articleType` → `Product Type`
  - `baseColour` → `Color`
* Filtering and faceted search (Gender, Category, Product Type, Color, Season) must be driven by API query parameters.

⸻

## Intelligent Product Search & RAG Chatbot Operational Rules

When developing, maintaining, or modifying search and AI capabilities, agents must strictly follow these mandatory standards:

1. **Database-Backed Search**: Product search must always be executed against the PostgreSQL catalog through the Spring Boot service layer (`ProductSearchService`). Never load raw catalogs or complete datasets into client-side React memory.
2. **Typo Tolerance**: The search system must tolerate spelling errors, omissions, and keystroke mistakes (e.g., `"blak shirt"` → `"Black Shirt"`, `"blk tshrt"` → `"Black T-Shirts"`, `"nik shoes"` → `"Nike Shoes"`).
3. **Fuzzy, Partial, & Semantic Matching**: Combine character n-gram/Levenshtein matching, tokenization, abbreviation expansion, and optional semantic vector similarity.
4. **Relevance Ranking**: Search results must never be returned in arbitrary database order. Rank candidates using multi-signal scoring (Exact Name > Prefix > Article Type > Color > Gender > Usage > Fuzzy/Trigram similarity).
5. **No Direct Database Access**: The React frontend must NEVER directly access PostgreSQL. All queries must flow through secure REST endpoints (`/api/products/search`, `/api/products/search/suggestions`).
6. **Authorized Admin Uploads**: RAG knowledge documents can ONLY be uploaded, re-indexed, or deleted by authenticated administrator roles (`ADMIN`, `SUPER_ADMIN`).
7. **Document Processing Pipeline**: Uploaded PDF documents must be securely validated, extracted using Apache PDFBox, segmented into sliding-window text chunks with overlap, and indexed with dense vector embeddings.
8. **Vector Storage**: Use PostgreSQL + pgvector (or structured high-dimensional vector representations) for storing and querying chunk embeddings.
9. **Strict Grounding**: RAG chatbot responses must be strictly grounded in the retrieved document context. The system prompt must forbid hallucinating company policies, return windows, delivery guarantees, prices, or discounts.
10. **Hallucination Control**: If retrieved knowledge does not contain the answer, the chatbot must clearly communicate that the information is unavailable in the knowledge base, rather than generating unsupported answers.
11. **Source Attribution & Citations**: Chatbot answers must always return structured citation metadata (document name, page number, text snippet) to provide transparency and verify facts.
12. **Role-Based Access Control (RBAC)**: Protect `/api/admin/knowledge-base/**` endpoints with strict server-side authorization. Ordinary customers or guest sessions must never access document administration or raw uploaded files.
13. **Upload File Validation**: Strictly validate MIME types (`application/pdf`), file extensions, file sizes (max 15MB), and scan for corrupted headers or path traversal attempts. Never use raw client-supplied paths.
14. **Secret Protection**: API keys (`AI_API_KEY`, `JWT_SECRET`, database passwords) must NEVER be committed to Git, hardcoded in source code, or bundled into client JavaScript.
15. **Product Data Integrity**: Product details, inventory numbers, color variants, and prices must strictly originate from PostgreSQL records.
16. **No Invented Attributes**: Neither the search engine nor the RAG chatbot may invent product attributes, prices, inventory availability, or discounts.
17. **Separation of Concerns**: The Product Search engine (PostgreSQL product catalog) and the Knowledge Base RAG system (policy and guide documents) are distinct architectural subsystems. The chatbot may query the product search API to assist users with product recommendations, but the two systems must remain cleanly separated.

