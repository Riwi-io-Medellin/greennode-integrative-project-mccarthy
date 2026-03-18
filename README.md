# Documentación General — GreenNode

## ¿Qué es GreenNode?

GreenNode es una plataforma web B2B (Business to Business) de reforestación.
Permite que **empresas colombianas** contraten proyectos de siembra de árboles para compensar su huella ambiental.

Hay dos tipos de usuarios:

- **Cliente:** una empresa que quiere plantar árboles. Solicita cotizaciones y hace seguimiento a su proyecto.
- **Administrador:** el equipo de GreenNode. Revisa las cotizaciones, gestiona los proyectos y sube evidencias.

---

## Estructura general del proyecto

```
GreenNode-Completo/
│
├── backend/          ← El servidor (lo que el usuario NO ve)
├── frontend/         ← Las pantallas web (lo que el usuario SÍ ve)
├── database/         ← Script SQL con datos iniciales
├── uploads/          ← Archivos subidos (fotos y documentos)
└── package.json      ← Dependencias del proyecto raíz
```

Piénsalo así: el **frontend** es la vitrina del negocio y el **backend** es la bodega donde ocurre todo el trabajo real.

---

---

# BACKEND — El servidor

> El backend es un servidor hecho con **Node.js + Express**. Su trabajo es recibir peticiones del frontend, consultar la base de datos y devolver una respuesta.

```
backend/
│
├── server.js              ← Punto de arranque
├── app.js                 ← Configuración principal del servidor
├── .env                   ← Variables secretas (contraseñas, claves API)
│
└── src/
    ├── config/            ← Configuración de conexiones externas
    ├── controllers/       ← Lógica de autenticación (login, registro)
    ├── middlewares/       ← Filtros que se ejecutan antes de cada petición
    ├── models/            ← Consultas SQL a la base de datos
    ├── modules/           ← Cada funcionalidad del sistema (proyectos, cotizaciones, etc.)
    ├── routes/            ← Rutas de autenticación
    └── utils/             ← Herramientas reutilizables
```

---

## `server.js` — El punto de arranque

Es el primer archivo que se ejecuta cuando corres el proyecto con `node server.js`.
Solo hace tres cosas:

1. Carga las variables de entorno (`.env`).
2. Prueba que la conexión a la base de datos funcione.
3. Enciende el servidor en el puerto configurado (por defecto: 3000).

```
Analogía: es como el botón de encendido de un aparato.
```

---

## `app.js` — El director de tráfico

Aquí se configura todo el servidor de Express. Define:

- **Qué páginas HTML entregar** cuando alguien abre una URL en el navegador.
  Por ejemplo: si alguien va a `/login`, el servidor devuelve el archivo `login.html`.
- **Qué archivos estáticos compartir** (imágenes, CSS, JS del frontend).
- **Qué rutas de API están disponibles** (los endpoints que usa el frontend para pedir datos).

```
Analogía: es como el recepcionista de un edificio que te dice
"si buscas ventas ve al piso 2, si buscas RRHH ve al piso 4".
```

---

## `src/config/` — Configuración de conexiones

### `env.js`

Lee el archivo `.env` y carga todas las variables de entorno al sistema.
Esto permite que el código use `process.env.DB_PASSWORD` en lugar de escribir
la contraseña directamente en el código.

### `db.js`

Crea la conexión a la base de datos **PostgreSQL**.
Usa un "Pool de conexiones", que es como tener varias líneas telefónicas abiertas
al mismo tiempo para atender múltiples peticiones sin que se bloqueen entre sí.

```
Analogía: en lugar de abrir y cerrar la puerta cada vez que alguien entra,
mantienes varias puertas abiertas para que el flujo sea más rápido.
```

---

## `.env` — Variables secretas

Archivo que contiene información sensible que **nunca se sube a GitHub**:

