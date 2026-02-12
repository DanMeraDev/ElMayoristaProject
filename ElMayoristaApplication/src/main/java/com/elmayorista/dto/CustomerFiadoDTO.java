package com.elmayorista.dto;

import com.elmayorista.fiado.FiadoStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerFiadoDTO {
    private Long id;
    private String customerName;
    private Long customerId;
    private String sellerName;
    private String itemName;
    private BigDecimal price;
    private FiadoStatus status;
    private boolean settledInCycle;
    private LocalDateTime createdAt;
}
