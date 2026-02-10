# El Mayorista - Vision General del Sistema

## Descripcion del Proyecto

**El Mayorista** es una plataforma de gestion comercial diseñada para administrar vendedores, ventas, pagos, comisiones y ciclos de facturacion. El sistema opera bajo un modelo de dos roles (Admin y Seller) con un flujo de negocio completo que abarca desde el registro de vendedores hasta la liquidacion de comisiones.

---

## Arquitectura del Proyecto

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENTE (Browser)                        │
│                   React + Vite + Tailwind CSS                   │
│              Puerto: 5173 (dev) / build estatico                │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTP (Proxy /api → :8080)
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SERVIDOR (Spring Boot)                        │
│                       Puerto: 8080                              │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐  ┌──────────────┐   │
│  │   Auth   │  │  Sales   │  │ Payments  │  │   Reports    │   │
│  │Controller│  │Controller│  │Controller │  │  Controller  │   │
│  └────┬─────┘  └────┬─────┘  └─────┬─────┘  └──────┬───────┘   │
│       │              │              │               │           │
│  ┌────┴─────┐  ┌────┴─────┐  ┌─────┴─────┐  ┌─────┴───────┐   │
│  │   Auth   │  │  Sale    │  │ Payment   │  │   Cycle     │   │
│  │ Service  │  │ Service  │  │ Service   │  │  Service    │   │
│  └────┬─────┘  └────┬─────┘  └─────┬─────┘  └──────┬───────┘   │
│       │              │              │               │           │
│  ┌────┴──────────────┴──────────────┴───────────────┴───────┐   │
│  │                   Spring Data JPA                         │   │
│  │                   (Repositories)                          │   │
│  └──────────────────────────┬────────────────────────────────┘   │
└─────────────────────────────┼───────────────────────────────────┘
                              │ JDBC
                              ▼
                 ┌─────────────────────────┐
                 │      PostgreSQL          │
                 │    Base de Datos         │
                 └─────────────────────────┘

Servicios Externos:
  ┌──────────────────┐  ┌──────────────┐  ┌──────────────┐
  │  Cloudflare R2   │  │  Gmail SMTP  │  │  OpenAI API  │
  │  (Archivos/PDF)  │  │  (Emails)    │  │  (PDF Parse) │
  └──────────────────┘  └──────────────┘  └──────────────┘
```

---

## Roles del Sistema

### ADMIN
- Aprueba/rechaza solicitudes de nuevos vendedores
- Revisa y aprueba/rechaza ventas subidas por los sellers
- Gestiona comisiones (porcentaje por vendedor)
- Habilita/deshabilita cuentas de vendedores
- Cierra ciclos de facturacion y genera reportes Excel
- Administra tickets de soporte
- Accede al dashboard con estadisticas globales

### SELLER
- Se registra y espera aprobacion del administrador
- Sube ventas manualmente o mediante PDF (Odoo)
- Consulta sus ventas, comisiones y estado de pagos
- Registra pagos con comprobante adjunto
- Crea tickets de soporte (bugs, recomendaciones)

---

## Flujo de Negocio Principal

```
1. REGISTRO
   Seller se registra → pendingApproval = true
                       → No puede operar hasta ser aprobado

2. APROBACION
   Admin revisa solicitud → Aprueba (email de bienvenida)
                          → Rechaza (email con motivo, cuenta eliminada)

3. VENTA
   Seller crea venta → Manual (formulario)
                     → PDF Upload (extraccion automatica con OpenAI)
   Estado inicial: PENDING

4. REVISION
   Seller sube pago completo → Venta pasa a UNDER_REVIEW
   Admin revisa la venta → Aprueba (calcula comision)
                         → Rechaza (motivo de rechazo)

5. PAGOS
   Seller registra pagos parciales o totales
   PaymentStatus: UNPAID → PARTIALLY_PAID → PAID
   Los comprobantes se suben a Cloudflare R2

6. CICLO DE FACTURACION
   Admin cierra el ciclo → Genera reporte Excel
                         → Marca ventas aprobadas como liquidadas
                         → Se guarda historial del ciclo

7. SOPORTE
   Seller crea tickets → Admin los gestiona
   Tipos: BUG, RECOMMENDATION, OTHER
   Estados: OPEN → IN_PROGRESS → RESOLVED → CLOSED
