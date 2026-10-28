# RESK Agent AI — Complete Design System & Specification
## DESIGN.md

```yaml
version: 1.0.0
product_name: RESK Agent AI
product_category: AI-Powered Commerce & Customer-Service Agent
design_direction: Minimalist, Editorial, Corporate-Automotive, Precision Commerce
color_palette:
  canvas: "#FFFFFF"
  surface_soft: "#F7F7F7"
  dark_navy: "#1A2129"
  primary_blue: "#1C69D4"
  border_hairline: "#E6E6E6"
typography_family: Inter
geometry: Precise, Rectangular (0px primary radius)
status: Active Design System Specification
```

---

# 1. OVERVIEW

## 1.1 Product Purpose

**RESK Agent AI** is an enterprise-grade, conversational commerce and customer-service intelligence platform integrated into a modern clothing e-commerce platform.

The system is engineered to interpret complex, natural-language customer requests and orchestrate authorized, deterministic actions across two primary surfaces:

1. **Customer Storefront & AI Shopping Concierge**:
   - Natural-language product discovery and semantic search.
   - Tailored product recommendations and style matching.
   - Interactive product-size assistance with Menswear, Womenswear, and Unisex measurement guidelines.
   - Dynamic cart and wishlist management.
   - Real-time authenticated order tracking with shipment milestones.
   - Self-service transactional order cancellation within policy windows.
   - Return and exchange request workflows with reason collection and label generation.
   - Customer shipping address verification.
   - Store coupon application and validation.
   - General customer support and RAG-powered policy question answering.
   - Seamless escalation to human customer support agents with conversation handoff.

2. **Administrative Operations Dashboard (`/admin/*`)**:
   - Executive operational overview and store KPI telemetry.
   - Live and historical AI conversation auditing.
   - Real-time customer support queue and escalation triage.
   - Retrieval-Augmented Generation (RAG) knowledge source management and document indexing.
   - Agent tool invocation monitoring and resolution rate analytics.
   - Product catalog, category taxonomy, and inventory stock management.
   - Comprehensive system audit logs.

## 1.2 Target Experience Attributes

* **Intelligence**: Understands nuanced customer intent and maps it to verified catalog tools and store policies without generative hallucinations.
* **Trust & Security**: Zero cross-tenant data leakage. Customers only view, track, cancel, or return their own authenticated orders.
* **Speed & Responsiveness**: Immediate conversational feedback, structured intermediate processing indicators, and sub-150ms UI transitions.
* **Reliability & Determinism**: Never simulates an action with a decorative animation; state changes reflect verified backend database commits.
* **Editorial Refinement**: Clean white canvas, soft neutral surfaces, dark navy feature bands, rectangular precision buttons, high-contrast typography, and generous editorial spacing.

---

# 2. PRODUCT IDENTITY

## 2.1 Brand Positioning

* **Product Name**: RESK Agent AI
* **Primary Brand Positioning**: *"Your intelligent commerce assistant."*
* **Core Supporting Statement**: *"From product discovery to post-purchase support, RESK makes every customer interaction simpler."*
* **Editorial Hero Headline**: *"Commerce, handled intelligently."*

## 2.2 Brand Character & Wordmark

RESK Agent AI avoids playful, cartoonish, or overly decorative visual tropes. It communicates operational discipline, architectural precision, and high-fashion curation.

### Typographic Wordmark Specification

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   R E S K                                                   │
│   AGENT AI                                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

* **Wordmark ("RESK")**:
  - Typeface: `Inter`, 700 Bold.
  - Tracking: `+0.12em` (`letter-spacing: 0.12em`).
  - Capitalization: Full uppercase.
  - Color: `#1A1A1A` on light canvas, `#FFFFFF` on dark navy feature bands.
* **Sub-mark ("AGENT AI")**:
  - Typeface: `Inter`, 500 Medium.
  - Tracking: `+0.25em`.
  - Size Ratio: `0.38x` of the primary wordmark height.
  - Color: `#6B6B6B` on light canvas, `#BBBBBB` on dark navy bands.
* **Brand Restrictions**:
  - Strictly no copied automotive badges, emblems, or proprietary automotive roundels.
  - Strictly no decorative sparkles, robot head mascots, or chat bubble icons in the primary brandmark.
  - Strictly no neon glows or chromatic aberrations.

---

# 3. DESIGN PHILOSOPHY

The visual system is governed by six foundational principles:

### Principle 1: The Interface Disappears Behind the Clothing
The apparel imagery and transaction clarity are the primary heroes. The interface frames products, clarifies decisions, and removes friction without calling attention to itself.

### Principle 2: Architectural Precision & Rectangular Discipline
Reject the generic SaaS aesthetic of oversized pill buttons, bubbly chat bubbles, and 24px rounded cards. Use 0px border radii for interactive buttons, input fields, product cards, and feature blocks. Corners are sharp, measured, and stable.

### Principle 3: Monochrome Canvas with Single Blue Precision Action
White (`#FFFFFF`) is the default page canvas. Soft gray surfaces (`#F7F7F7`, `#FAFAFA`) organize supporting content. Dark navy (`#1A2129`) provides high-emphasis editorial feature bands. Cobalt Blue (`#1C69D4`) is reserved exclusively as the primary action and active state color.

