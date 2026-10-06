# Premium Clothing E-Commerce Platform

A modern, premium clothing e-commerce platform built with React.js and Spring Boot, designed around a minimal black-and-white fashion aesthetic with a powerful administration system.

⸻

## Overview

This project is a full-stack clothing e-commerce platform designed for a modern fashion brand.

The platform has two major parts:

```
                    CLOTHING PLATFORM
                           │
              ┌────────────┴────────────┐
              │                         │
        CUSTOMER STOREFRONT        ADMIN DASHBOARD
              │                         │
       Browse & Search              Products
       Product Details              Inventory
       Wishlist                     Orders
       Cart                         Customers
       Coupons                      Coupons
       Checkout                     Collections
       Orders                       Analytics
       Reviews                      Settings
```

The goal is to create a production-ready e-commerce system, not just a frontend product catalogue.

⸻

## Tech Stack

### Frontend

The frontend will be built using:

* **React.js**
* **TypeScript**
* **Vite**
* **React Router**
* **Tailwind CSS**
* **TanStack Query**
* **React Hook Form**
* **Zod**

The frontend is responsible for:
* Customer storefront.
* Product browsing.
* Search.
* Filtering.
* Product details.
* Cart.
* Wishlist.
* Checkout.
* Customer account.
* Admin dashboard.
* Admin forms and tables.
* Responsive UI.

---

### Backend

The backend will be built using:

* **Java**
* **Spring Boot**
* **Spring Web**
* **Spring Data JPA**
* **Spring Security**
* **Bean Validation**
* **JWT / secure authentication**
* **Maven**

The backend is responsible for:
* REST APIs.
* Authentication.
* Authorization.
* Product management.
* Product variants.
* Inventory.
* Categories.
* Collections.
* Cart.
* Wishlist.
* Coupons.
* Discounts.
* Orders.
* Payments.
* Customers.
* Reviews.
* Analytics.
* Admin permissions.
* Audit logs.

---

### Database

Primary database:

* **PostgreSQL**

The backend communicates with PostgreSQL through:

```
Spring Data JPA
        ↓
    Hibernate
        ↓
   PostgreSQL
```

⸻

## Architecture

The application follows a client-server architecture:

```
┌─────────────────────────────────────────────┐
│              React.js Frontend              │
│                                             │
│ Storefront + Admin Dashboard                │
└──────────────────────┬──────────────────────┘
                       │
                       │ REST API / JSON
                       │
┌──────────────────────▼──────────────────────┐
│             Spring Boot Backend             │
│                                             │
│ Controllers                                 │
│ Services                                    │
│ Repositories                                │
│ Security                                    │
│ Validation                                  │
└──────────────────────┬──────────────────────┘
                       │
                       │ JPA / Hibernate
                       │
┌──────────────────────▼──────────────────────┐
│                 PostgreSQL                  │
└─────────────────────────────────────────────┘
```

⸻

## Project Structure

Recommended repository structure:

```
clothing-ecommerce/
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   ├── layout/
│   │   │   ├── product/
│   │   │   ├── cart/
│   │   │   ├── checkout/
│   │   │   └── admin/
│   │   │
│   │   ├── hooks/
│   │   ├── pages/
│   │   │   ├── Home/
│   │   │   ├── Shop/
│   │   │   ├── Product/
│   │   │   ├── Collections/
│   │   │   ├── Search/
│   │   │   ├── Wishlist/
│   │   │   ├── Cart/
│   │   │   ├── Checkout/
│   │   │   ├── Account/
│   │   │   └── Admin/
│   │   │
│   │   ├── routes/
│   │   ├── services/
│   │   ├── types/
│   │   ├── utils/
│   │   ├── constants/
│   │   └── App.tsx
│   │
│   ├── package.json
│   └── vite.config.ts
│
├── backend/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/
│   │   │   │   └── com/
│   │   │   │       └── clothing/
│   │   │   │           ├── config/
│   │   │   │           ├── controller/
│   │   │   │           ├── dto/
│   │   │   │           ├── entity/
│   │   │   │           ├── exception/
│   │   │   │           ├── repository/
│   │   │   │           ├── security/
│   │   │   │           ├── service/
│   │   │   │           └── util/
│   │   │   │
│   │   │   └── resources/
│   │   │       ├── application.properties
│   │   │       └── application-dev.properties
│   │   │
│   │   └── test/
│   │
│   └── pom.xml
│
├── scripts/
│   └── import_fashion_dataset.py
│
├── data/
│   ├── raw/
│   └── processed/
│
├── fashion-product-images/
├── design.md
├── AGENTS.md
├── README.md
├── .gitignore
└── .env.example
```

⸻

## Product Dataset & Catalog Integration

The platform's initial catalog is seeded from the locally stored fashion product dataset:

