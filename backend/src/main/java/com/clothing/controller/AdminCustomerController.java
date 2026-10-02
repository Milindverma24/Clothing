package com.clothing.controller;

import com.clothing.dto.ApiResponse;
import com.clothing.dto.UserDto;
import com.clothing.entity.CustomerReview;
import com.clothing.entity.Order;
import com.clothing.entity.User;
import com.clothing.exception.ApiException;
import com.clothing.repository.CustomerReviewRepository;
import com.clothing.repository.OrderRepository;
import com.clothing.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/customers")
public class AdminCustomerController {

    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final CustomerReviewRepository reviewRepository;

    public AdminCustomerController(
        UserRepository userRepository,
        OrderRepository orderRepository,
        CustomerReviewRepository reviewRepository
    ) {
        this.userRepository = userRepository;
        this.orderRepository = orderRepository;
        this.reviewRepository = reviewRepository;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> getCustomers(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        Page<User> userPage = userRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(page, size));

        List<Map<String, Object>> customerCards = userPage.getContent().stream().map(u -> {
            List<Order> userOrders = orderRepository.findAllByUserIdOrderByCreatedAtDesc(u.getId());
            BigDecimal totalSpend = userOrders.stream()
                .map(Order::getTotal)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

            Map<String, Object> map = new HashMap<>();
            map.put("id", u.getId());
            map.put("name", u.getFullName());
            map.put("email", u.getEmail());
            map.put("phone", u.getPhone());
            map.put("role", u.getRole());
            map.put("status", u.getStatus());
            map.put("emailVerified", u.getEmailVerified());
            map.put("createdAt", u.getCreatedAt());
            map.put("lastLoginAt", u.getLastLoginAt());
            map.put("orderCount", userOrders.size());
            map.put("totalSpend", totalSpend);
            return map;
        }).collect(Collectors.toList());

        Map<String, Object> response = new HashMap<>();
        response.put("customers", customerCards);
        response.put("totalElements", userPage.getTotalElements());
        response.put("totalPages", userPage.getTotalPages());
        response.put("currentPage", page);

        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getCustomerDetails(@PathVariable Long id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new ApiException("Customer not found"));

        List<Order> orders = orderRepository.findAllByUserIdOrderByCreatedAtDesc(id);
        List<CustomerReview> reviews = reviewRepository.findAllByUserIdOrderByCreatedAtDesc(id);

        Map<String, Object> details = new HashMap<>();
        details.put("user", UserDto.fromEntity(user));
        details.put("orders", orders);
        details.put("reviews", reviews);

        return ResponseEntity.ok(ApiResponse.ok(details));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<UserDto>> updateCustomerStatus(
        @PathVariable Long id,
        @RequestBody Map<String, String> body
    ) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new ApiException("Customer not found"));

        String newStatus = body.get("status");
        if (newStatus != null && !newStatus.isBlank()) {
            user.setStatus(newStatus.toUpperCase());
            user = userRepository.save(user);
        }

        return ResponseEntity.ok(ApiResponse.ok(UserDto.fromEntity(user), "Customer status updated"));
    }
}
