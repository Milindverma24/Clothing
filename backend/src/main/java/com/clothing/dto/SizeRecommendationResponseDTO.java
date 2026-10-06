package com.clothing.dto;

import java.util.HashMap;
import java.util.Map;

public class SizeRecommendationResponseDTO {
    private boolean success = true;
    private String recommendedSize;
    private String confidence = "HIGH"; // HIGH, MEDIUM, LOW
    private String fit = "Regular"; // Regular, Slim, Relaxed
    private String chartName;
    private Long productId;
    private String productName;
    private String disclaimer = "Size recommendations are based on the available size chart. Fit can vary by product, brand, and style.";
    private Map<String, MatchedMeasurement> matchedMeasurements = new HashMap<>();

    public static class MatchedMeasurement {
        private Double user;
        private Double min;
        private Double max;
        private String formatted;
        private String unit;

        public MatchedMeasurement() {}

        public MatchedMeasurement(Double user, Double min, Double max, String formatted, String unit) {
            this.user = user;
            this.min = min;
            this.max = max;
            this.formatted = formatted;
            this.unit = unit;
        }

        public Double getUser() { return user; }
        public void setUser(Double user) { this.user = user; }

        public Double getMin() { return min; }
        public void setMin(Double min) { this.min = min; }

        public Double getMax() { return max; }
        public void setMax(Double max) { this.max = max; }

        public String getFormatted() { return formatted; }
        public void setFormatted(String formatted) { this.formatted = formatted; }

        public String getUnit() { return unit; }
        public void setUnit(String unit) { this.unit = unit; }
    }

    public SizeRecommendationResponseDTO() {}

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }

    public String getRecommendedSize() { return recommendedSize; }
    public void setRecommendedSize(String recommendedSize) { this.recommendedSize = recommendedSize; }

    public String getConfidence() { return confidence; }
    public void setConfidence(String confidence) { this.confidence = confidence; }

    public String getFit() { return fit; }
    public void setFit(String fit) { this.fit = fit; }

    public String getChartName() { return chartName; }
    public void setChartName(String chartName) { this.chartName = chartName; }

    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }

    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }

    public String getDisclaimer() { return disclaimer; }
    public void setDisclaimer(String disclaimer) { this.disclaimer = disclaimer; }

    private SizeChartDTO sizeChart;

    public SizeChartDTO getSizeChart() { return sizeChart; }
    public void setSizeChart(SizeChartDTO sizeChart) { this.sizeChart = sizeChart; }

    public Map<String, MatchedMeasurement> getMatchedMeasurements() { return matchedMeasurements; }
    public void setMatchedMeasurements(Map<String, MatchedMeasurement> matchedMeasurements) { this.matchedMeasurements = matchedMeasurements; }
}
