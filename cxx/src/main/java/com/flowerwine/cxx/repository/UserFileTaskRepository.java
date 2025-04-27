package com.flowerwine.cxx.repository;

import com.flowerwine.cxx.entity.UserFileTask;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserFileTaskRepository extends JpaRepository<UserFileTask, Long> {
    Page<UserFileTask> findByUserId(Long userId, Pageable pageable);
    
    Page<UserFileTask> findByStatus(Byte status, Pageable pageable);
    
    @Query("SELECT t FROM UserFileTask t WHERE t.status = :status AND t.isFree = :isFree")
    Page<UserFileTask> findByStatusAndIsFree(Byte status, Byte isFree, Pageable pageable);
    
    @Query("SELECT t FROM UserFileTask t WHERE t.title LIKE %:keyword% OR t.description LIKE %:keyword%")
    Page<UserFileTask> searchByKeyword(String keyword, Pageable pageable);
    
    @Modifying
    @Query("UPDATE UserFileTask t SET t.viewCount = t.viewCount + 1 WHERE t.id = :id")
    void incrementViewCount(Long id);
    
    @Modifying
    @Query("UPDATE UserFileTask t SET t.downloadCount = t.downloadCount + 1 WHERE t.id = :id")
    void incrementDownloadCount(Long id);

    /**
     * 根据多个状态查询
     */
    Page<UserFileTask> findByStatusIn(List<Byte> statuses, Pageable pageable);

    /**
     * 根据关键词和多个状态查询
     */
    @Query("SELECT t FROM UserFileTask t WHERE " +
           "(t.title LIKE %:keyword% OR t.description LIKE %:keyword%) " +
           "AND t.status IN :statuses")
    Page<UserFileTask> searchByKeywordAndStatusIn(
        @Param("keyword") String keyword,
        @Param("statuses") List<Byte> statuses,
        Pageable pageable
    );

    /**
     * 通用查询方法，支持多条件组合
     */
    @Query("SELECT t FROM UserFileTask t WHERE " +
           "(:userId IS NULL OR t.userId = :userId) AND " +
           "(:free IS NULL OR t.isFree = :free) AND " +
           "(:keyword IS NULL OR t.title LIKE %:keyword% OR t.description LIKE %:keyword%) AND " +
           "(:statuses IS NULL OR t.status IN :statuses)")
    Page<UserFileTask> findWithFilters(
        @Param("userId") Long userId,
        @Param("free") Integer isFree,
        @Param("keyword") String keyword,
        @Param("statuses") List<Byte> statuses,
        Pageable pageable
    );
} 