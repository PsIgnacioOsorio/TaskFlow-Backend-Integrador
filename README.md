# TaskFlow Backend Integrador

Proyecto correspondiente a la Parte 1 del Módulo 6. Implementa la base del backend de TaskFlow con Node.js, Express, una vista dinámica HBS, archivos estáticos, registro de accesos y manejo básico de errores.

## Tecnologías utilizadas

- Node.js 18 o superior
- Express
- dotenv
- HBS
- nodemon
- Módulo nativo `fs`

## Requisitos

- Node.js 18 o superior
- npm

Para comprobar las versiones instaladas:

```bash
node -v
npm -v
```

## Instalación

Clonar o descargar el proyecto y abrir una terminal dentro de la carpeta `TaskFlow-Backend-Integrador`.

```bash
npm install
```

Crear el archivo `.env` a partir de `.env.example`.

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

Variables de entorno disponibles:

```env
PORT=3000
NODE_ENV=development
LOG_TIME_ZONE=America/Santiago
```

## Ejecución

Modo normal:

```bash
npm start
```

Modo desarrollo con reinicio automático:

```bash
npm run dev
```

Ejecución directa:

```bash
node app.js
```

El servidor queda disponible en:

```text
http://localhost:3000
```

## Rutas

| Método | Ruta | Respuesta | Descripción |
|---|---|---|---|
| GET | `/` | HTML | Renderiza la vista dinámica HBS |
| GET | `/status` | JSON | Informa el estado del servidor |
| GET | `/css/styles.css` | CSS | Sirve un archivo estático desde `public` |

Las rutas inexistentes devuelven una respuesta JSON con código HTTP 404.

## Estructura del proyecto

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
│   └── css/
│       └── styles.css
├── routes/
│   └── web.routes.js
└── views/
    └── home.hbs
```

## Registro de accesos

El middleware `requestLogger.middleware.js` registra cada solicitud en `logs/log.txt` mediante `fs.appendFile()`.

Cada registro incluye:

- Fecha
- Hora
- Zona horaria
- Método HTTP
- Ruta solicitada

Formato:

```text
fecha=AAAA-MM-DD hora=HH:MM:SS zona=America/Santiago metodo=GET ruta=/status
```

## Decisiones técnicas

- `app.js` es el archivo principal y configura Express, HBS, archivos estáticos, rutas y middlewares.
- El proyecto utiliza CommonJS mediante `require` y `module.exports`.
- Las rutas, los controladores y los middlewares están separados por responsabilidad.
- HBS genera el contenido dinámico y `express.static()` publica los recursos de la carpeta `public`.
- El registro de accesos usa `fs.appendFile()` para agregar información sin eliminar los registros anteriores.
- Los middlewares de ruta inexistente y manejo de errores entregan respuestas JSON controladas.
- `.env` y `node_modules` están excluidos del repositorio mediante `.gitignore`.

## Alcance

Esta entrega corresponde exclusivamente al Módulo 6. No incorpora PostgreSQL, Sequelize, JWT ni Multer.

## Autor

Ignacio Osorio Opazo
