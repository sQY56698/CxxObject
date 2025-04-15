package com.flowerwine.cxx.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import java.util.Arrays;
import java.util.List;

/**
 * 应用配置属性类
 * 集中管理所有配置项，以便于统一管理和注入
 */
@Data
@Configuration
@ConfigurationProperties(prefix = "app")
public class AppProperties {

    private final File file = new File();
    private final Jwt jwt = new Jwt();
    private final Captcha captcha = new Captcha();

    /**
     * 文件相关配置
     */
    @Data
    public static class File {
        /** 文件上传基础路径 */
        private String uploadLocation = "/uploads";
        /** 单个文件最大大小 */
        private String maxFileSize = "10GB";
        /** 请求最大大小 */
        private String maxRequestSize = "2MB";
        /** 头像保存路径 */
        private String avatarLocation = "/uploads/avatars";
        /** 临时文件路径 */
        private String tempLocation = "/uploads/temp";
        
        /** 头像配置 */
        private final Avatar avatar = new Avatar();
        
        @Data
        public static class Avatar {
            /** 头像文件大小限制 */
            private String maxSize = "2MB";
            /** 允许的头像文件类型 */
            private List<String> allowedTypes = Arrays.asList(
                "image/jpeg",
                "image/png",
                "image/gif"
            );
            /** 头像最大宽度 */
            private int width = 300;
            /** 头像最大高度 */
            private int height = 300;
            /** 头像最小宽度 */
            private int minWidth = 100;
            /** 头像最小高度 */
            private int minHeight = 100;
        }
    }

    /**
     * JWT配置
     */
    @Data
    public static class Jwt {
        /** JWT密钥 */
        private String secret = "MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCt+tQ/C64lisyZ58UMhp2+h1vvCHMDNVgGUilUewQf2EXv2zKcDDpwfPqNy9p0R0pZp0ic8RyrfbCMTH24WcBmdJeu0P0/ky8CqpkGs/zxoZc8I8PinwnOtgTzb8uKMsBo1TeVUnS6PntkV9ciE69K1UDYhx4Pxk/uJwjwU5tW09p9FTfglcYpepMIeRIUI+NAv2HPpN00yD50wXiFWYI8AQBQr5hZ+uVCblYhnP836KvcRgxUJ0KkmBHNNcy4Zuzs+c7V6yNwWZBnuWhGaKJLHSglP/WsXcqHaeotQYU5mkDhIoNyf/84qlbbxrSAvSuMfEYsAwrOlBx3pVa/XlWzAgMBAAECggEAEfaAXIQJtnGWv1s5Mpphhg72tH7UVSP4Uyq/fqv22IzdZ67jkk4G6J9WxTYjd3b227vUWPPiCGjBRjMNle+aWFm4YYHNa/d31pgjlZgWySHsefadXnQaMKAFcdb8lme4CvrcssuhJquV1N3m5etPYXQULmcA+RL6JLYeC6YuNzAbtxOHACtWEzeE3/HnLrop/ilZQ6oedN0ThLHgCRTZPQmReUSrGEknlVJ2Y+8ZSaVdZwY2hB9eIMeOZ8rOn+A+Mkh5cVl7NHeZy+QwE3aCWK3siuktRT1AlZXZ7gabIXhNlJ9hleaCvUVfMerPGjyZKUwbJQ6+pHUW9Ff3AYHEcQKBgQDlbXRaRSot/OYycCCNEQIpWSVIiiQUYYPpIrnQEO8LwULScYorl5VdXERnHSq82nnN+xbl356yCLIlbHZxc6GMO3eiBMtOicQUKHrMm5HkgFuvwDOWnOeW31Plq42rJaLZt24erd7GiHvaF+Hyx4khmUGaga/jzBGW98yvAh5bIwKBgQDCIVgb6U59w67M7rpaH4M7yyNmKt9rldyskrD5D3/iI4tK8+4nxZWHDHfrVSBl8CU42rXV861ZMkKbuQYW290nPgjL/SV8Vaa/D6trFV/lEy15879uHwxZuSHlkERepL0UsFYfrG6AG2qRcvySd75rJe9O/HJM99AotySXt8XMMQKBgGSdVMqFzJKwdy+ldtEGpYEGpFAkrN/3SAdFAGIcGwl3rttliafGaW2xGhpycxyxX3uS4x7aq9j98UpyP5tPj4hVSAjYu2RtDH2epwP2McwY8pyn2Lfzhajntf5h9tYYwktiozt3GtzMXCxwDtoO4bfHYzrkJwPqqcggUjZp4nArAoGBAJxSR2XqX/crrMV+8vaBa6apdC7gFRrICXO5h+J2la7emlrXxA2osDiYVLRezwDm+MIoc8X+O7eYnkRRIFMl5pakAGdqyFWvjt9JWeqXwqlu4O7T1XFydPqG9oGpwzRHCa7wM9m7exuTeCP5aOL0o5QabvK2m7/YyXkPyNqW9CLxAoGBANSJL8bDPGqRlVK8bdjPIyYbsmi3j1uAwrTNBSTpqaBzEn3bOHIvAsRRm0XLxD7CaTbZ489RPDy5VBG9yJlESr9ZWRpqfH2m8DYeOC5PCtSj8JE/WsRkSKRRkQq593tibZNT+/6UJ2hu/8htztYkqScFwFci8Jb4fEqXewODZjIj";
        /** JWT有效期（毫秒） */
        private long expiration = 86400000; // 24小时
    }

    /**
     * 验证码配置
     */
    @Data
    public static class Captcha {
        /** 验证码文本长度 */
        private int textLength = 4;
        /** 验证码文本字体 */
        private String fontNames = "Arial,Courier";
        /** 验证码图片宽度 */
        private int width = 120;
        /** 验证码图片高度 */
        private int height = 40;
        /** 验证码文本字符大小 */
        private int fontSize = 30;
        /** 验证码颜色 */
        private String textColor = "black";
        /** 验证码背景颜色(起始) */
        private String backgroundFrom = "white";
        /** 验证码背景颜色(结束) */
        private String backgroundTo = "white";
        /** 是否添加噪点 */
        private boolean noNoise = true;
    }
}