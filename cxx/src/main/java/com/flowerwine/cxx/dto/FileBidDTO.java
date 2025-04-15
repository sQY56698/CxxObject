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
public class FileBidDTO {
    private Long id;
    private Long bountyId;
    private Long userId;
    private String username;  // 用户名，通过关联查询获取
    private String avatar;  // 添加竞标者头像URL
    private Long fileId;
    private FileInfoDTO fileInfo;  // 文件信息
    private Boolean isWinner;  // 是否为中标者
    private LocalDateTime createdAt;
    private Boolean isMine;   // 是否是当前用户的竞标
    private Boolean hasFile;  // 是否已上传文件
    private Boolean canAccess;  // 是否具有访问权限
}