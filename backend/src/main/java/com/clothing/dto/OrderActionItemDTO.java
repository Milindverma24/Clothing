package com.clothing.dto;

public class OrderActionItemDTO {
    private String type;
    private boolean enabled;
    private String reason;
    private Integer daysRemaining;

    public OrderActionItemDTO() {}

    public OrderActionItemDTO(String type, boolean enabled) {
        this.type = type;
        this.enabled = enabled;
    }

    public OrderActionItemDTO(String type, boolean enabled, String reason, Integer daysRemaining) {
        this.type = type;
        this.enabled = enabled;
        this.reason = reason;
        this.daysRemaining = daysRemaining;
    }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public Integer getDaysRemaining() { return daysRemaining; }
    public void setDaysRemaining(Integer daysRemaining) { this.daysRemaining = daysRemaining; }
}
