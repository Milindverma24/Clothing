package com.clothing.repository;

import com.clothing.entity.SizeChartEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SizeChartEntryRepository extends JpaRepository<SizeChartEntry, Long> {
    List<SizeChartEntry> findBySizeChartIdOrderBySortOrderAsc(Long sizeChartId);
}
