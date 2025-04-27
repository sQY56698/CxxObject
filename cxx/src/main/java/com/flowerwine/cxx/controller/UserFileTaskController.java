package com.flowerwine.cxx.controller;

import com.flowerwine.cxx.annotation.CurrentUser;
import com.flowerwine.cxx.dto.CreateUserFileTaskDTO;
import com.flowerwine.cxx.dto.FileInfoDTO;
import com.flowerwine.cxx.dto.UserFileTaskDTO;
import com.flowerwine.cxx.dto.UserUploadFileQueryDTO;
import com.flowerwine.cxx.security.AuthUser;
import com.flowerwine.cxx.service.UserFileTaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/user-files")
@RequiredArgsConstructor
public class UserFileTaskController {

    private final UserFileTaskService userFileTaskService;

    /**
     * 创建用户文件任务
     */
    @PostMapping("/create")
    public ResponseEntity<UserFileTaskDTO> createUserFileTask(
            @Valid @RequestBody CreateUserFileTaskDTO createDTO,
            @CurrentUser AuthUser authUser) {
        
        UserFileTaskDTO task = userFileTaskService.createUserFileTask(createDTO, authUser.getId());
        return ResponseEntity.ok(task);
    }
    
    /**
     * 获取文件任务详情
     */
    @GetMapping("/{taskId}")
    public ResponseEntity<UserFileTaskDTO> getUserFileTaskDetail(
            @PathVariable Long taskId,
            @CurrentUser AuthUser authUser) {
        
        UserFileTaskDTO task = userFileTaskService.getUserFileTaskDetail(taskId, authUser.getId());
        return ResponseEntity.ok(task);
    }
    
    /**
     * 获取我的文件任务列表
     */
    @GetMapping("/my")
    public ResponseEntity<Page<UserFileTaskDTO>> getMyUserFileTasks(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @CurrentUser AuthUser authUser) {
        
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<UserFileTaskDTO> tasks = userFileTaskService.getMyUserFileTasks(authUser.getId(), pageable);
        return ResponseEntity.ok(tasks);
    }
    
    /**
     * 获取公开的文件任务列表
     */
    @GetMapping("/public")
    public ResponseEntity<Page<UserFileTaskDTO>> getPublicUserFileTasks(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @CurrentUser AuthUser authUser) {
        
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<UserFileTaskDTO> tasks = userFileTaskService.getPublicUserFileTasks(pageable, authUser.getId());
        return ResponseEntity.ok(tasks);
    }
    
    /**
     * 获取免费的文件任务列表
     */
    @GetMapping("/free")
    public ResponseEntity<Page<UserFileTaskDTO>> getFreeUserFileTasks(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @CurrentUser AuthUser authUser) {
        
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<UserFileTaskDTO> tasks = userFileTaskService.getFreeUserFileTasks(pageable, authUser.getId());
        return ResponseEntity.ok(tasks);
    }
    
    /**
     * 搜索文件任务
     */
    @GetMapping("/search")
    public ResponseEntity<Page<UserFileTaskDTO>> searchUserFileTasks(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @CurrentUser AuthUser authUser) {
        
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<UserFileTaskDTO> tasks = userFileTaskService.searchUserFileTasks(keyword, pageable, authUser.getId());
        return ResponseEntity.ok(tasks);
    }
    
    /**
     * 下载文件任务
     */
    @GetMapping("/{taskId}/download")
    public ResponseEntity<FileInfoDTO> downloadUserFileTask(
            @PathVariable Long taskId,
            @CurrentUser AuthUser authUser) {
        
        FileInfoDTO fileInfo = userFileTaskService.downloadUserFileTask(taskId, authUser.getId());
        return ResponseEntity.ok(fileInfo);
    }
    
    /**
     * 更新文件任务
     */
    @PutMapping("/{taskId}")
    public ResponseEntity<UserFileTaskDTO> updateUserFileTask(
            @PathVariable Long taskId,
            @Valid @RequestBody CreateUserFileTaskDTO updateDTO,
            @CurrentUser AuthUser authUser) {
        
        UserFileTaskDTO task = userFileTaskService.updateUserFileTask(taskId, updateDTO, authUser.getId());
        return ResponseEntity.ok(task);
    }
    
    /**
     * 删除文件任务
     */
    @DeleteMapping("/{taskId}")
    public ResponseEntity<Boolean> deleteUserFileTask(
            @PathVariable Long taskId,
            @CurrentUser AuthUser authUser) {
        
        boolean success = userFileTaskService.deleteUserFileTask(taskId, authUser.getId());
        return ResponseEntity.ok(success);
    }

    /**
     * 查询文件任务
     */
    @GetMapping("/query")
    public ResponseEntity<Page<UserFileTaskDTO>> queryUserFileTasks(
            UserUploadFileQueryDTO queryDTO,
            @CurrentUser AuthUser authUser) {
        
        Pageable pageable = PageRequest.of(queryDTO.getPage(), queryDTO.getSize(), Sort.by(Sort.Direction.DESC, "createdAt"));
        
        Page<UserFileTaskDTO> tasks = userFileTaskService.queryUserFileTasks(
            queryDTO, pageable, authUser.getId());
        
        return ResponseEntity.ok(tasks);
    }

    /**
     * 获取最新资源
     */
    @GetMapping("/latest")
    public ResponseEntity<List<UserFileTaskDTO>> getLatestResources(
            @RequestParam(defaultValue = "10") int limit,
            @CurrentUser AuthUser authUser) {
        
        List<UserFileTaskDTO> resources = userFileTaskService.getLatestResources(limit, authUser.getId());
        return ResponseEntity.ok(resources);
    }

    /**
     * 获取热门资源
     */
    @GetMapping("/hot")
    public ResponseEntity<List<UserFileTaskDTO>> getHotResources(
            @RequestParam(defaultValue = "10") int limit,
            @CurrentUser AuthUser authUser) {
        
        List<UserFileTaskDTO> resources = userFileTaskService.getHotResources(limit, authUser.getId());
        return ResponseEntity.ok(resources);
    }
} 