### Principle 4: High-Contrast Editorial Typography
Contrast size and weight rather than introducing competing accent colors. Pair bold 700 display headings with lightweight body copy and generous line-heights.

### Principle 5: Generous Whitespace & Asymmetric Cadence
Maintain wide breathing room around key decisions. Avoid dense, cluttered dashboards where every pixel is occupied. Use whitespace as a functional separator.

### Principle 6: Authentic Data & Explicit Verification
Never simulate actions with decorative visual tricks. Display only real product catalog data, live inventory status, authenticated customer orders, and verified policy parameters. If an order cannot be cancelled, explain exactly why (e.g., *"Order #1042 has already departed the fulfillment facility"*).

---

# 4. COLOR TOKENS

The color palette is strictly tokenized using CSS Custom Properties. Components must reference these semantic tokens rather than raw hex values.

## 4.1 Palette Matrix

| Token Name | Hex Value | Semantic Usage |
|---|---|---|
| `--color-primary` | `#1C69D4` | Primary action button, active navigation indicator, key interactive focus |
| `--color-primary-active` | `#0653B6` | Pressed/active state for primary actions |
| `--color-primary-soft` | `#EAF2FF` | Subtle selection background, active filter pill tint, selected size highlight |
| `--color-primary-disabled`| `#D6D6D6` | Disabled button background, non-interactive button states |
| `--color-ink-strong` | `#1A1A1A` | Hero headlines, product titles, table headers, critical alerts |
| `--color-ink-main` | `#262626` | Standard body headings, primary labels, table data |
| `--color-ink-body` | `#3C3C3C` | Editorial copy, customer chat text, product descriptions |
| `--color-ink-muted` | `#6B6B6B` | Secondary metadata, timestamps, input placeholders, category tags |
| `--color-ink-soft` | `#9A9A9A` | Subtle dividers, breadcrumb separators, inactive icons |
| `--color-canvas` | `#FFFFFF` | Main page canvas, product modal surfaces, input backgrounds |
| `--color-surface-soft` | `#F7F7F7` | Supporting section backgrounds, chat message assistant bubbles |
| `--color-surface-card` | `#FAFAFA` | Unselected product cards, secondary container surfaces |
| `--color-surface-strong`| `#EBEBEB` | Table header rows, pressed card states, hovered list items |
| `--color-dark-navy` | `#1A2129` | Dark feature bands, hero accent blocks, admin sidebar canvas |
| `--color-dark-elevated`| `#262E38` | Hovered dark buttons, elevated panels on dark navy bands |
| `--color-border-hairline`| `#E6E6E6` | Standard 1px divider lines, card perimeters, input borders |
| `--color-border-strong` | `#CCCCCC` | Focused/hovered input borders, active table column dividers |
| `--color-on-primary` | `#FFFFFF` | Text rendered on top of primary blue buttons |
| `--color-on-dark` | `#FFFFFF` | Text rendered on top of dark navy feature bands |
| `--color-on-dark-muted`| `#BBBBBB` | Secondary copy rendered on dark navy surfaces |
| `--color-success` | `#22C55E` | Order delivered badge, return processed, coupon valid |
| `--color-warning` | `#F59E0B` | Low stock alert, return window closing soon, pending approval |
| `--color-error` | `#DC2626` | Cancelled order badge, card processing failure, policy violation |

## 4.2 Color Contrast & Accessibility Standards

* **Text on Canvas (`#FFFFFF`)**:
  - `#1A1A1A` on `#FFFFFF`: **16.6:1** (Exceeds WCAG AAA)
  - `#262626` on `#FFFFFF`: **13.5:1** (Exceeds WCAG AAA)
  - `#3C3C3C` on `#FFFFFF`: **9.6:1** (Exceeds WCAG AAA)
  - `#6B6B6B` on `#FFFFFF`: **4.8:1** (Exceeds WCAG AA for normal text)
* **Primary Blue (`#1C69D4`)**:
  - Text on `#1C69D4` (`#FFFFFF`): **4.6:1** (Exceeds WCAG AA)
* **Status Badges**:
  - Never communicate status through color alone. Every badge pairs color with an explicit semantic icon and text label (e.g., `✓ DELIVERED`, `✕ CANCELLED`).

---

# 5. TYPOGRAPHY SYSTEM

## 5.1 Primary Font Family

The primary typeface is **Inter**, selected for its neutral geometric legibility, variable weight support, and accessibility across high-density data tables and editorial headlines.

```css
font-family: "Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
```

## 5.2 Type Scale Hierarchy

