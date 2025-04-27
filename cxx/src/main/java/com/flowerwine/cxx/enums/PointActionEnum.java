package com.flowerwine.cxx.enums;

import lombok.Getter;

@Getter
public enum PointActionEnum {
    SIGN_IN(1, "每日签到"),
    CONTINUOUS_SIGN(2, "连续签到奖励"),
    UPLOAD_FILE(3, "上传文件"),
    DOWNLOAD_FILE(4, "下载文件"),
    POST_BOUNTY(5, "发布悬赏"),
    COMPLETE_BOUNTY(6, "完成悬赏"),
    CLOSE_BOUNTY(7, "关闭悬赏"),
    ADMIN_ADJUST(8, "管理员调整"),
    FREE_FILE_SUBSIDY(9, "免费文件补贴"),
    FILE_DOWNLOAD_INCOME(10, "文件下载收入"),
        ;

    private final int code;
    private final String description;

    PointActionEnum(int code, String description) {
        this.code = code;
        this.description = description;
    }

    public static PointActionEnum getByCode(int code) {
        for (PointActionEnum action : values()) {
            if (action.getCode() == code) {
                return action;
            }
        }
        return null;
    }
}