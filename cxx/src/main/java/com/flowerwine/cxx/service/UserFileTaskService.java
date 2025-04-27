package com.flowerwine.cxx.service;

import com.flowerwine.cxx.dto.*;
import com.flowerwine.cxx.entity.FileReviewHistory;
import com.flowerwine.cxx.entity.User;
import com.flowerwine.cxx.entity.UserFileTask;
import com.flowerwine.cxx.entity.UserPoints;
import com.flowerwine.cxx.entity.UserUploadFile;
import com.flowerwine.cxx.enums.PointActionEnum;
import com.flowerwine.cxx.enums.UserFileTaskFreeEnum;
import com.flowerwine.cxx.enums.UserFileTaskStatusEnum;
import com.flowerwine.cxx.repository.FileReviewHistoryRepository;
import com.flowerwine.cxx.repository.UserFileTaskRepository;
import com.flowerwine.cxx.repository.UserRepository;
import com.flowerwine.cxx.repository.UserUploadFileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserFileTaskService {

    private final UserFileTaskRepository userFileTaskRepository;
    private final FileReviewHistoryRepository fileReviewHistoryRepository;
    private final UserRepository userRepository;
    private final UserUploadFileRepository userUploadFileRepository;
    private final FileService fileService;
    private final UserProfileService userProfileService;
    private final PointsService pointsService;

    /**
     * 创建用户文件任务
     */
    @Transactional
    public UserFileTaskDTO createUserFileTask(CreateUserFileTaskDTO createDTO, Long userId) {
        // 验证文件是否存在
        FileInfoDTO fileInfo = fileService.getFileInfo(createDTO.getFileId());
        
        // 从user_upload_file表中获取文件的上传者ID
        UserUploadFile userUploadFile = getUserUploadFileByFileId(createDTO.getFileId());
        
        // 验证文件是否属于当前用户
        if (!Objects.equals(userUploadFile.getUserId(), userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "您无权使用此文件");
        }
        
        // 创建用户文件任务
        UserFileTask task = new UserFileTask();
        task.setUserId(userId);
        task.setTitle(createDTO.getTitle());
        task.setDescription(createDTO.getDescription());
        task.setFileId(createDTO.getFileId());
        task.setIsFree(createDTO.getIsFree() ? UserFileTaskFreeEnum.FREE.getValue() : UserFileTaskFreeEnum.PAID.getValue());
        task.setRequiredPoints(createDTO.getIsFree() ? 0 : createDTO.getRequiredPoints());
        task.setStatus(UserFileTaskStatusEnum.REVIEWING.getValue());
        task.setDownloadCount(0);
        task.setViewCount(0);
        
        UserFileTask savedTask = userFileTaskRepository.save(task);
        log.info("用户 {} 创建了文件任务: {}", userId, savedTask.getId());
        
        // 如果是免费文件，添加积分补贴
        if (createDTO.getIsFree()) {
            pointsService.changePoints(userId, 100, PointActionEnum.FREE_FILE_SUBSIDY, 
                    "免费文件补贴: " + createDTO.getTitle());
            log.info("用户 {} 获得免费文件补贴100积分", userId);
        }
        
        return convertToDTO(savedTask, userId);
    }
    
    /**
     * 获取用户文件任务详情
     */
    @Transactional
    public UserFileTaskDTO getUserFileTaskDetail(Long taskId, Long currentUserId) {
        UserFileTask task = userFileTaskRepository.findById(taskId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "文件任务不存在"));
        
        // 检查任务状态，只有已发布或发布成功的任务可以被查看（除非是任务创建者或管理员）
        if (!Objects.equals(task.getUserId(), currentUserId)) {
            if (task.getStatus() != UserFileTaskStatusEnum.PUBLISHED.getValue() && 
                task.getStatus() != UserFileTaskStatusEnum.SUCCESS.getValue()) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "该文件任务暂未公开");
            }
            
            // 增加查看次数
            userFileTaskRepository.incrementViewCount(taskId);
        }
        
        return convertToDTO(task, currentUserId);
    }
    
    /**
     * 获取我的文件任务列表
     */
    public Page<UserFileTaskDTO> getMyUserFileTasks(Long userId, Pageable pageable) {
        Page<UserFileTask> taskPage = userFileTaskRepository.findByUserId(userId, pageable);
        List<UserFileTaskDTO> dtoList = taskPage.getContent().stream()
                .map(task -> convertToDTO(task, userId))
                .collect(Collectors.toList());
        
        return new PageImpl<>(dtoList, pageable, taskPage.getTotalElements());
    }
    
    /**
     * 获取公开的文件任务列表（已发布和发布成功的）
     */
    public Page<UserFileTaskDTO> getPublicUserFileTasks(Pageable pageable, Long currentUserId) {
        // 使用数据库层面的 IN 条件，一次性查询多种状态
        List<Byte> publicStatuses = Arrays.asList(
            UserFileTaskStatusEnum.PUBLISHED.getValue(), 
            UserFileTaskStatusEnum.SUCCESS.getValue()
        );
        
        Page<UserFileTask> taskPage = userFileTaskRepository.findByStatusIn(publicStatuses, pageable);
        
        List<UserFileTaskDTO> dtoList = taskPage.getContent().stream()
                .map(task -> convertToDTO(task, currentUserId))
                .collect(Collectors.toList());
        
        return new PageImpl<>(dtoList, pageable, taskPage.getTotalElements());
    }
    
    /**
     * 获取免费的文件任务列表
     */
    public Page<UserFileTaskDTO> getFreeUserFileTasks(Pageable pageable, Long currentUserId) {
        // 获取已发布和发布成功的免费任务
        byte publishedStatus = UserFileTaskStatusEnum.PUBLISHED.getValue();
        byte isFree = 1;
        
        Page<UserFileTask> taskPage = userFileTaskRepository.findByStatusAndIsFree(publishedStatus, isFree, pageable);
        
        List<UserFileTaskDTO> dtoList = taskPage.getContent().stream()
                .map(task -> convertToDTO(task, currentUserId))
                .collect(Collectors.toList());
        
        return new PageImpl<>(dtoList, pageable, taskPage.getTotalElements());
    }
    
    /**
     * 搜索文件任务
     */
    public Page<UserFileTaskDTO> searchUserFileTasks(String keyword, Pageable pageable, Long currentUserId) {
        List<Byte> statuses = Arrays.asList(
            UserFileTaskStatusEnum.PUBLISHED.getValue(), 
            UserFileTaskStatusEnum.SUCCESS.getValue()
        );

        Page<UserFileTask> taskPage = userFileTaskRepository.searchByKeywordAndStatusIn(keyword, statuses, pageable);
        
        List<UserFileTaskDTO> dtoList = taskPage.getContent().stream()
                .map(task -> convertToDTO(task, currentUserId))
                .collect(Collectors.toList());
        
        return new PageImpl<>(dtoList, pageable, taskPage.getTotalElements());
    }
    
    /**
     * 获取所有待审核的文件任务
     */
    public Page<UserFileTaskDTO> getPendingReviewTasks(Pageable pageable, Long currentUserId) {
        byte reviewingStatus = UserFileTaskStatusEnum.REVIEWING.getValue();
        Page<UserFileTask> taskPage = userFileTaskRepository.findByStatus(reviewingStatus, pageable);
        
        List<UserFileTaskDTO> dtoList = taskPage.getContent().stream()
                .map(task -> convertToDTO(task, currentUserId))
                .collect(Collectors.toList());
        
        return new PageImpl<>(dtoList, pageable, taskPage.getTotalElements());
    }
    
    /**
     * 审核文件任务
     */
    @Transactional
    public UserFileTaskDTO reviewUserFileTask(FileReviewDTO reviewDTO, Long adminId) {
        UserFileTask task = userFileTaskRepository.findById(reviewDTO.getTaskId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "文件任务不存在"));
        
        // 检查任务状态
        if (task.getStatus() != UserFileTaskStatusEnum.REVIEWING.getValue()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "该文件任务不处于审核中状态");
        }
        
        // 更新任务状态
        task.setStatus(reviewDTO.getStatus());
        UserFileTask updatedTask = userFileTaskRepository.save(task);
        
        // 记录审核历史
        FileReviewHistory reviewHistory = new FileReviewHistory();
        reviewHistory.setFileUploadId(task.getId());
        reviewHistory.setReviewerId(adminId);
        reviewHistory.setComment(reviewDTO.getComment());
        fileReviewHistoryRepository.save(reviewHistory);
        
        log.info("管理员 {} 审核了文件任务 {}, 状态: {}", adminId, task.getId(), 
                UserFileTaskStatusEnum.fromValue(reviewDTO.getStatus()).getDescription());
        
        return convertToDTO(updatedTask, null);
    }
    
    /**
     * 下载文件任务
     */
    @Transactional
    public FileInfoDTO downloadUserFileTask(Long taskId, Long userId) {
        UserFileTask task = userFileTaskRepository.findById(taskId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "文件任务不存在"));
        
        // 检查任务状态
        if (task.getStatus() != UserFileTaskStatusEnum.PUBLISHED.getValue() && 
            task.getStatus() != UserFileTaskStatusEnum.SUCCESS.getValue()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "该文件任务暂未公开");
        }
        
        // 如果是付费文件，检查用户积分是否足够
        if (task.getIsFree() == 0) {
            // 如果不是文件上传者本人，需要扣除积分
            if (!Objects.equals(task.getUserId(), userId)) {
                UserPoints userPoints = pointsService.getUserPointsEntity(userId);
                if (userPoints.getPoints() < task.getRequiredPoints()) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "积分不足，无法下载此文件");
                }
                
                // 扣除下载者积分
                pointsService.changePoints(userId, -task.getRequiredPoints(), 
                        PointActionEnum.DOWNLOAD_FILE, "下载用户文件: " + task.getTitle());
                
                // 增加上传者积分
                pointsService.changePoints(task.getUserId(), task.getRequiredPoints(), 
                        PointActionEnum.FILE_DOWNLOAD_INCOME, "文件被下载收益: " + task.getTitle());
                
                log.info("用户 {} 下载付费文件 {}, 消耗 {} 积分", userId, taskId, task.getRequiredPoints());
            }
        }
        
        // 增加下载次数
        userFileTaskRepository.incrementDownloadCount(taskId);
        
        // 获取文件信息
        return fileService.getFileInfo(task.getFileId(), userId, false);
    }
    
    /**
     * 更新文件任务
     */
    @Transactional
    public UserFileTaskDTO updateUserFileTask(Long taskId, CreateUserFileTaskDTO updateDTO, Long userId) {
        UserFileTask task = userFileTaskRepository.findById(taskId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "文件任务不存在"));
        
        // 检查是否是任务创建者
        if (!Objects.equals(task.getUserId(), userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "您无权修改此文件任务");
        }
        
        // 检查任务状态，只有审核中或已驳回的任务可以修改
        if (task.getStatus() != UserFileTaskStatusEnum.REVIEWING.getValue() && 
            task.getStatus() != UserFileTaskStatusEnum.REJECTED.getValue()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "当前状态的任务无法修改");
        }
        
        // 如果更换了文件，检查新文件是否属于用户
        if (!Objects.equals(task.getFileId(), updateDTO.getFileId())) {
            // 获取新文件信息
            FileInfoDTO fileInfo = fileService.getFileInfo(updateDTO.getFileId());
            
            // 从user_upload_file表中获取文件的上传者ID
            UserUploadFile userUploadFile = getUserUploadFileByFileId(updateDTO.getFileId());
            
            if (!Objects.equals(userUploadFile.getUserId(), userId)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "您无权使用此文件");
            }
        }
        
        // 更新任务信息
        task.setTitle(updateDTO.getTitle());
        task.setDescription(updateDTO.getDescription());
        task.setFileId(updateDTO.getFileId());
        task.setIsFree(updateDTO.getIsFree() ? UserFileTaskFreeEnum.FREE.getValue() : UserFileTaskFreeEnum.PAID.getValue());
        task.setRequiredPoints(updateDTO.getIsFree() ? 0 : updateDTO.getRequiredPoints());
        // 如果是已驳回的任务，更新后状态改为审核中
        if (task.getStatus() == UserFileTaskStatusEnum.REJECTED.getValue()) {
            task.setStatus(UserFileTaskStatusEnum.REVIEWING.getValue());
        }
        
        UserFileTask updatedTask = userFileTaskRepository.save(task);
        log.info("用户 {} 更新了文件任务: {}", userId, updatedTask.getId());
        
        return convertToDTO(updatedTask, userId);
    }
    
    /**
     * 删除文件任务
     */
    @Transactional
    public boolean deleteUserFileTask(Long taskId, Long userId) {
        UserFileTask task = userFileTaskRepository.findById(taskId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "文件任务不存在"));
        
        // 检查是否是任务创建者
        if (!Objects.equals(task.getUserId(), userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "您无权删除此文件任务");
        }
        
        // 检查任务状态，已发布和发布成功的任务不能轻易删除
        if (task.getStatus() == UserFileTaskStatusEnum.PUBLISHED.getValue() || 
            task.getStatus() == UserFileTaskStatusEnum.SUCCESS.getValue()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "已发布的任务无法直接删除，请联系管理员");
        }
        
        userFileTaskRepository.delete(task);
        log.info("用户 {} 删除了文件任务: {}", userId, taskId);
        
        return true;
    }
    
    /**
     * 从UserUploadFile表中获取文件信息
     * 如果找不到对应的记录，抛出异常
     */
    private UserUploadFile getUserUploadFileByFileId(Long fileId) {
        return userUploadFileRepository.findByFileId(fileId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "找不到文件ID为 " + fileId + " 的上传记录"));
    }

    /**
     * 检查文件是否属于指定用户
     */
    private boolean isFileOwnedByUser(Long fileId, Long userId) {
        Optional<UserUploadFile> uploadFileOpt = userUploadFileRepository.findByFileId(fileId);
        return uploadFileOpt.filter(userUploadFile -> Objects.equals(userUploadFile.getUserId(), userId)).isPresent();
    }
    
    /**
     * 将任务实体转换为DTO
     */
    private UserFileTaskDTO convertToDTO(UserFileTask task, Long currentUserId) {
        User user = userRepository.findById(task.getUserId()).orElse(null);
        String username = user != null ? user.getUsername() : "未知用户";
        
        // 获取用户头像
        String avatar = null;
        try {
            var profile = userProfileService.getUserProfile(task.getUserId());
            avatar = profile.getAvatar();
        } catch (Exception e) {
            log.debug("获取用户头像失败: {}", e.getMessage());
        }
        
        // 获取文件信息
        FileInfoDTO fileInfo = null;
        try {
            // 直接获取文件信息
            fileInfo = fileService.getFileInfo(task.getFileId());
            
            // 判断当前用户是否有访问权限
            boolean hasAccess = false;
            
            // 如果是任务创建者，有权限
            if (Objects.equals(task.getUserId(), currentUserId)) {
                hasAccess = true;
            } 
            // 如果是文件上传者，有权限
            else if (isFileOwnedByUser(task.getFileId(), currentUserId)) {
                hasAccess = true;
            }
            
            // 更新fileInfo的hasAccess字段
            if (fileInfo != null && hasAccess) {
                fileInfo.setHasAccess(true);
            }
        } catch (Exception e) {
            log.error("获取文件信息失败", e);
        }
        
        boolean isMine = currentUserId != null && Objects.equals(task.getUserId(), currentUserId);
        boolean hasAccess = isMine || task.getIsFree() == 1 || 
                (fileInfo != null && fileInfo.isHasAccess());
        
        return UserFileTaskDTO.builder()
                .id(task.getId())
                .userId(task.getUserId())
                .username(username)
                .avatar(avatar)
                .title(task.getTitle())
                .description(task.getDescription())
                .fileId(task.getFileId())
                .fileInfo(fileInfo)
                .isFree(task.getIsFree() == 1)
                .requiredPoints(task.getRequiredPoints())
                .status(task.getStatus())
                .statusText(UserFileTaskStatusEnum.fromValue(task.getStatus()).getDescription())
                .downloadCount(task.getDownloadCount())
                .viewCount(task.getViewCount())
                .createdAt(task.getCreatedAt())
                .updatedAt(task.getUpdatedAt())
                .isMine(isMine)
                .hasAccess(hasAccess)
                .build();
    }
    
    /**
     * 按状态获取任务（管理员专用）
     */
    public Page<UserFileTaskDTO> getTasksByStatus(Byte status, Pageable pageable, Long adminId) {
        Page<UserFileTask> taskPage = userFileTaskRepository.findByStatus(status, pageable);
        
        List<UserFileTaskDTO> dtoList = taskPage.getContent().stream()
                .map(task -> convertToDTO(task, null))
                .collect(Collectors.toList());
        
        return new PageImpl<>(dtoList, pageable, taskPage.getTotalElements());
    }
    
    /**
     * 获取所有任务（管理员专用）
     */
    public Page<UserFileTaskDTO> getAllTasks(Pageable pageable, Long adminId) {
        Page<UserFileTask> taskPage = userFileTaskRepository.findAll(pageable);
        
        List<UserFileTaskDTO> dtoList = taskPage.getContent().stream()
                .map(task -> convertToDTO(task, null))
                .collect(Collectors.toList());
        
        return new PageImpl<>(dtoList, pageable, taskPage.getTotalElements());
    }
    
    /**
     * 管理员查看任务详情
     */
    public UserFileTaskDTO getTaskDetailForAdmin(Long taskId, Long adminId) {
        UserFileTask task = userFileTaskRepository.findById(taskId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "文件任务不存在"));
        
        return convertToDTO(task, null);
    }
    
    /**
     * 管理员强制删除任务
     */
    @Transactional
    public boolean forceDeleteTask(Long taskId, Long adminId) {
        UserFileTask task = userFileTaskRepository.findById(taskId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "文件任务不存在"));
        
        // 记录操作日志
        FileReviewHistory reviewHistory = new FileReviewHistory();
        reviewHistory.setFileUploadId(taskId);
        reviewHistory.setReviewerId(adminId);
        reviewHistory.setComment("管理员强制删除文件任务");
        fileReviewHistoryRepository.save(reviewHistory);
        
        userFileTaskRepository.delete(task);
        log.info("管理员 {} 强制删除了文件任务: {}", adminId, taskId);
        
        return true;
    }

    /**
     * 通用查询文件任务方法
     */
    public Page<UserFileTaskDTO> queryUserFileTasks(
            UserUploadFileQueryDTO queryDTO,
            Pageable pageable, 
            Long currentUserId) {
        Integer isFree = null;
        if (queryDTO.getIsFree() != null) {
            isFree = queryDTO.getIsFree()
                ? UserFileTaskFreeEnum.FREE.getValue()
                : UserFileTaskFreeEnum.PAID.getValue();
        }

        // 将状态名称转换为状态值
        List<Byte> statuses = null;
        if (queryDTO.getStatus() != null && !queryDTO.getStatus().isEmpty()) {
            statuses = queryDTO.getStatus().stream()
                .map(value -> {
                    try {
                        return UserFileTaskStatusEnum.fromValue(value).getValue();
                    } catch (IllegalArgumentException e) {
                        log.warn("无效的状态: {}", value);
                        return null;
                    }
                })
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
        } else if (!Objects.equals(queryDTO.getUserId(), currentUserId)) {
            statuses = Arrays.asList(
                    UserFileTaskStatusEnum.PUBLISHED.getValue(),
                    UserFileTaskStatusEnum.SUCCESS.getValue()
            );
        }
        
        Page<UserFileTask> taskPage = userFileTaskRepository.findWithFilters(
            queryDTO.getUserId(),
            isFree,
            queryDTO.getKeyword(), 
            statuses,
            pageable
        );
        
        List<UserFileTaskDTO> dtoList = taskPage.getContent().stream()
            .map(task -> convertToDTO(task, currentUserId))
            .collect(Collectors.toList());
        
        return new PageImpl<>(dtoList, pageable, taskPage.getTotalElements());
    }

    /**
     * 管理员下载文件（不受状态限制）
     */
    public Object adminDownloadFile(Long taskId, Long adminId) {
        // 查找任务
        UserFileTask task = userFileTaskRepository.findById(taskId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "文件任务不存在"));
        
        // 获取文件信息，管理员权限不受状态限制
        Long fileId = task.getFileId();
        
        // 调用文件服务获取文件信息，管理员不受权限限制
        return fileService.getFileInfo(fileId);
    }

    /**
     * 获取最新发布的资源列表
     */
    public List<UserFileTaskDTO> getLatestResources(int limit, Long currentUserId) {
        // 获取已发布和发布成功的任务
        byte publishedStatus = UserFileTaskStatusEnum.PUBLISHED.getValue();
        byte successStatus = UserFileTaskStatusEnum.SUCCESS.getValue();
        
        List<Byte> statuses = Arrays.asList(publishedStatus, successStatus);
        
        PageRequest pageRequest = PageRequest.of(0, limit, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<UserFileTask> tasks = userFileTaskRepository.findByStatusIn(statuses, pageRequest);
        
        return tasks.getContent().stream()
                .map(task -> convertToDTO(task, currentUserId))
                .collect(Collectors.toList());
    }

    /**
     * 获取热门资源列表（按下载量排序）
     */
    public List<UserFileTaskDTO> getHotResources(int limit, Long currentUserId) {
        // 获取已发布和发布成功的任务
        byte publishedStatus = UserFileTaskStatusEnum.PUBLISHED.getValue();
        byte successStatus = UserFileTaskStatusEnum.SUCCESS.getValue();
        
        List<Byte> statuses = Arrays.asList(publishedStatus, successStatus);
        
        PageRequest pageRequest = PageRequest.of(0, limit, Sort.by(Sort.Direction.DESC, "downloadCount"));
        Page<UserFileTask> tasks = userFileTaskRepository.findByStatusIn(statuses, pageRequest);
        
        return tasks.getContent().stream()
                .map(task -> convertToDTO(task, currentUserId))
                .collect(Collectors.toList());
    }
}