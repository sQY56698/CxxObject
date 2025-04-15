package com.flowerwine.cxx.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateBountyDTO {
    
    @NotBlank(message = "标题不能为空")
    @Size(min = 5, max = 100, message = "标题长度必须在5-100个字符之间")
    private String title;
    
    @NotBlank(message = "描述不能为空")
    @Size(min = 20, message = "描述长度必须在20-1000个字符之间")
    private String description;
    
    @Min(value = 100, message = "悬赏积分最少为100")
    @Max(value = 999999, message = "悬赏积分最多为10000")
    private Integer points;
} 