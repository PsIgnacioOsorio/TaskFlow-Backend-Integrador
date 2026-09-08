# TaskFlow Backend Integrador

Entrega final de los módulos 6, 7 y 8. TaskFlow integra una aplicación web Express con HBS, PostgreSQL y Sequelize, y expone su lógica mediante una API REST versionada, autenticada con JWT y preparada para recibir avatares con Multer.

## Funciones principales

- API bajo `/api/v1` con respuestas `{ status, message, data }`.
- Registro transaccional y login con contraseña cifrada mediante bcrypt.
- JWT firmado, con emisor, audiencia y expiración verificables.
- Autorización por identidad, propiedad del recurso y rol `admin`.
- CRUD REST de usuarios, tareas y proyectos.
- Búsquedas y filtros dinámicos.
- Carga de JPEG, PNG o WEBP de hasta 2 MiB.
- Avatar asociado en PostgreSQL al perfil autenticado.
- Relaciones Sequelize 1:1, 1:N y N:M.
- Contrato OpenAPI y colección Postman con pruebas automáticas.
- Se mantienen el tablero HBS, Bootstrap, logs, SQL directo y transacciones de los módulos anteriores.

## Tecnologías

- Node.js 18 o superior y Express 5
- PostgreSQL, Sequelize, `pg` y `pg-hstore`
- bcryptjs y jsonwebtoken
- Multer y express-validator
- HBS y Bootstrap 5
- dotenv, nodemon y `node:test`

## Modelo de datos

| Relación | Tipo | Uso |
|---|---|---|
| `User` — `Credential` | 1:1 | Hash de contraseña y rol separados de los datos públicos |
| `User` — `Profile` | 1:1 | Biografía y URL del avatar |
| `User` — `Task` | 1:N | Un usuario posee varias tareas |
| `User` — `Project` | N:M | Integrantes asociados mediante `ProjectMember` |
| `User` — `Project` como propietario | 1:N | Control de autorización del proyecto |

El esquema de referencia está en [`database/schema.sql`](database/schema.sql).

## Instalación

Instala las dependencias:

```bash
npm install
```

Crea `.env` desde el ejemplo. En PowerShell:

```powershell
Copy-Item .env.example .env
```

En Bash:

```bash
cp .env.example .env
```

Completa tu contraseña PostgreSQL y reemplaza el secreto JWT dentro de `.env`:

```env
PORT=3000
NODE_ENV=development
APP_NAME=TaskFlow
APP_STAGE="Parte 3 - Módulo 8"
LOG_TIME_ZONE=America/Santiago

DB_HOST=localhost
DB_PORT=5432
DB_NAME=taskflow_db
DB_USER=taskflow_user
DB_PASSWORD=TU_CONTRASENA_LOCAL
DB_SSL=false
DB_LOGGING=false

JWT_SECRET=UNA_FRASE_PRIVADA_ALEATORIA_DE_32_CARACTERES_O_MAS
JWT_EXPIRES_IN=1h
BCRYPT_ROUNDS=10
SEED_USER_PASSWORD=TaskFlow2026!
UPLOAD_MAX_BYTES=2097152
```

`.env` no se versiona. Tampoco deben publicarse tokens, contraseñas reales ni avatares cargados durante las pruebas.

## Preparar PostgreSQL

Si la base del Módulo 7 ya existe, no es necesario eliminarla. El siguiente comando conserva `users` y `tasks`, crea las tablas nuevas y agrega datos iniciales sin duplicarlos:

```bash
npm run db:setup
```

Se crean o verifican `users`, `credentials`, `profiles`, `tasks`, `projects` y `project_members`. También queda disponible una cuenta administradora de demostración:

```text
Correo: ignacio@taskflow.local
Contraseña: valor de SEED_USER_PASSWORD
```

El valor predeterminado del ejemplo es solo para desarrollo local y debe cambiarse fuera de esta demostración.

Comprueba la conexión:

```bash
npm run db:check
```

## Ejecutar

```bash
npm start
```

Durante el desarrollo:

```bash
npm run dev
```

Direcciones principales:

- `http://localhost:3000/`: tablero web heredado.
- `http://localhost:3000/users`: administración web heredada.
- `http://localhost:3000/status`: estado general.
- `http://localhost:3000/api/v1/status`: estado público de la API.

