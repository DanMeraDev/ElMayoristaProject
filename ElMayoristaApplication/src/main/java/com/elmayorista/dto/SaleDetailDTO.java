package com.elmayorista.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class SaleDetailDTO {
    private Long id;
    private String sku;
    private String productName;
    private BigDecimal quantity;
    private BigDecimal unitPrice;
    private BigDecimal subtotal;
}
