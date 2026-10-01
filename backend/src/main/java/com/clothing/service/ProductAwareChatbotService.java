package com.clothing.service;

import com.clothing.dto.ChatResponseDTO;
import com.clothing.dto.CitationSource;
import com.clothing.dto.ProductSearchDTO;
import com.clothing.dto.SearchResponseDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Service
public class ProductAwareChatbotService {

    private static final Logger log = LoggerFactory.getLogger(ProductAwareChatbotService.class);

    private final RagService ragService;
    private final AiService aiService;
    private final ProductSearchService productSearchService;

    private static final Set<String> PRODUCT_INTENT_KEYWORDS = Set.of(
            "product", "products", "shirt", "shirts", "tshirt", "tshirts", "tee", "shoes", "shoe",
            "footwear", "sneaker", "sneakers", "jeans", "pant", "pants", "trouser", "trousers",
            "watch", "watches", "black", "white", "blue", "red", "navy", "grey", "jacket",
            "hoodie", "show me", "do you have", "looking for", "buy", "price", "men", "women",
            "collection", "summer", "winter", "casual", "formal", "sports", "apparel"
    );

    private static final Set<String> KNOWLEDGE_INTENT_KEYWORDS = Set.of(
            "return", "returns", "refund", "refunds", "exchange", "replace", "shipping", "ship",
            "delivery", "deliver", "cod", "cash on delivery", "track", "tracking", "size",
            "sizes", "fit", "chart", "policy", "policies", "contact", "support", "payment"
    );

    public ProductAwareChatbotService(
            RagService ragService,
            AiService aiService,
            ProductSearchService productSearchService) {
        this.ragService = ragService;
        this.aiService = aiService;
        this.productSearchService = productSearchService;
    }

    /**
     * Processes customer chat message with intelligent intent routing.
     */
    public ChatResponseDTO processChat(String message) {
        if (message == null || message.isBlank()) {
            return new ChatResponseDTO("Please enter a question or search for clothing pieces.");
        }

        String lower = message.toLowerCase().trim();

        boolean hasKnowledgeIntent = containsAny(lower, KNOWLEDGE_INTENT_KEYWORDS);
        boolean hasProductIntent = containsAny(lower, PRODUCT_INTENT_KEYWORDS);

        // Case 1: Hybrid inquiry (e.g. "What is your return policy for black shirts?")
        if (hasKnowledgeIntent && hasProductIntent) {
            log.info("Handling HYBRID intent chat query: '{}'", message);
            List<RetrievedChunk> chunks = ragService.retrieveRelevantChunks(message, 3);
            AiService.GroundedResult grounded = aiService.generateGroundedAnswer(message, chunks);

            // Clean query for product search
            String productSubQuery = extractProductTerms(lower);
            SearchResponseDTO searchRes = productSearchService.search(
                    productSubQuery, null, null, null, null, null, null, null, null, 0, 3, "recommended"
            );

            return new ChatResponseDTO(
                    grounded.answer,
                    grounded.sources,
                    searchRes.getContent(),
                    "HYBRID"
            );
        }

        // Case 2: Pure Product Search inquiry (e.g. "Do you have navy blue casual shirts?", "show me white shoes")
        if (hasProductIntent && !hasKnowledgeIntent) {
            log.info("Handling PRODUCT_SEARCH intent chat query: '{}'", message);
            String productTerms = extractProductTerms(lower);
            SearchResponseDTO searchRes = productSearchService.search(
                    productTerms, null, null, null, null, null, null, null, null, 0, 4, "recommended"
            );

            List<ProductSearchDTO> products = searchRes.getContent();
            String answer;
            if (products.isEmpty() || searchRes.isFallback()) {
                answer = "I couldn't find exact pieces for '" + message + "', but here are some popular styles from our collection:";
            } else {
                answer = "Here are " + products.size() + " pieces matching your search:";
            }

            return new ChatResponseDTO(
                    answer,
                    new ArrayList<>(),
                    products,
                    "PRODUCT_SEARCH"
            );
        }

        // Case 3: Knowledge Base inquiry (e.g. "What is your return policy?", "How long does shipping take?")
        log.info("Handling KNOWLEDGE intent chat query: '{}'", message);
        List<RetrievedChunk> chunks = ragService.retrieveRelevantChunks(message, 4);
        AiService.GroundedResult grounded = aiService.generateGroundedAnswer(message, chunks);

        return new ChatResponseDTO(
                grounded.answer,
                grounded.sources,
                new ArrayList<>(),
                "KNOWLEDGE"
        );
    }

    private boolean containsAny(String text, Set<String> keywords) {
        for (String kw : keywords) {
            if (text.contains(kw)) {
                return true;
            }
        }
        return false;
    }

    private String extractProductTerms(String text) {
        return text.replace("do you have", "")
                   .replace("show me", "")
                   .replace("looking for", "")
                   .replace("i want", "")
                   .replace("can i buy", "")
                   .replace("what is the price of", "")
                   .replace("recommend", "")
                   .replace("please", "")
                   .replaceAll("[?!.,]", "")
                   .trim();
    }
}
