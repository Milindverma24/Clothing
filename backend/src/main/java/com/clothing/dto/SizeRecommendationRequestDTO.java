package com.clothing.dto;

import java.util.HashMap;
import java.util.Map;

public class SizeRecommendationRequestDTO {
    private Long productId;
    private String gender; // MEN, WOMEN, BOYS, GIRLS
    private String audience = "ADULT"; // ADULT, KIDS
    private String category; // SHIRT, TROUSER, etc.
    private Map<String, Double> measurements = new HashMap<>(); // e.g. {"chest": 39.0}
    private String unit = "IN"; // IN or CM

    public SizeRecommendationRequestDTO() {}

    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }

    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }

    public String getAudience() { return audience; }
    public void setAudience(String audience) { this.audience = audience; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public Map<String, Double> getMeasurements() { return measurements; }
    public void setMeasurements(Map<String, Double> measurements) { this.measurements = measurements; }

    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }
}
