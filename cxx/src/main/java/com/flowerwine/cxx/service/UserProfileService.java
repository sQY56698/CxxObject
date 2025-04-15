package com.flowerwine.cxx.service;

import com.flowerwine.cxx.dto.UserProfileDTO;
import com.flowerwine.cxx.entity.User;
import com.flowerwine.cxx.entity.UserProfile;
import com.flowerwine.cxx.repository.UserProfileRepository;
import com.flowerwine.cxx.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserProfileService {

    private final UserProfileRepository userProfileRepository;
    private final UserRepository userRepository;

    /**
     * 将实体转换为 DTO
     */
    private UserProfileDTO convertToDTO(UserProfile profile) {
        UserProfileDTO dto = UserProfileDTO.builder()
            .userId(profile.getUser().getId())
            .username(profile.getUser().getUsername())
            .email(profile.getEmail())
            .phone(profile.getPhone())
            .avatar(profile.getAvatar())
            .gender(profile.getGender())
            .birthDate(profile.getBirthDate())
            .bio(profile.getBio())
            .website(profile.getWebsite())
            .build();
        return dto;
    }

    /**
     * 获取当前用户的资料
     */
    public UserProfileDTO getCurrentUserProfile(UserProfileDTO currentUser) {
        log.info("获取用户资料: {}", currentUser.getUsername());
        
        UserProfile profile = userProfileRepository.findByUserId(currentUser.getUserId())
            .orElseGet(() -> {
                log.info("为用户创建新资料: {}", currentUser.getUsername());
                UserProfile newProfile = new UserProfile();
                newProfile.setEmail(""); // 需要用户后续更新
                return userProfileRepository.save(newProfile);
            });
        
        return convertToDTO(profile);
    }

    /**
     * 更新用户资料
     */
    public UserProfileDTO updateUserProfile(UserProfileDTO profileDTO) {
        UserProfile profile = userProfileRepository.findByUserId(profileDTO.getUserId())
            .orElseGet(UserProfile::new);
        
        // 更新资料字段
        if (profileDTO.getEmail() != null) {
            // 如果邮箱变更，检查是否已被使用
            if (!profileDTO.getEmail().equals(profile.getEmail()) && 
                userProfileRepository.existsByEmail(profileDTO.getEmail())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "邮箱已被使用");
            }
            profile.setEmail(profileDTO.getEmail());
        }
        if (profileDTO.getPhone() != null) {
            profile.setPhone(profileDTO.getPhone());
        }
        if (profileDTO.getAvatar() != null) {
            profile.setAvatar(profileDTO.getAvatar());
        }
        if (profileDTO.getGender() != null) {
            profile.setGender(profileDTO.getGender());
        }
        if (profileDTO.getBirthDate() != null) {
            profile.setBirthDate(profileDTO.getBirthDate());
        }
        if (profileDTO.getBio() != null) {
            profile.setBio(profileDTO.getBio());
        }
        if (profileDTO.getWebsite() != null) {
            profile.setWebsite(profileDTO.getWebsite());
        }
        
        UserProfile savedProfile = userProfileRepository.save(profile);

        return convertToDTO(savedProfile);
    }
    
    /**
     * 获取指定用户的公开资料
     */
    public UserProfileDTO getUserProfile(Long userId) {
        UserProfile profile = userProfileRepository.findByUserId(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "用户资料不存在"));
            
        UserProfileDTO dto = convertToDTO(profile);
        // 对于非当前用户的资料，可以选择隐藏某些敏感信息
        dto.setPhone(null);  // 隐藏手机号
        dto.setEmail(null);  // 隐藏邮箱
        return dto;
    }
}