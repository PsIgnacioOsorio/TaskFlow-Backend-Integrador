# TaskFlow Backend Integrador

Parte 1 del proyecto integrador de los módulos 6, 7 y 8. Esta entrega construye una aplicación básica de tareas con Node.js, Express, HBS y Bootstrap.

La pantalla principal permite agregar, buscar, filtrar, avanzar y eliminar tareas. Por ahora los datos se guardan en memoria: permanecen mientras el servidor está encendido y se reinician al detenerlo. En el Módulo 7, el servicio de tareas se conectará a una base de datos.

## Tecnologías

- Node.js 18 o superior
- Express
- HBS
- Bootstrap 5 instalado con npm
- dotenv
- nodemon
- Módulo nativo `fs`
- Módulo nativo `node:test`

## Funciones actuales

- Vista dinámica HBS en `/`.
- Formulario para crear tareas.
- Cambio de estado: pendiente, en curso y completada.
- Eliminación de tareas.
- Búsqueda y filtros en el navegador.
- Listado JSON en `/api/tasks`.
- Estado del servidor en `/status`.
- Registro de accesos en `logs/log.txt`.
- Página 404 para rutas web inexistentes y errores JSON para la API.

## Instalación

Abre una terminal dentro de `TaskFlow-Backend-Integrador` y ejecuta:

```bash
npm install
```

Crea `.env` a partir de `.env.example`.

PowerShell:

```powershell
Copy-Item .env.example .env
```

CMD:

```bat
copy .env.example .env
```

macOS, Linux o Git Bash:

```bash
cp .env.example .env
```

Variables incluidas:

```env
PORT=3000
NODE_ENV=development
APP_NAME=TaskFlow
APP_STAGE="Parte 1 - Módulo 6"
LOG_TIME_ZONE=America/Santiago
```

## Comandos

Iniciar normalmente:

```bash
npm start
```

Iniciar en desarrollo:

```bash
npm run dev
```

Ejecución directa solicitada en la pauta:

```bash
node app.js
```

Ejecutar pruebas:

```bash
npm test
```

Comprobar el proyecto antes de entregar:

```bash
npm run check
```

Luego abre `http://localhost:3000`.

## Rutas

| Método | Ruta | Uso |
|---|---|---|
| GET | `/` | Muestra la aplicación TaskFlow |
| GET | `/status` | Devuelve el estado del servidor en JSON |
| GET | `/api/tasks` | Lista las tareas en JSON |
| GET | `/api/tasks?status=completed` | Filtra por estado |
| GET | `/api/tasks?search=drive` | Busca por título o descripción |
| POST | `/tasks` | Crea una tarea desde el formulario |
| POST | `/tasks/:id/advance` | Avanza el estado de una tarea |
| POST | `/tasks/:id/delete` | Elimina una tarea |
| GET | Cualquier ruta web inexistente | Muestra la página 404 con acceso al tablero |

## Estructura

```text
TaskFlow-Backend-Integrador/
├── app.js
├── package.json
├── package-lock.json
├── .env.example
├── .gitignore
├── README.md
├── controllers/
│   └── web.controller.js
├── docs/
│   └── flujo-cliente-servidor.md
├── logs/
│   └── log.txt
├── middlewares/
│   ├── errorHandler.middleware.js
│   ├── notFound.middleware.js
│   └── requestLogger.middleware.js
├── postman/
│   └── TaskFlow-Modulo6.postman_collection.json
├── public/
│   ├── css/styles.css
│   └── js/dashboard.js
├── routes/
│   └── web.routes.js
├── services/
│   ├── accessLog.service.js
│   └── task.service.js
├── tests/
│   └── app.test.js
├── utils/
│   └── dateTime.util.js
└── views/
    ├── home.hbs
    └── not-found.hbs
```

## Registro de accesos

El middleware de accesos usa `fs.appendFile()` para agregar una línea sin borrar las anteriores.

```text
fecha=AAAA-MM-DD hora=HH:MM:SS zona=America/Santiago metodo=GET ruta=/status
```

## Relación con la pauta del Módulo 6

| Requisito | Implementación |
|---|---|
| Node.js y Express | `app.js` |
| Variables de entorno | `.env.example` y `dotenv` |
| Scripts de ejecución | `npm start` y `npm run dev` |
| Dos rutas públicas | `/` y `/status` |
| Archivos estáticos | `public` y Bootstrap servido localmente |
| Archivo plano | `logs/log.txt` mediante `fs.appendFile()` |
| Estructura modular | Rutas, controladores, middlewares y servicios |
| Vista dinámica | HBS con tareas entregadas por Express |
| Router externo | `routes/web.routes.js` |
| Página no encontrada | `views/not-found.hbs` y middlewares de error |
| Documentación | README, diagrama y colección Postman |

## Continuidad del proyecto

- **Módulo 6:** interfaz básica, servidor, rutas, formularios y log de accesos.
- **Módulo 7:** reemplazar el arreglo en memoria por base de datos, ORM y CRUD persistente.
- **Módulo 8:** agregar autenticación JWT, rutas privadas y carga de archivos.

## Autor

Ignacio Osorio Opazo
