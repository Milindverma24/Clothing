package com.clothing.dto;

import jakarta.validation.constraints.NotBlank;

public class ReturnOrderRequest {

    @NotBlank(message = "Reason for return is required")
    private String reason;

    private String comment;

    public ReturnOrderRequest() {}

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }
}
