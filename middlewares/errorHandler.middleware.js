// Los cuatro parámetros son obligatorios para que Express reconozca este middleware de error.
const errorHandler = (error, req, res, next) => {
  const statusCode = error.statusCode || 500;
  const publicMessage = statusCode === 500 ? "Error interno del servidor" : error.message;

  // Evita intentar una segunda respuesta si otro middleware ya envió encabezados.
  if (res.headersSent) {
    return next(error);
  }

  return res.status(statusCode).json({
    status: "error",
    message: publicMessage,
    data: null
  });
};

module.exports = errorHandler;