| Variable                                       | Para qué sirve                                        |
| ---------------------------------------------- | ----------------------------------------------------- |
| `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | Credenciales de la base de datos PostgreSQL           |
| `JWT_SECRET`                                   | Clave secreta para firmar los tokens de sesión        |
| `OPENAI_API_KEY`                               | Clave para usar la IA de OpenAI (genera Marco Lógico) |
| `RESEND_API_KEY`                               | Clave para enviar emails de verificación              |

```
Analogía: es como la caja fuerte del proyecto. Guarda las llaves de todo.
```

---

## `src/controllers/` — Lógica de autenticación

### `auth.controller.js`

Es el archivo más importante de la autenticación. Contiene 5 funciones:

| Función         | Qué hace                                                                                         |
| --------------- | ------------------------------------------------------------------------------------------------ |
| `register()`    | Crea una nueva empresa en la BD, genera un código de 6 dígitos y envía el email de verificación  |
| `login()`       | Verifica email + contraseña, comprueba que el email esté verificado y devuelve un JWT            |
| `verifyEmail()` | Recibe el código de 6 dígitos, lo valida contra la BD y marca el email como verificado           |
| `resendCode()`  | Genera un nuevo código y lo reenvía al email del usuario                                         |
| `getProfile()`  | Devuelve los datos actualizados de la empresa (nombre, sector, empleados, árboles comprometidos) |

```
Analogía: es como el portero de un club. Decide quién entra,
quién no entra y le da un brazalete (JWT) a quien sí puede pasar.
```

---

## `src/middlewares/` — Los filtros de seguridad

Un **middleware** es una función que se ejecuta _antes_ de que la petición llegue al controlador.
Sirve para validar, filtrar o rechazar peticiones.

### `auth.middleware.js` — Verificar identidad

Revisa que cada petición traiga un **JWT válido** en el encabezado `Authorization`.
Si el token no existe o está vencido, responde con error 401 (No autorizado) y la petición no pasa.

```
Analogía: es el guardia en la puerta que revisa el brazalete.
Sin brazalete, no entras.
```

### `role.middleware.js` — Verificar permisos

Después de verificar la identidad, confirma que el usuario tenga el **rol correcto**.
Por ejemplo: un cliente no puede acceder a endpoints de administrador.

```
Analogía: el brazalete del cliente es azul y el del admin es rojo.
Algunas puertas solo abren con el rojo.
```

### `authValidation.middleware.js` — Validar datos del formulario

Valida que los datos enviados en el registro y login cumplan las reglas básicas
(email con formato correcto, contraseña con mínimo 8 caracteres, etc.) antes de
procesar la petición.

```
Analogía: es el filtro de spam del correo. Rechaza lo que no tiene sentido
antes de que llegue a la bandeja de entrada.
```

---

## `src/models/` — Las consultas a la base de datos

### `auth.model.js`

Contiene las **consultas SQL** relacionadas con usuarios y empresas:

| Función             | Qué hace en SQL                                  |
| ------------------- | ------------------------------------------------ |
| `findUserByEmail()` | `SELECT` de usuario + empresa + rol por email    |
| `findRoleByName()`  | Busca el ID del rol 'client' o 'admin'           |
| `createCompany()`   | `INSERT` de nueva empresa                        |
| `createUser()`      | `INSERT` de nuevo usuario vinculado a la empresa |

```
Analogía: si el controlador es el chef, el model es el libro de recetas.
El chef decide qué cocinar y el libro le dice exactamente cómo hacerlo con la BD.
```

---

## `src/modules/` — Los módulos de negocio

Cada carpeta dentro de `modules/` agrupa la **ruta** y el **controlador** de una funcionalidad específica.
Están separados para que el proyecto sea más ordenado y fácil de mantener.

### `territory/` — Territorios de reforestación

Maneja las zonas donde se pueden plantar árboles (Andes, Caribe, Amazonia, etc.).

| Endpoint                   | Qué hace                                                       |
| -------------------------- | -------------------------------------------------------------- |
| `GET /api/territories`     | Devuelve la lista de todos los territorios disponibles         |
| `GET /api/territories/:id` | Devuelve un territorio específico con sus especies disponibles |

**Datos de cada territorio:** nombre, ciudad, capacidad de siembra, dificultad de acceso, disponibilidad de agua.

---

### `species/` — Especies de árboles

Maneja el catálogo de árboles disponibles para sembrar.

| Endpoint                            | Qué hace                                                           |
| ----------------------------------- | ------------------------------------------------------------------ |
| `GET /api/species`                  | Devuelve todas las especies                                        |
| `GET /api/species/by-territory/:id` | Devuelve solo las especies disponibles en un territorio específico |

**Datos de cada especie:** nombre, precio por unidad, tasa de supervivencia, servicio ecosistémico, tipo (nativa/pionera/exótica).

---

### `quote/` — Cotizaciones

Es el núcleo del negocio. Maneja todo el ciclo de vida de una cotización.

**Ciclo de vida de una cotización:**

```
pending → reviewed → sent → accepted → (se crea el proyecto)
                       ↓
                   rejected → (el cliente puede pedir una nueva)
