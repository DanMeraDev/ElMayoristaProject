# Frontend - React + Vite

## Estructura General

El frontend esta construido con **React 19**, **Vite 7** como build tool, y **Tailwind CSS 3** para estilos. La arquitectura sigue una organizacion por dominio con separacion clara entre las areas de Admin y Seller.

---

## Descripcion de Carpetas

### `api/` - Capa de Servicios HTTP

Centraliza todas las llamadas al backend. Usa una instancia configurada de Axios con interceptors.

| Archivo | Descripcion |
|---|---|
| `axios.js` | Instancia base de Axios con `withCredentials: true` (cookies HttpOnly) e interceptor de response |
| `auth.api.js` | Login, logout, registro, recuperacion de contraseña, perfil actual |
| `admin.api.js` | Gestion de sellers, ventas, revision, ciclos, comisiones, reportes |
| `reports.api.js` | Upload de PDF, ventas del seller, pagos, comisiones, detalle de venta |
| `notification.api.js` | Notificaciones: listar, contar no leidas, marcar como leidas |
| `support.api.js` | CRUD de tickets de soporte |

#### Autenticacion via Cookies
La instancia de Axios se configura con `withCredentials: true`, lo que hace que el browser envie automaticamente la cookie `jwt` HttpOnly en cada request. **No se usa header Authorization ni localStorage para el token.**

#### Interceptor de Response
Captura errores 401 (token expirado) y 403 (cuenta deshabilitada):
- Excluye `/users/me` y `/auth/` del redirect (manejados por AuthContext)
- Redirige a `/login` con un mensaje informativo
- Evita bucles de redireccion si ya esta en una pagina de auth

### `auth/` - Paginas de Autenticacion

| Archivo | Descripcion |
|---|---|
| `AuthPage.jsx` | Pagina combinada de login y registro con formularios |
| `ForgotPasswordPage.jsx` | Formulario para solicitar recuperacion de contraseña |
| `ResetPasswordPage.jsx` | Formulario para establecer nueva contraseña (con token de URL) |

### `context/` - Estado Global

#### `AuthContext.jsx`
Provee estado de autenticacion a toda la aplicacion:

- **Estado**: `user`, `isAuthenticated`, `isLoading`, `errors`
- **Acciones**: `signin`, `signup`, `logout`, `refreshUser`
- **Inicializacion**: Al montar, verifica la sesion contra el backend (`GET /users/me`) usando la cookie HttpOnly
- **Persistencia**: No usa `localStorage` para token ni datos de usuario. La cookie HttpOnly es gestionada automaticamente por el browser
- **Logout**: Llama al backend (`POST /api/auth/logout`) para borrar la cookie

```jsx
// Uso en componentes
const { user, isAuthenticated, signin, logout } = useAuth();
```

#### `DarkModeContext.jsx`
Provee toggle de modo oscuro:

- **Estado**: `isDarkMode`
- **Acciones**: `toggleDarkMode`
- **Inicializacion**: Chequea `localStorage` o preferencia del sistema (`prefers-color-scheme`)
- **Efecto**: Agrega/quita clase `dark` en `<html>` para Tailwind dark mode

```jsx
// Uso en componentes
const { isDarkMode, toggleDarkMode } = useDarkMode();
```

### `router/` - Enrutamiento

#### `AppRouter.jsx`
Define todas las rutas de la aplicacion con proteccion basada en roles.

**Rutas Publicas:**
| Ruta | Componente | Descripcion |
|---|---|---|
| `/login` | `AuthPage` | Login |
| `/register` | `AuthPage` | Registro |
| `/forgot-password` | `ForgotPasswordPage` | Recuperacion |
| `/reset-password` | `ResetPasswordPage` | Reset con token |
| `/pending-approval` | `PendingApproval` | Espera de aprobacion |

**Rutas de Admin** (requieren rol `ADMIN`):
| Ruta | Componente | Descripcion |
|---|---|---|
| `/admin/dashboard` | `Dashboard` | Panel principal con estadisticas |
| `/admin/sellers` | `SellersList` | Lista de vendedores |
| `/admin/sellers/:id` | `SellerDetails` | Detalle de un vendedor |
| `/admin/sales-review` | `SalesReview` | Ventas pendientes de revision |
| `/admin/sales-history` | `AdminSalesHistory` | Historial completo de ventas |
| `/admin/reports` | `AdminReports` | Reportes y ciclos de facturacion |

**Rutas de Seller** (requieren rol `SELLER`):
| Ruta | Componente | Descripcion |
|---|---|---|
| `/seller/home` | `SellerHome` | Dashboard del vendedor |
| `/seller/ventas` | `SellerSales` | Mis ventas |
| `/seller/fiar-usuarios` | `SellerFiarUsuarios` | Fiar a clientes registrados |
| `/seller/mis-fiados` | `SellerMisFiados` | Mis fiados personales |
| `/seller/soporte` | `SellerSupport` | Tickets de soporte |

