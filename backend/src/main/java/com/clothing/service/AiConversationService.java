package com.clothing.service;

import com.clothing.dto.*;
import com.clothing.entity.AiConversation;
import com.clothing.entity.AiMessage;
import com.clothing.entity.AiMessageProduct;
import com.clothing.entity.AiMessageSource;
import com.clothing.exception.ResourceNotFoundException;
import com.clothing.repository.AiConversationRepository;
import com.clothing.repository.AiMessageProductRepository;
import com.clothing.repository.AiMessageRepository;
import com.clothing.repository.AiMessageSourceRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AiConversationService {

    private static final Logger log = LoggerFactory.getLogger(AiConversationService.class);

    private final AiConversationRepository conversationRepository;
    private final AiMessageRepository messageRepository;
    private final AiMessageSourceRepository sourceRepository;
    private final AiMessageProductRepository productRepository;

    public AiConversationService(
            AiConversationRepository conversationRepository,
            AiMessageRepository messageRepository,
            AiMessageSourceRepository sourceRepository,
            AiMessageProductRepository productRepository) {
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
        this.sourceRepository = sourceRepository;
        this.productRepository = productRepository;
    }

    /**
     * Resolves an existing active conversation or creates a new one.
     */
    @Transactional
    public AiConversation getOrCreateConversation(
            Long conversationId,
            String sessionId,
            String userName,
            String userEmail,
            String firstMessage) {

        if (conversationId != null) {
            Optional<AiConversation> existing = conversationRepository.findById(conversationId);
            if (existing.isPresent()) {
                AiConversation conv = existing.get();
                if (userName != null && !userName.isBlank()) conv.setUserName(userName);
                if (userEmail != null && !userEmail.isBlank()) conv.setUserEmail(userEmail);
                return conv;
            }
        }

        if (sessionId != null && !sessionId.isBlank()) {
            Optional<AiConversation> existingSession = conversationRepository.findBySessionId(sessionId);
            if (existingSession.isPresent()) {
                AiConversation conv = existingSession.get();
                if ("ACTIVE".equalsIgnoreCase(conv.getStatus())) {
                    if (userName != null && !userName.isBlank()) conv.setUserName(userName);
                    if (userEmail != null && !userEmail.isBlank()) conv.setUserEmail(userEmail);
                    return conv;
                }
            }
        }

        // Create a new conversation
        AiConversation newConv = new AiConversation();
        newConv.setSessionId(sessionId != null && !sessionId.isBlank() ? sessionId : UUID.randomUUID().toString());
        newConv.setUserName(userName != null && !userName.isBlank() ? userName : "Customer #" + (int)(Math.random() * 9000 + 1000));
        newConv.setUserEmail(userEmail);
        newConv.setStatus("ACTIVE");
        newConv.setStartedAt(LocalDateTime.now());
        newConv.setLastActivityAt(LocalDateTime.now());

        // Derive informative title from query
        String title = deriveTitle(firstMessage);
        newConv.setTitle(title);

        return conversationRepository.save(newConv);
    }

    /**
     * Records an entire user + assistant conversational turn with RAG sources and product references.
     */
    @Transactional
    public TurnResult recordTurn(
            AiConversation conv,
            String userText,
            String assistantAnswer,
            String intent,
            List<CitationSource> sources,
            List<ProductSearchDTO> products,
            long latencyMs,
            String modelName,
            String errorStatus) {

        int currentSeq = conv.getMessages().size();

        // 1. User Message
        AiMessage userMsg = new AiMessage();
        userMsg.setConversation(conv);
        userMsg.setSenderType("USER");
        userMsg.setContent(userText);
        userMsg.setIntent(intent);
        userMsg.setSequenceNumber(currentSeq + 1);
        userMsg.setCreatedAt(LocalDateTime.now());
        userMsg = messageRepository.save(userMsg);

        // 2. Assistant Message
        AiMessage assistantMsg = new AiMessage();
        assistantMsg.setConversation(conv);
        assistantMsg.setSenderType("ASSISTANT");
        assistantMsg.setContent(assistantAnswer);
        assistantMsg.setIntent(intent);
        assistantMsg.setModelName(modelName != null ? modelName : "local-rag-synthesizer");
        assistantMsg.setProcessingTimeMs(latencyMs);
        assistantMsg.setSequenceNumber(currentSeq + 2);
        assistantMsg.setCreatedAt(LocalDateTime.now().plusNanos(500_000)); // slight millisecond offset for ordering

        boolean isUnanswered = (errorStatus != null && !errorStatus.isBlank()) ||
                (assistantAnswer != null && assistantAnswer.toLowerCase().contains("couldn't find that information"));

        if (isUnanswered) {
            assistantMsg.setErrorStatus(errorStatus != null ? errorStatus : "INSUFFICIENT_KNOWLEDGE_CONTEXT");
            conv.setHasUnanswered(true);
        }

        assistantMsg = messageRepository.save(assistantMsg);

        // 3. Attach RAG Sources
        if (sources != null && !sources.isEmpty()) {
            for (CitationSource src : sources) {
                String docName = (src.getDocumentName() != null && !src.getDocumentName().isBlank())
                        ? src.getDocumentName().trim()
                        : "Store Policy Document";
                AiMessageSource sourceEntity = new AiMessageSource(
                        docName,
                        src.getPageNumber() != null ? src.getPageNumber() : 1,
                        0.90, // similarity score default
                        src.getSnippet() != null ? src.getSnippet() : ""
                );
                sourceEntity.setMessage(assistantMsg);
                sourceRepository.save(sourceEntity);
            }
            conv.setRagQueriesCount(conv.getRagQueriesCount() + 1);
        }

        // 4. Attach Product References
        if (products != null && !products.isEmpty()) {
            for (ProductSearchDTO prod : products) {
                AiMessageProduct productEntity = new AiMessageProduct(
                        prod.getId(),
                        prod.getExternalProductId(),
                        prod.getName(),
                        prod.getSlug(),
                        1.0,
                        prod.getBasePrice(),
                        prod.getImageUrl()
                );
                productEntity.setMessage(assistantMsg);
                productRepository.save(productEntity);
            }
            conv.setProductSearchesCount(conv.getProductSearchesCount() + 1);
        }

        // 5. Update Conversation metadata
        conv.setMessageCount(conv.getMessageCount() + 2);
        conv.setLastActivityAt(LocalDateTime.now());
        conv.setUpdatedAt(LocalDateTime.now());
        conversationRepository.save(conv);

        return new TurnResult(conv.getId(), userMsg.getId(), assistantMsg.getId());
    }

    /**
     * Submits user feedback (thumbs up / down) on an assistant message.
     */
    @Transactional
    public void recordFeedback(Long messageId, boolean helpful, String comment) {
        AiMessage message = messageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("AiMessage", "id", messageId));

        message.setIsHelpful(helpful);
        if (comment != null && !comment.isBlank()) {
            message.setFeedbackComment(comment);
        }
        messageRepository.save(message);
        log.info("Recorded feedback for message {}: helpful={}", messageId, helpful);
    }

    /**
     * Retrieves paginated conversations with multi-criteria filtering for Admin.
     */
    @Transactional(readOnly = true)
    public Page<AiConversationSummaryDTO> getConversations(
            String search,
            String status,
            String intent,
            String dateRange,
            int page,
            int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("lastActivityAt").descending());

        LocalDateTime startDate = null;
        LocalDateTime endDate = null;

        if (dateRange != null && !dateRange.isBlank() && !"ALL".equalsIgnoreCase(dateRange)) {
            LocalDate today = LocalDate.now();
            switch (dateRange.toLowerCase()) {
                case "today" -> {
                    startDate = today.atStartOfDay();
                    endDate = today.atTime(LocalTime.MAX);
                }
                case "yesterday" -> {
                    startDate = today.minusDays(1).atStartOfDay();
                    endDate = today.minusDays(1).atTime(LocalTime.MAX);
                }
                case "7days" -> startDate = today.minusDays(7).atStartOfDay();
                case "30days" -> startDate = today.minusDays(30).atStartOfDay();
            }
        }

        String searchFilter = (search != null && !search.isBlank()) ? search.trim() : null;
        String statusFilter = (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status)) ? status.trim() : null;

        Page<AiConversation> pageResult = conversationRepository.searchConversations(
                statusFilter,
                null,
                startDate,
                endDate,
                searchFilter,
                pageable
        );

        return pageResult.map(this::mapToSummaryDTO);
    }

    /**
     * Retrieves conversations strictly scoped to the authenticated customer.
     */
    @Transactional(readOnly = true)
    public List<AiConversationSummaryDTO> getUserConversations(Long userId) {
        if (userId == null) {
            return Collections.emptyList();
        }
        List<AiConversation> convs = conversationRepository.findByUserIdOrderByLastActivityAtDesc(userId);
        return convs.stream().map(this::mapToSummaryDTO).collect(Collectors.toList());
    }

    /**
     * Retrieves full conversation transcript, sources, and product recommendations.
     */
    @Transactional(readOnly = true)
    public AiConversationDetailDTO getConversationDetail(Long id) {
        AiConversation conv = conversationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("AiConversation", "id", id));

        AiConversationDetailDTO detail = new AiConversationDetailDTO();
        detail.setId(conv.getId());
        detail.setUserId(conv.getUserId());
        detail.setSessionId(conv.getSessionId());
        detail.setUserName(conv.getUserName());
        detail.setUserEmail(conv.getUserEmail());
        detail.setTitle(conv.getTitle());
        detail.setStatus(conv.getStatus());
        detail.setStartedAt(conv.getStartedAt());
        detail.setLastActivityAt(conv.getLastActivityAt());
        detail.setMessageCount(conv.getMessageCount());
        detail.setRagQueriesCount(conv.getRagQueriesCount());
        detail.setProductSearchesCount(conv.getProductSearchesCount());
        detail.setHasUnanswered(conv.getHasUnanswered());
        detail.setCreatedAt(conv.getCreatedAt());
        detail.setUpdatedAt(conv.getUpdatedAt());

        List<AiMessage> messages = messageRepository.findByConversationIdOrderBySequenceNumberAsc(id);
        List<AiMessageDTO> messageDTOs = messages.stream().map(this::mapToMessageDTO).collect(Collectors.toList());
        detail.setMessages(messageDTOs);

        List<AiMessageSource> sources = sourceRepository.findByConversationId(id);
        detail.setAllSources(sources.stream().map(this::mapToSourceDTO).collect(Collectors.toList()));

        List<AiMessageProduct> products = productRepository.findByConversationId(id);
        detail.setAllProducts(products.stream().map(this::mapToProductDTO).collect(Collectors.toList()));

        return detail;
    }

    /**
     * Sends an admin/support agent response directly into the conversation.
     * This allows a human agent to answer questions that RAG could not answer,
     * or take over and chat with the customer in real-time.
     */
    @Transactional
    public AiMessageDTO sendAdminReply(Long conversationId, String adminMessage, String adminName) {
        AiConversation conv = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("AiConversation", "id", conversationId));

        int nextSeq = conv.getMessageCount() + 1;

        AiMessage msg = new AiMessage();
        msg.setConversation(conv);
        msg.setSenderType("AGENT");
        msg.setContent(adminMessage);
        msg.setIntent("HUMAN_AGENT_REPLY");
        msg.setModelName(adminName != null && !adminName.isBlank() ? adminName : "Store Support Agent");
        msg.setProcessingTimeMs(0L);
        msg.setSequenceNumber(nextSeq);
        msg.setCreatedAt(LocalDateTime.now());

        AiMessage saved = messageRepository.save(msg);

        conv.setMessageCount(nextSeq);
        conv.setLastActivityAt(LocalDateTime.now());
        conv.setHasUnanswered(false); // human intervention answers the knowledge gap
        conv.setStatus("ACTIVE");
        conversationRepository.save(conv);

        return mapToMessageDTO(saved);
    }

    /**
     * Retrieves unanswered questions where AI had insufficient context or failed.
     */
    @Transactional(readOnly = true)
    public Page<UnansweredQuestionDTO> getUnansweredQuestions(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<AiMessage> messages = messageRepository.findUnansweredQuestions(pageable);

        return messages.map(msg -> {
            AiConversation conv = msg.getConversation();
            // Try to find the preceding user question
            String question = "Inquiry";
            List<AiMessage> convMessages = messageRepository.findByConversationIdOrderBySequenceNumberAsc(conv.getId());
            for (int i = 0; i < convMessages.size(); i++) {
                if (convMessages.get(i).getId().equals(msg.getId()) && i > 0) {
                    question = convMessages.get(i - 1).getContent();
                    break;
                }
            }

            return new UnansweredQuestionDTO(
                    msg.getId(),
                    conv.getId(),
                    conv.getUserName(),
                    conv.getUserEmail(),
                    question,
                    msg.getContent(),
                    msg.getErrorStatus() != null ? msg.getErrorStatus() : "No relevant information found in knowledge base.",
                    msg.getCreatedAt()
            );
        });
    }

    /**
     * Aggregates AI conversation analytics and operational observability metrics.
     */
    @Transactional(readOnly = true)
    public AiConversationStatsDTO getStats() {
        AiConversationStatsDTO stats = new AiConversationStatsDTO();

        long total = conversationRepository.count();
        stats.setTotalConversations(total);

        LocalDateTime startOfToday = LocalDate.now().atStartOfDay();
        stats.setTodayConversations(conversationRepository.countByStartedAtAfter(startOfToday));
        stats.setActiveConversations(conversationRepository.countByStatus("ACTIVE"));
        stats.setUnansweredCount(conversationRepository.countByHasUnansweredTrue());

        stats.setTotalMessages(conversationRepository.sumTotalMessages());
        stats.setTotalRagQueries(conversationRepository.sumTotalRagQueries());
        stats.setTotalProductSearches(conversationRepository.sumTotalProductSearches());

        double avgMsg = total > 0 ? (double) stats.getTotalMessages() / total : 0.0;
        stats.setAvgMessagesPerConversation(Math.round(avgMsg * 10.0) / 10.0);

        double avgLatency = messageRepository.findAverageProcessingTimeMs();
        stats.setAvgResponseLatencyMs(Math.round(avgLatency));

        long helpful = messageRepository.countByIsHelpfulTrue();
        long notHelpful = messageRepository.countByIsHelpfulFalse();
        stats.setHelpfulCount(helpful);
        stats.setNotHelpfulCount(notHelpful);
        long totalRated = helpful + notHelpful;
        double satRate = totalRated > 0 ? ((double) helpful / totalRated) * 100.0 : 100.0;
        stats.setSatisfactionRate(Math.round(satRate * 10.0) / 10.0);

        // Intent breakdown
        Map<String, Long> intents = new HashMap<>();
        for (Object[] row : messageRepository.countByIntentGroup()) {
            if (row[0] != null) {
                intents.put((String) row[0], (Long) row[1]);
            }
        }
        stats.setIntentBreakdown(intents);

        // Top cited documents
        List<Map<String, Object>> topDocs = new ArrayList<>();
        for (Object[] row : sourceRepository.findTopCitedDocuments()) {
            topDocs.add(Map.of("documentName", row[0], "citations", row[1]));
            if (topDocs.size() >= 5) break;
        }
        stats.setTopCitedDocuments(topDocs);

        // Top recommended products
        List<Map<String, Object>> topProducts = new ArrayList<>();
        for (Object[] row : productRepository.findMostRecommendedProducts()) {
            topProducts.add(Map.of("productName", row[0], "recommendations", row[1]));
            if (topProducts.size() >= 5) break;
        }
        stats.setTopRecommendedProducts(topProducts);

        return stats;
    }

    /**
     * Updates conversation status (e.g. ARCHIVED or CLOSED).
     */
    @Transactional
    public void updateStatus(Long id, String status) {
        AiConversation conv = conversationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("AiConversation", "id", id));
        conv.setStatus(status.toUpperCase());
        conv.setUpdatedAt(LocalDateTime.now());
        conversationRepository.save(conv);
        log.info("Updated conversation {} status to {}", id, status);
    }

    /**
     * Generates an export payload for a conversation in JSON or CSV.
     */
    @Transactional(readOnly = true)
    public String exportConversation(Long id, String format) {
        AiConversationDetailDTO detail = getConversationDetail(id);

        if ("csv".equalsIgnoreCase(format)) {
            StringBuilder csv = new StringBuilder();
            csv.append("Sequence,Timestamp,Sender,Content,Intent,LatencyMs,Sources\n");
            for (AiMessageDTO msg : detail.getMessages()) {
                String sourceNames = msg.getSources().stream()
                        .map(s -> s.getDocumentName() + " (p." + s.getPageNumber() + ")")
                        .collect(Collectors.joining("; "));
                csv.append(msg.getSequenceNumber()).append(",")
                   .append("\"").append(msg.getCreatedAt()).append("\",")
                   .append("\"").append(msg.getSenderType()).append("\",")
                   .append("\"").append(msg.getContent().replace("\"", "\"\"")).append("\",")
                   .append("\"").append(msg.getIntent() != null ? msg.getIntent() : "").append("\",")
                   .append(msg.getProcessingTimeMs()).append(",")
                   .append("\"").append(sourceNames).append("\"\n");
            }
            return csv.toString();
        }

        // Return simple JSON transcript
        return String.format(
                "{\"conversationId\":%d,\"user\":\"%s\",\"startedAt\":\"%s\",\"messagesCount\":%d}",
                detail.getId(), detail.getUserName(), detail.getStartedAt(), detail.getMessages().size()
        );
    }

    private AiConversationSummaryDTO mapToSummaryDTO(AiConversation conv) {
        AiConversationSummaryDTO dto = new AiConversationSummaryDTO();
        dto.setId(conv.getId());
        dto.setUserId(conv.getUserId());
        dto.setSessionId(conv.getSessionId());
        dto.setUserName(conv.getUserName());
        dto.setUserEmail(conv.getUserEmail());
        dto.setTitle(conv.getTitle());
        dto.setStatus(conv.getStatus());
        dto.setStartedAt(conv.getStartedAt());
        dto.setLastActivityAt(conv.getLastActivityAt());
        dto.setMessageCount(conv.getMessageCount());
        dto.setRagQueriesCount(conv.getRagQueriesCount());
        dto.setProductSearchesCount(conv.getProductSearchesCount());
        dto.setHasUnanswered(conv.getHasUnanswered());

        // Attach last message preview if available
        List<AiMessage> msgs = conv.getMessages();
        if (msgs != null && !msgs.isEmpty()) {
            AiMessage lastMsg = msgs.get(msgs.size() - 1);
            dto.setLastMessageText(lastMsg.getContent());
            dto.setLastSenderType(lastMsg.getSenderType());
            dto.setLastMessageCreatedAt(lastMsg.getCreatedAt());
            dto.setPrimaryIntent(lastMsg.getIntent());
        }

        return dto;
    }

    private AiMessageDTO mapToMessageDTO(AiMessage msg) {
        AiMessageDTO dto = new AiMessageDTO();
        dto.setId(msg.getId());
        dto.setConversationId(msg.getConversation().getId());
        dto.setSenderType(msg.getSenderType());
        dto.setContent(msg.getContent());
        dto.setIntent(msg.getIntent());
        dto.setModelName(msg.getModelName());
        dto.setProcessingTimeMs(msg.getProcessingTimeMs());
        dto.setTokenUsage(msg.getTokenUsage());
        dto.setErrorStatus(msg.getErrorStatus());
        dto.setIsHelpful(msg.getIsHelpful());
        dto.setFeedbackComment(msg.getFeedbackComment());
        dto.setSequenceNumber(msg.getSequenceNumber());
        dto.setCreatedAt(msg.getCreatedAt());

        if (msg.getSources() != null) {
            dto.setSources(msg.getSources().stream().map(this::mapToSourceDTO).collect(Collectors.toList()));
        }
        if (msg.getProducts() != null) {
            dto.setProducts(msg.getProducts().stream().map(this::mapToProductDTO).collect(Collectors.toList()));
        }
        return dto;
    }

    private AiSourceDTO mapToSourceDTO(AiMessageSource src) {
        return new AiSourceDTO(
                src.getId(),
                src.getDocumentId(),
                src.getChunkId(),
                src.getDocumentName(),
                src.getPageNumber(),
                src.getSimilarityScore(),
                src.getSourceExcerpt()
        );
    }

    private AiProductDTO mapToProductDTO(AiMessageProduct prod) {
        return new AiProductDTO(
                prod.getId(),
                prod.getProductId(),
                prod.getExternalProductId(),
                prod.getProductName(),
                prod.getProductSlug(),
                prod.getRelevanceScore(),
                prod.getPrice(),
                prod.getImageUrl()
        );
    }

    private String deriveTitle(String message) {
        if (message == null || message.isBlank()) return "Customer Inquiry";
        String clean = message.replaceAll("[^a-zA-Z0-9 ]", "").trim();
        if (clean.length() <= 35) return clean;
        return clean.substring(0, 32) + "...";
    }

    public static record TurnResult(Long conversationId, Long userMessageId, Long assistantMessageId) {}
}
