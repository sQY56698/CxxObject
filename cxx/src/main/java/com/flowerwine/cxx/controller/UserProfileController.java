package com.flowerwine.cxx.controller;

import com.flowerwine.cxx.annotation.CurrentUser;
import com.flowerwine.cxx.dto.UserProfileDTO;
import com.flowerwine.cxx.entity.User;
import com.flowerwine.cxx.entity.UserProfile;
import com.flowerwine.cxx.security.AuthUser;
import com.flowerwine.cxx.service.UserProfileService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
public class UserProfileController {

    private final UserProfileService userProfileService;

    // 获取当前用户的资料
    @GetMapping("/current")
    public ResponseEntity<UserProfileDTO> getCurrentUserProfile(@CurrentUser AuthUser user) {
        UserProfileDTO profile = userProfileService.getCurrentUserProfile(
            UserProfileDTO.builder()
                .userId(user.getId())
                .username(user.getUsername())
                .build()
        );
        return ResponseEntity.ok(profile);
    }

    // 更新当前用户的资料
    @PutMapping("/update")
    public ResponseEntity<UserProfileDTO> updateUserProfile(
            @RequestBody UserProfileDTO profileDTO, 
            @CurrentUser AuthUser user) {
        profileDTO.setUserId(user.getId());
        UserProfileDTO updatedProfile = userProfileService.updateUserProfile(profileDTO);
        return ResponseEntity.ok(updatedProfile);
    }

    // 获取指定用户的公开资料
    @GetMapping("/{userId}")
    public ResponseEntity<UserProfileDTO> getUserProfile(@PathVariable Long userId) {
        UserProfileDTO profile = userProfileService.getUserProfile(userId);
        return ResponseEntity.ok(profile);
    }
}