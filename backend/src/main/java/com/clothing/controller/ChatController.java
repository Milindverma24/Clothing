package com.clothing.controller;

import com.clothing.dto.ApiResponse;
import com.clothing.dto.ChatRequestDTO;
import com.clothing.dto.ChatResponseDTO;
import com.clothing.service.ProductAwareChatbotService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final ProductAwareChatbotService chatbotService;

    public ChatController(ProductAwareChatbotService chatbotService) {
        this.chatbotService = chatbotService;
    }

    /**
     * Customer-facing AI Chatbot endpoint with RAG Knowledge retrieval and Product Awareness.
     * POST /api/chat
     */
    @PostMapping
    public ResponseEntity<ApiResponse<ChatResponseDTO>> chat(
            @Valid @RequestBody ChatRequestDTO request) {

        ChatResponseDTO response = chatbotService.processChat(request.getMessage());
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
