# 🌳 GreenNode - Plataforma B2B de Reforestación

## Stack Tecnológico
- **Frontend**: HTML, CSS, Bootstrap Icons, Vanilla JS (ES Modules)
- **Backend**: Node.js + Express (ESM)
- **Base de Datos**: PostgreSQL
- **IA**: Google Gemini 1.5 Flash (generación de Marco Lógico)
- **Auth**: JWT + bcryptjs

---

## Estructura del proyecto

```
/
├── backend/
│   ├── app.js                  # Express app + rutas
│   ├── server.js               # Arranque del servidor
│   ├── .env                    # Variables de entorno
│   └── src/
│       ├── config/             # db.js, env.js
│       ├── controllers/        # auth.controller.js
│       ├── middlewares/        # auth, role, validation
│       ├── models/             # auth.model.js
│       ├── routes/             # auth.routes.js
│       ├── utils/              # hash.js, response.js, ai.js
│       └── modules/            # Módulos por entidad
│           ├── territory/
│           ├── species/
│           ├── quote/
│           ├── project/
│           ├── evidence/
│           ├── file/
│           └── planting-event/
├── frontend/
│   ├── pages/
│   │   ├── auth/               # login.html, register.html
│   │   ├── admin/              # Panel administrador
│   │   └── client/             # Panel cliente/empresa
│   ├── styles/                 # auth.css, dashboard.css
│   └── js/
│       ├── pages/              # Scripts por página
│       ├── utils/              # api.js, ui.js, validators.js
│       └── services/           # authService.js
└── database/
    └── seed.sql                # Datos iniciales
```

---

## Configuración inicial

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar variables de entorno
Editar `backend/.env`:
```env
PORT=3000
DB_HOST=tu_host
DB_PORT=5432
DB_USER=tu_usuario
DB_PASSWORD=tu_password
DB_NAME=db_greennode

JWT_SECRET=greennode_super_secret_2026
JWT_EXPIRES_IN=8h

# Google Gemini API
GEMINI_API_KEY=tu_api_key_aqui
```

### 3. Inicializar base de datos
```bash
# 1. Ejecutar Script.sql (crear tablas y enums)
# 2. Ejecutar database/seed.sql (datos iniciales)
```

### 4. Ejecutar el proyecto
```bash
npm run dev    # Modo desarrollo con nodemon
npm start      # Modo producción
```

El servidor sirve el frontend en `http://localhost:3000`

---

## Roles y acceso

| Rol | Acceso | Página inicial |
|-----|--------|----------------|
| `admin` | Panel completo de gestión | `/pages/admin/dashboard.html` |
| `client` | Vista de proyectos y cotizaciones | `/pages/client/proyectos.html` |

### Crear usuario admin manualmente:
```sql
-- Primero insertar con hash de bcrypt (Admin1234)
INSERT INTO app_user (email, password_hash, role_id, is_admin)
VALUES ('admin@greennode.co', '$2a$10$...hash...', 
        (SELECT id FROM role WHERE name='admin'), true);
```

---

## API Endpoints

### Auth
- `POST /api/auth/register` - Registro empresa
- `POST /api/auth/login` - Login

### Territories
- `GET /api/territories` - Listar territorios con especies

### Species
- `GET /api/species/by-territory/:id` - Especies por territorio

### Quotes
- `POST /api/quotes` - Crear cotización (genera IA)
- `GET /api/quotes/my` - Mis cotizaciones (cliente)
- `GET /api/quotes` - Todas las cotizaciones (admin)
- `PATCH /api/quotes/:id/status` - Actualizar estado

### Projects
- `GET /api/projects` - Todos los proyectos (admin)
- `GET /api/projects/my` - Mis proyectos (cliente)
- `GET /api/projects/:id` - Detalle de proyecto
- `PATCH /api/projects/:id/status` - Cambiar estado

### Evidence
- `GET /api/evidence/:projectId` - Evidencias del proyecto
- `POST /api/evidence` - Añadir evidencia (admin)

### Files
- `GET /api/files/:projectId` - Archivos del proyecto
- `POST /api/files` - Añadir archivo (admin)

---

## Flujo del negocio

```
Cliente solicita cotización
        ↓
IA (Gemini) genera Marco Lógico
        ↓
Admin revisa y valida el borrador
        ↓
Admin envía cotización al cliente
        ↓
Cliente acepta → Se crea el Proyecto
        ↓
Admin registra evidencias y eventos de siembra
        ↓
Cliente monitorea progreso en tiempo real
```

---

## Configurar clave de Gemini API

1. Ir a https://aistudio.google.com/app/apikey
2. Crear una API Key gratuita
3. Reemplazar en `backend/.env`:
   ```
   GEMINI_API_KEY=tu_clave_aqui
   ```

Si no se configura la API key, el sistema usará un Marco Lógico de respaldo generado automáticamente.
