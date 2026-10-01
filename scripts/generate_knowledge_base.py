#!/usr/bin/env python3
"""
Production-Ready Knowledge Base PDF Generator for Clothing E-Commerce Platform
Generates 17 structured, authoritative PDF documents optimized for RAG semantic chunking.
"""

import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    HRFlowable,
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "knowledge-base")
os.makedirs(OUTPUT_DIR, exist_ok=True)

def build_pdf(filename, doc_id, title, category, version, sections):
    pdf_path = os.path.join(OUTPUT_DIR, filename)
    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=36,
        bottomMargin=36,
    )

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=16,
        leading=20,
        textColor=colors.HexColor('#000000'),
        spaceAfter=4,
    )

    h1_style = ParagraphStyle(
        'SectionH1',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=colors.HexColor('#000000'),
        spaceBefore=10,
        spaceAfter=4,
    )

    h2_style = ParagraphStyle(
        'SectionH2',
        parent=styles['Heading3'],
        fontName='Helvetica-Bold',
        fontSize=9.5,
        leading=13,
        textColor=colors.HexColor('#222222'),
        spaceBefore=7,
        spaceAfter=3,
    )

    body_style = ParagraphStyle(
        'BodyDark',
        parent=styles['BodyText'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12.5,
        textColor=colors.HexColor('#2a2a2a'),
        spaceAfter=3,
    )

    bullet_style = ParagraphStyle(
        'BulletText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12.5,
        textColor=colors.HexColor('#2a2a2a'),
        leftIndent=12,
        firstLineIndent=-8,
        spaceAfter=2,
    )

    meta_label = ParagraphStyle(
        'MetaLabel',
        fontName='Helvetica-Bold',
        fontSize=7.5,
        leading=10,
        textColor=colors.HexColor('#555555'),
    )

    meta_val = ParagraphStyle(
        'MetaVal',
        fontName='Helvetica',
        fontSize=7.5,
        leading=10,
        textColor=colors.HexColor('#111111'),
    )

    callout_style = ParagraphStyle(
        'CalloutText',
        fontName='Helvetica-Oblique',
        fontSize=8,
        leading=11.5,
        textColor=colors.HexColor('#1a1a1a'),
    )

    story = []

    # Title
    story.append(Paragraph(title.upper(), title_style))
    story.append(Spacer(1, 3))

    # Metadata Header Card Table
    meta_data = [
        [
            Paragraph(f"<b>DOCUMENT ID:</b> {doc_id}", meta_val),
            Paragraph(f"<b>VERSION:</b> {version}", meta_val),
            Paragraph(f"<b>STATUS:</b> ACTIVE", meta_val),
        ],
        [
            Paragraph(f"<b>CATEGORY:</b> {category}", meta_val),
            Paragraph(f"<b>EFFECTIVE:</b> October 2026", meta_val),
            Paragraph(f"<b>LANGUAGE:</b> English (EN)", meta_val),
        ],
        [
            Paragraph("<b>OWNER:</b> Store Policy & Operations Governance", meta_val),
            Paragraph("<b>CLASSIFICATION:</b> Authoritative Public Policy", meta_val),
            Paragraph("<b>GROUNDING:</b> Strict RAG Retrieval", meta_val),
        ]
    ]
    meta_table = Table(meta_data, colWidths=[180, 175, 185])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f6f6f6')),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#d0d0d0')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e5e5e5')),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 8))

    # Body Elements
    for sec in sections:
        sec_type = sec.get("type", "paragraph")
        
        if sec_type == "h1":
            story.append(Paragraph(sec["text"], h1_style))
            story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#cccccc'), spaceBefore=2, spaceAfter=5))
        elif sec_type == "h2":
            story.append(Paragraph(sec["text"], h2_style))
        elif sec_type == "p":
            story.append(Paragraph(sec["text"], body_style))
        elif sec_type == "bullet":
            story.append(Paragraph(f"• {sec['text']}", bullet_style))
        elif sec_type == "callout":
            callout_data = [[Paragraph(sec["text"], callout_style)]]
            t = Table(callout_data, colWidths=[540])
            t.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f9f9f9')),
                ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#bbbbbb')),
                ('LEFTPADDING', (0,0), (-1,-1), 8),
                ('RIGHTPADDING', (0,0), (-1,-1), 8),
                ('TOPPADDING', (0,0), (-1,-1), 5),
                ('BOTTOMPADDING', (0,0), (-1,-1), 5),
            ]))
            story.append(Spacer(1, 3))
            story.append(t)
            story.append(Spacer(1, 3))
        elif sec_type == "table":
            headers = [Paragraph(f"<b>{h}</b>", meta_label) for h in sec["headers"]]
            rows = []
            for row in sec["rows"]:
                rows.append([Paragraph(str(cell), body_style) for cell in row])
            table_data = [headers] + rows
            col_widths = sec.get("colWidths", [540 / len(headers)] * len(headers))
            tbl = Table(table_data, colWidths=col_widths)
            tbl.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#ececec')),
                ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#cccccc')),
                ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e2e2')),
                ('TOPPADDING', (0,0), (-1,-1), 3),
                ('BOTTOMPADDING', (0,0), (-1,-1), 3),
                ('LEFTPADDING', (0,0), (-1,-1), 5),
                ('RIGHTPADDING', (0,0), (-1,-1), 5),
            ]))
            story.append(Spacer(1, 3))
            story.append(tbl)
            story.append(Spacer(1, 3))

    # Universal Knowledge Base Notice Section
    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="100%", thickness=0.75, color=colors.HexColor('#888888'), spaceBefore=5, spaceAfter=5))
    notice_text = (
        "<b>KNOWLEDGE BASE NOTICE & RETRIEVAL BOUNDARIES:</b> "
        "This document is an authoritative policy reference intended for grounding our store AI/RAG assistant. "
        "Store policies, shipping charges, return periods, and operational terms are governed by active store settings. "
        "Dynamic customer data—including live product prices, real-time variant inventory, order shipment tracking, "
        "user profile addresses, and coupon code validity—must ALWAYS be resolved via live PostgreSQL application database APIs "
        "rather than static document text. If information is not covered within this knowledge base, the chatbot must clearly "
        "state that the information is unavailable and offer customer support assistance."
    )
    story.append(Paragraph(notice_text, ParagraphStyle('Notice', parent=body_style, fontSize=7, leading=9.5, textColor=colors.HexColor('#555555'))))

    doc.build(story)
    print(f"Generated: {filename}")


