package com.flowerwine.cxx.repository;

import com.flowerwine.cxx.entity.FileBounty;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FileBountyRepository extends JpaRepository<FileBounty, Long> {
    Page<FileBounty> findByUserId(Long userId, Pageable pageable);
    Page<FileBounty> findByStatus(Byte status, Pageable pageable);
    Page<FileBounty> findByTitleContainingOrDescriptionContaining(String titleKeyword, String descriptionKeyword, Pageable pageable);
    
    List<FileBounty> findByUserIdAndWinnerId(Long userId, Long winnerId);
    
    @Modifying
    @Query("UPDATE FileBounty fb SET fb.viewCount = fb.viewCount + 1 WHERE fb.id = :id")
    void incrementViewCount(Long id);
    
    @Modifying
    @Query("UPDATE FileBounty fb SET fb.status = :status, fb.endAt = CURRENT_TIMESTAMP, fb.winnerId = :winnerId WHERE fb.id = :id")
    void updateBountyStatus(Long id, Byte status, Long winnerId);
}