```

---

## Estructura de Carpetas

### Backend (`ElMayoristaApplication/`)

```
src/main/java/com/elmayorista/
├── ElMayoristaApplication.java   # Clase principal Spring Boot
├── DataInitializer.java          # Inicializacion de datos (admin default)
├── admin/
│   ├── AdminController.java      # Endpoints de administracion
│   └── DataCorrectionController.java  # Correcciones de datos
├── auth/
│   ├── AuthController.java       # Login, registro, recuperacion
│   ├── AuthService.java          # Logica de autenticacion
│   ├── JwtFilter.java            # Filtro HTTP para validar JWT
│   ├── JwtUtil.java              # Generacion y validacion de tokens
│   ├── JwtUser.java              # Interfaz para extraer roles
│   ├── LoginRequest.java         # DTO de login
│   ├── LoginResponse.java        # DTO de respuesta login
│   ├── RegisterRequest.java      # DTO de registro
│   └── AuthResponse.java         # DTO de respuesta auth
├── config/
│   ├── SecurityConfig.java       # Configuracion Spring Security
│   ├── AppConfig.java            # Configuracion general (CORS, etc.)
│   ├── SwaggerConfig.java        # Configuracion OpenAPI/Swagger
│   ├── GlobalExceptionHandler.java  # Manejo global de errores
│   └── CustomAccessDeniedHandler.java  # Manejo de acceso denegado
├── dto/
│   ├── Mapper.java               # Conversiones Entity ↔ DTO
│   ├── SaleDTO.java              # DTO de venta (respuesta)
│   ├── SaleCreateDTO.java        # DTO de creacion de venta
│   ├── SaleDetailDTO.java        # DTO de detalle de venta
│   ├── SaleResponseDTO.java      # DTO de respuesta simplificada
│   ├── SaleReportDTO.java        # DTO para reportes
│   ├── PaymentDTO.java           # DTO de pago
│   ├── CreatePaymentRequest.java # DTO para crear pago
│   ├── UserDTO.java              # DTO de usuario
│   ├── CycleDTO.java             # DTO de ciclo
│   ├── TicketDTO.java            # DTO de ticket de soporte
│   ├── ErrorResponse.java        # DTO de error estandarizado
│   ├── ForgotPasswordRequest.java  # DTO recuperacion contraseña
│   ├── ResetPasswordRequest.java   # DTO reset contraseña
│   ├── ClientData.java           # Datos de cliente (extraccion PDF)
│   ├── OrderData.java            # Datos de orden (extraccion PDF)
│   ├── ProductData.java          # Datos de producto (extraccion PDF)
│   └── ReportData.java           # Datos de reporte (extraccion PDF)
├── payment/
│   ├── Payment.java              # Entidad de pago
│   ├── PaymentController.java    # Endpoints de pagos
│   ├── PaymentService.java       # Logica de pagos
│   ├── PaymentRepository.java    # Repositorio de pagos
│   ├── PaymentMethod.java        # Enum metodos de pago
│   └── PaymentStatus.java        # Enum estados de pago
├── report/
│   ├── Cycle.java                # Entidad de ciclo
│   ├── CycleRepository.java     # Repositorio de ciclos
│   ├── CycleService.java        # Logica de ciclos
│   ├── CycleStatus.java         # Enum estados de ciclo
│   └── ReportController.java    # Endpoints de reportes
├── sale/
│   ├── Sale.java                 # Entidad de venta
│   ├── SaleDetail.java           # Entidad detalle de venta
│   ├── SaleController.java       # Endpoints de ventas
│   ├── SaleService.java          # Logica de ventas
│   ├── SaleRepository.java       # Repositorio de ventas
│   ├── SaleDetailRepository.java # Repositorio de detalles
│   └── SaleStatus.java           # Enum estados de venta
├── service/
│   ├── EmailService.java         # Envio de correos HTML
│   ├── ExcelReportService.java   # Generacion de reportes Excel
│   ├── FileStorageService.java   # Subida de archivos a R2
│   ├── PdfExtractionService.java # Extraccion de datos de PDF (OpenAI)
│   └── PdfParsingService.java    # Parsing de PDF (PDFBox)
├── support/
│   ├── SupportTicket.java        # Entidad de ticket
│   ├── SupportTicketController.java  # Endpoints de soporte
│   ├── SupportTicketService.java     # Logica de soporte
│   ├── SupportTicketRepository.java  # Repositorio de tickets
│   ├── TicketStatus.java         # Enum estados de ticket
│   └── TicketType.java           # Enum tipos de ticket
└── user/
    ├── User.java                 # Entidad de usuario
    ├── UserController.java       # Endpoints de usuarios
    ├── UserService.java          # Logica de usuarios
    ├── UserRepository.java       # Repositorio de usuarios
    ├── UserDetailsImpl.java      # Implementacion UserDetails
    ├── Role.java                 # Enum de roles
    ├── AdminDashboardStats.java  # DTO estadisticas admin
    └── VendorCommissionStats.java  # DTO estadisticas comisiones
