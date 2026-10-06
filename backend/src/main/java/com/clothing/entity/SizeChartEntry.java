package com.clothing.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
@Table(name = "size_chart_entries", indexes = {
    @Index(name = "idx_size_entries_chart", columnList = "size_chart_id")
})
public class SizeChartEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "size_chart_id", nullable = false)
    @JsonIgnore
    private SizeChart sizeChart;

    @Column(nullable = false)
    private String size; // XS, S, M, L, XL, XXL, 2-3Y, 4-5Y, etc.

    @Column(name = "sort_order")
    private Integer sortOrder = 0;

    // Body measurements in canonical units (Inches)
    @Column(name = "chest_min")
    private Double chestMin;

    @Column(name = "chest_max")
    private Double chestMax;

    @Column(name = "bust_min")
    private Double bustMin;

    @Column(name = "bust_max")
    private Double bustMax;

    @Column(name = "waist_min")
    private Double waistMin;

    @Column(name = "waist_max")
    private Double waistMax;

    @Column(name = "hip_min")
    private Double hipMin;

    @Column(name = "hip_max")
    private Double hipMax;

    @Column(name = "shoulder_min")
    private Double shoulderMin;

    @Column(name = "shoulder_max")
    private Double shoulderMax;

    @Column(name = "inseam_min")
    private Double inseamMin;

    @Column(name = "inseam_max")
    private Double inseamMax;

    @Column(name = "height_min")
    private Double heightMin;

    @Column(name = "height_max")
    private Double heightMax;

    public SizeChartEntry() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public SizeChart getSizeChart() { return sizeChart; }
    public void setSizeChart(SizeChart sizeChart) { this.sizeChart = sizeChart; }

    public String getSize() { return size; }
    public void setSize(String size) { this.size = size; }

    public Integer getSortOrder() { return sortOrder; }
    public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }

    public Double getChestMin() { return chestMin; }
    public void setChestMin(Double chestMin) { this.chestMin = chestMin; }

    public Double getChestMax() { return chestMax; }
    public void setChestMax(Double chestMax) { this.chestMax = chestMax; }

    public Double getBustMin() { return bustMin; }
    public void setBustMin(Double bustMin) { this.bustMin = bustMin; }

    public Double getBustMax() { return bustMax; }
    public void setBustMax(Double bustMax) { this.bustMax = bustMax; }

    public Double getWaistMin() { return waistMin; }
    public void setWaistMin(Double waistMin) { this.waistMin = waistMin; }

    public Double getWaistMax() { return waistMax; }
    public void setWaistMax(Double waistMax) { this.waistMax = waistMax; }

    public Double getHipMin() { return hipMin; }
    public void setHipMin(Double hipMin) { this.hipMin = hipMin; }

    public Double getHipMax() { return hipMax; }
    public void setHipMax(Double hipMax) { this.hipMax = hipMax; }

    public Double getShoulderMin() { return shoulderMin; }
    public void setShoulderMin(Double shoulderMin) { this.shoulderMin = shoulderMin; }

    public Double getShoulderMax() { return shoulderMax; }
    public void setShoulderMax(Double shoulderMax) { this.shoulderMax = shoulderMax; }

    public Double getInseamMin() { return inseamMin; }
    public void setInseamMin(Double inseamMin) { this.inseamMin = inseamMin; }

    public Double getInseamMax() { return inseamMax; }
    public void setInseamMax(Double inseamMax) { this.inseamMax = inseamMax; }

    public Double getHeightMin() { return heightMin; }
    public void setHeightMin(Double heightMin) { this.heightMin = heightMin; }

    public Double getHeightMax() { return heightMax; }
    public void setHeightMax(Double heightMax) { this.heightMax = heightMax; }
}
