const {
  deleteUser,
  getUserWithRelations,
  listUsers,
  updateUserWithProfile
} = require("../services/user.service");
const { sendSuccess } = require("../utils/apiResponse.util");

const getUsers = async (req, res) => {
  const users = await listUsers(req.query);
  return sendSuccess(res, 200, "Usuarios obtenidos", { users });
};

const getUser = async (req, res) => {
  const user = await getUserWithRelations(req.params.id);
  return sendSuccess(res, 200, "Usuario y relaciones obtenidos", { user });
};

const putUser = async (req, res) => {
  const user = await updateUserWithProfile(req.params.id, req.body, {
    allowActive: req.auth.role === "admin"
  });
  return sendSuccess(res, 200, "Usuario actualizado", { user });
};

const removeUser = async (req, res) => {
  const user = await deleteUser(req.params.id);
  return sendSuccess(res, 200, "Usuario eliminado", { user });
};

module.exports = { getUser, getUsers, putUser, removeUser };
