# Guia de Despliegue

## Requisitos Previos

| Requisito | Version | Descripcion |
|---|---|---|
| Java JDK | 21+ | Runtime para el backend Spring Boot |
| Node.js | 18+ | Runtime para el frontend React |
| npm | 9+ | Gestor de paquetes (viene con Node.js) |
| PostgreSQL | 14+ | Base de datos relacional |
| Git | 2.x | Control de versiones |

---

## Variables de Entorno

Crear un archivo `.env` en la raiz de `ElMayoristaApplication/`:

```env
# ==========================================
# BASE DE DATOS
# ==========================================
# URL de conexion JDBC a PostgreSQL
# Formato: jdbc:postgresql://host:puerto/nombre_base_datos
DB_URL=jdbc:postgresql://localhost:5432/elmayorista

# Usuario de la base de datos
DB_USERNAME=postgres

# Contraseña de la base de datos
DB_PASSWORD=tu_contraseña

# ==========================================
# EMAIL (Gmail SMTP)
# ==========================================
# Cuenta de Gmail para envio de correos
# Se usa para: recuperacion de contraseña, aprobacion/rechazo de sellers, notificaciones de tickets
MAIL_USERNAME=tu_email@gmail.com

# App Password de Gmail (NO es la contraseña normal)
# Generar en: Google Account → Security → 2-Step Verification → App Passwords
MAIL_PASSWORD=xxxx xxxx xxxx xxxx

# ==========================================
# OPENAI
# ==========================================
# API Key de OpenAI para extraccion de datos de PDFs
# Se usa para: procesar PDFs de Odoo y extraer datos de ventas automaticamente
OPENAI_API_KEY=sk-...

# ==========================================
# CLOUDFLARE R2 (Almacenamiento de Archivos)
# ==========================================
# Access Key ID de Cloudflare R2
# Obtener en: Cloudflare Dashboard → R2 → Manage R2 API Tokens
R2_ACCESS_KEY=tu_access_key

# Secret Access Key de Cloudflare R2
R2_SECRET_KEY=tu_secret_key

# Endpoint S3-compatible de R2
# Formato: https://<ACCOUNT_ID>.r2.cloudflarestorage.com
R2_ENDPOINT=https://tu_account_id.r2.cloudflarestorage.com

# Nombre del bucket de R2
R2_BUCKET=nombre-del-bucket

# URL publica del bucket (para acceder a los archivos subidos)
# Configurar en: Cloudflare Dashboard → R2 → Bucket → Settings → Public access
R2_PUBLIC_URL=https://pub-xxxxx.r2.dev

# ==========================================
# APLICACION
# ==========================================
# URL del frontend (para links en emails y CORS)
APP_FRONTEND_URL=http://localhost:5173
```

---

## Instalacion Paso a Paso

### 1. Clonar el Repositorio

```bash
git clone <url-del-repositorio>
cd ElMayoristaProject
```

### 2. Configurar la Base de Datos

```sql
-- Conectar a PostgreSQL y crear la base de datos
CREATE DATABASE elmayorista;
```

### 3. Configurar el Backend

```bash
cd ElMayoristaApplication

# Crear el archivo .env con las variables (ver seccion anterior)
cp .env.example .env
# Editar .env con tus valores reales
```

### 4. Ejecutar el Backend

```bash
# En ElMayoristaApplication/
./mvnw spring-boot:run
```

El backend estara disponible en `http://localhost:8080`.

> **Nota**: La primera ejecucion creara las tablas automaticamente (`ddl-auto=create-drop`) y un usuario admin por defecto via `DataInitializer`.

### 5. Configurar el Frontend

```bash
cd mayorista-frontend

# Instalar dependencias
npm install
```

### 6. Ejecutar el Frontend

```bash
# En mayorista-frontend/
npm run dev
```

El frontend estara disponible en `http://localhost:5173`.

El proxy de Vite redirige automaticamente las llamadas `/api/*` al backend en `http://localhost:8080`.

---

## Configuracion de Servicios Externos

