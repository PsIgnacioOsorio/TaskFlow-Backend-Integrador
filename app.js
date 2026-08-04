// Carga las variables definidas en .env sin imprimir mensajes adicionales.
require("dotenv").config({ quiet: true });

const path = require("path");
const express = require("express");

const webRoutes = require("./routes/web.routes");
const requestLogger = require("./middlewares/requestLogger.middleware");
const notFound = require("./middlewares/notFound.middleware");
const errorHandler = require("./middlewares/errorHandler.middleware");

// Crea la aplicación Express y define el puerto con un valor alternativo seguro.
const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Configura Handlebars (HBS) y la carpeta que contiene las vistas dinámicas.
app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "views"));

// Registra cada solicitud antes de que llegue a los archivos estáticos o las rutas.
app.use(requestLogger);

// Publica CSS, imágenes u otros recursos guardados dentro de /public.
app.use(express.static(path.join(__dirname, "public")));

// Conecta el router público externo con la aplicación principal.
app.use("/", webRoutes);

// Estos middlewares deben ir al final: primero detectan un 404 y luego responden el error.
app.use(notFound);
app.use(errorHandler);

// Encapsula el inicio para poder reutilizar la app sin abrir otro puerto al importarla.
const startServer = () => {
  return app.listen(PORT, () => {
    console.log(`Servidor iniciado en http://localhost:${PORT}`);
  });
};

// Inicia el servidor únicamente cuando se ejecuta "node app.js" o un script de npm.
if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
