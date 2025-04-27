package com.flowerwine.cxx.config;

import com.flowerwine.cxx.annotation.CurrentAdmin;
import com.flowerwine.cxx.security.AdminAuthUser;
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

@Slf4j
@Component
public class CurrentAdminArgumentResolver implements HandlerMethodArgumentResolver {

    @Override
    public boolean supportsParameter(MethodParameter parameter) {
        return parameter.getParameterType().equals(AdminAuthUser.class) && 
               parameter.hasParameterAnnotation(CurrentAdmin.class);
    }

    @Override
    public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer,
                                  NativeWebRequest webRequest, WebDataBinderFactory binderFactory) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication == null || !authentication.isAuthenticated() || 
            authentication.getPrincipal().equals("anonymousUser")) {
            boolean required = parameter.getParameterAnnotation(CurrentAdmin.class).required();
            if (required) {
                log.warn("尝试获取当前管理员但未认证");
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "管理员未登录");
            } else {
                return null;
            }
        }
        
        try {
            AdminAuthUser adminAuthUser = (AdminAuthUser) authentication.getPrincipal();
            log.debug("成功解析当前管理员: {}", adminAuthUser.getUsername());
            return adminAuthUser;
        } catch (ClassCastException e) {
            log.error("无法将认证主体转换为AdminAuthUser对象", e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "管理员认证信息无效");
        }
    }
} 