package com.clothing.config;

import com.clothing.entity.*;
import com.clothing.repository.*;
import com.clothing.service.DocumentProcessingService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.*;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.*;

@Component
public class DataLoader implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataLoader.class);

    private final ProductRepository productRepository;
    private final KnowledgeDocumentRepository knowledgeDocumentRepository;
    private final DocumentProcessingService documentProcessingService;
    private final AiConversationRepository conversationRepository;
    private final AiMessageRepository messageRepository;
    private final AiMessageSourceRepository sourceRepository;
    private final AiMessageProductRepository messageProductRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public DataLoader(
            ProductRepository productRepository,
            KnowledgeDocumentRepository knowledgeDocumentRepository,
            DocumentProcessingService documentProcessingService,
            AiConversationRepository conversationRepository,
            AiMessageRepository messageRepository,
            AiMessageSourceRepository sourceRepository,
            AiMessageProductRepository messageProductRepository) {
        this.productRepository = productRepository;
        this.knowledgeDocumentRepository = knowledgeDocumentRepository;
        this.documentProcessingService = documentProcessingService;
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
        this.sourceRepository = sourceRepository;
        this.messageProductRepository = messageProductRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        seedProducts();
        seedStarterKnowledgeBase();
        seedSampleConversations();
    }

    private void seedProducts() {
        if (productRepository.count() > 0) {
            log.info("Database already contains {} products. Skipping seeding.", productRepository.count());
            return;
        }

        log.info("Seeding fashion products from data/products.jsonl...");

        InputStream is = null;
        try {
            ClassPathResource resource = new ClassPathResource("data/products.jsonl");
            if (resource.exists()) {
                is = resource.getInputStream();
            } else {
                File file = new File("data/processed/products.jsonl");
                if (file.exists()) {
                    is = new FileInputStream(file);
                }
            }

            if (is == null) {
                log.warn("products.jsonl not found in classpath or filesystem. Skipping product seeding.");
                return;
            }

            List<Product> productsToSave = new ArrayList<>();
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(is))) {
                String line;
                int count = 0;
                while ((line = reader.readLine()) != null) {
                    if (line.trim().isEmpty()) continue;
                    JsonNode node = objectMapper.readTree(line);

                    Long extId = node.has("externalProductId") ? node.get("externalProductId").asLong() : (long) (10000 + count);
                    String name = node.has("name") ? node.get("name").asText() : "Fashion Item " + extId;
                    String gender = node.has("gender") ? node.get("gender").asText() : "Men";
                    String masterCat = node.has("masterCategory") ? node.get("masterCategory").asText() : "Apparel";
                    String subCat = node.has("subCategory") ? node.get("subCategory").asText() : "Topwear";
                    String articleType = node.has("articleType") ? node.get("articleType").asText() : "Shirts";
                    String baseColour = node.has("baseColour") ? node.get("baseColour").asText() : "Black";
                    String season = node.has("season") ? node.get("season").asText() : "Fall";
                    int releaseYear = node.has("releaseYear") ? node.get("releaseYear").asInt() : 2018;
                    String usage = node.has("usage") ? node.get("usage").asText() : "Casual";
                    String imageFileName = node.has("imageFileName") ? node.get("imageFileName").asText() : extId + ".jpg";

                    // Clean slug
                    String slugName = name.toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("^-+|-+$", "");
                    String slug = slugName + "-" + extId;

                    // Price logic
                    long basePriceVal;
                    if ("Footwear".equalsIgnoreCase(masterCat)) {
                        basePriceVal = 2499 + ((extId % 25) * 100);
                    } else if ("Accessories".equalsIgnoreCase(masterCat)) {
                        basePriceVal = 1199 + ((extId % 20) * 80);
                    } else if ("Personal Care".equalsIgnoreCase(masterCat)) {
                        basePriceVal = 799 + ((extId % 15) * 50);
                    } else {
                        basePriceVal = 1299 + ((extId % 30) * 50);
                    }
                    BigDecimal basePrice = BigDecimal.valueOf(basePriceVal);
                    BigDecimal compareAtPrice = BigDecimal.valueOf((long) (basePriceVal * 1.35));

                    // Badge
                    String badge = null;
                    if (extId % 6 == 0) badge = "SALE";
                    else if (extId % 8 == 0) badge = "NEW";
                    else if (extId % 11 == 0) badge = "BESTSELLER";

                    Product product = new Product();
                    product.setExternalProductId(extId);
                    product.setName(name);
                    product.setSlug(slug);
                    product.setDescription("Premium " + name + ". Engineered with ultra-soft, breathable materials and a tailored silhouette designed for versatile styling.");
                    product.setGender(gender);
                    product.setMasterCategory(masterCat);
                    product.setSubCategory(subCat);
                    product.setArticleType(articleType);
                    product.setBaseColour(baseColour);
                    product.setSeason(season);
                    product.setReleaseYear(releaseYear);
                    product.setUsageCategory(usage);
                    product.setBasePrice(basePrice);
                    product.setCompareAtPrice(compareAtPrice);
                    product.setStatus("ACTIVE");
                    product.setBadge(badge);
                    product.prepareSearchableContent();

                    // Product Image
                    ProductImage img = new ProductImage();
                    img.setProduct(product);
                    img.setImageUrl("/images/" + imageFileName);
                    img.setSortOrder(0);
                    product.getImages().add(img);

                    // Product Variants
                    List<String> sizes = "Footwear".equalsIgnoreCase(masterCat)
                            ? List.of("UK 7", "UK 8", "UK 9", "UK 10", "UK 11")
                            : "Accessories".equalsIgnoreCase(masterCat)
                            ? List.of("One Size")
                            : List.of("S", "M", "L", "XL", "XXL");

                    for (String size : sizes) {
                        ProductVariant v = new ProductVariant();
                        v.setProduct(product);
                        v.setSku(extId + "-" + size.replaceAll("\\s+", ""));
                        v.setSize(size);
                        v.setColor(baseColour);
                        v.setPrice(basePrice);
                        v.setStock(20);
                        v.setStatus("ACTIVE");
                        product.getVariants().add(v);
                    }

                    productsToSave.add(product);
                    count++;
                }
            }

            productRepository.saveAll(productsToSave);
            log.info("Successfully seeded {} fashion products into database!", productsToSave.size());

        } catch (Exception e) {
            log.error("Failed to seed fashion products", e);
        }
    }

    private void seedStarterKnowledgeBase() {
        if (knowledgeDocumentRepository.count() > 0) {
            log.info("Knowledge Base already contains {} documents. Skipping seed.", knowledgeDocumentRepository.count());
            return;
        }

        log.info("Generating starter knowledge base PDF documents (Return Policy, Size Guide, Shipping Policy)...");

        try {
            Path uploadDir = Paths.get("uploads", "knowledge-base");
            Files.createDirectories(uploadDir);

            // 1. Return & Refund Policy PDF
            createAndIngestPdf(
                    uploadDir,
                    "return-and-refund-policy.pdf",
                    "CLOTHING BRAND - OFFICIAL RETURN & REFUND POLICY",
                    List.of(
                            "1. Return Eligibility: Products can be returned within 7 days of delivery. Items must be in their original condition, unworn, unwashed, and with all brand tags and original packaging attached.",
                            "2. Non-Returnable Items: Undergarments, personal care products, socks, and final sale items cannot be returned for hygiene and safety reasons.",
                            "3. Refund Processing: Refunds are initiated within 48 hours once the returned package is received and inspected at our fulfillment center. The amount is credited back to the original payment method within 5-7 business days.",
                            "4. Damaged or Defective Items: If you receive a damaged or incorrect piece, contact customer support within 48 hours with order details and photos. We will arrange a free immediate replacement."
                    )
            );

            // 2. Shipping & Delivery Policy PDF
            createAndIngestPdf(
                    uploadDir,
                    "shipping-and-delivery-guide.pdf",
                    "CLOTHING BRAND - SHIPPING & DELIVERY INFORMATION",
                    List.of(
                            "1. Domestic Shipping: Standard delivery takes 3 to 5 business days across all major metropolitan cities in India. Remote locations may take up to 7 business days.",
                            "2. Shipping Fees: Standard shipping is complimentary on all orders exceeding INR 1,999. Orders below this threshold incur a flat shipping fee of INR 99.",
                            "3. Order Tracking: As soon as your order is dispatched, an SMS and email notification with an active tracking link is provided.",
                            "4. Cash on Delivery (COD): Available for domestic orders up to INR 10,000. COD orders undergo automated OTP verification."
                    )
            );

            // 3. Garment Size & Fit Guide PDF
            createAndIngestPdf(
                    uploadDir,
                    "garment-size-and-fit-guide.pdf",
                    "CLOTHING BRAND - COMPREHENSIVE SIZE & FIT GUIDE",
                    List.of(
                            "1. Men's Tops: Size S (Chest 36-38 inches), Size M (Chest 38-40 inches), Size L (Chest 40-42 inches), Size XL (Chest 42-44 inches), Size XXL (Chest 44-46 inches).",
                            "2. Men's Bottoms: Size S corresponds to waist 30, M corresponds to waist 32, L corresponds to waist 34, XL corresponds to waist 36.",
                            "3. Women's Apparel: Size S (Bust 32-34 inches), Size M (Bust 34-36 inches), Size L (Bust 36-38 inches), Size XL (Bust 38-40 inches).",
                            "4. Fit Profiles: 'Oversized' pieces are deliberately cut with dropped shoulders and relaxed body volume. If you prefer a tailored fit, we recommend ordering one size down."
                    )
            );

        } catch (Exception e) {
            log.error("Failed to seed starter knowledge base documents", e);
        }
    }

    private void createAndIngestPdf(Path uploadDir, String fileName, String title, List<String> paragraphs) {
        try {
            Path pdfPath = uploadDir.resolve(fileName);
            try (PDDocument document = new PDDocument()) {
                PDPage page = new PDPage();
                document.addPage(page);

                try (PDPageContentStream cs = new PDPageContentStream(document, page)) {
                    cs.beginText();
                    cs.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 14);
                    cs.newLineAtOffset(50, 720);
                    cs.showText(title);
                    cs.endText();

                    float y = 670;
                    for (String p : paragraphs) {
                        cs.beginText();
                        cs.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 10);
                        cs.newLineAtOffset(50, y);

                        // Simple line-wrapping
                        if (p.length() > 95) {
                            String line1 = p.substring(0, 95);
                            String line2 = p.substring(95);
                            cs.showText(line1);
                            cs.endText();
                            y -= 14;
                            cs.beginText();
                            cs.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA), 10);
                            cs.newLineAtOffset(50, y);
                            cs.showText(line2);
                        } else {
                            cs.showText(p);
                        }
                        cs.endText();
                        y -= 28;
                    }
                }

                document.save(pdfPath.toFile());
            }

            // Ingest into RAG system
            File file = pdfPath.toFile();
            KnowledgeDocument doc = new KnowledgeDocument();
            doc.setOriginalFileName(fileName);
            doc.setStoragePath(pdfPath.toString());
            doc.setMimeType("application/pdf");
            doc.setFileSize(file.length());
            doc.setStatus("PROCESSING");
            doc.setUploadedBy("SYSTEM_SEED");
            doc = knowledgeDocumentRepository.save(doc);

            // Trigger sync ingestion for seed
            documentProcessingService.processDocumentSync(doc.getId(), file);

        } catch (Exception e) {
            log.error("Error creating/ingesting seed PDF: " + fileName, e);
        }
    }

    private void seedSampleConversations() {
        if (conversationRepository.count() > 0) {
            log.info("Database already contains {} AI conversations. Skipping conversation seeding.", conversationRepository.count());
            return;
        }

        log.info("Seeding realistic sample AI conversations for Admin Monitoring...");

        try {
            // 1. Conversation: Milind Verma (Return policy question with RAG source)
            AiConversation conv1 = new AiConversation();
            conv1.setSessionId("sess-mv-001");
            conv1.setUserName("Milind Verma");
            conv1.setUserEmail("milind@example.com");
            conv1.setTitle("Return Policy & Eligibility Inquiry");
            conv1.setStatus("ACTIVE");
            conv1.setStartedAt(LocalDateTime.now().minusMinutes(25));
            conv1.setLastActivityAt(LocalDateTime.now().minusMinutes(12));
            conv1.setMessageCount(4);
            conv1.setRagQueriesCount(2);
            conv1.setProductSearchesCount(0);
            conv1.setHasUnanswered(false);
            conv1 = conversationRepository.save(conv1);

            AiMessage m1 = new AiMessage();
            m1.setConversation(conv1);
            m1.setSenderType("USER");
            m1.setContent("What is your return policy?");
            m1.setIntent("KNOWLEDGE");
            m1.setSequenceNumber(1);
            m1.setCreatedAt(LocalDateTime.now().minusMinutes(25));
            messageRepository.save(m1);

            AiMessage m2 = new AiMessage();
            m2.setConversation(conv1);
            m2.setSenderType("ASSISTANT");
            m2.setContent("According to our Return & Refund Policy, you can return eligible products within 7 days of delivery. Items must be in their original condition, unworn, unwashed, and with all brand tags and packaging attached.");
            m2.setIntent("KNOWLEDGE");
            m2.setModelName("gemini-1.5-flash");
            m2.setProcessingTimeMs(742L);
            m2.setIsHelpful(true);
            m2.setSequenceNumber(2);
            m2.setCreatedAt(LocalDateTime.now().minusMinutes(24));
            m2 = messageRepository.save(m2);

            AiMessageSource s1 = new AiMessageSource("return-and-refund-policy.pdf", 1, 0.94, "Return Eligibility: Products can be returned within 7 days of delivery. Items must be in their original condition...");
            s1.setMessage(m2);
            sourceRepository.save(s1);

            AiMessage m3 = new AiMessage();
            m3.setConversation(conv1);
            m3.setSenderType("USER");
            m3.setContent("Can I return sale or clearance items?");
            m3.setIntent("KNOWLEDGE");
            m3.setSequenceNumber(3);
            m3.setCreatedAt(LocalDateTime.now().minusMinutes(15));
            messageRepository.save(m3);

            AiMessage m4 = new AiMessage();
            m4.setConversation(conv1);
            m4.setSenderType("ASSISTANT");
            m4.setContent("Non-Returnable Items include undergarments, personal care items, socks, and final sale items for hygiene and safety reasons.");
            m4.setIntent("KNOWLEDGE");
            m4.setModelName("gemini-1.5-flash");
            m4.setProcessingTimeMs(680L);
            m4.setIsHelpful(true);
            m4.setSequenceNumber(4);
            m4.setCreatedAt(LocalDateTime.now().minusMinutes(12));
            m4 = messageRepository.save(m4);

            AiMessageSource s2 = new AiMessageSource("return-and-refund-policy.pdf", 1, 0.91, "Non-Returnable Items: Undergarments, personal care products, socks, and final sale items cannot be returned...");
            s2.setMessage(m4);
            sourceRepository.save(s2);

            // 2. Conversation: John Doe (Product search with live items)
            AiConversation conv2 = new AiConversation();
            conv2.setSessionId("sess-jd-002");
            conv2.setUserName("John Doe");
            conv2.setUserEmail("john.doe@gmail.com");
            conv2.setTitle("Men's Black Casual Shirts Discovery");
            conv2.setStatus("ACTIVE");
            conv2.setStartedAt(LocalDateTime.now().minusHours(1));
            conv2.setLastActivityAt(LocalDateTime.now().minusMinutes(42));
            conv2.setMessageCount(2);
            conv2.setRagQueriesCount(0);
            conv2.setProductSearchesCount(1);
            conv2.setHasUnanswered(false);
            conv2 = conversationRepository.save(conv2);

            AiMessage m2_1 = new AiMessage();
            m2_1.setConversation(conv2);
            m2_1.setSenderType("USER");
            m2_1.setContent("Show me black shirts for men");
            m2_1.setIntent("PRODUCT_SEARCH");
            m2_1.setSequenceNumber(1);
            m2_1.setCreatedAt(LocalDateTime.now().minusHours(1));
            messageRepository.save(m2_1);

            AiMessage m2_2 = new AiMessage();
            m2_2.setConversation(conv2);
            m2_2.setSenderType("ASSISTANT");
            m2_2.setContent("Here are 3 black casual tops matching your search:");
            m2_2.setIntent("PRODUCT_SEARCH");
            m2_2.setModelName("gemini-1.5-flash");
            m2_2.setProcessingTimeMs(415L);
            m2_2.setIsHelpful(true);
            m2_2.setSequenceNumber(2);
            m2_2.setCreatedAt(LocalDateTime.now().minusMinutes(42));
            m2_2 = messageRepository.save(m2_2);

            AiMessageProduct p1 = new AiMessageProduct(300L, 11143L, "Scullers Men Price Catch Black Shirts", "scullers-men-price-catch-black-shirts-11143", 1.0, new BigDecimal("1949"), "/images/11143.jpg");
            p1.setMessage(m2_2);
            messageProductRepository.save(p1);

            AiMessageProduct p2 = new AiMessageProduct(92L, 5865L, "ADIDAS Men's Twelve Faster T-shirt", "adidas-men-s-twelve-faster-t-shirt-5865", 0.95, new BigDecimal("2049"), "/images/5865.jpg");
            p2.setMessage(m2_2);
            messageProductRepository.save(p2);

            // 3. Conversation: Sarah Chen (Unanswered question - knowledge gap)
            AiConversation conv3 = new AiConversation();
            conv3.setSessionId("sess-sc-003");
            conv3.setUserName("Sarah Chen");
            conv3.setUserEmail("sarah.c@techcorp.io");
            conv3.setTitle("International Delivery Options");
            conv3.setStatus("ACTIVE");
            conv3.setStartedAt(LocalDateTime.now().minusHours(2));
            conv3.setLastActivityAt(LocalDateTime.now().minusHours(2));
            conv3.setMessageCount(2);
            conv3.setRagQueriesCount(1);
            conv3.setProductSearchesCount(0);
            conv3.setHasUnanswered(true);
            conv3 = conversationRepository.save(conv3);

            AiMessage m3_1 = new AiMessage();
            m3_1.setConversation(conv3);
            m3_1.setSenderType("USER");
            m3_1.setContent("Do you offer international delivery to Canada?");
            m3_1.setIntent("KNOWLEDGE");
            m3_1.setSequenceNumber(1);
            m3_1.setCreatedAt(LocalDateTime.now().minusHours(2));
            messageRepository.save(m3_1);

            AiMessage m3_2 = new AiMessage();
            m3_2.setConversation(conv3);
            m3_2.setSenderType("ASSISTANT");
            m3_2.setContent("I couldn't find that information in our official knowledge base. Our shipping policy currently outlines domestic deliveries across India taking 3 to 5 business days.");
            m3_2.setIntent("KNOWLEDGE");
            m3_2.setModelName("gemini-1.5-flash");
            m3_2.setProcessingTimeMs(820L);
            m3_2.setErrorStatus("INSUFFICIENT_KNOWLEDGE_CONTEXT");
            m3_2.setIsHelpful(false);
            m3_2.setFeedbackComment("Need shipping info for international customers");
            m3_2.setSequenceNumber(2);
            m3_2.setCreatedAt(LocalDateTime.now().minusHours(2));
            messageRepository.save(m3_2);

            // 4. Conversation: Alex Smith (Size Guide Inquiry)
            AiConversation conv4 = new AiConversation();
            conv4.setSessionId("sess-as-004");
            conv4.setUserName("Alex Smith");
            conv4.setUserEmail("alex.smith@lifestyle.com");
            conv4.setTitle("Garment Sizing Guidance");
            conv4.setStatus("CLOSED");
            conv4.setStartedAt(LocalDateTime.now().minusDays(1));
            conv4.setLastActivityAt(LocalDateTime.now().minusDays(1).plusMinutes(10));
            conv4.setMessageCount(2);
            conv4.setRagQueriesCount(1);
            conv4.setProductSearchesCount(0);
            conv4.setHasUnanswered(false);
            conv4 = conversationRepository.save(conv4);

            AiMessage m4_1 = new AiMessage();
            m4_1.setConversation(conv4);
            m4_1.setSenderType("USER");
            m4_1.setContent("How does your sizing run for shirts?");
            m4_1.setIntent("KNOWLEDGE");
            m4_1.setSequenceNumber(1);
            m4_1.setCreatedAt(LocalDateTime.now().minusDays(1));
            messageRepository.save(m4_1);

            AiMessage m4_2 = new AiMessage();
            m4_2.setConversation(conv4);
            m4_2.setSenderType("ASSISTANT");
            m4_2.setContent("According to our Garment Size & Fit Guide, our tailored cuts run true to standard measurements. For an oversized relaxed drape, we recommend ordering one size up.");
            m4_2.setIntent("KNOWLEDGE");
            m4_2.setModelName("gemini-1.5-flash");
            m4_2.setProcessingTimeMs(695L);
            m4_2.setIsHelpful(true);
            m4_2.setSequenceNumber(2);
            m4_2.setCreatedAt(LocalDateTime.now().minusDays(1).plusMinutes(1));
            m4_2 = messageRepository.save(m4_2);

            AiMessageSource s4 = new AiMessageSource("garment-size-and-fit-guide.pdf", 1, 0.95, "Sizing Standards: Our garments are engineered around a modern athletic silhouette...");
            s4.setMessage(m4_2);
            sourceRepository.save(s4);

            log.info("Successfully seeded 4 sample AI conversations with RAG sources, products, and feedback.");

        } catch (Exception e) {
            log.error("Error seeding sample AI conversations: ", e);
        }
    }
}

