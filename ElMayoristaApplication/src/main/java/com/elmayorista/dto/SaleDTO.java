package com.elmayorista.dto;

import com.elmayorista.payment.PaymentStatus;
import com.elmayorista.sale.SaleStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class SaleDTO {
    private Long id;
    private String orderNumber;
    private String customerName;
    private String customerIdNumber;
    private String customerAddress;
    private String customerCity;
    private String customerPhone;
    private String customerEmail;
    private BigDecimal subtotal;
    private BigDecimal shipping;
    private BigDecimal total;
    private BigDecimal commissionAmount;
    private BigDecimal commissionPercentage;
    private SaleStatus status;
    private PaymentStatus paymentStatus; // Nuevo campo
    private BigDecimal totalPaid; // Nuevo campo
    private BigDecimal remainingAmount; // Nuevo campo
    private LocalDateTime orderDate;
    private String reportPdfUrl;
    private LocalDateTime createdAt;
    
    // Información simplificada del vendedor
    private String sellerName;
    private String sellerEmail;

    private List<SaleDetailDTO> products;
    private List<PaymentDTO> payments; // Nuevo campo

    // Campos para el nuevo flujo de revisión
    private String rejectionReason;
    private boolean commissionSettled;
}
