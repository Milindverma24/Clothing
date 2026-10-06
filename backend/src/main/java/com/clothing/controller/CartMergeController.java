package com.clothing.controller;

import com.clothing.dto.AddToCartRequest;
import com.clothing.dto.ApiResponse;
import com.clothing.dto.CartMergeRequest;
import com.clothing.entity.Cart;
import com.clothing.entity.Coupon;
import com.clothing.entity.Product;
import com.clothing.repository.CouponRepository;
import com.clothing.repository.ProductRepository;
import com.clothing.security.UserPrincipal;
import com.clothing.service.CartService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.*;

@RestController
@RequestMapping("/api/cart")
public class CartMergeController {

    private final ProductRepository productRepository;
    private final CouponRepository couponRepository;
    private final CartService cartService;

    public CartMergeController(
        ProductRepository productRepository,
        CouponRepository couponRepository,
        CartService cartService
    ) {
        this.productRepository = productRepository;
        this.couponRepository = couponRepository;
        this.cartService = cartService;
    }

    @GetMapping
    public ResponseEntity<Cart> getCart(@AuthenticationPrincipal UserPrincipal principal) {
        if (principal == null) {
            Cart emptyCart = new Cart();
            emptyCart.setItems(new ArrayList<>());
            return ResponseEntity.ok(emptyCart);
        }

        Cart cart = cartService.getOrCreateCartForUser(principal.getId());
        return ResponseEntity.ok(cart);
    }

    @PostMapping("/items")
    public ResponseEntity<Cart> addToCart(
        @RequestBody AddToCartRequest request,
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Cart updatedCart = cartService.addItemToCart(principal.getId(), request);
        return ResponseEntity.ok(updatedCart);
    }

    @PostMapping("/validate-and-merge")
    public ResponseEntity<ApiResponse<Map<String, Object>>> validateAndMergeCart(@RequestBody CartMergeRequest request) {
        List<Map<String, Object>> validatedItems = new ArrayList<>();
        BigDecimal subtotal = BigDecimal.ZERO;

        if (request.getItems() != null) {
            for (CartMergeRequest.GuestCartItem guestItem : request.getItems()) {
                Optional<Product> optProduct = productRepository.findById(guestItem.getProductId())
                    .or(() -> productRepository.findByExternalProductId(guestItem.getProductId()));
                if (optProduct.isPresent()) {
                    Product product = optProduct.get();
                    if (!"ARCHIVED".equalsIgnoreCase(product.getStatus())) {
                        int qty = guestItem.getQuantity() != null && guestItem.getQuantity() > 0 ? guestItem.getQuantity() : 1;
                        BigDecimal unitPrice = product.getBasePrice();
                        BigDecimal itemTotal = unitPrice.multiply(BigDecimal.valueOf(qty));
                        subtotal = subtotal.add(itemTotal);

                        String itemImg = (product.getImages() != null && !product.getImages().isEmpty())
                            ? product.getImages().get(0).getImageUrl()
                            : "/images/" + product.getExternalProductId() + ".jpg";

                        Map<String, Object> itemMap = new HashMap<>();
                        itemMap.put("id", product.getId() + "-" + guestItem.getSize() + "-" + guestItem.getColor());
                        itemMap.put("productId", product.getId());
                        itemMap.put("productName", product.getName());
                        itemMap.put("size", guestItem.getSize() != null ? guestItem.getSize() : "M");
                        itemMap.put("color", guestItem.getColor() != null ? guestItem.getColor() : product.getBaseColour());
                        itemMap.put("quantity", qty);
                        itemMap.put("unitPrice", unitPrice);
                        itemMap.put("total", itemTotal);
                        itemMap.put("image", itemImg);
                        itemMap.put("imageUrl", itemImg);
                        itemMap.put("slug", product.getSlug());

                        validatedItems.add(itemMap);
                    }
                }
            }
        }

        BigDecimal discount = BigDecimal.ZERO;
        String couponCode = request.getCouponCode();
        if (couponCode != null && !couponCode.isBlank()) {
            Optional<Coupon> optCoupon = couponRepository.findByCodeIgnoreCase(couponCode.trim());
            if (optCoupon.isPresent()) {
                Coupon coupon = optCoupon.get();
                if ("ACTIVE".equalsIgnoreCase(coupon.getStatus())) {
                    if (coupon.getMinimumCartValue() == null || subtotal.compareTo(coupon.getMinimumCartValue()) >= 0) {
                        if ("PERCENTAGE".equalsIgnoreCase(coupon.getDiscountType())) {
                            discount = subtotal.multiply(coupon.getDiscountValue()).divide(new BigDecimal(100));
                            if (coupon.getMaximumDiscount() != null && discount.compareTo(coupon.getMaximumDiscount()) > 0) {
                                discount = coupon.getMaximumDiscount();
                            }
                        } else {
                            discount = coupon.getDiscountValue().min(subtotal);
                        }
                    }
                }
            }
        }

        BigDecimal shipping = subtotal.compareTo(new BigDecimal(1499)) >= 0 || validatedItems.isEmpty()
            ? BigDecimal.ZERO
            : new BigDecimal(99);
        BigDecimal total = subtotal.subtract(discount).add(shipping).max(BigDecimal.ZERO);

        Map<String, Object> result = new HashMap<>();
        result.put("items", validatedItems);
        result.put("subtotal", subtotal);
        result.put("discount", discount);
        result.put("shipping", shipping);
        result.put("total", total);
        result.put("couponCode", couponCode);

        return ResponseEntity.ok(ApiResponse.ok(result, "Cart validated with database prices"));
    }
}