| Token Name | Font Size | Line Height | Weight | Letter Spacing | Target Usage |
|---|---|---|---|---|---|
| `display-xl` | 64px (`4.0rem`) | 1.05 | 700 (`Bold`) | `-0.03em` | Primary editorial hero headline |
| `display-lg` | 48px (`3.0rem`) | 1.10 | 700 (`Bold`) | `-0.025em`| Major landing section headings |
| `display-md` | 32px (`2.0rem`) | 1.15 | 700 (`Bold`) | `-0.02em` | Product title on details page |
| `display-sm` | 24px (`1.5rem`) | 1.25 | 700 (`Bold`) | `-0.015em`| Category headings, chat section headers |
| `title-lg` | 20px (`1.25rem`)| 1.30 | 700 (`Bold`) | `-0.01em` | Modal titles, cart drawer header |
| `title-md` | 18px (`1.125rem`)| 1.40 | 700 (`Bold`) | `0.00em` | Product card titles, order card headers|
| `title-sm` | 16px (`1.0rem`) | 1.40 | 700 (`Bold`) | `0.00em` | Table column headers, field labels |
| `body-lg` | 18px (`1.125rem`)| 1.60 | 400 (`Regular`)| `0.00em` | Editorial lead paragraphs, hero descriptions|
| `body-md` | 16px (`1.0rem`) | 1.55 | 400 (`Regular`)| `0.00em` | Standard interface copy, chat messages |
| `body-sm` | 14px (`0.875rem`)| 1.55 | 400 (`Regular`)| `0.00em` | Secondary table data, assistant rationale |
| `caption` | 12px (`0.75rem`)| 1.40 | 400 (`Regular`)| `+0.02em` | Timestamps, micro-badges, SKU numbers |
| `button` | 14px (`0.875rem`)| 1.00 | 700 (`Bold`) | `+0.04em` | Interactive buttons (All Caps or Title) |
| `nav-link` | 14px (`0.875rem`)| 1.40 | 400 (`Regular`)| `+0.02em` | Top navigation items, footer links |

## 5.3 Typography Rules

1. **Sentence Case Default**: Use sentence case for all headings, subheadings, and chat messages. Avoid uppercase headings except for intentional small category tags (e.g., `MENSWEAR / OUTERWEAR`).
2. **Tabular Numerals**: Apply `font-variant-numeric: tabular-nums` to prices, order dates, SKU codes, and quantities to ensure stable vertical alignment in tables and order cards.
3. **No Artificial Light Weights**: Avoid `font-weight: 300` unless confirmed loaded via `@font-face` with full rendering support. Use `font-weight: 400` as the robust base.

---

# 6. SHAPES AND CORNERS

The design system enforces an uncompromising rectangular aesthetic that communicates architectural confidence.

## 6.1 Radius Token Scale

```css
--radius-none: 0px;
--radius-xs:   2px;
--radius-sm:   4px;
--radius-md:   8px;
--radius-lg:   12px;
--radius-full: 9999px;
```

## 6.2 Component Geometry Assignment

* **Primary & Secondary Buttons**: `0px` (Strictly sharp rectangular).
* **Text Inputs & Textareas**: `0px` (Crisp rectangular fields).
* **Product Showcase Cards**: `0px` (Clean editorial framing).
* **Feature Cards**: `0px` (Flat architectural containers).
* **Filter Controls & Facet Chips**: `0px` (Rectangular toggles).
* **Data Tables & Cell Dividers**: `0px` (Square grid lines).
* **Circular Controls (Avatar, Close Button)**: `9999px` (Only for functional icons).
* **Modal Dialogs & Floating Drawers**: `0px` or `4px` maximum to preserve the architectural language.

---

# 7. SPACING AND LAYOUT SYSTEM

## 7.1 Spacing Scale (8px Base Unit)

| Token Name | Value | Recommended Application |
|---|---|---|
| `--space-1` | 4px | Micro-spacing between icon and text, status badge padding |
| `--space-2` | 8px | Gap between related chips, tight form field margins |
| `--space-3` | 12px | Compact cell padding, chat message vertical gap |
| `--space-4` | 16px | Standard card interior padding, mobile page margins |
| `--space-6` | 24px | Grid gutters, desktop card padding, drawer spacing |
| `--space-8` | 32px | Section gap in chat widget, header horizontal padding |
| `--space-12` | 48px | Desktop page container padding, major component gaps |
| `--space-16` | 64px | Editorial section breaks on desktop |
| `--space-20` | 80px | Major landing section vertical spacing |

## 7.2 Container Boundaries

* **Maximum Screen Width (`--container-max`)**: `1440px` (Centers on ultra-wide viewports).
* **Editorial Content Width (`--container-editorial`)**: `1200px` (Balanced catalog & landing layouts).
* **Reading Width (`--container-reading`)**: `760px` (Customer policy documents, blog articles).

---

# 8. RESPONSIVE BREAKPOINTS

Layouts adapt fluidly across six standard viewport tiers:

```
[ Mobile XS ]  320px  - 374px
[ Mobile SM ]  375px  - 479px
[ Mobile LG ]  480px  - 767px
[ Tablet    ]  768px  - 1023px
[ Desktop   ]  1024px - 1439px
[ Wide      ]  1440px and above
```

### Responsive Layout Adaptations

1. **Mobile (< 768px)**:
   - Page horizontal padding: `16px`.
   - Editorial hero headings scale from `64px` down to `36px`.
   - Product grids collapse from 4 columns to 1 or 2 columns (`minmax(160px, 1fr)`).
   - Horizontal navigation collapses into an accessible slide-over drawer.
   - Tables convert to vertically stacked card items.
   - AI Chat Widget docks to full-screen viewport height with persistent bottom composer.
2. **Tablet (768px - 1023px)**:
   - Page horizontal padding: `24px`.
   - Two-column product and feature grids.
   - Admin sidebar collapses to icon-only rail (72px width).
3. **Desktop (1024px - 1439px)**:
   - Page horizontal padding: `32px` to `48px`.
   - Multi-column product layouts (3 or 4 columns).
   - Full expanded admin sidebar (260px width).
4. **Wide (1440px+)**:
   - Content centered with auto-margins; max-width capped at `1440px`.

