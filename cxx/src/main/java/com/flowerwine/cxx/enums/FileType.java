package com.flowerwine.cxx.enums;

import lombok.Getter;

@Getter
public enum FileType {
    UNKNOWN(0),
    IMAGE(1),
    DOCUMENT(2),
    VIDEO(3),
    AUDIO(4),
    COMPRESSED(5),
    EXECUTABLE(6),
    OTHER(7)
    ;
    
    private final int value;
    
    FileType(int value) {
        this.value = value;
    }
    
    public static FileType fromValue(int value) {
        for (FileType type : FileType.values()) {
            if (type.getValue() == value) {
                return type;
            }
        }
        throw new IllegalArgumentException("Invalid file type value: " + value);
    }
    
    public static FileType fromMimeType(String mimeType) {
        if (mimeType == null) {
            return UNKNOWN;
        }
        
        if (mimeType.startsWith("image/")) {
            return IMAGE;
        } else if (mimeType.startsWith("text/") || 
                  mimeType.equals("application/pdf") ||
                  mimeType.contains("document") ||
                  mimeType.contains("spreadsheet") ||
                  mimeType.contains("presentation")) {
            return DOCUMENT;
        } else if (mimeType.startsWith("video/")) {
            return VIDEO;
        } else if (mimeType.startsWith("audio/")) {
            return AUDIO;
        } else if (mimeType.contains("zip") || 
                  mimeType.contains("compressed") || 
                  mimeType.contains("archive")) {
            return COMPRESSED;
        } else if (mimeType.contains("executable")) {
            return EXECUTABLE;
        } else {
            return OTHER;
        }
    }

}