package com.clothing.controller;

import com.clothing.dto.ApiResponse;
import com.clothing.dto.SearchResponseDTO;
import com.clothing.service.ProductSearchService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/products/search")
public class ProductSearchController {

    private final ProductSearchService searchService;

    public ProductSearchController(ProductSearchService searchService) {
        this.searchService = searchService;
    }

    /**
     * Intelligent, typo-tolerant product search with filters and relevance ranking.
     * GET /api/products/search?q=blak+shirt&gender=Men&page=0&size=20
     */
    @GetMapping
    public ResponseEntity<ApiResponse<SearchResponseDTO>> searchProducts(
            @RequestParam(required = false, defaultValue = "") String q,
            @RequestParam(required = false) String gender,
            @RequestParam(required = false) String masterCategory,
            @RequestParam(required = false) String subCategory,
            @RequestParam(required = false) String articleType,
            @RequestParam(required = false) String baseColour,
            @RequestParam(required = false) String usage,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "recommended") String sort) {

        // Validate pagination parameters to prevent resource exhaustion
        int safePage = Math.max(0, page);
        int safeSize = Math.min(Math.max(1, size), 100);

        SearchResponseDTO response = searchService.search(
                q, gender, masterCategory, subCategory, articleType,
                baseColour, usage, minPrice, maxPrice, safePage, safeSize, sort
        );

        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    /**
     * Autocomplete suggestions dynamically derived from catalog.
     * GET /api/products/search/suggestions?q=bla
     */
    @GetMapping("/suggestions")
    public ResponseEntity<ApiResponse<List<String>>> getSuggestions(
            @RequestParam(defaultValue = "") String q) {

        List<String> suggestions = searchService.getSuggestions(q);
        return ResponseEntity.ok(ApiResponse.ok(suggestions));
    }
}
