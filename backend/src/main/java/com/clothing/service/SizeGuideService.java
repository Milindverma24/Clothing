package com.clothing.service;

import com.clothing.dto.SizeChartDTO;
import com.clothing.dto.SizeChartEntryDTO;
import com.clothing.dto.SizeRecommendationRequestDTO;
import com.clothing.dto.SizeRecommendationResponseDTO;
import com.clothing.entity.Product;
import com.clothing.entity.SizeChart;
import com.clothing.entity.SizeChartEntry;
import com.clothing.repository.ProductRepository;
import com.clothing.repository.SizeChartRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

@Service
@Transactional(readOnly = true)
public class SizeGuideService {

    private static final Logger log = LoggerFactory.getLogger(SizeGuideService.class);
    private static final double INCH_TO_CM = 2.54;

    private final SizeChartRepository sizeChartRepository;
    private final ProductRepository productRepository;

    public SizeGuideService(SizeChartRepository sizeChartRepository, ProductRepository productRepository) {
        this.sizeChartRepository = sizeChartRepository;
        this.productRepository = productRepository;
    }

    public List<SizeChartDTO> getAllSizeCharts(String unit) {
        List<SizeChart> charts = sizeChartRepository.findAll();
        List<SizeChartDTO> dtos = new ArrayList<>();
        for (SizeChart sc : charts) {
            dtos.add(toDTO(sc, unit));
        }
        return dtos;
    }

    public SizeChartDTO getSizeChart(String gender, String audience, String category, String unit) {
        String normGender = normalizeGender(gender);
        String normAudience = normalizeAudience(audience);
        String normCategory = normalizeCategory(category);
        String requestedUnit = normalizeUnit(unit);

        // 1. Try exact match
        Optional<SizeChart> chartOpt = sizeChartRepository.findExactMatch(normGender, normAudience, normCategory);
        if (chartOpt.isPresent()) {
            return toDTO(chartOpt.get(), requestedUnit);
        }

        // 2. Try gender + audience match
        List<SizeChart> matching = sizeChartRepository.findByGenderAndAudience(normGender, normAudience);
        if (!matching.isEmpty()) {
            return toDTO(matching.get(0), requestedUnit);
        }

        // 3. Fallback to gender match
        List<SizeChart> fallback = sizeChartRepository.findByFilters(normGender, null, null);
        if (!fallback.isEmpty()) {
            return toDTO(fallback.get(0), requestedUnit);
        }

        // 4. Return any chart or null
        List<SizeChart> all = sizeChartRepository.findAll();
        if (!all.isEmpty()) {
            return toDTO(all.get(0), requestedUnit);
        }

        return null;
    }

    public SizeChartDTO getProductSizeChart(Long productId, String unit) {
        String requestedUnit = normalizeUnit(unit);
        if (productId != null) {
            Optional<Product> productOpt = productRepository.findById(productId);
            if (productOpt.isPresent()) {
                Product product = productOpt.get();
                if (product.getSizeChart() != null) {
                    return toDTO(product.getSizeChart(), requestedUnit);
                }
                // Derive from product metadata
                String gender = mapProductGender(product.getGender());
                String audience = mapProductAudience(product.getGender(), product.getMasterCategory(), product.getSubCategory());
                String category = mapProductCategory(product.getArticleType(), product.getSubCategory());
                return getSizeChart(gender, audience, category, requestedUnit);
            }
        }
        return getSizeChart("MEN", "ADULT", "SHIRT", requestedUnit);
    }

