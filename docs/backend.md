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
Maneja el flujo completo de autenticacion: login, registro, recuperacion de contraseña y validacion JWT.

| Clase | Descripcion |
|---|---|
| `AuthController` | Endpoints publicos: login, registro, forgot/reset password |
| `AuthService` | Logica de autenticacion, encriptacion de passwords, generacion de tokens |
| `JwtFilter` | Filtro HTTP que intercepta cada request para validar el token JWT |
| `JwtUtil` | Utilidades para generar, validar y extraer claims de tokens JWT |
| `JwtUser` | Interfaz que permite extraer roles del usuario para incluirlos en el token |
| `LoginRequest` | DTO con email y password |
| `RegisterRequest` | DTO con datos de registro (email, password, fullName, phoneNumber) |
| `AuthResponse` | DTO de respuesta con token JWT y datos del usuario |

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
| `AppConfig` | Configuracion general (CORS, beans) |
| `SwaggerConfig` | Configuracion de SpringDoc OpenAPI para Swagger UI |
| `GlobalExceptionHandler` | Manejo centralizado de excepciones (`@RestControllerAdvice`) |
| `CustomAccessDeniedHandler` | Manejo personalizado de errores 403 |

### `dto` - Data Transfer Objects
Objetos para transferencia de datos entre capas y hacia el cliente.

| Clase | Descripcion |
|---|---|
| `Mapper` | Componente central de conversion Entity ↔ DTO |
| `SaleDTO` | Representacion completa de venta (incluye pagos, productos, totales calculados) |
| `SaleCreateDTO` | Datos para crear una venta manualmente |
| `PaymentDTO` | Representacion de un pago |
| `CreatePaymentRequest` | Datos para registrar un pago |
| `UserDTO` | Representacion de usuario (sin password) |
| `CycleDTO` | Representacion de ciclo de facturacion |
| `TicketDTO` | Representacion de ticket de soporte |
| `ErrorResponse` | Respuesta de error estandarizada (timestamp, status, message, path) |
| `ClientData`, `OrderData`, `ProductData`, `ReportData` | DTOs para la extraccion de datos desde PDF |

### `payment` - Pagos
Gestion de pagos asociados a ventas.

| Clase | Descripcion |
|---|---|
| `Payment` | Entidad JPA: monto, metodo, comprobante, fecha |
| `PaymentController` | Endpoint POST para registrar pago con comprobante (multipart) |
| `PaymentService` | Logica de pagos: validacion, subida de comprobante a R2, actualizacion de estado |
| `PaymentRepository` | Repositorio JPA con query custom `sumAmountBySale` |
| `PaymentMethod` | Enum: CASH, BANK_TRANSFER, CREDIT_CARD, DEBIT_CARD, OTHER |
| `PaymentStatus` | Enum: UNPAID, PARTIALLY_PAID, PAID, REFUNDED |

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
| `Sale` | Entidad JPA principal: cliente, montos, estado, relacion con detalles y pagos |
| `SaleDetail` | Entidad JPA: linea de producto (SKU, nombre, cantidad, precio, subtotal) |
| `SaleController` | Creacion de ventas (manual y por PDF), consulta por ID |
| `SaleService` | Logica de ventas: creacion, revision, calculo de comisiones |
| `SaleRepository` | Repositorio JPA con queries por estado y vendedor |
| `SaleDetailRepository` | Repositorio JPA para detalles de venta |
| `SaleStatus` | Enum: PENDING, UNDER_REVIEW, APPROVED, REJECTED |

### `service` - Servicios Utilitarios
Servicios transversales compartidos por multiples modulos.

| Clase | Descripcion |
|---|---|
| `EmailService` | Envio de correos HTML via Gmail SMTP (aprobacion, rechazo, reset password, tickets) |
| `ExcelReportService` | Generacion de reportes Excel con Apache POI |
| `FileStorageService` | Subida de archivos a Cloudflare R2 via AWS S3 SDK |
| `PdfExtractionService` | Extraccion inteligente de datos de PDFs (Odoo) usando OpenAI API |
| `PdfParsingService` | Parsing basico de PDFs con Apache PDFBox |

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

### Flujo de Autenticacion JWT

```
1. Login POST /api/auth/login
   → AuthService valida credenciales con BCrypt
   → JwtUtil genera token con email como subject y roles como claims
   → Retorna token + datos del usuario

2. Request autenticado
   → JwtFilter intercepta la request
   → Extrae token del header "Authorization: Bearer <token>"
   → Valida token (firma, expiracion)
   → Carga UserDetails del usuario
   → Verifica que la cuenta este habilitada
   → Establece autenticacion en SecurityContext

3. Autorizacion por ruta (SecurityConfig)
   → /api/auth/**        → Publico (permitAll)
   → /swagger-ui/**      → Publico (permitAll)
   → /api/admin/**       → Solo ADMIN
   → /api/sellers/**     → Solo SELLER
   → /api/support/**     → Cualquier usuario autenticado
   → Todo lo demas       → Autenticado
```

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
spring.jpa.hibernate.ddl-auto=create-drop    # CAMBIAR en produccion
spring.jpa.show-sql=true

# Email (Gmail SMTP)
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=${MAIL_USERNAME}
spring.mail.password=${MAIL_PASSWORD}

# OpenAI
spring.ai.openai.api-key=${OPENAI_API_KEY}

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
```

> **Nota importante**: `ddl-auto=create-drop` recrea la base de datos cada vez que se reinicia la aplicacion. Para produccion, cambiar a `update` o `validate`. Ver [deployment.md](./deployment.md) para mas detalles.
