package com.flowerwine.cxx.repository;

import com.flowerwine.cxx.entity.PointAction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PointActionRepository extends JpaRepository<PointAction, Long> {
    Optional<PointAction> findByActionCode(Integer actionCode);
}