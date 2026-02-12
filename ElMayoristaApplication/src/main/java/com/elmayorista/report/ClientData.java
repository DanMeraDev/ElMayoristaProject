package com.elmayorista.report;

import com.fasterxml.jackson.annotation.JsonProperty;

public record ClientData(
        @JsonProperty("nombre") String name,
        @JsonProperty("cedula") String id,
        @JsonProperty("direccion") String address,
        @JsonProperty("telefono") String phone
) {}