# =========================================================================
# DOCUMENT DEFINITIONS
# =========================================================================

def generate_doc_01():
    sections = [
        {"type": "h1", "text": "1. Brand Identity and Overview"},
        {"type": "p", "text": "Store Name: [STORE_NAME]. We are a modern, design-led clothing brand dedicated to elevated wardrobe essentials, functional streetwear, and refined apparel for everyday movement. Inspired by architectural minimalism and monochrome aesthetic principles, our apparel celebrates clean silhouettes, superior material tactile quality, and effortless daily versatility."},
        {"type": "h2", "text": "Target Customers & Philosophy"},
        {"type": "bullet", "text": "Target Customers: Discerning modern consumers seeking durable, minimalist, and well-tailored wardrobe staples that transition seamlessly between professional environments, casual settings, and active urban transit."},
        {"type": "bullet", "text": "Quality Philosophy: The product is the visual hero. We eliminate distracting brand logos, garish patterns, and disposable fast-fashion trends in favor of premium natural textiles, reinforced stitching, and timeless cuts."},
        {"type": "bullet", "text": "Brand Values: Minimalist restraint, utilitarian comfort, transparent policies, uncompromising fabric durability, and honest customer service."},
        
        {"type": "h1", "text": "2. Product Catalog Categories"},
        {"type": "p", "text": "[STORE_NAME] curates menswear, womenswear, and gender-neutral unisex essentials structured across four core master categories:"},
        {"type": "table", "headers": ["Master Category", "Subcategories Included", "Hero Apparel Types"], "colWidths": [120, 220, 200], "rows": [
            ["Apparel", "Topwear, Bottomwear, Outerwear", "Oversized Tees, Oxford Shirts, Linen Blends, Tailored Trousers, Cargo Pants, Hoodies"],
            ["Footwear", "Shoes, Sneakers, Slides", "Minimalist Leather Sneakers, Everyday Trainers, Slip-on Casual Slides"],
            ["Accessories", "Bags, Belts, Headwear, Socks", "Canvas Totes, Waterproof Crossbody Bags, Full-Grain Leather Belts, Caps, Knit Beanies"],
            ["Personal Care", "Fragrances, Grooming Accessories", "Botanical Eau de Parfum, Natural Fabric Refreshing Mists, Travel Grooming Kits"]
        ]},

        {"type": "h1", "text": "3. Storefront Experience & Locations"},
        {"type": "p", "text": "Retail Format: [STORE_NAME] operates primarily as a direct-to-consumer digital flagship web application ([STORE_WEBSITE_URL]). We do not currently operate permanent physical brick-and-mortar storefronts, enabling us to deliver premium designer materials without traditional retail markups."},
        {"type": "p", "text": "Supported Languages: The storefront and customer service channels support English natively, with multilingual chat comprehension for Hindi and Hinglish customer inquiries."},
        {"type": "p", "text": "Operating Business Hours: Our digital platform is open 24 hours a day, 7 days a week, 365 days a year for ordering. Customer Support operations run during [SUPPORT_HOURS]."},

        {"type": "h1", "text": "4. Customer Communication & Contact Channels"},
        {"type": "bullet", "text": "Official Support Email: [SUPPORT_EMAIL] (Typical response time within [EMAIL_RESPONSE_HOURS] business hours)."},
        {"type": "bullet", "text": "Customer Care Telephone: [SUPPORT_PHONE] (Available during [SUPPORT_HOURS])."},
        {"type": "bullet", "text": "Interactive Support Assistant: Built-in 24/7 AI Chatbot located at the bottom-right corner of the web storefront with live support escalation."}
    ]
    build_pdf("01-store-overview.pdf", "KB-DOC-001", "01. Store Overview & Brand Architecture", "STORE_INFO", "1.0", sections)


def generate_doc_02():
    sections = [
        {"type": "h1", "text": "1. Complete Step-by-Step Shopping Process"},
        {"type": "p", "text": "Shopping at [STORE_NAME] is designed to be frictionless, fast, and transparent. The customer purchasing workflow follows these thirteen distinct stages:"},
        {"type": "bullet", "text": "Step 1 - Browse Collections: Explore curated capsules on the Home page, including New Arrivals, Core Essentials, and Seasonal Edits."},
        {"type": "bullet", "text": "Step 2 - Intelligent Search: Use the global search bar in the header to search by keywords, styles, colors, or categories with typo tolerance."},
        {"type": "bullet", "text": "Step 3 - Refine with Filters: Filter catalog items by Gender, Category, Subcategory, Price Range, Available Color, and Size."},
        {"type": "bullet", "text": "Step 4 - Inspect Product Details: Click any product card to view multi-angle high-resolution photography, fabric composition, fit notes, and care instructions."},
        {"type": "bullet", "text": "Step 5 - Size Selection: Select your desired garment size (XS, S, M, L, XL, XXL) with reference to the interactive Size Guide chart."},
        {"type": "bullet", "text": "Step 6 - Color Variant Selection: Choose available monochrome or seasonal colorways."},
        {"type": "bullet", "text": "Step 7 - Add to Bag: Click 'Add to Bag' to reserve the selected variant in your sliding Cart Drawer."},
        {"type": "bullet", "text": "Step 8 - Apply Coupon Discount: Enter an active promotional code in the coupon field in your Cart or Checkout and click 'Apply'."},
        {"type": "bullet", "text": "Step 9 - Proceed to Checkout: Click 'Checkout' to review item quantities, subtotal, discount deductions, shipping fees, and taxes."},
        {"type": "bullet", "text": "Step 10 - Shipping & Delivery Details: Enter recipient name, contact phone number, email address, postal code, and delivery destination."},
        {"type": "bullet", "text": "Step 11 - Select Payment Gateway: Choose your preferred payment method (Credit/Debit Card, UPI, Net Banking, or Cash on Delivery if configured)."},
        {"type": "bullet", "text": "Step 12 - Place Order: Confirm purchase. Upon gateway authorization, you will immediately receive a unique Order Confirmation ID."},
        {"type": "bullet", "text": "Step 13 - Track Order: Follow your parcel dispatch, shipping carrier handoff, and delivery milestone updates under 'My Account' > 'Orders'."},

        {"type": "h1", "text": "2. Managing the Shopping Bag"},
        {"type": "p", "text": "Items in your Cart Drawer can be adjusted at any time before final payment. You may increment or decrement quantities, remove products, or move items to your permanent Wishlist."},
        {"type": "callout", "text": "CART VALIDATION RULE: Adding an item to your cart does not indefinitely lock stock. Inventory is reserved upon initiating payment checkout to ensure fair access for all customers."}
    ]
    build_pdf("02-shopping-guide.pdf", "KB-DOC-002", "02. Customer Shopping Guide & Order Placement", "SHOPPING_HELP", "1.0", sections)


