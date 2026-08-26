# Verificación de la pauta - Módulo 7

Esta matriz relaciona cada requisito de la Parte 2 con una evidencia concreta del proyecto. La verificación técnica automática se ejecuta con `npm run check:all`; las capturas indicadas al final deben guardarse en Google Drive como evidencia visual de la entrega.

| Criterio de la pauta | Estado | Evidencia en el proyecto |
|---|---|---|
| Conexión real y segura con PostgreSQL | Cumple | `config/database.js`, `.env.example` y `connectDatabase()` |
| Credenciales fuera del código | Cumple | `.env` está excluido en `.gitignore`; solo se versiona `.env.example` |
| Log de conexión exitosa | Cumple | `connectDatabase()` informa base, host y puerto sin mostrar la contraseña |
| Tabla principal y datos simulados | Cumple | Modelos `User` y `Task`; `databaseSetup.service.js` crea 3 usuarios y 3 tareas |
| `GET /usuarios` con JSON claro | Cumple | `data.routes.js`, `data.controller.js` y `user.service.js` |
| Datos públicos sin información sensible | Cumple | `USER_ATTRIBUTES` limita las columnas devueltas; el modelo aún no maneja contraseñas |
| Búsqueda o filtrado | Cumple (PLUS) | Usuarios: `search` y `active`; tareas: `search`, `status` y `userId` |
| `PUT /usuarios/:id` | Cumple | Actualización parcial de `name`, `email` y `active`, con confirmación JSON |
| `DELETE /usuarios/:id` | Cumple | Valida ID y existencia; elimina el usuario y aplica cascada a sus tareas |
| CRUD de dos entidades | Cumple | GET, POST, PUT y DELETE para `users` y `tasks` |
| Validaciones y errores útiles | Cumple | Servicios de usuario/tarea, `httpError.util.js` y middleware central de errores |
| Transacción de dos acciones | Cumple | Crea usuario y tarea en `sequelize.transaction()` |
| Rollback demostrable | Cumple | La falla se fuerza después de ambas escrituras; los tests confirman que no persiste ninguna |
| ORM inicializado y modelos definidos | Cumple | Sequelize en `config/database.js`; modelos en `models/` |
| Comparación SQL directo versus ORM | Cumple | `/usuarios/sql` y `/usuarios/comparacion` |
| SQL directo seguro | Cumple | `sqlUser.service.js` usa parámetros `$1`, `$2`, etc. |
| Dos modelos relacionados | Cumple | Asociación `User.hasMany(Task)` y `Task.belongsTo(User)` |
| Relación mediante `include` | Cumple | `/usuarios/:id/tareas` obtiene usuario y tareas mediante un único SELECT con JOIN |
| Datos anidados en HTML o JSON | Cumple (PLUS) | Respuesta JSON de usuario con arreglo `tasks`; vistas HBS muestran responsables |
| Arquitectura modular | Cumple | Separación en rutas, controladores, middlewares, servicios y modelos |
| README de instalación y uso | Cumple | `README.md` documenta PostgreSQL, scripts, rutas, decisiones y estructura |
| Colección Postman | Cumple | 15 solicitudes con pruebas para CRUD, SQL/ORM, relación, transacción y rollback |

## Validación automática

Ejecutar con PostgreSQL preparado:

```bash
npm run db:setup
npm run check:all
```

El proceso comprueba:

- rutas, validaciones, errores y archivos estáticos;
- compilación de las tres vistas HBS;
- estructura y cobertura de la colección Postman;
- CRUD real de usuarios y tareas;
- filtro dinámico y consulta SQL parametrizada;
- relación 1:N resuelta con un solo `SELECT`;
- commit y rollback de ambas entidades.

## Evidencias externas para Google Drive

Crear la carpeta `Parte 2 – Módulo 7` y guardar, como mínimo:

1. `GET /usuarios` con al menos tres registros.
2. `POST /usuarios` o `POST /tareas` con estado `201`.
3. `PUT /usuarios/:id` o `PUT /tareas/:id` con estado `200`.
4. `DELETE /tareas/:id` y `DELETE /usuarios/:id` con tests verdes.
5. `/usuarios/:id/tareas` mostrando la relación anidada.
6. Transacción exitosa con usuario y tarea relacionados.
7. Rollback con respuesta `400` y tests que confirman cero registros persistidos.
8. Consola con `npm run check:all` sin pruebas fallidas.
9. Estructura de `users`, `tasks`, claves primarias y clave foránea en PostgreSQL.

La reflexión técnica ya se encuentra en `docs/reflexion-modulo7.md` y puede incluirse en la misma carpeta.
