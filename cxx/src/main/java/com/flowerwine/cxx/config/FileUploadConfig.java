package com.flowerwine.cxx.config;

import jakarta.servlet.MultipartConfigElement;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.web.servlet.MultipartConfigFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.unit.DataSize;
import org.springframework.web.multipart.support.StandardServletMultipartResolver;

import java.io.File;

@Configuration
@RequiredArgsConstructor
public class FileUploadConfig {

    private final AppProperties appProperties;
    
    @Bean
    public MultipartConfigElement multipartConfigElement() {
        MultipartConfigFactory factory = new MultipartConfigFactory();
        factory.setMaxFileSize(DataSize.parse(appProperties.getFile().getMaxFileSize()));
        factory.setMaxRequestSize(DataSize.parse(appProperties.getFile().getMaxRequestSize()));
        
        // 确保上传目录存在
        createDirectoryIfNotExists(appProperties.getFile().getUploadLocation());
        createDirectoryIfNotExists(appProperties.getFile().getAvatarLocation());
        createDirectoryIfNotExists(appProperties.getFile().getTempLocation());
        
        return factory.createMultipartConfig();
    }
    
    @Bean
    public StandardServletMultipartResolver multipartResolver() {
        return new StandardServletMultipartResolver();
    }
    
    private void createDirectoryIfNotExists(String path) {
        File dir = new File(path);
        if (!dir.exists()) {
            boolean created = dir.mkdirs();
            if (!created) {
                throw new RuntimeException("Failed to create directory: " + path);
            }
        }
    }
}