package com.flowerwine.cxx.repository;

import com.flowerwine.cxx.entity.SystemMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface SystemMessageRepository extends JpaRepository<SystemMessage, Long> {
    // 获取大于指定ID的消息数量
    @Query("SELECT COUNT(sm) FROM SystemMessage sm WHERE sm.id > (SELECT COALESCE(MAX(smr.messageId), 0) FROM SystemMessageRead smr WHERE smr.userId = :userId)")
    Long countUnreadMessagesAfterLastRead(@Param("userId") Long userId);

    // 获取指定ID之后的所有消息
    @Query("SELECT COUNT(sm) FROM SystemMessage sm WHERE sm.id > :messageId")
    Long countByIdGreaterThan(@Param("messageId") Long messageId);

    // 按创建时间倒序获取所有系统消息
    Page<SystemMessage> findAllByOrderByCreatedAtDesc(Pageable pageable);
} 