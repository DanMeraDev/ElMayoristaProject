package com.elmayorista.user;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO para actualizar los permisos de crédito de un vendedor
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdatePermissionsRequest {

    /**
     * Permiso para que el vendedor solicite crédito para sí mismo
     */
    private Boolean canCreditSelf;

    /**
     * Permiso para que el vendedor otorgue crédito a clientes
     */
    private Boolean canCreditCustomers;
}
