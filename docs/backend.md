# Backend - Spring Boot

## Estructura General

El backend esta construido con **Spring Boot 3.5.9** y **Java 21**, siguiendo un patron de capas organizado por dominio (feature-based packaging):

```
Controller → Service → Repository → Entity
```

Cada modulo de dominio (`sale`, `payment`, `user`, `report`, `support`) contiene su propia entidad, controlador, servicio y repositorio.

---

## Descripcion de Paquetes

### `auth` - Autenticacion
Maneja el flujo completo de autenticacion: login, registro, logout, recuperacion de contraseña y validacion JWT via HttpOnly cookies.

| Clase | Descripcion |
|---|---|
| `AuthController` | Endpoints publicos: login (setea cookie HttpOnly), register, logout (borra cookie), forgot/reset password |
| `AuthService` | Logica de autenticacion, encriptacion de passwords, generacion de tokens |
| `JwtFilter` | Filtro HTTP que intercepta cada request y extrae el JWT de la cookie `jwt` |
| `JwtUtil` | Utilidades para generar, validar y extraer claims de tokens JWT |
| `JwtUser` | Interfaz que permite extraer roles del usuario para incluirlos en el token |
| `LoginRequest` | DTO con email y password |
| `RegisterRequest` | DTO con datos de registro (email, password, fullName, phoneNumber) |
| `AuthResponse` | DTO de respuesta con datos del usuario (token NO se envia en body, solo en cookie) |
| `ForgotPasswordRequest` | DTO con email para recuperacion de contraseña |
| `ResetPasswordRequest` | DTO con token y nueva contraseña |

### `admin` - Administracion
Endpoints exclusivos para usuarios con rol ADMIN.

| Clase | Descripcion |
|---|---|
| `AdminController` | Revision de ventas, gestion de sellers, dashboard stats, reportes |
| `DataCorrectionController` | Endpoint temporal para correccion de datos (fix commission flags) |

### `config` - Configuracion
Configuracion transversal de la aplicacion.

| Clase | Descripcion |
|---|---|
| `SecurityConfig` | Cadena de filtros de seguridad, reglas de autorizacion por ruta |
| `AppConfig` | Configuracion general (beans, recursos estaticos) |
| `DataInitializer` | Inicializacion de datos al arrancar (admin por defecto) |
| `Mapper` | Componente central de conversion Entity ↔ DTO |
| `ErrorResponse` | Respuesta de error estandarizada (timestamp, status, message, path) |
| `GlobalExceptionHandler` | Manejo centralizado de excepciones (`@RestControllerAdvice`) |
| `CustomAccessDeniedHandler` | Manejo personalizado de errores 403 |

> **Nota:** Los DTOs se encuentran en sus respectivos paquetes de dominio (no en un paquete `dto/` centralizado).

### `notification` - Notificaciones
Sistema de notificaciones en plataforma y por email para sellers y admins.

| Clase | Descripcion |
|---|---|
| `Notification` | Entidad JPA: tipo, titulo, mensaje, referencia a venta, estado de lectura |
| `NotificationController` | Endpoints: listar, contar no leidas, marcar como leidas, trigger manual |
| `NotificationService` | Logica: recordatorios de ventas pendientes, alertas admin, notificaciones de revision |
| `NotificationRepository` | Repositorio JPA para notificaciones |
| `NotificationScheduler` | Job programado (diario 8:00 AM + al iniciar) para generar recordatorios |
| `NotificationType` | Enum: `SALE_PENDING_REMINDER`, `SALE_PENDING_ADMIN_ALERT`, `SALE_UNDER_REVIEW` |
| `NotificationDTO` | DTO de notificacion |

**Tipos de notificacion:**
- `SALE_PENDING_REMINDER` - Recordatorio al seller de ventas pendientes de pago (24h+)
- `SALE_PENDING_ADMIN_ALERT` - Alerta al admin de ventas sin pagar por 30+ dias
- `SALE_UNDER_REVIEW` - Notifica a admins cuando una venta pasa a revision

### `payment` - Pagos
Gestion de pagos asociados a ventas.

