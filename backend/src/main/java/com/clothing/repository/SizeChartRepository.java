package com.clothing.repository;

import com.clothing.entity.SizeChart;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SizeChartRepository extends JpaRepository<SizeChart, Long> {

    @Query("SELECT sc FROM SizeChart sc LEFT JOIN FETCH sc.entries e WHERE " +
           "(:gender IS NULL OR UPPER(sc.gender) = UPPER(:gender)) AND " +
           "(:audience IS NULL OR UPPER(sc.audience) = UPPER(:audience)) AND " +
           "(:category IS NULL OR UPPER(sc.category) = UPPER(:category)) " +
           "ORDER BY sc.id ASC")
    List<SizeChart> findByFilters(
        @Param("gender") String gender,
        @Param("audience") String audience,
        @Param("category") String category
    );

    @Query("SELECT sc FROM SizeChart sc LEFT JOIN FETCH sc.entries e WHERE sc.id = :id")
    Optional<SizeChart> findByIdWithEntries(@Param("id") Long id);

    @Query("SELECT sc FROM SizeChart sc LEFT JOIN FETCH sc.entries e WHERE " +
           "UPPER(sc.gender) = UPPER(:gender) AND " +
           "UPPER(sc.audience) = UPPER(:audience) AND " +
           "UPPER(sc.category) = UPPER(:category)")
    Optional<SizeChart> findExactMatch(
        @Param("gender") String gender,
        @Param("audience") String audience,
        @Param("category") String category
    );

    @Query("SELECT sc FROM SizeChart sc LEFT JOIN FETCH sc.entries e WHERE " +
           "UPPER(sc.gender) = UPPER(:gender) AND " +
           "UPPER(sc.audience) = UPPER(:audience)")
    List<SizeChart> findByGenderAndAudience(
        @Param("gender") String gender,
        @Param("audience") String audience
    );
}
