package com.clothing.controller;

import com.clothing.dto.ApiResponse;
import com.clothing.entity.Coupon;
import com.clothing.exception.ApiException;
import com.clothing.repository.CouponRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/coupons")
@PreAuthorize("hasRole('ADMIN')")
public class AdminCouponController {

    private final CouponRepository couponRepository;

    public AdminCouponController(CouponRepository couponRepository) {
        this.couponRepository = couponRepository;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Coupon>>> getAllCoupons() {
        return ResponseEntity.ok(ApiResponse.ok(couponRepository.findAll()));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Coupon>> createCoupon(@RequestBody Map<String, Object> body) {
        String code = (String) body.get("code");
        if (code == null || code.isBlank()) {
            throw new ApiException("Coupon code is required");
        }
        String cleanCode = code.trim().toUpperCase();
        if (couponRepository.findByCodeIgnoreCase(cleanCode).isPresent()) {
            throw new ApiException("Coupon with code '" + cleanCode + "' already exists");
        }

        String type = (String) body.getOrDefault("discountType", body.getOrDefault("type", "PERCENTAGE"));
        BigDecimal value = new BigDecimal(body.getOrDefault("discountValue", body.getOrDefault("value", 10)).toString());
        BigDecimal minCart = body.containsKey("minimumCartValue") && body.get("minimumCartValue") != null
            ? new BigDecimal(body.get("minimumCartValue").toString())
            : null;
        BigDecimal maxDiscount = body.containsKey("maximumDiscount") && body.get("maximumDiscount") != null
            ? new BigDecimal(body.get("maximumDiscount").toString())
            : null;

        Coupon coupon = new Coupon();
        coupon.setCode(cleanCode);
        coupon.setDiscountType(type.toUpperCase());
        coupon.setDiscountValue(value);
        coupon.setMinimumCartValue(minCart);
        coupon.setMaximumDiscount(maxDiscount);
        coupon.setStatus("ACTIVE");
        coupon.setUsedCount(0);

        coupon = couponRepository.save(coupon);
        return ResponseEntity.ok(ApiResponse.ok(coupon, "Coupon created successfully"));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<Coupon>> toggleCouponStatus(
        @PathVariable Long id,
        @RequestBody(required = false) Map<String, String> body
    ) {
        Coupon coupon = couponRepository.findById(id)
            .orElseThrow(() -> new ApiException("Coupon not found"));

        if (body != null && body.containsKey("status")) {
            coupon.setStatus(body.get("status").toUpperCase());
        } else {
            coupon.setStatus("ACTIVE".equalsIgnoreCase(coupon.getStatus()) ? "INACTIVE" : "ACTIVE");
        }

        coupon = couponRepository.save(coupon);
        return ResponseEntity.ok(ApiResponse.ok(coupon, "Coupon status updated to " + coupon.getStatus()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<String>> deleteCoupon(@PathVariable Long id) {
        if (!couponRepository.existsById(id)) {
            throw new ApiException("Coupon not found");
        }
        couponRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.ok("Coupon deleted successfully"));
    }
}
