const createHttpError = (statusCode, message, details = null) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.details = details;
  return error;
};

const parsePositiveId = (value, label = "ID") => {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    throw createHttpError(400, `${label} no válido`);
  }

  return id;
};

module.exports = { createHttpError, parsePositiveId };
