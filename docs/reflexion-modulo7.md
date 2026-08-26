# Reflexión técnica - Módulo 7

## Elección de base de datos

Elegí PostgreSQL porque TaskFlow necesita relacionar usuarios y tareas y mantener consistencia cuando varias operaciones deben completarse juntas. Una base relacional permite expresar la propiedad de cada tarea mediante una clave foránea.

## Protección de datos sensibles

El host, puerto, nombre de base, usuario y contraseña se leen desde variables de entorno. El archivo `.env` está excluido por `.gitignore`; solamente se publica `.env.example` con valores de referencia. En esta etapa los usuarios no tienen contraseñas, porque el registro, login y JWT se implementarán en el Módulo 8.

## Campos actualizables y validaciones

Los servicios construyen un objeto nuevo únicamente con los campos permitidos. Se validan IDs positivos, nombre, correo, título, descripción, estado, prioridad, fecha y usuario responsable. Esto evita modificar claves primarias u otros valores internos mediante un cuerpo JSON arbitrario.

## ORM frente a SQL directo

Sequelize permite definir modelos, reglas y relaciones una sola vez. Sus métodos simplifican el CRUD y `include` permite consultar el usuario con sus tareas. La consulta directa con `pg` es útil para comprender el SQL, controlar cada columna y comparar el resultado. TaskFlow utiliza Sequelize como acceso principal y mantiene una ruta SQL únicamente para demostrar ambas estrategias.

## Transacciones

Crear un usuario y su tarea inicial son dos acciones dependientes. Si el proceso falla antes del commit, no tiene sentido conservar datos incompletos. Por eso ambas escrituras se ejecutan dentro de una transacción y se revierten juntas mediante rollback. La prueba controlada fuerza el error después de crear los dos registros y confirma que ninguno persiste.
