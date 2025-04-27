package com.flowerwine.cxx.config;

import com.flowerwine.cxx.entity.AdminUser;
import com.flowerwine.cxx.repository.AdminUserRepository;
import com.flowerwine.cxx.security.AdminAuthUser;
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
import java.util.List;
import java.util.Optional;

@Slf4j
@Component
public class AdminJwtAuthenticationFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private AdminUserRepository adminUserRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        try {
            String jwt = getJwtFromRequest(request);
            
            // 只处理管理员接口的请求
            if (!request.getRequestURI().startsWith("/api/admin")) {
                filterChain.doFilter(request, response);
                return;
            }

            if (StringUtils.hasText(jwt) && jwtUtil.validateToken(jwt)) {
                String username = jwtUtil.extractUsername(jwt);
                log.debug("处理管理员JWT令牌: 用户 {}", username);
                
                Optional<AdminUser> adminOptional = adminUserRepository.findByUsername(username);
                
                if (adminOptional.isPresent()) {
                    AdminUser admin = adminOptional.get();
                    
                    // 检查管理员状态
                    if (admin.getStatus() != 1) {
                        log.warn("管理员账号已禁用: {}", username);
                        response.sendError(HttpServletResponse.SC_FORBIDDEN, "管理员账号已禁用");
                        return;
                    }

                    AdminAuthUser adminAuthUser = AdminAuthUser.builder()
                        .id(admin.getId())
                        .username(admin.getUsername())
                        .status(admin.getStatus())
                        .build();
                    
                    UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                            adminAuthUser,
                            null,
                            List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
                    );
                    
                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                    log.debug("成功设置管理员认证信息: {}", username);
                } else {
                    log.warn("JWT有效但管理员不存在: {}", username);
                    response.sendError(HttpServletResponse.SC_FORBIDDEN, "无效的管理员凭证");
                    return;
                }
            }
        } catch (Exception e) {
            log.error("无法设置管理员认证", e);
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