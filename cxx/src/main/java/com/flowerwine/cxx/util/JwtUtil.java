package com.flowerwine.cxx.util;

import com.flowerwine.cxx.config.AppProperties;
import com.flowerwine.cxx.dto.JwtTokenDTO;
import com.flowerwine.cxx.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Component
@RequiredArgsConstructor
public class JwtUtil {

    private final AppProperties appProperties;

    // 生成密钥
    private Key getSigningKey() {
        byte[] keyBytes = appProperties.getJwt().getSecret().getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    // 从token中提取用户名
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    // 从token中提取过期时间
    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    // 从token中提取指定信息
    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    // 解析token
    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    // 检查token是否过期
    private Boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    // 为用户生成token
    public String generateToken(JwtTokenDTO jwtTokenDTO) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", jwtTokenDTO.getUserId());
        claims.put("email", jwtTokenDTO.getEmail());
        claims.put("avatar", jwtTokenDTO.getAvatar());
        claims.put("username", jwtTokenDTO.getUsername());
        return Jwts.builder()
                .setClaims(claims)
                .setSubject(jwtTokenDTO.getUsername())
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + appProperties.getJwt().getExpiration()))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    // 验证token
    public Boolean validateToken(String token) {
        try {
            // 从 token 中提取用户名
            String username = extractUsername(token);
            
            // 检查 token 是否过期
            return !isTokenExpired(token);
        } catch (Exception e) {
            return false;
        }
    }

    // 获取用户ID
    public Long extractUserId(String token) {
        Claims claims = extractAllClaims(token);
        return claims.get("userId", Long.class);
    }
}