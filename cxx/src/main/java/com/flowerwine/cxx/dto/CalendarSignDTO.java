package com.flowerwine.cxx.dto;

import lombok.Data;
import lombok.Builder;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import java.util.Map;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CalendarSignDTO {
    private Long userId;
    private Integer year;
    private Integer month;
    private Map<Integer, Boolean> signDays; // 日期 -> 是否签到
}