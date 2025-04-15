// 文件路径: cxx/src/main/java/com/flowerwine/cxx/config/JwtAuthenticationFilter.java
package com.flowerwine.cxx.config;

import com.flowerwine.cxx.entity.User;
import com.flowerwine.cxx.repository.UserRepository;
import com.flowerwine.cxx.security.AuthUser;
import com.flowerwine.cxx.util.JwtUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.Optional;

@Slf4j
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserRepository userRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        try {
            String jwt = getJwtFromRequest(request);

            if (StringUtils.hasText(jwt) && jwtUtil.validateToken(jwt)) {
                String username = jwtUtil.extractUsername(jwt);
                log.debug("处理JWT令牌: 用户 {}", username);
                
                // 直接从数据库加载用户
                Optional<User> userOptional = userRepository.findByUsername(username);
                
                if (userOptional.isPresent()) {
                    User user = userOptional.get();

                    AuthUser authUser = AuthUser.builder()
                        .id(user.getId())
                        .username(user.getUsername())
                        .status(user.getStatus())
                        .build();
                    
                    // 创建认证令牌 - 确保使用完整的User对象作为principal
                    UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                            authUser,  // 使用完整的用户对象，这样@CurrentUser注解可以获取到
                            null,  // 凭证，通常为null，因为JWT已经验证了
                            Collections.singletonList(new SimpleGrantedAuthority("USER"))  // 简单授权
                    );
                    
                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                    log.debug("成功设置认证信息: 用户 {}", username);
                }
            }
        } catch (Exception e) {
            log.error("无法设置用户认证", e);
        }

        filterChain.doFilter(request, response);
    }

    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}