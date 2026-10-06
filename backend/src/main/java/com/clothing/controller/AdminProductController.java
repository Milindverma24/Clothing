package com.clothing.controller;

import com.clothing.dto.ApiResponse;
import com.clothing.entity.Product;
import com.clothing.entity.ProductImage;
import com.clothing.entity.ProductVariant;
import com.clothing.exception.ApiException;
import com.clothing.repository.ProductRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/products")
@PreAuthorize("hasRole('ADMIN')")
public class AdminProductController {

    private final ProductRepository productRepository;

    public AdminProductController(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    @PostMapping
    @Transactional
    public ResponseEntity<ApiResponse<Product>> createProduct(@RequestBody Map<String, Object> body) {
        String name = (String) body.get("name");
        if (name == null || name.isBlank()) {
            throw new ApiException("Product name is required");
        }

        BigDecimal basePrice = new BigDecimal(body.getOrDefault("basePrice", 1299).toString());
        String gender = (String) body.getOrDefault("gender", "Men");
        String masterCat = (String) body.getOrDefault("masterCategory", "Apparel");
        String subCat = (String) body.getOrDefault("subCategory", "Topwear");
        String articleType = (String) body.getOrDefault("articleType", "Shirts");
        String baseColour = (String) body.getOrDefault("baseColour", "Black");
        String description = (String) body.getOrDefault("description", "Premium " + name);
        String imageUrl = (String) body.getOrDefault("imageUrl", "/images/hero-campaign.jpg");

        long extId = System.currentTimeMillis() % 1000000;
        String slugName = name.toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("^-+|-+$", "");
        String slug = slugName + "-" + extId;

        Product product = new Product();
        product.setExternalProductId(extId);
        product.setName(name);
        product.setSlug(slug);
        product.setDescription(description);
        product.setGender(gender);
        product.setMasterCategory(masterCat);
        product.setSubCategory(subCat);
        product.setArticleType(articleType);
        product.setBaseColour(baseColour);
        product.setSeason("All Seasons");
        product.setReleaseYear(2026);
        product.setUsageCategory("Casual");
        product.setBasePrice(basePrice);
        product.setCompareAtPrice(basePrice.multiply(new BigDecimal("1.35")));
        product.setStatus("ACTIVE");
        product.setBadge((String) body.get("badge"));
        product.prepareSearchableContent();

        ProductImage img = new ProductImage();
        img.setProduct(product);
        img.setImageUrl(imageUrl);
        img.setSortOrder(0);
        product.getImages().add(img);

        // Add standard sizes
        List<String> sizes = List.of("S", "M", "L", "XL", "XXL");
        for (String size : sizes) {
            ProductVariant v = new ProductVariant();
            v.setProduct(product);
            v.setSku(extId + "-" + size);
            v.setSize(size);
            v.setColor(baseColour);
            v.setPrice(basePrice);
            v.setStock(25);
            v.setStatus("ACTIVE");
            product.getVariants().add(v);
        }

        product = productRepository.save(product);
        return ResponseEntity.ok(ApiResponse.ok(product, "Product created successfully"));
    }

    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<ApiResponse<Product>> updateProduct(
        @PathVariable Long id,
        @RequestBody Map<String, Object> body
    ) {
        Product product = productRepository.findById(id)
            .or(() -> productRepository.findByExternalProductId(id))
            .orElseThrow(() -> new ApiException("Product not found"));

        if (body.containsKey("name")) product.setName((String) body.get("name"));
        if (body.containsKey("description")) product.setDescription((String) body.get("description"));
        if (body.containsKey("basePrice")) product.setBasePrice(new BigDecimal(body.get("basePrice").toString()));
        if (body.containsKey("status")) product.setStatus(((String) body.get("status")).toUpperCase());
        if (body.containsKey("badge")) product.setBadge((String) body.get("badge"));

        product.setUpdatedAt(LocalDateTime.now());
        product.prepareSearchableContent();
        product = productRepository.save(product);

        return ResponseEntity.ok(ApiResponse.ok(product, "Product updated successfully"));
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<ApiResponse<String>> deleteProduct(@PathVariable Long id) {
        Product product = productRepository.findById(id)
            .or(() -> productRepository.findByExternalProductId(id))
            .orElseThrow(() -> new ApiException("Product not found"));

        product.setStatus("ARCHIVED");
        productRepository.save(product);
        return ResponseEntity.ok(ApiResponse.ok("Product archived successfully"));
    }

    @PatchMapping("/{id}/inventory")
    @Transactional
    public ResponseEntity<ApiResponse<Product>> updateInventory(
        @PathVariable Long id,
        @RequestBody Map<String, Object> body
    ) {
        Product product = productRepository.findById(id)
            .or(() -> productRepository.findByExternalProductId(id))
            .orElseThrow(() -> new ApiException("Product not found"));

        String size = (String) body.get("size");
        int stock = Integer.parseInt(body.getOrDefault("stock", 0).toString());

        if (size != null && product.getVariants() != null) {
            for (ProductVariant v : product.getVariants()) {
                if (size.equalsIgnoreCase(v.getSize())) {
                    v.setStock(stock);
                    v.setStatus(stock > 0 ? "ACTIVE" : "OUT_OF_STOCK");
                }
            }
        }

        product = productRepository.save(product);
        return ResponseEntity.ok(ApiResponse.ok(product, "Inventory updated successfully"));
    }
}
