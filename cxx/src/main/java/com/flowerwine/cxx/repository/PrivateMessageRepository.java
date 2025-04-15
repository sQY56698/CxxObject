package com.flowerwine.cxx.repository;

import com.flowerwine.cxx.entity.PrivateMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PrivateMessageRepository extends JpaRepository<PrivateMessage, Long> {
    
    Page<PrivateMessage> findByConversationIdOrderByCreatedAtDesc(String conversationId, Pageable pageable);
    
    @Query("SELECT pm FROM PrivateMessage pm WHERE pm.conversationId = :conversationId ORDER BY pm.createdAt DESC LIMIT 1")
    Optional<PrivateMessage> findLatestByConversationId(@Param("conversationId") String conversationId);
    
    @Query("SELECT COUNT(pm) FROM PrivateMessage pm WHERE pm.conversationId = :conversationId AND pm.id > :messageId")
    Long countByConversationIdAndIdGreaterThan(
        @Param("conversationId") String conversationId, 
        @Param("messageId") Long messageId
    );
    
    @Query("SELECT COUNT(pm) FROM PrivateMessage pm WHERE pm.conversationId = :conversationId AND pm.id > :lastReadId")
    Long countUnreadMessages(@Param("conversationId") String conversationId, @Param("lastReadId") Long lastReadId);

    @Query("SELECT COUNT(pm) FROM PrivateMessage pm WHERE pm.conversationId = :conversationId " +
           "AND pm.receiverId = :userId AND pm.senderId != :userId " +
           "AND pm.id > :lastReadId")
    Long countUnreadMessagesForUser(
        @Param("conversationId") String conversationId,
        @Param("userId") Long userId,
        @Param("lastReadId") Long lastReadId
    );

    @Query("SELECT COUNT(pm) FROM PrivateMessage pm WHERE pm.conversationId = :conversationId " +
           "AND pm.receiverId = :userId AND pm.senderId != :userId")
    Long countMessagesByConversationIdAndReceiverId(
        @Param("conversationId") String conversationId,
        @Param("userId") Long userId
    );
} 