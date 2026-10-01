package com.clothing.service;

import com.clothing.entity.KnowledgeDocument;
import com.clothing.entity.KnowledgeDocumentChunk;
import com.clothing.repository.KnowledgeDocumentChunkRepository;
import com.clothing.repository.KnowledgeDocumentRepository;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;

@Service
public class DocumentProcessingService {

    private static final Logger log = LoggerFactory.getLogger(DocumentProcessingService.class);

    private static final int CHUNK_SIZE = 450;
    private static final int CHUNK_OVERLAP = 80;

    private final KnowledgeDocumentRepository documentRepository;
    private final KnowledgeDocumentChunkRepository chunkRepository;
    private final EmbeddingService embeddingService;

    public DocumentProcessingService(
            KnowledgeDocumentRepository documentRepository,
            KnowledgeDocumentChunkRepository chunkRepository,
            EmbeddingService embeddingService) {
        this.documentRepository = documentRepository;
        this.chunkRepository = chunkRepository;
        this.embeddingService = embeddingService;
    }

    /**
     * Asynchronous document processing pipeline.
     */
    @Async
    public CompletableFuture<Void> processDocumentAsync(Long documentId, File file) {
        processDocumentSync(documentId, file);
        return CompletableFuture.completedFuture(null);
    }

    /**
     * Synchronous document processing pipeline.
     */
    @Transactional
    public void processDocumentSync(Long documentId, File file) {
        KnowledgeDocument document = documentRepository.findById(documentId).orElse(null);
        if (document == null) {
            log.error("Knowledge document with id {} not found for processing", documentId);
            return;
        }

        try {
            document.setStatus("PROCESSING");
            document.setUpdatedAt(LocalDateTime.now());
            documentRepository.save(document);

            // Delete any existing chunks if re-indexing
            chunkRepository.deleteByDocumentId(documentId);

            List<KnowledgeDocumentChunk> chunks = extractAndChunkPdf(document, file);
            if (chunks.isEmpty()) {
                document.setStatus("FAILED");
                document.setErrorMessage("No readable text found in document.");
                documentRepository.save(document);
                return;
            }

            chunkRepository.saveAll(chunks);

            document.setStatus("INDEXED");
            document.setChunkCount(chunks.size());
            document.setErrorMessage(null);
            document.setUpdatedAt(LocalDateTime.now());
            documentRepository.save(document);

            log.info("Document '{}' (ID: {}) successfully indexed into {} chunks.",
                    document.getOriginalFileName(), documentId, chunks.size());

        } catch (Exception e) {
            log.error("Failed to process document: " + document.getOriginalFileName(), e);
            document.setStatus("FAILED");
            document.setErrorMessage("Processing error: " + e.getMessage());
            document.setUpdatedAt(LocalDateTime.now());
            documentRepository.save(document);
        }
    }

    /**
     * Extracts text page-by-page from PDF and creates chunks with metadata.
     */
    private List<KnowledgeDocumentChunk> extractAndChunkPdf(KnowledgeDocument document, File file) throws IOException {
        List<KnowledgeDocumentChunk> result = new ArrayList<>();

        try (PDDocument pdDoc = Loader.loadPDF(file)) {
            int totalPages = pdDoc.getNumberOfPages();
            PDFTextStripper stripper = new PDFTextStripper();

            int globalChunkIndex = 0;

            for (int pageNum = 1; pageNum <= totalPages; pageNum++) {
                stripper.setStartPage(pageNum);
                stripper.setEndPage(pageNum);
                String pageText = stripper.getText(pdDoc);

                if (pageText == null || pageText.isBlank()) {
                    continue;
                }

                // Clean extracted text: collapse multiple spaces, line breaks, control characters
                String cleaned = pageText.replaceAll("[\\r\\n]+", " ")
                                         .replaceAll("\\s{2,}", " ")
                                         .trim();

                if (cleaned.length() < 20) {
                    continue;
                }

                // Sliding window chunking
                int start = 0;
                while (start < cleaned.length()) {
                    int end = Math.min(start + CHUNK_SIZE, cleaned.length());

                    // Try not to cut words in half
                    if (end < cleaned.length()) {
                        int lastSpace = cleaned.lastIndexOf(' ', end);
                        if (lastSpace > start + (CHUNK_SIZE / 2)) {
                            end = lastSpace;
                        }
                    }

                    String chunkText = cleaned.substring(start, end).trim();
                    if (!chunkText.isEmpty()) {
                        KnowledgeDocumentChunk chunk = new KnowledgeDocumentChunk();
                        chunk.setDocument(document);
                        chunk.setChunkIndex(globalChunkIndex++);
                        chunk.setPageNumber(pageNum);
                        chunk.setContent(chunkText);

                        // Generate dense vector embedding
                        float[] embedding = embeddingService.generateEmbedding(chunkText);
                        chunk.setEmbedding(embeddingService.serializeVector(embedding));

                        result.add(chunk);
                    }

                    if (end >= cleaned.length()) {
                        break;
                    }
                    start = end - CHUNK_OVERLAP;
                    if (start < 0) start = 0;
                }
            }
        }

        return result;
    }
}
