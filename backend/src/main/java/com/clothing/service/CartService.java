package com.clothing.service;

import com.clothing.dto.AddToCartRequest;
import com.clothing.entity.Cart;
import com.clothing.entity.CartItem;
import com.clothing.entity.Product;
import com.clothing.entity.ProductVariant;
import com.clothing.entity.User;
import com.clothing.exception.ApiException;
import com.clothing.repository.CartRepository;
import com.clothing.repository.ProductRepository;
import com.clothing.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Optional;

@Service
public class CartService {

    private final CartRepository cartRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    public CartService(
        CartRepository cartRepository,
        ProductRepository productRepository,
        UserRepository userRepository
    ) {
        this.cartRepository = cartRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public Cart getOrCreateCartForUser(Long userId) {
        if (userId == null) {
            Cart emptyCart = new Cart();
            emptyCart.setItems(new ArrayList<>());
            return emptyCart;
        }

        return cartRepository.findByUserId(userId)
            .orElseGet(() -> {
                User user = userRepository.findById(userId).orElse(null);
                Cart newCart = new Cart(user);
                return cartRepository.save(newCart);
            });
    }

    @Transactional
    public Cart addItemToCart(Long userId, AddToCartRequest req) {
        if (userId == null) {
            throw new ApiException("Authentication required to modify cart");
        }

        if (req.getProductId() == null || req.getProductId().isBlank()) {
            throw new ApiException("Product ID is required");
        }

        Cart cart = getOrCreateCartForUser(userId);

        Long prodId;
        try {
            prodId = Long.parseLong(req.getProductId().trim());
        } catch (NumberFormatException e) {
            throw new ApiException("Invalid product ID: " + req.getProductId());
        }

        Product product = productRepository.findById(prodId)
            .or(() -> productRepository.findByExternalProductId(prodId))
            .orElseThrow(() -> new ApiException("Product not found with id: " + prodId));

        if ("ARCHIVED".equalsIgnoreCase(product.getStatus())) {
            throw new ApiException("This product is no longer available");
        }

        String size = req.getSize();
        String color = (req.getColor() != null && !req.getColor().isBlank()) 
            ? req.getColor().trim() 
            : (product.getBaseColour() != null ? product.getBaseColour() : "Black");
        int addQty = req.getQuantity() != null && req.getQuantity() > 0 ? req.getQuantity() : 1;

        Long variantId = null;
        if (req.getVariantId() != null && !req.getVariantId().isBlank()) {
            try {
                variantId = Long.parseLong(req.getVariantId().trim());
            } catch (NumberFormatException ignored) {}
        } else if (product.getVariants() != null && !product.getVariants().isEmpty()) {
            ProductVariant matchedVariant = product.getVariants().stream()
                .filter(v -> size.equalsIgnoreCase(v.getSize()))
                .findFirst()
                .orElse(product.getVariants().get(0));
            if (matchedVariant != null) {
                variantId = matchedVariant.getId();
            }
        }

        BigDecimal unitPrice = product.getBasePrice() != null ? product.getBasePrice() : BigDecimal.valueOf(1499);
        String imageUrl = (product.getImages() != null && !product.getImages().isEmpty())
            ? product.getImages().get(0).getImageUrl()
            : "/images/" + product.getExternalProductId() + ".jpg";

        // Check if item already exists in cart with same product ID and size
        Optional<CartItem> existingItemOpt = cart.getItems().stream()
            .filter(item -> item.getProductId().equals(prodId) && size.equalsIgnoreCase(item.getSize()))
            .findFirst();

        if (existingItemOpt.isPresent()) {
            CartItem existing = existingItemOpt.get();
            existing.setQuantity(existing.getQuantity() + addQty);
            existing.setTotal(existing.getPrice().multiply(BigDecimal.valueOf(existing.getQuantity())));
        } else {
            CartItem newItem = new CartItem();
            newItem.setCart(cart);
            newItem.setProductId(prodId);
            newItem.setVariantId(variantId);
            newItem.setProductName(product.getName());
            newItem.setSize(size);
            newItem.setColor(color);
            newItem.setQuantity(addQty);
            newItem.setPrice(unitPrice);
            newItem.setTotal(unitPrice.multiply(BigDecimal.valueOf(addQty)));
            newItem.setImageUrl(imageUrl);
            cart.getItems().add(newItem);
        }

        recalculateCart(cart);
        return cartRepository.save(cart);
    }

    private void recalculateCart(Cart cart) {
        BigDecimal subtotal = BigDecimal.ZERO;
        if (cart.getItems() != null) {
            for (CartItem item : cart.getItems()) {
                BigDecimal itemTotal = item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
                item.setTotal(itemTotal);
                subtotal = subtotal.add(itemTotal);
            }
        }

        BigDecimal discount = cart.getDiscount() != null ? cart.getDiscount() : BigDecimal.ZERO;
        BigDecimal shipping = (subtotal.compareTo(new BigDecimal(1499)) >= 0 || (cart.getItems() != null && cart.getItems().isEmpty()))
            ? BigDecimal.ZERO
            : new BigDecimal(99);
        BigDecimal total = subtotal.subtract(discount).add(shipping).max(BigDecimal.ZERO);

        cart.setSubtotal(subtotal);
        cart.setDiscount(discount);
        cart.setShipping(shipping);
        cart.setTotal(total);
        cart.setUpdatedAt(LocalDateTime.now());
    }
}
