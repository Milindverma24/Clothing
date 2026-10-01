package com.clothing.controller;

import com.clothing.dto.*;
import com.clothing.service.AiConversationService;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/ai-conversations")
public class AdminAiConversationController {

    private final AiConversationService aiConversationService;

    public AdminAiConversationController(AiConversationService aiConversationService) {
        this.aiConversationService = aiConversationService;
    }

    /**
     * Lists paginated AI conversations with filtering by status, dateRange, and search query.
     * GET /api/admin/ai-conversations
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<AiConversationSummaryDTO>>> getConversations(
            @RequestParam(required = false) String search,
            @RequestParam(required = false, defaultValue = "ALL") String status,
            @RequestParam(required = false, defaultValue = "ALL") String intent,
            @RequestParam(required = false, defaultValue = "ALL") String dateRange,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Page<AiConversationSummaryDTO> result = aiConversationService.getConversations(
                search, status, intent, dateRange, page, size
        );
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /**
     * Returns full conversation details including chronological message history, sources, and products.
     * GET /api/admin/ai-conversations/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AiConversationDetailDTO>> getConversationDetail(
            @PathVariable Long id) {

        AiConversationDetailDTO detail = aiConversationService.getConversationDetail(id);
        return ResponseEntity.ok(ApiResponse.ok(detail));
    }

    /**
     * Returns messages list for a conversation.
     * GET /api/admin/ai-conversations/{id}/messages
     */
    @GetMapping("/{id}/messages")
    public ResponseEntity<ApiResponse<List<AiMessageDTO>>> getMessages(
            @PathVariable Long id) {

        AiConversationDetailDTO detail = aiConversationService.getConversationDetail(id);
        return ResponseEntity.ok(ApiResponse.ok(detail.getMessages()));
    }

    /**
     * Returns all RAG knowledge sources cited in this conversation.
     * GET /api/admin/ai-conversations/{id}/sources
     */
    @GetMapping("/{id}/sources")
    public ResponseEntity<ApiResponse<List<AiSourceDTO>>> getSources(
            @PathVariable Long id) {

        AiConversationDetailDTO detail = aiConversationService.getConversationDetail(id);
        return ResponseEntity.ok(ApiResponse.ok(detail.getAllSources()));
    }

    /**
     * Returns all catalog products recommended in this conversation.
     * GET /api/admin/ai-conversations/{id}/products
     */
    @GetMapping("/{id}/products")
    public ResponseEntity<ApiResponse<List<AiProductDTO>>> getProducts(
            @PathVariable Long id) {

        AiConversationDetailDTO detail = aiConversationService.getConversationDetail(id);
        return ResponseEntity.ok(ApiResponse.ok(detail.getAllProducts()));
    }

    /**
     * Returns AI conversation statistics and operational observability metrics.
     * GET /api/admin/ai-conversations/stats
     */
    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<AiConversationStatsDTO>> getStats() {
        AiConversationStatsDTO stats = aiConversationService.getStats();
        return ResponseEntity.ok(ApiResponse.ok(stats));
    }

    /**
     * Returns questions the AI could not answer or lacked sufficient knowledge context.
     * GET /api/admin/ai-conversations/unanswered
     */
    @GetMapping("/unanswered")
    public ResponseEntity<ApiResponse<Page<UnansweredQuestionDTO>>> getUnanswered(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Page<UnansweredQuestionDTO> result = aiConversationService.getUnansweredQuestions(page, size);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /**
     * Updates conversation status (e.g. ARCHIVED or CLOSED).
     * PATCH /api/admin/ai-conversations/{id}/status
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<String>> updateStatus(
            @PathVariable Long id,
            @RequestParam String status) {

        aiConversationService.updateStatus(id, status);
        return ResponseEntity.ok(ApiResponse.ok("Status updated successfully to " + status));
    }

    /**
     * Exports conversation transcript as CSV or JSON.
     * GET /api/admin/ai-conversations/{id}/export?format=csv
     */
    @GetMapping("/{id}/export")
    public ResponseEntity<String> exportConversation(
            @PathVariable Long id,
            @RequestParam(defaultValue = "csv") String format) {

        String payload = aiConversationService.exportConversation(id, format);

        String filename = "conversation-" + id + "." + format.toLowerCase();
        MediaType mediaType = "csv".equalsIgnoreCase(format) ? MediaType.parseMediaType("text/csv") : MediaType.APPLICATION_JSON;

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(mediaType)
                .body(payload);
    }
}
