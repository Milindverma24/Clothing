package com.clothing.dto;

import java.util.Map;

public class ReturnOrderResponseDTO {
    private boolean success = true;
    private String message;
    private String orderId;
    private String status;
    private MyOrderDetailDTO order;
    private Map<String, Object> returnRequest;

    public ReturnOrderResponseDTO() {}

    public ReturnOrderResponseDTO(boolean success, String message, String orderId, String status, MyOrderDetailDTO order, Map<String, Object> returnRequest) {
        this.success = success;
        this.message = message;
        this.orderId = orderId;
        this.status = status;
        this.order = order;
        this.returnRequest = returnRequest;
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

    public Map<String, Object> getReturnRequest() { return returnRequest; }
    public void setReturnRequest(Map<String, Object> returnRequest) { this.returnRequest = returnRequest; }
}