def generate_doc_03():
    sections = [
        {"type": "h1", "text": "1. Product Catalog Schema & Attribute Definitions"},
        {"type": "p", "text": "Every garment in the [STORE_NAME] catalog adheres to a rigorous standardized schema ensuring consistent product transparency:"},
        {"type": "bullet", "text": "Product Display Name: Official descriptive product title (e.g., 'Men's Heavyweight Relaxed Crewneck Tee')."},
        {"type": "bullet", "text": "Master Category: Top-level classification (Apparel, Footwear, Accessories, Personal Care)."},
        {"type": "bullet", "text": "Subcategory & Article Type: Specific garment category (e.g., Topwear → T-Shirts, Bottomwear → Trousers)."},
        {"type": "bullet", "text": "Gender Classification: Categorized as Men, Women, or Unisex."},
        {"type": "bullet", "text": "Base Colour: Primary garment shade (e.g., Black, Optical White, Heather Charcoal, Navy, Olive)."},
        {"type": "bullet", "text": "Material & Fabric Composition: Exact yarn construction (e.g., '100% Combed Compact Cotton, 260 GSM Heavyweight Jersey')."},
        {"type": "bullet", "text": "Fit Silhouette: Cut classification (Slim Fit, Regular Fit, Relaxed Fit, Oversized Boxy Fit)."},
        {"type": "bullet", "text": "Stock Keeping Unit (SKU): Globally unique alpha-numeric identifier mapped directly to individual size/color combinations."},

        {"type": "h1", "text": "2. Static Knowledge vs Live Database Data (Critical RAG Boundary)"},
        {"type": "p", "text": "The AI Chatbot MUST strictly distinguish between static catalog descriptions and dynamic database information:"},
        {"type": "table", "headers": ["Information Type", "Authoritative Source", "Chatbot Retrieval Mechanism"], "colWidths": [160, 160, 220], "rows": [
            ["Fabric, Materials & Cut", "Static Knowledge Base (PDF)", "Direct RAG vector similarity retrieval"],
            ["Fit & Styling Recommendations", "Static Knowledge Base (PDF)", "Direct RAG vector similarity retrieval"],
            ["Garment Care Protocols", "Static Knowledge Base (PDF)", "Direct RAG vector similarity retrieval"],
            ["Current Product Retail Price", "PostgreSQL Product Database", "Live Spring Boot REST API query (/api/products)"],
            ["Real-Time Stock Availability", "PostgreSQL Inventory Database", "Live Spring Boot REST API query (/api/products/search)"],
            ["Active Discount Percentages", "PostgreSQL Promotion Engine", "Live Spring Boot REST API query (/api/coupons)"]
        ]},
        {"type": "callout", "text": "ANTI-HALLUCINATION RULE: The chatbot must NEVER quote live inventory quantities or current selling prices from outdated PDF text. Live numbers must always originate from PostgreSQL."}
    ]
    build_pdf("03-product-information.pdf", "KB-DOC-003", "03. Product Information & Catalog Architecture", "PRODUCT_DETAILS", "1.0", sections)


def generate_doc_04():
    sections = [
        {"type": "h1", "text": "1. Authoritative Garment Sizing Specifications"},
        {"type": "p", "text": "Garments at [STORE_NAME] are engineered with standardized ergonomic tailoring. Below are the definitive body measurement ranges in centimeters and inches for standard unisex and men's apparel:"},
        {"type": "table", "headers": ["Size", "Chest (in / cm)", "Waist (in / cm)", "Hip (in / cm)", "Body Length (in / cm)"], "colWidths": [50, 120, 120, 120, 130], "rows": [
            ["XS", "34 - 36 in / 86 - 91 cm", "28 - 30 in / 71 - 76 cm", "34 - 36 in / 86 - 91 cm", "26.5 in / 67 cm"],
            ["S", "36 - 38 in / 91 - 96 cm", "30 - 32 in / 76 - 81 cm", "36 - 38 in / 91 - 96 cm", "27.5 in / 70 cm"],
            ["M", "38 - 40 in / 96 - 101 cm", "32 - 34 in / 81 - 86 cm", "38 - 40 in / 96 - 101 cm", "28.5 in / 72 cm"],
            ["L", "40 - 42 in / 101 - 107 cm", "34 - 36 in / 86 - 91 cm", "40 - 42 in / 101 - 107 cm", "29.5 in / 75 cm"],
            ["XL", "42 - 44 in / 107 - 112 cm", "36 - 38 in / 91 - 97 cm", "42 - 44 in / 107 - 112 cm", "30.5 in / 77 cm"],
            ["XXL", "44 - 46 in / 112 - 117 cm", "38 - 40 in / 97 - 102 cm", "44 - 46 in / 112 - 117 cm", "31.5 in / 80 cm"]
        ]},

        {"type": "h1", "text": "2. Garment Silhouette & Fit Types"},
        {"type": "bullet", "text": "Slim Fit: Tailored close to the chest, waist, and arms without restricting movement. Ideal for athletic silhouettes or formal layering."},
        {"type": "bullet", "text": "Regular Fit: Our classic balanced cut with moderate ease through the chest, shoulders, and waist. Conforms to standard true-to-size dimensions."},
        {"type": "bullet", "text": "Relaxed Fit: Cut with additional room through the torso and hem for casual drape and breathability."},
        {"type": "bullet", "text": "Oversized Boxy Fit: Intentionally cut with dropped shoulders, wider sleeves, and generous chest dimensions for modern streetwear aesthetics."},

        {"type": "h1", "text": "3. How to Measure Yourself Correctly"},
        {"type": "p", "text": "To achieve optimal fit, use a flexible tailor's tape measure while standing naturally in lightweight clothing:"},
        {"type": "bullet", "text": "Chest / Bust: Measure around the fullest circumference of your chest, keeping the tape level under your armpits and across your shoulder blades."},
        {"type": "bullet", "text": "Natural Waist: Measure around the narrowest point of your torso, typically one inch above the belly button."},
        {"type": "bullet", "text": "Hips: Measure around the fullest point of your hips and seat while standing with feet together."},
        {"type": "callout", "text": "FIT RECOMMENDATION BOUNDARY: If customer measurements fall between two sizes, recommend sizing DOWN for a fitted look or sizing UP for a relaxed drape. The chatbot must never guarantee 100% fit accuracy."}
    ]
    build_pdf("04-size-guide.pdf", "KB-DOC-004", "04. Garment Size Guide, Fit Silhouettes & Body Measurements", "SIZE_GUIDE", "1.0", sections)