## Autenticación paso a paso

### 1. Registrar una cuenta

```http
POST /api/v1/auth/register
Content-Type: application/json
```

```json
{
  "name": "Ana Pérez",
  "email": "ana@example.com",
  "password": "Modulo82026!",
  "bio": "Usuario de TaskFlow"
}
```

La contraseña debe tener entre 8 y 72 caracteres e incluir mayúscula, minúscula y número. Solo se almacena su hash.

### 2. Iniciar sesión

```http
POST /api/v1/auth/login
Content-Type: application/json
```

```json
{
  "email": "ana@example.com",
  "password": "Modulo82026!"
}
```

La respuesta incluye `token`, `tokenType` y `expiresIn`.

### 3. Consumir una ruta privada

```http
GET /api/v1/tasks
Authorization: Bearer TU_TOKEN
```

En Postman el token se guarda temporalmente en la variable de colección `token`. En un cliente web conviene conservarlo en memoria y, para una solución productiva con renovación de sesión, usar una cookie `HttpOnly`, `Secure` y `SameSite` gestionada por el servidor. TaskFlow no guarda el JWT en PostgreSQL ni en el repositorio. Se evita recomendar `localStorage` porque un script inyectado podría leerlo.

Las rutas de tareas y proyectos se protegen porque modifican información vinculada a una identidad. Los usuarios normales acceden solo a tareas propias y proyectos donde participan; el propietario administra su proyecto y el rol `admin` puede eliminar cuentas.

## Endpoints REST

Todas las rutas privadas requieren `Authorization: Bearer <token>`.

| Método | Ruta | Acceso | Uso |
|---|---|---|---|
| GET | `/api/v1/status` | Público | Estado y versión de API |
| POST | `/api/v1/auth/register` | Público | Crear usuario, credencial y perfil |
| POST | `/api/v1/auth/login` | Público | Generar JWT |
| GET | `/api/v1/users?search=&active=` | Privado | Listar y filtrar usuarios |
| GET | `/api/v1/users/:id` | Propio/admin | Obtener perfil, tareas y proyectos |
| PUT | `/api/v1/users/:id` | Propio/admin | Actualizar usuario y perfil |
| DELETE | `/api/v1/users/:id` | Admin | Eliminar cuenta |
| GET | `/api/v1/tasks?status=&search=&limit=` | Privado | Listar tareas permitidas |
| GET | `/api/v1/tasks/:id` | Propietario/admin | Obtener tarea |
| POST | `/api/v1/tasks` | Privado | Crear tarea propia |
| PUT | `/api/v1/tasks/:id` | Propietario/admin | Actualizar tarea |
| DELETE | `/api/v1/tasks/:id` | Propietario/admin | Eliminar tarea |
| GET | `/api/v1/projects` | Privado | Listar proyectos permitidos |
| GET | `/api/v1/projects/:id` | Integrante/admin | Consultar integrantes |
| POST | `/api/v1/projects` | Privado | Crear proyecto |
| PUT | `/api/v1/projects/:id` | Propietario/admin | Actualizar proyecto |
| POST | `/api/v1/projects/:id/members` | Propietario/admin | Asociar integrante N:M |
| DELETE | `/api/v1/projects/:id` | Propietario/admin | Eliminar proyecto |
| POST | `/api/v1/upload` | Privado | Subir y asociar avatar |

El contrato completo está en [`docs/openapi.yaml`](docs/openapi.yaml).

## Subir un avatar

Envía `multipart/form-data` con un campo de tipo archivo llamado `file`:

```bash
curl -X POST http://localhost:3000/api/v1/upload \
  -H "Authorization: Bearer TU_TOKEN" \
  -F "file=@avatar.png"
```

Reglas aplicadas:

- MIME permitido: `image/jpeg`, `image/png` o `image/webp`.
- Tamaño predeterminado: máximo 2 MiB.
- Se verifica la firma binaria, no solo el nombre o MIME declarado.
- El servidor genera un nombre aleatorio.
- La ruta pública queda bajo `/uploads/avatars/`.
- `profiles.avatar_url` se actualiza y el avatar anterior se elimina.