---

# 9. SURFACES AND ELEVATION

The system rejects artificial skeuomorphism, intense drop-shadows, and blurry glassmorphism. Visual depth is established purely through surface value contrast and hairline dividers.

## 9.1 Surface Levels

```
Level 0: Canvas Background      --> #FFFFFF
Level 1: Soft Supporting Surface--> #F7F7F7
Level 2: Active Card Surface    --> #FAFAFA (bordered by #E6E6E6)
Level 3: Emphasized Row / Focus --> #EBEBEB
Level 4: Dark Navy Accent Band  --> #1A2129
Level 5: Modal / Floating Surface--> #FFFFFF (bordered by #CCCCCC, subtle flat shadow)
```

## 9.2 Elevation Shadow Rules

* **Default Cards & Panels**: `box-shadow: none; border: 1px solid var(--color-border-hairline);`
* **Floating Chat Widget**: `box-shadow: 0 12px 32px rgba(0, 0, 0, 0.08); border: 1px solid var(--color-border-strong);`
* **Dropdown Menus & Autocomplete**: `box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06); border: 1px solid var(--color-border-hairline);`

---

# 10. NAVIGATION SYSTEM

## 10.1 Public Storefront Navigation

The storefront header sits persistently at the top with a pristine white background and hairline bottom border.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│  RESK AGENT AI      SHOP   COLLECTIONS   ABOUT   SUPPORT        [SEARCH]  [CART 2] [ACCOUNT]│
└────────────────────────────────────────────────────────────────────────────────────────┘
```

* **Height**: `72px` desktop, `60px` mobile.
* **Background**: `#FFFFFF`.
* **Border**: `1px solid var(--color-border-hairline)`.
* **Left**: Original RESK wordmark.
* **Center**: Clean navigation links (`/shop`, `/collections`, `/about`, `/support`).
  - Active state: `#1C69D4` text color with a 2px blue underline indicator.
  - Hover state: `#1A1A1A` text color with 150ms transition.
* **Right Actions**:
  - Search trigger icon/input.
  - Wishlist count badge.
  - Cart drawer trigger button with item count.
  - User authentication status indicator (`Login` or `My Account`).

## 10.2 Mobile Navigation Drawer

* Triggered via sharp hamburger button (`44x44px` touch area).
* Full-height slide-over drawer from left (`width: 320px`, max `85vw`).
* Clean vertical stack of primary routes with `16px` font size and hairline dividers.

## 10.3 Administrative Interface Navigation

The admin interface (`/admin/*`) features a high-density, professional left sidebar.

* **Width**: `260px` fixed desktop, collapsible to `72px` icon rail.
* **Background**: `#FFFFFF` with `#E6E6E6` right border.
* **Navigation Sections**:
  1. **Core Commerce**:
     - `Dashboard` (`/admin`)
     - `Products` (`/admin/products`)
     - `Categories` (`/admin/categories`)
     - `Inventory` (`/admin/inventory`)
     - `Orders` (`/admin/orders`)
     - `Customers` (`/admin/customers`)
     - `Coupons & Offers` (`/admin/coupons`)
  2. **AI Agent Intelligence Operations**:
     - `AI Conversations` (`/admin/ai-conversations`)
     - `Knowledge Sources` (`/admin/knowledge`)
     - `Unanswered & Escalated` (`/admin/ai-unanswered`)
     - `Agent Analytics` (`/admin/ai-analytics`)
  3. **Governance**:
     - `Analytics` (`/admin/analytics`)
     - `Audit Logs` (`/admin/audit`)

---

# 11. HOMEPAGE AND MARKETING PAGES

The landing experience merges editorial fashion prestige with operational AI capabilities.

## 11.1 Section Breakdown

```
[ Section A: Top Navigation ]
[ Section B: Editorial Hero: Headline + Live Assistant Preview ]
[ Section C: Core Capability Matrix (4 Pillars) ]
[ Section D: How It Works: The 6-Step Verification Pipeline ]
[ Section E: Interactive Product & Order Showcase ]
[ Section F: Trust, Privacy & Data Isolation Architecture ]
[ Section G: Dark Navy Final Call-to-Action ]
[ Section H: Structured Institutional Footer ]
```

### Section B: Editorial Hero Composition
* **Composition**: Asymmetric two-column desktop grid.
* **Left Column**:
  - Over-title badge: `AI-POWERED COMMERCE & CUSTOMER CONCIERGE` (11px, bold, tracking +0.15em).
  - Main Headline (`display-xl`): *"Commerce, handled intelligently."*
  - Supporting paragraph (`body-lg`): *"Discover products, verify sizing, track orders, and execute return authorizations through one intelligent conversational assistant."*
  - Action Group:
    - Primary Button: `Explore the Assistant` (Rectangular, `#1C69D4`, white text, 48px height).
    - Secondary Button: `See How It Works` (Rectangular, `#FFFFFF`, 1px `#E6E6E6` border, `#1A1A1A` text).
* **Right Column**:
  - Authentic UI showcase card displaying a live conversational snippet:
    - Customer prompt: *"Where is my order #1042?"*
    - Assistant response: *"Your order containing the Merino Wool Trench Coat departed Frankfurt at 08:30 today."*
    - Embedded interactive tracking timeline card.

