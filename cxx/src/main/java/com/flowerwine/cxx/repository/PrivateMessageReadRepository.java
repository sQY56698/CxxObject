package com.flowerwine.cxx.repository;

import com.flowerwine.cxx.entity.PrivateMessageRead;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PrivateMessageReadRepository extends JpaRepository<PrivateMessageRead, Long> {
    
    Optional<PrivateMessageRead> findByUserIdAndConversationId(Long userId, String conversationId);
} 