package com.flowerwine.cxx.config;

import com.flowerwine.cxx.annotation.CurrentUser;
import com.flowerwine.cxx.security.AuthUser;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.MethodParameter;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;
import org.springframework.web.server.ResponseStatusException;

/**
 * 当前用户参数解析器
 * 用于解析@CurrentUser注解标记的参数
 */
@Slf4j
@Component
public class CurrentUserArgumentResolver implements HandlerMethodArgumentResolver {

    @Override
    public boolean supportsParameter(MethodParameter parameter) {
        return parameter.getParameterType().equals(AuthUser.class) && 
               parameter.hasParameterAnnotation(CurrentUser.class);
    }

    @Override
    public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer,
                                  NativeWebRequest webRequest, WebDataBinderFactory binderFactory) {
        // 从SecurityContext中获取当前认证信息
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        // 检查是否有认证信息
        if (authentication == null || !authentication.isAuthenticated() || 
            authentication.getPrincipal().equals("anonymousUser")) {
            // 检查是否是必须的
            boolean required = parameter.getParameterAnnotation(CurrentUser.class).required();
            if (required) {
                log.warn("尝试获取当前用户但未认证");
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "未登录");
            } else {
                return null;
            }
        }
        
        // 从Authentication中获取用户对象
        try {
            AuthUser authUser = (AuthUser) authentication.getPrincipal();
            log.debug("成功解析当前用户: {}", authUser.getUsername());
            return authUser;
        } catch (ClassCastException e) {
            log.error("无法将认证主体转换为AuthUser对象", e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "认证信息无效");
        }
    }
}