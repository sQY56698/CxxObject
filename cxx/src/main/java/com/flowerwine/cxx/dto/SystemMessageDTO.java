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
public class SystemMessageDTO {
    private Long id;
    private String title;
    private String content;
    private boolean isRead;
    private LocalDateTime createdAt;
} 