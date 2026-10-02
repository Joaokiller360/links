# Mis links

Página personal de links (estilo link-in-bio) con panel de administración. Dos proyectos:

```
links/
├── backend/   API Express: contenido, contactos y panel admin
└── frontend/  React + Vite: la página pública y el panel (/admin)
```

## Requisitos

Node.js 22.9 o superior.

## Primer arranque

```bash
# 1) API en http://127.0.0.1:4010
cd backend
npm ci
cp .env.example .env      # pon tu ADMIN_EMAIL y ADMIN_PASSWORD (mínimo 12 caracteres)
npm run dev

# 2) Web en http://localhost:5173 (proxy /api → 127.0.0.1:4010)
cd frontend
npm ci
npm run dev
```

## Editar tu página

Abre `http://localhost:5173/admin` y entra con tu `ADMIN_EMAIL` y `ADMIN_PASSWORD`. Desde ahí puedes:

- **Contenido:** editar nombre, iniciales y frase, y crear, editar, reordenar o borrar links y redes. Solo se aceptan URLs `https://`.
- **Contactos:** ver y borrar los correos que te dejaron en el formulario.

Los datos se guardan en `backend/data/` (`content.json` y `leads.json`). Esa carpeta no va a git: haz copia de seguridad tú.

## API

| Método | Ruta                       | Acceso | Descripción                          |
| ------ | -------------------------- | ------ | ------------------------------------ |
| GET    | `/api/health`              | público | Healthcheck                         |
| GET    | `/api/links`               | público | Perfil, links y redes               |
| POST   | `/api/leads`               | público | `{ name, email }`                   |
| POST   | `/api/admin/login`         | —      | `{ email, password }` → token (8 h) |
| POST   | `/api/admin/logout`        | admin  | Cierra la sesión                     |
| GET/PUT| `/api/admin/content`       | admin  | Leer / guardar todo el contenido     |
| GET    | `/api/admin/leads`         | admin  | Lista de contactos                   |
| DELETE | `/api/admin/leads/:email`  | admin  | Borra un contacto                    |

Las rutas admin usan `Authorization: Bearer <token>`. El login se bloquea 15 min tras 5 intentos fallidos por IP.

## Producción

- **Backend:** `npm start`. Variables en `backend/.env.example`:
  - `HOST`: pon `0.0.0.0` si tu hosting lo exige.
  - `CORS_ORIGIN`: el dominio de tu web.
  - `TRUST_PROXY=1` si va detrás de un proxy.
  - `ADMIN_EMAIL` y `ADMIN_PASSWORD`: tu acceso al panel.
  - `MAX_LEADS`: máximo de contactos guardados.
- **Frontend:** `npm run build` → `frontend/dist` (incluye `dist/admin/index.html`, así `/admin` funciona sin configurar el hosting). Si la API está en otro dominio, define `VITE_API_URL` antes del build.
- Sirve todo por HTTPS y añade en tu hosting una CSP con `frame-ancestors 'none'`.