### Gmail SMTP

1. Activar **verificacion en 2 pasos** en tu cuenta de Google
2. Ir a [Google Account → App Passwords](https://myaccount.google.com/apppasswords)
3. Crear un "App Password" para "Mail"
4. Usar esa contraseña (16 caracteres, sin espacios) como `MAIL_PASSWORD`

**Correos que envia el sistema:**
- Recuperacion de contraseña
- Aprobacion de vendedor (bienvenida)
- Rechazo de vendedor (con motivo)
- Notificacion de nuevo ticket de soporte (al admin)

### Cloudflare R2

1. Crear una cuenta en [Cloudflare](https://dash.cloudflare.com/)
2. Ir a **R2 Object Storage** y crear un bucket
3. Configurar **Public Access** para el bucket (URLs publicas para archivos)
4. Crear un **API Token** con permisos de lectura/escritura
5. Usar el Account ID, Access Key, Secret Key y Public URL en el `.env`

**Estructura de archivos en R2:**
```
bucket/
├── receipts/     # Comprobantes de pago (imagenes/PDFs)
├── pdfs/         # PDFs de reportes de venta subidos
└── reports/      # Reportes Excel generados al cerrar ciclos
```

### OpenAI API

1. Crear una cuenta en [OpenAI Platform](https://platform.openai.com/)
2. Generar una API Key
3. Asegurarse de tener creditos disponibles
4. Usar la API Key como `OPENAI_API_KEY`

**Uso en el sistema:** Extraccion inteligente de datos de PDFs de Odoo (ventas, clientes, productos).

---

## Modo Desarrollo vs Produccion

### Desarrollo (configuracion actual)

```properties
# application.properties
spring.jpa.hibernate.ddl-auto=create-drop    # Recrea BD en cada reinicio
spring.jpa.show-sql=true                     # Muestra SQL en consola
```

- La base de datos se **recrea completamente** en cada reinicio
- Los logs SQL se muestran en la consola
- El `DataInitializer` crea un admin por defecto

### Produccion (cambios recomendados)

```properties
# application.properties - CAMBIOS PARA PRODUCCION
spring.jpa.hibernate.ddl-auto=validate       # Solo valida el esquema, no modifica
spring.jpa.show-sql=false                    # No mostrar SQL en logs
```

**Otros cambios recomendados para produccion:**

1. **`ddl-auto`**: Cambiar de `create-drop` a `validate` o `none`
   - `validate`: Verifica que las entidades coincidan con el esquema existente
   - `none`: No hace nada con el esquema (recomendado con migraciones)
   - Considerar usar **Flyway** o **Liquibase** para migraciones de base de datos

2. **JWT Secret**: Cambiar la clave secreta por defecto por una clave segura y unica
   ```properties
   jwt.secret=TU_CLAVE_SECRETA_SEGURA_EN_BASE64
   ```

3. **CORS**: Configurar el `AppConfig` para aceptar solo el dominio de produccion en vez de `localhost`

4. **HTTPS**: Configurar certificados SSL/TLS

5. **Logs**: Configurar niveles de log apropiados

6. **Frontend Build**: Generar build de produccion
   ```bash
   cd mayorista-frontend
   npm run build
   # Los archivos se generan en dist/
   ```

---

## Swagger UI

La documentacion interactiva de la API esta disponible en:

```
http://localhost:8080/swagger-ui/index.html
```

Endpoints de OpenAPI JSON:
```
http://localhost:8080/v3/api-docs
```

Estas rutas son publicas y no requieren autenticacion.

---

## Verificacion Post-Instalacion

Despues de instalar y ejecutar ambos servicios, verificar:

1. **Backend** - Acceder a `http://localhost:8080/swagger-ui/index.html`
2. **Frontend** - Acceder a `http://localhost:5173` (debe mostrar pagina de login)
3. **Base de datos** - Verificar que las tablas fueron creadas
4. **Login** - Usar las credenciales del admin creado por `DataInitializer`
5. **Email** - Registrar un seller y verificar que el admin recibe notificacion
