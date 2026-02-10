# Base de Datos

Base de datos **PostgreSQL** gestionada por **Spring Data JPA** con Hibernate como ORM.

---

## Diagrama de Entidades

```
┌──────────────────────────┐
│         users            │
├──────────────────────────┤       ┌──────────────────────────┐
│ id          UUID    PK   │       │      user_roles          │
│ email       VARCHAR UQ   │       ├──────────────────────────┤
│ password    VARCHAR      │──────>│ user_id    UUID    FK    │
│ full_name   VARCHAR      │       │ role       VARCHAR       │
│ phone_number VARCHAR UQ  │       └──────────────────────────┘
│ enabled     BOOLEAN      │
│ pending_approval BOOLEAN │
│ commission_percentage DEC│
│ reset_password_token  VAR│
│ reset_password_token_exp │
│ created_at  TIMESTAMP    │
│ updated_at  TIMESTAMP    │
└──────┬───────────────────┘
       │
       │ 1:N (seller_id)
       ▼
┌──────────────────────────┐       ┌──────────────────────────┐
│         sales            │       │      sale_details        │
├──────────────────────────┤       ├──────────────────────────┤
│ id          BIGINT  PK   │──────>│ id          BIGINT  PK   │
│ seller_id   UUID    FK   │ 1:N   │ sale_id     BIGINT  FK   │
│ order_number VARCHAR UQ  │       │ sku         VARCHAR      │
│ customer_name VARCHAR    │       │ product_name VARCHAR     │
│ customer_id_number VAR   │       │ quantity    DECIMAL      │
│ customer_address TEXT    │       │ unit_price  DECIMAL      │
│ customer_city VARCHAR    │       │ subtotal    DECIMAL      │
│ customer_phone VARCHAR   │       └──────────────────────────┘
│ customer_email VARCHAR   │
│ subtotal    DECIMAL(12,2)│       ┌──────────────────────────┐
│ shipping    DECIMAL(12,2)│       │       payments           │
│ total       DECIMAL(12,2)│       ├──────────────────────────┤
│ commission_amount DEC    │──────>│ id          BIGINT  PK   │
│ commission_percentage DEC│ 1:N   │ sale_id     BIGINT  FK   │
│ status      VARCHAR      │       │ amount      DECIMAL      │
│ payment_status VARCHAR   │       │ payment_method VARCHAR   │
│ order_date  TIMESTAMP    │       │ payment_date TIMESTAMP   │
│ report_pdf_url TEXT      │       │ registered_by UUID   FK  │
│ rejection_reason VARCHAR │       │ receipt_url  VARCHAR     │
│ commission_settled BOOL  │       │ notes        VARCHAR     │
│ created_at  TIMESTAMP    │       └──────────────────────────┘
│ updated_at  TIMESTAMP    │
└──────────────────────────┘

┌──────────────────────────┐       ┌──────────────────────────┐
│        cycles            │       │    support_tickets       │
├──────────────────────────┤       ├──────────────────────────┤
│ id          BIGINT  PK   │       │ id          BIGINT  PK   │
│ start_date  TIMESTAMP    │       │ seller_id   UUID    FK   │
│ end_date    TIMESTAMP    │       │ type        VARCHAR      │
│ total_sales DECIMAL(12,2)│       │ status      VARCHAR      │
│ total_commissions DEC    │       │ subject     VARCHAR(200) │
│ sales_count INTEGER      │       │ description TEXT         │
│ excel_report_url TEXT    │       │ admin_notes TEXT         │
│ status      VARCHAR      │       │ resolved_at TIMESTAMP   │
│ created_at  TIMESTAMP    │       │ created_at  TIMESTAMP   │
│ updated_at  TIMESTAMP    │       │ updated_at  TIMESTAMP   │
└──────────────────────────┘       └──────────────────────────┘
```

---

## Entidades

### `users`
Tabla principal de usuarios del sistema (admins y sellers).

| Campo | Tipo | Nullable | Descripcion |
|---|---|---|---|
| `id` | UUID | No | Identificador unico, generado automaticamente |
| `email` | VARCHAR | No | Email unico, validado con @Email |
| `password` | VARCHAR | No | Hash BCrypt de la contraseña |
| `full_name` | VARCHAR | No | Nombre completo del usuario |
| `phone_number` | VARCHAR | Si | Telefono unico, formato: `09XXXXXXXX` |
| `enabled` | BOOLEAN | No | Si la cuenta esta habilitada (default: true) |
| `pending_approval` | BOOLEAN | No | Si requiere aprobacion del admin (default: true) |
| `commission_percentage` | DECIMAL(5,2) | Si | Porcentaje de comision del seller (default: 5.00) |
| `reset_password_token` | VARCHAR | Si | Token para recuperacion de contraseña |
| `reset_password_token_expiry` | TIMESTAMP | Si | Expiracion del token de reset |
| `created_at` | TIMESTAMP | No | Fecha de creacion (auto) |
| `updated_at` | TIMESTAMP | Si | Fecha de ultima actualizacion (auto) |

