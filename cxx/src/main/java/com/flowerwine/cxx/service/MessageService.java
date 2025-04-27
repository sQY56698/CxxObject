package com.flowerwine.cxx.service;

import cn.hutool.core.util.IdUtil;
import com.flowerwine.cxx.dto.ConversationDTO;
import com.flowerwine.cxx.dto.MessageDTO;
import com.flowerwine.cxx.dto.SystemMessageDTO;
import com.flowerwine.cxx.dto.UserProfileDTO;
import com.flowerwine.cxx.dto.UnreadCountDTO;
import com.flowerwine.cxx.entity.*;
import com.flowerwine.cxx.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class MessageService {
    
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final SystemMessageRepository systemMessageRepository;
    private final SystemMessageReadRepository systemMessageReadRepository;
    private final PrivateMessageConversationRepository conversationRepository;
    private final PrivateMessageRepository messageRepository;
    private final PrivateMessageReadRepository messageReadRepository;
    private final SimpMessagingTemplate messagingTemplate;
    
    /**
     * 获取系统消息列表，并更新已读状态
     */
    @Transactional
    public Page<SystemMessageDTO> getSystemMessages(Long userId, int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<SystemMessage> messages = systemMessageRepository.findAllByOrderByCreatedAtDesc(pageRequest);
        
        // 如果有消息，更新最后读取记录
        if (messages.hasContent()) {
            SystemMessage latestMessage = messages.getContent().get(0);
            
            // 获取用户最后的已读记录
            Optional<SystemMessageRead> lastRead = systemMessageReadRepository.findTopByUserIdOrderByMessageIdDesc(userId);
            
            // 如果没有记录或者当前消息比已读记录更新，才更新记录
            if (lastRead.isEmpty()) {
                // 创建新记录
                SystemMessageRead readStatus = new SystemMessageRead();
                readStatus.setMessageId(latestMessage.getId());
                readStatus.setUserId(userId);
                systemMessageReadRepository.save(readStatus);
            } else {
                SystemMessageRead existingRead = lastRead.get();
                // 只有当新消息ID大于现有记录时才更新
                if (latestMessage.getId() > existingRead.getMessageId()) {
                    existingRead.setMessageId(latestMessage.getId());
                    systemMessageReadRepository.save(existingRead);
                }
            }
        }

        return messages.map(this::convertToSystemMessageDTO);
    }
    
    /**
     * 获取会话消息列表，并更新已读状态
     */
    @Transactional
    public Page<MessageDTO> getConversationMessages(String conversationId, Long userId, int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<PrivateMessage> messages = messageRepository.findByConversationIdOrderByCreatedAtDesc(conversationId, pageRequest);
        
        // 如果有消息，更新最后读取记录
        if (messages.hasContent()) {
            PrivateMessage latestMessage = messages.getContent().get(0);
            
            // 获取用户在该会话中的已读记录
            Optional<PrivateMessageRead> lastRead = messageReadRepository.findByUserIdAndConversationId(userId, conversationId);
            
            // 如果是新记录或者当前消息比已读记录更新，才更新记录
            if (lastRead.isEmpty() || 
                messageRepository.findById(lastRead.get().getMessageId())
                    .map(existing -> existing.getCreatedAt().isBefore(latestMessage.getCreatedAt()))
                    .orElse(true)) {
                
                PrivateMessageRead readStatus = lastRead.orElse(new PrivateMessageRead());
                readStatus.setUserId(userId);
                readStatus.setConversationId(conversationId);
                readStatus.setMessageId(latestMessage.getId());
                messageReadRepository.save(readStatus);
            }
        }

        return messages.map(this::convertToMessageDTO);
    }
    
    /**
     * 获取用户信息，包括用户资料
     */
    private UserProfileDTO getUserInfo(Long userId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return null;
        }
        UserProfile profile = userProfileRepository.findByUserId(userId).orElseThrow(() -> new RuntimeException("用户资料不存在"));
        return UserProfileDTO.builder()
                .userId(user.getId())
                .username(user.getUsername())
                .avatar(profile.getAvatar())
                .build();
    }
    
    /**
     * 获取用户的会话列表
     */
    public Page<ConversationDTO> getUserConversations(Long userId, int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size);
        Page<PrivateMessageConversation> conversations = conversationRepository.findByUser(userId, pageRequest);
        
        List<ConversationDTO> conversationDTOs = new ArrayList<>();
        for (PrivateMessageConversation conversation : conversations) {
            // 确定会话伙伴ID
            Long partnerId = conversation.getInitiatorId().equals(userId) ? 
                conversation.getParticipantId() : conversation.getInitiatorId();
            
            // 获取伙伴信息
            UserProfileDTO partner = getUserInfo(partnerId);
            if (partner == null) {
                continue;
            }
            
            // 获取最新消息
            Optional<PrivateMessage> latestMessageOpt = messageRepository.findLatestByConversationId(conversation.getConversationId());
            MessageDTO lastMessage = latestMessageOpt.map(this::convertToMessageDTO).orElse(null);
            if (latestMessageOpt.isPresent() && lastMessage == null) {
                // 如果有最新消息但转换失败（用户不存在），跳过这个会话
                continue;
            }
            
            // 获取未读消息数量
            Long unreadCount;
            Optional<PrivateMessageRead> readStatus = messageReadRepository.findByUserIdAndConversationId(userId, conversation.getConversationId());
            if (readStatus.isPresent()) {
                unreadCount = messageRepository.countUnreadMessagesForUser(
                    conversation.getConversationId(), 
                    userId,
                    readStatus.get().getMessageId()
                );
            } else {
                unreadCount = messageRepository.countMessagesByConversationIdAndReceiverId(
                    conversation.getConversationId(), 
                    userId
                );
            }
            
            ConversationDTO conversationDTO = ConversationDTO.builder()
                    .conversationId(conversation.getConversationId())
                    .partnerId(partnerId)
                    .partnerUsername(partner.getUsername())
                    .partnerAvatar(partner.getAvatar())
                    .lastMessage(lastMessage)
                    .unreadCount(unreadCount)
                    .build();
            
            conversationDTOs.add(conversationDTO);
        }
        
        return new PageImpl<>(conversationDTOs, pageRequest, conversations.getTotalElements());
    }
    
    /**
     * 发送私信
     */
    @Transactional
    public MessageDTO sendPrivateMessage(Long senderId, Long receiverId, String content) {
        // 查找或创建会话
        Optional<PrivateMessageConversation> existingConversation = conversationRepository.findByTwoUsers(senderId, receiverId);
        PrivateMessageConversation conversation;
        
        if (existingConversation.isEmpty()) {
            String conversationId = IdUtil.fastSimpleUUID();
            conversation = new PrivateMessageConversation();
            conversation.setConversationId(conversationId);
            conversation.setInitiatorId(senderId);
            conversation.setParticipantId(receiverId);
            conversationRepository.save(conversation);
        } else {
            conversation = existingConversation.get();
        }
        
        // 创建私信
        PrivateMessage message = new PrivateMessage();
        message.setConversationId(conversation.getConversationId());
        message.setSenderId(senderId);
        message.setReceiverId(receiverId);
        message.setContent(content);
        message = messageRepository.save(message);
        
        // 转换为DTO并发送
        MessageDTO messageDTO = convertToMessageDTO(message);
        if (messageDTO != null) {
            // 发送消息给发送者
            messagingTemplate.convertAndSendToUser(
                senderId.toString(),
                "/message",
                messageDTO
            );

            // 发送消息给接收者
            messagingTemplate.convertAndSendToUser(
                receiverId.toString(),
                "/message",
                messageDTO
            );
        }
        
        return messageDTO;
    }
    
    /**
     * 转换系统消息为DTO
     */
    private SystemMessageDTO convertToSystemMessageDTO(SystemMessage message) {
        return SystemMessageDTO.builder()
                .id(message.getId())
                .title(message.getTitle())
                .content(message.getContent())
                .createdAt(message.getCreatedAt())
                .build();
    }
    
    /**
     * 转换私信消息为DTO
     */
    private MessageDTO convertToMessageDTO(PrivateMessage message) {
        UserProfileDTO sender = getUserInfo(message.getSenderId());
        UserProfileDTO receiver = getUserInfo(message.getReceiverId());
        
        // 如果发送者或接收者不存在，返回null
        if (sender == null || receiver == null) {
            return null;
        }
        
        return MessageDTO.builder()
                .id(message.getId())
                .conversationId(message.getConversationId())
                .senderId(message.getSenderId())
                .senderUsername(sender.getUsername())
                .senderAvatar(sender.getAvatar())
                .receiverId(message.getReceiverId())
                .receiverUsername(receiver.getUsername())
                .receiverAvatar(receiver.getAvatar())
                .content(message.getContent())
                .createdAt(message.getCreatedAt())
                .build();
    }

    /**
     * 获取用户的所有未读消息数量
     */
    public UnreadCountDTO getUnreadMessageCounts(Long userId) {
        // 1. 获取未读系统消息数量
        Long systemUnreadCount = getUnreadSystemMessageCount(userId);
        
        // 2. 获取所有未读私信数量
        Long privateUnreadCount = getUnreadPrivateMessageCount(userId);
        
        // 3. 构建返回对象
        return UnreadCountDTO.builder()
                .systemMessageCount(systemUnreadCount)
                .privateMessageCount(privateUnreadCount)
                .totalCount(systemUnreadCount + privateUnreadCount)
                .build();
    }

    /**
     * 获取未读系统消息数量
     */
    private Long getUnreadSystemMessageCount(Long userId) {
        Optional<SystemMessageRead> lastRead = systemMessageReadRepository.findTopByUserIdOrderByMessageIdDesc(userId);
        if (lastRead.isEmpty()) {
            // 如果没有阅读记录，则所有系统消息都未读
            return systemMessageRepository.count();
        }
        return systemMessageRepository.countByIdGreaterThan(lastRead.get().getMessageId());
    }

    /**
     * 获取所有未读私信数量
     */
    private Long getUnreadPrivateMessageCount(Long userId) {
        // 1. 获取用户参与的所有会话
        List<PrivateMessageConversation> conversations = conversationRepository.findAllByUser(userId);
        
        // 2. 统计所有会话的未读消息
        return conversations.stream()
                .mapToLong(conversation -> {
                    Optional<PrivateMessageRead> readStatus = messageReadRepository
                        .findByUserIdAndConversationId(userId, conversation.getConversationId());
                    
                    if (readStatus.isEmpty()) {
                        // 如果没有阅读记录，统计该会话中所有发给当前用户的消息
                        return messageRepository.countMessagesByConversationIdAndReceiverId(
                            conversation.getConversationId(), 
                            userId
                        );
                    } else {
                        // 统计大于最后读取ID的消息
                        return messageRepository.countUnreadMessagesForUser(
                            conversation.getConversationId(),
                            userId,
                            readStatus.get().getMessageId()
                        );
                    }
                })
                .sum();
    }

    /**
     * 创建或获取与指定用户的会话
     */
    @Transactional
    public ConversationDTO createOrGetConversation(Long userId, Long partnerId) {
        // 1. 验证用户是否存在
        UserProfileDTO partner = getUserInfo(partnerId);
        if (partner == null) {
            throw new RuntimeException("用户不存在");
        }
        
        // 2. 查找现有会话
        Optional<PrivateMessageConversation> existingConversation = conversationRepository.findByTwoUsers(userId, partnerId);
        PrivateMessageConversation conversation;
        
        if (existingConversation.isEmpty()) {
            // 3. 如果不存在，创建新会话
            String conversationId = IdUtil.fastSimpleUUID();
            conversation = new PrivateMessageConversation();
            conversation.setConversationId(conversationId);
            conversation.setInitiatorId(userId);
            conversation.setParticipantId(partnerId);
            conversation = conversationRepository.save(conversation);
        } else {
            conversation = existingConversation.get();
        }
        
        // 4. 获取最新消息
        Optional<PrivateMessage> latestMessageOpt = messageRepository.findLatestByConversationId(conversation.getConversationId());
        MessageDTO lastMessage = latestMessageOpt.map(this::convertToMessageDTO).orElse(null);
        
        // 5. 获取未读消息数量
        Long unreadCount;
        Optional<PrivateMessageRead> readStatus = messageReadRepository.findByUserIdAndConversationId(userId, conversation.getConversationId());
        if (readStatus.isPresent()) {
            unreadCount = messageRepository.countUnreadMessagesForUser(
                conversation.getConversationId(), 
                userId,
                readStatus.get().getMessageId()
            );
        } else {
            unreadCount = messageRepository.countMessagesByConversationIdAndReceiverId(
                conversation.getConversationId(), 
                userId
            );
        }
        
        // 6. 构建返回对象
        return ConversationDTO.builder()
                .conversationId(conversation.getConversationId())
                .partnerId(partnerId)
                .partnerUsername(partner.getUsername())
                .partnerAvatar(partner.getAvatar())
                .lastMessage(lastMessage)
                .unreadCount(unreadCount)
                .build();
    }

    /**
     * 创建系统消息并通过WebSocket发送给所有在线用户
     */
    @Transactional
    public SystemMessageDTO createSystemMessage(String title, String content) {
        // 创建系统消息记录
        SystemMessage message = new SystemMessage();
        message.setTitle(title);
        message.setContent(content);
        message = systemMessageRepository.save(message);
        
        // 转换为DTO
        SystemMessageDTO messageDTO = convertToSystemMessageDTO(message);
        
        // 通过WebSocket广播消息
        messagingTemplate.convertAndSend("/topic/system", messageDTO);
        
        return messageDTO;
    }

    /**
     * 获取所有系统消息（管理员使用）
     */
    public Page<SystemMessageDTO> getAllSystemMessages(PageRequest pageRequest) {
        Page<SystemMessage> messages = systemMessageRepository.findAllByOrderByCreatedAtDesc(pageRequest);
        return messages.map(this::convertToSystemMessageDTO);
    }

}