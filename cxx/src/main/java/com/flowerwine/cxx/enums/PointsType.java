package com.flowerwine.cxx.enums;

import lombok.Getter;

@Getter
public enum PointsType {
    REGISTER(0, "注册奖励"),
    UPLOAD(1, "上传文件"),
    DOWNLOAD(2, "下载文件"),
    POST_BOUNTY(3, "发布悬赏"),
    COMPLETE_BOUNTY(4, "完成悬赏"),
    ADMIN_ADJUST(5, "管理员调整");

    private final int value;
    private final String description;

    PointsType(int value, String description) {
        this.value = value;
        this.description = description;
    }

    public static String getDescription(int value) {
        for (PointsType type : values()) {
            if (type.getValue() == value) {
                return type.getDescription();
            }
        }
        throw new IllegalArgumentException("Invalid points type value: " + value);
    }
} 