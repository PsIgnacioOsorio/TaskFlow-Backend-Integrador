const {
  addTask,
  getTaskSummary,
  listTasks,
  removeTask,
  updateTask
} = require("../services/task.service");
const { listUsersWithSql } = require("../services/sqlUser.service");
const {
  createUser,
  createUserWithInitialTask,
  deleteUser,
  getUserWithTasks,
  listUsers,
  updateUser
} = require("../services/user.service");

const sendSuccess = (res, statusCode, message, data) => {
  return res.status(statusCode).json({ status: "ok", message, data });
};

const getUsers = async (req, res) => {
  const users = await listUsers(req.query);
  return sendSuccess(res, 200, "Usuarios obtenidos con Sequelize", { users });
};

const getUsersSql = async (req, res) => {
  const users = await listUsersWithSql(req.query);
  return sendSuccess(res, 200, "Usuarios obtenidos con SQL directo y pg", { users });
};

const compareUserQueries = async (req, res) => {
  const [ormUsers, sqlUsers] = await Promise.all([
    listUsers(req.query),
    listUsersWithSql(req.query)
  ]);
  const selectComparableFields = (user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    active: user.active
  });
  const sameData = JSON.stringify(ormUsers.map(selectComparableFields))
    === JSON.stringify(sqlUsers.map(selectComparableFields));

  return sendSuccess(res, 200, "Comparación entre Sequelize y SQL directo", {
    sameData,
    sequelize: ormUsers,
    sql: sqlUsers
  });
};

const getUserTasks = async (req, res) => {
  const user = await getUserWithTasks(req.params.id);
  return sendSuccess(res, 200, "Usuario y tareas obtenidos con include", { user });
};

const postUser = async (req, res) => {
  const user = await createUser(req.body);
  return sendSuccess(res, 201, "Usuario creado correctamente", { user });
};

const putUser = async (req, res) => {
  const user = await updateUser(req.params.id, req.body);
  return sendSuccess(res, 200, "Usuario actualizado correctamente", { user });
};

const removeUser = async (req, res) => {
  const user = await deleteUser(req.params.id);
  return sendSuccess(res, 200, "Usuario eliminado correctamente", { user });
};

const getTasks = async (req, res) => {
  const tasks = await listTasks(req.query);
  return sendSuccess(res, 200, "Tareas obtenidas desde PostgreSQL", {
    tasks,
    summary: getTaskSummary(tasks),
    persistence: "postgresql"
  });
};

const postTask = async (req, res) => {
  const task = await addTask(req.body);
  return sendSuccess(res, 201, "Tarea creada correctamente", { task });
};

const putTask = async (req, res) => {
  const task = await updateTask(req.params.id, req.body);
  return sendSuccess(res, 200, "Tarea actualizada correctamente", { task });
};

const removeTaskById = async (req, res) => {
  const task = await removeTask(req.params.id);
  return sendSuccess(res, 200, "Tarea eliminada correctamente", { task });
};

const postUserTransaction = async (req, res) => {
  const result = await createUserWithInitialTask(req.body);
  return sendSuccess(
    res,
    201,
    "Transacción completada: usuario y tarea creados",
    result
  );
};

module.exports = {
  compareUserQueries,
  getTasks,
  getUserTasks,
  getUsers,
  getUsersSql,
  postTask,
  postUser,
  postUserTransaction,
  putTask,
  putUser,
  removeTaskById,
  removeUser
};
