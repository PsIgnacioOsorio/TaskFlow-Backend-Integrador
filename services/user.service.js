const { Op } = require("sequelize");
const { sequelize, Task, User } = require("../models");
const { createHttpError, parsePositiveId } = require("../utils/httpError.util");
const { validateTaskPayload } = require("./task.service");

const USER_ATTRIBUTES = ["id", "name", "email", "active", "createdAt", "updatedAt"];

const parseBoolean = (value, label) => {
  if (typeof value === "boolean") return value;
  if (value === "true" || value === "1" || value === "on") return true;
  if (value === "false" || value === "0") return false;
  throw createHttpError(400, `${label} debe ser verdadero o falso`);
};

const validateUserPayload = (payload = {}, { partial = false } = {}) => {
  const cleanUser = {};
  const has = (property) => Object.prototype.hasOwnProperty.call(payload, property);

  if (!partial || has("name")) {
    const name = String(payload.name || "").trim();
    if (name.length < 2 || name.length > 80) {
      throw createHttpError(400, "El nombre debe tener entre 2 y 80 caracteres");
    }
    cleanUser.name = name;
  }

  if (!partial || has("email")) {
    const email = String(payload.email || "").trim().toLowerCase();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email) || email.length > 120) {
      throw createHttpError(400, "El correo electrónico no es válido");
    }
    cleanUser.email = email;
  }

  if (!partial || has("active")) {
    cleanUser.active = has("active") ? parseBoolean(payload.active, "active") : true;
  }

  if (partial && Object.keys(cleanUser).length === 0) {
    throw createHttpError(400, "No se recibieron campos válidos para actualizar");
  }

  return cleanUser;
};

const presentUser = (userRecord) => {
  const user = typeof userRecord.get === "function"
    ? userRecord.get({ plain: true })
    : { ...userRecord };

  if (Array.isArray(user.tasks)) user.taskCount = user.tasks.length;
  return user;
};

const listUsers = async ({ search = "", active } = {}) => {
  const where = {};
  const cleanSearch = String(search || "").trim();

  if (cleanSearch) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${cleanSearch}%` } },
      { email: { [Op.iLike]: `%${cleanSearch}%` } }
    ];
  }
  if (active !== undefined && active !== "") where.active = parseBoolean(active, "active");

  const users = await User.findAll({
    attributes: USER_ATTRIBUTES,
    order: [["name", "ASC"]],
    where
  });
  return users.map(presentUser);
};

const findUserRecord = async (id, options = {}) => {
  const userId = parsePositiveId(id, "ID de usuario");
  const user = await User.findByPk(userId, options);

  if (!user) throw createHttpError(404, "Usuario no encontrado");
  return user;
};

const getUserWithTasks = async (id) => {
  const user = await findUserRecord(id, {
    attributes: USER_ATTRIBUTES,
    include: [
      {
        model: Task,
        as: "tasks",
        attributes: ["id", "title", "description", "status", "priority", "dueDate"],
        separate: true,
        order: [["createdAt", "DESC"]]
      }
    ]
  });
  return presentUser(user);
};

const createUser = async (payload, options = {}) => {
  const cleanUser = validateUserPayload(payload);
  const user = await User.create(cleanUser, { transaction: options.transaction });
  return presentUser(user);
};

const updateUser = async (id, payload) => {
  const user = await findUserRecord(id);
  const cleanUser = validateUserPayload(payload, { partial: true });
  await user.update(cleanUser);
  return presentUser(user);
};

const deleteUser = async (id) => {
  const user = await findUserRecord(id);
  const deletedUser = presentUser(user);
  await user.destroy();
  return deletedUser;
};

const createUserWithInitialTask = async ({ user: userPayload, task: taskPayload, forceFailure }) => {
  const cleanUser = validateUserPayload(userPayload);
  const cleanTask = validateTaskPayload({ ...taskPayload, userId: 1 });

  try {
    const result = await sequelize.transaction(async (transaction) => {
      const user = await User.create(cleanUser, { transaction });

      if (forceFailure === true || forceFailure === "true") {
        throw createHttpError(400, "Falla forzada para demostrar el rollback");
      }

      cleanTask.userId = user.id;
      const task = await Task.create(cleanTask, { transaction });
      return { user: presentUser(user), task: task.get({ plain: true }) };
    });

    console.log(`[TRANSACCION OK] usuario=${result.user.id} tarea=${result.task.id}`);
    return result;
  } catch (error) {
    console.error(`[TRANSACCION ROLLBACK] ${error.message}`);
    throw error;
  }
};

module.exports = {
  createUser,
  createUserWithInitialTask,
  deleteUser,
  getUserWithTasks,
  listUsers,
  presentUser,
  updateUser,
  validateUserPayload
};
