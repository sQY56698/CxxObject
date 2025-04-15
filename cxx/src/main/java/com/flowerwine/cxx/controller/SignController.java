package com.flowerwine.cxx.controller;

import com.flowerwine.cxx.annotation.CurrentUser;
import com.flowerwine.cxx.dto.CalendarSignDTO;
import com.flowerwine.cxx.dto.SignResultDTO;
import com.flowerwine.cxx.dto.SignRewardDTO;
import com.flowerwine.cxx.entity.UserSignCycle;
import com.flowerwine.cxx.security.AuthUser;
import com.flowerwine.cxx.service.SignService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sign")
@RequiredArgsConstructor
public class SignController {
    private final SignService signService;

    /**
     * 用户签到
     */
    @PostMapping("/in")
    public ResponseEntity<SignResultDTO> signIn(@CurrentUser AuthUser authUser) {
        SignResultDTO result = signService.signIn(authUser.getId());
        return ResponseEntity.ok(result);
    }

    /**
     * 获取用户某月签到日历
     */
    @GetMapping("/calendar")
    public ResponseEntity<CalendarSignDTO> getMonthlySignCalendar(
            @CurrentUser AuthUser authUser,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month) {
        CalendarSignDTO calendar = signService.getMonthlySignCalendar(authUser.getId(), year, month);
        return ResponseEntity.ok(calendar);
    }

    /**
     * 检查今日是否已签到
     */
    @GetMapping("/check")
    public ResponseEntity<Boolean> isTodaySigned(@CurrentUser AuthUser authUser) {
        boolean signed = signService.isTodaySigned(authUser.getId());
        return ResponseEntity.ok(signed);
    }

    /**
     * 获取用户当前签到周期状态
     */
    @GetMapping("/cycle")
    public ResponseEntity<UserSignCycle> getCurrentCycleStatus(@CurrentUser AuthUser authUser) {
        UserSignCycle cycle = signService.getCurrentCycleStatus(authUser.getId());
        if (cycle == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(cycle);
    }

    @GetMapping("/rewards")
    public ResponseEntity<List<SignRewardDTO>> getSignRewards() {
        List<SignRewardDTO> rewards = signService.getSignRewards();
        return ResponseEntity.ok(rewards);
    }
}