* **Source**: Hugging Face dataset [`ashraq/fashion-product-images-small`](https://huggingface.co/datasets/ashraq/fashion-product-images-small) (derived from Kaggle's Fashion Product Images Dataset).
* **Record Count**: **44,072** fashion product records across apparel, footwear, accessories, and personal care.
* **Storage Size**: ~271 MB download archive; ~259 MB across 2 Parquet files.
* **Local Location**: `fashion-product-images/data/`

### Dataset Reproducibility

To re-download or mirror the dataset locally (if not already present):

```bash
hf download ashraq/fashion-product-images-small \
  --repo-type dataset \
  --local-dir ./fashion-product-images
```

> [!CAUTION]
> The raw dataset and processed binaries must remain strictly local. They are listed in `.gitignore` and must **NEVER** be committed to Git or pushed to remote repositories.

### Dataset Schema & Field Descriptions

The Parquet dataset contains exactly these 11 fields:

| Field | Type | Description & Examples |
| :--- | :--- | :--- |
| `id` | `int64` | Original unique dataset product identifier (e.g. `15970`). |
| `gender` | `string` | Target demographic: `Men`, `Women`, `Boys`, `Girls`, `Unisex`. |
| `masterCategory` | `string` | Top-level catalog category: `Apparel`, `Accessories`, `Footwear`, `Personal Care`. |
| `subCategory` | `string` | Product subcategory: `Topwear`, `Bottomwear`, `Shoes`, `Bags`, `Watches`. |
| `articleType` | `string` | Specific product type: `Shirts`, `Tshirts`, `Jeans`, `Dresses`, `Casual Shoes`. |
| `baseColour` | `string` | Primary garment color: `Black`, `White`, `Navy Blue`, `Grey`, `Blue`, `Red`. |
| `season` | `string` | Catalog season: `Summer`, `Fall`, `Winter`, `Spring`. |
| `year` | `float64` | Catalog year (safely cast to integer year during ingestion). |
| `usage` | `string` | Lifestyle / usage category: `Casual`, `Formal`, `Sports`, `Ethnic`. |
| `productDisplayName` | `string` | Full product name (e.g., *"Turtle Check Men Navy Blue Shirt"*). |
| `image` | `struct` | Embedded image bytes (`image.bytes`: JPEG binary) and optional path. |

### Data Processing Architecture

Data flows through a staged processing pipeline:

```
Hugging Face Dataset
        ↓
Local Parquet Dataset (fashion-product-images/data/*.parquet)
        ↓
Python Processing Script (scripts/import_fashion_dataset.py)
        ↓
Processed Products + Extracted Images (data/processed/)
        ↓
PostgreSQL Database (Source of Truth)
        ↓
Spring Boot REST API
        ↓
React.js Frontend
```

### Running the Dataset Importer

To validate the dataset and extract product metadata and images:

```bash
# Dry run: Validates schema, checks row counts, and verifies field integrity without writing
python3 scripts/import_fashion_dataset.py --dry-run

# Staging test: Process first 500 records
python3 scripts/import_fashion_dataset.py --limit 500

# Full processing: Validates records, extracts images to data/processed/images/, and generates products.jsonl & products.csv
python3 scripts/import_fashion_dataset.py
```

### Database Integration & Normalization

* **Entity Isolation**: The raw dataset fields are mapped into normalized JPA entities (`Product`, `ProductImage`, `ProductVariant`, `Inventory`).
* **Idempotency**: Products are indexed by `externalProductId`. Subsequent imports update or skip existing records without duplicates.
* **Image Delivery**: Image binaries are never stored in PostgreSQL. Extracted images reside locally in `data/processed/images/` and can be pointed to cloud object storage (S3, Cloudinary, Cloudflare R2, Supabase) via the `ProductImage.imageUrl` property.
* **Separation of Concerns**: Non-dataset attributes like prices, size runs, stock levels, reviews, and discounts are managed independently by backend services and not fabricated into the source dataset.

### License & Data Usage Notice

This project respects the licensing and usage terms of the source dataset. Because the dataset is derived from Kaggle's Fashion Product Images Small dataset, images and metadata are intended for educational and developmental purposes. Do not assume or state that assets are commercially unrestricted unless explicitly permitted by the upstream dataset license.

⸻

## Design System

The visual design system is documented in:


[design.md](file:///Users/milindverma/Desktop/Clothing/design.md)

The project uses a premium monochrome aesthetic inspired by modern consumer technology brands while maintaining its own clothing-brand identity.

### Core principles:
* Black + White
* Large typography
* Editorial photography
* Minimal UI
* Pill interactions
* Rounded product cards
* Generous whitespace
* Strong product hierarchy

> [!IMPORTANT]
> The project is inspired by general design principles, not a copy of another company’s branding or proprietary assets.
> 
> Do **NOT** copy:
> * Logos.
> * Proprietary fonts.
> * Proprietary illustrations.
> * Exact page layouts.
> * Brand assets.

⸻

## AGENTS.md

Development rules for AI coding agents are documented in:

[AGENTS.md](file:///Users/milindverma/Desktop/Clothing/AGENTS.md)

Before making significant changes, an AI agent should read:
1. [design.md](file:///Users/milindverma/Desktop/Clothing/design.md)
2. [AGENTS.md](file:///Users/milindverma/Desktop/Clothing/AGENTS.md)

These files define:
* Design rules.
* Architecture.
* Coding conventions.
* Security rules.
* Business logic.
* Database guidelines.
* API conventions.
* Component structure.
* Testing requirements.

⸻

## Customer Features

### Home Page

The homepage will include:
* Hero campaign.
* New arrivals.
* Featured collections.
* Best sellers.
* Promotional sections.
* Category navigation.
* Editorial fashion imagery.
* Newsletter/signup section.
* Footer.

```
Hero
  ↓
New Arrivals
  ↓
Featured Collection
  ↓
Best Sellers
  ↓
Campaign Banner
  ↓
Categories
  ↓
Newsletter
  ↓
Footer
```

---

### Product Discovery

Customers can:
* Browse all products.
* Browse categories.
* Browse collections.
* Search products.
* Filter products.
* Sort products.
* View product details.

Filters include:
* Category
* Size
* Color
* Price
* Collection
* Availability
* Discount
* Rating

---

### Product Details

Each product supports:
* Product name.
* Description.
* Price.
* Sale price.
* Product images.
* Product videos.
* Sizes.
* Colors.
* Variants.
* SKU.
* Stock availability.
* Reviews.
* Ratings.
* Shipping information.
* Return information.
* Related products.

---

### Product Variants

Products can have multiple variants.

Example:

```
Oversized Essential Tee
Black
 ├── S
 ├── M
 ├── L
 └── XL
White
 ├── S
 ├── M
 ├── L
 └── XL
```

Each variant can have:
* SKU
* Size
* Color
* Price
* Stock
* Image

---

### Wishlist

Customers can:
* Add products to wishlist.
* Remove products.
* View saved products.
* Move products to cart.

---

### Shopping Cart

Cart supports:
* Add product.
* Remove product.
* Increase quantity.
* Decrease quantity.
* Variant selection.
* Coupon application.
* Discount calculation.
* Shipping calculation.
* Total calculation.

Example:

```
Subtotal
- Product Discount
- Coupon Discount
+ Shipping
+ Tax
----------------
Grand Total
```

---

### Coupon System

The platform supports multiple coupon types:

* **Percentage**: `SAVE20` → 20% OFF
* **Fixed Amount**: `SAVE500` → ₹500 OFF
* **Free Shipping**: `FREESHIP` → FREE DELIVERY

Coupons can have restrictions such as:
* Minimum cart value.
* Maximum discount.
* Expiry date.
* Usage limit.
* Customer usage limit.
* First-order only.
* Product restrictions.
* Category restrictions.
* Customer restrictions.

All coupon calculations must be validated by the Spring Boot backend.

---

### Checkout

Checkout flow:

```
Cart
 ↓
Address
 ↓
Delivery
 ↓
Payment
 ↓
Order Confirmation
```

Before creating an order, the backend must verify:
* Cart contents.
* Product availability.
* Variant availability.
* Inventory.
* Current prices.
* Coupon validity.
* Shipping.
* Taxes.
* Final total.

---

### Orders

Order statuses:
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

Customers can:
* View orders.
* View order details.
* Track orders.
* Request returns.
* View invoices.
* View payment information.

---

### Customer Account

Customer dashboard:

```
Account
├── Profile
├── Orders
├── Wishlist
├── Addresses
└── Settings
```

---

### Reviews

Customers can submit:
* Rating
* Title
* Comment

Reviews can be marked: **Verified Purchase**.

Admins can:
* Approve.
* Hide.
* Flag.
* Delete.

⸻

## Admin Dashboard

The admin dashboard provides complete management capabilities:

```
Admin Dashboard
│
├── Dashboard
├── Products
├── Categories
├── Collections
├── Inventory
│
├── Orders
├── Customers
├── Reviews
│
├── Coupons
├── Discounts
│
├── Analytics
│
├── Admin Users
├── Audit Logs
└── Settings
```

---

### Admin Product Management

Admin can:
* Create product
* View product
* Edit product
* Duplicate product
* Archive product
* Delete product
* Publish product
* Unpublish product

Product management includes:
* Product information.
* Description.
* Images.
* Videos.
* Categories.
* Collections.
* Sizes.
* Colors.
* Variants.
* SKU.
* Pricing.
* Inventory.
* SEO.

---

### Inventory Management

Inventory is tracked per product variant.

Example:

```
Oversized Tee
Black / M → 25
Black / L → 12
White / M → 40
White / L → 18
```

Admin can:
* Add stock.
* Remove stock.
* Adjust stock.
* View low-stock products.
* View out-of-stock products.
* View inventory history.

---

### Category Management

Admin can:
* Create categories.
* Edit categories.
* Delete/archive categories.
* Reorder categories.
* Create subcategories.
* Assign products.
* Upload category images.

Example:

```
Men
├── T-Shirts
├── Shirts
├── Hoodies
└── Pants
Women
├── Tops
├── Dresses
├── Jackets
└── Bottoms
```

---

### Collection Management

Collections are marketing-driven groups.

Examples:
* New Arrivals
* Essentials
* Summer Collection
* Streetwear
* Limited Edition
* Best Sellers

Admin can:
* Create collections.
* Add products.
* Remove products.
* Change collection image.
* Schedule collections.
* Publish/unpublish collections.

---

### Coupon Management

Admin can:
* Create
* Edit
* Disable
* Delete
* Duplicate
* View coupon usage

Coupon dashboard:

| Code | Type | Value | Status |
| :--- | :--- | :--- | :--- |
| `WELCOME10` | Percentage | 10% | Active |
| `SAVE500` | Fixed | ₹500 | Active |
| `FREESHIP` | Shipping | Free | Active |

---

### Order Management

Admin can:
* View orders.
* Search orders.
* Filter orders.
* Update order status.
* Add tracking number.
* Cancel orders.
* Approve returns.
* Process refunds.
* Generate invoices.
* View customer information.

---

### Customer Management

Admin can:
* View customers.
* Search customers.
* View customer orders.
* View customer addresses.
* View spending history.
* Disable accounts where appropriate.

---

### Analytics

The admin dashboard will provide:
* Revenue
* Orders
* Average Order Value
* Customers
* Repeat Customers
* Top Products
* Top Categories
* Coupon Usage
* Inventory
* Conversion Rate

Date ranges:
* Today
* 7 Days
* 30 Days
* 90 Days
* This Year
* Custom Range

---

### Admin Roles

The platform supports role-based access control.

Available roles:
* `SUPER_ADMIN`
* `ADMIN`
* `PRODUCT_MANAGER`
* `ORDER_MANAGER`
* `MARKETING_MANAGER`
* `SUPPORT_AGENT`

| Role | Products | Orders | Coupons | Analytics | Users |
| :--- | :---: | :---: | :---: | :---: | :---: |
| `SUPER_ADMIN` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `ADMIN` | ✓ | ✓ | ✓ | ✓ | Limited |
| `PRODUCT_MANAGER` | ✓ | — | — | — | — |
| `ORDER_MANAGER` | — | ✓ | — | — | — |
| `MARKETING_MANAGER` | — | — | ✓ | ✓ | — |
| `SUPPORT_AGENT` | — | View | — | — | — |

⸻

## Security

Security is a core requirement.

The backend will implement:
* Spring Security.
* Authentication.
* Authorization.
* Role-based access control.
* Password hashing.
* JWT or secure session authentication.
* API validation.
* CORS restrictions.
* Rate limiting where appropriate.
* Audit logging.

> [!CAUTION]
> Never trust sensitive values from the frontend.
>
> ❌ Frontend says: `total = ₹1,000`  
> 
> The backend must calculate:
> * ✓ Product price
> * ✓ Quantity
> * ✓ Discount
> * ✓ Coupon
> * ✓ Shipping
> * ✓ Tax
> * ✓ Final total

⸻

## Database Schema

Core entities:
* `User`
* `Role`
* `Product`
* `ProductVariant`
* `ProductImage`
* `Category`
* `Collection`
* `Inventory`
* `Cart`
* `CartItem`
* `Wishlist`
* `WishlistItem`
* `Coupon`
* `CouponUsage`
* `Order`
* `OrderItem`
* `Payment`
* `Address`
* `Review`
* `AuditLog`

Relationships should be managed through JPA.

⸻

## API Architecture

The Spring Boot backend exposes REST APIs.

```
/api/products
/api/categories
/api/collections
/api/cart
/api/wishlist
/api/coupons
/api/orders
/api/customers
/api/reviews
/api/admin
/api/analytics
```

### Example API Calls

#### 1. Get Products
`GET /api/products`

```json
{
  "success": true,
  "data": {
    "content": [],
    "page": 0,
    "size": 20,
    "totalElements": 100
  }
}
```

#### 2. Create Product
`POST /api/products`

```json
{
  "name": "Oversized Essential Tee",
  "description": "Premium heavyweight oversized t-shirt.",
  "price": 1499,
  "compareAtPrice": 1999,
  "categoryId": 1,
  "collectionId": 2
}
```

#### 3. Validate Coupon
`POST /api/coupons/validate`

```json
{
  "code": "WELCOME10",
  "cartId": "cart-123"
}
```

The backend returns the calculated discount.

#### 4. Create Order
`POST /api/orders`

The backend performs:

```
Validate Cart
      ↓
Validate Inventory
      ↓
Validate Coupon
      ↓
Calculate Total
      ↓
Process Payment
      ↓
Create Order
      ↓
Update Inventory
      ↓
Return Confirmation
```

⸻

## Environment Variables

Never commit secrets. Create `.env` locally and provide `.env.example` for documentation.

### Frontend (`.env.example`)
```env
VITE_API_BASE_URL=http://localhost:8080/api
```

### Backend (`.env.example` / `application-dev.properties`)
```env
DATABASE_URL=jdbc:postgresql://localhost:5432/clothing_db
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=
JWT_SECRET=
PAYMENT_API_KEY=
PAYMENT_SECRET=
STORAGE_BUCKET=
STORAGE_ACCESS_KEY=
STORAGE_SECRET_KEY=
```

⸻

## Local Development

### Requirements

Install:
* Node.js & npm
* Java 17+ (or newer LTS)
* Maven
* PostgreSQL
* Git

---

### Step 1: Clone Repository

```bash
git clone <repository-url>
cd clothing-ecommerce
```

---

### Step 2: Start PostgreSQL

Create the database:

```sql
CREATE DATABASE clothing_db;
```

---

### Step 3: Start Backend

```bash
cd backend
```

Configure `application.properties` or environment variables, then run:

```bash
# Unix / macOS
./mvnw spring-boot:run

# Windows
mvnw.cmd spring-boot:run
```

Backend will run on: `http://localhost:8080`

---

### Step 4: Start Frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend will run on: `http://localhost:5173`

⸻

## Development Workflow

Use the following workflow for every feature:

```
Requirement
     ↓
Understand existing code
     ↓
Read AGENTS.md
     ↓
Read design.md for UI work
     ↓
Design data/API requirements
     ↓
Implement backend
     ↓
Implement frontend
     ↓
Test
     ↓
Responsive check
     ↓
Security check
     ↓
Code cleanup
```

⸻

## Coding Standards

### React

Prefer standard component functions:

```tsx
function ProductCard() {
  return (...);
}
```

* Use TypeScript interfaces/types.
* Avoid unnecessary `any`.
* Prefer reusable components.

### React State

* **Local UI state**: `useState`
* **Server state**: `TanStack Query`
* **Forms**: `React Hook Form` + `Zod`
* **Routing**: `React Router`

### Spring Boot Standards

Use strict layering:

```
ProductController
       ↓
ProductService
       ↓
ProductRepository
       ↓
PostgreSQL
```

* Controllers should remain thin.
* Business logic belongs in services.

### Git Commit Convention

Use meaningful commits:

* `feat: add product management`
* `feat: implement coupon validation`
* `feat: add wishlist`
* `feat: implement checkout`
* `fix: prevent negative inventory`
* `fix: handle expired authentication`
* `refactor: improve product service`
* `style: update product card`
* `test: add coupon service tests`

⸻

## Testing

### Critical Customer Flows
* Register & Login
* Search & Filter
* View product & Select variant
* Add to cart
* Apply coupon
* Checkout & Place order
* View order
* Add wishlist
* Submit review

### Critical Admin Flows
* Create product & Edit product
* Publish product
* Update inventory
* Create coupon & Disable coupon
* Update order
* Process return & Process refund
* Manage customer

⸻

## Performance

The application should prioritize:
* Fast initial load.
* Optimized images (WebP / AVIF).
* Lazy loading.
* Pagination.
* API caching.
* Code splitting.
* Efficient database queries.
* Proper indexes.

⸻

## Responsive Design

The storefront must support:
* Mobile (`< 600px`)
* Mobile Large (`600–767px`)
* Tablet (`768–1023px`)
* Desktop (`1024–1279px`)
* Large Desktop (`≥ 1280px`)

Mobile is not an afterthought. Every feature must be usable on mobile.

⸻

## Accessibility

Target: **WCAG AA**

Requirements:
* Keyboard navigation.
* Visible focus states.
* Proper labels.
* Meaningful alt text.
* Accessible icon buttons.
* Sufficient contrast.
* Minimum 44px touch targets.
* Screen-reader-friendly structure.

⸻

## Design Rules

Follow [design.md](file:///Users/milindverma/Desktop/Clothing/design.md).

### Do
* Use black and white as the dominant palette.
* Use large editorial photography.
* Use strong typography.
* Use pill-shaped interactive controls.
* Use 16px rounded cards.
* Use generous whitespace.
* Keep the UI minimal.
* Make products visually dominant.

### Don’t
* Add unnecessary gradients.
* Add excessive colors.
* Use excessive shadows.
* Overload product cards.
* Use inconsistent image ratios.
* Copy another company’s branding.
* Add unnecessary animations.
* Sacrifice usability for visual minimalism.

⸻

## Project Documentation

The repository maintains:

* [README.md](file:///Users/milindverma/Desktop/Clothing/README.md) — Project overview and setup.
* [AGENTS.md](file:///Users/milindverma/Desktop/Clothing/AGENTS.md) — Rules for AI coding agents and engineering conventions.
* [design.md](file:///Users/milindverma/Desktop/Clothing/design.md) — Visual design system.
* [.env.example](file:///Users/milindverma/Desktop/Clothing/.env.example) — Required environment variables.

⸻

## Development Roadmap

### Phase 1 — Foundation
- [ ] Repository setup
- [ ] React + Vite
- [ ] Spring Boot
- [ ] PostgreSQL
- [ ] Base design system
- [ ] Authentication
- [ ] Project structure

### Phase 2 — Product System
- [ ] Product entity
- [ ] Product variants
- [ ] Categories
- [ ] Collections
- [ ] Product images
- [ ] Inventory
- [ ] Product APIs
- [ ] Admin product management

### Phase 3 — Storefront
- [ ] Homepage
- [ ] Navigation
- [ ] Product listing
- [ ] Product details
- [ ] Search
- [ ] Filters
- [ ] Sorting
- [ ] Wishlist

### Phase 4 — Commerce
- [ ] Cart
- [ ] Coupon system
- [ ] Checkout
- [ ] Address management
- [ ] Payment integration
- [ ] Order creation
- [ ] Order tracking

### Phase 5 — Admin
- [ ] Dashboard
- [ ] Order management
- [ ] Customer management
- [ ] Coupon management
- [ ] Review management
- [ ] Analytics
- [ ] Admin roles
- [ ] Audit logs

### Phase 6 — Production
- [ ] Security audit
- [ ] Performance optimization
- [ ] SEO
- [ ] Accessibility audit
- [ ] Automated tests
- [ ] Error monitoring
- [ ] Production deployment

⸻

## Deployment Architecture

Production architecture is expected to follow:

```
                 USERS
                   │
                   ▼
            React Frontend
                   │
                   │ HTTPS
                   ▼
          Spring Boot Backend
                   │
          ┌────────┴────────┐
          │                 │
          ▼                 ▼
      PostgreSQL       Object Storage
          │                 │
          └────────┬────────┘
                   │
                   ▼
             Payment Gateway
```

### Possible Deployment Platforms:
* **Frontend**: Vercel, Netlify, AWS, Cloudflare
* **Backend**: AWS, Render, Railway, Fly.io
* **Database**: PostgreSQL, Supabase, Neon, AWS RDS
* **Object Storage**: AWS S3, Cloudinary, Supabase Storage, Cloudflare R2

⸻

## Production Checklist

Before production deployment:

- [ ] HTTPS enabled
- [ ] Environment variables configured
- [ ] Secrets removed from repository
- [ ] PostgreSQL production database configured
- [ ] Database backups configured
- [ ] CORS configured
- [ ] Authentication tested
- [ ] Authorization tested
- [ ] Admin permissions tested
- [ ] Payment verification tested
- [ ] Coupon validation tested
- [ ] Inventory concurrency tested
- [ ] Error handling tested
- [ ] Product images optimized
- [ ] SEO metadata added
- [ ] Sitemap configured
- [ ] Accessibility checked
- [ ] Mobile tested
- [ ] Desktop tested
- [ ] API rate limiting configured
- [ ] Logging configured
- [ ] Monitoring configured

⸻

## Core Principles

1. **Product First**: The clothing is the hero.
2. **Simple Customer Experience**: Customers should be able to discover and purchase products without unnecessary friction.
3. **Powerful Administration**: The admin should have complete control over the catalog, inventory, orders, promotions, and customers.
4. **Secure Backend**: All important business rules must be enforced by Spring Boot.
5. **Consistent Design**: [design.md](file:///Users/milindverma/Desktop/Clothing/design.md) is the visual source of truth.

⸻

## Final Vision

The goal is to build a complete clothing commerce platform that feels like a real premium fashion brand.

```
                    BRAND
                      │
          ┌───────────┴───────────┐
          │                       │
     CUSTOMER                  ADMIN
          │                       │
     Discover                 Manage
          │                       │
     Explore                  Products
          │                       │
     Select                  Inventory
          │                       │
     Wishlist                  Orders
          │                       │
     Cart                    Coupons
          │                       │
     Checkout                Customers
          │                       │
     Purchase                Analytics
          │                       │
     Track                    Control
          │                       │
          └───────────┬───────────┘
                      │
                 CLOTHING BRAND
```

* **Frontend**: React.js + TypeScript + Vite
* **Backend**: Java + Spring Boot
* **Database**: PostgreSQL
* **Architecture**: REST API + layered backend architecture
* **Design System**: [design.md](file:///Users/milindverma/Desktop/Clothing/design.md)
* **AI Development Rules**: [AGENTS.md](file:///Users/milindverma/Desktop/Clothing/AGENTS.md)

The platform is designed as a scalable, secure, responsive, and production-ready e-commerce application, with React.js responsible for the user experience and Spring Boot responsible for business logic, APIs, security, and data management.

⸻

## Intelligent Product Search

The product discovery engine goes far beyond simple exact-match queries. Built directly on top of Spring Boot and the PostgreSQL catalog, it understands natural language intent, handles spelling errors, expands common abbreviations, and scores items using a multi-signal relevance formula.

### Architecture

```
React Storefront
       │
       ▼ (GET /api/products/search?q=...)
Spring Boot Search API (ProductSearchController)
       │
       ▼
ProductSearchService
 ├── Normalization & Tokenization (lowercase, strip noise, trim)
 ├── Synonym & Abbreviation Expansion ("blk" → "black", "tshrt" → "t-shirt")
 ├── Multi-Signal Relevance Scorer (Exact > Prefix > ArticleType > Color > Fuzzy)
 └── Fallback Recommendation Engine (if zero exact matches)
       │
       ▼
PostgreSQL Database (Product catalog & searchable_content)
       │
       ▼
Ranked Relevant Products DTO (ProductSearchDTO)
       │
       ▼
React Product Results Grid
```

### Features

* **Typo Tolerance & Fuzzy Search**: Uses character n-gram similarity and phonetic/Levenshtein distance (e.g., `"blak shirt"` reliably resolves to `"Black Shirt"`, `"nik shoes"` matches `"Nike Shoes"`).
* **Synonym & Abbreviation Mapping**: Handles `"blk"` → `"black"`, `"wht"` → `"white"`, `"tshrt"` → `"tshirt"`, `"mens"` → `"men"`, `"jeans"` → `"bottomwear"`.
* **Multi-Attribute Intent Recognition**: Queries like `"navy blue casual"` or `"formal wear for men"` extract color (`Navy Blue`), usage (`Casual`), and gender (`Men`) to filter and boost relevant items.
* **Database-Driven Relevance Ranking**:
  ```
  Exact Product Name Match (+100.0)
          ↓
  Article Type / Category Match (+45.0)
          ↓
  Base Colour Match (+35.0)
          ↓
  Gender / Target Match (+25.0)
          ↓
  Usage / Occasion Match (+20.0)
          ↓
  Fuzzy / Character Trigram Overlap (+15.0)
  ```
* **Catalog Autocomplete / Suggestions**: Debounced endpoint `GET /api/products/search/suggestions?q=bla` dynamically queries real catalog data to suggest terms like `"Black Shirts"`, `"Black T-Shirts"`, and `"Black Shoes"`.
* **Graceful Fallbacks**: When no products match a search strictly, the system signals `isFallback: true` and presents similar or trending items instead of an abrupt empty screen.
* **Faceted Filtering & Sorting**: Supports server-side filtering by `gender`, `masterCategory`, `subCategory`, `articleType`, `baseColour`, `season`, `usage`, `minPrice`, `maxPrice`, and sorting by `price_asc`, `price_desc`, `newest`, and `recommended`.

⸻

## RAG AI Chatbot

The store features an enterprise-grade Retrieval-Augmented Generation (RAG) assistant that is strictly grounded in official documents uploaded by store administrators. It answers customer questions regarding return policies, shipping timelines, sizing guides, and materials without hallucinating business policies.

### Architecture

```
Admin PDF Upload (Knowledge Base)
       │
       ▼
DocumentProcessingService
 ├── Apache PDFBox Text Extraction
 ├── Sliding-Window Chunking (450 chars, 80 char overlap)
 └── Dense Semantic Vector Generation (64-dim unit vector)
       │
       ▼
PostgreSQL + Vector Chunks (knowledge_documents & knowledge_document_chunks)
       │
       ▼
Customer Question ("What is your return policy?")
       │
       ▼
ProductAwareChatbotService (Intent routing: Knowledge vs Product vs Hybrid)
       │
       ▼
RagService (Hybrid Retrieval: 65% Cosine Similarity + 35% BM25 Keyword Overlap)
       │
       ▼
AiService (Strict Grounding & Hallucination Prevention)
 └── Local Context Synthesizer / Optional Gemini or OpenAI LLM API
       │
       ▼
Grounded Answer + Source Citations (Document Name + Page Number)
       │
       ▼
Floating Chatbot Widget (React frontend)
```

### Knowledge Base Management (`/admin/knowledge-base`)

* **Admin Document Ingestion**: Dedicated administrator dashboard section to upload PDF store manuals, size guides, warranty terms, and FAQs.
* **Processing Lifecycle**: Tracks document status through `UPLOADED` → `PROCESSING` → `INDEXED` (or `FAILED`).
* **Document Auditing**: Displays file size, upload timestamp, chunk count, and index status.
* **Actions**: One-click asynchronous document re-indexing and destructive deletion (with cascading removal of all related vector chunks).

### Grounding & Hallucination Control

* **Strict Policy Grounding**: If information is absent from the retrieved knowledge chunks, the chatbot will explicitly inform the customer that the information is unavailable rather than fabricating terms or policies.
* **Source Attribution**: Answers cite exact reference documents and page numbers (e.g., `return-and-refund-policy.pdf — Page 1`).
* **Product-Aware Intent**: When customers ask product-related questions (`"Do you have navy blue shirts?"`), the chatbot routes to `ProductSearchService` to return structured product cards linking directly to the product detail pages.

### Database Tables

* `knowledge_documents`:
  - `id`: Primary key
  - `original_file_name`: File name (e.g. `shipping-and-delivery-guide.pdf`)
  - `storage_path`: Internal storage location
  - `mime_type`: `application/pdf`
  - `file_size`: File size in bytes
  - `status`: `UPLOADED`, `PROCESSING`, `INDEXED`, `FAILED`, `DELETING`
  - `chunk_count`: Number of extracted passages
  - `uploaded_by`: Administrator ID
  - `created_at`, `updated_at`: Timestamps
* `knowledge_document_chunks`:
  - `id`: Primary key
  - `document_id`: Foreign key referencing `knowledge_documents` (CASCADE on delete)
  - `chunk_index`: Sequence position
  - `page_number`: Originating PDF page
  - `content`: Extracted text passage
  - `embedding`: 64-dimensional dense vector representation

### Configuration & Environment Variables

Add to your environment file (`.env` or `application-dev.properties`):

```bash
# Optional External LLM Integration (Built-in offline synthesizer active by default)
AI_API_KEY=your_gemini_or_openai_api_key
AI_MODEL=gemini-1.5-flash
EMBEDDING_MODEL=text-embedding-004

# RAG Tuning Parameters
RAG_TOP_K=5
RAG_CHUNK_SIZE=450
RAG_CHUNK_OVERLAP=80

# Database
VECTOR_DATABASE_URL=jdbc:postgresql://localhost:5432/clothing_db

# Conversation Retention
AI_CONVERSATION_RETENTION_DAYS=90
```

---

## AI Conversation Monitoring & Telemetry

The platform includes an enterprise AI customer-support observability and monitoring system, allowing administrators to review, audit, and analyze every conversation between customers and the AI assistant.

### Architecture

```
Customer
   │
   ▼
AI Chatbot (ChatbotWidget)
   │
   ▼
ProductAwareChatbotService ───► AiConversationService (Persistence & Turn Tracking)
                                       │
                                       ▼
                       PostgreSQL Database
                       ├── ai_conversations
                       ├── ai_messages
                       ├── ai_message_sources
                       └── ai_message_products
                                       │
                                       ▼
                 Admin AI Conversation Dashboard (/admin/ai-conversations)
                 ├── Real-Time Multi-Turn Chat History
                 ├── Grounded RAG Document Citations & Similarity Excerpts
                 ├── Recommended Catalog Products
                 ├── AI Execution Traces & Latency Telemetry
                 ├── Unanswered Questions Loop (/admin/ai/unanswered)
                 └── Operations & Performance Analytics (/admin/ai/analytics)
```

### Key Capabilities

1. **Complete Conversation & Message Persistence**:
   - Every user question and AI response is persisted immutably with timestamp, turn sequence number, and session identifier.
   - Preserves full multi-turn conversational context rather than only isolated queries.

2. **User & Identity Association**:
   - Identifies which customer asked each question (name, email, user ID, or anonymous session ID).
   - Shows active duration, turn count, and last interaction timestamp.

3. **RAG Source Attribution & Chunk Tracking**:
   - Whenever an answer is derived from knowledge base documents, the exact PDF source name, page number, similarity score (e.g. 94%), and text excerpt are stored in `ai_message_sources`.
   - Administrators can expand and inspect the exact passages the AI relied upon.

4. **Product Search & Recommendation Tracking**:
   - Records when the AI triggers catalog searches (`PRODUCT_SEARCH`), saving recommended product IDs, names, prices, and image thumbnails into `ai_message_products`.

5. **AI Processing Traces & Telemetry**:
   - Captures processing latency in milliseconds, token usage, classified intent (`RAG_QUERY`, `PRODUCT_SEARCH`, `GREETING`), and model execution status.
   - Collapsible inspect drawer shows technical telemetry without leaking API secrets or credentials.

6. **Customer Feedback Sentiment**:
   - Customers can rate AI responses as helpful (👍) or not helpful (👎) with optional comments, providing a customer satisfaction metric in the admin console.

7. **Questions AI Could Not Answer (Continuous Knowledge Base Loop)**:
   - Dedicated dashboard view (`/admin/ai/unanswered`) logging queries where the AI lacked sufficient documentation (e.g. international shipping to specific countries).
   - Direct call-to-action button allows administrators to immediately upload supplementary policy PDFs to close knowledge gaps.

8. **Admin Security & Role-Based Access Control (RBAC)**:
   - All conversation monitoring APIs (`/api/admin/ai-conversations/**`) are restricted to administrators (`SUPER_ADMIN`, `ADMIN`, `SUPPORT_AGENT`).
   - Normal customers can never access other users' chat logs.

### Database Schema

* `ai_conversations`:
  - `id`: Primary key
  - `user_id`: Reference to authenticated user (nullable for guests)
  - `session_id`: Unique browser session identifier
  - `title`: Dialogue title / topic summary
  - `status`: `ACTIVE`, `CLOSED`, `ARCHIVED`
  - `started_at`, `last_activity_at`: Timestamps
  - `message_count`, `rag_queries_count`, `product_searches_count`: Aggregate counters
  - `has_unanswered`: Boolean flag for knowledge gaps

* `ai_messages`:
  - `id`: Primary key
  - `conversation_id`: Foreign key referencing `ai_conversations`
  - `sender_type`: `USER`, `ASSISTANT`, `SYSTEM`
  - `content`: Message text (immutable)
  - `intent`: Classified intent (`RAG_QUERY`, `PRODUCT_SEARCH`, etc.)
  - `model_name`: AI model configured
  - `processing_time_ms`: Turn latency in milliseconds
  - `is_helpful`: Customer sentiment boolean (👍/👎)
  - `created_at`: Timestamp
  - `sequence_number`: Chronological turn position

* `ai_message_sources`:
  - `id`: Primary key
  - `message_id`: Foreign key referencing `ai_messages`
  - `document_name`: Source file name (e.g. `return-policy.pdf`)
  - `page_number`: Originating PDF page
  - `similarity_score`: Vector match relevance (0.0 to 1.0)
  - `source_excerpt`: Text chunk excerpt

* `ai_message_products`:
  - `id`: Primary key
  - `message_id`: Foreign key referencing `ai_messages`
  - `product_id`: Catalog product reference
  - `product_name`: Name of item
  - `price`: Unit price
  - `relevance_score`: Search ranking score

---

## Customer Account & Profile System

The platform features a full-featured customer account portal designed for minimal friction, privacy, and seamless multi-device shopping.

### Core Experience & Guest-First Architecture

1. **Unrestricted Guest Browsing**:
   - Guests can freely browse the homepage, catalog, collections, category filters, and product details.
   - Intelligent search, filters, size guides, and public store policy RAG inquiries remain open to all visitors without requiring account creation.
   - Adding to cart is enabled for guests, storing temporary selections in local session storage (`clothing_cart`).

2. **Context-Preserving Authentication**:
   - Authentication is triggered naturally only when identity is required (e.g. Saving to Wishlist, Initiating Checkout, Accessing Account Portal, Submitting Reviews).
   - In-place modal authentication resumes pending customer actions without reloading the page or redirecting back to the homepage.

3. **Customer Account Portal (`/account`)**:
   - **Dashboard Overview**: Personalized greeting (`Hello, {firstName} 👋`), real-time metric cards (Total Orders, Wishlist Count, Saved Addresses, Unread Alerts), recent order tracking card, and 1-click action shortcuts.
   - **Order History & Timeline (`/account/orders`)**: Complete order history with carrier tracking numbers (`BlueDart Express`, `Delhivery`), multi-step delivery status visualizer (`PLACED` → `CONFIRMED` → `PROCESSING` → `PACKED` → `SHIPPED` → `DELIVERED`), and in-place **Return/Exchange Request** workflow with reason selection and audit notes.
   - **Saved Wishlist (`/account/wishlist`)**: PostgreSQL-backed wishlist synchronized across devices, with instant "Move to Bag" and stock indicators.
   - **Saved Addresses (`/account/addresses`)**: Address book supporting `HOME`, `WORK`, and `OTHER` categories, primary shipping default toggling, and full field validation. Strict backend ownership authorization prevents horizontal privilege escalation.
   - **Profile Information (`/account/profile`)**: Update name, phone, and avatar. Email changes require verification to prevent takeover.
   - **Security & Login (`/account/security`)**: Change password form, connected authentication providers overview (Email/Password, Google OAuth), active session termination, and real-time security activity audit log.
   - **Verified Reviews (`/account/reviews`)**: Customers can write verified purchase ratings and reviews on delivered garments.
   - **Notifications Center (`/account/notifications`)**: Real-time order dispatch, delivery, and return notifications with unread badges and bulk "Mark all as read".
   - **Settings & Privacy (`/account/settings`)**: Transactional vs. promotional communication preferences, data summary download, and safe account deactivation with fiscal audit retention.

---

## Authentication & Security Architecture

### Supported Authentication Methods
1. **Email + Password**:
   - Salted and hashed using BCrypt. Passwords are never logged or stored in plaintext.
   - Secure account enumeration prevention on forgot password requests.
2. **Google OAuth 2.0 / OpenID Connect**:
   - Integrated via Spring Security OAuth2 Client (`spring-boot-starter-oauth2-client`).
   - Single sign-on with verified identity claim (`email`, `given_name`, `family_name`, `picture`).

### Account Linking Rules
- **No Duplicate Accounts**: If a user registered with `milind@example.com` via email/password and later signs in with Google using `milind@example.com`, the application links the Google provider identity to the existing account rather than creating duplicate records.
- **Provider Architecture**: The `user_auth_providers` table decouples authentication providers from the core `users` entity, supporting future identity providers (Apple, GitHub) seamlessly.
- **Unlink Protection**: Users cannot disconnect their only authentication method if no alternative password or provider is configured.

### Authentication Rules for Cart & Orders
- **Add to Bag Authentication Guard**: Guests can explore the catalog, search, and view product details freely. When a guest attempts to add an item to the bag (via product page, quick add, or instant checkout), the `AuthModal` prompts: *"Sign in to add this item to your cart."* Upon successful authentication, the item is automatically added to the cart and the bag opens without repeating the action.
- **Checkout & Order Creation Guard**: Unauthenticated visitors cannot access checkout or submit orders. Both frontend (`/checkout` guard) and backend (`POST /api/account/orders` with `@AuthenticationPrincipal`) strictly reject unauthenticated orders (401/403).
- **Session Cleanup**: Logging out clears the active bag and cached customer state, ensuring that guest visitors never inherit or order from an unauthenticated session.
- **Zero Client Price Trust**: The backend recalculates item prices, discounts, taxes, and shipping directly from PostgreSQL product and coupon records.

---

## Google OAuth 2.0 Setup Guide

### 1. Google Cloud Console Configuration
1. Navigate to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create or select a Google Cloud project.
3. Configure the **OAuth Consent Screen**:
   - User Type: **External**
   - Application Name: `Clothing Storefront`
   - Scopes: `openid`, `profile`, `email`
4. Create **OAuth 2.0 Client ID**:
   - Application Type: **Web application**
   - Name: `Clothing Web Client`
   - **Authorized JavaScript Origins**:
     - Development: `http://localhost:5173`
     - Production: `https://yourdomain.com`
   - **Authorized Redirect URIs**:
     - Development: `http://localhost:8080/login/oauth2/code/google`
     - Production: `https://api.yourdomain.com/login/oauth2/code/google`
5. Copy your **Client ID** and **Client Secret**.

### 2. Environment Variables Configuration
Never commit actual OAuth secrets to version control. Add the credentials to your local environment or `.env`:

```bash
# Backend Environment Configuration
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8080/login/oauth2/code/google

# JWT Configuration
JWT_SECRET=super-secret-jwt-signing-key-minimum-256-bits-for-production-security
JWT_EXPIRATION_MS=604800000
```

---

## Production Readiness & QA Audit

The platform has completed a comprehensive end-to-end quality and security audit:

1. **Order Image Snapshotting**:
   - Order items capture immutable historical snapshots of `productId`, `productName`, `imageUrl`, `size`, `color`, `quantity`, and `unitPrice`.
   - Guaranteed dual JSON property serialization (`image` and `imageUrl`) ensures client compatibility.
   - Client image tags include multi-tiered fallbacks and dynamic `onError` handlers.
2. **Role-Based Access Control (RBAC)**:
   - Admin routes (`/api/admin/**`) are strictly secured with `hasRole('ADMIN')`.
   - Customer accounts and unauthenticated visitors receive HTTP 403 Forbidden.
3. **Admin Fulfillment & Coupons**:
   - Full order lifecycle management (`CONFIRMED`, `PROCESSING`, `SHIPPED`, `OUT_FOR_DELIVERY`, `DELIVERED`, `CANCELLED`).
   - Live promotional coupon administration (`WELCOME10`, `SAVE500`, `FREESHIP`, `MILIND10`).
4. **Intelligent Search & RAG AI**:
   - Typo-tolerant hybrid search over the entire fashion catalog.
   - Grounded PDF policy retrieval with document and page citation attribution.


