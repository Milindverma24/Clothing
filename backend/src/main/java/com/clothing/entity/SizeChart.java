package com.clothing.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "size_charts", indexes = {
    @Index(name = "idx_size_charts_lookup", columnList = "gender, audience, category")
})
public class SizeChart {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String gender; // MEN, WOMEN, BOYS, GIRLS, UNISEX

    @Column(nullable = false)
    private String audience = "ADULT"; // ADULT, KIDS

    @Column(nullable = false)
    private String category; // SHIRT, TSHIRT, TROUSER, JEANS, DRESS, TOP, HOODIE, DEFAULT

    @Column(name = "base_unit", nullable = false)
    private String baseUnit = "IN"; // IN or CM (stored canonically in IN)

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "illustration_type")
    private String illustrationType = "MEN_TOP"; // MEN_TOP, WOMEN_TOP, MEN_BOTTOM, WOMEN_BOTTOM, KIDS_TOP

    @OneToMany(mappedBy = "sizeChart", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sortOrder ASC")
    private List<SizeChartEntry> entries = new ArrayList<>();

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    public SizeChart() {}

    public SizeChart(String name, String gender, String audience, String category, String baseUnit, String description, String illustrationType) {
        this.name = name;
        this.gender = gender;
        this.audience = audience;
        this.category = category;
        this.baseUnit = baseUnit;
        this.description = description;
        this.illustrationType = illustrationType;
    }

    public void addEntry(SizeChartEntry entry) {
        entries.add(entry);
        entry.setSizeChart(this);
    }

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

    public String getBaseUnit() { return baseUnit; }
    public void setBaseUnit(String baseUnit) { this.baseUnit = baseUnit; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getIllustrationType() { return illustrationType; }
    public void setIllustrationType(String illustrationType) { this.illustrationType = illustrationType; }

    public List<SizeChartEntry> getEntries() { return entries; }
    public void setEntries(List<SizeChartEntry> entries) { this.entries = entries; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
