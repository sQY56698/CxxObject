package com.flowerwine.cxx.repository;

import com.flowerwine.cxx.entity.FileDownloadRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FileDownloadRecordRepository extends JpaRepository<FileDownloadRecord, Long> {
    List<FileDownloadRecord> findByFileIdAndUserId(Long fileId, Long userId);
    boolean existsByFileIdAndUserId(Long fileId, Long userId);
}