package com.flowerwine.cxx.task;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import me.desair.tus.server.TusFileUploadService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Slf4j
@Component
@EnableScheduling
@RequiredArgsConstructor
public class TusCleanupTask {

    private final TusFileUploadService tusFileUploadService;
    
    @Value("${file.upload.tus-temp-dir:${user.home}/uploads/tus-temp}")
    private String tusTempDir;

    /**
     * 每天凌晨3点执行清理任务
     * 清理过期的上传和孤立的临时文件
     */
    @Scheduled(cron = "0 0 3 * * ?")
    public void cleanupExpiredUploads() {
        log.info("开始清理过期的 tus 上传...");
        
        try {
            // 使用 tus 服务内置的清理功能
            tusFileUploadService.cleanup();
            
            // 额外清理过期的临时文件
            cleanupOrphanedFiles();
            
            log.info("tus 上传清理完成");
        } catch (Exception e) {
            log.error("清理 tus 上传时发生错误", e);
        }
    }
    
    /**
     * 清理超过 48 小时的孤立临时文件
     */
    private void cleanupOrphanedFiles() {
        try {
            Path tempDir = Paths.get(tusTempDir);
            if (!Files.exists(tempDir)) {
                return;
            }
            
            Instant cutoff = Instant.now().minus(48, ChronoUnit.HOURS);
            
            Files.walk(tempDir)
                .filter(Files::isRegularFile)
                .forEach(path -> {
                    try {
                        if (Files.getLastModifiedTime(path).toInstant().isBefore(cutoff)) {
                            log.info("删除过期临时文件: {}", path);
                            Files.deleteIfExists(path);
                        }
                    } catch (IOException e) {
                        log.warn("删除过期文件时出错: {}", path, e);
                    }
                });
        } catch (IOException e) {
            log.error("清理孤立文件时出错", e);
        }
    }
}