require("dotenv").config({ quiet: true });

const path = require("path");
const express = require("express");

const { closeDatabase, connectDatabase } = require("./config/database");
const dataRoutes = require("./routes/data.routes");
const webRoutes = require("./routes/web.routes");
const requestLogger = require("./middlewares/requestLogger.middleware");
const notFound = require("./middlewares/notFound.middleware");
const errorHandler = require("./middlewares/errorHandler.middleware");

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.disable("x-powered-by");
app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "views"));

app.use(requestLogger);
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(
  "/vendor/bootstrap",
  express.static(path.join(__dirname, "node_modules", "bootstrap", "dist"))
);

app.use("/", webRoutes);
app.use("/", dataRoutes);
app.use(notFound);
app.use(errorHandler);

const startServer = async () => {
  await connectDatabase();
  return app.listen(PORT, () => {
    console.log(`Servidor iniciado en http://localhost:${PORT}`);
  });
};

if (require.main === module) {
  startServer()
    .then((server) => {
      const shutdown = async () => {
        server.close(async () => {
          await closeDatabase();
          process.exit(0);
        });
      };
      process.once("SIGINT", shutdown);
      process.once("SIGTERM", shutdown);
    })
    .catch((error) => {
      console.error(`No fue posible iniciar TaskFlow: ${error.message}`);
      process.exitCode = 1;
    });
}

module.exports = { app, startServer };