```

| Endpoint                       | Quién lo usa | Qué hace                                                              |
| ------------------------------ | ------------ | --------------------------------------------------------------------- |
| `POST /api/quotes`             | Cliente      | Crea nueva cotización y dispara la generación del Marco Lógico con IA |
| `GET /api/quotes/my`           | Cliente      | Lista sus propias cotizaciones                                        |
| `GET /api/quotes`              | Admin        | Lista todas las cotizaciones de todos los clientes                    |
| `GET /api/quotes/:id`          | Ambos        | Detalle de una cotización específica                                  |
| `PATCH /api/quotes/:id/status` | Ambos        | Cambia el estado (aceptar, rechazar, etc.)                            |
| `POST /api/quotes/:id/send`    | Admin        | Guarda texto validado y cambia estado a 'sent'                        |

**Cálculo del precio:**

```
Subtotal          = árboles × precio_por_unidad
Gastos operativos = Subtotal × 50%
Total             = Subtotal × 1.5
```

---

### `project/` — Proyectos

Maneja los proyectos activos (se crean cuando el cliente acepta una cotización).

| Endpoint                           | Quién lo usa | Qué hace                                                       |
| ---------------------------------- | ------------ | -------------------------------------------------------------- |
| `GET /api/projects`                | Admin        | Lista todos los proyectos                                      |
| `GET /api/projects/my`             | Cliente      | Lista los proyectos de su empresa                              |
| `GET /api/projects/:id`            | Ambos        | Detalle completo con eventos de siembra, evidencias y archivos |
| `PATCH /api/projects/:id/status`   | Admin        | Cambia el estado del proyecto                                  |
| `PATCH /api/projects/:id/progress` | Admin        | Actualiza los árboles sembrados (inserta un evento de siembra) |

**Cálculo del progreso:**

```
Progreso = (árboles_sembrados / total_árboles × 70%) + (evidencias / 5 × 30%)
```

Esto significa que sembrar árboles vale el 70% del progreso y subir evidencias el 30%.

---

### `evidence/` — Evidencias fotográficas

Maneja las fotos que el admin sube para demostrar el avance del proyecto.

| Endpoint                       | Qué hace                                                  |
| ------------------------------ | --------------------------------------------------------- |
| `GET /api/evidence/:projectId` | Devuelve todas las fotos de un proyecto                   |
| `POST /api/evidence`           | Sube una nueva foto (máx 10 MB, límite de 5 por proyecto) |
| `DELETE /api/evidence/:id`     | Elimina una foto                                          |

---

### `file/` — Documentos

Maneja los documentos legales, certificados y reportes de cada proyecto.

| Endpoint                    | Qué hace                                       |
| --------------------------- | ---------------------------------------------- |
| `GET /api/files/:projectId` | Devuelve todos los documentos de un proyecto   |
| `POST /api/files`           | Sube un documento (PDF, DOC, XLSX — máx 20 MB) |
| `DELETE /api/files/:id`     | Elimina un documento                           |

**Tipos de documento:** `legal_document`, `certificate`, `report`, `other`.

---

### `planting-event/` — Eventos de siembra

Registra cada vez que el admin actualiza los árboles sembrados.
En lugar de sobrescribir el número, se guarda un nuevo evento con la cantidad plantada en esa jornada.
La cantidad total de árboles sembrados se calcula sumando todos los eventos (`SUM`).

```
Analogía: en lugar de borrar y escribir el saldo del banco,
se registra cada depósito y el saldo se calcula sumando todo el historial.
```

---

## `src/routes/` — Rutas de autenticación

### `auth.routes.js`

Define los 5 endpoints públicos de autenticación:

```
POST /api/auth/register       ← Registrar empresa
POST /api/auth/login          ← Iniciar sesión
POST /api/auth/verify-email   ← Verificar código OTP
POST /api/auth/resend-code    ← Reenviar código
GET  /api/auth/profile        ← Ver perfil (requiere token)
```

---

## `src/utils/` — Herramientas reutilizables

Son funciones de uso general que se pueden llamar desde cualquier parte del backend.

### `hash.js` — Encriptación de contraseñas

Usa la librería `bcryptjs` para:

- **`hashPassword()`:** Convierte una contraseña legible en un texto encriptado antes de guardarla en BD.
- **`comparePassword()`:** Compara la contraseña que escribe el usuario contra la versión encriptada almacenada.

```
Analogía: es como una picadora que convierte carne en picadillo.
Puedes verificar si algo fue picado por ella, pero no puedes reconstruir la carne original.
```

### `response.js` — Respuestas estandarizadas

Define dos funciones para que todas las respuestas del servidor tengan el mismo formato JSON:

```json
// Éxito
{ "success": true, "message": "...", "data": {...} }

