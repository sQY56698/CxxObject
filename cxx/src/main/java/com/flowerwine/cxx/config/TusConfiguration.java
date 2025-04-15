package com.flowerwine.cxx.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import me.desair.tus.server.TusFileUploadService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import jakarta.annotation.PreDestroy;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Slf4j
@Configuration
@RequiredArgsConstructor
public class TusConfiguration {

    private final FileUploadProperties uploadProperties;
    private TusFileUploadService tusFileUploadService;

    @Bean
    public TusFileUploadService tusFileUploadService() throws IOException {
        // 确保目录存在
        Path tusPath = Paths.get(uploadProperties.getChunkFolder());
        if (!Files.exists(tusPath)) {
            Files.createDirectories(tusPath);
        }
        
        Path baseUploadPath = Paths.get(uploadProperties.getBaseDir());
        if (!Files.exists(baseUploadPath)) {
            Files.createDirectories(baseUploadPath);
        }
        
        tusFileUploadService = new TusFileUploadService()
                .withStoragePath(uploadProperties.getChunkFolder())
                .withMaxUploadSize(uploadProperties.getLargeFile().getMaxSize())
                .withThreadLocalCache(false) // 避免内存泄漏
                .withUploadExpirationPeriod(24 * 60 * 60 * 1000L)
                .withUploadUri("/api/files/upload");
        
        return tusFileUploadService;
    }
    
    @PreDestroy
    public void destroy() throws IOException {
        if (tusFileUploadService != null) {
            log.info("关闭 tus 上传服务，清理资源");
            tusFileUploadService.cleanup();
        }
    }
}