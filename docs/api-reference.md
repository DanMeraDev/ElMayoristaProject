# Referencia de API

Base URL: `http://localhost:8080/api`

Todas las rutas (excepto `/api/auth/**`) requieren el header:
```
Authorization: Bearer <JWT_TOKEN>
```

---

## Auth (`/api/auth`)

Endpoints publicos para autenticacion y gestion de contraseñas.

### POST `/api/auth/login`
Inicia sesion y retorna un token JWT.

**Body:**
```json
{
  "email": "usuario@email.com",
  "password": "contraseña123"
}
```

**Respuesta (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "usuario@email.com",
  "fullName": "Juan Perez",
  "roles": ["SELLER"],
  "pendingApproval": false,
  "enabled": true
}
```

**Errores:**
| Codigo | Descripcion |
|---|---|
| 401 | Credenciales invalidas |

---

### POST `/api/auth/register`
Registra un nuevo usuario (seller). El usuario queda con `pendingApproval = true`.

**Body:**
```json
{
  "email": "nuevo@email.com",
  "password": "contraseña123",
  "fullName": "Maria Lopez",
  "phoneNumber": "0987654321"
}
```

**Respuesta (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "id": "...",
  "email": "nuevo@email.com",
  "fullName": "Maria Lopez",
  "roles": ["SELLER"],
  "pendingApproval": true
}
```

**Errores:**
| Codigo | Descripcion |
|---|---|
| 400 | Datos de validacion incorrectos |
| 409 | Email ya registrado |

---

### POST `/api/auth/forgot-password`
Solicita un email de recuperacion de contraseña.

**Body:**
```json
{
  "email": "usuario@email.com"
}
```

**Respuesta (200):**
```json
{
  "message": "Si el correo existe, se enviarán las instrucciones."
}
```

---

### POST `/api/auth/reset-password`
Restablece la contraseña usando el token recibido por email.

**Body:**
```json
{
  "token": "abc123-reset-token",
  "newPassword": "nuevaContraseña456"
}
```

**Respuesta (200):**
```json
{
  "message": "Contraseña restablecida exitosamente."
}
```

---

## Users (`/api/users`)

Gestion de usuarios. Requiere autenticacion.

### GET `/api/users`
Obtiene todos los usuarios (paginado).

**Parametros de query:**
| Parametro | Tipo | Default | Descripcion |
|---|---|---|---|
| `page` | int | 0 | Numero de pagina |
| `size` | int | 20 | Elementos por pagina |

**Respuesta (200):** Pagina de objetos `User`

---

### GET `/api/users/me`
Obtiene el perfil del usuario autenticado.

**Respuesta (200):**
```json
{
  "id": "550e8400-...",
  "email": "usuario@email.com",
  "fullName": "Juan Perez",
  "phoneNumber": "0987654321",
  "roles": ["SELLER"],
  "enabled": true,
  "pendingApproval": false,
  "commissionPercentage": 5.00,
  "createdAt": "2026-01-15T10:30:00"
}
```

---

### GET `/api/users/{id}`
Obtiene un usuario por su UUID.

**Respuesta (200):** Objeto `User`

---

### GET `/api/users/{id}/sales`
Obtiene las ventas de un vendedor (paginado).

**Parametros de query:** `page`, `size`

**Respuesta (200):** Pagina de objetos `Sale`

---

### GET `/api/users/{id}/commission`
Obtiene la comision del vendedor para el mes actual.

**Respuesta (200):** `BigDecimal` (ej: `125.50`)

---

### GET `/api/users/{id}/commission-stats`
Obtiene estadisticas detalladas de comisiones del vendedor.

**Respuesta (200):**
```json
{
  "earnedCommission": 500.00,
  "pendingCommission": 150.00,
  "underReviewCommission": 75.00
}
```

---

### PUT `/api/users/{id}`
Actualiza los datos de un usuario.

**Body:** Objeto `User` con los campos a actualizar

**Respuesta (200):** Usuario actualizado

---

### DELETE `/api/users/{id}`
Elimina un usuario.

**Respuesta (204):** Sin contenido

---

## Sales (`/api/sales`)

Gestion de ventas. Requiere autenticacion.

### POST `/api/sales`
Crea una nueva venta manualmente.

**Body:**
```json
{
  "orderNumber": "ORD-2026-001",
  "customerName": "Cliente Ejemplo",
  "subtotal": 100.00,
  "shipping": 5.00,
  "total": 105.00,
  "orderDate": "2026-01-15T10:30:00"
}
```

**Respuesta (200):** Objeto `SaleDTO`

---

### POST `/api/sales/upload-pdf`
Crea una venta extrayendo datos de un archivo PDF (Odoo).

**Content-Type:** `multipart/form-data`

**Parametros:**
| Parametro | Tipo | Descripcion |
|---|---|---|
| `file` | File | Archivo PDF del reporte de venta |

**Respuesta (200):** Objeto `SaleDTO`

---

### GET `/api/sales/{id}`
Obtiene una venta por su ID.

