package com.clothing.controller;

import com.clothing.dto.ApiResponse;
import com.clothing.dto.SizeChartDTO;
import com.clothing.dto.SizeRecommendationRequestDTO;
import com.clothing.dto.SizeRecommendationResponseDTO;
import com.clothing.service.SizeGuideService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class SizeGuideController {

    private final SizeGuideService sizeGuideService;

    public SizeGuideController(SizeGuideService sizeGuideService) {
        this.sizeGuideService = sizeGuideService;
    }

    @GetMapping("/api/size-guides")
    public ResponseEntity<ApiResponse<SizeChartDTO>> getSizeGuide(
            @RequestParam(required = false, defaultValue = "MEN") String gender,
            @RequestParam(required = false, defaultValue = "ADULT") String audience,
            @RequestParam(required = false, defaultValue = "SHIRT") String category,
            @RequestParam(required = false, defaultValue = "IN") String unit) {
        SizeChartDTO chart = sizeGuideService.getSizeChart(gender, audience, category, unit);
        if (chart == null) {
            return ResponseEntity.ok(ApiResponse.error("Size guide not found for the requested criteria"));
        }
        return ResponseEntity.ok(ApiResponse.ok(chart, "Size guide retrieved successfully"));
    }

    @GetMapping("/api/size-guides/all")
    public ResponseEntity<ApiResponse<List<SizeChartDTO>>> getAllSizeGuides(
            @RequestParam(required = false, defaultValue = "IN") String unit) {
        List<SizeChartDTO> charts = sizeGuideService.getAllSizeCharts(unit);
        return ResponseEntity.ok(ApiResponse.ok(charts, "All size guides retrieved"));
    }

    @GetMapping("/api/products/{productId}/size-guide")
    public ResponseEntity<ApiResponse<SizeChartDTO>> getProductSizeGuide(
            @PathVariable Long productId,
            @RequestParam(required = false, defaultValue = "IN") String unit) {
        SizeChartDTO chart = sizeGuideService.getProductSizeChart(productId, unit);
        if (chart == null) {
            return ResponseEntity.ok(ApiResponse.error("Size guide not found for product ID " + productId));
        }
        return ResponseEntity.ok(ApiResponse.ok(chart, "Product size guide retrieved"));
    }

    @PostMapping("/api/size-guides/recommend")
    public ResponseEntity<ApiResponse<SizeRecommendationResponseDTO>> recommendSize(
            @RequestBody SizeRecommendationRequestDTO request) {
        SizeRecommendationResponseDTO recommendation = sizeGuideService.recommendSize(request);
        return ResponseEntity.ok(ApiResponse.ok(recommendation, "Size recommendation calculated"));
    }
}
