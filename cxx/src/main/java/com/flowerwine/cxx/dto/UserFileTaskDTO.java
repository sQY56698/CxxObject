package com.flowerwine.cxx.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserFileTaskDTO {
    private Long id;
    private Long userId;
    private String username;
    private String avatar;
    private String title;
    private String description;
    private Long fileId;
    private FileInfoDTO fileInfo;
    private Boolean isFree;
    private Integer requiredPoints;
    private Byte status;
    private String statusText;
    private Integer downloadCount;
    private Integer viewCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Boolean isMine;
    private Boolean hasAccess;
} 