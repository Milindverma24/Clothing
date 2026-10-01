package com.clothing.service;

import com.clothing.dto.CouponValidationRequest;
import com.clothing.dto.CouponValidationResponse;
import com.clothing.entity.Coupon;
import com.clothing.repository.CouponRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Optional;

@Service
public class CouponService {

    private final CouponRepository couponRepository;

    public CouponService(CouponRepository couponRepository) {
        this.couponRepository = couponRepository;
    }

    public CouponValidationResponse validateCoupon(CouponValidationRequest request) {
        String cleanCode = request.getCode().trim().toUpperCase();
        BigDecimal subtotal = request.getCartSubtotal();

        Optional<Coupon> opt = couponRepository.findByCodeIgnoreCase(cleanCode);

        // Fallback for initial demo coupons if DB not seeded yet
        if (opt.isEmpty()) {
            if ("WELCOME10".equalsIgnoreCase(cleanCode)) {
                BigDecimal discount = subtotal.multiply(BigDecimal.valueOf(0.10)).setScale(0, RoundingMode.HALF_UP);
                return new CouponValidationResponse(true, "WELCOME10", "PERCENTAGE", discount, "10% Welcome discount applied");
            }
            if ("SAVE500".equalsIgnoreCase(cleanCode)) {
                if (subtotal.compareTo(BigDecimal.valueOf(2499)) < 0) {
                    return new CouponValidationResponse(false, "SAVE500", "FIXED_AMOUNT", BigDecimal.ZERO, "Minimum cart subtotal of ₹2,499 required for SAVE500");
                }
                return new CouponValidationResponse(true, "SAVE500", "FIXED_AMOUNT", BigDecimal.valueOf(500), "Flat ₹500 discount applied");
            }
            if ("FREESHIP".equalsIgnoreCase(cleanCode)) {
                return new CouponValidationResponse(true, "FREESHIP", "FREE_SHIPPING", BigDecimal.valueOf(99), "Free shipping applied");
            }
            if ("MILIND10".equalsIgnoreCase(cleanCode)) {
                return new CouponValidationResponse(true, "MILIND10", "FIXED_AMOUNT", BigDecimal.valueOf(150), "Exclusive ₹150 discount applied");
            }

            return new CouponValidationResponse(false, cleanCode, "NONE", BigDecimal.ZERO, "Coupon code not found or invalid");
        }

        Coupon coupon = opt.get();
        if (!"ACTIVE".equalsIgnoreCase(coupon.getStatus())) {
            return new CouponValidationResponse(false, coupon.getCode(), coupon.getDiscountType(), BigDecimal.ZERO, "This coupon is currently inactive");
        }

        if (coupon.getMinimumCartValue() != null && subtotal.compareTo(coupon.getMinimumCartValue()) < 0) {
            return new CouponValidationResponse(false, coupon.getCode(), coupon.getDiscountType(), BigDecimal.ZERO,
                    "Cart subtotal must be at least ₹" + coupon.getMinimumCartValue() + " to use this coupon");
        }

        BigDecimal discountAmount = BigDecimal.ZERO;
        if ("PERCENTAGE".equalsIgnoreCase(coupon.getDiscountType())) {
            discountAmount = subtotal.multiply(coupon.getDiscountValue().divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP))
                    .setScale(0, RoundingMode.HALF_UP);
            if (coupon.getMaximumDiscount() != null && discountAmount.compareTo(coupon.getMaximumDiscount()) > 0) {
                discountAmount = coupon.getMaximumDiscount();
            }
        } else if ("FIXED_AMOUNT".equalsIgnoreCase(coupon.getDiscountType())) {
            discountAmount = coupon.getDiscountValue().min(subtotal);
        } else if ("FREE_SHIPPING".equalsIgnoreCase(coupon.getDiscountType())) {
            discountAmount = BigDecimal.valueOf(99);
        }

        return new CouponValidationResponse(true, coupon.getCode(), coupon.getDiscountType(), discountAmount, "Coupon applied successfully");
    }
}
