package com.flowerwine.cxx.service;

import com.flowerwine.cxx.dto.CalendarSignDTO;
import com.flowerwine.cxx.dto.SignResultDTO;
import com.flowerwine.cxx.dto.SignRewardDTO;
import com.flowerwine.cxx.entity.PointAction;
import com.flowerwine.cxx.entity.SignRewardRule;
import com.flowerwine.cxx.entity.UserSignCycle;
import com.flowerwine.cxx.entity.UserSignRecord;
import com.flowerwine.cxx.enums.PointActionEnum;
import com.flowerwine.cxx.enums.SignStatusEnum;
import com.flowerwine.cxx.repository.PointActionRepository;
import com.flowerwine.cxx.repository.SignRewardRuleRepository;
import com.flowerwine.cxx.repository.UserSignCycleRepository;
import com.flowerwine.cxx.repository.UserSignRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.TreeMap;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SignService {
    private final UserSignRecordRepository userSignRecordRepository;
    private final UserSignCycleRepository userSignCycleRepository;
    private final SignRewardRuleRepository signRewardRuleRepository;
    private final PointActionRepository pointActionRepository;
    private final PointsService pointsService;

    /**
     * 用户签到
     */
    @Transactional
    public SignResultDTO signIn(Long userId) {
        // 1. 获取当前日期
        LocalDate today = LocalDate.now();
        int year = today.getYear();
        int month = today.getMonthValue();
        int day = today.getDayOfMonth();

        // 2. 检查用户今天是否已经签到，防止重复签到
        UserSignRecord signRecord = userSignRecordRepository
                .findByUserIdAndYearAndMonth(userId, year, month)
                .orElseGet(() -> createUserSignRecord(userId, year, month));

        // 检查是否今天已签到
        if ((signRecord.getSignBitmap() & (1L << (day - 1))) != 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "今天已经签到过了");
        }

        // 3. 更新签到位图
        signRecord.setSignBitmap(signRecord.getSignBitmap() | (1L << (day - 1)));
        userSignRecordRepository.save(signRecord);

        // 4. 更新或创建周期签到记录
        UserSignCycle signCycle = updateSignCycle(userId, today);

        // 5. 处理签到积分奖励
        int totalPoints = processSignReward(userId, signCycle.getCurrentSignDay());

        // 6. 构建返回结果
        return SignResultDTO.builder()
            .userId(userId)
            .signDate(today)
            .continuousDays(signCycle.getCurrentSignDay())
            .earnedPoints(totalPoints)
            .cycleCompleted(signCycle.getCurrentSignDay() >= signCycle.getCycleLength())
            .build();
    }

    /**
     * 更新周期签到记录
     */
    private UserSignCycle updateSignCycle(Long userId, LocalDate today) {
        UserSignCycle activeCycle = userSignCycleRepository
                .findByUserIdAndStatus(userId, 1)
                .orElse(null);

        if (activeCycle == null) {
            // 创建新周期
            return createNewCycle(userId, today);
        }

        // 检查是否连续签到（上次签到是否为昨天）
        boolean isContinuous = activeCycle.getLastSignDate().plusDays(1).equals(today);
        
        if (!isContinuous) {
            // 断签，结束当前周期并创建新周期
            activeCycle.setStatus(0); // 设置为已结束
            userSignCycleRepository.save(activeCycle);
            return createNewCycle(userId, today);
        }

        // 连续签到，更新当前周期
        activeCycle.setCurrentSignDay(activeCycle.getCurrentSignDay() + 1);
        activeCycle.setLastSignDate(today);
        
        // 如果完成了当前周期
        if (activeCycle.getCurrentSignDay() >= activeCycle.getCycleLength()) {
            // 可以在这里添加周期完成的逻辑
        }
        
        return userSignCycleRepository.save(activeCycle);
    }

    /**
     * 创建新的签到周期
     */
    private UserSignCycle createNewCycle(Long userId, LocalDate startDate) {
        UserSignCycle cycle = UserSignCycle.builder()
            .userId(userId)
            .cycleStartDate(startDate)
            .cycleLength(7) // 默认7天周期
            .currentSignDay(1) // 首日签到
            .lastSignDate(startDate)
            .status(SignStatusEnum.IN_PROGRESS.getCode()) // 进行中
            .build();
        return userSignCycleRepository.save(cycle);
    }

    /**
     * 处理签到积分奖励
     */
    private int processSignReward(Long userId, int continuousDays) {
        int totalPoints = 0;
        
        // 1. 处理每日签到基础积分
        PointAction signInAction = pointActionRepository
                .findByActionCode(PointActionEnum.SIGN_IN.getCode())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "签到积分规则未配置"));
        
        totalPoints += signInAction.getPoints();
        pointsService.updatePoints(userId, signInAction.getPoints(), signInAction.getActionCode(), "每日签到基础积分");
        
        // 2. 处理连续签到额外奖励
        SignRewardRule rewardRule = signRewardRuleRepository
                .findByContinuousDays(continuousDays)
                .orElse(null);
        
        if (rewardRule != null) {
            PointAction continuousAction = pointActionRepository
                    .findByActionCode(PointActionEnum.CONTINUOUS_SIGN.getCode())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "连续签到积分规则未配置"));
            
            totalPoints += rewardRule.getRewardPoints();
            pointsService.updatePoints(userId, rewardRule.getRewardPoints(), continuousAction.getActionCode(),
                    "连续签到" + continuousDays + "天奖励");
        }
        
        return totalPoints;
    }
    
    /**
     * 创建用户签到记录
     */
    private UserSignRecord createUserSignRecord(Long userId, int year, int month) {
        UserSignRecord record = UserSignRecord.builder()
            .userId(userId)
            .year(year)
            .month(month)
            .signBitmap(0L)
            .build();
        return userSignRecordRepository.save(record);
    }
    
    /**
     * 获取用户某月签到日历
     */
    public CalendarSignDTO getMonthlySignCalendar(Long userId, Integer year, Integer month) {
        // 如果未指定年月，默认当前年月
        if (year == null || month == null) {
            LocalDate today = LocalDate.now();
            year = today.getYear();
            month = today.getMonthValue();
        }
        
        // 查询数据库中的签到记录
        UserSignRecord record = userSignRecordRepository
                .findByUserIdAndYearAndMonth(userId, year, month)
                .orElse(null);
        
        // 获取这个月的总天数
        int daysInMonth = YearMonth.of(year, month).lengthOfMonth();
        
        // 构建签到日历
        Map<Integer, Boolean> signDays = new TreeMap<>();
        for (int day = 1; day <= daysInMonth; day++) {
            boolean signed = false;
            if (record != null) {
                signed = (record.getSignBitmap() & (1L << (day - 1))) != 0;
            }
            signDays.put(day, signed);
        }
        
        // 构建返回对象
        return CalendarSignDTO.builder()
            .userId(userId)
            .year(year)
            .month(month)
            .signDays(signDays)
            .build();
    }

    /**
     * 检查今日是否已签到
     */
    public boolean isTodaySigned(Long userId) {
        LocalDate today = LocalDate.now();
        UserSignRecord record = userSignRecordRepository
                .findByUserIdAndYearAndMonth(userId, today.getYear(), today.getMonthValue())
                .orElse(null);
        
        if (record == null) {
            return false;
        }
        
        return (record.getSignBitmap() & (1L << (today.getDayOfMonth() - 1))) != 0;
    }

    /**
     * 获取用户当前签到周期状态
     */
    public UserSignCycle getCurrentCycleStatus(Long userId) {
        return userSignCycleRepository
                .findByUserIdAndStatus(userId, 1)
                .orElse(null);
    }

    /**
     * 获取签到奖励规则
     */
    public List<SignRewardDTO> getSignRewards() {
        List<SignRewardDTO> rewards = new ArrayList<>();
        
        // 获取基础签到积分
        PointAction signInAction = pointActionRepository
                .findByActionCode(PointActionEnum.SIGN_IN.getCode())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "签到积分规则未配置"));
        
        // 获取所有连续签到规则
        List<SignRewardRule> rewardRules = signRewardRuleRepository.findAll();
        Map<Integer, Integer> extraPointsMap = rewardRules.stream()
                .collect(Collectors.toMap(
                    SignRewardRule::getContinuousDays,
                    SignRewardRule::getRewardPoints
                ));
        
        // 生成7天的奖励数据
        for (int day = 1; day <= 7; day++) {
            int basePoints = signInAction.getPoints();
            int extraPoints = extraPointsMap.getOrDefault(day, 0);
            
            rewards.add(SignRewardDTO.builder()
                .day(day)
                .basePoints(basePoints)
                .extraPoints(extraPoints)
                .totalPoints(basePoints + extraPoints)
                .build());
        }
        
        return rewards;
    }
}