**Respuesta (200):**
```json
{
  "id": 1,
  "orderNumber": "ORD-2026-001",
  "customerName": "Cliente Ejemplo",
  "customerIdNumber": "1234567890",
  "customerAddress": "Av. Principal 123",
  "customerCity": "Quito",
  "customerPhone": "0987654321",
  "customerEmail": "cliente@email.com",
  "subtotal": 100.00,
  "shipping": 5.00,
  "total": 105.00,
  "commissionAmount": 5.25,
  "commissionPercentage": 5.00,
  "status": "APPROVED",
  "paymentStatus": "PAID",
  "totalPaid": 105.00,
  "remainingAmount": 0.00,
  "orderDate": "2026-01-15T10:30:00",
  "reportPdfUrl": "https://r2.example.com/pdfs/abc123.pdf",
  "createdAt": "2026-01-15T10:30:00",
  "sellerName": "Juan Perez",
  "sellerEmail": "juan@email.com",
  "rejectionReason": null,
  "commissionSettled": false,
  "products": [
    {
      "id": 1,
      "sku": "PROD-001",
      "productName": "Producto Ejemplo",
      "quantity": 2,
      "unitPrice": 50.00,
      "subtotal": 100.00
    }
  ],
  "payments": [
    {
      "id": 1,
      "saleId": 1,
      "amount": 105.00,
      "paymentMethod": "BANK_TRANSFER",
      "paymentDate": "2026-01-16T14:00:00",
      "registeredBy": "Juan Perez",
      "notes": "Transferencia bancaria",
      "receiptUrl": "https://r2.example.com/receipts/xyz789.jpg"
    }
  ]
}
```

---

## Payments (`/api/payments`)

Registro de pagos. Requiere autenticacion.

### POST `/api/payments`
Registra un pago para una venta (parcial o total).

**Content-Type:** `multipart/form-data`

**Parametros:**
| Parametro | Tipo | Requerido | Descripcion |
|---|---|---|---|
| `saleId` | Long | Si | ID de la venta |
| `amount` | BigDecimal | Si | Monto del pago |
| `paymentMethod` | String | Si | Metodo: CASH, BANK_TRANSFER, CREDIT_CARD, DEBIT_CARD, OTHER |
| `notes` | String | No | Notas adicionales |
| `file` | File | No | Comprobante de pago (imagen/PDF) |

**Respuesta (201):**
```json
{
  "id": 1,
  "saleId": 1,
  "amount": 50.00,
  "paymentMethod": "BANK_TRANSFER",
  "paymentDate": "2026-01-16T14:00:00",
  "registeredBy": "Juan Perez",
  "notes": "Pago parcial",
  "receiptUrl": "https://r2.example.com/receipts/abc.jpg"
}
```

---

## Admin (`/api/admin`)

Endpoints exclusivos para administradores. Requiere rol `ADMIN`.

### POST `/api/admin/sales/{id}/review`
Aprueba o rechaza una venta. Al aprobar, se calcula la comision automaticamente.

**Body:**
```json
{
  "approved": true,
  "rejectionReason": null
}
```

O para rechazar:
```json
{
  "approved": false,
  "rejectionReason": "Los datos del pedido no coinciden con el comprobante."
}
```

**Respuesta (200):** Objeto `SaleDTO` actualizado

---

### GET `/api/admin/sales/under-review`
Obtiene ventas en estado UNDER_REVIEW (paginado).

**Parametros de query:** `page`, `size`

**Respuesta (200):** Pagina de `SaleDTO`

---

### GET `/api/admin/sales`
Obtiene el historial completo de ventas (paginado).

**Parametros de query:** `page`, `size`, `sort`

**Respuesta (200):** Pagina de `SaleDTO`

---

### GET `/api/admin/reports/settlement`
Descarga el reporte de liquidacion en formato Excel.

