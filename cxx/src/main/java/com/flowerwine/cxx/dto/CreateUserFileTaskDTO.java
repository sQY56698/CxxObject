package com.flowerwine.cxx.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateUserFileTaskDTO {
    @NotBlank(message = "标题不能为空")
    private String title;
    
    @NotBlank(message = "描述不能为空")
    private String description;
    
    @NotNull(message = "文件ID不能为空")
    private Long fileId;
    
    @NotNull(message = "是否免费不能为空")
    private Boolean isFree;
    
    @Min(value = 0, message = "所需积分不能小于0")
    private Integer requiredPoints;
} 