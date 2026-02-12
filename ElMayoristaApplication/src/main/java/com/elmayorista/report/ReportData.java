package com.elmayorista.report;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public record ReportData(
        @JsonProperty("cliente") ClientData client,
        @JsonProperty("orden") OrderData order,
        @JsonProperty("productos") List<ProductData> products,
        @JsonProperty("totalGeneral") double grandTotal
) {}
