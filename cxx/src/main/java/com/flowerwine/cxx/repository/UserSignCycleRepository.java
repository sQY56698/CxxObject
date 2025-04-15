package com.flowerwine.cxx.repository;

import com.flowerwine.cxx.entity.UserSignCycle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserSignCycleRepository extends JpaRepository<UserSignCycle, Long> {
    Optional<UserSignCycle> findByUserIdAndStatus(Long userId, Integer status);
}