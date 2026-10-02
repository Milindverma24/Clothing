package com.clothing.controller;

import com.clothing.dto.*;
import com.clothing.entity.*;
import com.clothing.exception.ApiException;
import com.clothing.repository.SecurityAuditLogRepository;
import com.clothing.repository.UserRepository;
import com.clothing.security.UserPrincipal;
import com.clothing.service.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/account")
public class AccountController {

    private final UserRepository userRepository;
    private final AuthService authService;
    private final AddressService addressService;
    private final WishlistService wishlistService;
    private final CustomerOrderService orderService;
    private final CustomerReviewService reviewService;
    private final NotificationService notificationService;
    private final SecurityAuditLogRepository auditLogRepository;

    public AccountController(
        UserRepository userRepository,
        AuthService authService,
        AddressService addressService,
        WishlistService wishlistService,
        CustomerOrderService orderService,
        CustomerReviewService reviewService,
        NotificationService notificationService,
        SecurityAuditLogRepository auditLogRepository
    ) {
        this.userRepository = userRepository;
        this.authService = authService;
        this.addressService = addressService;
        this.wishlistService = wishlistService;
        this.orderService = orderService;
        this.reviewService = reviewService;
        this.notificationService = notificationService;
        this.auditLogRepository = auditLogRepository;
    }

    // PROFILE
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserDto>> getMe(@AuthenticationPrincipal UserPrincipal principal) {
        if (principal == null) {
            throw new ApiException("Unauthorized");
        }
        User user = userRepository.findById(principal.getId())
            .orElseThrow(() -> new ApiException("User not found"));
        return ResponseEntity.ok(ApiResponse.ok(UserDto.fromEntity(user)));
    }

    @PatchMapping("/profile")
    public ResponseEntity<ApiResponse<UserDto>> updateProfile(
        @AuthenticationPrincipal UserPrincipal principal,
        @RequestBody Map<String, String> body
    ) {
        if (principal == null) {
            throw new ApiException("Unauthorized");
        }
        User user = userRepository.findById(principal.getId())
            .orElseThrow(() -> new ApiException("User not found"));

        if (body.containsKey("firstName") && !body.get("firstName").isBlank()) {
            user.setFirstName(body.get("firstName").trim());
        }
        if (body.containsKey("lastName")) {
            user.setLastName(body.get("lastName").trim());
        }
        if (body.containsKey("phone")) {
            user.setPhone(body.get("phone").trim());
        }
        if (body.containsKey("avatarUrl")) {
            user.setAvatarUrl(body.get("avatarUrl").trim());
        }
        user.setUpdatedAt(LocalDateTime.now());
        user = userRepository.save(user);

        return ResponseEntity.ok(ApiResponse.ok(UserDto.fromEntity(user), "Profile updated successfully"));
    }

    // SECURITY & PASSWORD
    @PostMapping("/change-password")
    public ResponseEntity<ApiResponse<String>> changePassword(
        @AuthenticationPrincipal UserPrincipal principal,
        @Valid @RequestBody ChangePasswordRequest request,
        HttpServletRequest httpRequest
    ) {
        authService.changePassword(principal.getId(), request, httpRequest.getRemoteAddr());
        return ResponseEntity.ok(ApiResponse.ok("Password updated successfully"));
    }

    @PostMapping("/unlink-google")
    public ResponseEntity<ApiResponse<String>> unlinkGoogle(
        @AuthenticationPrincipal UserPrincipal principal,
        HttpServletRequest httpRequest
    ) {
        authService.unlinkGoogle(principal.getId(), httpRequest.getRemoteAddr());
        return ResponseEntity.ok(ApiResponse.ok("Google disconnected successfully"));
    }

    @PostMapping("/delete-account")
    public ResponseEntity<ApiResponse<String>> deleteAccount(
        @AuthenticationPrincipal UserPrincipal principal,
        HttpServletRequest httpRequest
    ) {
        authService.deleteAccount(principal.getId(), httpRequest.getRemoteAddr());
        return ResponseEntity.ok(ApiResponse.ok("Account deactivated successfully"));
    }

    @GetMapping("/security-events")
    public ResponseEntity<ApiResponse<List<SecurityAuditLog>>> getSecurityEvents(
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        List<SecurityAuditLog> logs = auditLogRepository.findAllByUserIdOrderByCreatedAtDesc(principal.getId());
        return ResponseEntity.ok(ApiResponse.ok(logs));
    }

    // ADDRESSES
    @GetMapping("/addresses")
    public ResponseEntity<ApiResponse<List<AddressDto>>> getAddresses(
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.ok(ApiResponse.ok(addressService.getUserAddresses(principal.getId())));
    }

    @PostMapping("/addresses")
    public ResponseEntity<ApiResponse<AddressDto>> createAddress(
        @AuthenticationPrincipal UserPrincipal principal,
        @Valid @RequestBody AddressDto dto
    ) {
        return ResponseEntity.ok(ApiResponse.ok(addressService.createAddress(principal.getId(), dto), "Address saved"));
    }

