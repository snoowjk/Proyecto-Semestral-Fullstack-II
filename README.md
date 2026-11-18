# Facture Sneakers 👟

Tienda online de zapatillas desarrollada para **DSY1104 Desarrollo Fullstack II** (Duoc UC), Evaluación Parcial 3.

El proyecto está formado por un **frontend en React** y un **backend en Spring Boot** que se comunican mediante una API REST versionada (`/api/v1`) y protegida con **JWT** y tres roles: **CLIENTE**, **VENDEDOR** y **ADMIN**.

| Proyecto | Carpeta | Tecnologías |
|---|---|---|
| Frontend | [`frontend/`](frontend) | React 19, Vite 8, React Router 7, Bootstrap 5, Jasmine + Karma |
| Backend | [`backend/`](backend) | Java 21, Spring Boot 4.1, Spring Data JPA, Spring Security, JWT (jjwt 0.12), Swagger (springdoc-openapi 3), H2, Gradle |

---

## Arquitectura

```
Navegador (React, :5173)
        │  JSON + Authorization: Bearer <token>
        ▼
Backend Spring Boot (:8080)
  Seguridad      → JwtAuthFilter, roles, CORS
  Controllers    → endpoints REST documentados en Swagger
  Services       → lógica de negocio (stock, checkout transaccional)
  Repositories   → Spring Data JPA
        │
        ▼
Base de datos H2 (./data/facturedb)
```

---

## Cómo ejecutar

### Requisitos

- Java 21
- Node.js 20 o superior
- IntelliJ IDEA (recomendado para el backend)

### 1. Backend

1. Abrir la carpeta `backend/SnearksSource` en IntelliJ IDEA y esperar a que Gradle descargue las dependencias.
2. Ejecutar la clase `SnearksSourceApplication`, o desde la terminal:

```bash
cd backend/SnearksSource
./gradlew bootRun        # Windows: gradlew.bat bootRun
```

La base de datos se crea sola en la carpeta `data/`, y en el primer arranque se precargan las zapatillas y los blogs.

| Recurso | Dirección |
|---|---|
| API REST | http://localhost:8080/api/v1 |
| Swagger UI | http://localhost:8080/swagger-ui.html |
| Consola H2 | http://localhost:8080/h2-console (JDBC URL `jdbc:h2:file:./data/facturedb`, usuario `sa`, sin contraseña) |

### 2. Frontend

Con el backend encendido:

```bash
cd frontend/frontend-react
npm install
npm run dev
```

Abrir http://localhost:5173

---

## Funcionalidades

**Visitante:** portada, catálogo, colecciones (Jordan, Nike Sports, Nike Urban), detalle de producto, blogs, nosotros, contacto, registro e inicio de sesión.

**Cliente:** todo lo anterior, más carrito de compras, checkout, historial de pedidos (Mis pedidos) y perfil.

**Administrador:** todo lo anterior, más el panel de administración para:
- Crear, editar y eliminar productos.
- Ver todos los pedidos y cambiar su estado (CREADA, PAGADA, ENVIADA).
- Ver usuarios y asignarles el rol de vendedor o de administrador.

**Vendedor:** panel propio con acceso de solo lectura para:
- Ver la lista de productos y su detalle (descripción y stock por talla).
- Ver la lista de pedidos y su detalle.

Al vendedor no le aparecen el carrito, sus compras ni las opciones de administración.

---

## Base de datos

Se usa **H2**, una base de datos relacional con SQL estándar, en modo archivo (`backend/SnearksSource/data`). Se crea automáticamente, por lo que el proyecto se ejecuta sin instalar un servidor de base de datos. Como el acceso a datos se hace con JPA/Hibernate, migrar a MySQL u Oracle solo requiere cambiar la conexión en `application.properties` y agregar el driver.

| Tabla | Contenido |
|---|---|
| `cliente` | Usuarios y su rol (CLIENTE, VENDEDOR o ADMIN) |
| `producto` y `producto_tallas` | Zapatillas, su categoría y el stock por talla |
| `carrito` y `carrito_items` | Carrito de cada cliente |
| `boleta` y `boleta_items` | Compras y su detalle |
| `blogs` | Publicaciones del blog |

---

