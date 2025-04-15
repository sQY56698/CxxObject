// 文件路径: cxx/src/main/java/com/flowerwine/cxx/controller/UserController.java
package com.flowerwine.cxx.controller;

import com.flowerwine.cxx.annotation.CurrentUser;
import com.flowerwine.cxx.dto.CreateUserDTO;
import com.flowerwine.cxx.dto.UserProfileDTO;
import com.flowerwine.cxx.entity.User;
import com.flowerwine.cxx.security.AuthUser;
import com.flowerwine.cxx.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody CreateUserDTO createUserDTO, HttpSession session) {
        return userService.register(createUserDTO, session);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody CreateUserDTO createUserDTO,
                                                   HttpServletRequest request,
                                                   HttpSession session) {
        return userService.login(createUserDTO, request, session);
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(HttpSession session) {
        session.removeAttribute("user");
        Map<String, String> response = new HashMap<>();
        response.put("message", "注销成功");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/current")
    public ResponseEntity<UserProfileDTO> getCurrentUser(@CurrentUser AuthUser user) {
        UserProfileDTO userInfo = userService.getCurrentUserInfo(
            UserProfileDTO.builder()
                .userId(user.getId())
                .username(user.getUsername())
                .build()
        );
        return ResponseEntity.ok(userInfo);
    }
    
    @PostMapping("/change-password")
    public ResponseEntity<Map<String, String>> changePassword(@RequestBody Map<String, String> request, 
                                                             @CurrentUser AuthUser user) {
        String oldPassword = request.get("oldPassword");
        String newPassword = request.get("newPassword");
        
        if (oldPassword == null || newPassword == null) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("message", "参数错误");
            return ResponseEntity.badRequest().body(errorResponse);
        }
        
        userService.changePassword(oldPassword, newPassword, user.getId());
        
        Map<String, String> response = new HashMap<>();
        response.put("message", "密码修改成功");
        return ResponseEntity.ok(response);
    }
}