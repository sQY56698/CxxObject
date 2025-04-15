package com.flowerwine.cxx.service;

import com.flowerwine.cxx.dto.UserPointsDTO;
import com.flowerwine.cxx.entity.PointsRecord;
import com.flowerwine.cxx.entity.UserPoints;
import com.flowerwine.cxx.entity.User;
import com.flowerwine.cxx.enums.PointActionEnum;
import com.flowerwine.cxx.repository.PointsRecordRepository;
import com.flowerwine.cxx.repository.UserPointsRepository;
import com.flowerwine.cxx.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class PointsService {
    private final UserPointsRepository userPointsRepository;
    private final PointsRecordRepository pointsRecordRepository;
    private final UserRepository userRepository;

    /**
     * 获取用户积分信息
     */
    public UserPointsDTO getUserPoints(Long userId) {
        UserPoints userPoints = userPointsRepository.findByUserId(userId)
                .orElseGet(() -> createUserPoints(userId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "用户不存在"));

        return UserPointsDTO.builder()
                .userId(userId)
                .points(userPoints.getPoints())
                .totalPoints(userPoints.getTotalPoints())
                .username(user.getUsername())
                .build();
    }

    /**
     * 更新用户积分
     */
    @Transactional
    public void updatePoints(Long userId, Integer points, Integer pointActionId, String description) {
        // 确保用户存在
        if (!userRepository.existsById(userId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "用户不存在");
        }

        // 获取或创建用户积分记录
        UserPoints userPoints = userPointsRepository.findByUserId(userId)
                .orElseGet(() -> createUserPoints(userId));

        // 检查积分是否足够（如果是扣减积分）
        if (points < 0 && userPoints.getPoints() + points < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "积分不足");
        }

        // 更新积分
        userPoints.setPoints(userPoints.getPoints() + points);
        if (points > 0) {
            userPoints.setTotalPoints(userPoints.getTotalPoints() + points);
        }
        userPointsRepository.save(userPoints);

        // 记录积分变动
        PointsRecord record = PointsRecord.builder()
            .userId(userId)
            .points(points)
            .pointActionId(pointActionId)
            .description(description)
            .build();
        pointsRecordRepository.save(record);
    }

    /**
     * 获取用户积分变动记录
     */
    public Page<PointsRecord> getPointsRecords(Long userId, Pageable pageable) {
        return pointsRecordRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
    }

    /**
     * 创建用户积分记录
     */
    private UserPoints createUserPoints(Long userId) {
        UserPoints userPoints = UserPoints.builder()
            .userId(userId)
            .points(0)
            .totalPoints(0)
            .build();
        return userPointsRepository.save(userPoints);
    }

    /**
     * 获取用户积分实体
     */
    public UserPoints getUserPointsEntity(Long userId) {
        return userPointsRepository.findByUserId(userId)
                .orElseGet(() -> createUserPoints(userId));
    }

    /**
     * 更改用户积分
     */
    @Transactional
    public void changePoints(Long userId, Integer points, PointActionEnum action, String description) {
        updatePoints(userId, points, action.getCode(), description);
    }
} 