    public SizeRecommendationResponseDTO recommendSize(SizeRecommendationRequestDTO request) {
        SizeRecommendationResponseDTO response = new SizeRecommendationResponseDTO();
        String requestedUnit = normalizeUnit(request.getUnit());

        SizeChartDTO chart;
        String productName = null;
        if (request.getProductId() != null) {
            Optional<Product> prodOpt = productRepository.findById(request.getProductId());
            if (prodOpt.isPresent()) {
                productName = prodOpt.get().getName();
                response.setProductId(request.getProductId());
                response.setProductName(productName);
            }
            chart = getProductSizeChart(request.getProductId(), requestedUnit);
        } else {
            chart = getSizeChart(request.getGender(), request.getAudience(), request.getCategory(), requestedUnit);
        }

        if (chart == null || chart.getEntries().isEmpty()) {
            response.setSuccess(false);
            response.setRecommendedSize("M");
            response.setConfidence("LOW");
            response.setDisclaimer("Size chart is not available for this selection. Please contact customer support.");
            return response;
        }

        response.setChartName(chart.getName());
        Map<String, Double> inputMeasurements = request.getMeasurements();
        if (inputMeasurements == null || inputMeasurements.isEmpty()) {
            // Default to medium size if no measurements provided
            response.setRecommendedSize("M");
            response.setConfidence("LOW");
            return response;
        }

        // Clean user input measurements (already in requestedUnit)
        Map<String, Double> measurementsToCompare = new HashMap<>();
        for (Map.Entry<String, Double> entry : inputMeasurements.entrySet()) {
            if (entry.getValue() != null && entry.getValue() > 0) {
                measurementsToCompare.put(entry.getKey().toLowerCase().trim(), entry.getValue());
            }
        }

        if (measurementsToCompare.isEmpty()) {
            response.setRecommendedSize("M");
            response.setConfidence("LOW");
            return response;
        }

        // Evaluate each entry in the requested unit
        // Calculate penalty score: distance from range (0 if inside range)
        String bestSize = null;
        double minPenalty = Double.MAX_VALUE;
        SizeChartEntryDTO bestEntry = null;
        double unitScale = "CM".equalsIgnoreCase(requestedUnit) ? INCH_TO_CM : 1.0;

        for (SizeChartEntryDTO entry : chart.getEntries()) {
            double penalty = 0.0;
            int comparedCount = 0;

            for (Map.Entry<String, Double> userMeasure : measurementsToCompare.entrySet()) {
                String key = userMeasure.getKey();
                double userVal = userMeasure.getValue();

                Double minVal = getDisplayMin(entry, key);
                Double maxVal = getDisplayMax(entry, key);

                if (minVal != null && maxVal != null) {
                    comparedCount++;
                    if (userVal < minVal) {
                        penalty += ((minVal - userVal) / unitScale) * 2.0; // penalty for undershoot normalized to inches
                    } else if (userVal > maxVal) {
                        penalty += ((userVal - maxVal) / unitScale) * 2.0; // penalty for overshoot normalized to inches
                    } else {
                        // Inside range: slight distance to midpoint for tie-breaking
                        double mid = (minVal + maxVal) / 2.0;
                        penalty += (Math.abs(userVal - mid) / unitScale) * 0.1;
                    }
                }
            }

            if (comparedCount > 0 && penalty < minPenalty) {
                minPenalty = penalty;
                bestSize = entry.getSize();
                bestEntry = entry;
            }
        }

        if (bestSize == null && !chart.getEntries().isEmpty()) {
            bestEntry = chart.getEntries().get(0);
            bestSize = bestEntry.getSize();
        }

        response.setRecommendedSize(bestSize);

        // Determine fit feel
        if (minPenalty < 0.25) {
            response.setConfidence("HIGH");
            response.setFit("Regular");
        } else if (minPenalty < 1.5) {
            response.setConfidence("MEDIUM");
            response.setFit("Tailored Fit");
        } else {
            response.setConfidence("LOW");
            response.setFit("Relaxed / Boundary Match");
        }

        // Build matchedMeasurements for display
        Map<String, SizeRecommendationResponseDTO.MatchedMeasurement> matched = new HashMap<>();
        if (bestEntry != null) {
            for (Map.Entry<String, Double> inputEntry : inputMeasurements.entrySet()) {
                String key = inputEntry.getKey().toLowerCase().trim();
                Double displayMin = getDisplayMin(bestEntry, key);
                Double displayMax = getDisplayMax(bestEntry, key);

                if (displayMin != null && displayMax != null) {
                    String formattedRange = formatRange(displayMin, displayMax, requestedUnit);
                    matched.put(key, new SizeRecommendationResponseDTO.MatchedMeasurement(
                        roundToOneDecimal(inputEntry.getValue()),
                        displayMin,
                        displayMax,
                        formattedRange,
                        requestedUnit
                    ));
                }
            }
        }
        response.setMatchedMeasurements(matched);
        response.setSizeChart(chart);

        return response;
    }

    private Double getCanonicalMin(SizeChartEntryDTO entry, String key) {
        // Values in SizeChartEntryDTO are converted to display unit if already transformed.
        // Let's store or derive canonical min
        Double min = getDisplayMin(entry, key);
        return min;
    }

    private Double getCanonicalMax(SizeChartEntryDTO entry, String key) {
        Double max = getDisplayMax(entry, key);
        return max;
    }

    private Double getDisplayMin(SizeChartEntryDTO entry, String key) {
        switch (key) {
            case "chest": return entry.getChestMin();
            case "bust": return entry.getBustMin();
            case "waist": return entry.getWaistMin();
            case "hip": return entry.getHipMin();
            case "shoulder": return entry.getShoulderMin();
            case "inseam": return entry.getInseamMin();
            case "height": return entry.getHeightMin();
            default: return null;
        }
    }

    private Double getDisplayMax(SizeChartEntryDTO entry, String key) {
        switch (key) {
            case "chest": return entry.getChestMax();
            case "bust": return entry.getBustMax();
            case "waist": return entry.getWaistMax();
            case "hip": return entry.getHipMax();
            case "shoulder": return entry.getShoulderMax();
            case "inseam": return entry.getInseamMax();
            case "height": return entry.getHeightMax();
            default: return null;
        }
    }

