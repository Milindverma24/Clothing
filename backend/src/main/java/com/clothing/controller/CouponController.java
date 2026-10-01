package com.clothing.controller;

import com.clothing.dto.ApiResponse;
import com.clothing.dto.CouponValidationRequest;
import com.clothing.dto.CouponValidationResponse;
import com.clothing.service.CouponService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/coupons")
public class CouponController {

    private final CouponService couponService;

    public CouponController(CouponService couponService) {
        this.couponService = couponService;
    }

    @PostMapping("/validate")
    public ResponseEntity<ApiResponse<CouponValidationResponse>> validateCoupon(
            @Valid @RequestBody CouponValidationRequest request) {
        CouponValidationResponse response = couponService.validateCoupon(request);
        if (response.isValid()) {
            return ResponseEntity.ok(ApiResponse.ok(response, response.getMessage()));
        } else {
            return ResponseEntity.badRequest().body(ApiResponse.error(response.getMessage()));
        }
    }
}
