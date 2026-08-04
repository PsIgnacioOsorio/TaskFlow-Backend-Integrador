const fs = require("fs");
const path = require("path");

const logsDirectory = path.join(__dirname, "..", "logs");
const logFilePath = path.join(logsDirectory, "log.txt");

const requestLogger = (req, res, next) => {
  const now = new Date();
  const timeZone = process.env.LOG_TIME_ZONE || "America/Santiago";
  const dateTimeParts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23"
  })
    .formatToParts(now)
    .reduce((parts, part) => ({ ...parts, [part.type]: part.value }), {});
  const date = `${dateTimeParts.year}-${dateTimeParts.month}-${dateTimeParts.day}`;
  const time = `${dateTimeParts.hour}:${dateTimeParts.minute}:${dateTimeParts.second}`;

  // La estructura conserva fecha, hora, método y ruta en una línea por solicitud.
  const logLine = `fecha=${date} hora=${time} zona=${timeZone} metodo=${req.method} ruta=${req.originalUrl}\n`;

  // Asegura que /logs exista incluso si el proyecto se copia sin carpetas vacías.
  fs.mkdir(logsDirectory, { recursive: true }, (directoryError) => {
    if (directoryError) {
      console.error("No fue posible crear la carpeta de logs:", directoryError.message);
      return;
    }

    // appendFile agrega el evento sin eliminar accesos registrados anteriormente.
    fs.appendFile(logFilePath, logLine, "utf8", (writeError) => {
      if (writeError) {
        console.error("No fue posible escribir el log:", writeError.message);
      }
    });
  });

  // El registro es asíncrono y no bloquea la respuesta al cliente.
  next();
};

module.exports = requestLogger;
