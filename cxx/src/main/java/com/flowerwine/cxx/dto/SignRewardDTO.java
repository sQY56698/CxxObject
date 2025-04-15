package com.flowerwine.cxx.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SignRewardDTO {
    private Integer day;           // 连续签到天数
    private Integer basePoints;    // 基础积分
    private Integer extraPoints;   // 额外奖励积分
    private Integer totalPoints;   // 总积分
} 