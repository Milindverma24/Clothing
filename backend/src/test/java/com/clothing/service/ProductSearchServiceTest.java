package com.clothing.service;

import com.clothing.dto.ProductSearchDTO;
import com.clothing.dto.SearchResponseDTO;
import com.clothing.entity.Product;
import com.clothing.repository.ProductRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProductSearchServiceTest {

    @Mock
    private ProductRepository productRepository;

    @InjectMocks
    private ProductSearchService productSearchService;

    private List<Product> mockCatalog;

    @BeforeEach
    void setUp() {
        mockCatalog = new ArrayList<>();

        Product p1 = new Product();
        p1.setId(101L);
        p1.setName("Turtle Check Men Navy Blue Shirt");
        p1.setSlug("turtle-check-men-navy-blue-shirt");
        p1.setGender("Men");
        p1.setMasterCategory("Apparel");
        p1.setSubCategory("Topwear");
        p1.setArticleType("Shirts");
        p1.setBaseColour("Navy Blue");
        p1.setUsageCategory("Casual");
        p1.setSeason("Fall");
        p1.setBasePrice(new BigDecimal("1299"));
        p1.setStatus("ACTIVE");
        p1.setSearchableContent("turtle check men navy blue shirt apparel topwear shirts navy blue casual fall");

        Product p2 = new Product();
        p2.setId(102L);
        p2.setName("Puma Men's Stripe Polo Black T-shirt");
        p2.setSlug("puma-mens-stripe-polo-black-tshirt");
        p2.setGender("Men");
        p2.setMasterCategory("Apparel");
        p2.setSubCategory("Topwear");
        p2.setArticleType("Tshirts");
        p2.setBaseColour("Black");
        p2.setUsageCategory("Casual");
        p2.setSeason("Summer");
        p2.setBasePrice(new BigDecimal("899"));
        p2.setStatus("ACTIVE");
        p2.setSearchableContent("puma men's stripe polo black t-shirt apparel topwear tshirts black casual summer");

        Product p3 = new Product();
        p3.setId(103L);
        p3.setName("Nike Classic Red Running Shoes");
        p3.setSlug("nike-classic-red-running-shoes");
        p3.setGender("Unisex");
        p3.setMasterCategory("Footwear");
        p3.setSubCategory("Shoes");
        p3.setArticleType("Sports Shoes");
        p3.setBaseColour("Red");
        p3.setUsageCategory("Sports");
        p3.setSeason("Spring");
        p3.setBasePrice(new BigDecimal("3499"));
        p3.setStatus("ACTIVE");
        p3.setSearchableContent("nike classic red running shoes footwear shoes sports shoes red sports spring");

        mockCatalog.add(p1);
        mockCatalog.add(p2);
        mockCatalog.add(p3);
    }

    @Test
    @DisplayName("Typo tolerance: 'blak shirt' correctly matches 'Black T-shirt'")
    void testTypoTolerance_BlakShirt() {
        when(productRepository.findAll()).thenReturn(mockCatalog);

        SearchResponseDTO response = productSearchService.search(
                "blak shirt", null, null, null, null, null, null, null, null, 0, 10, "recommended"
        );

        assertNotNull(response);
        assertFalse(response.getContent().isEmpty(), "Should return matching products for 'blak shirt'");
        ProductSearchDTO topMatch = response.getContent().get(0);
        assertEquals("Black", topMatch.getBaseColour());
    }

    @Test
    @DisplayName("Synonym expansion: 'blk tshrt' matches black t-shirt")
    void testSynonymExpansion_BlkTshrt() {
        when(productRepository.findAll()).thenReturn(mockCatalog);

        SearchResponseDTO response = productSearchService.search(
                "blk tshrt", null, null, null, null, null, null, null, null, 0, 10, "recommended"
        );

        assertNotNull(response);
        assertFalse(response.getContent().isEmpty());
        assertEquals("Black", response.getContent().get(0).getBaseColour());
        assertEquals("Tshirts", response.getContent().get(0).getArticleType());
    }

    @Test
    @DisplayName("Multi-attribute query: 'navy blue casual' matches 'Turtle Check Men Navy Blue Shirt'")
    void testMultiAttribute_NavyBlueCasual() {
        when(productRepository.findAll()).thenReturn(mockCatalog);

        SearchResponseDTO response = productSearchService.search(
                "navy blue casual", null, null, null, null, null, null, null, null, 0, 10, "recommended"
        );

        assertNotNull(response);
        assertFalse(response.getContent().isEmpty());
        ProductSearchDTO top = response.getContent().get(0);
        assertEquals("Navy Blue", top.getBaseColour());
        assertEquals("Casual", top.getUsageCategory());
    }

    @Test
    @DisplayName("Filter by gender, category, and color strictly limits results")
    void testFilters() {
        when(productRepository.findAll()).thenReturn(mockCatalog);

        SearchResponseDTO response = productSearchService.search(
                null, "Men", "Apparel", null, null, "Black", null, null, null, 0, 10, "recommended"
        );

        assertNotNull(response);
        assertEquals(1, response.getContent().size());
        assertEquals("Puma Men's Stripe Polo Black T-shirt", response.getContent().get(0).getName());
    }

    @Test
    @DisplayName("Autocomplete suggestions: 'bla' suggests Black products or categories")
    void testAutocompleteSuggestions() {
        when(productRepository.findAll()).thenReturn(mockCatalog);

        List<String> suggestions = productSearchService.getSuggestions("bla");

        assertNotNull(suggestions);
        assertFalse(suggestions.isEmpty(), "Should provide suggestions starting with 'bla'");
        assertTrue(suggestions.stream().anyMatch(s -> s.toLowerCase().contains("black")));
    }

    @Test
    @DisplayName("No exact matches fallback provides similar alternatives without throwing errors")
    void testFallbackOnZeroExactMatches() {
        when(productRepository.findAll()).thenReturn(mockCatalog);

        SearchResponseDTO response = productSearchService.search(
                "nonexistentxyzquery", null, null, null, null, null, null, null, null, 0, 10, "recommended"
        );

        assertNotNull(response);
        assertTrue(response.isFallback() || response.getContent().isEmpty());
    }
}
