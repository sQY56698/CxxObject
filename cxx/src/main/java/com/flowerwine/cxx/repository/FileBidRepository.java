package com.flowerwine.cxx.repository;

import com.flowerwine.cxx.entity.FileBid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FileBidRepository extends JpaRepository<FileBid, Long> {
    List<FileBid> findByBountyId(Long bountyId);
    Page<FileBid> findByBountyId(Long bountyId, Pageable pageable);
    List<FileBid> findByUserIdAndBountyId(Long userId, Long bountyId);
    Page<FileBid> findByUserId(Long userId, Pageable pageable);
    
    List<FileBid> findByFileId(Long fileId);
    
    @Query("SELECT COUNT(fb) FROM FileBid fb WHERE fb.bountyId = :bountyId")
    int countByBountyId(Long bountyId);
    
    boolean existsByUserIdAndBountyId(Long userId, Long bountyId);
}