### Section C: 4-Pillar Capability Matrix
1. **Intelligent Discovery**: Semantic fashion search, style matching, and contextual recommendations.
2. **Precise Sizing Concierge**: Interactive visual size calculator with measurements across Menswear and Womenswear.
3. **Frictionless Post-Purchase**: One-click order tracking, transactional cancellation, and self-service return workflows.
4. **Policy-Grounded Support**: Retrieval-Augmented Generation (RAG) providing verifiable answers to shipping and warranty policies.

### Section D: The 6-Step Verification Pipeline
Visual sequence demonstrating that the agent is deterministic and governed by policy:
```
Customer Intent -> Intent Parsing -> Catalog/Order RAG -> Policy Validation -> Authorized Action -> Audit Response
```

### Section G: Dark Navy Feature Band
* Background: `#1A2129`.
* Headline: Display LG, White (`#FFFFFF`).
* Copy: `#BBBBBB`.
* Primary Button: `#1C69D4`, Rectangular.

---

# 12. AI SHOPPING ASSISTANT (CORE UI)

The AI assistant is rendered via the persistent floating component `AIChatWidget`.

```
┌────────────────────────────────────────────────────────┐
│  RESK AGENT AI                       [—] [EXPAND] [✕] │
├────────────────────────────────────────────────────────┤
│  RESK                                        14:20    │
│  Welcome back, Marcus. How can I assist you with your   │
│  wardrobe or orders today?                             │
│                                                        │
│  [Suggested Prompts]                                   │
│  [Track my recent order]  [Find Merino wool knitwear]  │
│                                                        │
│  Marcus                                      14:21    │
│  Track order #1048                                     │
│                                                        │
│  RESK                                        14:21    │
│  ┌──────────────────────────────────────────────────┐  │
│  │ ORDER #1048 · IN TRANSIT                         │  │
│  │ Estimated Delivery: Oct 14, 2026                 │  │
│  │ 1x Technical Parka (Size L) · $380.00            │  │
│  │ Carrier: DHL Express (Tracking: #984210982)      │  │
│  │                                                  │  │
│  │ [ Track Package ]  [ Cancel Order ]              │  │
│  └──────────────────────────────────────────────────┘  │
├────────────────────────────────────────────────────────┤
│  [ Ask RESK anything about products, sizing, orders... ] [SEND]│
└────────────────────────────────────────────────────────┘
```

## 12.1 Widget Dimensions & Placement

* **Closed State**: Sharp rectangular launcher button anchored `24px` from bottom-right.
  - Size: `48px` height, `auto` width with label `"Ask RESK"`, or `48x48px` with branded icon.
  - Background: `#1A2129` or `#1C69D4`.
* **Open Floating State**:
  - Width: `420px`.
  - Height: `640px` (or `calc(100vh - 120px)` on smaller desktop).
  - Radius: `0px` sharp corners.
  - Border: `1px solid var(--color-border-strong)`.
  - Box Shadow: `0 12px 32px rgba(0, 0, 0, 0.08)`.
* **Full Expanded / Mobile State**:
  - Mobile (<768px): Docks to `100vw` width and `100vh` height. Zero border radius.

## 12.2 Conversation Elements

* **Assistant Message**:
  - Background: `#F7F7F7`.
  - Text: `#262626`.
  - Padding: `14px 18px`.
  - Corners: Rectangular (`0px`).
* **User Message**:
  - Background: `#1A2129` (Dark Navy).
  - Text: `#FFFFFF`.
  - Padding: `14px 18px`.
  - Corners: Rectangular (`0px`).
  - Alignment: Right-aligned.
* **Streaming & Loading State**:
  - Subtle pulsing indicator: 3 inline square dots (`6x6px`, `#1C69D4`) pulsing in sequence.
  - Explicit action label: *"Checking order eligibility with store backend..."*

---

# 13. PRODUCT DISCOVERY COMPONENTS

When the customer searches or asks for product suggestions, the assistant renders structured `PRODUCT` cards directly within the message feed.

```
┌─────────────────────────────────────────────────────┐
│  ┌─────────────────────────┐                        │
│  │                         │  CASHMERE CREWNECK     │
│  │  [ PRODUCT IMAGE ]      │  $290.00               │
│  │                         │  Color: Charcoal       │
│  │                         │  Sizes: S · M · L · XL │
│  └─────────────────────────┘                        │
│  [ Select Size ]  [ Add to Cart ]  [ View Details ] │
└─────────────────────────────────────────────────────┘
```

## 13.1 Product Card Token Rules

* **Background**: `#FFFFFF`.
* **Border**: `1px solid var(--color-border-hairline)`.
* **Padding**: `16px`.
* **Corner Radius**: `0px`.
* **Image Aspect Ratio**: `3:4` portrait (fashion editorial standard).
* **Price Format**: Tabular numbers, bold (`16px`, `#1A1A1A`).
* **Stock Notice**: If low stock, display warning chip: `ONLY 2 REMAINING IN SIZE M` (11px, bold, `#F59E0B`).

## 13.2 Interactive Size Guide Component

Rendered via `SizeGuideVisual`:
* Supports Menswear, Womenswear, and Unisex categories.
* Interactive measurement inputs (Chest, Waist, Hips in cm or inches).
* Deterministic size recommendation chip (e.g., `RECOMMENDED SIZE: M (FIT PROBABILITY 92%)`).

---

