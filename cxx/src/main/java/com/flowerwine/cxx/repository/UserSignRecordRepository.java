package com.flowerwine.cxx.repository;

import com.flowerwine.cxx.entity.UserSignRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserSignRecordRepository extends JpaRepository<UserSignRecord, Long> {
    Optional<UserSignRecord> findByUserIdAndYearAndMonth(Long userId, Integer year, Integer month);
    
    @Modifying
    @Query("UPDATE UserSignRecord usr SET usr.signBitmap = ?4 WHERE usr.userId = ?1 AND usr.year = ?2 AND usr.month = ?3")
    int updateSignBitmap(Long userId, Integer year, Integer month, Long signBitmap);
}