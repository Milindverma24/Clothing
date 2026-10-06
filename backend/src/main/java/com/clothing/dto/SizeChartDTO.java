package com.clothing.dto;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class SizeChartDTO {
    private Long id;
    private String name;
    private String gender; // MEN, WOMEN, BOYS, GIRLS, UNISEX
    private String audience; // ADULT, KIDS
    private String category; // SHIRT, TSHIRT, TROUSER, JEANS, DRESS, TOP, etc.
    private String unit = "IN"; // IN or CM
    private String description;
    private String illustrationType; // MEN_TOP, WOMEN_TOP, MEN_BOTTOM, WOMEN_BOTTOM, KIDS_TOP
    private List<String> measurementColumns = new ArrayList<>();
    private Map<String, String> howToMeasure = new HashMap<>();
    private List<SizeChartEntryDTO> entries = new ArrayList<>();

    public SizeChartDTO() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }

    public String getAudience() { return audience; }
    public void setAudience(String audience) { this.audience = audience; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getIllustrationType() { return illustrationType; }
    public void setIllustrationType(String illustrationType) { this.illustrationType = illustrationType; }

    public List<String> getMeasurementColumns() { return measurementColumns; }
    public void setMeasurementColumns(List<String> measurementColumns) { this.measurementColumns = measurementColumns; }

    public Map<String, String> getHowToMeasure() { return howToMeasure; }
    public void setHowToMeasure(Map<String, String> howToMeasure) { this.howToMeasure = howToMeasure; }

    public List<SizeChartEntryDTO> getEntries() { return entries; }
    public void setEntries(List<SizeChartEntryDTO> entries) { this.entries = entries; }
}
