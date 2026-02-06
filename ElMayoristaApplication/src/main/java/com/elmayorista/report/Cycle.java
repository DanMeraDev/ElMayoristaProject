package com.elmayorista.report;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Entity representing a closed billing cycle.
 * Stores summary data for historical reporting.
 */
@Entity
@Table(name = "cycles")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Cycle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "start_date", nullable = false)
    private LocalDateTime startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDateTime endDate;

    @Column(name = "total_sales", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal totalSales = BigDecimal.ZERO;

    @Column(name = "total_commissions", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal totalCommissions = BigDecimal.ZERO;

    @Column(name = "sales_count", nullable = false)
    @Builder.Default
    private Integer salesCount = 0;

    @Column(name = "excel_report_url", columnDefinition = "TEXT")
    private String excelReportUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private CycleStatus status = CycleStatus.CLOSED;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
