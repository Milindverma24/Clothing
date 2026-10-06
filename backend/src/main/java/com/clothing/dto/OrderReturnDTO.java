package com.clothing.dto;

import java.time.LocalDateTime;

public class OrderReturnDTO {
    private boolean eligible;
    private String status;
    private Integer daysRemaining;
    private LocalDateTime returnDeadline;
    private String reason;

    public OrderReturnDTO() {}

    public OrderReturnDTO(boolean eligible, String status, Integer daysRemaining, LocalDateTime returnDeadline, String reason) {
        this.eligible = eligible;
        this.status = status;
        this.daysRemaining = daysRemaining;
        this.returnDeadline = returnDeadline;
        this.reason = reason;
    }

    public boolean isEligible() { return eligible; }
    public void setEligible(boolean eligible) { this.eligible = eligible; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Integer getDaysRemaining() { return daysRemaining; }
    public void setDaysRemaining(Integer daysRemaining) { this.daysRemaining = daysRemaining; }

    public LocalDateTime getReturnDeadline() { return returnDeadline; }
    public void setReturnDeadline(LocalDateTime returnDeadline) { this.returnDeadline = returnDeadline; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}
