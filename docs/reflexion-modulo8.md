# Reflexión del Módulo 8

El Módulo 6 convirtió una idea en un servidor Express visible: permitió organizar rutas, renderizar vistas HBS, servir Bootstrap y archivos estáticos, registrar accesos en un archivo plano y responder con una página 404. El Módulo 7 reemplazó el almacenamiento temporal por PostgreSQL y Sequelize, incorporó modelos relacionados, CRUD, filtros, consultas ORM y SQL directo, además de transacciones con confirmación y rollback.

El Módulo 8 cierra ese recorrido exponiendo la misma lógica mediante una API REST versionada. Registro y login ya no son solo formularios: las contraseñas se transforman en hashes con bcrypt y cada sesión obtiene un JWT de duración limitada. El middleware de autenticación valida firma, emisor, audiencia y expiración; luego la autorización limita usuarios, tareas y proyectos según identidad o rol.

La iteración también amplió el modelo de datos sin romper lo anterior. `User–Profile` y `User–Credential` muestran relaciones 1:1, `User–Task` conserva la relación 1:N y `User–Project` agrega una relación N:M mediante `ProjectMember`. Multer recibe el avatar, pero el servicio comprueba además la firma binaria del archivo, guarda un nombre aleatorio y asocia su URL al perfil del usuario.

La separación entre rutas, controladores, middlewares y servicios evitó mezclar transporte HTTP, seguridad y persistencia. Las rutas describen el contrato, los controladores coordinan la respuesta, los middlewares validan y autorizan, y los servicios resuelven la lógica y las transacciones. Esto hace que las pruebas puedan verificar cada responsabilidad con menor acoplamiento.

El resultado integra los tres módulos en un único historial: contenido web y archivos planos, base de datos y ORM, y finalmente una API segura consumible desde Postman u otro cliente. La mejora más importante no fue agregar más endpoints, sino establecer un contrato consistente y evidencias reproducibles para comprobar que los datos, permisos y errores funcionan como se diseñaron.
