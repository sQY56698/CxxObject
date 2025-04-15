package com.flowerwine.cxx.util;

import com.flowerwine.cxx.dto.FileInfoDTO;
import com.flowerwine.cxx.enums.FileType;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.io.FilenameUtils;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * 通用文件上传工具类
 */
@Slf4j
@Component
public class FileUploadUtil {

    /**
     * 上传单个文件
     * 
     * @param file 要上传的文件
     * @param uploadPath 上传目录的基础路径
     * @return 文件信息，包括文件路径、文件名等
     */
    public FileInfoDTO uploadFile(MultipartFile file, String uploadPath) {
        Path tempFile = null;
        try {
            // 获取原始文件名和扩展名
            String originalFilename = file.getOriginalFilename();
            String extension = FilenameUtils.getExtension(originalFilename);

            // 生成新的文件名
            String newFileName = generateFileName(extension);

            // 确保目录存在
            Path uploadDir = Paths.get(uploadPath);
            if (!Files.exists(uploadDir)) {
                Files.createDirectories(uploadDir);
            }

            // 先将文件保存到临时目录
            tempFile = Files.createTempFile("upload_", "_tmp");
            file.transferTo(tempFile);

            log.debug("文件已成功上传到临时目录: {}", tempFile);

            // 移动到目标位置
            Path targetPath = uploadDir.resolve(newFileName);
            Files.move(tempFile, targetPath, StandardCopyOption.REPLACE_EXISTING);

            // 创建返回对象
            FileInfoDTO fileInfoDTO = new FileInfoDTO();
            fileInfoDTO.setOriginalFilename(originalFilename);
            fileInfoDTO.setFileName(newFileName);
            fileInfoDTO.setFileSize(file.getSize());
            fileInfoDTO.setFileType(FileType.fromMimeType(file.getContentType()).getValue());

            log.info("文件上传成功: {}, 保存为: {}", originalFilename, targetPath);
            return fileInfoDTO;

        } catch (IOException e) {
            log.error("文件上传失败", e);
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "文件上传失败: " + e.getMessage());
        } finally {
            // 清理临时文件
            if (tempFile != null) {
                try {
                    Files.deleteIfExists(tempFile);
                } catch (IOException e) {
                    log.warn("清理临时文件失败: {}", tempFile, e);
                }
            }
        }
    }

    /**
     * 删除文件
     */
    public boolean deleteFile(String filePath) {
        try {
            Path path = Paths.get(filePath);
            return Files.deleteIfExists(path);
        } catch (IOException e) {
            log.error("删除文件失败: {}", filePath, e);
            return false;
        }
    }

    private String generateFileName(String extension) {
        String uuid = UUID.randomUUID().toString().replace("-", "");
        return extension == null || extension.isEmpty() ? uuid : uuid + "." + extension;
    }

    private String getTodayPath() {
        return LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
    }

    private void ensureDirectoryExists(String directoryPath) {
        File directory = new File(directoryPath);
        if (!directory.exists() && !directory.mkdirs()) {
            log.error("无法创建目录: {}", directoryPath);
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "无法创建存储目录");
        }
    }
} 