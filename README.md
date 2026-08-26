# TaskFlow Backend Integrador

Parte 2 del proyecto integrador de los módulos 6, 7 y 8. TaskFlow conserva el servidor Express, las vistas HBS, Bootstrap, el registro en archivo y la página 404 del Módulo 6; en esta entrega agrega persistencia real con PostgreSQL y Sequelize.

La aplicación administra usuarios y tareas. Cada tarea pertenece a un usuario mediante una relación 1:N y permanece disponible después de reiniciar el servidor.

## Tecnologías

- Node.js 18 o superior
- Express 5
- PostgreSQL 18
- Sequelize 6
- `pg` y `pg-hstore`
- HBS
- Bootstrap 5 instalado con npm
- dotenv
- nodemon
- `fs` para el registro de accesos
- `node:test` para pruebas automáticas

## Funciones

- Gestión visual básica de usuarios y tareas.
- Persistencia en las tablas `users` y `tasks`.
- CRUD completo de usuarios y tareas mediante JSON.
- Relación `User 1:N Task` consultada mediante `include`.
- Consulta del usuario y sus tareas en un único `SELECT` con `JOIN`.
- Búsqueda por texto y filtros por estado, responsable o actividad.
- Consulta de usuarios con SQL directo usando `pg`.
- Consulta equivalente con Sequelize.
- Comparación de resultados SQL versus ORM.
- Transacción que crea un usuario y su primera tarea.
- Rollback demostrable mediante una falla controlada.
- Validaciones, errores JSON consistentes y códigos HTTP apropiados.
- Registro de accesos en `logs/log.txt`.
- Página web 404 para rutas inexistentes.

## Preparar PostgreSQL

El proyecto utiliza una base local llamada `taskflow_db` y un usuario dedicado llamado `taskflow_user`.

Desde `psql`, como usuario administrador:

```sql
CREATE ROLE taskflow_user WITH LOGIN;
\password taskflow_user
CREATE DATABASE taskflow_db OWNER taskflow_user;
```

La contraseña se define de forma local y no debe guardarse en GitHub.

## Instalación

Instala las dependencias:

```bash
npm install
```

Crea `.env` a partir de `.env.example`:

```bash
cp .env.example .env
```

Configura tu contraseña real únicamente dentro de `.env`:

```env
PORT=3000
NODE_ENV=development
APP_NAME=TaskFlow
APP_STAGE="Parte 2 - Módulo 7"
LOG_TIME_ZONE=America/Santiago
DB_HOST=localhost
DB_PORT=5432
DB_NAME=taskflow_db
DB_USER=taskflow_user
DB_PASSWORD=TU_CONTRASENA_LOCAL
DB_SSL=false
DB_LOGGING=false
```

`.env` está ignorado por Git. `.env.example` solo contiene valores de referencia.

## Crear tablas y datos iniciales

Ejecuta una vez:

```bash
npm run db:setup
```

El comando crea las tablas mediante Sequelize y agrega tres usuarios y tres tareas de ejemplo. Es idempotente: puede repetirse sin duplicar esos datos.

Comprueba la conexión y la cantidad de registros:

```bash
npm run db:check
```

## Ejecutar TaskFlow

Modo normal:

```bash
npm start
```

Modo desarrollo:

```bash
npm run dev
```

Luego abre:

- `http://localhost:3000/` para tareas.
- `http://localhost:3000/users` para usuarios.
- `http://localhost:3000/status` para el estado del servidor.

## Pruebas

Pruebas rápidas de rutas, validaciones, archivos estáticos, errores y logging:

```bash
npm run check
```

Validación independiente de las 15 solicitudes y pruebas de Postman:

```bash
npm run check:postman
```

Pruebas de integración sobre PostgreSQL real:

```bash
npm run test:db
```

Comprobación completa:

```bash
npm run check:all
```

Las pruebas de integración crean registros con correos únicos, verifican CRUD, filtros, un único `SELECT` con `include`, SQL directo, transacción exitosa y rollback de usuario y tarea; después eliminan los datos temporales.

La correspondencia completa entre los criterios de evaluación y sus evidencias está en [`docs/verificacion-pauta-modulo7.md`](docs/verificacion-pauta-modulo7.md).

## Rutas web

| Método | Ruta | Uso |
|---|---|---|
| GET | `/` | Tablero HBS de tareas |
| GET | `/users` | Gestión HBS de usuarios |
| POST | `/users` | Crear usuario desde formulario |
| POST | `/users/:id/delete` | Eliminar usuario desde formulario |
| POST | `/tasks` | Crear tarea desde formulario |
| POST | `/tasks/:id/advance` | Avanzar estado desde el tablero |
| POST | `/tasks/:id/delete` | Eliminar tarea desde el tablero |
| GET | `/status` | Estado del servidor |