**Constraints:**
- `email` - UNIQUE
- `phone_number` - UNIQUE

### `user_roles`
Tabla de union para la relacion muchos-a-muchos entre usuarios y roles (ElementCollection).

| Campo | Tipo | Descripcion |
|---|---|---|
| `user_id` | UUID (FK) | Referencia a `users.id` |
| `role` | VARCHAR | Valor del enum Role |

### `sales`
Ventas registradas por los sellers.

| Campo | Tipo | Nullable | Descripcion |
|---|---|---|---|
| `id` | BIGINT | No | ID auto-incremental |
| `seller_id` | UUID (FK) | No | Vendedor que registra la venta |
| `order_number` | VARCHAR | Si | Numero de pedido unico |
| `customer_name` | VARCHAR | No | Nombre del cliente |
| `customer_id_number` | VARCHAR | Si | Cedula/RUC del cliente |
| `customer_address` | TEXT | Si | Direccion de entrega |
| `customer_city` | VARCHAR | Si | Ciudad del cliente |
| `customer_phone` | VARCHAR | Si | Telefono del cliente |
| `customer_email` | VARCHAR | Si | Email del cliente |
| `subtotal` | DECIMAL(12,2) | No | Subtotal de la venta |
| `shipping` | DECIMAL(12,2) | No | Costo de envio (default: 0) |
| `total` | DECIMAL(12,2) | No | Total de la venta |
| `commission_amount` | DECIMAL(12,2) | No | Monto de comision calculado (default: 0) |
| `commission_percentage` | DECIMAL(5,2) | Si | Porcentaje aplicado (default: 0) |
| `status` | VARCHAR | No | Estado de la venta (enum SaleStatus) |
| `payment_status` | VARCHAR | No | Estado del pago (enum PaymentStatus) |
| `order_date` | TIMESTAMP | No | Fecha del pedido |
| `report_pdf_url` | TEXT | Si | URL del PDF subido a R2 |
| `rejection_reason` | VARCHAR | Si | Motivo de rechazo (si aplica) |
| `commission_settled` | BOOLEAN | No | Si la comision ya fue liquidada (default: false) |
| `created_at` | TIMESTAMP | No | Fecha de creacion (auto) |
| `updated_at` | TIMESTAMP | Si | Fecha de actualizacion (auto) |

**Constraints:**
- `order_number` - UNIQUE
- `seller_id` - FK → `users.id`

### `sale_details`
Lineas de productos de cada venta.

| Campo | Tipo | Nullable | Descripcion |
|---|---|---|---|
| `id` | BIGINT | No | ID auto-incremental |
| `sale_id` | BIGINT (FK) | No | Venta a la que pertenece |
| `sku` | VARCHAR | No | Codigo del producto |
| `product_name` | VARCHAR | No | Nombre del producto |
| `quantity` | DECIMAL | No | Cantidad |
| `unit_price` | DECIMAL | No | Precio unitario |
| `subtotal` | DECIMAL | No | Subtotal de la linea |

**Constraints:**
- `sale_id` - FK → `sales.id` (CASCADE DELETE)

### `payments`
Pagos realizados para una venta.

| Campo | Tipo | Nullable | Descripcion |
|---|---|---|---|
| `id` | BIGINT | No | ID auto-incremental |
| `sale_id` | BIGINT (FK) | No | Venta asociada al pago |
| `amount` | DECIMAL | No | Monto del pago |
| `payment_method` | VARCHAR | No | Metodo de pago (enum PaymentMethod) |
| `payment_date` | TIMESTAMP | No | Fecha del pago (auto) |
| `registered_by` | UUID (FK) | No | Usuario que registro el pago |
| `receipt_url` | VARCHAR | Si | URL del comprobante en R2 |
| `notes` | VARCHAR | Si | Notas adicionales |

**Constraints:**
- `sale_id` - FK → `sales.id` (CASCADE DELETE)
- `registered_by` - FK → `users.id`

### `cycles`
Ciclos de facturacion cerrados con datos de resumen.

