# Clothing Brand — Design System

⸻

```yaml
version: alpha
name: Clothing-Brand-Design-System
description: >
  A premium fashion-commerce design system inspired by the restraint,
  typography, geometry, and black-and-white visual discipline of modern
  mobility brands. The system is adapted for a clothing e-commerce experience:
  product discovery, collections, product details, cart, checkout, offers,
  customer accounts, and a powerful admin dashboard.
```

⸻

## 1. Design Philosophy

The website should feel like a premium modern fashion brand, not a traditional online clothing store.

The visual language is inspired by the following principles:

* Black-and-white visual foundation.
* Strong editorial typography.
* Large product photography.
* Minimal decorative UI.
* Pill-shaped interactive controls.
* Rounded product cards.
* Generous whitespace.
* Clear visual hierarchy.
* Strong full-width campaign sections.
* Alternating light and dark sections.
* Product imagery as the primary visual accent.
* Minimal use of colors outside the brand palette.

The interface should communicate:

**Premium. Minimal. Confident. Modern.**

The website must prioritize the products over UI decoration.

⸻

## 2. Product Experience

The primary customer journey is:

```
Landing Page
     ↓
Collections
     ↓
Product Listing
     ↓
Product Details
     ↓
Size / Color Selection
     ↓
Add to Cart
     ↓
Cart
     ↓
Coupon / Discount
     ↓
Checkout
     ↓
Payment
     ↓
Order Confirmation
```

Secondary journeys:

```
Search
  ↓
Product

Category
  ↓
Collection
  ↓
Product

Account
  ↓
Orders
  ↓
Order Details

Admin
  ↓
Products
Orders
Coupons
Inventory
Customers
Categories
Collections
Analytics
Settings
```

⸻

## 3. Brand Color System

The customer-facing website uses a restrained monochrome palette.

### Core Colors

```yaml
colors:
  primary: "#000000"
  primary-hover: "#1A1A1A"
  primary-pressed: "#2A2A2A"

  on-primary: "#FFFFFF"

  ink: "#000000"
  body: "#5E5E5E"
  muted: "#8A8A8A"
  subtle: "#AFAFAF"

  canvas: "#FFFFFF"
  canvas-soft: "#F4F4F4"
  canvas-softer: "#F8F8F8"

  border: "#E5E5E5"
  border-strong: "#CFCFCF"

  surface-dark: "#000000"
  surface-dark-soft: "#171717"

  on-dark: "#FFFFFF"
```

### Semantic Colors

Semantic colors are allowed only where they communicate system state.

```yaml
success: "#167A45"
success-soft: "#E8F5EE"

warning: "#A15C00"
warning-soft: "#FFF4E5"

error: "#B42318"
error-soft: "#FDECEC"

info: "#2457A6"
info-soft: "#EEF4FF"
```

These colors should NOT become decorative brand colors.

Use them only for:

* Validation.
* Inventory warnings.
* Payment status.
* Order status.
* Admin notifications.
* System feedback.

⸻

## 4. Typography

Typography is one of the most important parts of the brand.

The website should use a modern geometric sans-serif.

### Recommended:

Primary:
* Inter

Alternative:
* Geist
* Plus Jakarta Sans
* Manrope

### Display Typography

```yaml
typography:
  display-xxl:
    fontFamily: Inter, system-ui, sans-serif
    fontSize: 64px
    fontWeight: 700
    lineHeight: 72px

  display-xl:
    fontFamily: Inter, system-ui, sans-serif
    fontSize: 48px
    fontWeight: 700
    lineHeight: 56px

  display-lg:
    fontFamily: Inter, system-ui, sans-serif
    fontSize: 40px
    fontWeight: 700
    lineHeight: 48px

  display-md:
    fontFamily: Inter, system-ui, sans-serif
    fontSize: 32px
    fontWeight: 700
    lineHeight: 40px

  display-sm:
    fontFamily: Inter, system-ui, sans-serif
    fontSize: 24px
    fontWeight: 700
    lineHeight: 32px
```

### Body Typography

```yaml
body-lg:
  fontFamily: Inter, system-ui, sans-serif
  fontSize: 18px
  fontWeight: 400
  lineHeight: 28px

body-md:
  fontFamily: Inter, system-ui, sans-serif
  fontSize: 16px
  fontWeight: 400
  lineHeight: 24px

body-md-strong:
  fontFamily: Inter, system-ui, sans-serif
  fontSize: 16px
  fontWeight: 500
  lineHeight: 24px

body-sm:
  fontFamily: Inter, system-ui, sans-serif
  fontSize: 14px
  fontWeight: 400
  lineHeight: 20px

body-sm-strong:
  fontFamily: Inter, system-ui, sans-serif
  fontSize: 14px
  fontWeight: 500
  lineHeight: 20px

caption:
  fontFamily: Inter, system-ui, sans-serif
  fontSize: 12px
  fontWeight: 400
  lineHeight: 18px
```

⸻

## 5. Typography Rules

### Headlines

Use:

* Sentence case.
* Strong weight.
* Short phrases.
* Large sizes.
* Minimal punctuation.

Example:

> New season.  
> Built for movement.