    private Double getMeasurementMin(SizeChartEntryDTO entry, String key, String unit) {
        return getDisplayMin(entry, key);
    }

    private Double getMeasurementMax(SizeChartEntryDTO entry, String key, String unit) {
        return getDisplayMax(entry, key);
    }

    public SizeChartDTO toDTO(SizeChart sc, String targetUnit) {
        SizeChartDTO dto = new SizeChartDTO();
        dto.setId(sc.getId());
        dto.setName(sc.getName());
        dto.setGender(sc.getGender());
        dto.setAudience(sc.getAudience());
        dto.setCategory(sc.getCategory());
        dto.setUnit(targetUnit);
        dto.setDescription(sc.getDescription());
        dto.setIllustrationType(sc.getIllustrationType());

        boolean isCm = "CM".equalsIgnoreCase(targetUnit);
        double multiplier = isCm ? INCH_TO_CM : 1.0;

        Set<String> columns = new LinkedHashSet<>();
        List<SizeChartEntryDTO> entryDTOs = new ArrayList<>();

        for (SizeChartEntry entry : sc.getEntries()) {
            SizeChartEntryDTO edto = new SizeChartEntryDTO();
            edto.setSize(entry.getSize());

            if (entry.getChestMin() != null && entry.getChestMax() != null) {
                columns.add("chest");
                double min = roundToOneDecimal(entry.getChestMin() * multiplier);
                double max = roundToOneDecimal(entry.getChestMax() * multiplier);
                edto.setChestMin(min);
                edto.setChestMax(max);
                edto.setChestFormatted(formatRange(min, max, targetUnit));
            }
            if (entry.getBustMin() != null && entry.getBustMax() != null) {
                columns.add("bust");
                double min = roundToOneDecimal(entry.getBustMin() * multiplier);
                double max = roundToOneDecimal(entry.getBustMax() * multiplier);
                edto.setBustMin(min);
                edto.setBustMax(max);
                edto.setBustFormatted(formatRange(min, max, targetUnit));
            }
            if (entry.getWaistMin() != null && entry.getWaistMax() != null) {
                columns.add("waist");
                double min = roundToOneDecimal(entry.getWaistMin() * multiplier);
                double max = roundToOneDecimal(entry.getWaistMax() * multiplier);
                edto.setWaistMin(min);
                edto.setWaistMax(max);
                edto.setWaistFormatted(formatRange(min, max, targetUnit));
            }
            if (entry.getHipMin() != null && entry.getHipMax() != null) {
                columns.add("hip");
                double min = roundToOneDecimal(entry.getHipMin() * multiplier);
                double max = roundToOneDecimal(entry.getHipMax() * multiplier);
                edto.setHipMin(min);
                edto.setHipMax(max);
                edto.setHipFormatted(formatRange(min, max, targetUnit));
            }
            if (entry.getShoulderMin() != null && entry.getShoulderMax() != null) {
                columns.add("shoulder");
                double min = roundToOneDecimal(entry.getShoulderMin() * multiplier);
                double max = roundToOneDecimal(entry.getShoulderMax() * multiplier);
                edto.setShoulderMin(min);
                edto.setShoulderMax(max);
                edto.setShoulderFormatted(formatRange(min, max, targetUnit));
            }
            if (entry.getInseamMin() != null && entry.getInseamMax() != null) {
                columns.add("inseam");
                double min = roundToOneDecimal(entry.getInseamMin() * multiplier);
                double max = roundToOneDecimal(entry.getInseamMax() * multiplier);
                edto.setInseamMin(min);
                edto.setInseamMax(max);
                edto.setInseamFormatted(formatRange(min, max, targetUnit));
            }
            if (entry.getHeightMin() != null && entry.getHeightMax() != null) {
                columns.add("height");
                double min = roundToOneDecimal(entry.getHeightMin() * multiplier);
                double max = roundToOneDecimal(entry.getHeightMax() * multiplier);
                edto.setHeightMin(min);
                edto.setHeightMax(max);
                edto.setHeightFormatted(formatRange(min, max, targetUnit));
            }

            entryDTOs.add(edto);
        }

        dto.setMeasurementColumns(new ArrayList<>(columns));
        dto.setEntries(entryDTOs);

        // Generate how to measure guide based on present columns
        Map<String, String> howTo = new LinkedHashMap<>();
        if (columns.contains("chest")) {
            howTo.put("Chest", "Measure around the fullest part of your chest, keeping the measuring tape horizontal under your armpits.");
        }
        if (columns.contains("bust")) {
            howTo.put("Bust", "Measure across the fullest part of your bust, keeping tape level across your shoulder blades.");
        }
        if (columns.contains("waist")) {
            howTo.put("Waist", "Measure around your natural waistline, typically the narrowest part of your torso, keeping one finger between tape and body.");
        }
        if (columns.contains("hip")) {
            howTo.put("Hip", "Measure around the fullest part of your hips and seat while standing with feet together.");
        }
        if (columns.contains("shoulder")) {
            howTo.put("Shoulder", "Measure from the edge of one shoulder across the top of your back to the opposite shoulder edge.");
        }
        if (columns.contains("inseam")) {
            howTo.put("Inseam", "Measure from the very top of your inner leg down to the ankle bone.");
        }
        if (columns.contains("height")) {
            howTo.put("Height", "Stand straight without shoes with heels against a flat wall, measuring from floor to crown.");
        }
        dto.setHowToMeasure(howTo);

        return dto;
    }

