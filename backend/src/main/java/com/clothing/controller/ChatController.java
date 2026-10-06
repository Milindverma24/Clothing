package com.clothing.controller;

import com.clothing.dto.*;
import com.clothing.entity.AiConversation;
import com.clothing.repository.ProductRepository;
import com.clothing.service.AiConversationService;
import com.clothing.service.ProductAwareChatbotService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final ProductAwareChatbotService chatbotService;
    private final AiConversationService aiConversationService;
    private final ProductRepository productRepository;

    public ChatController(
            ProductAwareChatbotService chatbotService,
            AiConversationService aiConversationService,
            ProductRepository productRepository) {
        this.chatbotService = chatbotService;
        this.aiConversationService = aiConversationService;
        this.productRepository = productRepository;
    }

    /**
     * Customer-facing AI Chatbot endpoint with RAG Knowledge retrieval and Product Awareness.
     * POST /api/chat
     */
    @PostMapping
    public ResponseEntity<ApiResponse<ChatResponseDTO>> chat(
            @Valid @RequestBody ChatRequestDTO request,
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.clothing.security.UserPrincipal principal) {

        String userEmail = principal != null ? principal.getEmail() : request.getUserEmail();
        String userName = principal != null ? principal.getFullName() : request.getUserName();

        ChatResponseDTO response = chatbotService.processChat(
                request.getMessage(),
                request.getConversationId(),
                request.getSessionId(),
                userName,
                userEmail
        );
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    /**
     * Submits user feedback (helpful 👍 / not helpful 👎) on an AI response.
     * POST /api/chat/feedback
     */
    @PostMapping("/feedback")
    public ResponseEntity<ApiResponse<String>> submitFeedback(
            @Valid @RequestBody AiFeedbackRequestDTO feedbackRequest) {

        aiConversationService.recordFeedback(
                feedbackRequest.getMessageId(),
                feedbackRequest.getHelpful(),
                feedbackRequest.getComment()
        );
        return ResponseEntity.ok(ApiResponse.ok("Feedback recorded successfully."));
    }

    /**
     * Retrieves conversation transcript for customer session resumption with strict IDOR verification.
     * GET /api/chat/history/{conversationId}
     */
    @GetMapping("/history/{conversationId}")
    public ResponseEntity<ApiResponse<AiConversationDetailDTO>> getHistory(
            @PathVariable Long conversationId,
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.clothing.security.UserPrincipal principal) {

        AiConversationDetailDTO detail = aiConversationService.getConversationDetail(conversationId);
        if (principal != null) {
            boolean isAdmin = principal.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
            if (!isAdmin) {
                boolean isOwner = (detail.getUserId() != null && detail.getUserId().equals(principal.getId()))
                        || (detail.getUserEmail() != null && detail.getUserEmail().equalsIgnoreCase(principal.getEmail()));
                if (!isOwner) {
                    throw new com.clothing.exception.ApiException("Access denied: You are not authorized to view this conversation.");
                }
            }
        } else {
            // Anonymous guest cannot read random conversations
            throw new com.clothing.exception.ApiException("Authentication required to access conversation history.");
        }
        return ResponseEntity.ok(ApiResponse.ok(detail));
    }

    /**
     * Retrieves the authenticated customer's own AI conversation history.
     * GET /api/chat/my-conversations
     */
    @GetMapping("/my-conversations")
    public ResponseEntity<ApiResponse<List<AiConversationSummaryDTO>>> getMyConversations(
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.clothing.security.UserPrincipal principal) {

        if (principal == null) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).build();
        }
        List<AiConversationSummaryDTO> convs = aiConversationService.getUserConversations(principal.getId());
        return ResponseEntity.ok(ApiResponse.ok(convs != null ? convs : Collections.emptyList()));
    }

    /**
     * Synchronizes a conversational turn executed by the AI Chatbot into the unified database.
     * POST /api/chat/sync-turn
     */
    @PostMapping("/sync-turn")
    public ResponseEntity<ApiResponse<AiConversationDetailDTO>> syncTurn(
            @RequestBody AiSyncTurnRequestDTO request) {

        AiConversation conv = aiConversationService.getOrCreateConversation(
                request.getConversationId(),
                request.getSessionId(),
                request.getUserName(),
                request.getUserEmail(),
                request.getUserMessage()
        );

        List<ProductSearchDTO> products = new ArrayList<>();
        if (request.getProductIds() != null && !request.getProductIds().isEmpty()) {
            for (Long pid : request.getProductIds()) {
                productRepository.findById(pid).ifPresent(p -> {
                    ProductSearchDTO dto = new ProductSearchDTO();
                    dto.setId(p.getId());
                    dto.setName(p.getName());
                    dto.setBasePrice(p.getBasePrice() != null ? p.getBasePrice() : java.math.BigDecimal.ZERO);
                    dto.setSlug(p.getSlug());
                    products.add(dto);
                });
            }
        }

        aiConversationService.recordTurn(
                conv,
                request.getUserMessage(),
                request.getAssistantMessage(),
                request.getIntent(),
                request.getSources() != null ? request.getSources() : Collections.emptyList(),
                products,
                request.getLatencyMs() > 0 ? request.getLatencyMs() : 120L,
                request.getModelName() != null ? request.getModelName() : "ai-agent-v2",
                request.getErrorStatus()
        );

        AiConversationDetailDTO detail = aiConversationService.getConversationDetail(conv.getId());
        return ResponseEntity.ok(ApiResponse.ok(detail));
    }
}

