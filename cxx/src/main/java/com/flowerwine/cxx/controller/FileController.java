package com.flowerwine.cxx.controller;

import com.flowerwine.cxx.annotation.CurrentUser;
import com.flowerwine.cxx.dto.FileInfoDTO;
import com.flowerwine.cxx.security.AuthUser;
import com.flowerwine.cxx.service.FileService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import me.desair.tus.server.exception.TusException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class FileController {

    private final FileService fileService;

    /**
     * 初始化分片上传
     */
    @PostMapping("/chunk/initialize")
    public ResponseEntity<?> initializeChunkUpload(
            @RequestParam("filename") String filename,
            @RequestParam("totalSize") Long totalSize) {
        
        Map<String, Object> result = fileService.initializeChunkUpload(filename, totalSize);
        return ResponseEntity.ok(result);
    }

    /**
     * 检查分片是否存在
     */
    @GetMapping("/chunk/check")
    public ResponseEntity<?> checkChunk(
            @RequestParam("identifier") String identifier,
            @RequestParam("chunkNumber") Integer chunkNumber) {

        boolean exists = fileService.checkChunkExists(identifier, chunkNumber);
        Map<String, Object> response = Map.of("exists", exists);
        return ResponseEntity.ok(response);
    }

    /**
     * 获取已上传的分片
     */
    @GetMapping("/chunk/uploaded/{identifier}")
    public ResponseEntity<?> getUploadedChunks(
            @PathVariable String identifier) {

        List<Integer> chunks = fileService.getUploadedChunks(identifier);
        Map<String, Object> response = Map.of("uploadedChunks", chunks);
        return ResponseEntity.ok(response);
    }

    /**
     * 上传分片
     */
    @PostMapping("/chunk/upload")
    public ResponseEntity<?> uploadChunk(
            @RequestParam("file") MultipartFile file,
            @RequestParam("identifier") String identifier,
            @RequestParam("chunkNumber") Integer chunkNumber) {

        fileService.uploadChunk(identifier, chunkNumber, file);
        Map<String, Object> response = Map.of("message", "分片上传成功");
        return ResponseEntity.ok(response);
    }

    /**
     * 合并分片
     */
    @PostMapping("/chunk/merge")
    public ResponseEntity<?> mergeChunks(
            @RequestParam("identifier") String identifier,
            @RequestParam("filename") String filename,
            @RequestParam("totalChunks") Integer totalChunks) throws IOException {

        Map<String, Object> result = fileService.mergeChunks(
                identifier, filename, totalChunks);
        return ResponseEntity.ok(result);
    }

    /**
     * 上传头像
     */
    @PostMapping("/upload/avatar")
    public ResponseEntity<?> uploadAvatar(
            @RequestParam("file") MultipartFile file) throws IOException {
        return ResponseEntity.ok(fileService.uploadAvatar(file));
    }

    /**
     * 保存文件信息
     */
    @PostMapping("/info")
    public ResponseEntity<FileInfoDTO> saveFileInfo(
            @RequestParam String originalName,
            @RequestParam String fileName,
            @RequestParam String filePath,
            @RequestParam Integer fileType,
            @RequestParam Long fileSize,
            @CurrentUser AuthUser authUser) {
        
        FileInfoDTO fileInfo = fileService.saveFileInfo(
                authUser.getId(),
                originalName,
                fileName,
                filePath,
                fileType,
                fileSize
        );
        
        return ResponseEntity.ok(fileInfo);
    }

    @PostMapping("/process/{uploadId}")
    public ResponseEntity<?> processUploadedFile(
            @PathVariable String uploadId,
            HttpServletResponse response,
            @CurrentUser AuthUser authUser) throws IOException, TusException {
        
        return fileService.processUploadedFile(uploadId, response, authUser);
    }

    /**
     * 文件下载
     */
    @GetMapping("/download/{fileId}")
    public ResponseEntity<?> downloadFile(@PathVariable Long fileId, @CurrentUser AuthUser authUser) {
        // 直接使用带权限检查的方法
        return fileService.downloadFile(fileId, authUser.getId());
    }

    /**
     * 获取文件物理路径（仅内部使用）
     */
    @GetMapping("/path/{fileId}")
    public ResponseEntity<String> getFilePath(@PathVariable Long fileId, @CurrentUser AuthUser authUser) {
        String path = fileService.getPhysicalPath(fileId);
        return ResponseEntity.ok(path);
    }

    /**
     * 检查文件访问权限
     */
    @GetMapping("/{fileId}/access")
    public ResponseEntity<Map<String, Boolean>> checkFileAccess(
            @PathVariable Long fileId,
            @CurrentUser AuthUser authUser) {
        
        FileInfoDTO fileInfo = fileService.getFileInfo(fileId, authUser.getId(), true);
        Map<String, Boolean> response = Map.of("hasAccess", fileInfo.isHasAccess());
        return ResponseEntity.ok(response);
    }

    /**
     * 获取文件信息
     */
    @GetMapping("/{fileId}")
    public ResponseEntity<FileInfoDTO> getFileInfo(@PathVariable Long fileId, @CurrentUser AuthUser authUser) {
        try {
            // 使用带权限检查的getFileInfo方法
            FileInfoDTO fileInfo = fileService.getFileInfo(fileId, authUser.getId(), true);
            return ResponseEntity.ok(fileInfo);
        } catch (Exception e) {
            log.error("获取文件信息失败", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}