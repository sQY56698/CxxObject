package com.flowerwine.cxx.enums;

public enum UserFileTaskFreeEnum {
    FREE(1),
    PAID(0);

    private final int value;

    UserFileTaskFreeEnum(int value) {
        this.value = value;
    }
    
    public int getValue() {
        return value;
    }
}

