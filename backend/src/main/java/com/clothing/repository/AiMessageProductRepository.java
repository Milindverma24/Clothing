package com.clothing.repository;

import com.clothing.entity.AiMessageProduct;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AiMessageProductRepository extends JpaRepository<AiMessageProduct, Long> {

    List<AiMessageProduct> findByMessageId(Long messageId);

    @Query("SELECT p FROM AiMessageProduct p WHERE p.message.conversation.id = :conversationId ORDER BY p.createdAt ASC")
    List<AiMessageProduct> findByConversationId(@Param("conversationId") Long conversationId);

    @Query("SELECT p.productName, COUNT(p) FROM AiMessageProduct p GROUP BY p.productName ORDER BY COUNT(p) DESC")
    List<Object[]> findMostRecommendedProducts();
}
