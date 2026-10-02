package com.clothing.dto;

import java.math.BigDecimal;
import java.util.List;

public class CartMergeRequest {

    public static class GuestCartItem {
        private Long productId;
        private String size;
        private String color;
        private Integer quantity;

        public GuestCartItem() {}

        public Long getProductId() { return productId; }
        public void setProductId(Long productId) { this.productId = productId; }

        public String getSize() { return size; }
        public void setSize(String size) { this.size = size; }

        public String getColor() { return color; }
        public void setColor(String color) { this.color = color; }

        public Integer getQuantity() { return quantity; }
        public void setQuantity(Integer quantity) { this.quantity = quantity; }
    }

    private List<GuestCartItem> items;
    private String couponCode;

    public CartMergeRequest() {}

    public List<GuestCartItem> getItems() { return items; }
    public void setItems(List<GuestCartItem> items) { this.items = items; }

    public String getCouponCode() { return couponCode; }
    public void setCouponCode(String couponCode) { this.couponCode = couponCode; }
}