| Clase | Descripcion |
|---|---|
| `Payment` | Entidad JPA: monto, metodo, comprobante, fecha |
| `PaymentController` | Endpoint POST para registrar pago con comprobante (multipart) |
| `PaymentService` | Logica de pagos: validacion, subida a R2, transicion a UNDER_REVIEW y notificacion a admins |
| `PaymentRepository` | Repositorio JPA con query custom `sumAmountBySale` |
| `PaymentMethod` | Enum: CASH, BANK_TRANSFER, CREDIT_CARD, DEBIT_CARD, OTHER |
| `PaymentStatus` | Enum: UNPAID, PARTIALLY_PAID, PAID, REFUNDED |
| `PaymentDTO` | DTO de pago |
| `CreatePaymentRequest` | DTO para crear pago |

### `report` - Reportes y Ciclos
Gestion de ciclos de facturacion y generacion de reportes.

| Clase | Descripcion |
|---|---|
| `Cycle` | Entidad JPA: periodo, totales, estado, URL del reporte Excel |
| `ReportController` | Upload de PDF, consulta de ciclos, cierre de ciclo |
| `CycleService` | Logica de ciclos: estadisticas actuales, cierre, generacion Excel |
| `CycleRepository` | Repositorio JPA para ciclos |
| `CycleStatus` | Enum: OPEN, CLOSED |

### `sale` - Ventas
Nucleo del sistema: gestion de ventas y sus detalles.

| Clase | Descripcion |
|---|---|
| `Sale` | Entidad JPA principal: cliente, montos, estado, tipo (STANDARD/TV), relacion con detalles y pagos |
| `SaleDetail` | Entidad JPA: linea de producto (SKU, nombre, cantidad, precio, subtotal) |
| `SaleController` | Creacion de ventas (manual, PDF y TV), consulta por ID, eliminacion |
| `SaleService` | Logica de ventas: creacion, revision, calculo de comisiones |
| `SaleRepository` | Repositorio JPA con queries por estado y vendedor |
| `SaleDetailRepository` | Repositorio JPA para detalles de venta |
| `SaleStatus` | Enum: PENDING, UNDER_REVIEW, APPROVED, REJECTED |
| `SaleType` | Enum: STANDARD, TV |
| `SaleDTO`, `SaleCreateDTO`, `SaleDetailDTO`, `SaleResponseDTO`, `SaleReportDTO` | DTOs de venta |
| `ProductDTO` | DTO de producto |
| `TvSaleCreateDTO` | DTO para crear venta de TV (serial, modelo) |

### `service` - Servicios Utilitarios
Servicios transversales compartidos por multiples modulos.

| Clase | Descripcion |
|---|---|
| `EmailService` | Envio de correos HTML via Gmail SMTP (aprobacion, rechazo, reset password, tickets) |
| `ExcelReportService` | Generacion de reportes Excel con Apache POI |
| `FileStorageService` | Subida de archivos a Cloudflare R2 via AWS S3 SDK |
| `PdfExtractionService` | Extraccion de datos de PDFs (Odoo) con PDFBox + regex |
| `PdfParsingService` | Parsing de PDFs con Apache PDFBox (productos, totales, clientes) |

### `support` - Soporte
Sistema de tickets de soporte entre sellers y admin.

| Clase | Descripcion |
|---|---|
| `SupportTicket` | Entidad JPA: tipo, estado, asunto, descripcion, notas admin |
| `SupportTicketController` | CRUD de tickets, filtros por estado/tipo |
| `SupportTicketService` | Logica de tickets: creacion, actualizacion de estado |
| `SupportTicketRepository` | Repositorio JPA para tickets |
| `TicketStatus` | Enum: OPEN, IN_PROGRESS, RESOLVED, CLOSED |
| `TicketType` | Enum: BUG, RECOMMENDATION, OTHER |

### `user` - Usuarios
Gestion de usuarios y sus perfiles.

| Clase | Descripcion |
|---|---|
| `User` | Entidad JPA: email, password, roles, comision, estado de aprobacion |
| `UserController` | CRUD de usuarios, consulta de ventas y comisiones por vendedor |
| `UserService` | Logica de usuarios: aprobacion, rechazo, comisiones, toggle habilitado |
| `UserRepository` | Repositorio JPA para usuarios |
| `UserDetailsImpl` | Implementacion de `UserDetails` de Spring Security |
| `Role` | Enum: ADMIN, SELLER |
| `AdminDashboardStats` | DTO con estadisticas del dashboard admin |
| `VendorCommissionStats` | DTO con estadisticas de comisiones del vendedor |

