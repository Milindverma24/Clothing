package com.clothing.dto;

import java.util.List;

public class ReturnOrderRequestDTO {
    private String reason;
    private List<ReturnOrderItemRequestDTO> items;
    private String confirmationToken;
    private String comment;
    private String upiId;
    private String pickupAddress;

    public ReturnOrderRequestDTO() {}

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public List<ReturnOrderItemRequestDTO> getItems() { return items; }
    public void setItems(List<ReturnOrderItemRequestDTO> items) { this.items = items; }

    public String getConfirmationToken() { return confirmationToken; }
    public void setConfirmationToken(String confirmationToken) { this.confirmationToken = confirmationToken; }

    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }

    public String getUpiId() { return upiId; }
    public void setUpiId(String upiId) { this.upiId = upiId; }

    public String getPickupAddress() { return pickupAddress; }
    public void setPickupAddress(String pickupAddress) { this.pickupAddress = pickupAddress; }
}
