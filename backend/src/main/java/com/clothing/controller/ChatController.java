package com.clothing.controller;

import com.clothing.dto.ApiResponse;
import com.clothing.dto.AiConversationDetailDTO;
import com.clothing.dto.AiFeedbackRequestDTO;
import com.clothing.dto.ChatRequestDTO;
import com.clothing.dto.ChatResponseDTO;
import com.clothing.service.AiConversationService;
import com.clothing.service.ProductAwareChatbotService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final ProductAwareChatbotService chatbotService;
    private final AiConversationService aiConversationService;

    public ChatController(
            ProductAwareChatbotService chatbotService,
            AiConversationService aiConversationService) {
        this.chatbotService = chatbotService;
        this.aiConversationService = aiConversationService;
    }

    /**
     * Customer-facing AI Chatbot endpoint with RAG Knowledge retrieval and Product Awareness.
     * POST /api/chat
     */
    @PostMapping
    public ResponseEntity<ApiResponse<ChatResponseDTO>> chat(
            @Valid @RequestBody ChatRequestDTO request) {

        ChatResponseDTO response = chatbotService.processChat(
                request.getMessage(),
                request.getConversationId(),
                request.getSessionId(),
                request.getUserName(),
                request.getUserEmail()
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
     * Retrieves conversation transcript for customer session resumption.
     * GET /api/chat/history/{conversationId}
     */
    @GetMapping("/history/{conversationId}")
    public ResponseEntity<ApiResponse<AiConversationDetailDTO>> getHistory(
            @PathVariable Long conversationId) {

        AiConversationDetailDTO detail = aiConversationService.getConversationDetail(conversationId);
        return ResponseEntity.ok(ApiResponse.ok(detail));
    }
}

