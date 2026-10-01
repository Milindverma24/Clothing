package com.clothing.repository;

import com.clothing.entity.AiMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AiMessageRepository extends JpaRepository<AiMessage, Long> {

    List<AiMessage> findByConversationIdOrderBySequenceNumberAsc(Long conversationId);

    Page<AiMessage> findByErrorStatusNotNullOrderByCreatedAtDesc(Pageable pageable);

    @Query("SELECT m FROM AiMessage m WHERE m.errorStatus IS NOT NULL OR " +
           "(m.senderType = 'ASSISTANT' AND LOWER(m.content) LIKE '%couldn''t find that information%') " +
           "ORDER BY m.createdAt DESC")
    Page<AiMessage> findUnansweredQuestions(Pageable pageable);

    long countByIsHelpfulTrue();

    long countByIsHelpfulFalse();

    @Query("SELECT COALESCE(AVG(m.processingTimeMs), 0) FROM AiMessage m WHERE m.senderType = 'ASSISTANT' AND m.processingTimeMs > 0")
    double findAverageProcessingTimeMs();

    @Query("SELECT m.intent, COUNT(m) FROM AiMessage m WHERE m.senderType = 'ASSISTANT' AND m.intent IS NOT NULL GROUP BY m.intent")
    List<Object[]> countByIntentGroup();
}