def generate_doc_05():
    sections = [
        {"type": "h1", "text": "1. Shipping Regions & Destinations"},
        {"type": "bullet", "text": "Domestic Shipping: We service all major postal codes across India through Tier-1 express air and ground couriers (Blue Dart, Delhivery, Xpressbees)."},
        {"type": "bullet", "text": "International Shipping: Availability is governed by store configuration [INTERNATIONAL_SHIPPING_AVAILABLE]. When enabled, international parcels dispatch via DHL Express or FedEx International Priority."},

        {"type": "h1", "text": "2. Shipping Charges & Free Delivery Thresholds"},
        {"type": "bullet", "text": "Standard Domestic Delivery Fee: A flat rate of [SHIPPING_CHARGE] is applied to orders below the free shipping threshold."},
        {"type": "bullet", "text": "Free Shipping Policy: All domestic orders with a qualifying cart total of [FREE_SHIPPING_THRESHOLD] or higher automatically receive complimentary standard shipping at checkout."},

        {"type": "h1", "text": "3. Order Fulfillment & Delivery Timelines"},
        {"type": "table", "headers": ["Destination Type", "Order Processing Time", "Transit Duration", "Total Estimated Time"], "colWidths": [140, 130, 130, 140], "rows": [
            ["Metro Cities (Tier 1)", "24 - 48 business hours", "2 - 3 business days", "3 - 5 business days"],
            ["Regional Towns (Tier 2/3)", "24 - 48 business hours", "4 - 6 business days", "5 - 7 business days"],
            ["Special Remote Areas", "24 - 48 business hours", "6 - 9 business days", "7 - 11 business days"],
            ["International Delivery", "48 - 72 business hours", "[INTERNATIONAL_DAYS]", "[INTERNATIONAL_TOTAL]"]
        ]},

        {"type": "h1", "text": "4. Order Tracking & Delivery Issues"},
        {"type": "p", "text": "Tracking Link: Once your parcel is scanned by our carrier partner, a dispatch notification email and SMS containing your live Tracking AWB Number and carrier tracking URL will be generated."},
        {"type": "bullet", "text": "Delayed Packages: In case of courier delays due to adverse weather or transit bottlenecks, customers are notified via email."},
        {"type": "bullet", "text": "Incorrect Delivery Address: Addresses cannot be modified once an order has been marked 'SHIPPED'. Contact [SUPPORT_EMAIL] immediately if changes are required prior to shipment."},
        {"type": "bullet", "text": "Lost or Damaged Shipments: If a package is confirmed lost by the courier, or arrives with damaged packaging, [STORE_NAME] will immediately initiate a replacement or full refund."}
    ]
    build_pdf("05-shipping-delivery.pdf", "KB-DOC-005", "05. Shipping, Delivery Timelines & Carrier Logistics", "SHIPPING", "1.0", sections)


def generate_doc_06():
    sections = [
        {"type": "h1", "text": "1. Authoritative Return & Exchange Policy"},
        {"type": "p", "text": "At [STORE_NAME], we stand behind the quality and craftsmanship of our garments. We offer a fair, straightforward return and exchange window to ensure total customer satisfaction."},
        {"type": "bullet", "text": "Return Window: Eligible items can be returned within [STORE_RETURN_WINDOW_DAYS] calendar days from the confirmed carrier delivery date."},
        {"type": "bullet", "text": "Exchange Window: Size exchanges are permitted within [STORE_RETURN_WINDOW_DAYS] calendar days of delivery, subject to variant stock availability in PostgreSQL."},

        {"type": "h1", "text": "2. Return Eligibility Criteria & Non-Returnable Products"},
        {"type": "bullet", "text": "Mandatory Condition: Products must be unworn, unwashed, unaltered, and free of stains, deodorant marks, animal hair, or perfumes."},
        {"type": "bullet", "text": "Tags & Packaging: Original branded hangtags and product packaging must be fully intact and attached."},
        {"type": "bullet", "text": "Non-Returnable Items: Underwear, socks, swimwear, and intimate garments cannot be returned due to strict hygiene and health standards."},
        {"type": "bullet", "text": "Final Sale / Clearance: Items marked as 'Final Sale' or 'Clearance' at the time of purchase are non-returnable and non-refundable."},

        {"type": "h1", "text": "3. Refund Processing Timelines & Methods"},
        {"type": "table", "headers": ["Refund Method", "Inspection Period", "Banking Transfer Timeline", "Total Refund Time"], "colWidths": [130, 130, 140, 140], "rows": [
            ["Original Payment Method (Cards/UPI)", "24 - 48 hrs post-pickup", "5 - 7 business days", "7 - 10 business days"],
            ["Store Credit / Digital Voucher", "24 - 48 hrs post-pickup", "Instantaneous upon inspection", "1 - 2 business days"],
            ["Cash on Delivery Orders", "24 - 48 hrs post-pickup", "NEFT transfer within 4 - 6 days", "5 - 8 business days"]
        ]},

        {"type": "h1", "text": "4. Step-by-Step Return Request Workflow"},
        {"type": "p", "text": "1. Go to 'My Account' > 'Orders' and select the order containing the item you wish to return."},
        {"type": "p", "text": "2. Click 'Request Return / Exchange' and select the reason for return from the dropdown."},
        {"type": "p", "text": "3. Our reverse-logistics courier partner will schedule an doorstep pickup within 2 to 3 business days."},
        {"type": "p", "text": "4. Hand over the securely packed garment with tags attached to the courier agent."},
        {"type": "p", "text": "5. Upon physical quality inspection at our fulfillment hub, your refund will be automatically triggered."}
    ]
    build_pdf("06-returns-refunds-exchanges.pdf", "KB-DOC-006", "06. Returns, Refunds, Size Exchanges & Store Credit", "RETURNS", "1.0", sections)


