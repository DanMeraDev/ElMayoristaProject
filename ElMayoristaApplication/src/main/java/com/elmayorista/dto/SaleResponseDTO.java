package com.elmayorista.dto;

import com.elmayorista.sale.SaleStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class SaleResponseDTO {
    private Long id;
    private String orderNumber;
    private String customerName;
    private BigDecimal subtotal;
    private BigDecimal total;
    private List<ProductDTO> products;
    private SaleStatus status;
    private BigDecimal commissionAmount;
    private BigDecimal commissionPercentage;
    private LocalDateTime orderDate;

}
