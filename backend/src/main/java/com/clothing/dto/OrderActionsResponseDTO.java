package com.clothing.dto;

import java.util.ArrayList;
import java.util.List;

public class OrderActionsResponseDTO {
    private String orderId;
    private List<OrderActionItemDTO> actions = new ArrayList<>();

    public OrderActionsResponseDTO() {}

    public OrderActionsResponseDTO(String orderId, List<OrderActionItemDTO> actions) {
        this.orderId = orderId;
        this.actions = actions;
    }

    public String getOrderId() { return orderId; }
    public void setOrderId(String orderId) { this.orderId = orderId; }

    public List<OrderActionItemDTO> getActions() { return actions; }
    public void setActions(List<OrderActionItemDTO> actions) { this.actions = actions; }
}
