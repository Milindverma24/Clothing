package com.clothing.service;

import com.clothing.dto.ReviewRequest;
import com.clothing.entity.CustomerReview;
import com.clothing.entity.Product;
import com.clothing.entity.User;
import com.clothing.exception.ApiException;
import com.clothing.repository.CustomerReviewRepository;
import com.clothing.repository.ProductRepository;
import com.clothing.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CustomerReviewService {

    private final CustomerReviewRepository reviewRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;

    public CustomerReviewService(
        CustomerReviewRepository reviewRepository,
        UserRepository userRepository,
        ProductRepository productRepository
    ) {
        this.reviewRepository = reviewRepository;
        this.userRepository = userRepository;
        this.productRepository = productRepository;
    }

    @Transactional(readOnly = true)
    public List<CustomerReview> getUserReviews(Long userId) {
        return reviewRepository.findAllByUserIdOrderByCreatedAtDesc(userId);
    }

    @Transactional(readOnly = true)
    public List<CustomerReview> getProductReviews(Long productId) {
        return reviewRepository.findAllByProductIdAndStatusOrderByCreatedAtDesc(productId, "APPROVED");
    }

    @Transactional
    public CustomerReview submitReview(Long userId, ReviewRequest request) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ApiException("User not found"));
        Product product = productRepository.findById(request.getProductId())
            .orElseThrow(() -> new ApiException("Product not found"));

        CustomerReview review = new CustomerReview(
            user,
            product,
            request.getRating(),
            request.getTitle(),
            request.getComment(),
            true
        );

        return reviewRepository.save(review);
    }
}
