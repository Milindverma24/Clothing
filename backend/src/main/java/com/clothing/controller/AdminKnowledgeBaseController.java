package com.clothing.controller;

import com.clothing.dto.ApiResponse;
import com.clothing.dto.DocumentSummaryDTO;
import com.clothing.entity.KnowledgeDocument;
import com.clothing.repository.KnowledgeDocumentChunkRepository;
import com.clothing.repository.KnowledgeDocumentRepository;
import com.clothing.service.DocumentProcessingService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/knowledge-base")
public class AdminKnowledgeBaseController {

    private static final Logger log = LoggerFactory.getLogger(AdminKnowledgeBaseController.class);
    private static final long MAX_FILE_SIZE = 15 * 1024 * 1024; // 15 MB

    private final KnowledgeDocumentRepository documentRepository;
    private final KnowledgeDocumentChunkRepository chunkRepository;
    private final DocumentProcessingService documentProcessingService;

    public AdminKnowledgeBaseController(
            KnowledgeDocumentRepository documentRepository,
            KnowledgeDocumentChunkRepository chunkRepository,
            DocumentProcessingService documentProcessingService) {
        this.documentRepository = documentRepository;
        this.chunkRepository = chunkRepository;
        this.documentProcessingService = documentProcessingService;
    }

    /**
     * Upload and ingest a new PDF knowledge base document.
     * POST /api/admin/knowledge-base/documents
     */
    @PostMapping("/documents")
    public ResponseEntity<ApiResponse<DocumentSummaryDTO>> uploadDocument(
            @RequestParam("file") MultipartFile file) {

        // 1. Validation
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Uploaded file cannot be empty"));
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            return ResponseEntity.badRequest().body(ApiResponse.error("File size exceeds 15MB limit"));
        }

        String originalName = file.getOriginalFilename();
        if (originalName == null || !originalName.toLowerCase().endsWith(".pdf")) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Only PDF documents are supported"));
        }

        try {
            // 2. Secure file storage (prevent path traversal)
            Path uploadDir = Paths.get("uploads", "knowledge-base");
            Files.createDirectories(uploadDir);

            String safeFileName = UUID.randomUUID() + ".pdf";
            Path targetPath = uploadDir.resolve(safeFileName);
            Files.copy(file.getInputStream(), targetPath);

            // 3. Create document record
            KnowledgeDocument document = new KnowledgeDocument();
            document.setOriginalFileName(originalName);
            document.setStoragePath(targetPath.toString());
            document.setMimeType("application/pdf");
            document.setFileSize(file.getSize());
            document.setStatus("PROCESSING");
            document.setUploadedBy("SUPER_ADMIN");
            document = documentRepository.save(document);

            // 4. Trigger asynchronous processing
            documentProcessingService.processDocumentAsync(document.getId(), targetPath.toFile());

            return ResponseEntity.status(HttpStatus.ACCEPTED).body(ApiResponse.ok(mapToDTO(document)));

        } catch (IOException e) {
            log.error("Failed to store uploaded document", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Could not save file: " + e.getMessage()));
        }
    }

    /**
     * List all knowledge base documents with statuses and chunk counts.
     * GET /api/admin/knowledge-base/documents
     */
    @GetMapping("/documents")
    public ResponseEntity<ApiResponse<List<DocumentSummaryDTO>>> listDocuments() {
        List<DocumentSummaryDTO> list = documentRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    /**
     * Get single document details.
     * GET /api/admin/knowledge-base/documents/{id}
     */
    @GetMapping("/documents/{id}")
    public ResponseEntity<ApiResponse<DocumentSummaryDTO>> getDocument(@PathVariable Long id) {
        return documentRepository.findById(id)
                .map(doc -> ResponseEntity.ok(ApiResponse.ok(mapToDTO(doc))))
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Re-index an existing document.
     * POST /api/admin/knowledge-base/documents/{id}/reindex
     */
    @PostMapping("/documents/{id}/reindex")
    public ResponseEntity<ApiResponse<DocumentSummaryDTO>> reindexDocument(@PathVariable Long id) {
        KnowledgeDocument document = documentRepository.findById(id).orElse(null);
        if (document == null) {
            return ResponseEntity.notFound().build();
        }

        File file = new File(document.getStoragePath());
        if (!file.exists()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Original file no longer found on disk"));
        }

        document.setStatus("PROCESSING");
        document.setUpdatedAt(LocalDateTime.now());
        documentRepository.save(document);

        documentProcessingService.processDocumentAsync(id, file);

        return ResponseEntity.ok(ApiResponse.ok(mapToDTO(document)));
    }

    /**
     * Delete a knowledge base document and its vector chunks.
     * DELETE /api/admin/knowledge-base/documents/{id}
     */
    @Transactional
    @DeleteMapping("/documents/{id}")
    public ResponseEntity<ApiResponse<String>> deleteDocument(@PathVariable Long id) {
        KnowledgeDocument document = documentRepository.findById(id).orElse(null);
        if (document == null) {
            return ResponseEntity.notFound().build();
        }

        try {
            // Delete chunks
            chunkRepository.deleteByDocumentId(id);

            // Delete file on disk if exists
            try {
                Files.deleteIfExists(Paths.get(document.getStoragePath()));
            } catch (Exception e) {
                log.warn("Could not delete file on disk: " + document.getStoragePath());
            }

            // Delete document record
            documentRepository.delete(document);

            log.info("Document ID {} ('{}') deleted successfully", id, document.getOriginalFileName());
            return ResponseEntity.ok(ApiResponse.ok("Document and vector chunks deleted successfully"));

        } catch (Exception e) {
            log.error("Failed to delete document " + id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Failed to delete document: " + e.getMessage()));
        }
    }

    private DocumentSummaryDTO mapToDTO(KnowledgeDocument doc) {
        DocumentSummaryDTO dto = new DocumentSummaryDTO();
        dto.setId(doc.getId());
        dto.setOriginalFileName(doc.getOriginalFileName());
        dto.setFileSize(doc.getFileSize());
        dto.setMimeType(doc.getMimeType());
        dto.setStatus(doc.getStatus());
        dto.setChunkCount(doc.getChunkCount());
        dto.setUploadedBy(doc.getUploadedBy());
        dto.setCreatedAt(doc.getCreatedAt());
        dto.setUpdatedAt(doc.getUpdatedAt());
        dto.setErrorMessage(doc.getErrorMessage());
        return dto;
    }
}
