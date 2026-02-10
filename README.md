# El Mayorista

![Java](https://img.shields.io/badge/Java-21-ED8B00?style=flat&logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5.9-6DB33F?style=flat&logo=springboot&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=flat&logo=vite&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat&logo=postgresql&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3-06B6D4?style=flat&logo=tailwindcss&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-Auth-000000?style=flat&logo=jsonwebtokens&logoColor=white)

Plataforma de gestion comercial para administrar vendedores, ventas, pagos, comisiones y ciclos de facturacion. Sistema con roles Admin/Seller, autenticacion JWT, extraccion inteligente de datos desde PDFs y almacenamiento en la nube.

---

## Arquitectura

```
  Browser (React + Vite)          Spring Boot API           PostgreSQL
 ┌────────────────────┐      ┌─────────────────────┐    ┌──────────────┐
 │  Admin Dashboard   │      │  Auth / JWT Filter  │    │   users      │
 │  Seller Portal     │─────>│  Controllers        │───>│   sales      │
 │  Auth Pages        │ /api │  Services           │    │   payments   │
 │  Tailwind + Dark   │<─────│  Repositories       │<───│   cycles     │
 └────────────────────┘      └────────┬────────────┘    │   tickets    │
        :5173                    :8080 │                 └──────────────┘
                                      │
                    ┌─────────────────┼──────────────────┐
                    ▼                 ▼                   ▼
             Cloudflare R2      Gmail SMTP          OpenAI API
             (Archivos)         (Emails)            (PDF Parse)
```

## Funcionalidades Principales

- **Autenticacion JWT** con roles (Admin, Seller) y proteccion de rutas
- **Gestion de vendedores**: registro, aprobacion/rechazo, comisiones configurables
- **Ventas**: creacion manual o por upload de PDF (extraccion automatica con OpenAI)
- **Pagos**: registro parcial/total con comprobante adjunto (almacenado en Cloudflare R2)
- **Ciclos de facturacion**: cierre periodico con generacion de reportes Excel
- **Soporte**: sistema de tickets entre sellers y admin
- **Emails transaccionales**: aprobacion, rechazo, recuperacion de contraseña, notificaciones
- **Modo oscuro**: toggle persistente con soporte de preferencia del sistema

---

## Quick Start

### Requisitos

- Java 21 JDK
- Node.js 18+
- PostgreSQL 14+

### Backend

```bash
cd ElMayoristaApplication

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales (ver docs/deployment.md)

# Ejecutar
./mvnw spring-boot:run
```

### Frontend

```bash
cd mayorista-frontend

npm install
npm run dev
```

La aplicacion estara disponible en `http://localhost:5173`.

### Variables de Entorno

Crear un archivo `.env` en `ElMayoristaApplication/`:

| Variable | Descripcion |
|---|---|
| `DB_URL` | URL JDBC de PostgreSQL (`jdbc:postgresql://localhost:5432/elmayorista`) |
| `DB_USERNAME` | Usuario de la base de datos |
| `DB_PASSWORD` | Contraseña de la base de datos |
| `MAIL_USERNAME` | Email de Gmail para envio de correos |
| `MAIL_PASSWORD` | App Password de Gmail |
| `OPENAI_API_KEY` | API Key de OpenAI (para extraccion de PDFs) |
| `R2_ACCESS_KEY` | Access Key de Cloudflare R2 |
| `R2_SECRET_KEY` | Secret Key de Cloudflare R2 |
| `R2_ENDPOINT` | Endpoint S3-compatible de R2 |
| `R2_BUCKET` | Nombre del bucket de R2 |
| `R2_PUBLIC_URL` | URL publica del bucket |
| `APP_FRONTEND_URL` | URL del frontend (`http://localhost:5173`) |

> Consultar [docs/deployment.md](docs/deployment.md) para la guia completa de configuracion.

---

## Documentacion

| Documento | Contenido |
|---|---|
| [Vision General](docs/overview.md) | Arquitectura, roles, flujo de negocio, stack tecnologico |
| [Backend](docs/backend.md) | Estructura Spring Boot, paquetes, seguridad JWT, servicios |
| [Frontend](docs/frontend.md) | Estructura React, rutas, estado global, API layer |
| [Referencia de API](docs/api-reference.md) | Todos los endpoints REST documentados con ejemplos |
| [Base de Datos](docs/database.md) | Entidades, relaciones, enums, diagrama |
| [Despliegue](docs/deployment.md) | Instalacion, variables de entorno, produccion |

---

## Stack Tecnologico

### Backend
Java 21 &bull; Spring Boot 3.5.9 &bull; Spring Security &bull; Spring Data JPA &bull; PostgreSQL &bull; JWT &bull; Lombok &bull; Apache PDFBox &bull; Apache POI &bull; Cloudflare R2 (AWS S3 SDK) &bull; Spring Mail &bull; SpringDoc OpenAPI

### Frontend
React 19 &bull; Vite 7 &bull; Tailwind CSS 3 &bull; Axios &bull; React Router 7 &bull; Lucide React &bull; React Hook Form &bull; jwt-decode

---

## Licencia

Este proyecto es software propietario desarrollado para El Mayorista.
