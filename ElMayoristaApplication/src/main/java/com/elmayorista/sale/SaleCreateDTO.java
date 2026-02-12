package com.elmayorista.sale;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
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
public class SaleCreateDTO {
    
    private String orderNumber;
    
    @NotBlank(message = "El nombre del cliente es obligatorio")
    private String customerName;
    
    @NotNull(message = "El subtotal es obligatorio")
    @Positive(message = "El subtotal debe ser positivo")
    private BigDecimal subtotal;
    
    private BigDecimal shipping;
    
    @NotNull(message = "El total es obligatorio")
    @Positive(message = "El total debe ser positivo")
    private BigDecimal total;
    
    private LocalDateTime orderDate;
}
