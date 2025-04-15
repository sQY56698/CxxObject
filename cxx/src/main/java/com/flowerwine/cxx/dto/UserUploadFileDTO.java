package com.flowerwine.cxx.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserUploadFileDTO {
    private Long id;
    private Long userId;
    private Long fileId;
    private String title;
    private String description;
    private String username;  // 上传用户名
    private Integer downloadCount;
    private LocalDateTime createdAt;
    private FileInfoDTO fileInfo;  // 文件信息
    private Boolean isMine;   // 是否是当前用户上传的
}