# 14. ORDER AND RETURN WORKFLOWS

## 14.1 Order Tracking Card (`ORDER_STATUS`)

* **Header**: Order reference (`#1048`), Order Date (`Oct 10, 2026`), Status Badge.
* **Items Breakdown**: Thumbnail (`48x48px`), Title, Selected Variant/Size, Unit Price.
* **Timeline Tracker**:
  - Four discrete state checkpoints: `CONFIRMED` → `PROCESSING` → `IN TRANSIT` → `DELIVERED`.
  - Active nodes highlighted in `#1C69D4`; completed in `#1A1A1A`; pending in `#E6E6E6`.
* **Available Actions**: Dynamically populated based on `/my/orders/{id}/actions`.

## 14.2 Order Cancellation Workflow

* **Eligibility Gate**: Allowed only when `order.status === 'PENDING'` or `'PROCESSING'` and within the cancellation grace window.
* **Confirmation Step**: Mandatory confirmation dialog explaining refund timeline.
* **Execution**: Idempotent POST to `/my/orders/{id}/cancel` with explicit reason payload.
* **Success Presentation**: In-chat updated card showing status `CANCELLED` and refund confirmation receipt.

## 14.3 Self-Service Return Workflow

* **14-Day Window Validation**: System checks order delivery timestamp against the store policy deadline.
* **Item Selection**: Checkboxes to select individual items and quantities for return.
* **Standard Return Reasons**:
  1. Product damaged
  2. Wrong product received
  3. Size/fit issue
  4. Product not as expected
  5. Changed my mind
  6. Other (with optional description)
* **Pre-paid Label Generation**: In-chat display of downloadable return label and QR code.

---

# 15. ADMINISTRATIVE DASHBOARD

The administrative dashboard (`/admin/*`) provides oversight across customer interactions and store health.

## 15.1 Core Modules

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ [ METRIC: TOTAL REVENUE ]  [ METRIC: ORDERS ]  [ AI RESOLUTION ]  [ ESCALATIONS]│
│  $124,500.00                1,420               89.4%              14 Pending   │
├─────────────────────────────────────────────────────────────────────────────────┤
│ ACTIVE CONVERSATIONS                     │ KNOWLEDGE SOURCE STATUS              │
│ #C-8924 · Customer: Marcus V. · In Prog  │ Store Return Policy v2.4 (Active)    │
│ #C-8923 · Customer: Elena R. · Resolved  │ Autumn 2026 Size Chart (Active)      │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Metrics Cards
* Minimal white background (`#FFFFFF`), `1px solid var(--color-border-hairline)`.
* Zero drop-shadow.
* Large metric value: `28px` bold tabular nums.
* Trend indicator: `+12.4% vs last week` (with directional text, not color alone).

### AI Conversation Inspection Table
* Columns: `Session ID`, `Customer`, `Intent / Topic`, `Tool Invocations`, `Status`, `Duration`, `Actions`.
* Deep inspection drawer: Displays complete raw turn-by-turn prompt-response log with tool call payloads.

---

# 16. BUTTON SYSTEM

Buttons follow strict rectangular rules (`border-radius: 0px`).

## 16.1 Button Matrix

```
┌──────────────────────────────────────────────┐
│  PRIMARY BUTTON          [ SUBMIT ORDER ]    │
│  SECONDARY BUTTON        [ CANCEL ]          │
│  DARK-BAND SECONDARY     [ LEARN MORE ]      │
│  TEXT ACTION             View Details →      │
│  DISABLED BUTTON         [ UNAVAILABLE ]     │
└──────────────────────────────────────────────┘
```

### Specifications

1. **Primary Button (`btn-primary`)**:
   - Background: `#1C69D4`
   - Text: `#FFFFFF`, `14px`, `700 Bold`, `letter-spacing: +0.04em`
   - Radius: `0px`
   - Height: `48px` (desktop), `44px` (minimum touch target)
   - Padding: `0 28px`
   - Hover: `#0653B6`
   - Focus: `2px solid #0653B6`, offset `2px`
2. **Secondary Button (`btn-secondary`)**:
   - Background: `#FFFFFF`
   - Border: `1px solid var(--color-border-hairline)`
   - Text: `#1A1A1A`, `14px`, `700 Bold`
   - Radius: `0px`
   - Hover: `#F7F7F7`, border `#CCCCCC`
3. **Dark-Band Secondary Button (`btn-dark-secondary`)**:
   - Background: `transparent`
   - Border: `1px solid #FFFFFF`
   - Text: `#FFFFFF`, `14px`, `700 Bold`
   - Hover: `#FFFFFF`, text `#1A2129`
4. **Disabled Button (`btn-disabled`)**:
   - Background: `#D6D6D6`
   - Text: `#9A9A9A`
   - Cursor: `not-allowed`

---

# 17. FORMS AND INPUTS

Inputs prioritize legibility and strict visual containment.

## 17.1 Input Rules

* **Background**: `#FFFFFF`.
* **Border**: `1px solid var(--color-border-hairline)`.
* **Corner Radius**: `0px`.
* **Height**: `48px` standard.
* **Padding**: `12px 16px`.
* **Text**: `16px` font size (strictly prevents auto-zoom on iOS Safari).
* **Focus State**: `1px solid var(--color-primary)`, subtle `0 0 0 1px var(--color-primary)` ring.
* **Error State**: `1px solid var(--color-error)` accompanied by a 12px error message below the field.

