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
public class MessageDTO {
    private Long id;
    private String conversationId;
    private Long senderId;
    private String senderUsername;
    private String senderAvatar;
    private Long receiverId;
    private String receiverUsername;
    private String receiverAvatar;
    private String content;
    private LocalDateTime createdAt;
} 