package com.flowerwine.cxx.controller;

import com.flowerwine.cxx.annotation.CurrentUser;
import com.flowerwine.cxx.config.FileUploadProperties;
import com.flowerwine.cxx.dto.FileInfoDTO;
import com.flowerwine.cxx.enums.FileType;
import com.flowerwine.cxx.security.AuthUser;
import com.flowerwine.cxx.service.FileService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import me.desair.tus.server.TusFileUploadService;
import me.desair.tus.server.exception.TusException;
import me.desair.tus.server.upload.UploadInfo;
import org.apache.commons.io.IOUtils;
import org.apache.tika.Tika;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/files/upload")
@RequiredArgsConstructor
public class TusUploadController {

    private final TusFileUploadService tusFileUploadService;
    private final FileService fileService;
    private final FileUploadProperties uploadProperties;
    private final Tika tika = new Tika();

    /**
     * 处理所有与 tus 协议相关的请求
     */
    @RequestMapping(
            method = {RequestMethod.POST, RequestMethod.PATCH, RequestMethod.HEAD, 
                    RequestMethod.OPTIONS, RequestMethod.DELETE, RequestMethod.GET},
            value = {"", "/**"}
    )
    public ResponseEntity<?> processUpload(
            HttpServletRequest request,
            HttpServletResponse response,
            @CurrentUser AuthUser authUser) throws IOException, TusException {
        
        String method = request.getMethod();
        String uri = request.getRequestURI();
        String query = request.getQueryString();
        
        log.debug("收到 tus 请求: {} {} {}", method, uri, query != null ? "?" + query : "");
        
        // 处理 CORS 预检请求
        if ("OPTIONS".equals(method)) {
            return ResponseEntity.ok().build();
        }

        // 检查认证 - 只有 OPTIONS 请求可以无需认证
        if (authUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        // 处理 tus 请求
        tusFileUploadService.process(request, response);
        
        // 如果是 HEAD 或 PATCH 请求，到此为止，不需要进一步处理
        if ("HEAD".equals(method) || "PATCH".equals(method)) {
            return ResponseEntity.ok().build();
        }
        
        // 检查上传是否完成 (针对 POST 请求的完成通知)
        UploadInfo uploadInfo = tusFileUploadService.getUploadInfo(uri);

        // 显式检查上传是否完成，同时添加日志以便调试
        if (uploadInfo != null) {
            // 显式比较 offset 和 length
            boolean isComplete = uploadInfo.getOffset() != null && 
                                 uploadInfo.getLength() != null && 
                                 uploadInfo.getOffset().equals(uploadInfo.getLength());
            
            if (isComplete) {
                Map<String, String> metadata = uploadInfo.getMetadata();
                String originalFilename = metadata.getOrDefault("filename", "unknown");
                
                log.debug("文件上传完成: {}, 大小: {}", originalFilename, uploadInfo.getLength());
                
                try {
                    // 处理上传完成的文件
                    fileService.processCompletedUpload(uploadInfo, authUser, response);
                } catch (Exception e) {
                    log.error("处理上传完成的文件时发生错误", e);
                    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                            .body(Map.of("error", "处理上传文件时发生错误: " + e.getMessage()));
                }
            } else {
                log.debug("上传未完成或检测到错误状态");
            }
        }
        
        return ResponseEntity.ok().build();
    }
    
}