package com.clothing.controller;

import com.clothing.dto.ApiResponse;
import com.clothing.entity.Order;
import com.clothing.service.CustomerOrderService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/orders")
public class PublicOrderController {

    private final CustomerOrderService orderService;

    public PublicOrderController(CustomerOrderService orderService) {
        this.orderService = orderService;
    }

    @GetMapping("/track/{trackingNumber}")
    public ResponseEntity<ApiResponse<Order>> trackOrder(@PathVariable String trackingNumber) {
        Order order = orderService.trackOrderByNumber(trackingNumber);
        return ResponseEntity.ok(ApiResponse.ok(order));
    }
}
