package com.elmayorista.config;

import com.elmayorista.payment.Payment;
import com.elmayorista.payment.PaymentDTO;
import com.elmayorista.payment.PaymentRepository;
import com.elmayorista.sale.*;
import com.elmayorista.user.User;
import com.elmayorista.user.UserDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class Mapper {

    private final PaymentRepository paymentRepository;

    public UserDTO toUserDTO(User user) {
        if (user == null) return null;

        return UserDTO.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phoneNumber(user.getPhoneNumber())
                .roles(user.getRoles())
                .enabled(user.isEnabled())
                .pendingApproval(user.isPendingApproval())
                .commissionPercentage(user.getCommissionPercentage())
                .createdAt(user.getCreatedAt())
                .build();
    }

    public PaymentDTO toPaymentDTO(Payment payment) {
        if (payment == null) return null;

        return PaymentDTO.builder()
                .id(payment.getId())
                .saleId(payment.getSale().getId())
                .amount(payment.getAmount())
                .paymentMethod(payment.getPaymentMethod())
                .paymentDate(payment.getPaymentDate())
                .registeredBy(payment.getRegisteredBy().getFullName())
                .notes(payment.getNotes())
                .receiptUrl(payment.getReceiptUrl())
                .build();
    }

    public SaleDTO toSaleDTO(Sale sale) {
        if (sale == null) return null;

        BigDecimal totalPaid = paymentRepository.sumAmountBySale(sale);
        BigDecimal remainingAmount = sale.getTotal().subtract(totalPaid);

        return SaleDTO.builder()
                .id(sale.getId())
                .orderNumber(sale.getOrderNumber())
                .customerName(sale.getCustomerName())
                .customerIdNumber(sale.getCustomerIdNumber())
                .customerAddress(sale.getCustomerAddress())
                .customerCity(sale.getCustomerCity())
                .customerPhone(sale.getCustomerPhone())
                .customerEmail(sale.getCustomerEmail())
                .subtotal(sale.getSubtotal())
                .shipping(sale.getShipping())
                .total(sale.getTotal())
                .commissionAmount(sale.getCommissionAmount())
                .commissionPercentage(sale.getCommissionPercentage())
                .saleType(sale.getSaleType())
                .tvSerialNumber(sale.getTvSerialNumber())
                .tvModel(sale.getTvModel())
                .status(sale.getStatus())
                .paymentStatus(sale.getPaymentStatus())
                .totalPaid(totalPaid)
                .remainingAmount(remainingAmount)
                .orderDate(sale.getOrderDate())
                .reportPdfUrl(sale.getReportPdfUrl())
                .createdAt(sale.getCreatedAt())
                .sellerName(sale.getSeller() != null ? sale.getSeller().getFullName() : null)
                .sellerEmail(sale.getSeller() != null ? sale.getSeller().getEmail() : null)
                .products(sale.getDetails().stream().map(this::toSaleDetailDTO).collect(Collectors.toList()))
                .payments(sale.getPayments().stream().map(this::toPaymentDTO).collect(Collectors.toList()))
                .rejectionReason(sale.getRejectionReason())
                .commissionSettled(sale.isCommissionSettled())
                .build();
    }

    public SaleDetailDTO toSaleDetailDTO(SaleDetail detail) {
        if (detail == null) return null;

        return SaleDetailDTO.builder()
                .id(detail.getId())
                .sku(detail.getSku())
                .productName(detail.getProductName())
                .quantity(detail.getQuantity())
                .unitPrice(detail.getUnitPrice())
                .subtotal(detail.getSubtotal())
                .build();
    }

    public SaleResponseDTO toSaleResponseDTO(Sale sale, List<ProductDTO> products) {
        if (sale == null) return null;

        return SaleResponseDTO.builder()
                .id(sale.getId())
                .orderNumber(sale.getOrderNumber())
                .customerName(sale.getCustomerName())
                .subtotal(sale.getSubtotal())
                .total(sale.getTotal())
                .products(products)
                .status(sale.getStatus())
                .commissionAmount(sale.getCommissionAmount())
                .commissionPercentage(sale.getCommissionPercentage())
                .orderDate(sale.getOrderDate())
                .build();
    }
    
    public Sale toSaleEntity(SaleCreateDTO dto) {
        if (dto == null) return null;
        
        return Sale.builder()
                .orderNumber(dto.getOrderNumber())
                .customerName(dto.getCustomerName())
                .subtotal(dto.getSubtotal())
                .shipping(dto.getShipping())
                .total(dto.getTotal())
                .orderDate(dto.getOrderDate())
                .build();
    }
}

