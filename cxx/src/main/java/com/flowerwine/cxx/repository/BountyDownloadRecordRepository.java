package com.flowerwine.cxx.repository;

import com.flowerwine.cxx.entity.BountyDownloadRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BountyDownloadRecordRepository extends JpaRepository<BountyDownloadRecord, Long> {
    List<BountyDownloadRecord> findByBountyIdAndUserId(Long bountyId, Long userId);
    int countByBountyIdAndUserId(Long bountyId, Long userId);
}