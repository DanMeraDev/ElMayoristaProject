package com.elmayorista.report;

import com.fasterxml.jackson.annotation.JsonProperty;

public record ProductData(
        @JsonProperty("cantidad") int quantity,
        @JsonProperty("descripcion") String description,
        @JsonProperty("sku") String sku,
        @JsonProperty("precioUnitario") double unitPrice,
        @JsonProperty("total") double total
) {}