def generate_doc_07():
    sections = [
        {"type": "h1", "text": "1. Order Lifecycle & Status Progression"},
        {"type": "p", "text": "Every customer order progresses through strict, validated transactional states:"},
        {"type": "table", "headers": ["Status Code", "Status Description", "Customer Action Permitted"], "colWidths": [120, 260, 160], "rows": [
            ["PENDING", "Order created, waiting for payment gateway confirmation", "Complete payment or retry"],
            ["CONFIRMED", "Payment successful, order recorded in database", "Eligible for immediate cancellation"],
            ["PROCESSING", "Inventory allocated at warehouse, invoice generated", "Eligible for address modification"],
            ["PACKED", "Garments folded, bagged, and labeled for dispatch", "Cancellation no longer permitted"],
            ["SHIPPED", "Handed over to courier; tracking AWB assigned", "Track shipment via carrier link"],
            ["OUT_FOR_DELIVERY", "Courier agent assigned for final doorstep drop-off", "Keep recipient phone reachable"],
            ["DELIVERED", "Package safely delivered to recipient", "Eligible for return/exchange window"],
            ["CANCELLED", "Order successfully terminated prior to packing", "Refund auto-initiated to payment source"]
        ]},

        {"type": "h1", "text": "2. Order Cancellation Policy"},
        {"type": "bullet", "text": "Cancellation Window: Customers may cancel an order free of charge while in 'CONFIRMED' or 'PROCESSING' status prior to packing."},
        {"type": "bullet", "text": "Post-Dispatch Cancellations: Once an order has been marked 'PACKED' or 'SHIPPED', cancellation is no longer possible. Customers may reject doorstep delivery or initiate a standard return upon receipt."},

        {"type": "h1", "text": "3. Accessing Invoices & Order Receipts"},
        {"type": "p", "text": "Official digital tax invoices are accessible 24/7 under 'My Account' > 'Orders' by clicking 'Download Tax Invoice (PDF)'. A printed invoice copy is also enclosed within the exterior shipping sleeve of every physical delivery."}
    ]
    build_pdf("07-orders.pdf", "KB-DOC-007", "07. Order Lifecycle, Tracking & Cancellation Procedures", "ORDERS", "1.0", sections)


def generate_doc_08():
    sections = [
        {"type": "h1", "text": "1. Supported Payment Methods"},
        {"type": "p", "text": "[STORE_NAME] partners with leading secure payment gateways (Razorpay, Stripe) supporting comprehensive payment channels:"},
        {"type": "bullet", "text": "Unified Payments Interface (UPI): Instant checkout via Google Pay, PhonePe, Paytm, CRED, BHIM, and bank UPI apps."},
        {"type": "bullet", "text": "Credit & Debit Cards: Visa, MasterCard, American Express, RuPay, and Diners Club International."},
        {"type": "bullet", "text": "Internet Banking: Direct net banking support for 50+ major retail and commercial banks."},
        {"type": "bullet", "text": "Digital Wallets: Paytm Wallet, PhonePe Wallet, MobiKwik, and Amazon Pay."},
        {"type": "bullet", "text": "Cash on Delivery (COD): Permitted based on store policy [COD_AVAILABLE] for eligible domestic pincodes."},

        {"type": "h1", "text": "2. Resolving Payment Failures & Deducted Amounts"},
        {"type": "p", "text": "If money is deducted from your bank account but your order status indicates 'FAILED' or 'PENDING':"},
        {"type": "bullet", "text": "Root Cause: This occurs when an intermittent network timeout interrupts communication between your bank and our gateway."},
        {"type": "bullet", "text": "Auto-Reversal: Banking regulations mandate an automatic reconciliation. If our gateway does not receive the funds, your bank will auto-refund the deducted sum to your account within 24 to 48 hours."},
        {"type": "bullet", "text": "Customer Support Verification: If funds are not restored after 48 hours, send your bank transaction UTR/reference number to [SUPPORT_EMAIL]."},

        {"type": "h1", "text": "3. Payment Security & Data Privacy"},
        {"type": "p", "text": "All transactions are secured with 256-bit SSL encryption and strict PCI-DSS Level 1 compliance. [STORE_NAME] never stores complete credit/debit card numbers or CVV codes on our servers."}
    ]
    build_pdf("08-payments.pdf", "KB-DOC-008", "08. Payment Gateways, Security & Transaction Troubleshooting", "PAYMENTS", "1.0", sections)


