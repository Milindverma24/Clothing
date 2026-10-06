package com.clothing.dto;

import java.util.Map;

public class CancelOrderResponseDTO {
    private boolean success = true;
    private String message;
    private String orderId;
    private String status;
    private MyOrderDetailDTO order;
    private Map<String, Object> cancellation;

    public CancelOrderResponseDTO() {}

    public CancelOrderResponseDTO(boolean success, String message, String orderId, String status, MyOrderDetailDTO order, Map<String, Object> cancellation) {
        this.success = success;
        this.message = message;
        this.orderId = orderId;
        this.status = status;
        this.order = order;
        this.cancellation = cancellation;
    }

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getOrderId() { return orderId; }
    public void setOrderId(String orderId) { this.orderId = orderId; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public MyOrderDetailDTO getOrder() { return order; }
    public void setOrder(MyOrderDetailDTO order) { this.order = order; }

    public Map<String, Object> getCancellation() { return cancellation; }
    public void setCancellation(Map<String, Object> cancellation) { this.cancellation = cancellation; }
}