Avoid:

> WELCOME TO OUR AMAZING CLOTHING STORE!!!

### Product Names

Product names use:
* 16px
* 500 weight

Example:
* Oversized Essential Tee

### Product Prices

Use:
* 14–16px
* 500 weight

Sale price:
* ₹1,499

Original price:
* ~~₹1,999~~

Original price uses muted gray and strikethrough.

⸻

## 6. Spacing System

```yaml
spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 20px
  xl: 24px
  2xl: 32px
  3xl: 48px
  4xl: 64px
  5xl: 80px
  6xl: 96px
```

Base spacing unit:
* 4px

Use multiples of 4 wherever possible.

⸻

## 7. Border Radius

The brand’s geometric signature is the pill.

```yaml
rounded:
  none: 0px
  sm: 6px
  md: 8px
  lg: 12px
  xl: 16px
  2xl: 24px
  pill: 999px
  full: 9999px
```

### Rules

Interactive controls:
* 999px

Cards:
* 16px

Product images:
* 12px – 16px

Inputs:
* 8px

Never use extremely rounded cards.

⸻

## 8. Layout

### Maximum Width

Desktop content:
* 1280px

Large screens:
* 1440px

Mobile:
* 100%

### Horizontal padding:

* Desktop: 32px
* Tablet: 24px
* Mobile: 16px

⸻

## 9. Responsive Breakpoints

| Breakpoint | Width | Behavior |
| :--- | :--- | :--- |
| Mobile | < 600px | Single-column |
| Mobile Large | 600–767px | Single-column / 2-column products |
| Tablet | 768–1023px | 2-column product grid |
| Desktop | 1024–1279px | 3-column product grid |
| Desktop Large | ≥ 1280px | 4-column product grid |

⸻

## 10. Navigation

The navigation is minimal.

Desktop:

```
---------------------------------------------------------
LOGO     Men   Women   New Arrivals   Collections
                         Search  ♡  Bag  Account
---------------------------------------------------------
```

### Navigation Rules

Background:
* `#FFFFFF`

Height:
* 72px

Sticky:
* true

Bottom border:
* `#E5E5E5`

Logo:
* Black

Navigation text:
* 14px / 500

⸻

## 11. Mobile Navigation

Mobile navigation:

```
------------------------------------------------
☰       BRAND LOGO                    🛍
------------------------------------------------
```

Opening the menu:

```
FULL SCREEN MENU
Men
Women
New Arrivals
Collections
Sale
------------------
Search
Account
Orders
Help
```

Menu controls should use pill interactions.

⸻

## 12. Buttons

### Primary Button

```yaml
button-primary:
  background: "#000000"
  color: "#FFFFFF"
  border-radius: 999px
  padding: 14px 24px
  font-size: 16px
  font-weight: 500
```

Examples:
* Add to bag
* Buy now
* Checkout
* Apply coupon
* Create product

⸻

## 13. Secondary Button

```yaml
button-secondary:
  background: "#FFFFFF"
  color: "#000000"
  border: 1px solid "#000000"
  border-radius: 999px
  padding: 14px 24px
```

Examples:
* View collection
* Continue shopping
* Cancel

⸻

## 14. Subtle Button

```yaml
button-subtle:
  background: "#F4F4F4"
  color: "#000000"
  border-radius: 999px
  padding: 12px 20px
```

Examples:
* Filter
* Sort
* View details

⸻

## 15. Icon Button

```yaml
icon-button:
  width: 44px
  height: 44px
  border-radius: 999px
  background: "#F4F4F4"
```

Used for:
* Search
* Wishlist
* Cart
* Account
* Close
* Menu
* Share

⸻

## 16. Hero Section

The homepage hero should be highly visual.

Structure:

```
---------------------------------------------------------
|
|                  HERO IMAGE                           |
|
|             NEW SEASON                                |
|             MOVE DIFFERENT                            |
|
|             [ Shop Men ] [ Shop Women ]               |
|
---------------------------------------------------------
```

Hero image should contain actual clothing photography.

Avoid gradients.

Avoid decorative backgrounds.

Use:
* large photography
* strong headline
* minimal copy
* black CTA

⸻

## 17. Hero Typography

Desktop:
* 64px
* 700
* 72px line-height

Mobile:
* 40px
* 700
* 48px line-height

Maximum headline width:
* 700px

⸻

## 18. Collection Sections

Example:

```
NEW ARRIVALS
Latest pieces.
Designed for everyday movement.
[ Explore collection ]
-------------------------------------------------
IMAGE                     IMAGE
Oversized Collection      Essential Collection
[Shop now]                [Shop now]
```

Use large photography.

Do not overload cards with information.

⸻

## 19. Product Grid

Desktop:
* 4 products

Tablet:
* 2–3 products

Mobile:
* 2 products

Example:

```
┌─────────────┐  ┌─────────────┐
│             │  │             │
│    IMAGE    │  │    IMAGE    │
│             │  │             │
└─────────────┘  └─────────────┘
Oversized Tee    Heavyweight Hoodie
₹1,499           ₹2,499
♡                ♡
```

⸻

## 20. Product Card

