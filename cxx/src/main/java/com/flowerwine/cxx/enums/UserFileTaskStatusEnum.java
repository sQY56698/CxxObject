package com.flowerwine.cxx.enums;

import lombok.Getter;

@Getter
public enum UserFileTaskStatusEnum {
    REVIEWING((byte)0, "审核中"),
    PUBLISHED((byte)1, "已发布"),
    SUCCESS((byte)2, "发布成功"),
    REJECTED((byte)3, "已驳回");
    
    private final byte value;
    private final String description;
    
    UserFileTaskStatusEnum(byte value, String description) {
        this.value = value;
        this.description = description;
    }
    
    public static UserFileTaskStatusEnum fromValue(byte value) {
        for (UserFileTaskStatusEnum status : UserFileTaskStatusEnum.values()) {
            if (status.getValue() == value) {
                return status;
            }
        }
        throw new IllegalArgumentException("无效的用户文件任务状态值: " + value);
    }
} 