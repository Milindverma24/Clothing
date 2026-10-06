package com.clothing.dto;

public class CancelOrderRequestDTO {
    private String reason;
    private String confirmationToken;

    public CancelOrderRequestDTO() {}

    public CancelOrderRequestDTO(String reason, String confirmationToken) {
        this.reason = reason;
        this.confirmationToken = confirmationToken;
    }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public String getConfirmationToken() { return confirmationToken; }
    public void setConfirmationToken(String confirmationToken) { this.confirmationToken = confirmationToken; }
}