    @PatchMapping("/addresses/{id}")
    public ResponseEntity<ApiResponse<AddressDto>> updateAddress(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable Long id,
        @Valid @RequestBody AddressDto dto
    ) {
        return ResponseEntity.ok(ApiResponse.ok(addressService.updateAddress(principal.getId(), id, dto), "Address updated"));
    }

    @DeleteMapping("/addresses/{id}")
    public ResponseEntity<ApiResponse<String>> deleteAddress(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable Long id
    ) {
        addressService.deleteAddress(principal.getId(), id);
        return ResponseEntity.ok(ApiResponse.ok("Address deleted"));
    }

    @PatchMapping("/addresses/{id}/default-shipping")
    public ResponseEntity<ApiResponse<String>> setDefaultShipping(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable Long id
    ) {
        addressService.setDefaultShipping(principal.getId(), id);
        return ResponseEntity.ok(ApiResponse.ok("Default shipping address updated"));
    }

    // WISHLIST
    @GetMapping("/wishlist")
    public ResponseEntity<ApiResponse<List<Product>>> getWishlist(
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.ok(ApiResponse.ok(wishlistService.getUserWishlist(principal.getId())));
    }

    @PostMapping("/wishlist/{productId}")
    public ResponseEntity<ApiResponse<String>> addToWishlist(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable Long productId
    ) {
        wishlistService.addToWishlist(principal.getId(), productId);
        return ResponseEntity.ok(ApiResponse.ok("Item added to wishlist"));
    }

    @DeleteMapping("/wishlist/{productId}")
    public ResponseEntity<ApiResponse<String>> removeFromWishlist(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable Long productId
    ) {
        wishlistService.removeFromWishlist(principal.getId(), productId);
        return ResponseEntity.ok(ApiResponse.ok("Item removed from wishlist"));
    }

    @PostMapping("/wishlist/sync")
    public ResponseEntity<ApiResponse<List<Long>>> syncWishlist(
        @AuthenticationPrincipal UserPrincipal principal,
        @RequestBody Map<String, List<Long>> payload
    ) {
        List<Long> productIds = payload.get("productIds");
        List<Long> updated = wishlistService.syncGuestWishlist(principal.getId(), productIds);
        return ResponseEntity.ok(ApiResponse.ok(updated, "Wishlist synchronized"));
    }

    // ORDERS
    @GetMapping("/orders")
    public ResponseEntity<ApiResponse<List<Order>>> getOrders(
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.ok(ApiResponse.ok(orderService.getUserOrders(principal.getId())));
    }

    @GetMapping("/orders/{id}")
    public ResponseEntity<ApiResponse<Order>> getOrder(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable Long id
    ) {
        return ResponseEntity.ok(ApiResponse.ok(orderService.getOrderDetails(principal.getId(), id)));
    }

    @PostMapping("/orders")
    public ResponseEntity<ApiResponse<Order>> createOrder(
        @AuthenticationPrincipal UserPrincipal principal,
        @RequestBody Map<String, Object> payload
    ) {
        if (principal == null) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error("Authentication required to place an order"));
        }
        Order order = orderService.createOrderForUser(principal.getId(), payload);
        return ResponseEntity.ok(ApiResponse.ok(order, "Order placed successfully"));
    }

    @PostMapping("/orders/{id}/return")
    public ResponseEntity<ApiResponse<Order>> requestReturn(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable Long id,
        @Valid @RequestBody ReturnOrderRequest request
    ) {
        Order order = orderService.requestReturn(principal.getId(), id, request);
        return ResponseEntity.ok(ApiResponse.ok(order, "Return request submitted"));
    }

    // REVIEWS
    @GetMapping("/reviews")
    public ResponseEntity<ApiResponse<List<CustomerReview>>> getReviews(
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.ok(ApiResponse.ok(reviewService.getUserReviews(principal.getId())));
    }

    @PostMapping("/reviews")
    public ResponseEntity<ApiResponse<CustomerReview>> submitReview(
        @AuthenticationPrincipal UserPrincipal principal,
        @Valid @RequestBody ReviewRequest request
    ) {
        CustomerReview review = reviewService.submitReview(principal.getId(), request);
        return ResponseEntity.ok(ApiResponse.ok(review, "Review submitted successfully"));
    }

    // NOTIFICATIONS
    @GetMapping("/notifications")
    public ResponseEntity<ApiResponse<List<UserNotification>>> getNotifications(
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.ok(ApiResponse.ok(notificationService.getUserNotifications(principal.getId())));
    }

    @PatchMapping("/notifications/{id}/read")
    public ResponseEntity<ApiResponse<String>> markNotificationRead(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable Long id
    ) {
        notificationService.markAsRead(principal.getId(), id);
        return ResponseEntity.ok(ApiResponse.ok("Notification marked as read"));
    }

    @PostMapping("/notifications/mark-all-read")
    public ResponseEntity<ApiResponse<String>> markAllNotificationsRead(
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        notificationService.markAllAsRead(principal.getId());
        return ResponseEntity.ok(ApiResponse.ok("All notifications marked as read"));
    }
}
