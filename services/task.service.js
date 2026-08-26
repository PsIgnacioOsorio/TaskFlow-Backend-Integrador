const { Op } = require("sequelize");
const { Task, User } = require("../models");
const { createHttpError, parsePositiveId } = require("../utils/httpError.util");

const TASK_STATUSES = ["pending", "in_progress", "completed"];
const TASK_PRIORITIES = ["low", "medium", "high"];

const statusDetails = {
  pending: { label: "Pendiente", className: "text-bg-secondary", action: "Comenzar" },
  in_progress: { label: "En curso", className: "text-bg-primary", action: "Completar" },
  completed: { label: "Completada", className: "text-bg-success", action: "Reabrir" }
};

const priorityDetails = {
  low: { label: "Baja", className: "text-bg-light border" },
  medium: { label: "Media", className: "text-bg-warning" },
  high: { label: "Alta", className: "text-bg-danger" }
};

const normalizeText = (value = "") => {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
};

const isValidDateOnly = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
};

const validateTaskPayload = (payload = {}, { partial = false } = {}) => {
  const cleanTask = {};
  const has = (property) => Object.prototype.hasOwnProperty.call(payload, property);

  if (!partial || has("title")) {
    const title = String(payload.title || "").trim();
    if (title.length < 2 || title.length > 80) {
      throw createHttpError(400, "El título debe tener entre 2 y 80 caracteres");
    }
    cleanTask.title = title;
  }

  if (!partial || has("description")) {
    const description = String(payload.description || "").trim();
    if (description.length > 240) {
      throw createHttpError(400, "La descripción no puede superar 240 caracteres");
    }
    cleanTask.description = description;
  }

  if (!partial || has("status")) {
    const status = String(payload.status || "pending").trim();
    if (!TASK_STATUSES.includes(status)) {
      throw createHttpError(400, "Estado de tarea no válido");
    }
    cleanTask.status = status;
  }

  if (!partial || has("priority")) {
    const priority = String(payload.priority || "medium").trim();
    if (!TASK_PRIORITIES.includes(priority)) {
      throw createHttpError(400, "Prioridad de tarea no válida");
    }
    cleanTask.priority = priority;
  }

  if (!partial || has("dueDate")) {
    const dueDate = String(payload.dueDate || "").trim();
    if (dueDate && !isValidDateOnly(dueDate)) {
      throw createHttpError(400, "La fecha debe usar el formato YYYY-MM-DD");
    }
    cleanTask.dueDate = dueDate || null;
  }

  if (!partial || has("userId")) {
    cleanTask.userId = parsePositiveId(payload.userId, "ID de usuario");
  }

  if (partial && Object.keys(cleanTask).length === 0) {
    throw createHttpError(400, "No se recibieron campos válidos para actualizar");
  }

  return cleanTask;
};

const presentTask = (taskRecord) => {
  const task = typeof taskRecord.get === "function"
    ? taskRecord.get({ plain: true })
    : { ...taskRecord };
  const status = statusDetails[task.status];
  const priority = priorityDetails[task.priority];

  return {
    ...task,
    statusLabel: status.label,
    statusClass: status.className,
    nextActionLabel: status.action,
    priorityLabel: priority.label,
    priorityClass: priority.className,
    dueLabel: task.dueDate || "Sin fecha",
    isCompleted: task.status === "completed",
    searchText: normalizeText(
      `${task.title} ${task.description} ${status.label} ${priority.label} ${task.user?.name || ""}`
    )
  };
};

const listTasks = async ({ status = "all", search = "", userId, limit = 100 } = {}) => {
  if (status !== "all" && !TASK_STATUSES.includes(status)) {
    throw createHttpError(400, "Estado de tarea no válido");
  }

  const where = {};
  const cleanSearch = String(search || "").trim();

  if (status !== "all") where.status = status;
  if (userId !== undefined && userId !== "") {
    where.userId = parsePositiveId(userId, "ID de usuario");
  }
  if (cleanSearch) {
    where[Op.or] = [
      { title: { [Op.iLike]: `%${cleanSearch}%` } },
      { description: { [Op.iLike]: `%${cleanSearch}%` } }
    ];
  }

  const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 100);
  const tasks = await Task.findAll({
    where,
    include: [{ model: User, as: "user", attributes: ["id", "name", "email"] }],
    order: [["createdAt", "DESC"]],
    limit: safeLimit
  });

  return tasks.map(presentTask);
};

const getTaskSummary = (tasks = []) => {
  return tasks.reduce(
    (summary, task) => {
      summary.total += 1;
      summary[task.status] += 1;
      return summary;
    },
    { total: 0, pending: 0, in_progress: 0, completed: 0 }
  );
};

const findTaskRecord = async (id, options = {}) => {
  const taskId = parsePositiveId(id, "ID de tarea");
  const task = await Task.findByPk(taskId, options);

  if (!task) throw createHttpError(404, "Tarea no encontrada");
  return task;
};

const addTask = async (payload, options = {}) => {
  const cleanTask = validateTaskPayload(payload);
  const user = await User.findByPk(cleanTask.userId, { transaction: options.transaction });

  if (!user) throw createHttpError(404, "Usuario responsable no encontrado");

  const task = await Task.create(cleanTask, { transaction: options.transaction });
  await task.reload({
    include: [{ model: User, as: "user", attributes: ["id", "name", "email"] }],
    transaction: options.transaction
  });

  return presentTask(task);
};

const updateTask = async (id, payload) => {
  const task = await findTaskRecord(id);
  const cleanTask = validateTaskPayload(payload, { partial: true });

  if (cleanTask.userId) {
    const user = await User.findByPk(cleanTask.userId);
    if (!user) throw createHttpError(404, "Usuario responsable no encontrado");
  }

  await task.update(cleanTask);
  await task.reload({
    include: [{ model: User, as: "user", attributes: ["id", "name", "email"] }]
  });
  return presentTask(task);
};

const advanceTask = async (id) => {
  const task = await findTaskRecord(id);
  const currentIndex = TASK_STATUSES.indexOf(task.status);
  task.status = TASK_STATUSES[(currentIndex + 1) % TASK_STATUSES.length];
  await task.save();
  await task.reload({
    include: [{ model: User, as: "user", attributes: ["id", "name", "email"] }]
  });
  return presentTask(task);
};

const removeTask = async (id) => {
  const task = await findTaskRecord(id, {
    include: [{ model: User, as: "user", attributes: ["id", "name", "email"] }]
  });
  const deletedTask = presentTask(task);
  await task.destroy();
  return deletedTask;
};

module.exports = {
  TASK_PRIORITIES,
  TASK_STATUSES,
  addTask,
  advanceTask,
  getTaskSummary,
  listTasks,
  presentTask,
  removeTask,
  updateTask,
  validateTaskPayload
};