Los archivos reales de `uploads/avatars` están ignorados por Git para evitar publicar datos personales.

## Respuestas y errores

Éxito:

```json
{
  "status": "ok",
  "message": "Tarea creada",
  "data": { "task": {} }
}
```

Error:

```json
{
  "status": "error",
  "message": "Token Bearer requerido",
  "data": null
}
```

La API usa, según corresponda, `400`, `401`, `403`, `404`, `409`, `413`, `415`, `500` y `503`.

## Pruebas

Validación rápida sin requerir PostgreSQL:

```bash
npm run check
```

Pruebas reales de PostgreSQL y de la API:

```bash
npm run test:db
```

Aceptación completa:

```bash
npm run check:all
```

La comprobación incluye rutas públicas y privadas, token alterado y expirado, validaciones, CRUD, filtros, relaciones, upload permitido/rechazado, SQL directo, transacción confirmada y rollback.

## Postman

Importa:

```text
postman/TaskFlow-Modulo8.postman_collection.json
```

1. Ejecuta `npm run db:setup` y `npm start`.
2. Abre la colección y usa **Run collection** en el orden incluido.
3. El flujo crea una cuenta, obtiene JWT, comprueba dos 401, ejecuta CRUD y relaciones, y limpia los registros.
4. La solicitud 18 demuestra el error controlado cuando falta el archivo.
5. Para la evidencia de carga exitosa, vuelve a ejecutar 02 y 05 después del Runner, abre 18, habilita `file`, selecciona una imagen permitida menor a 2 MiB y envíala. Debe responder `201` con `avatarUrl`. Después ejecuta 21 y 22 para eliminar la cuenta temporal y su avatar.

Los scripts guardan IDs y tokens en variables de colección, no en el JSON versionado.

## Decisiones técnicas e iteración

- `/api/v1` separa el contrato nuevo de las rutas web y de datos heredadas; permite evolucionar la API sin romper clientes anteriores.
- Las rutas declaran método, validación y autenticación; los controladores traducen HTTP; los servicios contienen negocio y persistencia; los middlewares concentran seguridad y errores.
- Credenciales y perfiles se separaron de `users` mediante 1:1 para no exponer hashes ni mezclar autenticación con datos públicos.
- Las tareas se limitan por propietario y los proyectos por membresía. Así un JWT válido no concede acceso automático a todos los registros.
- La validación se ejecuta en la frontera HTTP y se repite en servicios para proteger también llamadas internas.
- Multer usa memoria para validar la firma antes de escribir, reduciendo el riesgo de dejar archivos no permitidos en disco.
- La entrega amplía el mismo repositorio y preserva el historial de los módulos 6 y 7.

La reflexión integradora está en [`docs/reflexion-modulo8.md`](docs/reflexion-modulo8.md), la correspondencia completa con la pauta en [`docs/verificacion-pauta-modulo8.md`](docs/verificacion-pauta-modulo8.md) y el paso a paso de capturas en [`docs/guia-evidencias-modulo8.md`](docs/guia-evidencias-modulo8.md).

## Estructura principal

```text
TaskFlow-Backend-Integrador/
├── app.js
├── config/
├── controllers/
├── database/
├── docs/
│   ├── openapi.yaml
│   ├── guia-evidencias-modulo8.md
│   ├── reflexion-modulo8.md
│   └── verificacion-pauta-modulo8.md
├── middlewares/
├── models/
├── postman/
│   └── TaskFlow-Modulo8.postman_collection.json
├── public/
├── routes/
├── scripts/
├── services/
├── tests/
├── uploads/
│   └── avatars/
├── utils/
└── views/
```

## Scripts

| Comando | Propósito |
|---|---|
| `npm start` | Iniciar servidor |
| `npm run dev` | Iniciar con nodemon |
| `npm run db:setup` | Crear tablas y datos iniciales |
| `npm run db:check` | Verificar conexión y registros |
| `npm test` | Pruebas rápidas HTTP |
| `npm run test:db` | Integración PostgreSQL y API |
| `npm run check:postman` | Validar colección Módulo 8 |
| `npm run check:openapi` | Validar sintaxis y cobertura OpenAPI |
| `npm run check:all` | Ejecutar aceptación completa |
