package com.clothing.repository;

import com.clothing.entity.KnowledgeDocumentChunk;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface KnowledgeDocumentChunkRepository extends JpaRepository<KnowledgeDocumentChunk, Long> {

    List<KnowledgeDocumentChunk> findByDocumentIdOrderByChunkIndexAsc(Long documentId);

    @org.springframework.transaction.annotation.Transactional
    @org.springframework.data.jpa.repository.Modifying
    void deleteByDocumentId(Long documentId);

    @Query("SELECT c FROM KnowledgeDocumentChunk c WHERE c.document.status = 'INDEXED'")
    List<KnowledgeDocumentChunk> findAllIndexedChunks();

    @Query("SELECT c FROM KnowledgeDocumentChunk c WHERE c.document.status = 'INDEXED' AND LOWER(c.content) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    List<KnowledgeDocumentChunk> searchByKeyword(@Param("keyword") String keyword);
}
