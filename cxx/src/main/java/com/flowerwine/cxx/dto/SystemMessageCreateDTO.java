package com.flowerwine.cxx.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SystemMessageCreateDTO {
    
    @NotBlank(message = "消息标题不能为空")
    @Size(max = 100, message = "消息标题不能超过100个字符")
    private String title;
    
    @NotBlank(message = "消息内容不能为空")
    @Size(max = 1000, message = "消息内容不能超过1000个字符")
    private String content;
} 