    private String formatRange(double min, double max, String unit) {
        String suffix = "IN".equalsIgnoreCase(unit) ? "\"" : " cm";
        if (min == max) {
            return formatNumber(min) + suffix;
        }
        return formatNumber(min) + "-" + formatNumber(max) + suffix;
    }

    private String formatNumber(double num) {
        if (num == (long) num) {
            return String.format("%d", (long) num);
        }
        return String.format(Locale.US, "%.1f", num);
    }

    private double roundToOneDecimal(double val) {
        return BigDecimal.valueOf(val).setScale(1, RoundingMode.HALF_UP).doubleValue();
    }

    private String normalizeGender(String gender) {
        if (gender == null) return "MEN";
        String upper = gender.toUpperCase().trim();
        if (upper.contains("WOMEN") || upper.contains("GIRL") || upper.contains("FEMALE")) return "WOMEN";
        if (upper.contains("BOY")) return "BOYS";
        if (upper.contains("GIRL")) return "GIRLS";
        if (upper.contains("UNISEX")) return "UNISEX";
        return "MEN";
    }

    private String normalizeAudience(String audience) {
        if (audience == null) return "ADULT";
        String upper = audience.toUpperCase().trim();
        if (upper.contains("KID") || upper.contains("CHILD") || upper.contains("BOY") || upper.contains("GIRL")) return "KIDS";
        return "ADULT";
    }

    private String normalizeCategory(String category) {
        if (category == null) return "SHIRT";
        String upper = category.toUpperCase().trim();
        if (upper.contains("TSHIRT") || upper.contains("TEE") || upper.contains("T-SHIRT")) return "TSHIRT";
        if (upper.contains("SHIRT")) return "SHIRT";
        if (upper.contains("TROUSER") || upper.contains("PANT")) return "TROUSER";
        if (upper.contains("JEAN")) return "JEANS";
        if (upper.contains("DRESS")) return "DRESS";
        if (upper.contains("TOP")) return "TOP";
        if (upper.contains("HOODIE") || upper.contains("SWEATSHIRT") || upper.contains("JACKET")) return "HOODIE";
        return "SHIRT";
    }

    private String normalizeUnit(String unit) {
        if (unit == null) return "IN";
        return "CM".equalsIgnoreCase(unit.trim()) ? "CM" : "IN";
    }

    private String mapProductGender(String gender) {
        if (gender == null) return "MEN";
        String g = gender.toUpperCase();
        if (g.contains("WOMEN")) return "WOMEN";
        if (g.contains("GIRL")) return "GIRLS";
        if (g.contains("BOY")) return "BOYS";
        if (g.contains("MEN")) return "MEN";
        if (g.contains("UNISEX")) return "UNISEX";
        return "MEN";
    }

    private String mapProductAudience(String gender, String masterCategory, String subCategory) {
        String combined = ((gender != null ? gender : "") + " " + (masterCategory != null ? masterCategory : "") + " " + (subCategory != null ? subCategory : "")).toUpperCase();
        if (combined.contains("BOYS") || combined.contains("GIRLS") || combined.contains("KIDS") || combined.contains("CHILDREN")) {
            return "KIDS";
        }
        return "ADULT";
    }

    private String mapProductCategory(String articleType, String subCategory) {
        String combined = ((articleType != null ? articleType : "") + " " + (subCategory != null ? subCategory : "")).toUpperCase();
        if (combined.contains("TSHIRT") || combined.contains("T-SHIRT") || combined.contains("TEE")) return "TSHIRT";
        if (combined.contains("SHIRT")) return "SHIRT";
        if (combined.contains("JEAN")) return "JEANS";
        if (combined.contains("TROUSER") || combined.contains("PANT")) return "TROUSER";
        if (combined.contains("DRESS")) return "DRESS";
        if (combined.contains("TOP")) return "TOP";
        if (combined.contains("HOODIE") || combined.contains("SWEATSHIRT") || combined.contains("JACKET")) return "HOODIE";
        return "SHIRT";
    }
}
