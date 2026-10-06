package com.clothing.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.math.BigDecimal;

public class MyOrderItemDTO {
    private Long orderItemId;
    private Long productId;
    private String productName;
    private Integer quantity;
    private BigDecimal price;
    private BigDecimal finalPrice;
    private String size;
    private String color;
    private String productImageUrlSnapshot;

    public MyOrderItemDTO() {}

    public MyOrderItemDTO(Long orderItemId, Long productId, String productName, Integer quantity, BigDecimal price, BigDecimal finalPrice, String size, String color, String productImageUrlSnapshot) {
        this.orderItemId = orderItemId;
        this.productId = productId;
        this.productName = productName;
        this.quantity = quantity;
        this.price = price;
        this.finalPrice = finalPrice;
        this.size = size;
        this.color = color;
        this.productImageUrlSnapshot = productImageUrlSnapshot;
    }

    public Long getOrderItemId() { return orderItemId; }
    public void setOrderItemId(Long orderItemId) { this.orderItemId = orderItemId; }

    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }

    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }

    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }

    public BigDecimal getFinalPrice() { return finalPrice; }
    public void setFinalPrice(BigDecimal finalPrice) { this.finalPrice = finalPrice; }

    public String getSize() { return size; }
    public void setSize(String size) { this.size = size; }

    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }

    public String getProductImageUrlSnapshot() { return productImageUrlSnapshot; }
    public void setProductImageUrlSnapshot(String productImageUrlSnapshot) { this.productImageUrlSnapshot = productImageUrlSnapshot; }

    @JsonProperty("image")
    public String getImage() {
        return productImageUrlSnapshot;
    }
}