// Error
{ "success": false, "message": "...", "errors": {...} }
```

### `email.js` — Envío de emails con Resend

Usa la API de **Resend** para enviar el email de verificación.
Genera un HTML con diseño de marca GreenNode (verde, logo, código grande centrado).

### `ai.js` — Generación de Marco Lógico con IA

Usa la API de **OpenAI (gpt-4o-mini)** para generar automáticamente un Marco Lógico
completo del proyecto de reforestación.

Recibe como entrada: empresa, territorio, especie, cantidad de árboles, título, descripción y monto.
Devuelve: objetivos, actividades, cronograma estimado, presupuesto detallado y tasa de supervivencia esperada.

Si la IA falla, genera un texto de respaldo genérico para que el sistema no se rompa.

---

# FRONTEND — Las pantallas web

> El frontend está hecho con HTML, CSS (Bootstrap) y JavaScript puro (sin frameworks como React). Cada página es un archivo `.html` que carga sus scripts como módulos ES6.

```
frontend/
│
├── pages/             ← Todas las pantallas HTML
│   ├── auth/          ← Login, registro, verificación
│   ├── admin/         ← Panel del administrador
│   └── client/        ← Panel del cliente
│
├── js/                ← Toda la lógica JavaScript
│   ├── pages/         ← Un archivo JS por cada página
│   ├── services/      ← Comunicación con el backend
│   └── utils/         ← Herramientas reutilizables
│
└── styles/            ← Archivos CSS propios del proyecto
```

---

## `frontend/pages/` — Las pantallas HTML

### `auth/` — Páginas de acceso

| Archivo             | Qué muestra                                                                                        |
| ------------------- | -------------------------------------------------------------------------------------------------- |
| `login.html`        | Formulario de inicio de sesión con email y contraseña                                              |
| `register.html`     | Formulario de registro con datos de la empresa (nombre, sector, empleados, contraseña)             |
| `verify-email.html` | Pantalla de verificación con 6 inputs OTP separados, botón de reenvío con countdown de 60 segundos |

---

### `admin/` — Panel del administrador

| Archivo                 | Qué muestra                                                                                                                                   |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `dashboard.html`        | Vista general: tarjetas con conteos (cotizaciones pendientes, proyectos en curso, completados), gráfica mensual, tabla de proyectos recientes |
| `proyectos.html`        | Lista de todos los proyectos con buscador, filtro por estado y barra de progreso                                                              |
| `proyecto-detalle.html` | Vista completa de un proyecto: ciclo de vida, árboles sembrados (editable), evidencias, documentos, cotización y descarga de PDF              |
| `cotizaciones.html`     | Lista de todas las cotizaciones de todos los clientes con badges de estado                                                                    |
| `validacion.html`       | Panel doble: borrador generado por IA (izquierda) y versión editable por el admin (derecha) para enviar al cliente                            |
| `archivos.html`         | Repositorio de todos los documentos subidos, con filtro por proyecto                                                                          |

---

### `client/` — Panel del cliente

| Archivo                 | Qué muestra                                                                                                       |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `proyectos.html`        | Lista de los proyectos propios con estado y progreso                                                              |
| `proyecto-detalle.html` | Vista de su proyecto: progreso, galería de evidencias, documentos descargables, información de cotización         |
| `cotizaciones.html`     | Historial de cotizaciones: puede ver el Marco Lógico, aceptar/rechazar cotizaciones enviadas y descargar PDF      |
| `nueva-cotizacion.html` | Asistente de 5 pasos para crear una nueva cotización (territorio → especie → confirmación con desglose de precio) |

---

## `frontend/js/pages/` — La lógica de cada pantalla

Cada archivo JS controla el comportamiento de su página correspondiente.

| Archivo              | Qué hace                                                                                                                                                            |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `login.js`           | Valida el formulario, llama al endpoint de login, guarda el JWT en `localStorage`, redirige según el rol. Si el email no está verificado, redirige a la página OTP. |
| `register.js`        | Valida el formulario de registro, llama al endpoint, redirige a `/verify-email?email=xxx` (no hace login automático).                                               |
| `admin-dashboard.js` | Carga las estadísticas desde la API, renderiza las tarjetas y la gráfica de Chart.js.                                                                               |

> Las páginas más complejas (como `nueva-cotizacion.html` y `proyecto-detalle.html`) tienen su lógica JS directamente dentro de un `<script type="module">` en el mismo archivo HTML, lo que las hace más fáciles de entender al ver todo junto.

---

## `frontend/js/services/` — Comunicación con el backend

### `authService.js`

Es el intermediario entre el formulario de login/registro y el servidor.
Tiene una función por cada endpoint de autenticación:

| Función                         | Qué hace                                                                  |
| ------------------------------- | ------------------------------------------------------------------------- |
| `loginUser(payload)`            | Hace `POST /api/auth/login`, adjunta el status y email al error si es 403 |
| `registerUser(payload)`         | Hace `POST /api/auth/register`                                            |
| `verifyEmailCode(email, code)`  | Hace `POST /api/auth/verify-email`                                        |
| `resendVerificationCode(email)` | Hace `POST /api/auth/resend-code`                                         |

---

## `frontend/js/utils/` — Herramientas del frontend

### `api.js` — El cliente HTTP autenticado

Es el archivo más importante del frontend para las páginas del panel.
Tiene funciones que todas las páginas usan:

| Función                  | Qué hace                                                                                                |
| ------------------------ | ------------------------------------------------------------------------------------------------------- |
| `getToken()`             | Lee el JWT guardado en `localStorage`                                                                   |
| `getUser()`              | Lee los datos del usuario guardados en `localStorage`                                                   |
| `requireAuth(role)`      | Si no hay sesión activa, redirige a `/login`. Si el rol no coincide, redirige al panel correcto.        |
| `apiGet(path)`           | Hace una petición GET con el JWT en el encabezado. Si responde 401, borra la sesión y redirige a login. |
| `apiPost(path, body)`    | Hace POST con JWT y body en JSON                                                                        |
| `apiPatch(path, body)`   | Hace PATCH con JWT y body en JSON                                                                       |
| `getStatusBadge(status)` | Devuelve el HTML de un badge de Bootstrap con el color correcto según el estado                         |
| `formatCOP(amount)`      | Formatea un número como `COP $64.000.000`                                                               |
| `openCompanyModal(user)` | Abre un modal con los datos de la empresa, consultando datos frescos del perfil                         |

```
Analogía: api.js es como el asistente personal de cada página.
Siempre lleva el carnet de identificación (JWT) cuando va a buscar información.
```

### `ui.js` — Manejo visual de formularios

Funciones para mostrar/ocultar estados en los formularios:

| Función                      | Qué hace                                                               |
| ---------------------------- | ---------------------------------------------------------------------- |
| `showFieldError(id, msg)`    | Pone el campo en rojo y muestra el mensaje de error                    |
| `showFieldSuccess(id)`       | Pone el campo en verde                                                 |
| `clearFormStates(ids)`       | Limpia todos los estados visuales de los campos indicados              |
| `showGlobalAlert(msg, type)` | Muestra un cuadro de alerta general (éxito, error, advertencia)        |
| `setButtonLoading(id, true)` | Deshabilita el botón y muestra un spinner mientras espera la respuesta |
| `setupPasswordToggles()`     | Activa el botón del ojo para mostrar/ocultar contraseñas               |

### `validators.js` — Validaciones de formularios

Contiene las reglas de validación del lado del cliente (antes de enviar al servidor):

- Email con formato válido.
- Contraseña mínimo 8 caracteres, una mayúscula, un número.
- Confirmación de contraseña coincide.
- Campos obligatorios no vacíos.

---

## `frontend/styles/` — Los estilos CSS propios

| Archivo         | Qué contiene                                                                                                                                                    |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `auth.css`      | Estilos para las páginas de login, registro y verificación: fondo con gradiente verde, tarjeta blanca centrada, botones y campos con colores de marca GreenNode |
| `dashboard.css` | Estilos del panel principal: sidebar colapsable, tarjetas de estadísticas, barra de progreso, badges, tablas y layout de dos columnas                           |

> El proyecto usa **Bootstrap 5** como base. Los archivos CSS propios solo sobreescriben o agregan estilos específicos de la marca GreenNode.

---

## `uploads/` — Los archivos subidos por los usuarios

Carpeta en el servidor donde se guardan físicamente los archivos. No se sube a Git (solo las carpetas vacías).

```
uploads/
├── evidencias/    ← Fotos del progreso del proyecto (JPG, PNG, WEBP — máx 10 MB)
└── documentos/    ← Archivos legales y reportes (PDF, DOC, XLSX — máx 20 MB)
```

Los nombres de los archivos se generan automáticamente como `timestamp-numeroaleatorio.extension`
para evitar que dos archivos con el mismo nombre se sobreescriban.

---

---

# ¿Cómo fluye todo junto? — Un ejemplo completo

Aquí se explica el flujo completo desde que una empresa se registra hasta que tiene un proyecto activo:

```
1. La empresa entra a /register
   └── Llena el formulario → register.js lo valida → authService.js lo envía al backend
       └── auth.controller.js crea la empresa en BD, genera código OTP, envía email con Resend
           └── El navegador redirige a /verify-email?email=xxx

