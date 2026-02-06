package com.elmayorista.dto;

import com.elmayorista.payment.PaymentMethod;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class CreatePaymentRequest {

    @NotNull(message = "El ID de la venta es obligatorio")
    private Long saleId;

    @NotNull(message = "El monto es obligatorio")
    @Positive(message = "El monto debe ser positivo")
    private BigDecimal amount;

    @NotNull(message = "El método de pago es obligatorio")
    private PaymentMethod paymentMethod;
    
    private String notes;
}