```yaml
product-card:
  background: "#FFFFFF"
  border-radius: 16px

product-image:
  aspect-ratio: 4 / 5
  object-fit: cover
```

Product card contains:
* Image
* Wishlist
* Product name
* Category
* Price
* Discount
* Color options

⸻

## 21. Product Image Behavior

The image is the primary component.

Use:
* `4:5` for fashion products.

On hover:
* Image 1 → Image 2

Optional:
* Quick Add appears at the bottom.

Example:

```
┌─────────────────────┐
│                     │
│       PRODUCT       │
│                     │
│                 ♡   │
│                     │
│  [ QUICK ADD ]      │
└─────────────────────┘
```

⸻

## 22. Product Badges

Allowed badges:
* NEW
* SALE
* BESTSELLER
* LIMITED
* LOW STOCK

Badge:

```yaml
badge:
  background: "#000000"
  color: "#FFFFFF"
  border-radius: 999px
  padding: 6px 12px
```

Do not use many badges simultaneously.

Maximum:
* 2

⸻

## 23. Product Detail Page

Structure:

```
-----------------------------------------------------
PRODUCT IMAGE GALLERY     PRODUCT INFORMATION
                         Oversized Essential Tee
                         ₹1,499
                         ₹1,999
                         ★★★★★
                         Color
                         ● ● ● ●
                         Size
                         [S] [M] [L] [XL]
                         Size Guide
                         [ Add to bag ]
                         [ Buy now ]
                         ───────────────
                         Description
                         Details
                         Shipping
                         Returns
-----------------------------------------------------
```

⸻

## 24. Product Gallery

Desktop:
* 4:5 main image + vertical thumbnail gallery

Mobile:
* horizontal image carousel

Controls:
* `←` `→`
* Use circular icon buttons.

⸻

## 25. Size Selector

Size buttons:
* S
* M
* L
* XL
* XXL

Default:
* white background
* black border
* pill radius

Selected:
* black background
* white text

Unavailable:
* `#F4F4F4`
* `#AFAFAF`

⸻

## 26. Color Selector

Color selector should be visual.

Example:
* ● Black
* ● White
* ● Grey
* ● Navy

Use circular swatches.

Selected swatch gets:
* 2px black outer ring

⸻

## 27. Cart

Cart should be simple and highly readable.

Desktop:

```
--------------------------------------------------
YOUR BAG
PRODUCT                    QTY       PRICE
Product image             -  1  +   ₹1,499
--------------------------------------------------
Coupon code
[ Enter coupon ] [ Apply ]
Subtotal                       ₹1,499
Discount                       -₹200
Shipping                       FREE
Total                         ₹1,299
[ Checkout ]
--------------------------------------------------
```

⸻

## 28. Coupon System

Customer coupon component:

```
[ Enter promo code                 ]
                     [ Apply ]
```

After successful application:
* ✓ MILIND10 applied
* You saved ₹150

Coupon errors should use semantic error colors.

⸻

## 29. Coupon Types

Admin should be able to create:
* Percentage discount
* Fixed amount discount
* Free shipping
* First-order discount
* Minimum cart value
* Category-specific discount
* Product-specific discount
* Buy X Get Y
* Limited-time coupon
* Customer-specific coupon

⸻

## 30. Checkout

Checkout should minimize distractions.

Steps:
1. Address
2. Delivery
3. Payment
4. Confirmation

Desktop layout:

```
CUSTOMER INFORMATION       ORDER SUMMARY
Name                        Product
Email                       Product
Phone                       Product
Address
Payment                     Subtotal
                            Discount
                            Shipping
                            Total
[ Place order ]
```

⸻

## 31. Footer

The footer becomes the strongest dark section.

```
---------------------------------------------------------
BLACK BACKGROUND
BRAND
Modern clothing for
everyday movement.
Shop
Men
Women
New arrivals
Collections
Sale
Help
Contact
Shipping
Returns
FAQ
Company
About
Careers
Privacy
Terms
© 2026 BRAND
---------------------------------------------------------
```

⸻

## 32. Alternating Section Rhythm

The homepage should follow:

```
WHITE
  ↓
IMAGE
  ↓
BLACK
  ↓
WHITE
  ↓
IMAGE
  ↓
LIGHT GRAY
  ↓
WHITE
  ↓
BLACK FOOTER
```

Black sections should be used intentionally.

Do not make every section black.

⸻

## 33. Dark Promotional Section

Example:

```
--------------------------------------------------
BLACK
THE ESSENTIAL
COLLECTION
Everyday pieces.
Built better.
[ Explore collection ]
                         PRODUCT IMAGE
--------------------------------------------------
```

* White typography.
* White secondary button.

⸻

## 34. Search

Search should be fast and minimal.

Desktop:

```
[ Search products, collections, styles... ]
```

Search results should show:
* Products
* Collections
* Categories

Search page:

```
Search results for "oversized"
24 products
[Filter] [Sort]
```

⸻

## 35. Filters

Product listing filters:
* Category
* Size
* Color
* Price
* Collection
* Availability
* Discount

Desktop:
* Sidebar filters + Product grid

