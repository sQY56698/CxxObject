package com.flowerwine.cxx.service;

import com.flowerwine.cxx.config.FileUploadProperties;
import com.flowerwine.cxx.dto.FileInfoDTO;
import com.flowerwine.cxx.entity.FileBid;
import com.flowerwine.cxx.entity.FileBounty;
import com.flowerwine.cxx.entity.FileDownloadRecord;
import com.flowerwine.cxx.entity.FileInfo;
import com.flowerwine.cxx.repository.FileInfoRepository;
import com.flowerwine.cxx.repository.FileBidRepository;
import com.flowerwine.cxx.repository.FileBountyRepository;
import com.flowerwine.cxx.repository.FileDownloadRecordRepository;
import com.flowerwine.cxx.util.FileUploadUtil;
import com.flowerwine.cxx.util.ChunkFileUploadUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.io.FilenameUtils;
import org.apache.tika.Tika;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.ResponseEntity;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.MediaType;
import org.springframework.http.HttpHeaders;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.io.File;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class FileService {

    private final FileUploadUtil fileUploadUtil;
    private final ChunkFileUploadUtil chunkFileUploadUtil;
    private final FileUploadProperties uploadProperties;
    private final Tika tika = new Tika();
    private final FileInfoRepository fileInfoRepository;
    private final FileBidRepository fileBidRepository;
    private final FileBountyRepository fileBountyRepository;
    private final FileDownloadRecordRepository fileDownloadRecordRepository;

    /**
     * 通用文件上传方法
     */
    public FileInfoDTO uploadFile(MultipartFile file, String fileType) throws IOException {
        // 获取文件类型配置
        FileUploadProperties.FileTypeConfig config = uploadProperties.getTypes().get(fileType);
        if (config == null) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST, 
                "不支持的文件类型配置: " + fileType
            );
        }

        // 验证文件
        validateFile(file, config);

        if ("avatar".equals(fileType)) {
            validateImageDimensions(file, config.getDimensions());
        }

        FileInfoDTO fileInfo = fileUploadUtil.uploadFile(file, uploadProperties.getBaseDir() + File.separator + config.getDirectory());

        fileInfo.setFileUrl(String.format("%s/%s/%s", uploadProperties.getUrlPrefix(), config.getDirectory(), fileInfo.getFileName()));
        // 上传文件
        return fileInfo;
    }

    /**
     * 验证文件基本信息
     */
    private void validateFile(MultipartFile file, FileUploadProperties.FileTypeConfig config) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "文件不能为空");
        }

        // 验证文件大小
        if (file.getSize() > config.getMaxSize()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    String.format("文件大小超过限制，最大允许 %d MB", config.getMaxSize() / (1024 * 1024)));
        }

        // 获取文件类型
        String contentType = file.getContentType();
        if (contentType == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "无法识别文件类型");
        }

        // 验证文件类型
        if (config.getAllowedTypes() != null && config.getAllowedTypes().length > 0) {
            if (!Arrays.asList(config.getAllowedTypes()).contains(contentType)) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        String.format("不支持的文件类型: %s，仅支持: %s", 
                            contentType,
                            String.join(", ", config.getAllowedTypes())));
            }
        }
    }

    /**
     * 验证图片尺寸
     */
    private void validateImageDimensions(MultipartFile file, FileUploadProperties.Dimensions dimensions) 
            throws IOException {
        BufferedImage image = ImageIO.read(file.getInputStream());
        if (image == null) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST, 
                "无效的图片文件"
            );
        }

        int width = image.getWidth();
        int height = image.getHeight();

        // 检查最小尺寸
        if (dimensions.getMinWidth() != null && width < dimensions.getMinWidth()) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                String.format("图片宽度不能小于 %d 像素", dimensions.getMinWidth())
            );
        }
        if (dimensions.getMinHeight() != null && height < dimensions.getMinHeight()) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                String.format("图片高度不能小于 %d 像素", dimensions.getMinHeight())
            );
        }

        // 检查最大尺寸
        if (width > dimensions.getWidth()) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                String.format("图片宽度不能超过 %d 像素", dimensions.getWidth())
            );
        }
        if (height > dimensions.getHeight()) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                String.format("图片高度不能超过 %d 像素", dimensions.getHeight())
            );
        }
    }

    /**
     * 上传头像
     */
    public FileInfoDTO uploadAvatar(MultipartFile file) throws IOException {
        FileUploadProperties.FileTypeConfig config = uploadProperties.getTypes().get("avatar");
        if (config == null) {
            throw new ResponseStatusException(
                HttpStatus.INTERNAL_SERVER_ERROR, 
                "头像上传配置不存在"
            );
        }
        
        try {
            validateImageDimensions(file, config.getDimensions());
        } catch (IOException e) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "无法读取图片文件: " + e.getMessage()
            );
        }

        return uploadFile(file, "avatar");
    }

    /**
     * 检查分片是否存在
     */
    public boolean checkChunkExists(String identifier, int chunkNumber) {
        return chunkFileUploadUtil.checkChunkExists(uploadProperties.getChunkFolder(), identifier, chunkNumber);
    }

    /**
     * 获取已上传的分片
     */
    public List<Integer> getUploadedChunks(String identifier) {
        return chunkFileUploadUtil.getUploadedChunks(uploadProperties.getChunkFolder(), identifier);
    }

    /**
     * 验证大文件上传请求
     */
    private void validateLargeFileUpload(String filename, long totalSize) {
        FileUploadProperties.LargeFileConfig config = uploadProperties.getLargeFile();
        String extension = FilenameUtils.getExtension(filename).toLowerCase();
        
        // 检查文件扩展名
        if (config.getForbiddenExtensions() != null && 
            Arrays.asList(config.getForbiddenExtensions()).contains(extension)) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "不允许上传此类型的文件: " + extension
            );
        }

        // 检查文件大小范围
        if (totalSize < config.getMinSize()) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                String.format("文件太小，最小允许 %d MB", config.getMinSize() / (1024 * 1024))
            );
        }
        if (totalSize > config.getMaxSize()) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                String.format("文件大小超过限制，最大允许 %d MB", config.getMaxSize() / (1024 * 1024))
            );
        }

        // 尝试通过文件名判断MIME类型
        try {
            String mimeType = tika.detect(filename);
            if (config.getForbiddenTypes() != null && 
                Arrays.asList(config.getForbiddenTypes()).contains(mimeType)) {
                throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "不允许上传此类型的文件: " + mimeType
                );
            }
        } catch (Exception e) {
            log.warn("无法检测文件类型: {}", filename);
        }
    }
    
    /**
     * 初始化分片上传
     * @param filename 文件名
     * @param totalSize 文件总大小
     * @return 包含上传标识符的响应信息
     */
    public Map<String, Object> initializeChunkUpload(String filename, long totalSize) {
        // 验证文件
        validateLargeFileUpload(filename, totalSize);

        // 生成唯一标识
        String identifier = UUID.randomUUID().toString().replace("-", "");

        // 初始化上传
        chunkFileUploadUtil.initializeUpload(
            identifier,
            uploadProperties.getChunkFolder()
        );

        // 返回上传信息
        return Map.of(
            "identifier", identifier,
            "chunkSize", uploadProperties.getChunk().getMaxChunkSize(),
            "message", "初始化成功"
        );
    }

    /**
     * 上传分片
     */
    public void uploadChunk(
            String identifier, 
            int chunkNumber, 
            MultipartFile file) {
        // 验证分片大小
        if (file.getSize() > uploadProperties.getChunk().getMaxChunkSize()) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                String.format("分片大小超过限制，最大允许 %d MB", 
                    uploadProperties.getChunk().getMaxChunkSize() / (1024 * 1024))
            );
        }

        chunkFileUploadUtil.uploadChunk(
            uploadProperties.getChunkFolder(),
            identifier,
            chunkNumber,
            file
        );
    }

    /**
     * 验证合并后的文件
     */
    private void validateMergedFile(File file) throws IOException {
        FileUploadProperties.LargeFileConfig config = uploadProperties.getLargeFile();
        
        // 检查实际文件的MIME类型
        String mimeType = tika.detect(file);
        if (config.getForbiddenTypes() != null && 
            Arrays.asList(config.getForbiddenTypes()).contains(mimeType)) {
            // 删除文件并抛出异常
            file.delete();
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "检测到危险的文件类型: " + mimeType
            );
        }
    }

    /**
     * 合并分片
     */
    public Map<String, Object> mergeChunks(
            String identifier,
            String filename,
            int totalChunks) throws IOException {
        Map<String, Object> result = chunkFileUploadUtil.mergeChunks(
            uploadProperties.getChunkFolder(),
            identifier,
            uploadProperties.getBaseDir(),
            filename,
            totalChunks
        );

        // 合并后进行最终的文件类型验证
        try {
            validateMergedFile(new File((String) result.get("filePath")));
        } catch (IOException e) {
            // 如果验证失败，清理已合并的文件
            fileUploadUtil.deleteFile((String) result.get("filePath"));
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "文件类型验证失败: " + e.getMessage()
            );
        }

        return result;
    }

    /**
     * 定时清理过期的分片目录
     * 每天凌晨2点执行
     */
    @Scheduled(cron = "0 0 2 * * ?")
    public void cleanupExpiredChunkDirs() {
        chunkFileUploadUtil.cleanupExpiredChunkDirs();
    }

    /**
     * 删除文件
     */
    public boolean deleteFile(String filePath) {
        return fileUploadUtil.deleteFile(filePath);
    }

    /**
     * 获取文件信息，带权限控制
     */
    public FileInfoDTO getFileInfo(Long fileId, Long userId, boolean checkPermission) {
        FileInfo fileInfo = fileInfoRepository.findById(fileId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "文件不存在"));
        
        // 权限检查 - 只有文件上传者和关联的悬赏发布者可以访问完整信息
        boolean hasPermission = !checkPermission; // 如果不需要权限检查，则默认有权限
        
        if (checkPermission && userId != null) {
            // 检查是否是文件上传者
            if (fileInfo.getUserId().equals(userId)) {
                hasPermission = true;
            } else {
                // 检查是否是悬赏发布者
                List<FileBounty> bounties = fileBountyRepository.findByUserIdAndWinnerId(userId, fileInfo.getUserId());
                boolean isBountyPublisher = !bounties.isEmpty();
                
                // 检查是否有竞标关联
                List<FileBid> bids = fileBidRepository.findByFileId(fileId);
                for (FileBid bid : bids) {
                    FileBounty bounty = fileBountyRepository.findById(bid.getBountyId()).orElse(null);
                    if (bounty != null && bounty.getUserId().equals(userId)) {
                        isBountyPublisher = true;
                        break;
                    }
                }
                
                hasPermission = isBountyPublisher;
            }
        }
        
        // 构建返回信息
        FileInfoDTO dto = FileInfoDTO.builder()
                .id(fileInfo.getId())
                .fileName(fileInfo.getFileName())
                .fileSize(fileInfo.getFileSize())
                .fileType(fileInfo.getFileType())
                .originalFilename(hasPermission ? fileInfo.getOriginalName() : "[受保护的文件]")
                .fileUrl(hasPermission ? "/uploads/" + fileInfo.getFilePath() : null)
                .hasAccess(hasPermission)
                .uploaderId(fileInfo.getUserId())
                .createdAt(fileInfo.getCreatedAt().toString())
                .build();
        
        return dto;
    }

    /**
     * 保存文件信息
     */
    @Transactional
    public FileInfoDTO saveFileInfo(Long userId, String originalName, String fileName, String filePath, 
            Integer fileType, Long fileSize) {
        FileInfo fileInfo = new FileInfo();
        fileInfo.setUserId(userId);
        fileInfo.setOriginalName(originalName);
        fileInfo.setFileName(fileName);
        fileInfo.setFilePath(filePath);
        fileInfo.setFileType(fileType);
        fileInfo.setFileSize(fileSize);
        
        FileInfo savedFileInfo = fileInfoRepository.save(fileInfo);
        
        return FileInfoDTO.builder()
                .id(savedFileInfo.getId())
                .fileName(savedFileInfo.getFileName())
                .fileSize(savedFileInfo.getFileSize())
                .fileType(savedFileInfo.getFileType())
                .originalFilename(savedFileInfo.getOriginalName())
                .fileUrl(savedFileInfo.getFilePath())
                .build();
    }

    /**
     * 获取文件物理路径
     */
    public String getPhysicalPath(Long fileId) {
        FileInfo fileInfo = fileInfoRepository.findById(fileId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "文件不存在"));
        
        return fileInfo.getFilePath();
    }

    /**
     * 记录文件下载
     */
    @Transactional
    public void recordDownload(Long fileId, Long userId) {
        FileDownloadRecord record = new FileDownloadRecord();
        record.setFileId(fileId);
        record.setUserId(userId);
        fileDownloadRecordRepository.save(record);
    }

    /**
     * 下载文件，带权限检查
     */
    public ResponseEntity<?> downloadFile(Long fileId, Long userId) {
        // 获取文件信息时进行权限检查
        FileInfoDTO fileInfo = getFileInfo(fileId, userId, true);
        if (!fileInfo.isHasAccess()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("您没有权限下载此文件");
        }
        
        // 获取物理路径
        String physicalPath = getPhysicalPath(fileId);
        
        try {
            Path filePath = Paths.get(physicalPath);
            if (!Files.exists(filePath)) {
                return ResponseEntity.notFound().build();
            }
            
            // 记录下载
            recordDownload(fileId, userId);
            
            Resource resource = new UrlResource(filePath.toUri());
            String contentType = Files.probeContentType(filePath);
            if (contentType == null) {
                contentType = "application/octet-stream";
            }
            
            String contentDisposition = "attachment; filename=\"" + 
                    URLEncoder.encode(fileInfo.getOriginalFilename(), StandardCharsets.UTF_8) + "\"";
            
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, contentDisposition)
                    .body(resource);
        } catch (Exception e) {
            log.error("文件下载失败", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("文件下载失败: " + e.getMessage());
        }
    }

    /**
     * 获取文件信息（兼容旧版本，不进行权限检查）
     */
    public FileInfoDTO getFileInfo(Long fileId) {
        return getFileInfo(fileId, null, false);
    }
}