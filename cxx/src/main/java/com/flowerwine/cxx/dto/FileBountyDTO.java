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
public class FileBountyDTO {
    private Long id;
    private String title;
    private String description;
    private Integer points;
    private Long userId;
    private String username;  // 用户名，通过关联查询获取
    private String avatar;  // 添加发布者头像URL
    private Byte status;  // 状态码
    private String statusText;  // 状态文本描述
    private Integer viewCount;
    private Integer bidCount;  // 需要通过查询计算
    private LocalDateTime createdAt;
    private LocalDateTime endAt;
    private Boolean isMine;   // 是否是当前用户发布的
    private Boolean hasWinner;  // 是否已有中标者
    private Long winnerId;
    private String winnerName;
    private String winnerAvatar;  // 添加胜利者头像URL
}