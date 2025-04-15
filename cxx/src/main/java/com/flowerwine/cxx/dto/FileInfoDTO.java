package com.flowerwine.cxx.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FileInfoDTO {
    private Long id;
    private String fileUrl;
    private String fileName;
    private Long fileSize;
    private Integer fileType;
    private String originalFilename;
    private boolean hasAccess;
    private Long uploaderId;
    private String createdAt;
}