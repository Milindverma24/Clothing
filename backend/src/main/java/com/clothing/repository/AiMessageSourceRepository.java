package com.clothing.repository;

import com.clothing.entity.AiMessageSource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AiMessageSourceRepository extends JpaRepository<AiMessageSource, Long> {

    List<AiMessageSource> findByMessageId(Long messageId);

    @Query("SELECT s FROM AiMessageSource s WHERE s.message.conversation.id = :conversationId ORDER BY s.createdAt ASC")
    List<AiMessageSource> findByConversationId(@Param("conversationId") Long conversationId);

    @Query("SELECT s.documentName, COUNT(s) FROM AiMessageSource s GROUP BY s.documentName ORDER BY COUNT(s) DESC")
    List<Object[]> findTopCitedDocuments();
}
