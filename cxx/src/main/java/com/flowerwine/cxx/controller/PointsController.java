package com.flowerwine.cxx.controller;

import com.flowerwine.cxx.annotation.CurrentUser;
import com.flowerwine.cxx.dto.UserPointsDTO;
import com.flowerwine.cxx.entity.PointsRecord;
import com.flowerwine.cxx.entity.User;
import com.flowerwine.cxx.security.AuthUser;
import com.flowerwine.cxx.service.PointsService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/points")
@RequiredArgsConstructor
public class PointsController {
    private final PointsService pointsService;

    @GetMapping("/my")
    public ResponseEntity<UserPointsDTO> getMyPoints(@CurrentUser AuthUser user) {
        return ResponseEntity.ok(pointsService.getUserPoints(user.getId()));
    }

    @GetMapping("/records")
    public ResponseEntity<Page<PointsRecord>> getPointsRecords(
            @CurrentUser AuthUser user,
            Pageable pageable) {
        return ResponseEntity.ok(pointsService.getPointsRecords(user.getId(), pageable));
    }
} 