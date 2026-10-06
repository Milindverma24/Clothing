package com.clothing.dto;

import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public class ReturnOrderRequest {

    @NotBlank(message = "Reason for return is required")
    private String reason;

    private String comment;

    private String upiId;

    private String trackingOrOrderNumber;

    private BigDecimal refundAmount;

    private LocalDateTime pickupDate;

    private String pickupAddress;

    private String returnSource = "WEB_PORTAL";

    public ReturnOrderRequest() {}

    public ReturnOrderRequest(String reason, String comment) {
        this.reason = reason;
        this.comment = comment;
    }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }

    public String getUpiId() { return upiId; }
    public void setUpiId(String upiId) { this.upiId = upiId; }

    public String getTrackingOrOrderNumber() { return trackingOrOrderNumber; }
    public void setTrackingOrOrderNumber(String trackingOrOrderNumber) { this.trackingOrOrderNumber = trackingOrOrderNumber; }

    public BigDecimal getRefundAmount() { return refundAmount; }
    public void setRefundAmount(BigDecimal refundAmount) { this.refundAmount = refundAmount; }

    public LocalDateTime getPickupDate() { return pickupDate; }
    public void setPickupDate(LocalDateTime pickupDate) { this.pickupDate = pickupDate; }

    public String getPickupAddress() { return pickupAddress; }
    public void setPickupAddress(String pickupAddress) { this.pickupAddress = pickupAddress; }

    public String getReturnSource() { return returnSource; }
    public void setReturnSource(String returnSource) { this.returnSource = returnSource; }
}
