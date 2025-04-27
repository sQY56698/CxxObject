package com.flowerwine.cxx.repository;

import com.flowerwine.cxx.entity.UserUploadFile;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserUploadFileRepository extends JpaRepository<UserUploadFile, Long> {
    Optional<UserUploadFile> findByFileId(Long fileId);
    Page<UserUploadFile> findByUserId(Long userId, Pageable pageable);
}