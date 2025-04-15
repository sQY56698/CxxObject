package com.flowerwine.cxx.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConversationDTO {
    private String conversationId;
    private Long partnerId;
    private String partnerUsername;
    private String partnerAvatar;
    private MessageDTO lastMessage;
    private Long unreadCount;
} 