def generate_doc_09():
    sections = [
        {"type": "h1", "text": "1. Promotional Coupons & Discount Rules"},
        {"type": "p", "text": "Promotional codes allow customers to enjoy percentage discounts, fixed rupee markdowns, or complimentary shipping. The following strict governance rules apply:"},
        {"type": "bullet", "text": "Single Coupon Stacking Rule: Only ONE promotional coupon code may be applied per checkout order. Coupons cannot be stacked or combined."},
        {"type": "bullet", "text": "Minimum Order Requirement: Certain coupon codes require a minimum qualifying cart value before the discount activates."},
        {"type": "bullet", "text": "Maximum Discount Cap: Percentage-based coupons may have an upper monetary discount ceiling."},
        {"type": "bullet", "text": "First-Order Exclusive Codes: Introductory discounts are restricted strictly to first-time customer accounts with no prior order history."},
        {"type": "bullet", "text": "Exclusions: Coupons do not apply to gift cards, charity merchandise, or products explicitly tagged 'Final Sale'."},

        {"type": "h1", "text": "2. Troubleshooting Coupon Errors"},
        {"type": "table", "headers": ["Error Message Displayed", "Underlying Cause", "Resolution Action"], "colWidths": [160, 180, 200], "rows": [
            ["Coupon code expired", "Promotional validity date has passed", "Check newsletter for current active promotional codes"],
            ["Cart minimum not met", "Subtotal is below qualifying threshold", "Add items to reach minimum eligible cart value"],
            ["Usage limit exceeded", "Code has reached maximum lifetime redemptions", "Code is exhausted; use an alternate active promotion"],
            ["Already used by account", "Single-use promo code previously redeemed", "Code can only be redeemed once per customer account"]
        ]},

        {"type": "callout", "text": "DATABASE VERIFICATION: Coupon calculations are strictly validated on the Spring Boot backend server. The AI Chatbot does not generate or validate coupon codes independently."}
    ]
    build_pdf("09-coupons-discounts.pdf", "KB-DOC-009", "09. Coupons, Promotional Discounts & Redemption Rules", "COUPONS", "1.0", sections)


def generate_doc_10():
    sections = [
        {"type": "h1", "text": "1. Customer Account Management"},
        {"type": "p", "text": "Creating an account at [STORE_NAME] unlocks express checkout, saved address management, permanent wishlist synchronization, and comprehensive order tracking history."},
        {"type": "bullet", "text": "Account Creation: Register using a valid email address and secure password. You will receive an instant account verification email."},
        {"type": "bullet", "text": "Password Reset: If you forget your password, click 'Forgot Password' on the login screen to receive a time-limited, encrypted reset link."},
        {"type": "bullet", "text": "Address Book: Manage multiple shipping and billing addresses under 'My Account' > 'Addresses' to expedite future checkouts."},
        {"type": "bullet", "text": "Permanent Wishlist: Save coveted garments by clicking the heart icon on any product page. Wishlist items remain synced across sessions."},

        {"type": "h1", "text": "2. Account Security & Privacy Governance"},
        {"type": "bullet", "text": "Password Hashing: All user credentials are encrypted using industry-standard BCrypt hashing with dynamic salt. Staff cannot view passwords."},
        {"type": "bullet", "text": "Session Security: Customer login sessions utilize secure HTTP-only JWT bearer tokens with automatic timeout expiration."},
        {"type": "bullet", "text": "Account Deletion (Right to Erasure): To permanently delete your account and associated personal data, submit a request to [SUPPORT_EMAIL]. Active open orders must be delivered or refunded prior to account closure."}
    ]
    build_pdf("10-account-security.pdf", "KB-DOC-010", "10. Account Management, Security & Profile Governance", "ACCOUNT", "1.0", sections)


def generate_doc_11():
    sections = [
        {"type": "h1", "text": "1. Garment Care & Fabric Longevity Philosophy"},
        {"type": "p", "text": "Premium apparel is an investment. Proper laundering practices preserve garment structure, prevent color fading, and extend fabric lifespan. Always consult the sewn-in care label inside the garment neck or side seam as the primary authority."},

        {"type": "h1", "text": "2. Fabric-Specific Washing & Maintenance Protocols"},
        {"type": "table", "headers": ["Fabric Type", "Washing Method", "Water Temp", "Drying & Ironing Protocol"], "colWidths": [120, 130, 110, 180], "rows": [
            ["100% Combed Cotton", "Gentle machine wash inside-out", "Cold (30°C / 85°F)", "Tumble dry low or line dry in shade. Warm iron if needed."],
            ["Raw & Washed Denim", "Wash sparingly inside-out", "Cold water only", "Air dry flat away from direct sunlight. Do not tumble dry."],
            ["Wool & Knitwear", "Hand wash with wool detergent", "Lukewarm / Cold", "Gently press out water; dry flat on towel. Never hang."],
            ["Pure Linen", "Machine wash delicate cycle", "Cold / 30°C", "Hang damp to reduce creasing. Steam iron while slightly damp."],
            ["Synthetic / Performance", "Standard synthetic cycle", "Warm (30-40°C)", "Quick air drying. Low heat iron with protective press cloth."],
            ["Silk & Delicate Blends", "Dry clean or delicate hand wash", "Cold only", "Air dry flat. Iron inside-out on lowest silk heat setting."]
        ]},

        {"type": "h1", "text": "3. Golden Rules of Apparel Preservation"},
        {"type": "bullet", "text": "Never Use Chlorine Bleach: Bleaching agents weaken organic cellulose fibers, turning whites yellow and deteriorating fabric tensile strength."},
        {"type": "bullet", "text": "Wash Dark Garments Inside-Out: Prevents surface friction against other items and preserves saturated monochrome dye integrity."},
        {"type": "bullet", "text": "Store Knits Folded: Never hang heavy knit sweaters or cardigans on wire hangers, which causes shoulder bumps and stretched necklines."}
    ]
    build_pdf("11-product-care.pdf", "KB-DOC-011", "11. Product Care, Fabric Maintenance & Washing Guidelines", "PRODUCT_CARE", "1.0", sections)


