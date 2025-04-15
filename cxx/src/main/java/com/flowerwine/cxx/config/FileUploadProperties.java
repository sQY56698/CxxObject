package com.flowerwine.cxx.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import java.util.Map;
import java.util.Set;
import java.util.HashSet;

@Data
@Component
@ConfigurationProperties(prefix = "app.upload")
public class FileUploadProperties {
    private String baseDir;
    private String urlPrefix;
    private String chunkFolder;
    private Map<String, FileTypeConfig> types;
    private ChunkConfig chunk = new ChunkConfig();
    private LargeFileConfig largeFile = new LargeFileConfig();

    @Data
    public static class FileTypeConfig {
        private String[] allowedTypes;
        private long maxSize;
        private String directory;
        private Dimensions dimensions;
    }

    @Data
    public static class Dimensions {
        private int width;
        private int height;
        private Integer minWidth;
        private Integer minHeight;
    }

    @Data
    public static class ChunkConfig {
        private long maxChunkSize;
        private int expirationHours;
    }

    @Data
    public static class LargeFileConfig {
        private long maxSize;
        private long minSize;
        private String[] forbiddenTypes;
        private String[] forbiddenExtensions;
    }
} 