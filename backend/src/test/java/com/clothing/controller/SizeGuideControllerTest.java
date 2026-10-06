package com.clothing.controller;

import com.clothing.dto.ApiResponse;
import com.clothing.dto.SizeChartDTO;
import com.clothing.dto.SizeRecommendationRequestDTO;
import com.clothing.dto.SizeRecommendationResponseDTO;
import com.clothing.service.SizeGuideService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SizeGuideControllerTest {

    @Mock
    private SizeGuideService sizeGuideService;

    @InjectMocks
    private SizeGuideController controller;

    private SizeChartDTO sampleChart;

    @BeforeEach
    void setUp() {
        sampleChart = new SizeChartDTO();
        sampleChart.setId(1L);
        sampleChart.setName("Men's Shirts & Tops Size Guide");
        sampleChart.setGender("MEN");
        sampleChart.setAudience("ADULT");
        sampleChart.setCategory("SHIRT");
        sampleChart.setUnit("IN");
    }

    @Test
    void testGetSizeGuide_ReturnsSuccess() {
        when(sizeGuideService.getSizeChart("MEN", "ADULT", "SHIRT", "IN")).thenReturn(sampleChart);

        ResponseEntity<ApiResponse<SizeChartDTO>> response = controller.getSizeGuide("MEN", "ADULT", "SHIRT", "IN");

        assertNotNull(response);
        assertEquals(200, response.getStatusCode().value());
        assertTrue(response.getBody().isSuccess());
        assertEquals("Men's Shirts & Tops Size Guide", response.getBody().getData().getName());
    }

    @Test
    void testGetProductSizeGuide_ReturnsSuccess() {
        when(sizeGuideService.getProductSizeChart(123L, "IN")).thenReturn(sampleChart);

        ResponseEntity<ApiResponse<SizeChartDTO>> response = controller.getProductSizeGuide(123L, "IN");

        assertNotNull(response);
        assertEquals(200, response.getStatusCode().value());
        assertTrue(response.getBody().isSuccess());
        assertEquals("Men's Shirts & Tops Size Guide", response.getBody().getData().getName());
    }

    @Test
    void testRecommendSize_ReturnsRecommendation() {
        SizeRecommendationResponseDTO recResponse = new SizeRecommendationResponseDTO();
        recResponse.setRecommendedSize("M");
        recResponse.setConfidence("HIGH");
        recResponse.setFit("Regular");

        when(sizeGuideService.recommendSize(any(SizeRecommendationRequestDTO.class))).thenReturn(recResponse);

        SizeRecommendationRequestDTO req = new SizeRecommendationRequestDTO();
        req.setGender("MEN");
        Map<String, Double> m = new HashMap<>();
        m.put("chest", 39.0);
        req.setMeasurements(m);

        ResponseEntity<ApiResponse<SizeRecommendationResponseDTO>> response = controller.recommendSize(req);

        assertNotNull(response);
        assertEquals(200, response.getStatusCode().value());
        assertTrue(response.getBody().isSuccess());
        assertEquals("M", response.getBody().getData().getRecommendedSize());
        assertEquals("HIGH", response.getBody().getData().getConfidence());
    }
}