Mobile:
* `[ Filter ] [ Sort ]`
* Filters open in a bottom sheet or full-screen drawer.

⸻

## 36. Sorting

Sort options:
* Recommended
* Newest
* Price: Low to High
* Price: High to Low
* Best Selling
* Highest Rated

⸻

## 37. Wishlist

Wishlist icon:
* `♡`

Selected:
* `♥`

Wishlist page:

```
MY WISHLIST
Product grid
```

⸻

## 38. Customer Account

Customer dashboard:

```
ACCOUNT
Overview
Orders
Wishlist
Addresses
Profile
```

Orders:

```
Order #10245
Delivered
₹2,499
[ View order ]
```

⸻

## 39. Order Status

Supported states:
* Pending
* Confirmed
* Processing
* Packed
* Shipped
* Out for delivery
* Delivered
* Cancelled
* Returned
* Refunded

Use semantic status colors only in status indicators.

⸻

## 40. Admin Dashboard

The admin panel is a separate application surface.

It should prioritize:
* Control
* Data density
* Speed
* Clarity

Admin sidebar:
* Dashboard
* Products
* Categories
* Collections
* Inventory
* Orders
* Customers
* Reviews
* Coupons
* Discounts
* Analytics
* Settings

⸻

## 41. Admin Dashboard Overview

Dashboard:

```
-----------------------------------------------------
GOOD MORNING, ADMIN
Revenue
₹4,82,450
Orders
1,248
Customers
8,421
Products
324
-----------------------------------------------------
REVENUE OVERVIEW
[ chart ]
-----------------------------------------------------
RECENT ORDERS
Order    Customer    Amount    Status
#10241   Rahul       ₹2,499    Shipped
#10242   Ankit       ₹1,799    Processing
-----------------------------------------------------
```

⸻

## 42. Admin Product Management

Admin must have complete product control.

Product fields:
* Product name
* Slug
* Description
* Category
* Subcategory
* Collection
* Brand
* SKU
* Price
* Compare-at price
* Cost price
* Discount
* Images
* Videos
* Colors
* Sizes
* Inventory
* Low-stock threshold
* Tags
* SEO title
* SEO description
* Status

⸻

## 43. Product CRUD

Admin actions:
* Create product
* View product
* Edit product
* Duplicate product
* Archive product
* Delete product
* Publish product
* Unpublish product

Bulk actions:
* Bulk delete
* Bulk archive
* Bulk publish
* Bulk price update
* Bulk category update
* Bulk inventory update

⸻

## 44. Product Variants

A product should support variants.

Example:

```
Oversized Tee
BLACK
S → 20
M → 34
L → 42
XL → 18
WHITE
S → 15
M → 27
L → 31
XL → 12
```

Each variant should have:
* SKU
* Color
* Size
* Price
* Stock
* Image

⸻

## 45. Inventory Management

Inventory dashboard:

| PRODUCT | STOCK | STATUS |
| :--- | :--- | :--- |
| Oversized Tee | 120 | In stock |
| Cargo Pants | 8 | Low stock |
| Hoodie | 0 | Out of stock |

Admin actions:
* Increase stock
* Decrease stock
* Set stock
* Bulk update

Low-stock notifications should be visible.

⸻

## 46. Category Management

Admin can:
* Create category
* Edit category
* Delete category
* Reorder categories
* Assign products
* Upload category image

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

⸻

## 47. Collection Management

Collections are marketing-driven groups.

Examples:
* New Arrivals
* Summer 2026
* Essentials
* Streetwear
* Limited Edition
* Best Sellers

Admin can:
* Create collection
* Add products
* Remove products
* Change collection image
* Schedule collection
* Publish/unpublish

⸻

## 48. Coupon Management

Admin coupon table:

| CODE | TYPE | VALUE | USES | STATUS |
| :--- | :--- | :--- | :--- | :--- |
| WELCOME10 | Percentage | 10% | 432 | Active |
| SAVE500 | Fixed | ₹500 | 120 | Active |
| FREESHIP | Shipping | Free | 891 | Active |

Admin actions:
* Create
* Edit
* Disable
* Delete
* Duplicate
* View usage

⸻

## 49. Coupon Configuration

Coupon form:
* Coupon code
* Discount type `[ Percentage / Fixed / Free Shipping ]`
* Discount value
* Minimum cart value
* Maximum discount
* Start date
* Expiry date
* Usage limit
* Per-customer limit
* Applicable products
* Applicable categories
* Applicable customers
* First order only
* Stackable
* Active

⸻

## 50. Order Management

Admin order table:

| ORDER | CUSTOMER | TOTAL | STATUS |
| :--- | :--- | :--- | :--- |
| #10245 | Rahul | ₹2,499 | Delivered |
| #10246 | Priya | ₹4,899 | Shipped |
| #10247 | Aman | ₹1,299 | Processing |

Admin can:
* View order
* Update status
* Cancel order
* Approve return
* Approve refund
* Add tracking number
* Print invoice
* Contact customer

⸻

## 51. Customer Management

Admin customer table:

