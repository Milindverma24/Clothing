package com.clothing.dto;

public class ReturnOrderItemRequestDTO {
    private Long orderItemId;
    private Integer quantity = 1;
    private String reason;

    public ReturnOrderItemRequestDTO() {}

    public ReturnOrderItemRequestDTO(Long orderItemId, Integer quantity, String reason) {
        this.orderItemId = orderItemId;
        this.quantity = quantity;
        this.reason = reason;
    }

    public Long getOrderItemId() { return orderItemId; }
    public void setOrderItemId(Long orderItemId) { this.orderItemId = orderItemId; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}