## Lógica de negocio

- El registro siempre crea cuentas con rol `CLIENTE`, aunque la petición envíe otro rol.
- Las contraseñas se guardan cifradas con BCrypt y nunca se devuelven en las respuestas.
- **Stock por talla:** no se puede agregar al carrito ni comprar más unidades de las disponibles.
- **Checkout transaccional:** al confirmar la compra se valida y descuenta el stock, se crea la boleta y se vacía el carrito en una sola transacción. Si algo falla, no se aplica ningún cambio.
- Al comprar se envía la boleta por correo. Si el envío falla, la compra igual queda registrada.

---

## API REST

Todos los endpoints están documentados en Swagger. Los principales:

| Recurso | Endpoints | Acceso |
|---|---|---|
| Autenticación | `POST /api/v1/clientes` (registro) · `POST /api/v1/clientes/login` · `POST /api/v1/clientes/refresh` · `POST /api/v1/clientes/logout` · `GET /api/v1/clientes/me` | Público, salvo `/me` |
| Productos | `GET /api/v1/productos` · `GET /api/v1/productos/{id}` · `GET /api/v1/productos/categoria/{jordan, sports, urban}` | Público |
| Productos | `POST /api/v1/productos` · `PUT /api/v1/productos/{id}` · `DELETE /api/v1/productos/{id}` | ADMIN |
| Blogs | `GET /api/v1/blogs` · `GET /api/v1/blogs/{id}` | Público |
| Blogs | `POST` · `PUT` · `DELETE /api/v1/blogs/...` | ADMIN |
| Carrito | `GET` · `POST` · `PUT` · `DELETE /api/v1/clientes/{id}/carrito/...` | Dueño del carrito o ADMIN |
| Boletas | `GET` · `POST /api/v1/clientes/{id}/boletas` | Dueño de las boletas o ADMIN |
| Pedidos (todos) | `GET /api/v1/admin/boletas` · `GET /api/v1/admin/boletas/{id}` | ADMIN y VENDEDOR |
| Pedidos (todos) | `PUT /api/v1/admin/boletas/{id}/estado` | ADMIN |
| Usuarios | `GET /api/v1/admin/clientes` · `POST /api/v1/admin/clientes/administradores` · `PUT /api/v1/admin/clientes/{id}/administrador` · `PUT /api/v1/admin/clientes/{id}/vendedor` | ADMIN |

El detalle de cada endpoint (datos de entrada, respuestas y roles) está en Swagger y en el documento *Anexo 3 – Documentación de APIs*.

Todos los errores responden con el mismo formato JSON:

```json
{ "fecha": "...", "status": 403, "mensaje": "No puedes acceder a recursos de otro cliente" }
```

---

## Seguridad

### Backend: autenticación con JWT y roles

| Token | Duración | Dónde viaja | Uso |
|---|---|---|---|
| Access token | 15 minutos | Header `Authorization: Bearer ...` | Acceder a los endpoints protegidos |
| Refresh token | 7 días | Cookie `HttpOnly`, `SameSite=Strict` | Solo para pedir un access token nuevo |

- Los tokens se firman con HMAC-SHA256. La clave viene de la variable de entorno `JWT_SECRET` (en desarrollo hay una por defecto).
- `JwtAuthFilter` valida en cada petición la firma, la expiración y el tipo del token, y carga el rol del usuario desde la base de datos.
- El servidor no guarda sesiones (`STATELESS`).
- **Cerrar sesión revoca todos los tokens** del usuario de inmediato, aunque no hayan expirado.
- **Control por usuario:** un cliente no puede ver ni modificar el carrito o las boletas de otro (responde 403).

### Frontend: gestión de sesión

- El access token se guarda **solo en memoria**, nunca en `localStorage` ni `sessionStorage`, para que un script malicioso no pueda robarlo.
- El refresh token lo guarda el navegador en una cookie `HttpOnly` que JavaScript no puede leer.
- **La sesión se mantiene al recargar la página:** al iniciar, la app pide un token nuevo usando esa cookie.
- Si el token expira mientras se navega, se renueva automáticamente y la petición se repite sin que el usuario lo note.

### Frontend: restricciones de acceso

