package com.clothing.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class MyOrderDetailDTO {
    private String orderId;
    private Long id;
    private LocalDateTime orderDate;
    private String status;
    private BigDecimal subtotal;
    private BigDecimal shippingFee;
    private BigDecimal total;
    private List<MyOrderItemDTO> items = new ArrayList<>();
    private OrderTrackingDTO tracking;
    private OrderCancellationDTO cancellation;
    
    @JsonProperty("return")
    private OrderReturnDTO returnDetails;
    
    private List<String> availableActions = new ArrayList<>();

    public MyOrderDetailDTO() {}

    public String getOrderId() { return orderId; }
    public void setOrderId(String orderId) { this.orderId = orderId; }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public LocalDateTime getOrderDate() { return orderDate; }
    public void setOrderDate(LocalDateTime orderDate) { this.orderDate = orderDate; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public BigDecimal getSubtotal() { return subtotal; }
    public void setSubtotal(BigDecimal subtotal) { this.subtotal = subtotal; }

    public BigDecimal getShippingFee() { return shippingFee; }
    public void setShippingFee(BigDecimal shippingFee) { this.shippingFee = shippingFee; }

    public BigDecimal getTotal() { return total; }
    public void setTotal(BigDecimal total) { this.total = total; }

    public List<MyOrderItemDTO> getItems() { return items; }
    public void setItems(List<MyOrderItemDTO> items) { this.items = items; }

    public OrderTrackingDTO getTracking() { return tracking; }
    public void setTracking(OrderTrackingDTO tracking) { this.tracking = tracking; }

    public OrderCancellationDTO getCancellation() { return cancellation; }
    public void setCancellation(OrderCancellationDTO cancellation) { this.cancellation = cancellation; }

    @JsonProperty("return")
    public OrderReturnDTO getReturnDetails() { return returnDetails; }

    @JsonProperty("return")
    public void setReturnDetails(OrderReturnDTO returnDetails) { this.returnDetails = returnDetails; }

    public List<String> getAvailableActions() { return availableActions; }
    public void setAvailableActions(List<String> availableActions) { this.availableActions = availableActions; }
}
