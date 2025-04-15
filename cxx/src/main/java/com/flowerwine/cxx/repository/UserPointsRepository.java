package com.flowerwine.cxx.repository;

import com.flowerwine.cxx.entity.UserPoints;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface UserPointsRepository extends JpaRepository<UserPoints, Long> {
    Optional<UserPoints> findByUserId(Long userId);

    @Modifying
    @Query("UPDATE UserPoints up SET up.points = up.points + :points, " +
           "up.totalPoints = CASE WHEN :points > 0 THEN up.totalPoints + :points ELSE up.totalPoints END " +
           "WHERE up.userId = :userId")
    void updatePoints(Long userId, Integer points);
} 