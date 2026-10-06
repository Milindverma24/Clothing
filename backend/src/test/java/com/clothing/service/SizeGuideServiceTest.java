package com.clothing.service;

import com.clothing.dto.SizeChartDTO;
import com.clothing.dto.SizeRecommendationRequestDTO;
import com.clothing.dto.SizeRecommendationResponseDTO;
import com.clothing.entity.Product;
import com.clothing.entity.SizeChart;
import com.clothing.entity.SizeChartEntry;
import com.clothing.repository.ProductRepository;
import com.clothing.repository.SizeChartRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SizeGuideServiceTest {

    @Mock
    private SizeChartRepository sizeChartRepository;

    @Mock
    private ProductRepository productRepository;

    private SizeGuideService sizeGuideService;
    private SizeChart mockMenShirtChart;

    @BeforeEach
    void setUp() {
        sizeGuideService = new SizeGuideService(sizeChartRepository, productRepository);

        mockMenShirtChart = new SizeChart("Men's Shirts & Tops Size Guide", "MEN", "ADULT", "SHIRT", "IN",
                "Men's shirt sizing", "MEN_TOP");
        mockMenShirtChart.setId(1L);

        addEntry(mockMenShirtChart, "S", 1, 36.0, 38.0, 30.0, 32.0, 17.0, 17.5);
        addEntry(mockMenShirtChart, "M", 2, 38.0, 40.0, 32.0, 34.0, 18.0, 18.5);
        addEntry(mockMenShirtChart, "L", 3, 40.0, 42.0, 34.0, 36.0, 19.0, 19.5);
    }

    private void addEntry(SizeChart chart, String size, int order,
                          Double chestMin, Double chestMax,
                          Double waistMin, Double waistMax,
                          Double shoulderMin, Double shoulderMax) {
        SizeChartEntry entry = new SizeChartEntry();
        entry.setSizeChart(chart);
        entry.setSize(size);
        entry.setSortOrder(order);
        entry.setChestMin(chestMin);
        entry.setChestMax(chestMax);
        entry.setWaistMin(waistMin);
        entry.setWaistMax(waistMax);
        entry.setShoulderMin(shoulderMin);
        entry.setShoulderMax(shoulderMax);
        chart.getEntries().add(entry);
    }

    @Test
    void testGetSizeChart_Inches() {
        when(sizeChartRepository.findExactMatch("MEN", "ADULT", "SHIRT"))
                .thenReturn(Optional.of(mockMenShirtChart));

        SizeChartDTO dto = sizeGuideService.getSizeChart("MEN", "ADULT", "SHIRT", "IN");

        assertNotNull(dto);
        assertEquals("Men's Shirts & Tops Size Guide", dto.getName());
        assertEquals("IN", dto.getUnit());
        assertEquals(3, dto.getEntries().size());
        assertEquals("38-40\"", dto.getEntries().get(1).getChestFormatted());
        assertTrue(dto.getMeasurementColumns().contains("chest"));
        assertTrue(dto.getHowToMeasure().containsKey("Chest"));
    }

    @Test
    void testGetSizeChart_CentimetersConversion() {
        when(sizeChartRepository.findExactMatch("MEN", "ADULT", "SHIRT"))
                .thenReturn(Optional.of(mockMenShirtChart));

        SizeChartDTO dto = sizeGuideService.getSizeChart("MEN", "ADULT", "SHIRT", "CM");

        assertNotNull(dto);
        assertEquals("CM", dto.getUnit());
        // 38 * 2.54 = 96.52 -> 96.5, 40 * 2.54 = 101.6
        assertEquals("96.5-101.6 cm", dto.getEntries().get(1).getChestFormatted());
    }

    @Test
    void testRecommendSize_ExactChestMatch_ReturnsM() {
        when(sizeChartRepository.findExactMatch("MEN", "ADULT", "SHIRT"))
                .thenReturn(Optional.of(mockMenShirtChart));

        SizeRecommendationRequestDTO req = new SizeRecommendationRequestDTO();
        req.setGender("MEN");
        req.setAudience("ADULT");
        req.setCategory("SHIRT");
        req.setUnit("IN");
        Map<String, Double> m = new HashMap<>();
        m.put("chest", 39.0);
        req.setMeasurements(m);

        SizeRecommendationResponseDTO res = sizeGuideService.recommendSize(req);

        assertTrue(res.isSuccess());
        assertEquals("M", res.getRecommendedSize());
        assertEquals("HIGH", res.getConfidence());
        assertNotNull(res.getMatchedMeasurements().get("chest"));
        assertEquals(39.0, res.getMatchedMeasurements().get("chest").getUser());
        assertEquals("38-40\"", res.getMatchedMeasurements().get("chest").getFormatted());
        assertTrue(res.getDisclaimer().contains("based on the available size chart"));
    }

    @Test
    void testRecommendSize_CMInput_ReturnsM() {
        when(sizeChartRepository.findExactMatch("MEN", "ADULT", "SHIRT"))
                .thenReturn(Optional.of(mockMenShirtChart));

        SizeRecommendationRequestDTO req = new SizeRecommendationRequestDTO();
        req.setGender("MEN");
        req.setAudience("ADULT");
        req.setCategory("SHIRT");
        req.setUnit("CM");
        Map<String, Double> m = new HashMap<>();
        m.put("chest", 99.0); // 99 cm / 2.54 = 38.97 in -> falls into M (38-40")
        req.setMeasurements(m);

        SizeRecommendationResponseDTO res = sizeGuideService.recommendSize(req);

        assertTrue(res.isSuccess());
        assertEquals("M", res.getRecommendedSize());
        assertEquals("HIGH", res.getConfidence());
    }

    @Test
    void testGetProductSizeChart_ProductSpecificLinked() {
        Product product = new Product();
        product.setId(42L);
        product.setName("Oxford Cotton Shirt");
        product.setSizeChart(mockMenShirtChart);

        when(productRepository.findById(42L)).thenReturn(Optional.of(product));

        SizeChartDTO dto = sizeGuideService.getProductSizeChart(42L, "IN");

        assertNotNull(dto);
        assertEquals("Men's Shirts & Tops Size Guide", dto.getName());
    }
}
