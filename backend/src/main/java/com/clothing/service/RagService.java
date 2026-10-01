package com.clothing.service;

import com.clothing.entity.KnowledgeDocumentChunk;
import com.clothing.repository.KnowledgeDocumentChunkRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class RagService {

    private static final Logger log = LoggerFactory.getLogger(RagService.class);

    private final KnowledgeDocumentChunkRepository chunkRepository;
    private final EmbeddingService embeddingService;

    @Value("${rag.top-k:4}")
    private int defaultTopK;

    public RagService(
            KnowledgeDocumentChunkRepository chunkRepository,
            EmbeddingService embeddingService) {
        this.chunkRepository = chunkRepository;
        this.embeddingService = embeddingService;
    }

    /**
     * Executes hybrid retrieval combining dense vector similarity with keyword BM25 score.
     */
    public List<RetrievedChunk> retrieveRelevantChunks(String query, int topK) {
        long startTime = System.currentTimeMillis();
        int k = topK > 0 ? topK : defaultTopK;

        if (query == null || query.isBlank()) {
            return Collections.emptyList();
        }

        // 1. Generate dense query embedding
        float[] queryEmbedding = embeddingService.generateEmbedding(query);

        // 2. Extract query keywords for term matching
        Set<String> queryTerms = Arrays.stream(query.toLowerCase().split("[^a-z0-9]+"))
                .filter(t -> t.length() > 2)
                .collect(Collectors.toSet());

        // 3. Retrieve all indexed chunks
        List<KnowledgeDocumentChunk> indexedChunks = chunkRepository.findAllIndexedChunks();
        if (indexedChunks.isEmpty()) {
            log.info("No indexed chunks found in knowledge base.");
            return Collections.emptyList();
        }

        List<RetrievedChunk> scoredChunks = new ArrayList<>();

        for (KnowledgeDocumentChunk chunk : indexedChunks) {
            String chunkContent = chunk.getContent();
            if (chunkContent == null || chunkContent.isBlank()) continue;

            // Dense vector similarity
            float[] chunkVec = embeddingService.deserializeVector(chunk.getEmbedding());
            double vectorSim = embeddingService.cosineSimilarity(queryEmbedding, chunkVec);

            // Keyword / BM25 term overlap
            String lowerContent = chunkContent.toLowerCase();
            int matchedTerms = 0;
            for (String term : queryTerms) {
                if (lowerContent.contains(term)) {
                    matchedTerms++;
                }
            }

            double keywordScore = queryTerms.isEmpty() ? 0.0 : ((double) matchedTerms / queryTerms.size());

            // Hybrid score (65% vector similarity + 35% keyword overlap)
            double hybridScore = (0.65 * vectorSim) + (0.35 * keywordScore);

            if (hybridScore >= 0.22 || keywordScore >= 0.5) {
                String docName = chunk.getDocument() != null ? chunk.getDocument().getOriginalFileName() : "Document";
                scoredChunks.add(new RetrievedChunk(
                        chunkContent,
                        docName,
                        chunk.getPageNumber(),
                        hybridScore
                ));
            }
        }

        // Sort descending by hybrid score
        scoredChunks.sort((a, b) -> Double.compare(b.getScore(), a.getScore()));

        List<RetrievedChunk> topResults = scoredChunks.stream()
                .limit(k)
                .collect(Collectors.toList());

        long elapsed = System.currentTimeMillis() - startTime;
        log.info("RAG hybrid retrieval for '{}' found {} relevant chunks in {}ms", query, topResults.size(), elapsed);

        return topResults;
    }
}