def generate_doc_12():
    sections = [
        {"type": "h1", "text": "1. Comprehensive Frequently Asked Questions"},
        {"type": "p", "text": "This reference maps common natural language phrasing to authoritative store policies for rapid RAG intent matching:"},
        
        {"type": "h2", "text": "Returns, Refunds & Exchanges"},
        {"type": "p", "text": "<b>Q: Can I return or exchange a product if it doesn't fit?</b><br/>A: Yes. You may return or exchange unworn apparel with original tags intact within [STORE_RETURN_WINDOW_DAYS] calendar days of delivery via 'My Account' > 'Orders'."},
        {"type": "p", "text": "<b>Q: When will my refund be credited to my bank account?</b><br/>A: Once your returned item arrives at our warehouse and passes quality inspection, card/UPI refunds are credited in 5 to 7 business days."},
        {"type": "p", "text": "<b>Q: Can I return underwear or socks?</b><br/>A: No. Intimate apparel, underwear, and socks are non-returnable due to mandatory health and hygiene protocols."},

        {"type": "h2", "text": "Shipping & Order Tracking"},
        {"type": "p", "text": "<b>Q: How much does shipping cost, and how do I get free shipping?</b><br/>A: Standard domestic shipping is [SHIPPING_CHARGE]. Orders with a qualifying subtotal of [FREE_SHIPPING_THRESHOLD] or above automatically qualify for complimentary free delivery."},
        {"type": "p", "text": "<b>Q: How long will my order take to arrive?</b><br/>A: Deliveries to Tier-1 metro cities typically arrive within 3 to 5 business days. Other regions take 5 to 7 business days."},
        {"type": "p", "text": "<b>Q: Where is my tracking number?</b><br/>A: Tracking AWB links are emailed and sent via SMS immediately upon carrier handover, accessible under 'My Account' > 'Orders'."},

        {"type": "h2", "text": "Payments & Discounts"},
        {"type": "p", "text": "<b>Q: What payment options do you support?</b><br/>A: We accept all major Credit/Debit Cards, UPI (GPay, PhonePe, Paytm), Net Banking, and Cash on Delivery ([COD_AVAILABLE])."},
        {"type": "p", "text": "<b>Q: Why is my promo coupon not applying?</b><br/>A: Common reasons include expired validity, failing to meet the minimum order subtotal, or attempting to stack multiple promotional codes."}
    ]
    build_pdf("12-faq.pdf", "KB-DOC-012", "12. Comprehensive Frequently Asked Questions (FAQ)", "GENERAL_FAQ", "1.0", sections)


def generate_doc_13():
    sections = [
        {"type": "h1", "text": "1. Customer Support Channels & Response Times"},
        {"type": "p", "text": "At [STORE_NAME], we take pride in prompt, respectful, and accountable customer care. Our support infrastructure provides multiple escalation tiers:"},
        {"type": "bullet", "text": "Tier 1 - AI Store Assistant (24/7): Immediate automated answers for store policies, size guidance, and catalog search."},
        {"type": "bullet", "text": "Tier 2 - Human Support Live Reply: Administrators and support staff can review and reply directly into your live chat session."},
        {"type": "bullet", "text": "Tier 3 - Email Support Desk: Contact [SUPPORT_EMAIL] for formal order inquiries, billing reconciliations, and return approvals. Responses are delivered within [EMAIL_RESPONSE_HOURS] business hours."},
        {"type": "bullet", "text": "Tier 4 - Telephone Support: Call [SUPPORT_PHONE] during active support operating hours ([SUPPORT_HOURS])."},

        {"type": "h1", "text": "2. Issue Escalation & Resolution Workflows"},
        {"type": "bullet", "text": "Damaged or Defective Items: Report damaged items within 48 hours of delivery to [SUPPORT_EMAIL] with clear photos. We will arrange immediate complimentary doorstep replacement."},
        {"type": "bullet", "text": "Missing Items in Shipment: Notify support within 48 hours. Our warehouse security footage and carrier package weight logs will be audited to dispatch missing items promptly."},
        {"type": "bullet", "text": "Disputed Delivery Scenarios: If courier status marks 'Delivered' but you have not received your package, notify us within 24 hours to initiate a formal carrier geo-coordinate audit."}
    ]
    build_pdf("13-customer-support.pdf", "KB-DOC-013", "13. Customer Support Operations, SLAs & Escalation Protocol", "SUPPORT", "1.0", sections)


def generate_doc_14():
    sections = [
        {"type": "h1", "text": "1. Personal Data Collection & Utilization"},
        {"type": "p", "text": "[STORE_NAME] respects your privacy rights. We collect only the information necessary to fulfill apparel orders and provide seamless support:"},
        {"type": "bullet", "text": "Account Details: Name, email address, contact telephone, and encrypted password credentials."},
        {"type": "bullet", "text": "Delivery Data: Physical delivery addresses, postal codes, and courier delivery instructions."},
        {"type": "bullet", "text": "Transaction Data: Payment gateway reference tokens and invoice histories (raw card numbers are never stored)."},
        {"type": "bullet", "text": "AI Chat Dialogue Retention: Customer interactions with our RAG chatbot are securely logged in our PostgreSQL database to ensure quality control, resolve customer disputes, and identify knowledge base coverage gaps."},

        {"type": "h1", "text": "2. Data Retention & Customer Privacy Rights"},
        {"type": "bullet", "text": "Conversation Retention: Chat dialogues are retained according to our operational retention setting (default: 90 days)."},
        {"type": "bullet", "text": "Right of Access & Portability: Customers may request a copy of their stored account data by contacting [SUPPORT_EMAIL]."},
        {"type": "bullet", "text": "Right to Erasure: You may request complete deletion of your account and personal identifiers, subject to legal tax record retention requirements."}
    ]
    build_pdf("14-privacy-policy.pdf", "KB-DOC-014", "14. Customer Privacy Policy & Data Protection Governance", "PRIVACY", "1.0", sections)