| CUSTOMER | ORDERS | SPENT |
| :--- | :--- | :--- |
| Rahul | 12 | ₹24,500 |
| Priya | 8 | ₹18,200 |
| Aman | 3 | ₹4,899 |

Admin can:
* View customer
* View orders
* View addresses
* Disable account
* Add customer

⸻

## 52. Reviews

Customer reviews:

```
★★★★★
Great quality and fit.
Rahul
Verified purchase
```

Admin can:
* Approve
* Hide
* Delete
* Flag

⸻

## 53. Analytics

Admin analytics should include:
* Revenue
* Orders
* Average order value
* Conversion rate
* Customers
* Repeat customers
* Top products
* Top categories
* Coupon usage
* Inventory turnover

Charts should remain visually minimal.

Avoid excessive dashboard colors.

⸻

## 54. Admin Data Tables

Table style:

```yaml
table:
  background: "#FFFFFF"
  border: 1px solid "#E5E5E5"
  border-radius: 12px

header:
  background: "#F4F4F4"
  font-size: 12px
  fontWeight: 500

rows:
  height: 56px
  border-bottom: 1px solid "#E5E5E5"
```

⸻

## 55. Admin Sidebar

Desktop:

```
┌──────────────────────────┐
│ BRAND                    │
│                          │
│ Dashboard                │
│ Products                 │
│ Categories               │
│ Collections              │
│ Inventory                │
│                          │
│ Orders                   │
│ Customers                │
│ Reviews                  │
│                          │
│ Coupons                  │
│ Discounts                │
│                          │
│ Analytics                │
│ Settings                 │
└──────────────────────────┘
```

Active item:
* background: `#000000`
* color: `#FFFFFF`
* border-radius: 999px

⸻

## 56. Forms

All forms should use clear grouping.

Example:

```
PRODUCT INFORMATION
Product name
[____________________________]
Description
[____________________________]
[____________________________]

PRICING
Price
[____________]
Compare-at price
[____________]

INVENTORY
SKU
[____________]
Stock
[____________]
```

Avoid putting too many fields in a single row.

⸻

## 57. Input

```yaml
text-input:
  background: "#F4F4F4"
  color: "#000000"
  border: 1px solid transparent
  border-radius: 8px
  padding: 14px 16px
  font-size: 16px

focus:
  border: 1px solid "#000000"
  background: "#FFFFFF"
```

⸻

## 58. Modal

```yaml
modal:
  background: "#FFFFFF"
  border-radius: 16px
  padding: 32px

overlay:
  background: "rgba(0,0,0,0.5)"
```

Example:

```
DELETE PRODUCT?
Are you sure you want to delete
"Oversized Essential Tee"?
This action cannot be undone.
[ Cancel ] [ Delete ]
```

Destructive actions use semantic error styling.

⸻

## 59. Toasts

Success:
* ✓ Product created successfully

Error:
* Something went wrong

Warning:
* Only 4 items remaining

Toast:
* white background
* 12px radius
* subtle shadow

⸻

## 60. Empty States

Example:

```
NO PRODUCTS YET
Start building your catalog.
[ Add product ]
```

Keep empty states simple.

⸻

## 61. Loading States

Use skeleton loading.

Product:

```
████████████████
████████████████
████████████
```

Do not use excessive spinners.

⸻

## 62. Error States

Example:

```
Something went wrong.
We couldn't load the products.
[ Try again ]
```

Use the semantic error color only for the error message/action.

⸻

## 63. Photography Guidelines

Photography is the main decorative element.

Preferred:
* Editorial fashion photography
* Studio photography
* Streetwear photography
* Minimal backgrounds
* Natural lighting
* High contrast

Avoid:
* Generic stock photography
* Overly saturated backgrounds
* Heavy gradients
* Artificial UI illustrations
* Busy collages

Product images should be consistent in:
* Aspect ratio
* Lighting
* Background
* Crop
* Scale

⸻

## 64. Image Ratios

* Product: `4:5`
* Hero: `16:9`
* Campaign: `16:9`
* Collection: `4:5`
* Category: `1:1`

⸻

## 65. Shadows

The system should be mostly flat.

Level 0:
* none

Level 1:
* `0 4px 16px rgba(0,0,0,0.08)`

Level 2:
* `0 8px 24px rgba(0,0,0,0.12)`

Level 3:
* `0 12px 32px rgba(0,0,0,0.16)`

Use shadows primarily for:
* Dropdowns
* Modals
* Drawers
* Floating elements
* Sticky cart

Do not shadow every card.

⸻

## 66. Motion

Animations should be subtle.

Default duration:
* 150–250ms

* Product image: 200ms
* Drawer: 250ms
* Modal: 200ms
* Hover: 150ms

Preferred easing:
* `ease-out`

Avoid:
* bouncy animations
* excessive parallax
* continuous floating animations

⸻

## 67. Hover Behavior

Product cards:
* Image changes

Buttons:
* Black → `#1A1A1A`

Secondary button:
* White → `#F4F4F4`

Product image:
* subtle scale: `1.02`

Keep hover effects subtle.

⸻

## 68. Accessibility

Minimum requirements:
* WCAG AA

All interactive elements:
* minimum 44px touch target

Images:
* meaningful alt text

