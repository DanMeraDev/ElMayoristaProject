package com.elmayorista.dto;

import com.elmayorista.report.CycleStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO for Cycle entity.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CycleDTO {

    private Long id;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private BigDecimal totalSales;
    private BigDecimal totalCommissions;
    private Integer salesCount;
    private String excelReportUrl;
    private CycleStatus status;
    private LocalDateTime createdAt;
}