def generate_doc_15():
    sections = [
        {"type": "h1", "text": "1. Store Terms of Service & Legal Framework"},
        {"type": "p", "text": "By accessing the [STORE_NAME] storefront and placing orders, you agree to these authoritative terms and conditions:"},
        {"type": "bullet", "text": "Accurate Product Representation: We strive to photograph garments in natural studio lighting. Subtle color variations may occur due to monitor calibration settings."},
        {"type": "bullet", "text": "Pricing Accuracy: Prices are displayed in [STORE_CURRENCY]. In the event of a technical pricing error on the storefront, [STORE_NAME] reserves the right to cancel unfulfilled orders with a prompt full refund."},
        {"type": "bullet", "text": "Order Acceptance: Order receipt emails acknowledge placement. A purchase contract is executed only upon courier parcel dispatch."},
        {"type": "bullet", "text": "Intellectual Property: All photography, editorial typography, brand assets, and web code are the exclusive intellectual property of [STORE_NAME]."},
        {"type": "bullet", "text": "Prohibited Conduct: Users may not engage in automated scraping, denial of service attacks, fraudulent return claims, or abuse of staff."}
    ]
    build_pdf("15-terms-and-conditions.pdf", "KB-DOC-015", "15. Store Terms and Conditions & Legal Agreement", "TERMS", "1.0", sections)


def generate_doc_16():
    sections = [
        {"type": "h1", "text": "1. Verified Sustainability & Packaging Practices"},
        {"type": "p", "text": "[STORE_NAME] believes in honest, uncompromised environmental transparency. We strictly adhere to verifiable sustainability initiatives and avoid unsubstantiated marketing greenwashing:"},
        {"type": "bullet", "text": "Recyclable Outer Packaging: All domestic orders dispatch in 100% recyclable, FSC-certified kraft paper mailers or corrugated cardboard boxes."},
        {"type": "bullet", "text": "Plastic Reduction: We have eliminated single-use bubble wraps and non-biodegradable packing peanuts across our fulfillment hubs."},
        {"type": "bullet", "text": "Built for Longevity: Our greatest contribution to sustainability is creating durable, heavyweight garments engineered to withstand years of laundering without premature disposal."},
        {"type": "callout", "text": "TRANSPARENCY NOTICE: If [STORE_NAME] has not third-party certified a specific organic yarn or carbon-neutral lifecycle metric, our AI chatbot will explicitly state that the metric is unverified rather than claiming unconfirmed eco-certifications."}
    ]
    build_pdf("16-sustainability.pdf", "KB-DOC-016", "16. Verified Environmental Sustainability & Packaging Standards", "SUSTAINABILITY", "1.0", sections)


def generate_doc_17():
    sections = [
        {"type": "h1", "text": "1. AI Chatbot Behavior & Operational Taxonomy"},
        {"type": "p", "text": "The [STORE_NAME] AI Assistant is an enterprise-grade customer support agent grounded in authoritative knowledge base documents and live PostgreSQL APIs. Every customer query is classified into one of 24 distinct categories:"},
        {"type": "bullet", "text": "Taxonomy Categories: STORE_INFO, PRODUCT_SEARCH, PRODUCT_DETAILS, PRODUCT_AVAILABILITY, PRODUCT_PRICE, SIZE_GUIDE, SHOPPING_HELP, CART, CHECKOUT, ORDER_STATUS, ORDER_CANCELLATION, SHIPPING, RETURNS, REFUNDS, EXCHANGES, PAYMENTS, COUPONS, ACCOUNT, WISHLIST, PRODUCT_CARE, PRIVACY, SUPPORT, GENERAL_FAQ, UNKNOWN."},

        {"type": "h1", "text": "2. The 10 Commandments of RAG Grounding"},
        {"type": "bullet", "text": "Rule 1: Always answer from retrieved knowledge base context or live database APIs."},
        {"type": "bullet", "text": "Rule 2: NEVER invent, hallucinate, or alter store policies."},
        {"type": "bullet", "text": "Rule 3: NEVER invent product attributes, colors, or specifications."},
        {"type": "bullet", "text": "Rule 4: NEVER invent customer order records or historical tracking states."},
        {"type": "bullet", "text": "Rule 5: NEVER invent product prices (must originate from live PostgreSQL records)."},
        {"type": "bullet", "text": "Rule 6: NEVER invent live inventory quantities (must originate from PostgreSQL stock counts)."},
        {"type": "bullet", "text": "Rule 7: NEVER invent guaranteed delivery dates (must state standard SLA transit ranges)."},
        {"type": "bullet", "text": "Rule 8: NEVER invent unauthorized coupon discounts."},
        {"type": "bullet", "text": "Rule 9: If context is absent, state: 'I couldn't find that information in our store knowledge base. Would you like me to connect you with a store support agent?'"},
        {"type": "bullet", "text": "Rule 10: Always cite source document name and page number for transparency."},

        {"type": "h1", "text": "3. Source Document Priority & Conflict Resolution"},
        {"type": "p", "text": "When resolving customer inquiries spanning multiple documents, the following strict hierarchy applies:"},
        {"type": "bullet", "text": "Priority 1 (Highest): Active Official Policy Documents (Returns, Shipping, Payments, Terms)."},
        {"type": "bullet", "text": "Priority 2: Official Product Documentation & Size Guide."},
        {"type": "bullet", "text": "Priority 3: Frequently Asked Questions (FAQ)."},
        {"type": "bullet", "text": "Priority 4: General Store Overview & Philosophy."},
        {"type": "p", "text": "Contradiction Rule: If two documents ever present conflicting policy statements, the active authoritative policy takes precedence. If ambiguity persists, the chatbot must invite the customer to speak with human support."}
    ]
    build_pdf("17-ai-chatbot-guide.pdf", "KB-DOC-017", "17. AI Chatbot Behavioral Architecture, Grounding Rules & Taxonomy", "AI_CHATBOT_BEHAVIOR", "1.0", sections)


def generate_all():
    print("Beginning generation of 17 authoritative Knowledge Base PDFs...")
    generate_doc_01()
    generate_doc_02()
    generate_doc_03()
    generate_doc_04()
    generate_doc_05()
    generate_doc_06()
    generate_doc_07()
    generate_doc_08()
    generate_doc_09()
    generate_doc_10()
    generate_doc_11()
    generate_doc_12()
    generate_doc_13()
    generate_doc_14()
    generate_doc_15()
    generate_doc_16()
    generate_doc_17()
    print("All 17 PDFs successfully generated in knowledge-base/!")

if __name__ == "__main__":
    generate_all()
