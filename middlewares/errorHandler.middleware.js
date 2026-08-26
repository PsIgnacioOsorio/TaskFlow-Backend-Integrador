const isDataRequest = (req) => {
  return /^\/(api|usuarios|tareas|transacciones)(\/|$)/.test(req.originalUrl);
};

const normalizeError = (error) => {
  if (error.name === "SequelizeUniqueConstraintError") {
    return {
      statusCode: 409,
      message: "Ya existe un registro con esos datos",
      details: error.errors?.map((item) => item.message) || null
    };
  }

  if (error.name === "SequelizeValidationError") {
    return {
      statusCode: 400,
      message: "Los datos enviados no son válidos",
      details: error.errors?.map((item) => item.message) || null
    };
  }

  if (["SequelizeConnectionError", "SequelizeConnectionRefusedError"].includes(error.name)) {
    return {
      statusCode: 503,
      message: "No fue posible conectar con la base de datos",
      details: null
    };
  }

  if (["ECONNREFUSED", "28P01", "3D000"].includes(error.code)) {
    return {
      statusCode: 503,
      message: "No fue posible conectar con la base de datos",
      details: null
    };
  }

  const statusCode = error.statusCode || 500;
  return {
    statusCode,
    message: statusCode === 500 ? "Error interno del servidor" : error.message,
    details: error.details || null
  };
};

const errorHandler = (error, req, res, next) => {
  if (res.headersSent) return next(error);

  const normalized = normalizeError(error);

  if (normalized.statusCode >= 500) {
    console.error(`[ERROR] ${error.stack || error.message}`);
  }

  if (normalized.statusCode === 404 && !isDataRequest(req)) {
    const projectName = process.env.APP_NAME?.trim() || "TaskFlow";
    return res.status(404).render("not-found", {
      pageTitle: `Página no encontrada | ${projectName}`,
      projectName,
      requestedPath: req.originalUrl,
      currentYear: new Date().getFullYear()
    });
  }

  return res.status(normalized.statusCode).json({
    status: "error",
    message: normalized.message,
    data: null,
    ...(normalized.details ? { details: normalized.details } : {})
  });
};

module.exports = errorHandler;
