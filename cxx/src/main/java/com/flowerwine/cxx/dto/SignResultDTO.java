package com.flowerwine.cxx.dto;

import lombok.Data;
import lombok.Builder;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class SignResultDTO {
    private Long userId;
    private LocalDate signDate;
    private Integer continuousDays;
    private Integer earnedPoints;
    private boolean cycleCompleted;
}