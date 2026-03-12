package com.elmayorista.fiado;

public enum FiadoStatus {
    PENDING,   // Creado, esperando aprobación del admin
    APPROVED,  // Aprobado por admin, fiado activo
    REJECTED,  // Rechazado por admin
    SETTLED    // Liquidado en cierre de ciclo
}
