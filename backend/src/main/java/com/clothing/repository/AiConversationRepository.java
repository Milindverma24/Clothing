package com.clothing.repository;

import com.clothing.entity.AiConversation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface AiConversationRepository extends JpaRepository<AiConversation, Long> {

    Optional<AiConversation> findBySessionId(String sessionId);

    Page<AiConversation> findByStatusOrderByLastActivityAtDesc(String status, Pageable pageable);

    Page<AiConversation> findByHasUnansweredTrueOrderByLastActivityAtDesc(Pageable pageable);

    @Query("SELECT c FROM AiConversation c WHERE " +
           "(:status IS NULL OR c.status = :status) AND " +
           "(:hasUnanswered IS NULL OR c.hasUnanswered = :hasUnanswered) AND " +
           "(:startDate IS NULL OR c.lastActivityAt >= :startDate) AND " +
           "(:endDate IS NULL OR c.lastActivityAt <= :endDate) AND " +
           "(:search IS NULL OR LOWER(c.userName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(c.userEmail) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(c.title) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(c.sessionId) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "ORDER BY c.lastActivityAt DESC")
    Page<AiConversation> searchConversations(
            @Param("status") String status,
            @Param("hasUnanswered") Boolean hasUnanswered,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            @Param("search") String search,
            Pageable pageable
    );

    long countByStartedAtAfter(LocalDateTime dateTime);

    long countByStatus(String status);

    long countByHasUnansweredTrue();

    @Query("SELECT COALESCE(SUM(c.messageCount), 0) FROM AiConversation c")
    long sumTotalMessages();

    @Query("SELECT COALESCE(SUM(c.ragQueriesCount), 0) FROM AiConversation c")
    long sumTotalRagQueries();

    @Query("SELECT COALESCE(SUM(c.productSearchesCount), 0) FROM AiConversation c")
    long sumTotalProductSearches();
}
