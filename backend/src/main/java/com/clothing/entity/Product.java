package com.clothing.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "products")
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "external_product_id", unique = true)
    private Long externalProductId;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String slug;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String gender;

    @Column(name = "master_category")
    private String masterCategory;

    @Column(name = "sub_category")
    private String subCategory;

    @Column(name = "article_type")
    private String articleType;

    @Column(name = "base_colour")
    private String baseColour;

    private String season;

    @Column(name = "release_year")
    private Integer releaseYear;

    @Column(name = "usage_category")
    private String usageCategory;

    @Column(name = "base_price", nullable = false)
    private BigDecimal basePrice;

    @Column(name = "compare_at_price")
    private BigDecimal compareAtPrice;

    private String status = "ACTIVE";

    private String badge;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    @Column(name = "searchable_content", columnDefinition = "TEXT")
    private String searchableContent;

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ProductVariant> variants = new ArrayList<>();

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ProductImage> images = new ArrayList<>();

    @PrePersist
    @PreUpdate
    public void prepareSearchableContent() {
        StringBuilder sb = new StringBuilder();
        if (name != null) sb.append(name).append(" ");
        if (gender != null) sb.append(gender).append(" ");
        if (masterCategory != null) sb.append(masterCategory).append(" ");
        if (subCategory != null) sb.append(subCategory).append(" ");
        if (articleType != null) sb.append(articleType).append(" ");
        if (baseColour != null) sb.append(baseColour).append(" ");
        if (usageCategory != null) sb.append(usageCategory).append(" ");
        if (season != null) sb.append(season).append(" ");
        if (releaseYear != null) sb.append(releaseYear).append(" ");
        if (description != null) sb.append(description).append(" ");
        this.searchableContent = sb.toString().toLowerCase().trim();
    }

    public Product() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getExternalProductId() { return externalProductId; }
    public void setExternalProductId(Long externalProductId) { this.externalProductId = externalProductId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }

    public String getMasterCategory() { return masterCategory; }
    public void setMasterCategory(String masterCategory) { this.masterCategory = masterCategory; }

    public String getSubCategory() { return subCategory; }
    public void setSubCategory(String subCategory) { this.subCategory = subCategory; }

    public String getArticleType() { return articleType; }
    public void setArticleType(String articleType) { this.articleType = articleType; }

    public String getBaseColour() { return baseColour; }
    public void setBaseColour(String baseColour) { this.baseColour = baseColour; }

    public String getSeason() { return season; }
    public void setSeason(String season) { this.season = season; }

    public Integer getReleaseYear() { return releaseYear; }
    public void setReleaseYear(Integer releaseYear) { this.releaseYear = releaseYear; }

    public String getUsageCategory() { return usageCategory; }
    public void setUsageCategory(String usageCategory) { this.usageCategory = usageCategory; }

    public BigDecimal getBasePrice() { return basePrice; }
    public void setBasePrice(BigDecimal basePrice) { this.basePrice = basePrice; }

    public BigDecimal getCompareAtPrice() { return compareAtPrice; }
    public void setCompareAtPrice(BigDecimal compareAtPrice) { this.compareAtPrice = compareAtPrice; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getBadge() { return badge; }
    public void setBadge(String badge) { this.badge = badge; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public List<ProductVariant> getVariants() { return variants; }
    public void setVariants(List<ProductVariant> variants) { this.variants = variants; }

    public String getSearchableContent() { return searchableContent; }
    public void setSearchableContent(String searchableContent) { this.searchableContent = searchableContent; }

    public List<ProductImage> getImages() { return images; }
    public void setImages(List<ProductImage> images) { this.images = images; }
}
