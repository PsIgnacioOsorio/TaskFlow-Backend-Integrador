const { appendAccessLog } = require("../services/accessLog.service");

const requestLogger = (req, res, next) => {
  // El servicio concentra la persistencia y mantiene el middleware enfocado en HTTP.
  appendAccessLog({
    method: req.method,
    route: req.originalUrl,
    timeZone: process.env.LOG_TIME_ZONE
  }, (error) => {
    if (error) {
      console.error("No fue posible registrar el acceso:", error.message);
    }
  });

  // El registro es asíncrono y no bloquea la respuesta al cliente.
  next();
};

module.exports = requestLogger;
