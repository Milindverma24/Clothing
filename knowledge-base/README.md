# Premium Clothing E-Commerce Knowledge Base (RAG System)

This repository contains the authoritative, production-grade knowledge base for the AI/RAG customer assistance chatbot of our premium clothing e-commerce platform.

The knowledge base is structured as a collection of 17 modular, high-signal PDF documents optimized for semantic embedding, vector indexing, and precise chunk retrieval, paired with real-time PostgreSQL database integrations.

---

## 1. Document Catalog & Directory Structure

```
knowledge-base/
├── 01-store-overview.pdf               # Store profile, philosophy, categories, channels & contact
├── 02-shopping-guide.pdf               # End-to-end shopping workflow: search to dispatch
├── 03-product-information.pdf          # Catalog taxonomy, attributes, materials & live data boundary
├── 04-size-guide.pdf                   # Precision sizing matrix, fit profiles & body measurement guides
├── 05-shipping-delivery.pdf            # SLA tiers, couriers, tracking, exceptions & customs
├── 06-returns-refunds-exchanges.pdf    # Eligibility criteria, return windows, reverse logistics & refunds
├── 07-orders.pdf                       # Order lifecycle, modifications, cancellations & invoices
├── 08-payments.pdf                     # Payment gateways, security protocols & settlement reconciliations
├── 09-coupons-discounts.pdf            # Coupon mechanics, stacking rules & validation boundaries
├── 10-account-security.pdf             # Authentication, password resets, data privacy & sessions
├── 11-product-care.pdf                 # Fabric-specific maintenance, wash guides & garment longevity
├── 12-faq.pdf                          # Master frequently asked questions across 17 categories
├── 13-customer-support.pdf             # Support channels, SLAs, escalation matrix & complaint handling
├── 14-privacy-policy.pdf               # Customer data collection, storage, rights & retention rules
├── 15-terms-and-conditions.pdf         # E-commerce platform conditions, IP, liability & user conduct
├── 16-sustainability.pdf               # Verified environmental, packaging & ethical sourcing standards
├── 17-ai-chatbot-guide.pdf             # AI behavioral guidelines, taxonomy, grounding & source priorities
└── README.md                           # System architecture, ingestion & configuration manual
```

---

## 2. Document Purpose & Metadata Schema

Each document adheres to a standardized structural schema:
- **Header Table**: Document ID (`KB-DOC-XXX`), Title, Category, Version (`1.0`), Status (`ACTIVE`), Language (`English`).
- **Semantic Sections**: Heading 1 (`H1`), Heading 2 (`H2`), bulleted lists, structured tabular matrices, and natural customer query variations.
- **Mandatory Knowledge Base Notice**: Explicit boundary disclaimer reminding the model that live dynamic states (prices, stocks, order statuses) originate from PostgreSQL APIs.

| Document | Document ID | Category | Primary Purpose |
| :--- | :--- | :--- | :--- |
| `01-store-overview.pdf` | `KB-DOC-001` | `STORE_INFO` | Brand identity, minimalism philosophy, product categories, operating hours, and official channels. |
| `02-shopping-guide.pdf` | `KB-DOC-002` | `SHOPPING_HELP` | Comprehensive 13-step customer journey from catalog exploration and bag addition to checkout and tracking. |
| `03-product-information.pdf` | `KB-DOC-003` | `PRODUCT_DETAILS` | Architectural product specification, materials, fit descriptors, and strict separation from live inventory/pricing. |
| `04-size-guide.pdf` | `KB-DOC-004` | `SIZE_GUIDE` | Authoritative measurement charts (XS–XXL; chest, waist, hip, length), fit definitions (Regular, Slim, Oversized, Relaxed). |
| `05-shipping-delivery.pdf` | `KB-DOC-005` | `SHIPPING` | Standard & Express delivery SLAs, domestic/international coverage, courier networks, customs/duties, and exceptions. |
| `06-returns-refunds-exchanges.pdf` | `KB-DOC-006` | `RETURNS` / `REFUNDS` | Return & exchange windows, tag/packaging prerequisites, non-returnable items, doorstep pickup, and refund timelines. |
| `07-orders.pdf` | `KB-DOC-007` | `ORDER_STATUS` | Finite order states (`PENDING` to `DELIVERED`), cancellation cutoffs, address modifications, and invoice downloads. |
| `08-payments.pdf` | `KB-DOC-008` | `PAYMENTS` | Approved payment instruments (UPI, Cards, Net Banking, Wallets, COD), deduplication, and failure resolution. |
| `09-coupons-discounts.pdf` | `KB-DOC-009` | `COUPONS` | Promo code mechanics, exclusions, cart minimums, single-coupon enforcement, and backend verification. |
| `10-account-security.pdf` | `KB-DOC-010` | `ACCOUNT` | Registration, credential updates, password recovery, session termination, and GDPR/CCPA data deletion. |
| `11-product-care.pdf` | `KB-DOC-011` | `PRODUCT_CARE` | Fabric-by-fabric garment care protocols (Cotton, Denim, Wool, Linen, Silk, Synthetics) to preserve premium quality. |
| `12-faq.pdf` | `KB-DOC-012` | `GENERAL_FAQ` | Natural language FAQ collection answering high-frequency customer questions with synonym variation mapping. |
| `13-customer-support.pdf` | `KB-DOC-013` | `SUPPORT` | Multi-tiered escalation matrix, contact hours, live chat handoff, and complaint resolution timelines. |
| `14-privacy-policy.pdf` | `KB-DOC-014` | `PRIVACY` | PII handling, telemetry, cookie consent, AI conversation retention, and customer erasure rights. |
| `15-terms-and-conditions.pdf` | `KB-DOC-015` | `TERMS` | Legally binding e-commerce terms, pricing correctness clauses, intellectual property protection, and liability limits. |
| `16-sustainability.pdf` | `KB-DOC-016` | `SUSTAINABILITY` | Verified eco-friendly claims, recycled packaging standards, and explicit non-hallucination boundary for unverified claims. |
| `17-ai-chatbot-guide.pdf` | `KB-DOC-017` | `AI_CHATBOT_BEHAVIOR` | Operational playbook for LLM agents, 24-category taxonomy, grounding rules, and conflict resolution protocols. |

