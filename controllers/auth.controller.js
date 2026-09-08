const { loginAccount, registerAccount } = require("../services/auth.service");
const { sendSuccess } = require("../utils/apiResponse.util");

const register = async (req, res) => {
  const user = await registerAccount(req.body);
  return sendSuccess(res, 201, "Cuenta creada correctamente", { user });
};

const login = async (req, res) => {
  const session = await loginAccount(req.body);
  return sendSuccess(res, 200, "Autenticación correcta", session);
};

module.exports = { login, register };
