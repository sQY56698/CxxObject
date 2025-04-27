package com.flowerwine.cxx.controller;

import com.flowerwine.cxx.annotation.CurrentAdmin;
import com.flowerwine.cxx.dto.FileReviewDTO;
import com.flowerwine.cxx.dto.UserFileTaskDTO;
import com.flowerwine.cxx.security.AdminAuthUser;
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

@Slf4j
@RestController
@RequestMapping("/api/admin/user-files")
@RequiredArgsConstructor
public class AdminFileTaskController {

    private final UserFileTaskService userFileTaskService;

    /**
     * 获取待审核的文件任务列表
     */
    @GetMapping("/pending")
    public ResponseEntity<Page<UserFileTaskDTO>> getPendingReviewTasks(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @CurrentAdmin AdminAuthUser admin) {
        
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "createdAt"));
        Page<UserFileTaskDTO> tasks = userFileTaskService.getPendingReviewTasks(pageable, admin.getId());
        return ResponseEntity.ok(tasks);
    }
    
    /**
     * 审核文件任务
     */
    @PostMapping("/review")
    public ResponseEntity<UserFileTaskDTO> reviewUserFileTask(
            @Valid @RequestBody FileReviewDTO reviewDTO,
            @CurrentAdmin AdminAuthUser admin) {
        
        UserFileTaskDTO task = userFileTaskService.reviewUserFileTask(reviewDTO, admin.getId());
        return ResponseEntity.ok(task);
    }
    
    /**
     * 获取所有文件任务（管理员可查看所有状态）
     */
    @GetMapping("/all")
    public ResponseEntity<Page<UserFileTaskDTO>> getAllUserFileTasks(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) Byte status,
            @CurrentAdmin AdminAuthUser admin) {
        
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        
        // 根据是否传入status参数查询不同的数据
        Page<UserFileTaskDTO> tasks;
        if (status != null) {
            // 按状态查询
            tasks = userFileTaskService.getTasksByStatus(status, pageable, admin.getId());
        } else {
            // 查询所有
            tasks = userFileTaskService.getAllTasks(pageable, admin.getId());
        }
        
        return ResponseEntity.ok(tasks);
    }
    
    /**
     * 管理员查看文件任务详情
     */
    @GetMapping("/{taskId}")
    public ResponseEntity<UserFileTaskDTO> getTaskDetail(
            @PathVariable Long taskId,
            @CurrentAdmin AdminAuthUser admin) {
        
        // 管理员可以查看所有状态的任务
        UserFileTaskDTO task = userFileTaskService.getTaskDetailForAdmin(taskId, admin.getId());
        return ResponseEntity.ok(task);
    }
    
    /**
     * 管理员强制删除文件任务
     */
    @DeleteMapping("/{taskId}")
    public ResponseEntity<Boolean> forceDeleteTask(
            @PathVariable Long taskId,
            @CurrentAdmin AdminAuthUser admin) {
        
        boolean success = userFileTaskService.forceDeleteTask(taskId, admin.getId());
        return ResponseEntity.ok(success);
    }

    /**
     * 管理员下载文件（不受权限和状态限制）
     */
    @GetMapping("/{taskId}/download")
    public ResponseEntity<Object> downloadFile(
            @PathVariable Long taskId,
            @CurrentAdmin AdminAuthUser admin) {
        
        log.info("管理员 {} 请求下载文件，任务ID: {}", admin.getUsername(), taskId);
        
        // 调用服务层获取文件信息，管理员下载不受权限限制
        Object fileInfo = userFileTaskService.adminDownloadFile(taskId, admin.getId());
        return ResponseEntity.ok(fileInfo);
    }
} 