package com.flowerwine.cxx.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserPointsDTO {
    private Long userId;
    private Integer points;
    private Integer totalPoints;
    private String username;  // 关联用户信息
} 