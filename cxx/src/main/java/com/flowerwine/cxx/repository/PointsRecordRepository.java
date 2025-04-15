package com.flowerwine.cxx.repository;

import com.flowerwine.cxx.entity.PointsRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PointsRecordRepository extends JpaRepository<PointsRecord, Long> {
    Page<PointsRecord> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
} 