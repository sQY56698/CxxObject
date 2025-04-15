package com.flowerwine.cxx.annotation;

import java.lang.annotation.*;

/**
 * 标记参数为当前JWT认证的用户
 * 可以用在控制器方法的参数上，自动注入当前已认证用户
 */
@Target(ElementType.PARAMETER)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface CurrentUser {
    /**
     * 是否必须，如果为true且用户未登录，则抛出异常；否则返回null
     */
    boolean required() default true;
}