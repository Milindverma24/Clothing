package com.clothing.dto;

import java.math.BigDecimal;

public class AiProductDTO {
    private Long id;
    private Long productId;
    private Long externalProductId;
    private String productName;
    private String productSlug;
    private Double relevanceScore;
    private BigDecimal price;
    private String imageUrl;

    public AiProductDTO() {}

    public AiProductDTO(Long id, Long productId, Long externalProductId, String productName, String productSlug, Double relevanceScore, BigDecimal price, String imageUrl) {
        this.id = id;
        this.productId = productId;
        this.externalProductId = externalProductId;
        this.productName = productName;
        this.productSlug = productSlug;
        this.relevanceScore = relevanceScore;
        this.price = price;
        this.imageUrl = imageUrl;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }

    public Long getExternalProductId() { return externalProductId; }
    public void setExternalProductId(Long externalProductId) { this.externalProductId = externalProductId; }

    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }

    public String getProductSlug() { return productSlug; }
    public void setProductSlug(String productSlug) { this.productSlug = productSlug; }

    public Double getRelevanceScore() { return relevanceScore; }
    public void setRelevanceScore(Double relevanceScore) { this.relevanceScore = relevanceScore; }

    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
}
