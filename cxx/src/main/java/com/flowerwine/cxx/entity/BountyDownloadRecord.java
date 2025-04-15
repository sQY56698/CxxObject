package com.flowerwine.cxx.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "bounty_download_record")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BountyDownloadRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "bounty_id", nullable = false)
    private Long bountyId;
    
    @Column(name = "user_id", nullable = false)
    private Long userId;
    
    @Column(name = "file_id", nullable = false)
    private Long fileId;
    
    @Column(name = "download_time", nullable = false, updatable = false)
    private LocalDateTime downloadTime = LocalDateTime.now();
    
    @PrePersist
    public void prePersist() {
        this.downloadTime = LocalDateTime.now();
    }
}