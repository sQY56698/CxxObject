package com.flowerwine.cxx.dto;

import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UnreadCountDTO {
    private Long systemMessageCount; // 未读系统消息数量
    private Long privateMessageCount; // 未读私信总数
    private Long totalCount; // 总未读消息数量
} 