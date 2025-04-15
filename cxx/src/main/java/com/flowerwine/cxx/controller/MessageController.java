package com.flowerwine.cxx.controller;

import com.flowerwine.cxx.annotation.CurrentUser;
import com.flowerwine.cxx.dto.ConversationDTO;
import com.flowerwine.cxx.dto.MessageDTO;
import com.flowerwine.cxx.dto.SystemMessageDTO;
import com.flowerwine.cxx.dto.UnreadCountDTO;
import com.flowerwine.cxx.security.AuthUser;
import com.flowerwine.cxx.service.MessageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;
    private final SimpMessagingTemplate messagingTemplate;

    /**
     * 获取系统消息列表
     */
    @GetMapping("/system")
    public ResponseEntity<Page<SystemMessageDTO>> getSystemMessages(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @CurrentUser AuthUser user) {
        Page<SystemMessageDTO> messages = messageService.getSystemMessages(user.getId(), page, size);
        return ResponseEntity.ok(messages);
    }

    /**
     * 获取会话列表
     */
    @GetMapping("/conversations")
    public ResponseEntity<Page<ConversationDTO>> getConversations(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @CurrentUser AuthUser user) {
        Page<ConversationDTO> conversations = messageService.getUserConversations(user.getId(), page, size);
        return ResponseEntity.ok(conversations);
    }

    /**
     * 获取会话消息列表
     */
    @GetMapping("/conversations/{conversationId}/messages")
    public ResponseEntity<Page<MessageDTO>> getConversationMessages(
            @PathVariable String conversationId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @CurrentUser AuthUser user) {
        Page<MessageDTO> messages = messageService.getConversationMessages(conversationId, user.getId(), page, size);
        return ResponseEntity.ok(messages);
    }

    /**
     * 获取未读消息数量
     * 包括系统消息和私信消息的未读数量
     */
    @GetMapping("/unread")
    public ResponseEntity<UnreadCountDTO> getUnreadMessageCounts(@CurrentUser AuthUser user) {
        UnreadCountDTO unreadCounts = messageService.getUnreadMessageCounts(user.getId());
        return ResponseEntity.ok(unreadCounts);
    }

    /**
     * WebSocket消息处理
     */
    @MessageMapping("/chat")
    public void processMessage(@Payload Map<String, Object> chatMessage) {
        Long senderId = Long.parseLong(chatMessage.get("senderId").toString());
        Long receiverId = Long.parseLong(chatMessage.get("receiverId").toString());
        String content = (String) chatMessage.get("content");
        
        messageService.sendPrivateMessage(senderId, receiverId, content);
    }

    /**
     * 创建或获取与指定用户的会话
     */
    @PostMapping("/conversations/users/{partnerId}")
    public ResponseEntity<ConversationDTO> createOrGetConversation(
            @CurrentUser AuthUser currentUser,
            @PathVariable Long partnerId
    ) {
        if (currentUser.getId().equals(partnerId)) {
            return ResponseEntity.badRequest().build();
        }
        
        try {
            ConversationDTO conversation = messageService.createOrGetConversation(currentUser.getId(), partnerId);
            return ResponseEntity.ok(conversation);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
} 