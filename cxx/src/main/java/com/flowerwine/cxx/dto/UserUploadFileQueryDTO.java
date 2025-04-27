package com.flowerwine.cxx.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;


@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class UserUploadFileQueryDTO {
    private Long userId;
    private Boolean isFree;
    private String keyword;
    private List<Byte> status;
    private Integer page;
    private Integer size;
}
