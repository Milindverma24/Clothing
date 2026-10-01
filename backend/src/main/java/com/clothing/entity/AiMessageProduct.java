package com.clothing.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "ai_message_products", indexes = {
        @Index(name = "idx_ai_prod_msg_id", columnList = "message_id"),
        @Index(name = "idx_ai_prod_product_id", columnList = "product_id")
})
public class AiMessageProduct {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "message_id", nullable = false)
    @JsonBackReference
    private AiMessage message;

    @Column(name = "product_id")
    private Long productId;

    @Column(name = "external_product_id")
    private Long externalProductId;

    @Column(name = "product_name", nullable = false)
    private String productName;

    @Column(name = "product_slug")
    private String productSlug;

    @Column(name = "relevance_score")
    private Double relevanceScore = 1.0;

    @Column(name = "price")
    private BigDecimal price;

    @Column(name = "image_url")
    private String imageUrl;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public AiMessageProduct() {}

    public AiMessageProduct(Long productId, Long externalProductId, String productName, String productSlug, Double relevanceScore, BigDecimal price, String imageUrl) {
        this.productId = productId;
        this.externalProductId = externalProductId;
        this.productName = productName;
        this.productSlug = productSlug;
        this.relevanceScore = relevanceScore;
        this.price = price;
        this.imageUrl = imageUrl;
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public AiMessage getMessage() { return message; }
    public void setMessage(AiMessage message) { this.message = message; }

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

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
