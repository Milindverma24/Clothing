package com.clothing.service;

import com.clothing.dto.*;
import com.clothing.entity.AiConversation;
import com.clothing.entity.AiMessage;
import com.clothing.repository.AiConversationRepository;
import com.clothing.repository.AiMessageProductRepository;
import com.clothing.repository.AiMessageRepository;
import com.clothing.repository.AiMessageSourceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AiConversationServiceTest {

    @Mock
    private AiConversationRepository conversationRepository;

    @Mock
    private AiMessageRepository messageRepository;

    @Mock
    private AiMessageSourceRepository sourceRepository;

    @Mock
    private AiMessageProductRepository productRepository;

    @InjectMocks
    private AiConversationService aiConversationService;

    private AiConversation mockConversation;

    @BeforeEach
    void setUp() {
        mockConversation = new AiConversation();
        mockConversation.setId(10L);
        mockConversation.setSessionId("sess-test-123");
        mockConversation.setUserName("Milind Verma");
        mockConversation.setUserEmail("milind@example.com");
        mockConversation.setTitle("Return Policy Inquiry");
        mockConversation.setStatus("ACTIVE");
        mockConversation.setMessageCount(0);
        mockConversation.setRagQueriesCount(0);
        mockConversation.setProductSearchesCount(0);
        mockConversation.setHasUnanswered(false);
    }

    @Test
    @DisplayName("getOrCreateConversation returns existing active conversation if found")
    void testGetOrCreateConversation_Existing() {
        when(conversationRepository.findById(10L)).thenReturn(Optional.of(mockConversation));

        AiConversation conv = aiConversationService.getOrCreateConversation(10L, null, "Milind Verma", null, "Hello");

        assertNotNull(conv);
        assertEquals(10L, conv.getId());
        assertEquals("Milind Verma", conv.getUserName());
    }

    @Test
    @DisplayName("getOrCreateConversation creates a new conversation when none found")
    void testGetOrCreateConversation_New() {
        when(conversationRepository.findById(99L)).thenReturn(Optional.empty());
        when(conversationRepository.save(any(AiConversation.class))).thenAnswer(invocation -> {
            AiConversation c = invocation.getArgument(0);
            c.setId(99L);
            return c;
        });

        AiConversation conv = aiConversationService.getOrCreateConversation(99L, "sess-new", "Jane Doe", "jane@example.com", "What is your refund policy?");

        assertNotNull(conv);
        assertEquals("Jane Doe", conv.getUserName());
        assertEquals("ACTIVE", conv.getStatus());
        verify(conversationRepository).save(any(AiConversation.class));
    }

    @Test
    @DisplayName("recordTurn saves user message, assistant message, sources, and products")
    void testRecordTurn() {
        when(messageRepository.save(any(AiMessage.class))).thenAnswer(invocation -> {
            AiMessage m = invocation.getArgument(0);
            m.setId(100L);
            return m;
        });
        when(conversationRepository.save(any(AiConversation.class))).thenReturn(mockConversation);

        List<CitationSource> sources = List.of(new CitationSource("return-and-refund-policy.pdf", 1, "Return window is 7 days"));
        List<ProductSearchDTO> products = new ArrayList<>();
        ProductSearchDTO p = new ProductSearchDTO();
        p.setId(1L);
        p.setName("Classic Black Shirt");
        p.setBasePrice(new BigDecimal("1299"));
        products.add(p);

        AiConversationService.TurnResult result = aiConversationService.recordTurn(
                mockConversation,
                "What is your return policy?",
                "You can return items within 7 days.",
                "HYBRID",
                sources,
                products,
                450L,
                "gemini-1.5-flash",
                null
        );

        assertNotNull(result);
        assertEquals(10L, result.conversationId());
        verify(messageRepository, times(2)).save(any(AiMessage.class));
        verify(sourceRepository, times(1)).save(any());
        verify(productRepository, times(1)).save(any());
        verify(conversationRepository).save(mockConversation);
        assertEquals(2, mockConversation.getMessageCount());
        assertEquals(1, mockConversation.getRagQueriesCount());
        assertEquals(1, mockConversation.getProductSearchesCount());
    }

    @Test
    @DisplayName("recordFeedback updates helpful flag and comments on message")
    void testRecordFeedback() {
        AiMessage msg = new AiMessage();
        msg.setId(50L);

        when(messageRepository.findById(50L)).thenReturn(Optional.of(msg));

        aiConversationService.recordFeedback(50L, true, "Very clear response!");

        assertTrue(msg.getIsHelpful());
        assertEquals("Very clear response!", msg.getFeedbackComment());
        verify(messageRepository).save(msg);
    }

    @Test
    @DisplayName("getStats aggregates metrics from repositories")
    void testGetStats() {
        when(conversationRepository.count()).thenReturn(25L);
        when(conversationRepository.countByStartedAtAfter(any())).thenReturn(5L);
        when(conversationRepository.countByStatus("ACTIVE")).thenReturn(18L);
        when(conversationRepository.countByHasUnansweredTrue()).thenReturn(2L);
        when(conversationRepository.sumTotalMessages()).thenReturn(110L);
        when(conversationRepository.sumTotalRagQueries()).thenReturn(45L);
        when(conversationRepository.sumTotalProductSearches()).thenReturn(30L);
        when(messageRepository.findAverageProcessingTimeMs()).thenReturn(650.0);
        when(messageRepository.countByIsHelpfulTrue()).thenReturn(15L);
        when(messageRepository.countByIsHelpfulFalse()).thenReturn(1L);
        when(messageRepository.countByIntentGroup()).thenReturn(Collections.emptyList());
        when(sourceRepository.findTopCitedDocuments()).thenReturn(Collections.emptyList());
        when(productRepository.findMostRecommendedProducts()).thenReturn(Collections.emptyList());

        AiConversationStatsDTO stats = aiConversationService.getStats();

        assertNotNull(stats);
        assertEquals(25L, stats.getTotalConversations());
        assertEquals(5L, stats.getTodayConversations());
        assertEquals(18L, stats.getActiveConversations());
        assertEquals(2L, stats.getUnansweredCount());
        assertEquals(110L, stats.getTotalMessages());
        assertEquals(650.0, stats.getAvgResponseLatencyMs());
        assertEquals(15L, stats.getHelpfulCount());
    }
}
