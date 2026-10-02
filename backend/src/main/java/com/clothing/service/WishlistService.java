package com.clothing.service;

import com.clothing.entity.Product;
import com.clothing.entity.User;
import com.clothing.entity.WishlistItem;
import com.clothing.exception.ApiException;
import com.clothing.repository.ProductRepository;
import com.clothing.repository.UserRepository;
import com.clothing.repository.WishlistItemRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class WishlistService {

    private final WishlistItemRepository wishlistRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;

    public WishlistService(
        WishlistItemRepository wishlistRepository,
        UserRepository userRepository,
        ProductRepository productRepository
    ) {
        this.wishlistRepository = wishlistRepository;
        this.userRepository = userRepository;
        this.productRepository = productRepository;
    }

    @Transactional(readOnly = true)
    public List<Product> getUserWishlist(Long userId) {
        return wishlistRepository.findAllByUserIdOrderByCreatedAtDesc(userId)
            .stream()
            .map(WishlistItem::getProduct)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<Long> getUserWishlistProductIds(Long userId) {
        return wishlistRepository.findAllByUserIdOrderByCreatedAtDesc(userId)
            .stream()
            .map(item -> item.getProduct().getId())
            .collect(Collectors.toList());
    }

    @Transactional
    public void addToWishlist(Long userId, Long productId) {
        if (wishlistRepository.existsByUserIdAndProductId(userId, productId)) {
            return;
        }

        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ApiException("User not found"));
        Product product = productRepository.findById(productId)
            .orElseThrow(() -> new ApiException("Product not found"));

        wishlistRepository.save(new WishlistItem(user, product));
    }

    @Transactional
    public void removeFromWishlist(Long userId, Long productId) {
        wishlistRepository.deleteByUserIdAndProductId(userId, productId);
    }

    @Transactional
    public List<Long> syncGuestWishlist(Long userId, List<Long> productIds) {
        if (productIds == null || productIds.isEmpty()) {
            return getUserWishlistProductIds(userId);
        }

        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ApiException("User not found"));

        for (Long productId : productIds) {
            if (!wishlistRepository.existsByUserIdAndProductId(userId, productId)) {
                productRepository.findById(productId).ifPresent(product -> {
                    wishlistRepository.save(new WishlistItem(user, product));
                });
            }
        }

        return getUserWishlistProductIds(userId);
    }
}