#### Componente `ProtectedRoute`
Wrapper que protege rutas verificando:
1. Si el usuario esta autenticado
2. Si tiene el rol permitido (`allowedRoles`)
3. Si es seller pendiente de aprobacion → redirige a `/pending-approval`
4. Si el rol no coincide → redirige al dashboard correspondiente a su rol

### `components/` - Componentes Compartidos

| Archivo | Descripcion |
|---|---|
| `SaleDetailModal.jsx` | Modal reutilizable para ver detalle de una venta (usado por admin y seller) |
| `NotificationBell.jsx` | Campana de notificaciones con badge de no leidas (admin y seller) |

### `admin/` - Modulo de Administracion

**Paginas (`admin/pages/`):**
| Archivo | Descripcion |
|---|---|
| `Dashboard.jsx` | Dashboard con estadisticas: ventas totales, sellers activos, comisiones, ventas pendientes |
| `SellersList.jsx` | Tabla paginada de todos los sellers con acciones (habilitar/deshabilitar, editar comision) |
| `SellerDetails.jsx` | Vista detallada de un seller: info, ventas, comisiones |
| `SalesReview.jsx` | Cola de ventas en estado UNDER_REVIEW para aprobar/rechazar |
| `AdminSalesHistory.jsx` | Historial completo de todas las ventas con filtros |
| `AdminReports.jsx` | Gestion de ciclos: estadisticas del ciclo actual, cierre, historial |
| `AdminSettings.jsx` | Configuraciones del administrador |
| `PendingSellers.jsx` | Lista de sellers pendientes de aprobacion |

**Subcomponentes (`admin/components/`):**
| Archivo | Descripcion |
|---|---|
| `AdminSidebar.jsx` | Menu lateral de navegacion del admin |
| `AdminFooter.jsx` | Footer del layout admin |
| `AdminNotificationsPanel.jsx` | Panel de notificaciones del admin |

### `seller/` - Modulo de Vendedor

**Paginas (`seller/pages/`):**
| Archivo | Descripcion |
|---|---|
| `SellerHome.jsx` | Dashboard del seller: comisiones, ventas recientes, estadisticas |
| `SellerSales.jsx` | Lista de ventas del seller con acciones de pago y upload |
| `SellerFiarUsuarios.jsx` | Registrar fiados a clientes aprobados |
| `SellerMisFiados.jsx` | Lista de fiados personales del seller |
| `PendingApproval.jsx` | Pantalla mostrada a sellers que aun no han sido aprobados |
| `SellerSupport.jsx` | Pagina de soporte: crear tickets, ver historial |

**Subcomponentes (`seller/components/`):**
| Archivo | Descripcion |
|---|---|
| `SellerSidebar.jsx` | Menu lateral de navegacion del seller |
| `SellerFooter.jsx` | Footer del layout seller |
| `SalesUploadModal.jsx` | Modal para subir ventas (manual o PDF) |
| `TvSaleModal.jsx` | Modal para crear ventas de tipo TV (serial, modelo) |
| `PendingSalesPanel.jsx` | Panel con ventas en estado PENDING |

---

## Sistema de Estilos

### Tailwind CSS + Dark Mode

El proyecto usa **Tailwind CSS 3** con soporte para modo oscuro basado en la clase `dark` en el elemento `<html>`:

```jsx
// Ejemplo de clase con dark mode
<div className="bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100">
```

El `DarkModeContext` gestiona el toggle y persiste la preferencia en `localStorage`.

---

## Configuracion de Vite

```js
// vite.config.js
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
```

El proxy de desarrollo redirige todas las llamadas `/api/*` al backend en `localhost:8080`, eliminando problemas de CORS durante el desarrollo.

---

## Flujo de Autenticacion (Frontend)

```
1. Usuario ingresa credenciales en AuthPage
2. AuthContext.signin() llama a POST /api/auth/login
3. Respuesta exitosa:
   → Backend setea cookie HttpOnly con el JWT
   → AuthContext guarda datos del usuario en estado React
   → Estado isAuthenticated = true
4. AppRouter redirige segun rol:
   → ADMIN → /admin/dashboard
   → SELLER → /seller/home (o /pending-approval si pendiente)
5. Cada request subsecuente:
   → Browser envia la cookie automaticamente (withCredentials: true)
6. Si token expira (401):
   → Interceptor redirige a /login con mensaje "Sesion expirada"
   → Excluye /users/me y /auth/ del redirect (manejados por AuthContext)
7. Logout:
   → AuthContext llama a POST /api/auth/logout
   → Backend borra la cookie (MaxAge=0)
   → Estado isAuthenticated = false
```