Forms:
* visible labels

Keyboard:
* full keyboard navigation

Focus:
* visible black focus ring

Do not rely solely on color to communicate state.

⸻

## 69. Mobile Shopping Experience

Mobile is a first-class experience.

Bottom navigation may contain:
* Home
* Shop
* Wishlist
* Bag
* Account

Sticky add-to-cart:

```
------------------------------------------------
₹1,499                     [ Add to bag ]
------------------------------------------------
```

This should appear on the product page after scrolling.

⸻

## 70. Cart Drawer

Desktop cart can open as a right-side drawer.

```
YOUR BAG
Product
Product
Product
Subtotal
[ Checkout ]
[ View bag ]
```

Mobile cart should use a full-screen page.

⸻

## 71. Wishlist Drawer

Optional quick wishlist:

```
♡ SAVED ITEMS
Product
Product
Product
```

⸻

## 72. Admin Permissions

The admin system should support role-based access.

Roles:
* `SUPER_ADMIN`
* `ADMIN`
* `PRODUCT_MANAGER`
* `ORDER_MANAGER`
* `MARKETING_MANAGER`
* `SUPPORT_AGENT`

Example permissions:

* **SUPER_ADMIN**: Everything
* **PRODUCT_MANAGER**: Products, Categories, Collections, Inventory
* **ORDER_MANAGER**: Orders, Returns, Refunds
* **MARKETING_MANAGER**: Coupons, Discounts, Collections
* **SUPPORT_AGENT**: Customers, Orders, Support

⸻

## 73. Security

Admin:
* Authentication
* Authorization
* Role-based access
* Secure sessions
* Password hashing
* Rate limiting
* Audit logs

Sensitive actions should require confirmation.

Examples:
* Delete product
* Delete coupon
* Refund order
* Change admin role
* Disable customer

⸻

## 74. Audit Log

Admin actions should be tracked.

Example:

```
ADMIN ACTIVITY
Milind updated product "Oversized Tee"
2 minutes ago
Admin changed coupon "WELCOME10"
10 minutes ago
Admin refunded order #10241
25 minutes ago
```

⸻

## 75. SEO

Every product should support:
* SEO title
* SEO description
* Slug
* Canonical URL
* Open Graph image
* Product schema

Example:
* `/products/oversized-essential-tee`

⸻

## 76. Product URL Structure

Recommended:

* Products: `/products/:slug`
* Categories: `/category/:slug`
* Collections: `/collections/:slug`
* Sale: `/sale`

⸻

## 77. Recommended Page Structure

### Customer Website

```
/
├── Home
├── Shop
│   ├── Men
│   ├── Women
│   └── Sale
├── Collections
├── Product
├── Search
├── Wishlist
├── Cart
├── Checkout
├── Account
│   ├── Profile
│   ├── Orders
│   ├── Addresses
│   └── Wishlist
└── Help
```

### Admin

```
/admin
├── dashboard
├── products
├── categories
├── collections
├── inventory
├── orders
├── customers
├── reviews
├── coupons
├── discounts
├── analytics
└── settings
```

⸻

## 78. Component Naming

Recommended component structure:

```
components/
├── ui/
│   ├── Button
│   ├── Input
│   ├── Badge
│   ├── Modal
│   ├── Drawer
│   ├── Toast
│   └── Tabs
│
├── layout/
│   ├── Navbar
│   ├── Footer
│   ├── Sidebar
│   └── MobileNav
│
├── product/
│   ├── ProductCard
│   ├── ProductGrid
│   ├── ProductGallery
│   ├── ProductInfo
│   ├── SizeSelector
│   ├── ColorSelector
│   └── ProductReviews
│
├── cart/
│   ├── CartDrawer
│   ├── CartItem
│   ├── CouponInput
│   └── CartSummary
│
├── checkout/
│   ├── AddressForm
│   ├── PaymentForm
│   └── OrderSummary
│
└── admin/
    ├── AdminSidebar
    ├── StatsCard
    ├── DataTable
    ├── ProductForm
    ├── CouponForm
    └── OrderTable
```

⸻

## 79. Design Tokens Summary

```yaml
brand:
  primary: "#000000"
  background: "#FFFFFF"
typography:
  display: "Inter 700"
  body: "Inter 400"
  emphasis: "Inter 500"
radius:
  interactive: "999px"
  card: "16px"
  input: "8px"
container:
  maxWidth: "1280px"
product:
  imageRatio: "4/5"
spacing:
  base: "4px"
animation:
  duration: "150-250ms"
```

⸻

## 80. Do’s

* Use black and white as the primary visual language.
* Let product photography provide visual richness.
* Use large confident typography.
* Use pill-shaped buttons and controls.
* Keep product cards simple.
* Use generous whitespace.
* Keep the navigation minimal.
* Make the shopping flow fast.
* Make admin workflows data-dense but clean.
* Use black sections to create visual rhythm.
* Use semantic colors only for system states.
* Maintain consistent product photography.
* Make mobile shopping extremely easy.
* Keep CTA hierarchy obvious.

⸻

## 81. Don’ts