| Ruta | Requisito |
|---|---|
| `/admin`, `/admin/productos`, `/admin/pedidos`, `/admin/usuarios` | Rol ADMIN |
| `/vendedor`, `/vendedor/productos`, `/vendedor/pedidos` | Rol VENDEDOR |
| `/checkout`, `/compra-exitosa`, `/mis-pedidos`, `/mi-perfil` | Sesión iniciada |
| Catálogo, detalle, blogs, contacto, nosotros | Público |

- Sin sesión, el componente `RutaProtegida` redirige al login y después devuelve al usuario a la página que quería abrir.
- Con sesión pero sin el rol necesario, muestra **ACCESO DENEGADO**.
- El menú muestra solo las opciones de cada rol: el cliente no ve la administración, y el vendedor solo ve su panel y Cerrar sesión.

Las restricciones del frontend mejoran la experiencia de cada rol, pero la seguridad real está en el backend, que valida el token y el rol en cada petición.

---

## Cuentas de prueba

Al iniciar, el backend crea automáticamente estas cuentas si todavía no existen (clase `AdminInicial`):

| Correo | Contraseña | Rol |
|---|---|---|
| `admin@facture.cl` | `Admin123` | ADMIN |
| `vendedor@facture.cl` | `Vendedor123` | VENDEDOR |

Las contraseñas se guardan cifradas con BCrypt. Se pueden cambiar con las variables de entorno `APP_ADMIN_EMAIL`, `APP_ADMIN_PASSWORD`, `APP_VENDEDOR_EMAIL` y `APP_VENDEDOR_PASSWORD`.

Las cuentas que se registran desde la página siempre se crean como `CLIENTE`. El administrador puede asignar los roles de vendedor o administrador desde el panel **Usuarios**.

> Si la base de datos se creó con una versión anterior del proyecto (sin el rol VENDEDOR), hay que detener el backend y borrar la carpeta `backend/SnearksSource/data` para que se cree de nuevo.

---

## Pruebas

### Backend: pruebas de integración

```bash
cd backend/SnearksSource
./gradlew test           # Windows: gradlew.bat test
```

`IntegracionApiTests` levanta la aplicación completa con una base de datos H2 en memoria (no toca los datos reales). Sus 13 pruebas verifican:

- Login con JWT y cookie `HttpOnly` de renovación.
- Rechazo de credenciales incorrectas, de peticiones sin token y de tokens alterados.
- Renovación del token y revocación al cerrar sesión.
- Que un cliente no pueda crear productos ni blogs, ni entrar a la administración.
- Que un cliente no pueda ver el carrito de otro.
- Que el vendedor pueda consultar productos y pedidos, pero no modificarlos ni ver usuarios (403).
- Que un cliente no pueda ver los pedidos de todos.
- Que el administrador pueda asignar el rol de vendedor.
- El CRUD completo de productos como administrador.
- La validación de stock y su descuento al comprar.

### Frontend: pruebas unitarias

```bash
cd frontend/frontend-react
npm test
```

Ejecuta las 48 pruebas con Jasmine y Karma en Chrome headless (inicio de sesión, carrito con renovación automática del token, catálogo y menú según el rol) y genera el reporte de cobertura en `coverage/html`.

---

## Estructura del repositorio

```
Proyecto-Semestral-Fullstack-II/
├── frontend/
│   └── frontend-react/
│       ├── src/
│       │   ├── api.js            # Cliente HTTP: token, renovación automática y errores
│       │   ├── App.jsx           # Rutas y gestión de sesión
│       │   ├── components/       # Navbar, RutaProtegida, MarcaCard...
│       │   └── pages/            # Catálogo, carrito, checkout, panel admin...
│       └── tests/                # Pruebas unitarias (Jasmine)
└── backend/
    └── SnearksSource/
        └── src/
            ├── main/java/com/GestionSNKR/SnearksSource/
            │   ├── config/       # Seguridad, Swagger, manejo de errores
            │   ├── controller/   # Endpoints REST
            │   ├── model/        # Entidades JPA
            │   ├── repository/   # Acceso a datos
            │   ├── security/     # JWT y control de acceso
            │   └── service/      # Lógica de negocio
            └── test/             # Pruebas de integración
```