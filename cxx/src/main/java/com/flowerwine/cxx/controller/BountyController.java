package com.flowerwine.cxx.controller;

import com.flowerwine.cxx.annotation.CurrentUser;
import com.flowerwine.cxx.dto.CreateBountyDTO;
import com.flowerwine.cxx.dto.FileBountyDTO;
import com.flowerwine.cxx.dto.FileBidDTO;
import com.flowerwine.cxx.dto.FileInfoDTO;
import com.flowerwine.cxx.dto.UserUploadFileDTO;
import com.flowerwine.cxx.security.AuthUser;
import com.flowerwine.cxx.service.BountyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/bounty")
@RequiredArgsConstructor
public class BountyController {

    private final BountyService bountyService;

    /**
     * 发布悬赏
     */
    @PostMapping("/publish")
    public ResponseEntity<?> publishBounty(
            @RequestBody @Valid CreateBountyDTO request,
            @CurrentUser AuthUser authUser) {
        
        FileBountyDTO bounty = bountyService.publishBounty(
            request.getTitle(),
            request.getDescription(),
            request.getPoints(),
            authUser.getId()
        );
        return ResponseEntity.ok(bounty);
    }
    
    /**
     * 获取悬赏详情
     */
    @GetMapping("/{bountyId}")
    public ResponseEntity<FileBountyDTO> getBountyDetail(
            @PathVariable Long bountyId,
            @CurrentUser AuthUser authUser) {
        
        FileBountyDTO bounty = bountyService.getBountyDetail(bountyId, authUser.getId());
        return ResponseEntity.ok(bounty);
    }
    
    /**
     * 获取悬赏列表
     */
    @GetMapping("/list")
    public ResponseEntity<Page<FileBountyDTO>> getBountyList(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @CurrentUser AuthUser authUser) {
        
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<FileBountyDTO> bountyPage = bountyService.getBountyList(pageable, authUser.getId());
        return ResponseEntity.ok(bountyPage);
    }
    
    /**
     * 获取我发布的悬赏列表
     */
    @GetMapping("/bounty")
    public ResponseEntity<Page<FileBountyDTO>> getMyBountyList(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @CurrentUser AuthUser authUser) {
        
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<FileBountyDTO> bountyPage = bountyService.getMyBountyList(authUser.getId(), pageable);
        return ResponseEntity.ok(bountyPage);
    }
    
    /**
     * 关闭悬赏
     */
    @PostMapping("/{bountyId}/close")
    public ResponseEntity<Boolean> closeBounty(
            @PathVariable Long bountyId,
            @CurrentUser AuthUser authUser) {
        
        boolean success = bountyService.closeBounty(bountyId, authUser.getId());
        return ResponseEntity.ok(success);
    }
    
    /**
     * 参与竞标
     */
    @PostMapping("/{bountyId}/bid")
    public ResponseEntity<FileBidDTO> createBid(
            @PathVariable Long bountyId,
            @CurrentUser AuthUser authUser) {
        
        FileBidDTO bid = bountyService.createBid(bountyId, authUser.getId());
        return ResponseEntity.ok(bid);
    }
    
    /**
     * 更新竞标文件
     */
    @PostMapping("/bid/{bidId}/file")
    public ResponseEntity<FileBidDTO> updateBidFile(
            @PathVariable Long bidId,
            @RequestParam Long fileId,
            @CurrentUser AuthUser authUser) {
        
        FileBidDTO bid = bountyService.updateBidFile(bidId, fileId, authUser.getId());
        return ResponseEntity.ok(bid);
    }
    
    /**
     * 获取悬赏竞标列表
     */
    @GetMapping("/{bountyId}/bids")
    public ResponseEntity<Page<FileBidDTO>> getBidList(
            @PathVariable Long bountyId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @CurrentUser AuthUser authUser) {
        
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<FileBidDTO> bidPage = bountyService.getBidList(bountyId, pageable, authUser.getId());
        return ResponseEntity.ok(bidPage);
    }
    
    /**
     * 获取我参与的竞标列表
     */
    @GetMapping("/bids")
    public ResponseEntity<Page<FileBidDTO>> getMyBidList(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @CurrentUser AuthUser authUser) {
        
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<FileBidDTO> bidPage = bountyService.getMyBidList(authUser.getId(), pageable);
        return ResponseEntity.ok(bidPage);
    }
    
    /**
     * 下载竞标文件
     */
    @GetMapping("/bid/{bidId}/file")
    public ResponseEntity<FileInfoDTO> downloadBidFile(
            @PathVariable Long bidId,
            @CurrentUser AuthUser authUser) {
        
        FileInfoDTO fileInfo = bountyService.downloadBidFile(bidId, authUser.getId());
        return ResponseEntity.ok(fileInfo);
    }
    
    /**
     * 选择竞标胜利者
     */
    @PostMapping("/{bountyId}/winner/{bidId}")
    public ResponseEntity<Boolean> selectWinner(
            @PathVariable Long bountyId,
            @PathVariable Long bidId,
            @CurrentUser AuthUser authUser) {
        
        boolean success = bountyService.selectWinner(bountyId, bidId, authUser.getId());
        return ResponseEntity.ok(success);
    }
    
    /**
     * 取消竞标
     */
    @DeleteMapping("/bid/{bidId}")
    public ResponseEntity<Boolean> cancelBid(
            @PathVariable Long bidId,
            @CurrentUser AuthUser authUser) {
        
        boolean success = bountyService.cancelBid(bidId, authUser.getId());
        return ResponseEntity.ok(success);
    }
    
    /**
     * 重新开启悬赏
     */
    @PostMapping("/{bountyId}/reopen")
    public ResponseEntity<Boolean> reopenBounty(
            @PathVariable Long bountyId,
            @CurrentUser AuthUser authUser) {
        
        boolean success = bountyService.reopenBounty(bountyId, authUser.getId());
        return ResponseEntity.ok(success);
    }

    /**
     * 获取最新的进行中悬赏（用于首页轮播）
     */
    @GetMapping("/latest")
    public ResponseEntity<List<FileBountyDTO>> getLatestBounties(@CurrentUser AuthUser authUser) {
        List<FileBountyDTO> bounties = bountyService.getLatestBounties(authUser.getId());
        return ResponseEntity.ok(bounties);
    }

    /**
     * 获取热门悬赏
     */
    @GetMapping("/hot")
    public ResponseEntity<List<FileBountyDTO>> getHotBounties(@CurrentUser AuthUser authUser) {
        List<FileBountyDTO> bounties = bountyService.getHotBounties(authUser.getId());
        return ResponseEntity.ok(bounties);
    }

    /**
     * 搜索悬赏
     */
    @GetMapping("/search")
    public ResponseEntity<List<FileBountyDTO>> searchBounties(
            @RequestParam String keyword,
            @CurrentUser AuthUser authUser
    ) {
        List<FileBountyDTO> bounties = bountyService.searchBounties(keyword, authUser.getId());
        return ResponseEntity.ok(bounties);
    }
}