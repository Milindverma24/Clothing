package com.clothing.controller;

import com.clothing.dto.*;
import com.clothing.security.UserPrincipal;
import com.clothing.service.OrderLifecycleService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/my/orders")
public class MyOrderController {

    private final OrderLifecycleService orderLifecycleService;

    public MyOrderController(OrderLifecycleService orderLifecycleService) {
        this.orderLifecycleService = orderLifecycleService;
    }

    /**
     * 1. TRACK ORDER FLOW: Fetch only trackable orders belonging to the authenticated customer.
     * GET /api/my/orders/trackable
     */
    @GetMapping("/trackable")
    public ResponseEntity<ApiResponse<List<MyOrderDetailDTO>>> getTrackableOrders(
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        List<MyOrderDetailDTO> orders = orderLifecycleService.getTrackableOrders(principal.getId());
        return ResponseEntity.ok(ApiResponse.ok(orders));
    }

    /**
     * 3. SHOW ORDER: Fetch latest live order details scoped to authenticated customer.
     * Never leaks another customer's order (returns 404 NOT FOUND on mismatch).
     * GET /api/my/orders/{orderId}
     */
    @GetMapping("/{orderId}")
    public ResponseEntity<ApiResponse<MyOrderDetailDTO>> getOrderDetail(
        @PathVariable String orderId,
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        MyOrderDetailDTO detail = orderLifecycleService.getOrderDetail(principal.getId(), orderId);
        return ResponseEntity.ok(ApiResponse.ok(detail));
    }

    /**
     * 13. ORDER ACTIONS: Get live dynamic available actions for this order.
     * GET /api/my/orders/{orderId}/actions
     */
    @GetMapping("/{orderId}/actions")
    public ResponseEntity<ApiResponse<OrderActionsResponseDTO>> getOrderActions(
        @PathVariable String orderId,
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        OrderActionsResponseDTO actions = orderLifecycleService.getOrderActions(principal.getId(), orderId);
        return ResponseEntity.ok(ApiResponse.ok(actions));
    }

    /**
     * 5. CANCEL ORDER: Transactional cancellation.
     * POST /api/my/orders/{orderId}/cancel
     */
    @PostMapping("/{orderId}/cancel")
    public ResponseEntity<ApiResponse<CancelOrderResponseDTO>> cancelOrder(
        @PathVariable String orderId,
        @RequestBody(required = false) CancelOrderRequestDTO request,
        @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        CancelOrderResponseDTO response = orderLifecycleService.cancelOrder(principal.getId(), orderId, request, idempotencyKey);
        return ResponseEntity.ok(ApiResponse.ok(response, response.getMessage()));
    }

    /**
     * 9. RETURN ORDER: Transactional return workflow.
     * POST /api/my/orders/{orderId}/return
     */
    @PostMapping("/{orderId}/return")
    public ResponseEntity<ApiResponse<ReturnOrderResponseDTO>> returnOrder(
        @PathVariable String orderId,
        @RequestBody(required = false) ReturnOrderRequestDTO request,
        @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
        @AuthenticationPrincipal UserPrincipal principal
    ) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        ReturnOrderResponseDTO response = orderLifecycleService.returnOrder(principal.getId(), orderId, request, idempotencyKey);
        return ResponseEntity.ok(ApiResponse.ok(response, response.getMessage()));
    }
}
