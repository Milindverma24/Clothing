package com.clothing.dto;

import jakarta.validation.constraints.NotBlank;

public class AdminReplyRequestDTO {

    @NotBlank(message = "Reply message cannot be empty")
    private String message;

    private String adminName;

    public AdminReplyRequestDTO() {}

    public AdminReplyRequestDTO(String message, String adminName) {
        this.message = message;
        this.adminName = adminName;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getAdminName() {
        return adminName;
    }

    public void setAdminName(String adminName) {
        this.adminName = adminName;
    }
}
