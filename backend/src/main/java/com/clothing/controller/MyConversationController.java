package com.clothing.controller;

import com.clothing.dto.*;
import com.clothing.exception.ResourceNotFoundException;
import com.clothing.security.UserPrincipal;
import com.clothing.service.AiConversationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;

@RestController
@RequestMapping("/api/my/conversations")
public class MyConversationController {

    private final AiConversationService aiConversationService;

    public MyConversationController(AiConversationService aiConversationService) {
        this.aiConversationService = aiConversationService;
    }

    /**
     * Customer conversations scoped strictly to authenticated customer.
     * GET /api/my/conversations
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<AiConversationSummaryDTO>>> getMyConversations(
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        List<AiConversationSummaryDTO> convs = aiConversationService.getUserConversations(principal.getId());
        return ResponseEntity.ok(ApiResponse.ok(convs != null ? convs : Collections.emptyList()));
    }

    /**
     * Customer conversation detail with strict ownership verification.
     * Returns 404 NOT FOUND if conversation does not exist or belongs to someone else.
     * GET /api/my/conversations/{conversationId}
     */
    @GetMapping("/{conversationId}")
    public ResponseEntity<ApiResponse<AiConversationDetailDTO>> getMyConversation(
        @PathVariable Long conversationId,
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        AiConversationDetailDTO detail = aiConversationService.getConversationDetail(conversationId);
        boolean isOwner = (detail.getUserId() != null && detail.getUserId().equals(principal.getId()))
            || (detail.getUserEmail() != null && detail.getUserEmail().equalsIgnoreCase(principal.getEmail()));

        if (!isOwner) {
            throw new ResourceNotFoundException("Conversation", "id", conversationId);
        }
        return ResponseEntity.ok(ApiResponse.ok(detail));
    }

    /**
     * Customer conversation messages strictly scoped to authenticated customer.
     * GET /api/my/conversations/{conversationId}/messages
     */
    @GetMapping("/{conversationId}/messages")
    public ResponseEntity<ApiResponse<List<AiMessageDTO>>> getMyConversationMessages(
        @PathVariable Long conversationId,
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        AiConversationDetailDTO detail = aiConversationService.getConversationDetail(conversationId);
        boolean isOwner = (detail.getUserId() != null && detail.getUserId().equals(principal.getId()))
            || (detail.getUserEmail() != null && detail.getUserEmail().equalsIgnoreCase(principal.getEmail()));

        if (!isOwner) {
            throw new ResourceNotFoundException("Conversation", "id", conversationId);
        }
        return ResponseEntity.ok(ApiResponse.ok(detail.getMessages() != null ? detail.getMessages() : Collections.emptyList()));
    }
}