---

## 3. Authoritative Source Priority Hierarchy

When queries invoke multiple documents or potential policy intersections occur, the AI system must observe this strict resolution hierarchy:

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Active Official Policy Documents                         │
│    (Returns, Shipping, Payments, Terms & Conditions)       │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Official Technical Documentation                         │
│    (Product Specifications & Official Size Guide)           │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Frequently Asked Questions (FAQ)                         │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. General Store Overview & Brand Philosophy                │
└─────────────────────────────────────────────────────────────┘
```

**Conflict Resolution Rule**:
- Active official policy documents supersede FAQ summaries and general brand narratives.
- If genuine policy ambiguity persists between indexed documents, the AI must NOT invent or extrapolate. It must respond:
  > *"I found conflicting information in our store documentation. Please allow me to connect you with our customer support team for definitive confirmation."*

---

## 4. The 10 RAG Grounding Rules

All AI assistants and RAG generation components must enforce these fundamental grounding rules without exception:

1. **Rule 1 — Source-Grounded Generation**: Every answer must be strictly derived from retrieved knowledge base chunks or verified live database endpoints.
2. **Rule 2 — Zero Policy Hallucination**: Never invent, guess, or modify store policies, return windows, fees, or warranties.
3. **Rule 3 — Zero Catalog Fabrication**: Never invent product styles, colorways, fits, or attributes not present in the catalog.
4. **Rule 4 — Zero Order State Guessing**: Never fabricate customer tracking states, courier names, or order numbers.
5. **Rule 5 — Dynamic Price Isolation**: Never quote product prices from static PDF text. All pricing must come from live PostgreSQL records.
6. **Rule 6 — Dynamic Inventory Isolation**: Never assert stock availability from PDFs. Stock counts and variant sizes must be fetched in real time.
7. **Rule 7 — Realistic Delivery Estimates**: Never promise guaranteed delivery dates. State standard SLA ranges and advise checking live tracking.
8. **Rule 8 — Strict Discount Enforcement**: Never invent promotional codes, unauthorized discounts, or negotiable prices.
9. **Rule 9 — Transparent Fallback**: If relevant context cannot be found in the knowledge base, state clearly:
   > *"I couldn't find that information in our store knowledge base. Would you like me to connect you with our customer support team?"*
10. **Rule 10 — Source Citation**: Where possible, cite the document name (e.g., `[06-returns-refunds-exchanges.pdf]`) to provide transparent provenance.

---

## 5. Information Boundary: Static Knowledge (RAG) vs Live Data (PostgreSQL APIs)

To eliminate hallucinations and prevent out-of-date responses, the system strictly separates static policy knowledge from dynamic transaction state:

| Query Type | Information Source | Processing Pipeline | Example Question |
| :--- | :--- | :--- | :--- |
| **Return Policy & Terms** | **Static RAG PDF** | Document Retrieval (`06-returns-refunds-exchanges.pdf`) | *"What is your return window?"* |
| **Garment Sizing & Fit** | **Static RAG PDF** | Document Retrieval (`04-size-guide.pdf`) | *"What are the chest measurements for size L?"* |
| **Washing & Fabric Care** | **Static RAG PDF** | Document Retrieval (`11-product-care.pdf`) | *"How should I wash 100% French Terry Cotton?"* |
| **Shipping Rules & SLAs** | **Static RAG PDF** | Document Retrieval (`05-shipping-delivery.pdf`) | *"Do you ship to residential addresses on weekends?"* |
| **Current Product Price** | **Live PostgreSQL API** | `GET /api/products/{id}` | *"How much is the Oversized Heavyweight Tee right now?"* |
| **Real-Time Stock Availability** | **Live PostgreSQL API** | `GET /api/products/{id}/variants` | *"Do you have the Black Hoodie in size M in stock?"* |
| **Live Order Tracking** | **Live PostgreSQL API** | `GET /api/orders/{id}` | *"Where is my package for order #ORD-98214?"* |
| **Coupon Code Validity** | **Live PostgreSQL API** | `POST /api/coupons/validate` | *"Is coupon CODE20 valid on my current cart?"* |
| **Multi-Source Hybrid Query** | **API + RAG Multi-Hop** | 1. Fetch Order API → 2. Extract Product & Delivery Date → 3. Query RAG Return Policy | *"Can I return the denim jacket I received 4 days ago on order #ORD-1042?"* |

---

## 6. Document Versioning & Historical Traceability

- Every document in this directory carries an explicit version string (e.g., `1.0`).
- When policies are amended:
  1. Update the corresponding markdown / generator section in `scripts/generate_knowledge_base.py`.
  2. Increment the document version (e.g., `1.0` → `2.0`).
  3. Re-generate the PDF into `knowledge-base/`.
  4. Ingest and re-index the document via the Admin Knowledge Base portal (`/admin/knowledge-base`) or DataLoader.
- Historical AI conversation logs persist the specific document ID and version active at the time the message was generated, guaranteeing full auditability.

---

## 7. Placeholder Configuration Registry

To avoid inventing unfinalized business policies, explicit bracketed placeholders are used throughout the knowledge base. When your business finalizes these values, update them in your master configuration or replace them directly in `scripts/generate_knowledge_base.py` and regenerate the PDFs.

| Placeholder Key | Scope / Meaning | Default / Recommended Action |
| :--- | :--- | :--- |
| `[STORE_NAME]` | Official Store / Brand Name | Replace with brand legal entity (e.g., `CLOTHING`). |
| `[STORE_RETURN_WINDOW_DAYS]` | Return period eligibility window | Set to company policy (e.g., `14` or `30` calendar days). |
| `[EXCHANGE_WINDOW_DAYS]` | Size/color exchange window | Set to company policy (e.g., `14` or `30` calendar days). |
| `[FREE_SHIPPING_THRESHOLD]` | Cart subtotal required for free delivery | Set to currency threshold (e.g., `₹1,999` or `$100`). |
| `[SHIPPING_CHARGE]` | Flat-rate domestic shipping fee | Set to standard fee (e.g., `₹99` or `$7.99`). |
| `[EXPRESS_SHIPPING_CHARGE]` | Expedited transit fee | Set to express surcharge (e.g., `₹249` or `$14.99`). |
| `[SUPPORT_EMAIL]` | Primary customer service email | Configure email inbox (e.g., `support@brand.com`). |
| `[SUPPORT_PHONE]` | Customer service helpline telephone | Configure customer telephone / toll-free number. |
| `[SUPPORT_HOURS]` | Operating hours of human support desk | Configure support availability (e.g., `Mon–Sat, 9 AM – 8 PM IST`). |
| `[ESCALATION_EMAIL]` | Grievance officer / escalation email | Configure management inbox (e.g., `grievance@brand.com`). |
| `[PHYSICAL_STORE_LOCATIONS]` | Brick-and-mortar boutique addresses | List store addresses or state `"Online Exclusive"`. |
| `[INTERNATIONAL_SHIPPING_AVAILABLE]` | Cross-border shipping status | Configure as `"Available to select countries"` or `"Domestic Only"`. |
| `[DUTIES_AND_TAXES_POLICY]` | International customs responsibilities | Configure whether shipping is DDU (Delivered Duty Unpaid) or DDP. |
| `[CANCELLATION_WINDOW_HOURS]` | Hours after order placement before packing | Set to policy limit (e.g., `2 hours` or `until packing begins`). |
| `[REFUND_TIMELINE_DAYS]` | Bank business days to receive refunded money | Set to banking SLA (e.g., `5-7 business days`). |
| `[RESTOCKING_FEE]` | Restocking deduction fee | Set to `"Zero / Free Returns"` or specified deduction. |

---

## 8. Ingestion & Vector Indexing Instructions

To ingest or update these 17 documents in the active Spring Boot backend and PostgreSQL database:

1. **Automatic Directory Synchronization**:
   Copy the 17 PDF files into the backend uploads folder:
   ```bash
   mkdir -p backend/uploads/knowledge-base
   cp knowledge-base/*.pdf backend/uploads/knowledge-base/
   ```

2. **Re-generating PDFs from Source**:
   If policy texts or placeholders are modified, regenerate all 17 PDFs in one command:
   ```bash
   python3 scripts/generate_knowledge_base.py
   ```

3. **Admin Dashboard Upload**:
   - Navigate to `http://localhost:5173/admin` → **Knowledge Base**.
   - Review indexed documents, chunk distributions, and similarity score thresholds.
   - Use the **Upload Document** modal to index new revisions or custom documents anytime.
