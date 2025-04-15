package com.flowerwine.cxx.enums;

import lombok.Getter;

@Getter
public enum BountyStatusEnum {
    IN_PROGRESS((byte) 1, "进行中"),
    COMPLETED((byte) 2, "已完成"),
    CLOSED((byte) 3, "已关闭");
    
    private final byte value;
    private final String description;
    
    BountyStatusEnum(byte value, String description) {
        this.value = value;
        this.description = description;
    }
    
    public static BountyStatusEnum fromValue(byte value) {
        for (BountyStatusEnum status : BountyStatusEnum.values()) {
            if (status.getValue() == value) {
                return status;
            }
        }
        throw new IllegalArgumentException("无效的悬赏状态值: " + value);
    }
}