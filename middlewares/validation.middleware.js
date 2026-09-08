const { validationResult } = require("express-validator");
const { createHttpError } = require("../utils/httpError.util");

const validateRequest = (req, res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const details = result.array({ onlyFirstError: true }).map((error) => ({
    field: error.path,
    message: error.msg
  }));

  return next(createHttpError(400, "Los datos enviados no son válidos", details));
};

module.exports = { validateRequest };
