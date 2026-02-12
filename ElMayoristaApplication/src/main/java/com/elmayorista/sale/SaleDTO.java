package com.elmayorista.sale;

import com.elmayorista.payment.PaymentDTO;
import com.elmayorista.payment.PaymentStatus;
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
    private SaleType saleType;
    private String tvSerialNumber;
    private String tvModel;
    private SaleStatus status;
    private PaymentStatus paymentStatus;
    private BigDecimal totalPaid;
    private BigDecimal remainingAmount;
    private LocalDateTime orderDate;
    private String reportPdfUrl;
    private LocalDateTime createdAt;
    private String sellerName;
    private String sellerEmail;
    private List<SaleDetailDTO> products;
    private List<PaymentDTO> payments;
    private String rejectionReason;
    private boolean commissionSettled;
}
