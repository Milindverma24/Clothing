package com.clothing.repository;

import com.clothing.entity.CustomerReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CustomerReviewRepository extends JpaRepository<CustomerReview, Long> {
    List<CustomerReview> findAllByUserIdOrderByCreatedAtDesc(Long userId);
    List<CustomerReview> findAllByProductIdAndStatusOrderByCreatedAtDesc(Long productId, String status);
    boolean existsByUserIdAndProductId(Long userId, Long productId);
}
