package com.flowerwine.cxx.repository;

import com.flowerwine.cxx.entity.SystemMessageRead;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SystemMessageReadRepository extends JpaRepository<SystemMessageRead, Long> {
    Optional<SystemMessageRead> findByMessageIdAndUserId(Long messageId, Long userId);
    
    List<SystemMessageRead> findByUserId(Long userId);
    
    @Query("SELECT COUNT(sm) FROM SystemMessage sm WHERE sm.id NOT IN (SELECT smr.messageId FROM SystemMessageRead smr WHERE smr.userId = ?1)")
    Long countUnreadSystemMessages(Long userId);

    // 获取用户最后读取的系统消息记录
    @Query("SELECT smr FROM SystemMessageRead smr WHERE smr.userId = :userId ORDER BY smr.messageId DESC LIMIT 1")
    Optional<SystemMessageRead> findTopByUserIdOrderByMessageIdDesc(@Param("userId") Long userId);
} 