---

# 18. TABLES, STATUS LABELS AND NOTIFICATIONS

## 18.1 Data Tables

* Header Row: Background `#F7F7F7`, font size `12px`, uppercase, bold, text `#1A1A1A`.
* Body Row: Background `#FFFFFF`, border-bottom `1px solid var(--color-border-hairline)`.
* Hover State: Background `#FAFAFA`.
* Alignment: Text left-aligned; currency and quantities right-aligned with `tabular-nums`.

## 18.2 Semantic Status Labels

All labels use uppercase text and explicit symbols:

| Status | Background | Border | Text | Symbol & Label |
|---|---|---|---|---|
| `DELIVERED` | `#EAF2FF` | `#1C69D4` | `#0653B6` | `✓ DELIVERED` |
| `IN TRANSIT`| `#F7F7F7` | `#CCCCCC` | `#1A1A1A` | `→ IN TRANSIT` |
| `PENDING` | `#FEF3C7` | `#F59E0B` | `#B45309` | `⏳ PENDING` |
| `CANCELLED` | `#FEE2E2` | `#DC2626` | `#B91C1C` | `✕ CANCELLED` |
| `RETURNED` | `#F3F4F6` | `#9CA3AF` | `#4B5563` | `↩ RETURNED` |
| `ESCALATED` | `#FEF2F2` | `#EF4444` | `#991B1B` | `⚠ ESCALATED` |

---

# 19. DIALOGS, NOTIFICATIONS AND LOADING STATES

## 19.1 Confirmation Modals

* Centered fixed overlay: Background `rgba(0, 0, 0, 0.45)`.
* Modal surface: `#FFFFFF`, `1px solid var(--color-border-strong)`, sharp `0px` radius.
* Max-width: `520px`.
* Mandatory explicit action buttons: `Confirm Cancellation` (Red `#DC2626` or Blue `#1C69D4`) and `Cancel / Dismiss` (`#FFFFFF`).

## 19.2 Toast Notifications

* Fixed anchor: Top center of viewport (`top: 24px`, `z-index: 100`).
* Background: `#1A1A1A` (Dark).
* Text: `#FFFFFF`, font size `13px`, medium weight.
* Border: `1px solid #333333`.
* Icon: Emerald check `✓` or red warning `✕`.
* Auto-dismiss: `4000ms`.

---

# 20. ICONS AND IMAGERY

## 20.1 Iconography Rules

* Primary library: **Lucide React**.
* Stroke width: Consistent `1.75px` across all UI controls.
* Size tokens:
  - Micro: `14x14px` (badges, status chips).
  - Standard: `18x18px` (buttons, table actions).
  - Prominent: `24x24px` (category cards, modal headers).
* Icon Color: Inherits text color (`currentColor`).

## 20.2 Product Photography Guidelines

* Clean neutral studio backgrounds (`#F4F4F4` or `#FFFFFF`).
* Consistent aspect ratios (`3:4` vertical for catalog, `1:1` square for checkout thumbnails).
* High-density Retina optimization (`srcset` with 1x, 2x variants).

---

# 21. MOTION AND INTERACTION

## 21.1 Transitions

Motion is understated, functional, and fast.

* Fast interactions (button hover, chip toggle): `150ms ease-out`.
* Component reveals (chat drawer slide, modal fade): `200ms cubic-bezier(0.16, 1, 0.3, 1)`.
* Strictly no bouncy springs or decorative parallax.
* Respect `prefers-reduced-motion: reduce`: All transition durations collapse to `0ms`.

---

# 22. ACCESSIBILITY (WCAG 2.2 AA)

1. **Keyboard Operability**:
   - All interactive controls are navigable via `Tab` / `Shift+Tab`.
   - Modals trap focus; `Escape` key dismisses floating panels and drawers.
   - Visible focus indicators: `2px solid var(--color-primary)` with `2px` offset.
2. **Screen Reader Optimization**:
   - Dynamic message updates in `AIChatWidget` announce via `aria-live="polite"`.
   - Product thumbnails contain descriptive `alt` tags (e.g., *"Merino Wool Crewneck Sweater in Charcoal, Front View"*).
3. **Touch Target Sizing**:
   - All mobile buttons, links, and drawer triggers satisfy minimum `44x44px` physical tap bounds.

---

# 23. RESPONSIVE BEHAVIOR MATRIX

| Viewport Tier | Width | Navigation | Product Grid | Chat Assistant | Admin Layout |
|---|---|---|---|---|---|
| **Mobile XS/SM**| 320px - 479px | Hamburger Drawer | 1 Column | Fullscreen Docked | Stacked Cards |
| **Mobile LG** | 480px - 767px | Hamburger Drawer | 2 Columns | Fullscreen Docked | Stacked Cards |
| **Tablet** | 768px - 1023px| Compact Horizontal| 2-3 Columns | Floating (380px) | Collapsed Rail (72px)|
| **Desktop** | 1024px - 1439px| Full Horizontal | 3-4 Columns | Floating (420px) | Expanded (260px) |
| **Wide** | 1440px+ | Full Horizontal | 4 Columns (Max) | Floating (420px) | Expanded (260px) |

---

# 24. CSS VARIABLES AND IMPLEMENTATION GUIDELINES