---

## Configuracion de Seguridad

### Flujo de Autenticacion JWT (HttpOnly Cookies)

```
1. Login POST /api/auth/login
   → AuthService valida credenciales con BCrypt
   → JwtUtil genera token con email como subject y roles como claims
   → Token se setea como cookie HttpOnly (NO se envia en el body)
   → Retorna datos del usuario (sin token)

2. Request autenticado
   → Browser envia cookie automaticamente
   → JwtFilter intercepta la request
   → Extrae token de la cookie "jwt"
   → Valida token (firma, expiracion)
   → Carga UserDetails del usuario
   → Verifica que la cuenta este habilitada
   → Establece autenticacion en SecurityContext

3. Logout POST /api/auth/logout
   → Borra la cookie "jwt" (MaxAge=0)

4. Autorizacion por ruta (SecurityConfig)
   → /api/auth/**        → Publico (permitAll)
   → /swagger-ui/**      → Publico (permitAll)
   → /api/admin/**       → Solo ADMIN
   → /api/sellers/**     → Solo SELLER
   → /api/support/**     → Cualquier usuario autenticado
   → Todo lo demas       → Autenticado
```

### Seguridad de la Cookie JWT
- **HttpOnly**: JavaScript no puede acceder al token (proteccion contra XSS)
- **Secure**: Solo se envia por HTTPS (configurable via `app.cookie.secure`)
- **Path**: `/` (se envia en todas las rutas)
- **MaxAge**: Igual a la expiracion del JWT (24 horas por defecto)

### Configuracion del Token
- **Algoritmo**: HMAC-SHA256
- **Expiracion**: 24 horas (86400000 ms)
- **Claims incluidos**: `sub` (email), `roles` (array de roles), `iat`, `exp`

### Manejo de Sesion
- **Politica**: STATELESS (sin sesiones del lado del servidor)
- **CSRF**: Deshabilitado (apropiado para APIs REST con JWT)

---

## Manejo de Errores

El `GlobalExceptionHandler` captura excepciones y las convierte en respuestas JSON estandarizadas:

```json
{
  "timestamp": "2026-01-15T10:30:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Descripcion del error",
  "path": "/api/sales"
}
```

| Excepcion | Codigo HTTP | Descripcion |
|---|---|---|
| `IllegalArgumentException` | 400 / 409 | Datos invalidos o duplicados |
| `BadCredentialsException` | 401 | Credenciales incorrectas |
| `EntityNotFoundException` | 404 | Recurso no encontrado |
| `DataIntegrityViolationException` | 409 | Violacion de constraint (ej: order_number duplicado) |
| `MethodArgumentNotValidException` | 400 | Errores de validacion de campos |
| `Exception` (generico) | 500 | Error inesperado del servidor |

---

## Configuracion de la Aplicacion

El archivo `application.properties` usa variables de entorno cargadas desde un archivo `.env` mediante la libreria `spring-dotenv`:

```properties
# Base de datos PostgreSQL
spring.datasource.url=${DB_URL}
spring.datasource.username=${DB_USERNAME}
spring.datasource.password=${DB_PASSWORD}

# JPA / Hibernate
spring.jpa.hibernate.ddl-auto=update         # Solo aplica cambios incrementales
spring.jpa.show-sql=true

# Email (Gmail SMTP)
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=${MAIL_USERNAME}
spring.mail.password=${MAIL_PASSWORD}

# Cloudflare R2
spring.cloud.aws.s3.endpoint=${R2_ENDPOINT}
spring.cloud.aws.s3.bucket=${R2_BUCKET}
spring.cloud.aws.credentials.access-key=${R2_ACCESS_KEY}
spring.cloud.aws.credentials.secret-key=${R2_SECRET_KEY}
spring.cloud.aws.region.static=auto

# Aplicacion
app.frontend.url=${APP_FRONTEND_URL}
app.r2.public-url=${R2_PUBLIC_URL}

# Upload de archivos
spring.servlet.multipart.max-file-size=10MB
spring.servlet.multipart.max-request-size=10MB

# Cookie de autenticacion
app.cookie.secure=false    # Cambiar a true en produccion (HTTPS)
```
