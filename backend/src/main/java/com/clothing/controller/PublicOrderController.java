package com.clothing.controller;

import com.clothing.dto.ApiResponse;
import com.clothing.entity.Order;
import com.clothing.security.UserPrincipal;
import com.clothing.service.CustomerOrderService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;

@RestController
@RequestMapping("/api/orders")
public class PublicOrderController {

    private final CustomerOrderService orderService;

    public PublicOrderController(CustomerOrderService orderService) {
        this.orderService = orderService;
    }

    @GetMapping
    public ResponseEntity<List<Order>> getCustomerOrders(@AuthenticationPrincipal UserPrincipal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        List<Order> orders = orderService.getUserOrders(principal.getId());
        if (orders == null) {
            orders = Collections.emptyList();
        }
        return ResponseEntity.ok(orders);
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<Order> cancelOrder(
        @PathVariable String id,
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        Order cancelled = orderService.cancelOrder(principal.getId(), id);
        return ResponseEntity.ok(cancelled);
    }

    @GetMapping("/trackable")
    public ResponseEntity<List<Order>> getTrackableOrders(@AuthenticationPrincipal UserPrincipal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        List<Order> orders = orderService.getTrackableOrders(principal.getId());
        return ResponseEntity.ok(orders != null ? orders : Collections.emptyList());
    }

    @GetMapping("/{id}/actions")
    public ResponseEntity<ApiResponse<java.util.Map<String, Object>>> getOrderActions(
        @PathVariable String id,
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        java.util.Map<String, Object> actions = orderService.getOrderActions(principal.getId(), id);
        return ResponseEntity.ok(ApiResponse.ok(actions));
    }

    @GetMapping("/track/{trackingNumber}")
    public ResponseEntity<ApiResponse<Order>> trackOrder(@PathVariable String trackingNumber) {
        Order order = orderService.trackOrderByNumber(trackingNumber);
        return ResponseEntity.ok(ApiResponse.ok(order));
    }
}
