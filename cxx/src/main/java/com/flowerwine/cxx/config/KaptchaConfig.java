package com.flowerwine.cxx.config;

import com.google.code.kaptcha.impl.DefaultKaptcha;
import com.google.code.kaptcha.util.Config;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Properties;

@Configuration
@RequiredArgsConstructor
public class KaptchaConfig {

    private final AppProperties appProperties;

    @Bean
    public DefaultKaptcha defaultKaptcha() {
        DefaultKaptcha defaultKaptcha = new DefaultKaptcha();
        Properties properties = new Properties();
        
        // 从集中配置中获取验证码配置
        properties.setProperty("kaptcha.textproducer.char.length", 
                String.valueOf(appProperties.getCaptcha().getTextLength()));
        properties.setProperty("kaptcha.textproducer.font.names", 
                appProperties.getCaptcha().getFontNames());
        properties.setProperty("kaptcha.image.width", 
                String.valueOf(appProperties.getCaptcha().getWidth()));
        properties.setProperty("kaptcha.image.height", 
                String.valueOf(appProperties.getCaptcha().getHeight()));
        properties.setProperty("kaptcha.textproducer.font.size", 
                String.valueOf(appProperties.getCaptcha().getFontSize()));
        
        if (appProperties.getCaptcha().isNoNoise()) {
            properties.setProperty("kaptcha.noise.impl", "com.google.code.kaptcha.impl.NoNoise");
        }
        
        properties.setProperty("kaptcha.textproducer.char.color", 
                appProperties.getCaptcha().getTextColor());
        properties.setProperty("kaptcha.background.clear.from", 
                appProperties.getCaptcha().getBackgroundFrom());
        properties.setProperty("kaptcha.background.clear.to", 
                appProperties.getCaptcha().getBackgroundTo());
        
        Config config = new Config(properties);
        defaultKaptcha.setConfig(config);
        return defaultKaptcha;
    }
} 