| Campo | Tipo | Nullable | Descripcion |
|---|---|---|---|
| `id` | BIGINT | No | ID auto-incremental |
| `start_date` | TIMESTAMP | No | Inicio del periodo |
| `end_date` | TIMESTAMP | No | Fin del periodo |
| `total_sales` | DECIMAL(12,2) | No | Total en ventas del periodo (default: 0) |
| `total_commissions` | DECIMAL(12,2) | No | Total en comisiones del periodo (default: 0) |
| `sales_count` | INTEGER | No | Cantidad de ventas en el periodo (default: 0) |
| `excel_report_url` | TEXT | Si | URL del reporte Excel en R2 |
| `status` | VARCHAR | No | Estado del ciclo (enum CycleStatus, default: CLOSED) |
| `created_at` | TIMESTAMP | No | Fecha de creacion (auto) |
| `updated_at` | TIMESTAMP | Si | Fecha de actualizacion (auto) |

### `support_tickets`
Tickets de soporte creados por sellers.

| Campo | Tipo | Nullable | Descripcion |
|---|---|---|---|
| `id` | BIGINT | No | ID auto-incremental |
| `seller_id` | UUID (FK) | No | Seller que creo el ticket |
| `type` | VARCHAR | No | Tipo de ticket (enum TicketType, default: OTHER) |
| `status` | VARCHAR | No | Estado del ticket (enum TicketStatus, default: OPEN) |
| `subject` | VARCHAR(200) | No | Asunto del ticket |
| `description` | TEXT | No | Descripcion detallada |
| `admin_notes` | TEXT | Si | Notas del administrador |
| `resolved_at` | TIMESTAMP | Si | Fecha de resolucion |
| `created_at` | TIMESTAMP | No | Fecha de creacion (auto) |
| `updated_at` | TIMESTAMP | Si | Fecha de actualizacion (auto) |

**Constraints:**
- `seller_id` - FK → `users.id`

---

## Enums del Sistema

### `Role` (user)
| Valor | Descripcion |
|---|---|
| `ADMIN` | Administrador del sistema |
| `SELLER` | Vendedor |

### `SaleStatus` (sale)
| Valor | Descripcion |
|---|---|
| `PENDING` | Venta creada, esperando pago completo |
| `UNDER_REVIEW` | Pago completo, esperando revision del admin |
| `APPROVED` | Venta aprobada por el admin (comision calculada) |
| `REJECTED` | Venta rechazada por el admin |

### `PaymentStatus` (sale)
| Valor | Descripcion |
|---|---|
| `UNPAID` | Sin pagos registrados |
| `PARTIALLY_PAID` | Pago parcial registrado |
| `PAID` | Pago total completado |
| `REFUNDED` | Pago reembolsado |

### `PaymentMethod` (payment)
| Valor | Descripcion |
|---|---|
| `CASH` | Efectivo |
| `BANK_TRANSFER` | Transferencia bancaria |
| `CREDIT_CARD` | Tarjeta de credito |
| `DEBIT_CARD` | Tarjeta de debito |
| `OTHER` | Otro metodo |

### `CycleStatus` (cycle)
| Valor | Descripcion |
|---|---|
| `OPEN` | Ciclo activo (en progreso) |
| `CLOSED` | Ciclo cerrado (liquidado) |

### `TicketStatus` (support_ticket)
| Valor | Descripcion |
|---|---|
| `OPEN` | Ticket abierto (nuevo) |
| `IN_PROGRESS` | Ticket en proceso de atencion |
| `RESOLVED` | Ticket resuelto |
| `CLOSED` | Ticket cerrado |

### `TicketType` (support_ticket)
| Valor | Descripcion |
|---|---|
| `BUG` | Reporte de error |
| `RECOMMENDATION` | Sugerencia de mejora |
| `OTHER` | Otro tipo |

---

## Relaciones entre Tablas

```
User (1) ────── (N) Sale          Un seller tiene muchas ventas
User (1) ────── (N) Payment       Un usuario registra muchos pagos (registered_by)
User (1) ────── (N) SupportTicket Un seller tiene muchos tickets
User (1) ────── (N) UserRole      Un usuario tiene uno o mas roles

Sale (1) ────── (N) SaleDetail    Una venta tiene muchos productos (CASCADE)
Sale (1) ────── (N) Payment       Una venta tiene muchos pagos (CASCADE)
```

**Cascade Delete:**
- Al eliminar una `Sale`, se eliminan automaticamente sus `SaleDetail` y `Payment` asociados (`orphanRemoval = true`)

**Fetch Strategy:**
- `User → Sale`: EAGER (ManyToOne)
- `Sale → SaleDetail`: LAZY por defecto (OneToMany)
- `Sale → Payment`: LAZY por defecto (OneToMany)
- `Payment → Sale`: LAZY (ManyToOne)
- `SupportTicket → User`: LAZY (ManyToOne)

---

## Notas sobre DDL

La configuracion actual usa `spring.jpa.hibernate.ddl-auto=create-drop`, lo que significa que **la base de datos se recrea completamente** cada vez que se reinicia la aplicacion. Esto es util para desarrollo pero **debe cambiarse para produccion**. Ver [deployment.md](./deployment.md).