Add the complete design token specification to the root stylesheet (`src/index.css` or `src/App.css`):

```css
:root {
  /* Brand Action Colors */
  --color-primary: #1C69D4;
  --color-primary-active: #0653B6;
  --color-primary-soft: #EAF2FF;
  --color-primary-disabled: #D6D6D6;

  /* Typography Colors */
  --color-ink-strong: #1A1A1A;
  --color-ink-main: #262626;
  --color-ink-body: #3C3C3C;
  --color-ink-muted: #6B6B6B;
  --color-ink-soft: #9A9A9A;

  /* Surfaces & Canvas */
  --color-canvas: #FFFFFF;
  --color-surface-soft: #F7F7F7;
  --color-surface-card: #FAFAFA;
  --color-surface-strong: #EBEBEB;

  /* Dark Navy Accent Bands */
  --color-dark-navy: #1A2129;
  --color-dark-elevated: #262E38;

  /* Borders & Dividers */
  --color-border-hairline: #E6E6E6;
  --color-border-strong: #CCCCCC;

  /* Contrast Overlays */
  --color-on-primary: #FFFFFF;
  --color-on-dark: #FFFFFF;
  --color-on-dark-muted: #BBBBBB;

  /* Semantic Alerts */
  --color-success: #22C55E;
  --color-warning: #F59E0B;
  --color-error: #DC2626;

  /* Geometry / Border Radii */
  --radius-none: 0px;
  --radius-xs: 2px;
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-full: 9999px;

  /* 8px Spacing Tokens */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;
  --space-12: 48px;
  --space-16: 64px;
  --space-20: 80px;

  /* Containers */
  --container-max: 1440px;
  --container-editorial: 1200px;
  --container-reading: 760px;

  /* Transitions */
  --transition-fast: 150ms ease-out;
  --transition-normal: 220ms cubic-bezier(0.16, 1, 0.3, 1);
}
```

---

# 25. COMPONENT SPECIFICATIONS

### 1. `Button`
* **Props**: `variant` (`'primary' | 'secondary' | 'dark-secondary' | 'text'`), `size` (`'sm' | 'md' | 'lg'`), `loading`, `disabled`.
* **Geometry**: Sharp rectangular (`0px` radius).

### 2. `AIChatWidget`
* **Sub-components**: `MessageList`, `UserMessage`, `AssistantMessage`, `ProductCardSnippet`, `OrderStatusCard`, `SizeGuideVisual`, `MessageComposer`.
* **Docking Logic**: Floating window on desktop, bottom sheet / fullscreen on mobile.

### 3. `ProductCard`
* **Displays**: Aspect ratio 3:4 image, title, price, available size chips, quick add-to-cart action.

### 4. `OrderStatusCard`
* **Displays**: Order ID, date, thumbnail item preview, 4-stage tracking timeline, dynamic actions (`Cancel`, `Return`, `Track`).

### 5. `AdminDashboardCard`
* **Displays**: Metric title, primary value in tabular numbers, delta comparison indicator, clean hairline perimeter.

---

# 26. DO'S AND DON'TS

### DO:
* **DO** use pure `#FFFFFF` as the primary background across pages and dialogs.
* **DO** use sharp rectangular (`0px`) corners for buttons, inputs, and cards.
* **DO** use `#1C69D4` exclusively for primary action triggers and focus states.
* **DO** use dark navy bands (`#1A2129`) for selective high-impact editorial moments.
* **DO** validate return and cancellation eligibility using real backend rules before displaying actions.
* **DO** format all currency and numeric identifiers with `tabular-nums`.

### DO NOT:
* **DO NOT** use rounded pill buttons for primary actions.
* **DO NOT** copy BMW roundels, emblems, automotive graphics, or licensed typography.
* **DO NOT** apply neon gradients, glossy glassmorphism, or heavy drop-shadows.
* **DO NOT** invent mock orders or expose another customer's order history.
* **DO NOT** communicate order status through color alone without explicit text labels.
* **DO NOT** stretch text or cards across the full screen on 1920px viewports without max-width constraints.

---

# 27. KNOWN GAPS AND ASSUMPTIONS

1. **Authentication Token Persistence**: Assumes JWT authentication tokens are stored in `localStorage` under `token` or retrieved via `authApi.ts`.
2. **Spring Boot Backend Availability**: Assumes store endpoints (`/api/my/orders/*`, `/api/products/*`) conform to standard REST envelopes (`{ success: true, data: ... }`).
3. **FastAPI Agent Microservice URL**: Assumes the Python AI Agent is accessible at `http://localhost:8001` or defined via `VITE_AGENT_URL`.
4. **Exchange Flow Scope**: The backend currently supports direct cancellations and returns; exchanges are handled via store credit re-issuance rather than automated multi-item variant swaps.

---

# 28. IMPLEMENTATION CHECKLIST FOR AGENTS

When implementing or updating UI components against this specification:
- [ ] Confirm file references tokens from `var(--color-*)` instead of hardcoded hex values.
- [ ] Verify button corners are sharp (`rounded-none` or `0px`).
- [ ] Ensure inputs have minimum `16px` font size for mobile responsiveness.
- [ ] Ensure all status indicators pair colors with text labels and icons.
- [ ] Verify chat components preserve strict JWT customer isolation.
- [ ] Test layout across 375px, 768px, 1024px, and 1440px viewport widths.
