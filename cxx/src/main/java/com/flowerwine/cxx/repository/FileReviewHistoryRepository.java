package com.flowerwine.cxx.repository;

import com.flowerwine.cxx.entity.FileReviewHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FileReviewHistoryRepository extends JpaRepository<FileReviewHistory, Long> {
    List<FileReviewHistory> findByFileUploadIdOrderByCreatedAtDesc(Long fileUploadId);
    Page<FileReviewHistory> findByReviewerId(Long reviewerId, Pageable pageable);
} 