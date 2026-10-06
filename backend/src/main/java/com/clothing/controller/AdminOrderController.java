package com.clothing.controller;

import com.clothing.dto.ApiResponse;
import com.clothing.entity.Order;
import com.clothing.service.CustomerOrderService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/orders")
@PreAuthorize("hasRole('ADMIN')")
public class AdminOrderController {

    private final CustomerOrderService orderService;

    public AdminOrderController(CustomerOrderService orderService) {
        this.orderService = orderService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Order>>> getAllOrders() {
        List<Order> orders = orderService.getAllOrders();
        return ResponseEntity.ok(ApiResponse.ok(orders));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Order>> getOrderDetails(@PathVariable String id) {
        Order order = orderService.findOrderByIdOrReference(id);
        return ResponseEntity.ok(ApiResponse.ok(order));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<Order>> updateOrderStatus(
        @PathVariable String id,
        @RequestBody Map<String, String> body
    ) {
        String status = body.get("status");
        if (status == null || status.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Status is required"));
        }
        Order order = orderService.updateOrderStatus(id, status);
        return ResponseEntity.ok(ApiResponse.ok(order, "Order status updated to " + order.getStatus()));
    }

    @PatchMapping("/{id}/return-status")
    public ResponseEntity<ApiResponse<Order>> updateOrderReturnStatus(
        @PathVariable String id,
        @RequestBody Map<String, String> body
    ) {
        String returnStatus = body.get("returnStatus");
        if (returnStatus == null || returnStatus.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("returnStatus is required"));
        }
        Order order = orderService.updateOrderReturnStatus(id, returnStatus);
        return ResponseEntity.ok(ApiResponse.ok(order, "Return status updated to " + order.getReturnStatus()));
    }

    @PostMapping("/{id}/return/approve")
    public ResponseEntity<ApiResponse<Order>> approveOrderReturn(@PathVariable String id) {
        Order order = orderService.adminApproveReturn(id);
        return ResponseEntity.ok(ApiResponse.ok(order, "Return and refund request approved successfully"));
    }

    @PostMapping("/{id}/return/reject")
    public ResponseEntity<ApiResponse<Order>> rejectOrderReturn(
        @PathVariable String id,
        @RequestBody(required = false) Map<String, String> body
    ) {
        String reason = body != null ? body.get("reason") : null;
        Order order = orderService.adminRejectReturn(id, reason);
        return ResponseEntity.ok(ApiResponse.ok(order, "Return request rejected"));
    }
}
