package com.elmayorista.sale;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TvSaleCreateDTO {

    @NotBlank(message = "El nombre del cliente es obligatorio")
    private String customerName;

    private String customerIdNumber;
    private String customerAddress;
    private String customerCity;
    private String customerPhone;
    private String customerEmail;

    @NotBlank(message = "El numero de serie es obligatorio")
    private String tvSerialNumber;

    @NotBlank(message = "El modelo del televisor es obligatorio")
    private String tvModel;

    @NotNull(message = "El precio es obligatorio")
    @Positive(message = "El precio debe ser positivo")
    private BigDecimal price;

    private BigDecimal shipping;
}
