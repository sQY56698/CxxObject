package com.flowerwine.cxx.controller;

import com.google.code.kaptcha.impl.DefaultKaptcha;
import jakarta.servlet.ServletOutputStream;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;

@RestController
@RequestMapping("/api/captcha")
public class CaptchaController {

    @Autowired
    private DefaultKaptcha defaultKaptcha;

    @GetMapping("/generate")
    public void generateCaptcha(HttpServletResponse response, HttpSession session) {
        try {
            // 清除浏览器缓存
            response.setDateHeader("Expires", 0);
            response.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
            response.addHeader("Cache-Control", "post-check=0, pre-check=0");
            response.setHeader("Pragma", "no-cache");
            response.setContentType("image/jpeg");

            // 生成验证码文本
            String captchaText = defaultKaptcha.createText();
            // 将验证码存入session
            session.setAttribute("captcha", captchaText);
            
            // 根据文本生成图片
            BufferedImage image = defaultKaptcha.createImage(captchaText);
            ServletOutputStream out = response.getOutputStream();
            // 输出图片流
            ImageIO.write(image, "jpg", out);
            out.flush();
            out.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
} 