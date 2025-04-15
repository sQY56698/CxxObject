package com.flowerwine.cxx.repository;

import com.flowerwine.cxx.entity.PrivateMessageConversation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PrivateMessageConversationRepository extends JpaRepository<PrivateMessageConversation, Long> {
    
    @Query("SELECT pmc FROM PrivateMessageConversation pmc WHERE pmc.initiatorId = ?1 OR pmc.participantId = ?1 ORDER BY pmc.updatedAt DESC")
    Page<PrivateMessageConversation> findByUser(Long userId, Pageable pageable);
    
    Optional<PrivateMessageConversation> findByConversationId(String conversationId);
    
    @Query("SELECT pmc FROM PrivateMessageConversation pmc WHERE (pmc.initiatorId = ?1 AND pmc.participantId = ?2) OR (pmc.initiatorId = ?2 AND pmc.participantId = ?1)")
    Optional<PrivateMessageConversation> findByTwoUsers(Long user1Id, Long user2Id);

    @Query("SELECT pmc FROM PrivateMessageConversation pmc WHERE pmc.initiatorId = :userId OR pmc.participantId = :userId")
    List<PrivateMessageConversation> findAllByUser(@Param("userId") Long userId);
} 