* Don’t copy Uber’s logo, brand name, proprietary assets, or exact layouts.
* Don’t use Uber-specific typography as if it belongs to this brand.
* Don’t introduce many decorative colors.
* Don’t use gradients everywhere.
* Don’t put shadows on every card.
* Don’t use huge amounts of text on product cards.
* Don’t use inconsistent product image ratios.
* Don’t create complicated checkout flows.
* Don’t overload the homepage with promotions.
* Don’t use excessive animations.
* Don’t make the admin dashboard visually identical to the customer website.
* Don’t sacrifice usability for minimalism.

⸻

## 82. Core Visual Rule

The most important rule of the system:

> **The interface should disappear behind the clothing.**

The customer should notice:
1. Product
2. Photography
3. Brand
4. Price
5. CTA

Not:
1. UI decoration
2. Animations
3. Colors
4. Components
5. Product

⸻

## 83. Final Brand Direction

The final website should feel like:

```
Modern fashion
        +
Minimal technology
        +
Editorial photography
        +
Black & white system
        +
Strong typography
        +
Pill interactions
        +
Premium e-commerce UX
```

The result should be inspired by the design principles of Uber’s web system, but distinctly branded and designed for fashion commerce.

⸻

## 84. Product Catalog Integration

The catalog photography is populated from the local fashion product dataset (`ashraq/fashion-product-images-small`):

* **Visual Anchor**: The clothing imagery extracted from the dataset acts as the primary visual hero across all cards and detail galleries.
* **Aspect Ratios**: Imported product imagery adheres strictly to the `4:5` ratio on cards and PDP galleries.
* **Customer Facing Labels**: Technical dataset attributes are presented using clean brand terminology:
  - `masterCategory` → *Category*
  - `articleType` → *Product Type*
  - `baseColour` → *Color*
* **Design Invariance**: Incorporating this dataset does not alter the core monochrome palette, typography scale, pill controls, or 16px card border radius.

⸻

## 85. Search & Chatbot Interface Design Specifications

All search interfaces, autocomplete components, conversational widgets, and administration tools must strictly follow the monochrome design system.

### Search Experience
* **Search Bar**: Minimal pill input (`border-radius: 999px`), light gray border (`#E5E5E5`), focused ring `#000000`. Clean typography with subtle placeholder `#737373`.
* **Faceted Filters**: Segmented pill selectors (`border-radius: 999px`) for Gender, Category, and Color. Active state uses solid black background (`#000000`) with white text; inactive state uses subtle gray border (`#E5E5E5`) with black text.
* **Typo Fallback Notice**: When an inquiry triggers fuzzy spelling correction, a subtle pill notification badge (`bg-neutral-100 text-neutral-800 rounded-full px-4 py-2`) informs the user of the corrected search term without obstructing results.

### Search Suggestions (Autocomplete)
* **Dropdown Card**: Floating card with `border-radius: 16px`, background `#FFFFFF`, high-elevation minimal shadow (`0 20px 25px -5px rgba(0, 0, 0, 0.1)`), and thin border (`#EEEEEE`).
* **Suggestion Row**: 44px minimum touch target, hover highlight (`#F9F9F9`), subtle search icon, and highlighted matching prefix typography.

### Search No-Result State
* **Clean Fallback**: Never display a harsh empty screen. When no exact items match, show an editorial message: *"No exact products found. Here are some curated alternatives from our active collection."* followed by the standard `ProductGrid`.

### Chatbot Floating Button
* **Placement**: Fixed bottom-right corner (`bottom: 24px`, `right: 24px`), z-index: 50.
* **Control**: 56px circle button (`border-radius: 999px`), solid black background (`#000000`), white icon (`#FFFFFF`), shadow-2xl, and smooth hover scale (`hover:scale-105 duration-200`).
* **Active Indicator**: Small emerald status dot (`#10B981`) denoting operational AI availability.

### Chatbot Panel
* **Dimensions**: Width 380px (responsive full-width on mobile `< 640px`), height 580px (or `calc(100vh - 120px)` on mobile).
* **Container**: `border-radius: 20px` (or `rounded-none` on mobile), background `#FFFFFF`, border `#E5E5E5`, shadow-2xl.
* **Header**: Solid black background (`#000000`), white typography, brand title *"Concierge"*, pill status badge *"Grounded Knowledge"*, and circular close button.

### Chat Messages
* **Customer Message**: Right-aligned, solid black background (`#000000`), white text (`#FFFFFF`), rounded bubble (`rounded-2xl rounded-br-sm`), generous padding (`px-4 py-3`), font size 13px.
* **Assistant Message**: Left-aligned, light gray background (`#F5F5F5`), black text (`#000000`), rounded bubble (`rounded-2xl rounded-bl-sm`), font size 13px with balanced line-height.
* **Product Recommendation Cards**: Horizontal scroll or compact vertical cards inside the chat bubble displaying product thumbnail (4:5 ratio), title, price, and pill *"View Product"* CTA.

### Source Citations
* **Citation Chips**: Rendered directly beneath grounded assistant messages.
* **Chip Style**: Pill shape (`border-radius: 999px`), background `#EFEFEF`, border `#E0E0E0`, text `#555555`, font size 10px uppercase tracking-wider. Displays Document Name and Page number (e.g. `RETURN-POLICY.PDF — P. 2`).

