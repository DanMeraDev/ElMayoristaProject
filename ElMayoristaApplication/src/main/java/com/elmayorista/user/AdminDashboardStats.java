package com.elmayorista.user;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Clase DTO para estadísticas globales del sistema
 * Utilizada para el dashboard de administración
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminDashboardStats {
    
    // Contadores de vendedores
    private long pendingVendorsCount;
    private long totalVendorsCount;
    
    // Contadores de ventas
    private long pendingSalesCount;
    private long underReviewSalesCount;
    
    // Totales financieros
    private BigDecimal totalApprovedSales;
}
