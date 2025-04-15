package com.flowerwine.cxx.repository;

import com.flowerwine.cxx.entity.SignRewardRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SignRewardRuleRepository extends JpaRepository<SignRewardRule, Long> {
    Optional<SignRewardRule> findByContinuousDays(Integer continuousDays);
}