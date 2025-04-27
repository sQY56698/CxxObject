package com.flowerwine.cxx.controller;

import com.flowerwine.cxx.annotation.CurrentAdmin;
import com.flowerwine.cxx.dto.AdminLoginRequest;
import com.flowerwine.cxx.dto.JwtResponse;
import com.flowerwine.cxx.dto.JwtTokenDTO;
import com.flowerwine.cxx.entity.AdminUser;
import com.flowerwine.cxx.repository.AdminUserRepository;
import com.flowerwine.cxx.security.AdminAuthUser;
import com.flowerwine.cxx.util.JwtUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.Optional;

@Slf4j
@RestController
@RequestMapping("/api/admin/auth")
@RequiredArgsConstructor
public class AdminAuthController {

    private final AdminUserRepository adminUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    /**
     * 管理员登录
     */
    @PostMapping("/login")
    public ResponseEntity<JwtResponse> login(@Valid @RequestBody AdminLoginRequest loginRequest) {
        log.info("管理员登录请求: {}", loginRequest.getUsername());
        
        Optional<AdminUser> adminOptional = adminUserRepository.findByUsername(loginRequest.getUsername());
        
        if (adminOptional.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "管理员账号或密码错误");
        }
        
        AdminUser admin = adminOptional.get();
        
        // 检查账号状态
        if (admin.getStatus() != 1) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "管理员账号已禁用");
        }
        
        // 验证密码
        if (!passwordEncoder.matches(loginRequest.getPassword(), admin.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "管理员账号或密码错误");
        }
        
        // 生成JWT令牌
        String token = jwtUtil.generateToken(JwtTokenDTO.builder()
                .username(admin.getUsername())
                .build());
        
        log.info("管理员 {} 登录成功", admin.getUsername());
        
        return ResponseEntity.ok(new JwtResponse(token));
    }

    /**
     * 获取当前登录的管理员信息
     */
    @GetMapping("/current")
    public ResponseEntity<AdminAuthUser> getCurrentAdmin(@CurrentAdmin AdminAuthUser admin) {
        if (admin == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "未登录或登录已过期");
        }
        
        log.info("获取当前管理员信息: {}", admin.getUsername());
        
        // 转换为前端需要的 DTO 对象
        AdminAuthUser adminAuthUser = new AdminAuthUser();
        adminAuthUser.setId(admin.getId());
        adminAuthUser.setUsername(admin.getUsername());
        
        return ResponseEntity.ok(adminAuthUser);
    }
} 