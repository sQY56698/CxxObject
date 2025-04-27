package com.flowerwine.cxx.service;

import com.flowerwine.cxx.dto.*;
import com.flowerwine.cxx.entity.*;
import com.flowerwine.cxx.enums.BountyStatusEnum;
import com.flowerwine.cxx.enums.PointActionEnum;
import com.flowerwine.cxx.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class BountyService {

    private final FileBountyRepository fileBountyRepository;
    private final FileBidRepository fileBidRepository;
    private final BountyDownloadRecordRepository bountyDownloadRecordRepository;
    private final UserUploadFileRepository userUploadFileRepository;
    private final FileDownloadRecordRepository fileDownloadRecordRepository;
    private final UserService userService;
    private final PointsService pointsService;
    private final FileService fileService;
    private final UserProfileService userProfileService;
    
    /**
     * 发布文件悬赏
     */
    @Transactional
    public FileBountyDTO publishBounty(String title, String description, Integer points, Long userId) {
        log.debug("用户 {} 发布悬赏, 标题: {}, 积分: {}", userId, title, points);
        
        // 检查用户积分是否足够
        UserPoints userPoints = pointsService.getUserPointsEntity(userId);
        if (userPoints.getPoints() < points) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "积分不足，无法发布悬赏");
        }
        
        // 创建悬赏
        FileBounty bounty = new FileBounty();
        bounty.setTitle(title);
        bounty.setDescription(description);
        bounty.setPoints(points);
        bounty.setUserId(userId);
        bounty.setStatus(BountyStatusEnum.IN_PROGRESS.getValue());
        bounty.setViewCount(0);
        
        FileBounty savedBounty = fileBountyRepository.save(bounty);
        
        // 扣除用户积分
        pointsService.changePoints(userId, -points, PointActionEnum.POST_BOUNTY, "发布悬赏: " + title);
        
        return convertToDTO(savedBounty, userId);
    }
    
    /**
     * 获取悬赏详情
     */
    @Transactional
    public FileBountyDTO getBountyDetail(Long bountyId, Long currentUserId) {
        FileBounty bounty = fileBountyRepository.findById(bountyId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "悬赏不存在"));
        
        // 如果不是悬赏发布者，则增加查看次数
        if (!Objects.equals(bounty.getUserId(), currentUserId)) {
            bounty.setViewCount(bounty.getViewCount() + 1);
            fileBountyRepository.save(bounty);
        }
        
        return convertToDTO(bounty, currentUserId);
    }
    
    /**
     * 获取悬赏列表
     */
    public Page<FileBountyDTO> getBountyList(Pageable pageable, Long currentUserId) {
        Page<FileBounty> bountyPage = fileBountyRepository.findAll(pageable);
        List<FileBountyDTO> dtoList = bountyPage.getContent().stream()
                .map(bounty -> convertToDTO(bounty, currentUserId))
                .collect(Collectors.toList());
        
        return new PageImpl<>(dtoList, pageable, bountyPage.getTotalElements());
    }
    
    /**
     * 获取我发布的悬赏列表
     */
    public Page<FileBountyDTO> getMyBountyList(Long userId, Pageable pageable) {
        Page<FileBounty> bountyPage = fileBountyRepository.findByUserId(userId, pageable);
        List<FileBountyDTO> dtoList = bountyPage.getContent().stream()
                .map(bounty -> convertToDTO(bounty, userId))
                .collect(Collectors.toList());
        
        return new PageImpl<>(dtoList, pageable, bountyPage.getTotalElements());
    }
    
    /**
     * 关闭悬赏
     */
    @Transactional
    public boolean closeBounty(Long bountyId, Long userId) {
        FileBounty bounty = fileBountyRepository.findById(bountyId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "悬赏不存在"));
        
        // 检查是否是悬赏发布者
        if (!Objects.equals(bounty.getUserId(), userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "只有悬赏发布者可以关闭悬赏");
        }
        
        // 检查悬赏状态
        if (bounty.getStatus() != BountyStatusEnum.IN_PROGRESS.getValue()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "只能关闭进行中的悬赏");
        }
        
        // 统计竞标信息和下载记录
        List<FileBid> bids = fileBidRepository.findByBountyId(bountyId);
        int bidCount = bids.size();
        List<BountyDownloadRecord> downloadRecords = bountyDownloadRecordRepository.findByBountyIdAndUserId(bountyId, userId);
        int refundPoints = getRefundPoints(downloadRecords, bounty, bidCount);

        // 更新悬赏状态
        bounty.setStatus(BountyStatusEnum.CLOSED.getValue());
        bounty.setEndAt(LocalDateTime.now());
        fileBountyRepository.save(bounty);
        
        // 返还积分
        if (refundPoints > 0) {
            pointsService.changePoints(userId, refundPoints, PointActionEnum.CLOSE_BOUNTY,
                    "关闭悬赏返还: " + bounty.getTitle());
        }
        
        log.debug("用户 {} 关闭悬赏 {}, 返还积分 {}", userId, bountyId, refundPoints);
        return true;
    }

    private static int getRefundPoints(List<BountyDownloadRecord> downloadRecords, FileBounty bounty, int bidCount) {
        int downloadCount = downloadRecords.size();

        // 计算需要返还的积分
        int refundPoints;
        int originalPoints = bounty.getPoints();

        if (bidCount == 0) {
            // 无人竞标，扣除100积分
            refundPoints = Math.max(0, originalPoints - 100);
        } else if (downloadCount == 0) {
            // 有竞标但未下载，扣除10%
            refundPoints = (int) (originalPoints * 0.9);
        } else {
            // 有竞标且有下载，基础扣除30%，每次下载增加10%，最高80%
            int deductionRate = Math.min(80, 30 + downloadCount * 10);
            refundPoints = (int) (originalPoints * (1 - deductionRate / 100.0));
        }
        return refundPoints;
    }

    /**
     * 参与竞标
     */
    @Transactional
    public FileBidDTO createBid(Long bountyId, Long userId) {
        FileBounty bounty = fileBountyRepository.findById(bountyId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "悬赏不存在"));
        
        // 检查悬赏状态
        if (bounty.getStatus() != BountyStatusEnum.IN_PROGRESS.getValue()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "悬赏已结束，无法参与竞标");
        }
        
        // 检查是否是自己发布的悬赏
        if (Objects.equals(bounty.getUserId(), userId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "不能参与自己发布的悬赏");
        }
        
        // 检查是否已经参与过竞标
        if (fileBidRepository.existsByUserIdAndBountyId(userId, bountyId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "已参与过该悬赏的竞标");
        }
        
        // 创建竞标
        FileBid bid = new FileBid();
        bid.setBountyId(bountyId);
        bid.setUserId(userId);
        
        FileBid savedBid = fileBidRepository.save(bid);
        log.debug("用户 {} 参与悬赏 {} 的竞标", userId, bountyId);
        
        return convertToBidDTO(savedBid, userId);
    }
    
    /**
     * 更新竞标文件，允许覆盖已有文件
     */
    @Transactional
    public FileBidDTO updateBidFile(Long bidId, Long fileId, Long userId) {
        FileBid bid = fileBidRepository.findById(bidId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "竞标不存在"));
        
        // 检查是否是竞标者
        if (!Objects.equals(bid.getUserId(), userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "只有竞标者可以更新文件");
        }
        
        // 检查悬赏状态
        FileBounty bounty = fileBountyRepository.findById(bid.getBountyId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "悬赏不存在"));
        
        if (bounty.getStatus() != BountyStatusEnum.IN_PROGRESS.getValue()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "悬赏已结束，无法更新文件");
        }
        
        // 如果已有文件，记录旧文件ID用于可能的清理
        Long oldFileId = bid.getFileId();
        
        // 更新竞标文件ID
        bid.setFileId(fileId);
        fileBidRepository.save(bid);
        
        log.info("用户 {} 为竞标 {} 更新文件 {} (替换旧文件 {})", userId, bidId, fileId, oldFileId);
        return convertToBidDTO(bid, userId);
    }
    
    /**
     * 获取悬赏的竞标列表
     */
    public Page<FileBidDTO> getBidList(Long bountyId, Pageable pageable, Long currentUserId) {
        // 检查悬赏是否存在
        FileBounty bounty = fileBountyRepository.findById(bountyId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "悬赏不存在"));
        
        // 获取竞标列表
        Page<FileBid> bidPage = fileBidRepository.findByBountyId(bounty.getId(), pageable);
        List<FileBidDTO> dtoList = bidPage.getContent().stream()
                .map(bid -> convertToBidDTO(bid, currentUserId))
                .collect(Collectors.toList());
        
        return new PageImpl<>(dtoList, pageable, bidPage.getTotalElements());
    }
    
    /**
     * 获取我参与的竞标列表
     */
    public Page<FileBidDTO> getMyBidList(Long userId, Pageable pageable) {
        Page<FileBid> bidPage = fileBidRepository.findByUserId(userId, pageable);
        List<FileBidDTO> dtoList = bidPage.getContent().stream()
                .map(bid -> convertToBidDTO(bid, userId))
                .collect(Collectors.toList());
        
        return new PageImpl<>(dtoList, pageable, bidPage.getTotalElements());
    }
    
    /**
     * 下载竞标文件
     */
    @Transactional
    public FileInfoDTO downloadBidFile(Long bidId, Long userId) {
        FileBid bid = fileBidRepository.findById(bidId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "竞标不存在"));
        
        if (bid.getFileId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "该竞标尚未上传文件");
        }
        
        FileBounty bounty = fileBountyRepository.findById(bid.getBountyId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "悬赏不存在"));
        
        // 检查权限：文件上传者(竞标者)或悬赏发布者可以下载
        boolean isBountyPublisher = Objects.equals(bounty.getUserId(), userId);
        boolean isBidOwner = Objects.equals(bid.getUserId(), userId);
        
        if (!isBountyPublisher && !isBidOwner) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "您没有权限下载此文件");
        }
        
        // 记录下载
        BountyDownloadRecord record = new BountyDownloadRecord();
        record.setBountyId(bid.getBountyId());
        record.setUserId(userId);
        record.setFileId(bid.getFileId());
        bountyDownloadRecordRepository.save(record);
        
        log.info("用户 {} 下载竞标 {} 的文件", userId, bidId);
        
        // 获取文件信息（包含权限检查）
        return fileService.getFileInfo(bid.getFileId(), userId, true);
    }
    
    /**
     * 选择竞标胜利者
     */
    @Transactional
    public boolean selectWinner(Long bountyId, Long bidId, Long userId) {
        FileBounty bounty = fileBountyRepository.findById(bountyId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "悬赏不存在"));
        
        // 检查是否是悬赏发布者
        if (!Objects.equals(bounty.getUserId(), userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "只有悬赏发布者可以选择胜利者");
        }
        
        // 检查悬赏状态
        if (bounty.getStatus() != BountyStatusEnum.IN_PROGRESS.getValue()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "悬赏已结束，无法选择胜利者");
        }
        
        FileBid bid = fileBidRepository.findById(bidId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "竞标不存在"));
        
        // 检查竞标是否属于该悬赏
        if (!Objects.equals(bid.getBountyId(), bountyId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "竞标不属于该悬赏");
        }
        
        // 检查竞标是否已上传文件
        if (bid.getFileId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "该竞标尚未上传文件");
        }
        
        // 更新悬赏状态
        bounty.setStatus(BountyStatusEnum.COMPLETED.getValue());
        bounty.setWinnerId(bid.getUserId());
        bounty.setEndAt(LocalDateTime.now());
        fileBountyRepository.save(bounty);
        
        // 奖励积分给胜利者
        pointsService.changePoints(bid.getUserId(), bounty.getPoints(), PointActionEnum.COMPLETE_BOUNTY,
                "赢得悬赏: " + bounty.getTitle());
        
        log.info("用户 {} 选择竞标 {} 为悬赏 {} 的胜利者", userId, bidId, bountyId);
        return true;
    }
    
    /**
     * 上传文件供下载
     */
    @Transactional
    public UserUploadFileDTO uploadFile(MultipartFile file, Long userId) throws IOException {
        // 上传文件
        FileInfoDTO fileInfoDTO = fileService.uploadFile(file, "upload");
        
        // 创建用户上传文件记录
        UserUploadFile userFile = new UserUploadFile();
        userFile.setUserId(userId);

        UserUploadFile savedFile = userUploadFileRepository.save(userFile);
        
        // 奖励积分
        pointsService.changePoints(userId, 0,
                PointActionEnum.UPLOAD_FILE, "上传文件");
        
        return convertToUserFileDTO(savedFile, userId);
    }
    
    /**
     * 取消竞标
     */
    @Transactional
    public boolean cancelBid(Long bidId, Long userId) {
        FileBid bid = fileBidRepository.findById(bidId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "竞标不存在"));
        
        // 检查是否是竞标者本人
        if (!Objects.equals(bid.getUserId(), userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "只有竞标者本人可以取消竞标");
        }
        
        // 检查悬赏状态
        FileBounty bounty = fileBountyRepository.findById(bid.getBountyId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "悬赏不存在"));
        
        if (bounty.getStatus() != BountyStatusEnum.IN_PROGRESS.getValue()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "悬赏已结束，无法取消竞标");
        }
        
        // 删除竞标
        fileBidRepository.delete(bid);
        
        log.debug("用户 {} 取消了竞标 {}", userId, bidId);
        return true;
    }
    
    /**
     * 将悬赏实体转换为DTO
     */
    private FileBountyDTO convertToDTO(FileBounty bounty, Long currentUserId) {
        User user = userService.findUserById(bounty.getUserId());
        String username = user != null ? user.getUsername() : "未知用户";
        
        // 获取用户资料，包含头像
        String avatar = null;
        try {
            UserProfileDTO profile = userProfileService.getUserProfile(bounty.getUserId());
            avatar = profile.getAvatar();
        } catch (Exception e) {
            log.debug("获取用户头像失败: {}", e.getMessage());
        }
        
        String winnerName = null;
        String winnerAvatar = null;
        if (bounty.getWinnerId() != null) {
            User winner = userService.findUserById(bounty.getWinnerId());
            winnerName = winner != null ? winner.getUsername() : "未知用户";
            
            // 获取胜利者头像
            try {
                UserProfileDTO winnerProfile = userProfileService.getUserProfile(bounty.getWinnerId());
                winnerAvatar = winnerProfile.getAvatar();
            } catch (Exception e) {
                log.debug("获取胜利者头像失败: {}", e.getMessage());
            }
        }
        
        int bidCount = fileBidRepository.countByBountyId(bounty.getId());
        
        BountyStatusEnum statusEnum = BountyStatusEnum.fromValue(bounty.getStatus());
        
        return FileBountyDTO.builder()
                .id(bounty.getId())
                .title(bounty.getTitle())
                .description(bounty.getDescription())
                .points(bounty.getPoints())
                .userId(bounty.getUserId())
                .username(username)
                .avatar(avatar)  // 添加发布者头像URL
                .status(bounty.getStatus())
                .statusText(statusEnum.getDescription())
                .viewCount(bounty.getViewCount())
                .bidCount(bidCount)
                .createdAt(bounty.getCreatedAt())
                .endAt(bounty.getEndAt())
                .winnerId(bounty.getWinnerId())
                .winnerName(winnerName)
                .winnerAvatar(winnerAvatar)  // 添加胜利者头像URL
                .isMine(Objects.equals(bounty.getUserId(), currentUserId))
                .build();
    }
    
    /**
     * 将竞标实体转换为DTO，优化文件信息
     */
    private FileBidDTO convertToBidDTO(FileBid bid, Long currentUserId) {
        User user = userService.findUserById(bid.getUserId());
        String username = user != null ? user.getUsername() : "未知用户";
        
        // 获取竞标者头像
        String avatar = null;
        try {
            UserProfileDTO profile = userProfileService.getUserProfile(bid.getUserId());
            avatar = profile.getAvatar();
        } catch (Exception e) {
            log.debug("获取竞标者头像失败: {}", e.getMessage());
        }
        
        FileBounty bounty = fileBountyRepository.findById(bid.getBountyId())
                .orElse(null);
        
        boolean isWinner = bounty != null && Objects.equals(bounty.getWinnerId(), bid.getUserId());
        boolean isBountyOwner = bounty != null && Objects.equals(bounty.getUserId(), currentUserId);
        
        FileInfoDTO fileInfo = null;
        if (bid.getFileId() != null) {
            try {
                // 获取文件信息时传入当前用户ID和是否需要权限检查
                // 竞标者可以看到自己的文件，悬赏发布者可以看到所有竞标文件
                boolean hasAccess = isBountyOwner || Objects.equals(bid.getUserId(), currentUserId);
                fileInfo = fileService.getFileInfo(bid.getFileId(), currentUserId, !hasAccess);
            } catch (Exception e) {
                log.error("获取文件信息失败", e);
            }
        }
        
        return FileBidDTO.builder()
                .id(bid.getId())
                .bountyId(bid.getBountyId())
                .userId(bid.getUserId())
                .username(username)
                .avatar(avatar)  // 添加竞标者头像URL
                .fileId(bid.getFileId())
                .fileInfo(fileInfo)
                .isWinner(isWinner)
                .createdAt(bid.getCreatedAt())
                .isMine(Objects.equals(bid.getUserId(), currentUserId))
                .hasFile(bid.getFileId() != null)
                .canAccess(isBountyOwner || Objects.equals(bid.getUserId(), currentUserId))
                .build();
    }
    
    /**
     * 将用户上传文件实体转换为DTO
     */
    private UserUploadFileDTO convertToUserFileDTO(UserUploadFile userFile, Long currentUserId) {
        User user = userService.findUserById(userFile.getUserId());
        String username = user != null ? user.getUsername() : "未知用户";
        
        FileInfoDTO fileInfo = null;
        try {
            fileInfo = fileService.getFileInfo(userFile.getFileId());
        } catch (Exception e) {
            log.error("获取文件信息失败", e);
        }
        
        return UserUploadFileDTO.builder()
                .id(userFile.getId())
                .fileId(userFile.getFileId())
                .userId(userFile.getUserId())
                .username(username)
                .createdAt(userFile.getCreatedAt())
                .fileInfo(fileInfo)
                .isMine(Objects.equals(userFile.getUserId(), currentUserId))
                .build();
    }

    /**
     * 重新开启悬赏
     */
    @Transactional
    public boolean reopenBounty(Long bountyId, Long userId) {
        FileBounty bounty = fileBountyRepository.findById(bountyId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "悬赏不存在"));
        
        // 检查是否是悬赏发布者
        if (!Objects.equals(bounty.getUserId(), userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "只有悬赏发布者可以重新开启悬赏");
        }
        
        // 检查悬赏状态
        if (bounty.getStatus() != BountyStatusEnum.CLOSED.getValue()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "只能重新开启已关闭的悬赏");
        }
        
        // 检查用户积分是否足够
        UserPoints userPoints = pointsService.getUserPointsEntity(userId);
        if (userPoints.getPoints() < bounty.getPoints()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "积分不足，无法重新开启悬赏");
        }
        
        // 更新悬赏状态
        bounty.setStatus(BountyStatusEnum.IN_PROGRESS.getValue());
        bounty.setEndAt(null);
        fileBountyRepository.save(bounty);
        
        // 扣除用户积分
        pointsService.changePoints(userId, -bounty.getPoints(), PointActionEnum.POST_BOUNTY,
                "重新开启悬赏: " + bounty.getTitle());
        
        log.debug("用户 {} 重新开启悬赏 {}", userId, bountyId);
        return true;
    }

    /**
     * 获取最新的进行中悬赏（用于首页轮播）
     */
    public List<FileBountyDTO> getLatestBounties(Long currentUserId) {
        Pageable pageable = PageRequest.of(0, 5, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<FileBounty> bountyPage = fileBountyRepository.findByStatus(
            BountyStatusEnum.IN_PROGRESS.getValue(), 
            pageable
        );
        
        return bountyPage.getContent().stream()
                .map(bounty -> convertToDTO(bounty, currentUserId))
                .collect(Collectors.toList());
    }

    /**
     * 获取热门悬赏（根据浏览量排序）
     */
    public List<FileBountyDTO> getHotBounties(Long currentUserId) {
        // 获取前3个浏览量最高的进行中悬赏
        Pageable pageable = PageRequest.of(0, 4, Sort.by(Sort.Direction.DESC, "viewCount"));
        Page<FileBounty> bountyPage = fileBountyRepository.findByStatus(
            BountyStatusEnum.IN_PROGRESS.getValue(), 
            pageable
        );
        
        return bountyPage.getContent().stream()
                .map(bounty -> convertToDTO(bounty, currentUserId))
                .collect(Collectors.toList());
    }

    /**
     * 搜索悬赏
     */
    public List<FileBountyDTO> searchBounties(String keyword, Long currentUserId) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return List.of();
        }
        
        // 创建分页请求，限制返回前10条结果
        Pageable pageable = PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "createdAt"));
        
        // 在标题和描述中搜索关键词
        Page<FileBounty> bountyPage = fileBountyRepository
            .findByTitleContainingOrDescriptionContaining(
                keyword.trim(), 
                keyword.trim(), 
                pageable
            );
        
        return bountyPage.getContent().stream()
            .map(bounty -> convertToDTO(bounty, currentUserId))
            .collect(Collectors.toList());
    }

    /**
     * 获取排序后的悬赏列表（按时间和浏览量）
     */
    public Page<FileBountyDTO> getSortedBountyList(Pageable pageable, Long currentUserId) {
        // 创建排序条件：先按创建时间排序，再按浏览量排序
        Sort sort = Sort.by(
            Sort.Order.desc("createdAt"),
            Sort.Order.desc("viewCount")
        );
        
        // 使用带排序的分页对象
        Pageable sortedPageable = PageRequest.of(
            pageable.getPageNumber(),
            pageable.getPageSize(),
            sort
        );
        
        Page<FileBounty> bountyPage = fileBountyRepository.findAll(sortedPageable);
        List<FileBountyDTO> dtoList = bountyPage.getContent().stream()
            .map(bounty -> convertToDTO(bounty, currentUserId))
            .collect(Collectors.toList());
        
        return new PageImpl<>(dtoList, sortedPageable, bountyPage.getTotalElements());
    }
}