## Rutas de datos

| Método | Ruta | Uso |
|---|---|---|
| GET | `/usuarios` | Listar usuarios con Sequelize |
| GET | `/usuarios?search=camila&active=true` | Buscar y filtrar usuarios |
| POST | `/usuarios` | Crear usuario |
| PUT | `/usuarios/:id` | Actualizar campos permitidos |
| DELETE | `/usuarios/:id` | Eliminar usuario y sus tareas |
| GET | `/usuarios/sql` | Listar usuarios con SQL directo y `pg` |
| GET | `/usuarios/comparacion` | Comparar SQL directo y Sequelize |
| GET | `/usuarios/:id/tareas` | Obtener un usuario y sus tareas con `include` |
| GET | `/tareas` | Listar tareas y responsables |
| GET | `/tareas?status=pending&search=informe` | Filtrar y buscar tareas |
| POST | `/tareas` | Crear tarea |
| PUT | `/tareas/:id` | Actualizar tarea |
| DELETE | `/tareas/:id` | Eliminar tarea |
| POST | `/transacciones/usuario-tarea` | Crear usuario y tarea dentro de una transacción |
| GET | `/api/tasks` | Alias conservado desde el Módulo 6 |

## Ejemplo de usuario

```json
{
  "name": "Ana Pérez",
  "email": "ana@example.com",
  "active": true
}
```

## Ejemplo de tarea

```json
{
  "title": "Preparar informe",
  "description": "Revisar resultados del proyecto",
  "status": "pending",
  "priority": "high",
  "dueDate": "2026-09-15",
  "userId": 1
}
```

## Transacción y rollback

La ruta transaccional recibe un usuario y una tarea. Ambas operaciones se confirman juntas. Si cualquiera falla, PostgreSQL revierte todo.

Para forzar la demostración del rollback se envía:

```json
{
  "user": {
    "name": "Prueba Rollback",
    "email": "rollback@example.com",
    "active": true
  },
  "task": {
    "title": "No debe persistir",
    "description": "Prueba controlada",
    "status": "pending",
    "priority": "medium",
    "dueDate": "2026-09-16"
  },
  "forceFailure": true
}
```

La falla controlada ocurre después de intentar ambas escrituras. El servidor muestra `[TRANSACCION ROLLBACK]` y no queda almacenado ni el usuario ni la tarea.

## Decisiones técnicas

- Se eligió PostgreSQL porque el dominio tiene relaciones claras y requiere consistencia transaccional.
- Sequelize reduce SQL repetitivo, centraliza modelos y validaciones, y permite consultar relaciones con `include`.
- `pg` se conserva para demostrar una consulta SQL parametrizada y compararla con el ORM.
- Las credenciales se leen desde `.env`; nunca se escriben en el código ni en el repositorio.
- Las actualizaciones aceptan solamente campos definidos por los servicios. Los IDs y valores enumerados se validan antes de consultar la base.
- Los usuarios todavía no almacenan contraseñas. Registro, login, hash, JWT y rutas privadas corresponden al Módulo 8.

## Estructura principal

```text
TaskFlow-Backend-Integrador/
├── app.js
├── config/
│   └── database.js
├── controllers/
│   ├── data.controller.js
│   └── web.controller.js
├── models/
│   ├── index.js
│   ├── task.model.js
│   └── user.model.js
├── routes/
│   ├── data.routes.js
│   └── web.routes.js
├── scripts/
│   ├── checkDatabase.js
│   ├── checkPostman.js
│   └── setupDatabase.js
├── services/
│   ├── databaseSetup.service.js
│   ├── sqlUser.service.js
│   ├── task.service.js
│   └── user.service.js
├── tests/
│   ├── app.test.js
│   └── database.integration.js
├── views/
│   ├── home.hbs
│   ├── users.hbs
│   └── not-found.hbs
├── public/
├── middlewares/
├── docs/
├── postman/
└── logs/
```

## Continuidad

- **Módulo 6:** Express, HBS, Bootstrap, rutas, archivos estáticos, errores y log plano.
- **Módulo 7:** PostgreSQL, Sequelize, modelos, CRUD, relaciones y transacciones.
- **Módulo 8:** autenticación, JWT, rutas privadas y subida validada de archivos.

## Autor

Ignacio Osorio Opazo
