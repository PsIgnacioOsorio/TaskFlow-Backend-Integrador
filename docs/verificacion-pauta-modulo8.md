# Verificación de la pauta — Módulo 8

Esta matriz conecta cada requisito de la Parte 3 con una implementación y una evidencia reproducible.

| Criterio de la pauta | Implementación | Evidencia |
|---|---|---|
| Node 18+ y Express | `engines.node`, Express 5 y scripts npm | `package.json`, `npm run check:all` |
| Arquitectura modular | Rutas, controladores, middlewares, servicios y modelos separados | Carpetas homónimas y `app.js` |
| API REST con GET, POST, PUT y DELETE | Recursos `users`, `tasks` y `projects` bajo `/api/v1` | `docs/openapi.yaml`, colección Postman |
| Endpoints conectados a DB | Controladores delegan en servicios Sequelize | `tests/api.integration.js` |
| Registro y login | Cuenta transaccional, bcrypt y emisión de JWT | Solicitudes Postman 02–05 |
| JWT válido y con expiración | HS256, secreto de 32+ caracteres, `issuer`, `audience`, `expiresIn` | Prueba `JWT protege recursos y detecta expiración` |
| Dos rutas privadas | `/api/v1/tasks` y `/api/v1/projects` usan `authenticateToken` | Postman 06 y 07 devuelven 401 |
| Autorización | Propietario/administrador en usuarios, tareas y proyectos | `auth.middleware.js` y pruebas de integración |
| Carga de archivos | `POST /api/v1/upload` con Multer y carpeta pública `uploads/avatars` | Prueba de upload y Postman 18 |
| Validar tipo y tamaño | MIME JPEG/PNG/WEBP, máximo 2 MiB y firma binaria | `upload.middleware.js`, `upload.service.js` |
| Asociar archivo a DB (PLUS) | `profiles.avatar_url` se actualiza con la URL pública | Prueba `Multer valida contenido...` |
| Relaciones 1:1 | Usuario–credencial y usuario–perfil | `models/index.js`, `profiles.user_id UNIQUE` |
| Relación 1:N | Usuario–tareas | `models/index.js`, consulta de usuario |
| Relación N:M | Usuarios–proyectos mediante `project_members` | Postman 14–17, prueba de integración |
| CRUD de dos entidades | CRUD protegido de tareas y proyectos; usuarios con admin para DELETE | Postman 08–22 |
| Filtros y búsqueda | `status`, `search`, `active` y `limit` validados | Postman 11 |
| Respuesta consistente | `{ status, message, data }` en éxito y error | `apiResponse.util.js`, middleware de errores |
| Validaciones y errores | `express-validator`, validación de dominio y errores HTTP | Pruebas rápidas y respuestas 400/401/403/409/413/415 |
| Documentación de API (PLUS) | Contrato OpenAPI 3.0 | `docs/openapi.yaml` |
| Persistencia en archivo plano | Registro de accesos heredado y conservado | `logs/log.txt`, prueba de middleware |
| Iteración sobre entregas anteriores | API segura añadida sin eliminar web, SQL, transacciones ni etiquetas previas | Historial Git y esta nota |

## Comandos de aceptación

```bash
npm install
npm run db:setup
npm run check:all
npm start
```

Luego se ejecuta la colección `postman/TaskFlow-Modulo8.postman_collection.json`. El Runner debe terminar sin pruebas fallidas. La carga exitosa de avatar se demuestra ejecutando individualmente `POST /api/v1/upload`, habilitando el campo `file` y seleccionando una imagen permitida menor a 2 MiB.

## Evidencias sugeridas para Drive

1. Runner de Postman con las solicitudes aprobadas.
2. Respuestas 401 de tareas y proyectos sin JWT.
3. Login 200 mostrando `tokenType: Bearer` (ocultar parte central del token en capturas públicas).
4. Upload 201 y consulta de `profiles.avatar_url` en PostgreSQL.
5. Tablas y llaves de `credentials`, `profiles`, `tasks`, `projects` y `project_members`.
6. Salida completa de `npm run check:all` con cero fallos.
7. Pull Request fusionado y etiqueta `modulo-8-final`.
