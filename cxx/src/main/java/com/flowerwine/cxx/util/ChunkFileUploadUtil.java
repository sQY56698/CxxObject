package com.flowerwine.cxx.util;

import com.flowerwine.cxx.config.AppProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.io.FileUtils;
import org.apache.commons.io.FilenameUtils;
import org.apache.tika.Tika;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * 分片文件上传工具类 - 用于处理大文件分片上传
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ChunkFileUploadUtil {

    private final AppProperties appProperties;
    private final Tika tika = new Tika();
    private final FileUploadUtil fileUploadUtil;

    /**
     * 初始化分片上传
     * 
     * @param identifier 文件唯一标识
     * @param chunkDir 分片存储目录
     */
    public void initializeUpload(String identifier, String chunkDir) {
        File dir = new File(getChunkDirPath(chunkDir, identifier));
        if (dir.exists()) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "该文件已在上传中: " + identifier
            );
        }
        if (!dir.mkdirs()) {
            throw new ResponseStatusException(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "无法创建分片目录"
            );
        }
        log.info("初始化分片上传: {}", identifier);
    }

    /**
     * 检查分片是否存在
     */
    public boolean checkChunkExists(String chunkDir, String identifier, int chunkNumber) {
        validateChunkDir(chunkDir, identifier);
        File chunkFile = getChunkFile(chunkDir, identifier, chunkNumber);
        return chunkFile.exists() && chunkFile.length() > 0;
    }

    /**
     * 获取已上传的分片列表
     */
    public List<Integer> getUploadedChunks(String chunkDir, String identifier) {
        validateChunkDir(chunkDir, identifier);
        List<Integer> uploadedChunks = new ArrayList<>();
        
        File[] files = new File(getChunkDirPath(chunkDir, identifier)).listFiles();
        if (files != null) {
            for (File file : files) {
                if (file.isFile()) {
                    try {
                        int chunkNumber = Integer.parseInt(file.getName());
                        uploadedChunks.add(chunkNumber);
                    } catch (NumberFormatException ignored) {
                        // 忽略非数字命名的文件
                    }
                }
            }
        }
        
        return uploadedChunks;
    }

    /**
     * 上传分片
     */
    public void uploadChunk(
            String chunkDir,
            String identifier, 
            int chunkNumber,
            MultipartFile file) {
            
        validateChunkDir(chunkDir, identifier);
        
        try {
            File chunkFile = getChunkFile(chunkDir, identifier, chunkNumber);
            file.transferTo(chunkFile);
            
            log.debug("分片上传成功: {}, 分片: {}", identifier, chunkNumber);
            
        } catch (IOException e) {
            log.error("分片上传失败", e);
            throw new ResponseStatusException(
                HttpStatus.INTERNAL_SERVER_ERROR, 
                "分片上传失败: " + e.getMessage()
            );
        }
    }

    /**
     * 合并文件分片
     */
    public Map<String, Object> mergeChunks(
            String chunkDir,
            String identifier, 
            String targetDir,
            String filename,
            int totalChunks) throws IOException {
            
        validateChunkDir(chunkDir, identifier);
        
        try {
            // 检查所有分片是否已上传
            List<Integer> uploadedChunks = getUploadedChunks(chunkDir, identifier);
            if (uploadedChunks.size() != totalChunks) {
                throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, 
                    String.format("分片数量不匹配: 预期 %d, 实际 %d", totalChunks, uploadedChunks.size())
                );
            }
            
            // 确保分片按顺序排列
            uploadedChunks.sort(Integer::compareTo);
            
            // 合并文件
            Map<String, Object> fileInfo = mergeChunksToFile(
                chunkDir,
                identifier, 
                targetDir,
                filename, 
                totalChunks
            );
            
            // 清理分片
            cleanupChunks(chunkDir, identifier);
            
            return fileInfo;
            
        } catch (Exception e) {
            if (!(e instanceof ResponseStatusException)) {
                log.error("文件合并失败", e);
                throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR, 
                    "文件合并失败: " + e.getMessage()
                );
            }
            throw e;
        }
    }

    /**
     * 清理分片文件
     */
    public void cleanupChunks(String chunkDir, String identifier) {
        try {
            File dir = new File(getChunkDirPath(chunkDir, identifier));
            if (dir.exists() && dir.isDirectory()) {
                FileUtils.deleteDirectory(dir);
                log.debug("已清理分片目录: {}", identifier);
            }
        } catch (IOException e) {
            log.error("清理分片文件失败", e);
            throw new ResponseStatusException(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "清理分片文件失败: " + e.getMessage()
            );
        }
    }

    /**
     * 验证分片目录是否存在
     */
    private void validateChunkDir(String chunkDir, String identifier) {
        File dir = new File(getChunkDirPath(chunkDir, identifier));
        if (!dir.exists() || !dir.isDirectory()) {
            throw new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "未找到上传任务: " + identifier
            );
        }
    }

    private String getChunkDirPath(String chunkDir, String identifier) {
        return chunkDir + File.separator + identifier;
    }

    private File getChunkFile(String chunkDir, String identifier, int chunkNumber) {
        String chunkDirPath = getChunkDirPath(chunkDir, identifier);
        return new File(String.format("%s/%d", chunkDirPath, chunkNumber));
    }

    private Map<String, Object> mergeChunksToFile(
            String chunkDir,
            String identifier, 
            String targetDir,
            String filename, 
            int totalChunks) throws IOException {
            
        // 确保目标目录存在
        File uploadDir = new File(targetDir);
        if (!uploadDir.exists() && !uploadDir.mkdirs()) {
            throw new ResponseStatusException(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "无法创建目标目录"
            );
        }

        // 生成目标文件路径
        String filePath = targetDir + File.separator + filename;
        File mergedFile = new File(filePath);

        // 合并文件
        if (mergedFile.exists()) {
            mergedFile.delete();
        }
        mergedFile.createNewFile();

        // 逐个合并分片
        for (int i = 1; i <= totalChunks; i++) {
            File chunkFile = getChunkFile(chunkDir, identifier, i);
            Files.write(
                mergedFile.toPath(),
                Files.readAllBytes(chunkFile.toPath()),
                StandardOpenOption.APPEND
            );
        }

        // 返回文件信息
        Map<String, Object> fileInfo = new HashMap<>();
        fileInfo.put("fileName", filename);
        fileInfo.put("filePath", filePath);
        fileInfo.put("fileSize", mergedFile.length());

        return fileInfo;
    }

    /**
     * 清理过期的分片目录
     * 过期时间默认为24小时
     */
    public void cleanupExpiredChunkDirs() {
        try {
            File chunksBaseDir = new File(appProperties.getFile().getTempLocation() + File.separator + "chunks");
            if (!chunksBaseDir.exists() || !chunksBaseDir.isDirectory()) {
                return;
            }
            
            File[] chunkDirs = chunksBaseDir.listFiles();
            if (chunkDirs == null) {
                return;
            }
            
            // 超过24小时的分片目录将被删除
            long cutoffTime = System.currentTimeMillis() - (24 * 60 * 60 * 1000);
            
            for (File dir : chunkDirs) {
                if (dir.isDirectory() && dir.lastModified() < cutoffTime) {
                    FileUtils.deleteDirectory(dir);
                    log.info("已清理过期分片目录: {}", dir.getName());
                }
            }
        } catch (IOException e) {
            log.error("清理过期分片目录失败", e);
        }
    }
} 