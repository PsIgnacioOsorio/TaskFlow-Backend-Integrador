const jwt = require("jsonwebtoken");
const { createHttpError } = require("../utils/httpError.util");

const JWT_ISSUER = "taskflow-api";
const JWT_AUDIENCE = "taskflow-client";

const getJwtConfig = () => {
  const secret = process.env.JWT_SECRET || "";
  const expiresIn = process.env.JWT_EXPIRES_IN?.trim() || "1h";

  if (secret.length < 32) {
    throw createHttpError(
      500,
      "JWT_SECRET debe contener al menos 32 caracteres"
    );
  }

  return { secret, expiresIn };
};

const createAccessToken = (user, options = {}) => {
  const { secret, expiresIn } = getJwtConfig();
  const role = user.credential?.role || user.role || "user";

  return jwt.sign(
    { role },
    secret,
    {
      algorithm: "HS256",
      audience: JWT_AUDIENCE,
      expiresIn: options.expiresIn || expiresIn,
      issuer: JWT_ISSUER,
      subject: String(user.id)
    }
  );
};

const verifyAccessToken = (token) => {
  const { secret } = getJwtConfig();
  return jwt.verify(token, secret, {
    algorithms: ["HS256"],
    audience: JWT_AUDIENCE,
    issuer: JWT_ISSUER
  });
};

module.exports = {
  createAccessToken,
  getJwtConfig,
  verifyAccessToken
};
