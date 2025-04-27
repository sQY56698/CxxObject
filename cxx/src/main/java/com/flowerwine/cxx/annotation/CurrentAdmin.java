package com.flowerwine.cxx.annotation;

import java.lang.annotation.*;

/**
 * 标记参数为当前JWT认证的管理员
 */
@Target(ElementType.PARAMETER)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface CurrentAdmin {
    /**
     * 是否必须，如果为true且管理员未登录，则抛出异常；否则返回null
     */
    boolean required() default true;
} 