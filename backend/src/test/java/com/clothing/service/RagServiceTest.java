package com.clothing.service;

import com.clothing.dto.CitationSource;
import com.clothing.entity.KnowledgeDocument;
import com.clothing.entity.KnowledgeDocumentChunk;
import com.clothing.repository.KnowledgeDocumentChunkRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RagServiceTest {

    @Mock
    private KnowledgeDocumentChunkRepository chunkRepository;

    @Spy
    private EmbeddingService embeddingService = new EmbeddingService();

    @InjectMocks
    private RagService ragService;

    private AiService aiService;

    private List<KnowledgeDocumentChunk> mockChunks;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(ragService, "defaultTopK", 3);
        aiService = new AiService();

        KnowledgeDocument doc = new KnowledgeDocument();
        doc.setId(1L);
        doc.setOriginalFileName("return-and-refund-policy.pdf");
        doc.setStatus("INDEXED");

        mockChunks = new ArrayList<>();

        KnowledgeDocumentChunk chunk1 = new KnowledgeDocumentChunk();
        chunk1.setId(1L);
        chunk1.setDocument(doc);
        chunk1.setPageNumber(1);
        chunk1.setContent("We offer a hassle-free 14-day return window from the day of delivery. Items must be in unwashed condition with tags attached.");
        chunk1.setEmbedding(embeddingService.serializeVector(embeddingService.generateEmbedding(chunk1.getContent())));

        KnowledgeDocumentChunk chunk2 = new KnowledgeDocumentChunk();
        chunk2.setId(2L);
        chunk2.setDocument(doc);
        chunk2.setPageNumber(2);
        chunk2.setContent("Refunds are processed to the original payment method within 5 to 7 business days following quality inspection.");
        chunk2.setEmbedding(embeddingService.serializeVector(embeddingService.generateEmbedding(chunk2.getContent())));

        mockChunks.add(chunk1);
        mockChunks.add(chunk2);
    }

    @Test
    @DisplayName("EmbeddingService produces normalized 64-dim embeddings with valid cosine similarity")
    void testEmbeddingService() {
        float[] v1 = embeddingService.generateEmbedding("return policy and refunds");
        float[] v2 = embeddingService.generateEmbedding("how to return and get refund");
        float[] v3 = embeddingService.generateEmbedding("planetary astronomical telescope astrophysics");

        assertEquals(64, v1.length);
        assertEquals(64, v2.length);

        double sim12 = embeddingService.cosineSimilarity(v1, v2);
        double sim13 = embeddingService.cosineSimilarity(v1, v3);

        assertTrue(sim12 > sim13, "Related queries should have higher cosine similarity than unrelated queries");
    }

    @Test
    @DisplayName("Hybrid retrieval finds relevant policy chunks for return questions")
    void testHybridRetrieval() {
        when(chunkRepository.findAllIndexedChunks()).thenReturn(mockChunks);

        List<RetrievedChunk> results = ragService.retrieveRelevantChunks("What is the return window?", 2);

        assertNotNull(results);
        assertFalse(results.isEmpty());
        RetrievedChunk top = results.get(0);
        assertTrue(top.getContent().contains("14-day return window"));
        assertEquals("return-and-refund-policy.pdf", top.getDocumentName());
        assertEquals(1, top.getPageNumber());
    }

    @Test
    @DisplayName("Strict grounding: AiService does not hallucinate when context is empty")
    void testHallucinationControlOnEmptyContext() {
        AiService.GroundedResult result = aiService.generateGroundedAnswer("What is the discount code?", Collections.emptyList());

        assertNotNull(result);
        assertTrue(result.answer.contains("couldn't find that information in our official knowledge base"));
        assertTrue(result.sources.isEmpty());
    }

    @Test
    @DisplayName("AiService provides grounded answers with citation sources")
    void testGroundedAnswerWithCitations() {
        List<RetrievedChunk> chunks = List.of(
                new RetrievedChunk("We offer a 14-day return window.", "return-and-refund-policy.pdf", 1, 0.95)
        );

        AiService.GroundedResult result = aiService.generateGroundedAnswer("How many days do I have to return?", chunks);

        assertNotNull(result);
        assertFalse(result.answer.isBlank());
        assertFalse(result.sources.isEmpty());
        CitationSource source = result.sources.get(0);
        assertEquals("return-and-refund-policy.pdf", source.getDocumentName());
        assertEquals(1, source.getPageNumber());
    }
}