### Admin Knowledge Base Page (`/admin/knowledge-base`)
* **Header**: Clean editorial title *"Knowledge Base & Documents"*, breadcrumbs, and upload call-to-action.
* **Upload Zone**: Drag-and-drop dashed card (`border: 2px dashed #D4D4D4`, `border-radius: 16px`), background `#FAFAFA`, with clear instructions: *"PDF files up to 15MB"*.
* **Document Table**: Minimalist data table with columns: Document, File Size, Chunk Count, Status, Upload Date, Actions.
* **Status Badges**:
  - `INDEXED`: Pill badge, green tint (`bg-emerald-50 text-emerald-800 border-emerald-200`).
  - `PROCESSING`: Pill badge, amber tint (`bg-amber-50 text-amber-800 border-amber-200`) with spinning indicator.
  - `FAILED`: Pill badge, rose tint (`bg-rose-50 text-rose-800 border-rose-200`).
* **Destructive Actions**: Delete triggers confirmation modal with clear explanation that vector chunks will be permanently removed.

⸻

## 72. Customer Account & Authentication Design Patterns

The Customer Account and Authentication surfaces adhere strictly to the monochrome editorial design language.

### 1. Authentication Modal (`AuthModal`)
* **Backdrop**: `bg-black/60` with subtle backdrop blur (`backdrop-blur-xs`), smooth fade-in (`fade-in duration-200`).
* **Modal Card**: Max width 448px (`max-w-md`), `border-radius: 24px` (`rounded-3xl`), background `#FFFFFF`, border `#E5E5E5`, soft deep shadow (`shadow-2xl`).
* **Google OAuth CTA**: Full-width pill button (`border-radius: 999px`), background `#F8F8F8`, border `#E5E5E5`, active scale `0.99`, font size 12px, font weight bold. Includes the official colored Google "G" SVG icon.
* **Section Divider**: Thin horizontal rule with centered uppercase tracker: `or with email` (`#8A8A8A`, font size 10px).
* **Inputs**: Background `#F4F4F4`, `border-radius: 12px`, padding `10px 14px`, text `#000000`, placeholder `#8A8A8A`, focus ring 2px solid black.
* **Primary Submit**: Solid black pill button (`bg-black text-white hover:bg-[#222222]`), active press scale `0.99`, uppercase font with trailing subtle arrow icon.

### 2. Dedicated Auth Pages (`/login`, `/register`, `/forgot-password`, `/reset-password`)
* **Centering Layout**: Min height `80vh`, flexbox centered on clean white canvas.
* **Container**: Max width 448px, rounded 24px card with border `#E5E5E5`, brand logo mark header, and uppercase editorial headings.
* **Navigation Links**: Back to storefront pill button, toggle links between Sign In and Create Account using bold black underline hover effects.

### 3. Customer Navbar State & Dropdown
* **Guest State**: High-contrast black pill CTA *"Sign In"* and user profile trigger icon.
* **Authenticated State**: Circular user avatar button (`w-8 h-8 rounded-full bg-black text-white`) displaying user initials or uploaded avatar, adjacent to user's first name.
* **Account Dropdown**: Floating card (`rounded-2xl`, border `#E5E5E5`, shadow-xl), containing customer name, email, membership status pill, links to `/account`, `/account?tab=orders`, `/account?tab=wishlist`, `/account?tab=addresses`, `/account?tab=security`, and high-contrast red-tinted *"Sign Out"* button.
* **Logout Destination**: Always redirects to `/` (storefront), transitioning the user back to guest mode without breaking the shopping flow.

### 4. Customer Account Portal (`/account`)
* **Responsive Layout**:
  - **Desktop (≥ 768px)**: 4-column grid with a left navigation sidebar (1 col) and dynamic content panel (3 cols).
  - **Mobile (< 768px)**: Horizontal scrollable pill buttons at the top of the portal, with active state in solid black.
* **Dashboard Metric Cards**: 4-column metric grid (`border-radius: 16px`, background `#FFFFFF`, border `#E5E5E5`), displaying count, icon, and uppercase caption. Hovering applies border color transition to `#000000`.
* **Recent Activity Section**: Card containing latest order summary, status pill (`#e8f5ee` green background with `#167a45` text), carrier tracking code, and pill CTA *"Track & Details"*.

### 5. Order Tracking Timeline
* **Step Visualizer**: 5-step horizontal stepper (`CONFIRMED` → `PROCESSING` → `PACKED` → `SHIPPED` → `DELIVERED`). Completed steps display solid black circles with white checkmarks; pending steps use `#E5E5E5` circles.
* **Carrier Information**: Monospace font tracking number, courier partner details, and item thumbnails with 4:5 aspect ratio.

### 6. Empty States
* **Visual Restraint**: Centered 48px minimal icon (`#8A8A8A`), bold title (e.g. *"Your wishlist is empty"*), muted secondary explanation, and primary black CTA button (e.g. *"Explore Products"* or *"Browse New Arrivals"*). Never leave blank whitespace.