**Respuesta (200):** Archivo `.xlsx` (Content-Type: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`)

---

### POST `/api/admin/sellers/{userId}/approve`
Aprueba un vendedor pendiente. Envia email de bienvenida.

**Respuesta (200):** Objeto `User` actualizado

---

### POST `/api/admin/sellers/{userId}/reject`
Rechaza un vendedor pendiente. Envia email con motivo y elimina la cuenta.

**Body:**
```json
{
  "reason": "No cumple con los requisitos."
}
```

**Respuesta (200):**
```json
{
  "message": "Vendedor rechazado y eliminado exitosamente."
}
```

---

### GET `/api/admin/sellers/pending`
Obtiene la lista de sellers pendientes de aprobacion.

**Respuesta (200):** Array de `User`

---

### PUT `/api/admin/sellers/{userId}/commission`
Actualiza el porcentaje de comision de un vendedor.

**Parametros de query:**
| Parametro | Tipo | Descripcion |
|---|---|---|
| `commissionPercentage` | BigDecimal | Nuevo porcentaje (ej: 7.50) |

**Respuesta (200):** Objeto `User` actualizado

---

### GET `/api/admin/dashboard/stats`
Obtiene estadisticas del dashboard de administracion.

**Respuesta (200):**
```json
{
  "totalSellers": 15,
  "activeSellers": 12,
  "pendingSellers": 3,
  "totalSales": 250,
  "pendingSales": 5,
  "approvedSales": 200,
  "totalRevenue": 50000.00,
  "totalCommissions": 2500.00
}
```

---

### GET `/api/admin/sellers`
Obtiene todos los sellers (paginado).

**Parametros de query:** `page`, `size`

**Respuesta (200):** Pagina de `User`

---

### PUT `/api/admin/sellers/{userId}/enabled`
Habilita o deshabilita un vendedor.

**Parametros de query:**
| Parametro | Tipo | Descripcion |
|---|---|---|
| `enabled` | boolean | `true` para habilitar, `false` para deshabilitar |

**Respuesta (200):** Objeto `User` actualizado

---

## Reports (`/api/reports`)

Gestion de reportes y ciclos de facturacion. Requiere autenticacion.

### POST `/api/reports/upload-report`
Sube y procesa un PDF de reporte de ventas. Extrae datos, sube el PDF a R2 y crea la venta.

**Content-Type:** `multipart/form-data`

**Parametros:**
| Parametro | Tipo | Descripcion |
|---|---|---|
| `file` | File | Archivo PDF del reporte |

**Respuesta (200):** Objeto `SaleDTO`

---

### GET `/api/reports/cycles`
Obtiene todos los ciclos cerrados (historial).

**Respuesta (200):**
```json
[
  {
    "id": 1,
    "startDate": "2026-01-01T00:00:00",
    "endDate": "2026-01-31T23:59:59",
    "totalSales": 15000.00,
    "totalCommissions": 750.00,
    "salesCount": 30,
    "excelReportUrl": "https://r2.example.com/reports/cycle-1.xlsx",
    "status": "CLOSED",
    "createdAt": "2026-02-01T00:00:00"
  }
]
```

---

### GET `/api/reports/current-cycle`
Obtiene estadisticas del ciclo actual (pendiente de cierre).

**Respuesta (200):** Objeto `CycleDTO`

---

### GET `/api/reports/cycles/{id}`
Obtiene un ciclo especifico por ID.

**Respuesta (200):** Objeto `CycleDTO`

---

### POST `/api/reports/close-cycle`
Cierra el ciclo actual: genera reporte Excel, marca ventas como liquidadas.

**Respuesta (200):** Archivo `.xlsx` (descarga directa)

**Errores:**
| Codigo | Descripcion |
|---|---|
| 400 | No hay ventas aprobadas para cerrar el ciclo |

---

## Support (`/api/support`)

Sistema de tickets de soporte. Requiere autenticacion.

### POST `/api/support/tickets`
Crea un nuevo ticket de soporte (seller).

**Body:**
```json
{
  "type": "BUG",
  "subject": "Error al subir PDF",
  "description": "Al intentar subir un PDF de Odoo, aparece un error 500."
}
```

**Tipos validos:** `BUG`, `RECOMMENDATION`, `OTHER`

**Respuesta (200):**
```json
{
  "id": 1,
  "sellerId": "550e8400-...",
  "sellerName": "Juan Perez",
  "type": "BUG",
  "status": "OPEN",
  "subject": "Error al subir PDF",
  "description": "Al intentar subir un PDF de Odoo, aparece un error 500.",
  "adminNotes": null,
  "createdAt": "2026-01-15T10:30:00"
}
```

---

### GET `/api/support/my-tickets`
Obtiene los tickets del seller autenticado.

**Respuesta (200):** Array de `TicketDTO`

---

### GET `/api/support/tickets`
Obtiene todos los tickets (solo ADMIN).

**Parametros de query opcionales:**
| Parametro | Tipo | Descripcion |
|---|---|---|
| `status` | String | Filtrar por estado: OPEN, IN_PROGRESS, RESOLVED, CLOSED |
| `type` | String | Filtrar por tipo: BUG, RECOMMENDATION, OTHER |

**Respuesta (200):** Array de `TicketDTO`

---

### PUT `/api/support/tickets/{id}/status`
Actualiza el estado de un ticket (solo ADMIN).

**Body:**
```json
{
  "status": "IN_PROGRESS",
  "adminNotes": "Estamos investigando el problema."
}
```

**Respuesta (200):** Objeto `TicketDTO` actualizado

---

## Codigos de Estado HTTP

| Codigo | Significado | Uso |
|---|---|---|
| 200 | OK | Operacion exitosa |
| 201 | Created | Recurso creado (pagos) |
| 204 | No Content | Eliminacion exitosa |
| 400 | Bad Request | Datos invalidos o error de validacion |
| 401 | Unauthorized | Token invalido, expirado o ausente |
| 403 | Forbidden | Rol insuficiente o cuenta deshabilitada |
| 404 | Not Found | Recurso no encontrado |
| 409 | Conflict | Duplicado (email, order_number) |
| 500 | Internal Server Error | Error inesperado del servidor |
