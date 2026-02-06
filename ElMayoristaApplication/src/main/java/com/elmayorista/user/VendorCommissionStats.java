package com.elmayorista.user;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Clase DTO para estadísticas de comisiones de un vendedor
 * Utilizada para el dashboard del vendedor
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VendorCommissionStats {

    private UUID vendorId;

    // Comisiones por estado
    private BigDecimal earnedCommission;
    private BigDecimal receivedCommission; // Comisiones ya liquidadas (Settled)
    private BigDecimal pendingReviewCommission;
    private BigDecimal pendingPaymentCommission;

    // Contadores de ventas
    private int totalSalesCount;
    private int approvedSalesCount;
    private int underReviewSalesCount;
    private int pendingSalesCount;

    // Porcentaje de comisión actual
    private BigDecimal commissionPercentage;

    // Método de conveniencia para obtener comisiones totales
    public BigDecimal getTotalCommissions() {
        return earnedCommission
                .add(receivedCommission)
                .add(pendingReviewCommission)
                .add(pendingPaymentCommission);
    }
}
