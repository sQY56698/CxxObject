package com.flowerwine.cxx.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserProfileDTO {
    private Long userId;
    private String username;
    private String email;
    private String phone;
    private String avatar;
    private Integer gender;
    private LocalDate birthDate;
    private String bio;
    private String website;
    
    public String getGenderText() {
        if (gender == null) return "未设置";
        return switch (gender) {
            case 0 -> "未知";
            case 1 -> "男";
            case 2 -> "女";
            default -> "未设置";
        };
    }
}