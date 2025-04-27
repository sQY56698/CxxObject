package com.flowerwine.cxx.controller;

import com.flowerwine.cxx.annotation.CurrentAdmin;
import com.flowerwine.cxx.dto.SystemMessageCreateDTO;
import com.flowerwine.cxx.dto.SystemMessageDTO;
import com.flowerwine.cxx.security.AdminAuthUser;
import com.flowerwine.cxx.service.MessageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/admin/messages")
@RequiredArgsConstructor
public class AdminMessageController {

    private final MessageService messageService;

    /**
     * 发送系统消息
     */
    @PostMapping("/send")
    public ResponseEntity<SystemMessageDTO> sendSystemMessage(
            @Valid @RequestBody SystemMessageCreateDTO messageDto,
            @CurrentAdmin AdminAuthUser admin) {
        
        log.info("管理员 {} (ID: {}) 发送系统消息: {}", admin.getUsername(), admin.getId(), messageDto.getTitle());
        
        // 发送系统消息
        SystemMessageDTO message = messageService.createSystemMessage(messageDto.getTitle(), messageDto.getContent());

        return ResponseEntity.ok(message);
    }
    
    /**
     * 获取系统消息历史
     */
    @GetMapping("/history")
    public ResponseEntity<Page<SystemMessageDTO>> getSystemMessageHistory(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @CurrentAdmin AdminAuthUser admin) {
        
        log.info("管理员 {} (ID: {}) 查询系统消息历史", admin.getUsername(), admin.getId());
        
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<SystemMessageDTO> messages = messageService.getAllSystemMessages(pageRequest);
        
        return ResponseEntity.ok(messages);
    }
} 