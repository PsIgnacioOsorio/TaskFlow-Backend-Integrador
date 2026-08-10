// Los cuatro parámetros son obligatorios para que Express reconozca este middleware de error.
const errorHandler = (error, req, res, next) => {
  const statusCode = error.statusCode || 500;
  const publicMessage = statusCode === 500 ? "Error interno del servidor" : error.message;

  // Evita intentar una segunda respuesta si otro middleware ya envió encabezados.
  if (res.headersSent) {
    return next(error);
  }

  // Las rutas web inexistentes muestran una página útil para volver al tablero.
  // Las rutas /api mantienen JSON para que puedan consumirse desde otras aplicaciones.
  if (statusCode === 404 && !req.originalUrl.startsWith("/api/")) {
    const projectName = process.env.APP_NAME?.trim() || "TaskFlow";

    return res.status(404).render("not-found", {
      pageTitle: `Página no encontrada | ${projectName}`,
      projectName,
      requestedPath: req.originalUrl,
      currentYear: new Date().getFullYear()
    });
  }

  return res.status(statusCode).json({
    status: "error",
    message: publicMessage,
    data: null
  });
};

module.exports = errorHandler;