2. La empresa ingresa el código de 6 dígitos
   └── verify-email.html → authService.verifyEmailCode() → POST /api/auth/verify-email
       └── El backend valida el código y la expiración, marca email_verified=true
           └── Devuelve un JWT → el frontend lo guarda en localStorage → redirige a /client/proyectos

3. La empresa crea una cotización en /client/nueva-cotizacion
   └── Paso 1: datos de empresa (precargados del JWT)
   └── Paso 2: selecciona territorio → api.js llama GET /api/territories
   └── Paso 4: selecciona especie → GET /api/species/by-territory/:id
   └── Paso 5: ve el desglose de precio → confirma y envía
       └── POST /api/quotes → quote.controller.js calcula total_price y llama a ai.js
           └── OpenAI genera el Marco Lógico → se guarda en quote.ai_draft_text

4. El admin revisa la cotización en /admin/validacion
   └── Ve el borrador de IA y lo edita si necesita
   └── Hace clic en "Enviar al cliente" → POST /api/quotes/:id/send → estado cambia a 'sent'

5. La empresa acepta la cotización en /client/cotizaciones
   └── PATCH /api/quotes/:id/status con status='accepted'
       └── El backend crea automáticamente el proyecto vinculado a esa cotización

6. El admin gestiona el proyecto en /admin/proyecto-detalle
   └── Actualiza árboles sembrados → PATCH /api/projects/:id/progress → inserta planting_event
   └── Sube fotos → POST /api/evidence (máx 5 fotos)
   └── Sube documentos → POST /api/files
       └── El progreso se recalcula: 70% árboles + 30% evidencias

