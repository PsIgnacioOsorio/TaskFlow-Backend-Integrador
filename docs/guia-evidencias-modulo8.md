# Guía de evidencias — Módulo 8

Realiza estos pasos desde PowerShell en la raíz del proyecto.

## 1. Preparar y verificar

```powershell
npm install
npm run db:setup
npm run check:all
```

Captura el final de `check:all`, donde deben aparecer cero fallos en pruebas rápidas, PostgreSQL, API, vistas, Postman y OpenAPI.

## 2. Mostrar tablas y relaciones

```powershell
psql -U taskflow_user -d taskflow_db -h localhost -p 5432
```

Dentro de `psql`:

```sql
\pset pager off
\dt
\d users
\d credentials
\d profiles
\d tasks
\d projects
\d project_members
```

Para reunir todas las llaves en una sola evidencia:

```sql
SELECT
  conrelid::regclass AS tabla,
  conname AS restriccion,
  pg_get_constraintdef(oid) AS definicion
FROM pg_constraint
WHERE conrelid IN (
  'users'::regclass,
  'credentials'::regclass,
  'profiles'::regclass,
  'tasks'::regclass,
  'projects'::regclass,
  'project_members'::regclass
)
ORDER BY tabla, restriccion;
```

Debe observarse `UNIQUE (user_id)` en credenciales y perfiles, `tasks.user_id`, `projects.owner_id` y la clave compuesta `(user_id, project_id)`.

## 3. Ejecutar la API y Postman

Inicia el servidor y déjalo abierto:

```powershell
npm start
```

Importa `postman/TaskFlow-Modulo8.postman_collection.json`. Ejecuta la colección completa una vez y captura el Runner: las 22 solicitudes deben aprobar sus tests. Las solicitudes 06 y 07 tienen respuesta HTTP 401 intencional y prueba verde.

Capturas mínimas:

1. Solicitud 05: login 200 y `tokenType: Bearer`; oculta parte del JWT si la imagen será pública.
2. Solicitudes 06 y 07: rutas privadas con 401 sin token.
3. Solicitudes 10–13: CRUD y filtros de tareas.
4. Solicitudes 14–17: CRUD de proyectos y relación N:M.
5. Runner completo sin tests fallidos.

## 4. Evidenciar upload exitoso

Como el Runner elimina sus datos al final, ejecuta de nuevo las solicitudes 02 y 05 para crear la cuenta y obtener un token. Luego abre la solicitud 18:

1. En **Body > form-data**, habilita la fila `file`.
2. Conserva el tipo **File**.
3. Selecciona un PNG, JPEG o WEBP menor a 2 MiB.
4. Envíala y confirma que el test adaptable también queda verde con estado `201`.
5. Captura `avatarUrl` en la respuesta.

Comprueba la asociación en `psql`:

```sql
SELECT u.id, u.name, u.email, p.bio, p.avatar_url
FROM users u
JOIN profiles p ON p.user_id = u.id
WHERE u.email LIKE 'postman-m8-%@taskflow.local'
ORDER BY u.id DESC
LIMIT 1;
```

Abre `http://localhost:3000` seguido del valor de `avatar_url` y captura la imagen servida. Finalmente ejecuta las solicitudes 21 y 22 para eliminar la cuenta temporal; el servicio también elimina su avatar. No ejecutes 19 y 20 en esta segunda vuelta porque no se crearon tareas ni proyectos nuevos.

## 5. Cerrar sin archivos locales

Detén el servidor con `Ctrl + C` y ejecuta:

```powershell
git restore logs/log.txt
git status --short
```

Los avatares están ignorados por Git. Antes de comprimir, confirma que no se versionaron `.env`, tokens, contraseñas reales ni archivos de usuario.

## 6. Orden sugerido en Drive

```text
Parte 3 - Módulo 8/
├── 01_check_all.png
├── 02_tablas_postgresql.png
├── 03_relaciones_y_llaves.png
├── 04_login_jwt.png
├── 05_rutas_sin_token_401.png
├── 06_crud_y_filtros.png
├── 07_relacion_nm.png
├── 08_upload_201.png
├── 09_avatar_asociado_db.png
├── 10_postman_runner.png
└── 11_pull_request_modulo8.png
```
