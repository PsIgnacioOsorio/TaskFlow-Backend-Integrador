const {
  addTask,
  findTaskRecord,
  getTaskById,
  getTaskSummary,
  listTasks,
  removeTask,
  updateTask
} = require("../services/task.service");
const { createHttpError } = require("../utils/httpError.util");
const { sendSuccess } = require("../utils/apiResponse.util");

const assertTaskAccess = (task, auth) => {
  if (auth.role !== "admin" && task.userId !== auth.userId) {
    throw createHttpError(403, "No tienes permisos sobre esta tarea");
  }
};

const getTasks = async (req, res) => {
  const query = { ...req.query };
  if (req.auth.role !== "admin") query.userId = req.auth.userId;
  const tasks = await listTasks(query);
  return sendSuccess(res, 200, "Tareas obtenidas", {
    tasks,
    summary: getTaskSummary(tasks),
    filters: { status: query.status || "all", search: query.search || "" }
  });
};

const getTask = async (req, res) => {
  const taskRecord = await findTaskRecord(req.params.id);
  assertTaskAccess(taskRecord, req.auth);
  const task = await getTaskById(taskRecord.id);
  return sendSuccess(res, 200, "Tarea obtenida", { task });
};

const postTask = async (req, res) => {
  const userId = req.auth.role === "admin" && req.body.userId
    ? req.body.userId
    : req.auth.userId;
  const task = await addTask({ ...req.body, userId });
  return sendSuccess(res, 201, "Tarea creada", { task });
};

const putTask = async (req, res) => {
  const taskRecord = await findTaskRecord(req.params.id);
  assertTaskAccess(taskRecord, req.auth);
  const payload = { ...req.body };
  if (req.auth.role !== "admin") delete payload.userId;
  const task = await updateTask(taskRecord.id, payload);
  return sendSuccess(res, 200, "Tarea actualizada", { task });
};

const deleteTask = async (req, res) => {
  const taskRecord = await findTaskRecord(req.params.id);
  assertTaskAccess(taskRecord, req.auth);
  const task = await removeTask(taskRecord.id);
  return sendSuccess(res, 200, "Tarea eliminada", { task });
};

module.exports = { deleteTask, getTask, getTasks, postTask, putTask };
