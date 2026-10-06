package com.clothing.dto;

import java.time.LocalDateTime;

public class OrderTrackingDTO {
    private boolean available;
    private String carrier;
    private String trackingNumber;
    private String currentStatus;
    private LocalDateTime estimatedDeliveryDate;

    public OrderTrackingDTO() {}

    public OrderTrackingDTO(boolean available, String carrier, String trackingNumber, String currentStatus, LocalDateTime estimatedDeliveryDate) {
        this.available = available;
        this.carrier = carrier;
        this.trackingNumber = trackingNumber;
        this.currentStatus = currentStatus;
        this.estimatedDeliveryDate = estimatedDeliveryDate;
    }

    public boolean isAvailable() { return available; }
    public void setAvailable(boolean available) { this.available = available; }

    public String getCarrier() { return carrier; }
    public void setCarrier(String carrier) { this.carrier = carrier; }

    public String getTrackingNumber() { return trackingNumber; }
    public void setTrackingNumber(String trackingNumber) { this.trackingNumber = trackingNumber; }

    public String getCurrentStatus() { return currentStatus; }
    public void setCurrentStatus(String currentStatus) { this.currentStatus = currentStatus; }

    public LocalDateTime getEstimatedDeliveryDate() { return estimatedDeliveryDate; }
    public void setEstimatedDeliveryDate(LocalDateTime estimatedDeliveryDate) { this.estimatedDeliveryDate = estimatedDeliveryDate; }
}
