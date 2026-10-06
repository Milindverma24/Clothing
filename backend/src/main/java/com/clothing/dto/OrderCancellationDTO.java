package com.clothing.dto;

public class OrderCancellationDTO {
    private boolean eligible;
    private String status;
    private String reason;

    public OrderCancellationDTO() {}

    public OrderCancellationDTO(boolean eligible, String status, String reason) {
        this.eligible = eligible;
        this.status = status;
        this.reason = reason;
    }

    public boolean isEligible() { return eligible; }
    public void setEligible(boolean eligible) { this.eligible = eligible; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}
