package com.elmayorista.report;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.Date;

public record OrderData(
        @JsonProperty("numeroPedido") String orderNumber,
        @JsonProperty("vendedor") String vendor,
        @JsonProperty("fecha") Date date
) {}
