package com.flowerwine.cxx.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class FileReviewDTO {
    @NotNull(message = "文件任务ID不能为空")
    private Long taskId;
    
    @NotNull(message = "审核状态不能为空")
    private Byte status;
    
    private String comment;
} 