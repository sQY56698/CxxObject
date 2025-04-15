package com.flowerwine.cxx.service;

import com.flowerwine.cxx.dto.JwtTokenDTO;
import com.flowerwine.cxx.dto.CreateUserDTO;
import com.flowerwine.cxx.dto.UserProfileDTO;
import com.flowerwine.cxx.entity.User;
import com.flowerwine.cxx.entity.UserProfile;
import com.flowerwine.cxx.entity.UserPoints;
import com.flowerwine.cxx.entity.PointsRecord;
import com.flowerwine.cxx.enums.PointsType;
import com.flowerwine.cxx.repository.UserProfileRepository;
import com.flowerwine.cxx.repository.UserRepository;
import com.flowerwine.cxx.repository.UserPointsRepository;
import com.flowerwine.cxx.repository.PointsRecordRepository;
import com.flowerwine.cxx.security.AuthUser;
import com.flowerwine.cxx.util.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final UserPointsRepository userPointsRepository;
    private final PointsRecordRepository pointsRecordRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    private static final int INITIAL_POINTS = 100;

    public ResponseEntity<?> register(CreateUserDTO createUserDTO, HttpSession session) {
        // 验证验证码
        String captcha = (String) session.getAttribute("captcha");
        if (captcha == null || !captcha.equalsIgnoreCase(createUserDTO.getCaptcha())) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("message", "验证码不正确");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }
        session.removeAttribute("captcha");

        // 验证用户名是否存在
        if (userRepository.existsByUsername(createUserDTO.getUsername())) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("message", "用户名已存在");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }

        // 验证邮箱是否存在
        if (userProfileRepository.existsByEmail(createUserDTO.getEmail())) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("message", "邮箱已存在");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }

        // 创建用户
        User user = new User();
        user.setUsername(createUserDTO.getUsername());
        user.setPassword(passwordEncoder.encode(createUserDTO.getPassword()));
        user.setStatus(1);
        user = userRepository.save(user);

        // 创建用户资料
        UserProfile profile = new UserProfile();
        profile.setUser(user);
        profile.setEmail(createUserDTO.getEmail());
        userProfileRepository.save(profile);

        // 初始化用户积分
        UserPoints userPoints = new UserPoints();
        userPoints.setUserId(user.getId());
        userPoints.setPoints(INITIAL_POINTS);
        userPoints.setTotalPoints(INITIAL_POINTS);
        userPointsRepository.save(userPoints);

        // 记录初始积分发放记录
        PointsRecord pointsRecord = new PointsRecord();
        pointsRecord.setUserId(user.getId());
        pointsRecord.setPoints(INITIAL_POINTS);
        pointsRecord.setPointActionId(PointsType.REGISTER.getValue());
        pointsRecord.setDescription("新用户注册奖励");
        pointsRecordRepository.save(pointsRecord);

        log.info("用户注册成功，初始化积分: userId={}, points={}", user.getId(), INITIAL_POINTS);

        // 清除敏感信息并返回用户信息
        Map<String, Object> response = new HashMap<>();
        response.put("id", user.getId());
        response.put("username", user.getUsername());
        response.put("email", profile.getEmail());
        response.put("points", INITIAL_POINTS);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * 将 User 和 UserProfile 转换为 UserProfileDTO
     */
    private UserProfileDTO convertToUserProfileDTO(User user, UserProfile profile) {
        UserProfileDTO dto = UserProfileDTO.builder()
            .userId(user.getId())
            .username(user.getUsername())
            .email(profile.getEmail())
            .avatar(profile.getAvatar())
            .gender(profile.getGender())
            .birthDate(profile.getBirthDate())
            .bio(profile.getBio())
            .website(profile.getWebsite())
            .build();
        return dto;
    }

    /**
     * 获取当前用户信息
     */
    public UserProfileDTO getCurrentUserInfo(UserProfileDTO currentUser) {
        User user = userRepository.findById(currentUser.getUserId())
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND, "用户不存在"));
                
        UserProfile profile = userProfileRepository.findByUserId(user.getId())
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND, "用户资料不存在"));
                
        return convertToUserProfileDTO(user, profile);
    }

    /**
     * 修改登录方法，使用 UserProfileDTO 返回用户信息
     */
    public ResponseEntity<?> login(CreateUserDTO userDTO, HttpServletRequest request, HttpSession session) {
        Optional<User> optionalUser = userRepository.findByUsername(userDTO.getUsername());
        if (optionalUser.isEmpty()) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("message", "用户名或密码错误");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }

        User user = optionalUser.get();

        // 验证密码
        if (!passwordEncoder.matches(userDTO.getPassword(), user.getPassword())) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("message", "用户名或密码错误");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }

        UserProfile profile = userProfileRepository.findByUserId(user.getId())
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.INTERNAL_SERVER_ERROR, "用户资料不存在"));

        // 生成 token
        JwtTokenDTO jwtTokenDTO = JwtTokenDTO.builder()
            .userId(user.getId())
            .email(profile.getEmail())
            .avatar(profile.getAvatar())
            .username(user.getUsername())
            .build();
        String token = jwtUtil.generateToken(jwtTokenDTO);

        // 转换为 UserProfileDTO
        UserProfileDTO userInfo = convertToUserProfileDTO(user, profile);

        // 创建响应
        Map<String, Object> response = new HashMap<>();
        response.put("user", userInfo);
        response.put("token", token);
        
        return ResponseEntity.ok(response);
    }

    // 修改密码的方法
    public void changePassword(String oldPassword, String newPassword, Long userId) {
        Optional<User> optionalUser = userRepository.findById(userId);
        if (optionalUser.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "用户不存在");
        }
        
        User user = optionalUser.get();
        
        // 验证旧密码
        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "原密码不正确");
        }
        
        // 更新密码
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    /**
     * 根据ID查找用户
     */
    public User findUserById(Long userId) {
        return userRepository.findById(userId)
                .orElse(null);
    }
}