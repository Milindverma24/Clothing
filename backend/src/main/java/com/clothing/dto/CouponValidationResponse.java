package com.clothing.dto;

import java.math.BigDecimal;

public class CouponValidationResponse {
    private boolean valid;
    private String code;
    private String discountType;
    private BigDecimal discountAmount;
    private String message;

    public CouponValidationResponse() {}

    public CouponValidationResponse(boolean valid, String code, String discountType, BigDecimal discountAmount, String message) {
        this.valid = valid;
        this.code = code;
        this.discountType = discountType;
        this.discountAmount = discountAmount;
        this.message = message;
    }

    public boolean isValid() { return valid; }
    public void setValid(boolean valid) { this.valid = valid; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getDiscountType() { return discountType; }
    public void setDiscountType(String discountType) { this.discountType = discountType; }

    public BigDecimal getDiscountAmount() { return discountAmount; }
    public void setDiscountAmount(BigDecimal discountAmount) { this.discountAmount = discountAmount; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}
