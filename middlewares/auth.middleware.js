const { Credential, User } = require("../models");
const { createHttpError, parsePositiveId } = require("../utils/httpError.util");
const { verifyAccessToken } = require("../services/token.service");

const readBearerToken = (authorization = "") => {
  const [scheme, token, extra] = authorization.trim().split(/\s+/);
  if (scheme !== "Bearer" || !token || extra) {
    throw createHttpError(401, "Token Bearer requerido");
  }
  return token;
};

const authenticateToken = async (req, res, next) => {
  try {
    const token = readBearerToken(req.get("authorization") || "");
    const payload = verifyAccessToken(token);
    const userId = parsePositiveId(payload.sub, "ID del token");
    const user = await User.findByPk(userId, {
      attributes: ["id", "name", "email", "active"],
      include: [
        {
          model: Credential,
          as: "credential",
          attributes: ["role"]
        }
      ]
    });

    if (!user?.credential) throw createHttpError(401, "Token no válido");
    if (!user.active) throw createHttpError(403, "El usuario se encuentra inactivo");

    req.auth = {
      userId: user.id,
      role: user.credential.role,
      token: payload
    };
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return next(createHttpError(401, "El token ha expirado"));
    }
    if (error.name === "JsonWebTokenError" || error.name === "NotBeforeError") {
      return next(createHttpError(401, "Token no válido"));
    }
    next(error);
  }
};

const authorizeSelfOrAdmin = (req, res, next) => {
  const requestedUserId = parsePositiveId(req.params.id, "ID de usuario");

  if (req.auth.role !== "admin" && req.auth.userId !== requestedUserId) {
    return next(createHttpError(403, "No tienes permisos para modificar este usuario"));
  }
  next();
};

const authorizeAdmin = (req, res, next) => {
  if (req.auth.role !== "admin") {
    return next(createHttpError(403, "Se requiere el rol de administrador"));
  }
  next();
};

module.exports = {
  authenticateToken,
  authorizeAdmin,
  authorizeSelfOrAdmin,
  readBearerToken
};
