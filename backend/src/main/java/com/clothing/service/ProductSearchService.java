package com.clothing.service;

import com.clothing.dto.ProductSearchDTO;
import com.clothing.dto.SearchResponseDTO;
import com.clothing.entity.Product;
import com.clothing.entity.ProductImage;
import com.clothing.entity.ProductVariant;
import com.clothing.repository.ProductRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ProductSearchService {

    private static final Logger log = LoggerFactory.getLogger(ProductSearchService.class);

    private final ProductRepository productRepository;

    // Common synonyms, typo corrections, and abbreviations in clothing commerce
    private static final Map<String, String> SYNONYMS = new HashMap<>();

    static {
        SYNONYMS.put("blk", "black");
        SYNONYMS.put("blak", "black");
        SYNONYMS.put("blck", "black");
        SYNONYMS.put("wht", "white");
        SYNONYMS.put("whte", "white");
        SYNONYMS.put("gry", "grey");
        SYNONYMS.put("blu", "blue");
        SYNONYMS.put("tshrt", "tshirt");
        SYNONYMS.put("t-shirt", "tshirt");
        SYNONYMS.put("t-shirts", "tshirt");
        SYNONYMS.put("tshirts", "tshirt");
        SYNONYMS.put("tee", "tshirt");
        SYNONYMS.put("tees", "tshirt");
        SYNONYMS.put("shrt", "shirt");
        SYNONYMS.put("shrts", "shirt");
        SYNONYMS.put("shirts", "shirt");
        SYNONYMS.put("mens", "men");
        SYNONYMS.put("men's", "men");
        SYNONYMS.put("man", "men");
        SYNONYMS.put("womens", "women");
        SYNONYMS.put("women's", "women");
        SYNONYMS.put("woman", "women");
        SYNONYMS.put("shoe", "footwear");
        SYNONYMS.put("shoes", "footwear");
        SYNONYMS.put("sneaker", "footwear");
        SYNONYMS.put("sneakers", "footwear");
        SYNONYMS.put("pant", "bottomwear");
        SYNONYMS.put("pants", "bottomwear");
        SYNONYMS.put("trouser", "bottomwear");
        SYNONYMS.put("trousers", "bottomwear");
        SYNONYMS.put("jean", "jeans");
        SYNONYMS.put("watch", "watches");
        SYNONYMS.put("perfume", "fragrance");
        SYNONYMS.put("deo", "fragrance");
        SYNONYMS.put("deodorant", "fragrance");
    }

    public ProductSearchService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    /**
     * Executes intelligent, typo-tolerant search ranked by multi-signal relevance.
     */
    public SearchResponseDTO search(
            String rawQuery,
            String gender,
            String masterCategory,
            String subCategory,
            String articleType,
            String baseColour,
            String usage,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            int page,
            int size,
            String sort) {

        long startTime = System.currentTimeMillis();
        String normalizedQuery = normalizeQuery(rawQuery);
        List<String> queryTokens = tokenizeAndExpand(normalizedQuery);

        // Fetch candidates from PostgreSQL database
        List<Product> allActive = productRepository.findAll().stream()
                .filter(p -> "ACTIVE".equalsIgnoreCase(p.getStatus()))
                .collect(Collectors.toList());

        // Score each product
        List<ScoredProduct> scored = new ArrayList<>();
        for (Product p : allActive) {
            // Apply hard filters first if supplied
            if (gender != null && !gender.isBlank() && !gender.equalsIgnoreCase("ALL")) {
                if (!p.getGender().equalsIgnoreCase(gender) && !"Unisex".equalsIgnoreCase(p.getGender())) {
                    continue;
                }
            }
            if (masterCategory != null && !masterCategory.isBlank() && !masterCategory.equalsIgnoreCase("ALL")) {
                if (p.getMasterCategory() == null || !p.getMasterCategory().equalsIgnoreCase(masterCategory)) {
                    continue;
                }
            }
            if (subCategory != null && !subCategory.isBlank() && !subCategory.equalsIgnoreCase("ALL")) {
                if (p.getSubCategory() == null || !p.getSubCategory().equalsIgnoreCase(subCategory)) {
                    continue;
                }
            }
            if (articleType != null && !articleType.isBlank() && !articleType.equalsIgnoreCase("ALL")) {
                if (p.getArticleType() == null || !p.getArticleType().equalsIgnoreCase(articleType)) {
                    continue;
                }
            }
            if (baseColour != null && !baseColour.isBlank() && !baseColour.equalsIgnoreCase("ALL")) {
                if (p.getBaseColour() == null || !p.getBaseColour().equalsIgnoreCase(baseColour)) {
                    continue;
                }
            }
            if (usage != null && !usage.isBlank() && !usage.equalsIgnoreCase("ALL")) {
                if (p.getUsageCategory() == null || !p.getUsageCategory().equalsIgnoreCase(usage)) {
                    continue;
                }
            }
            if (minPrice != null && p.getBasePrice().compareTo(minPrice) < 0) {
                continue;
            }
            if (maxPrice != null && p.getBasePrice().compareTo(maxPrice) > 0) {
                continue;
            }

            // Calculate relevance score
            double score = calculateRelevanceScore(p, normalizedQuery, queryTokens);
            if (normalizedQuery.isEmpty() || score > 0.0) {
                scored.add(new ScoredProduct(p, score));
            }
        }

        boolean isFallback = false;
        String correctedQuery = null;

        // If no results matched the query, execute intelligent fallback
        if (scored.isEmpty() && !normalizedQuery.isEmpty()) {
            log.info("No exact/fuzzy matches found for '{}'. Initiating fallback recommendations.", normalizedQuery);
            isFallback = true;
            // Broader fallback search (e.g., using primary category or gender if detected)
            for (Product p : allActive) {
                double fallbackScore = 1.0;
                // Prefer same gender or top bestselling items
                if ("BESTSELLER".equalsIgnoreCase(p.getBadge()) || "NEW".equalsIgnoreCase(p.getBadge())) {
                    fallbackScore += 2.0;
                }
                scored.add(new ScoredProduct(p, fallbackScore));
            }
        }

        // Sorting
        if ("price_asc".equalsIgnoreCase(sort)) {
            scored.sort(Comparator.comparing(sp -> sp.product.getBasePrice()));
        } else if ("price_desc".equalsIgnoreCase(sort)) {
            scored.sort((a, b) -> b.product.getBasePrice().compareTo(a.product.getBasePrice()));
        } else if ("newest".equalsIgnoreCase(sort)) {
            scored.sort((a, b) -> Integer.compare(
                    b.product.getReleaseYear() != null ? b.product.getReleaseYear() : 0,
                    a.product.getReleaseYear() != null ? a.product.getReleaseYear() : 0
            ));
        } else {
            // Default: Sort by relevance score descending
            scored.sort((a, b) -> Double.compare(b.score, a.score));
        }

        // Pagination
        int totalElements = scored.size();
        int totalPages = (int) Math.ceil((double) totalElements / size);
        int fromIndex = Math.min(page * size, totalElements);
        int toIndex = Math.min(fromIndex + size, totalElements);

        List<ProductSearchDTO> pageContent = scored.subList(fromIndex, toIndex).stream()
                .map(sp -> mapToDTO(sp.product))
                .collect(Collectors.toList());

        SearchResponseDTO response = new SearchResponseDTO(
                pageContent,
                page,
                size,
                totalElements,
                totalPages,
                page >= totalPages - 1
        );
        response.setFallback(isFallback);
        response.setCorrectedQuery(correctedQuery);

        long latency = System.currentTimeMillis() - startTime;
        log.info("Intelligent search for '{}' returned {} results in {}ms (page {}/{})",
                rawQuery, totalElements, latency, page + 1, Math.max(1, totalPages));

        return response;
    }

    /**
     * Autocomplete suggestions generated dynamically from real products and categories.
     */
    public List<String> getSuggestions(String query) {
        if (query == null || query.trim().length() < 2) {
            return Collections.emptyList();
        }

        String normalized = normalizeQuery(query);
        Set<String> suggestions = new LinkedHashSet<>();

        List<Product> products = productRepository.findAll();

        // 1. Check article types and categories matching prefix
        for (Product p : products) {
            if (p.getArticleType() != null && p.getArticleType().toLowerCase().startsWith(normalized)) {
                suggestions.add(p.getArticleType());
            }
            if (p.getBaseColour() != null && p.getArticleType() != null) {
                String phrase = p.getBaseColour() + " " + p.getArticleType();
                if (phrase.toLowerCase().startsWith(normalized)) {
                    suggestions.add(phrase);
                }
            }
        }

        // 2. Check product titles matching prefix or containing tokens
        for (Product p : products) {
            if (p.getName().toLowerCase().startsWith(normalized)) {
                suggestions.add(p.getName());
            }
            if (suggestions.size() >= 8) break;
        }

        // 3. Fallback: Check containing in title
        if (suggestions.size() < 6) {
            for (Product p : products) {
                if (p.getName().toLowerCase().contains(normalized)) {
                    suggestions.add(p.getName());
                }
                if (suggestions.size() >= 8) break;
            }
        }

        return new ArrayList<>(suggestions);
    }

    /**
     * Multi-signal relevance scoring algorithm.
     */
    private double calculateRelevanceScore(Product p, String fullQuery, List<String> tokens) {
        if (fullQuery.isEmpty()) {
            return 1.0;
        }

        double score = 0.0;
        String name = p.getName() != null ? p.getName().toLowerCase() : "";
        String masterCat = p.getMasterCategory() != null ? p.getMasterCategory().toLowerCase() : "";
        String subCat = p.getSubCategory() != null ? p.getSubCategory().toLowerCase() : "";
        String articleType = p.getArticleType() != null ? p.getArticleType().toLowerCase() : "";
        String color = p.getBaseColour() != null ? p.getBaseColour().toLowerCase() : "";
        String gender = p.getGender() != null ? p.getGender().toLowerCase() : "";
        String usage = p.getUsageCategory() != null ? p.getUsageCategory().toLowerCase() : "";
        String searchable = p.getSearchableContent() != null ? p.getSearchableContent() : "";

        // 1. Exact phrase in product name
        if (name.equalsIgnoreCase(fullQuery)) {
            score += 120.0;
        } else if (name.contains(fullQuery)) {
            score += 60.0;
        }

        // 2. Product name starts with query
        if (name.startsWith(fullQuery)) {
            score += 40.0;
        }

        // 3. Multi-token evaluation
        int matchedTokens = 0;
        for (String token : tokens) {
            boolean matched = false;

            if (name.contains(token)) {
                score += 25.0;
                matched = true;
            }
            if (articleType.contains(token) || token.contains(articleType)) {
                score += 35.0;
                matched = true;
            }
            if (color.contains(token) || token.contains(color)) {
                score += 30.0;
                matched = true;
            }
            if (gender.equalsIgnoreCase(token) || (token.equals("men") && gender.equals("men")) || (token.equals("women") && gender.equals("women"))) {
                score += 25.0;
                matched = true;
            }
            if (masterCat.contains(token) || subCat.contains(token)) {
                score += 15.0;
                matched = true;
            }
            if (usage.contains(token)) {
                score += 20.0;
                matched = true;
            }
            if (!matched && searchable.contains(token)) {
                score += 10.0;
                matched = true;
            }

            // Fuzzy / Trigram typo tolerance check if token not matched exactly
            if (!matched) {
                double fuzzyScore = calculateFuzzyBonus(token, name, articleType, color);
                if (fuzzyScore > 0.0) {
                    score += fuzzyScore;
                    matched = true;
                }
            }

            if (matched) {
                matchedTokens++;
            }
        }

        // Token completeness bonus
        if (!tokens.isEmpty() && matchedTokens == tokens.size()) {
            score += 30.0;
        }

        return score;
    }

    /**
     * Trigram and edit-distance fuzzy scoring for typo tolerance.
     */
    private double calculateFuzzyBonus(String queryToken, String name, String articleType, String color) {
        if (queryToken.length() < 3) return 0.0;

        // Check against color (e.g. "blak" vs "black", "blu" vs "blue")
        if (!color.isEmpty() && stringSimilarity(queryToken, color) >= 0.72) {
            return 25.0;
        }

        // Check against articleType (e.g. "shrt" vs "shirt", "tshrt" vs "tshirts")
        if (!articleType.isEmpty() && stringSimilarity(queryToken, articleType) >= 0.70) {
            return 25.0;
        }

        // Check individual words in product title
        String[] nameWords = name.split("\\s+");
        for (String word : nameWords) {
            if (word.length() >= 3 && stringSimilarity(queryToken, word) >= 0.75) {
                return 20.0;
            }
        }

        return 0.0;
    }

    /**
     * Computes similarity ratio between 0.0 and 1.0 (Levenshtein distance based).
     */
    public double stringSimilarity(String s1, String s2) {
        if (s1 == null || s2 == null) return 0.0;
        String a = s1.toLowerCase().trim();
        String b = s2.toLowerCase().trim();
        if (a.equals(b)) return 1.0;

        int lenA = a.length();
        int lenB = b.length();
        if (lenA == 0 || lenB == 0) return 0.0;

        int[][] dp = new int[lenA + 1][lenB + 1];
        for (int i = 0; i <= lenA; i++) dp[i][0] = i;
        for (int j = 0; j <= lenB; j++) dp[0][j] = j;

        for (int i = 1; i <= lenA; i++) {
            for (int j = 1; j <= lenB; j++) {
                int cost = (a.charAt(i - 1) == b.charAt(j - 1)) ? 0 : 1;
                dp[i][j] = Math.min(
                        Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1),
                        dp[i - 1][j - 1] + cost
                );
            }
        }

        int maxLen = Math.max(lenA, lenB);
        return 1.0 - ((double) dp[lenA][lenB] / maxLen);
    }

    /**
     * Normalizes query string (lowercase, whitespace, punctuation).
     */
    public String normalizeQuery(String raw) {
        if (raw == null) return "";
        return raw.toLowerCase()
                .replaceAll("[^a-z0-9\\s-]", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }

    /**
     * Tokenizes normalized query and expands synonyms/abbreviations.
     */
    private List<String> tokenizeAndExpand(String normalized) {
        if (normalized.isEmpty()) return Collections.emptyList();

        List<String> result = new ArrayList<>();
        String[] tokens = normalized.split("\\s+");

        for (String t : tokens) {
            String trimmed = t.trim();
            if (trimmed.isEmpty()) continue;

            // Check synonym map
            if (SYNONYMS.containsKey(trimmed)) {
                result.add(SYNONYMS.get(trimmed));
            } else {
                // Also check singular form if ends with 's' and not 'ss'
                if (trimmed.endsWith("s") && !trimmed.endsWith("ss") && trimmed.length() > 3) {
                    String singular = trimmed.substring(0, trimmed.length() - 1);
                    if (SYNONYMS.containsKey(singular)) {
                        result.add(SYNONYMS.get(singular));
                    } else {
                        result.add(singular);
                    }
                }
                result.add(trimmed);
            }
        }

        return result;
    }

    public ProductSearchDTO mapToDTO(Product p) {
        ProductSearchDTO dto = new ProductSearchDTO();
        dto.setId(p.getId());
        dto.setExternalProductId(p.getExternalProductId());
        dto.setName(p.getName());
        dto.setSlug(p.getSlug());
        dto.setDescription(p.getDescription());
        dto.setGender(p.getGender());
        dto.setMasterCategory(p.getMasterCategory());
        dto.setSubCategory(p.getSubCategory());
        dto.setArticleType(p.getArticleType());
        dto.setBaseColour(p.getBaseColour());
        dto.setSeason(p.getSeason());
        dto.setReleaseYear(p.getReleaseYear());
        dto.setUsageCategory(p.getUsageCategory());
        dto.setBasePrice(p.getBasePrice());
        dto.setCompareAtPrice(p.getCompareAtPrice());
        dto.setBadge(p.getBadge());
        dto.setStatus(p.getStatus());

        // Images
        List<String> images = p.getImages().stream()
                .map(ProductImage::getImageUrl)
                .collect(Collectors.toList());
        if (images.isEmpty() && p.getExternalProductId() != null) {
            images = List.of("/images/" + p.getExternalProductId() + ".jpg");
        }
        dto.setImages(images);
        dto.setImageUrl(!images.isEmpty() ? images.get(0) : "/images/15970.jpg");

        // Variants / Sizes & Inventory
        List<String> sizes = p.getVariants().stream()
                .map(ProductVariant::getSize)
                .distinct()
                .collect(Collectors.toList());
        int totalStock = p.getVariants().stream()
                .mapToInt(v -> v.getStock() != null ? v.getStock() : 0)
                .sum();
        dto.setAvailableSizes(sizes);
        dto.setInventory(totalStock);

        return dto;
    }
}
