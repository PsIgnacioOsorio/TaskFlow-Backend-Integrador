const fs = require("fs");
const path = require("path");

const { DEFAULT_TIME_ZONE, formatDateTime } = require("../utils/dateTime.util");

const defaultLogFilePath = path.join(__dirname, "..", "logs", "log.txt");

const getLogFilePath = () => {
  // La variable se usa en pruebas para no modificar el log real del proyecto.
  return process.env.LOG_FILE_PATH
    ? path.resolve(process.env.LOG_FILE_PATH)
    : defaultLogFilePath;
};

const createAccessLogLine = ({ method, route, timestamp = new Date(), timeZone }) => {
  const selectedTimeZone = timeZone || DEFAULT_TIME_ZONE;
  const { date, time } = formatDateTime(timestamp, selectedTimeZone);

  return `fecha=${date} hora=${time} zona=${selectedTimeZone} metodo=${method} ruta=${route}\n`;
};

const appendAccessLog = (access, callback = () => {}) => {
  let logLine;

  try {
    logLine = createAccessLogLine(access);
  } catch (error) {
    callback(error);
    return;
  }

  const logFilePath = getLogFilePath();

  // La carpeta se crea si no existe y appendFile conserva los accesos anteriores.
  fs.mkdir(path.dirname(logFilePath), { recursive: true }, (directoryError) => {
    if (directoryError) {
      callback(directoryError);
      return;
    }

    fs.appendFile(logFilePath, logLine, "utf8", callback);
  });
};

module.exports = { appendAccessLog, createAccessLogLine };