7. La empresa hace seguimiento en /client/proyecto-detalle
   └── Ve la barra de progreso, la galería de fotos y los documentos descargables
```

---

# Resumen de tecnologías usadas

| Categoría              | Tecnología               | Para qué se usa                     |
| ---------------------- | ------------------------ | ----------------------------------- |
| **Servidor**           | Node.js + Express        | Motor del backend                   |
| **Base de datos**      | PostgreSQL               | Almacenamiento de todos los datos   |
| **Autenticación**      | JWT (jsonwebtoken)       | Tokens de sesión seguros            |
| **Contraseñas**        | bcryptjs                 | Encriptación de contraseñas         |
| **Email**              | Resend                   | Envío del código de verificación    |
| **IA**                 | OpenAI gpt-4o-mini       | Generación del Marco Lógico         |
| **Subida de archivos** | Multer                   | Manejo de archivos en el servidor   |
| **Frontend**           | HTML + Bootstrap 5       | Estructura y estilos de las páginas |
| **Interactividad**     | JavaScript ES6 (Módulos) | Lógica del navegador                |
| **Alertas**            | SweetAlert2              | Modales y confirmaciones bonitas    |
| **Gráficas**           | Chart.js                 | Gráfica del dashboard               |
| **PDF**                | jsPDF                    | Descarga de cotizaciones en PDF     |
