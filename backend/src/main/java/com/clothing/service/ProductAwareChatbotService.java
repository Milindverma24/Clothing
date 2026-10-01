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
    private final AiConversationService aiConversationService;

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
            ProductSearchService productSearchService,
            AiConversationService aiConversationService) {
        this.ragService = ragService;
        this.aiService = aiService;
        this.productSearchService = productSearchService;
        this.aiConversationService = aiConversationService;
    }

    public ChatResponseDTO processChat(String message) {
        return processChat(message, null, null, null, null);
    }

    /**
     * Processes customer chat message with intelligent intent routing and database-backed conversation history.
     */
    public ChatResponseDTO processChat(
            String message,
            Long conversationId,
            String sessionId,
            String userName,
            String userEmail) {

        long startTime = System.currentTimeMillis();

        if (message == null || message.isBlank()) {
            return new ChatResponseDTO("Please enter a question or search for clothing pieces.");
        }

        // 1. Resolve or establish conversation session
        com.clothing.entity.AiConversation conv = aiConversationService.getOrCreateConversation(
                conversationId, sessionId, userName, userEmail, message
        );

        String lower = message.toLowerCase().trim();

        boolean hasKnowledgeIntent = containsAny(lower, KNOWLEDGE_INTENT_KEYWORDS);
        boolean hasProductIntent = containsAny(lower, PRODUCT_INTENT_KEYWORDS);

        String answer;
        List<CitationSource> sources = new ArrayList<>();
        List<ProductSearchDTO> products = new ArrayList<>();
        String intent;
        String modelName = "local-rag-synthesizer";
        String errorStatus = null;

        // Case 1: Hybrid inquiry (e.g. "What is your return policy for black shirts?")
        if (hasKnowledgeIntent && hasProductIntent) {
            log.info("Handling HYBRID intent chat query: '{}'", message);
            intent = "HYBRID";
            List<RetrievedChunk> chunks = ragService.retrieveRelevantChunks(message, 3);
            AiService.GroundedResult grounded = aiService.generateGroundedAnswer(message, chunks);
            answer = grounded.answer;
            sources = grounded.sources;

            // Clean query for product search
            String productSubQuery = extractProductTerms(lower);
            SearchResponseDTO searchRes = productSearchService.search(
                    productSubQuery, null, null, null, null, null, null, null, null, 0, 3, "recommended"
            );
            products = searchRes.getContent();
        }
        // Case 2: Pure Product Search inquiry (e.g. "Do you have navy blue casual shirts?", "show me white shoes")
        else if (hasProductIntent && !hasKnowledgeIntent) {
            log.info("Handling PRODUCT_SEARCH intent chat query: '{}'", message);
            intent = "PRODUCT_SEARCH";
            String productTerms = extractProductTerms(lower);
            SearchResponseDTO searchRes = productSearchService.search(
                    productTerms, null, null, null, null, null, null, null, null, 0, 4, "recommended"
            );

            products = searchRes.getContent();
            if (products.isEmpty() || searchRes.isFallback()) {
                answer = "I couldn't find exact pieces for '" + message + "', but here are some popular styles from our collection:";
            } else {
                answer = "Here are " + products.size() + " pieces matching your search:";
            }
        }
        // Case 3: Knowledge Base inquiry (e.g. "What is your return policy?", "How long does shipping take?")
        else {
            log.info("Handling KNOWLEDGE intent chat query: '{}'", message);
            intent = "KNOWLEDGE";
            List<RetrievedChunk> chunks = ragService.retrieveRelevantChunks(message, 4);
            AiService.GroundedResult grounded = aiService.generateGroundedAnswer(message, chunks);
            answer = grounded.answer;
            sources = grounded.sources;

            if (chunks.isEmpty() || answer.toLowerCase().contains("couldn't find that information")) {
                errorStatus = "INSUFFICIENT_KNOWLEDGE_CONTEXT";
            }
        }

        long latencyMs = System.currentTimeMillis() - startTime;

        // 2. Persist conversational turn to PostgreSQL
        AiConversationService.TurnResult turn = aiConversationService.recordTurn(
                conv,
                message,
                answer,
                intent,
                sources,
                products,
                latencyMs,
                modelName,
                errorStatus
        );

        ChatResponseDTO responseDTO = new ChatResponseDTO(
                answer,
                sources,
                products,
                intent
        );
        responseDTO.setConversationId(turn.conversationId());
        responseDTO.setUserMessageId(turn.userMessageId());
        responseDTO.setMessageId(turn.assistantMessageId());
        responseDTO.setProcessingTimeMs(latencyMs);
        responseDTO.setModelName(modelName);

        return responseDTO;
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
