const { Op } = require("sequelize");
const { Profile, Project, sequelize, Task, User } = require("../models");
const { createHttpError, parsePositiveId } = require("../utils/httpError.util");
const { validateTaskPayload } = require("./task.service");
const { removePreviousAvatar } = require("./upload.service");

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

const getUserWithTasks = async (id, { logging } = {}) => {
  const user = await findUserRecord(id, {
    attributes: USER_ATTRIBUTES,
    include: [
      {
        model: Task,
        as: "tasks",
        attributes: ["id", "title", "description", "status", "priority", "dueDate"]
      }
    ],
    order: [[{ model: Task, as: "tasks" }, "createdAt", "DESC"]],
    ...(logging ? { logging } : {})
  });
  return presentUser(user);
};

const getUserWithRelations = async (id) => {
  const user = await findUserRecord(id, {
    attributes: USER_ATTRIBUTES,
    include: [
      { model: Profile, as: "profile", attributes: ["id", "bio", "avatarUrl", "userId"] },
      {
        model: Task,
        as: "tasks",
        attributes: ["id", "title", "status", "priority", "dueDate"]
      },
      {
        model: Project,
        as: "projects",
        attributes: ["id", "name", "description", "ownerId"],
        through: { attributes: ["joinedAt"] }
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

const updateUserWithProfile = async (id, payload, { allowActive = false } = {}) => {
  const has = (field) => Object.prototype.hasOwnProperty.call(payload, field);
  const userPayload = {};
  if (has("name")) userPayload.name = payload.name;
  if (has("email")) userPayload.email = payload.email;
  if (allowActive && has("active")) userPayload.active = payload.active;

  const hasUserFields = Object.keys(userPayload).length > 0;
  const hasBio = has("bio");
  if (!hasUserFields && !hasBio) {
    throw createHttpError(400, "No se recibieron campos válidos para actualizar");
  }

  const bio = hasBio ? String(payload.bio || "").trim() : null;
  if (hasBio && bio.length > 240) {
    throw createHttpError(400, "La biografía no puede superar 240 caracteres");
  }

  await sequelize.transaction(async (transaction) => {
    const user = await findUserRecord(id, { transaction });
    if (hasUserFields) {
      const cleanUser = validateUserPayload(userPayload, { partial: true });
      await user.update(cleanUser, { transaction });
    }
    if (hasBio) {
      const [profile] = await Profile.findOrCreate({
        where: { userId: user.id },
        defaults: { bio, userId: user.id },
        transaction
      });
      if (!profile.isNewRecord) await profile.update({ bio }, { transaction });
    }
  });

  return getUserWithRelations(id);
};

const deleteUser = async (id) => {
  const user = await findUserRecord(id, {
    include: [{ model: Profile, as: "profile", attributes: ["avatarUrl"] }]
  });
  const deletedUser = presentUser(user);
  const avatarUrl = user.profile?.avatarUrl;
  await user.destroy();
  await removePreviousAvatar(avatarUrl);
  return deletedUser;
};

const createUserWithInitialTask = async (
  { user: userPayload, task: taskPayload, forceFailure } = {}
) => {
  const cleanUser = validateUserPayload(userPayload);
  const cleanTask = validateTaskPayload(taskPayload, { requireUserId: false });

  try {
    const result = await sequelize.transaction(async (transaction) => {
      const user = await User.create(cleanUser, { transaction });
      const task = await Task.create(
        { ...cleanTask, userId: user.id },
        { transaction }
      );

      // La falla se provoca después de ambas escrituras para comprobar que
      // PostgreSQL revierte tanto el usuario como su tarea antes del commit.
      if (forceFailure === true || forceFailure === "true") {
        throw createHttpError(400, "Falla forzada para demostrar el rollback");
      }

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
  findUserRecord,
  getUserWithRelations,
  getUserWithTasks,
  listUsers,
  presentUser,
  updateUser,
  updateUserWithProfile,
  validateUserPayload
};