```

### Frontend (`mayorista-frontend/`)

```
src/
├── main.jsx                      # Entry point de React
├── App.jsx                       # Componente raiz (providers)
├── api/
│   ├── axios.js                  # Instancia Axios + interceptors
│   ├── auth.api.js               # API de autenticacion
│   ├── admin.api.js              # API de administracion
│   ├── reports.api.js            # API de reportes y ventas seller
│   └── support.api.js            # API de soporte
├── auth/
│   ├── AuthPage.jsx              # Pagina de login/registro
│   ├── ForgotPasswordPage.jsx    # Recuperacion de contraseña
│   └── ResetPasswordPage.jsx     # Reset de contraseña
├── context/
│   ├── AuthContext.jsx           # Estado de autenticacion global
│   └── DarkModeContext.jsx       # Estado de modo oscuro
├── router/
│   └── AppRouter.jsx             # Rutas y proteccion por rol
├── components/
│   └── SaleDetailModal.jsx       # Modal detalle de venta (compartido)
├── admin/
│   ├── Dashboard.jsx             # Dashboard admin
│   ├── SellersList.jsx           # Lista de vendedores
│   ├── SellerDetails.jsx         # Detalle de vendedor
│   ├── SalesReview.jsx           # Revision de ventas
│   ├── AdminSalesHistory.jsx     # Historial de ventas
│   ├── AdminReports.jsx          # Reportes y ciclos
│   ├── PendingSellers.jsx        # Sellers pendientes
│   └── components/
│       ├── AdminSidebar.jsx      # Sidebar admin
│       ├── AdminFooter.jsx       # Footer admin
│       └── AdminNotificationsPanel.jsx  # Panel notificaciones
├── seller/
│   ├── SellerHome.jsx            # Home del seller
│   ├── SellerSales.jsx           # Ventas del seller
│   ├── PendingApproval.jsx       # Pantalla de espera aprobacion
│   ├── pages/
│   │   └── SellerSupport.jsx     # Soporte del seller
│   └── components/
│       ├── SellerSidebar.jsx     # Sidebar seller
│       ├── SellerFooter.jsx      # Footer seller
│       ├── SalesUploadModal.jsx  # Modal subida de ventas
│       └── PendingSalesPanel.jsx # Panel ventas pendientes
└── utils/
    └── auth.js                   # Utilidades de autenticacion
```

---

## Stack Tecnologico

### Backend
| Tecnologia | Version | Proposito |
|---|---|---|
| Java | 21 | Lenguaje principal |
| Spring Boot | 3.5.9 | Framework web |
| Spring Security | - | Autenticacion y autorizacion |
| Spring Data JPA | - | ORM / Acceso a datos |
| PostgreSQL | - | Base de datos relacional |
| JWT (jjwt) | 0.11.5 | Tokens de autenticacion |
| Lombok | 1.18.34 | Reduccion de boilerplate |
| Apache PDFBox | 2.0.30 | Lectura de archivos PDF |
| Apache POI | 5.2.5 | Generacion de archivos Excel |
| Spring Cloud AWS S3 | 3.1.1 | Almacenamiento en Cloudflare R2 |
| Spring Mail | - | Envio de correos SMTP |
| SpringDoc OpenAPI | 2.8.3 | Documentacion Swagger UI |
| spring-dotenv | 4.0.0 | Variables de entorno desde .env |

### Frontend
| Tecnologia | Version | Proposito |
|---|---|---|
| React | 19.2.0 | Libreria de UI |
| Vite | 7.2.4 | Build tool y dev server |
| Tailwind CSS | 3.4.17 | Framework de estilos |
| Axios | 1.13.2 | Cliente HTTP |
| React Router DOM | 7.12.0 | Enrutamiento SPA |
| Lucide React | 0.562.0 | Iconos |
| jwt-decode | 4.0.0 | Decodificacion de JWT |
| React Hook Form | 7.71.0 | Gestion de formularios |

---

## Links a Documentacion Detallada

- [Backend](./backend.md) - Estructura del proyecto Spring Boot, servicios, seguridad
- [Frontend](./frontend.md) - Estructura React, rutas, estado, API layer
- [Referencia de API](./api-reference.md) - Todos los endpoints REST documentados
- [Base de Datos](./database.md) - Entidades, relaciones, enums
- [Despliegue](./deployment.md) - Instalacion, variables de entorno, produccion
