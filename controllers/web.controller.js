const {
  addTask,
  advanceTask,
  getTaskSummary,
  listTasks,
  removeTask
} = require("../services/task.service");
const {
  createUser,
  deleteUser,
  listUsers
} = require("../services/user.service");

const getAppConfig = () => ({
  appName: process.env.APP_NAME?.trim() || "TaskFlow",
  appStage: process.env.APP_STAGE?.trim() || "Parte 2 - Módulo 7"
});

const getHome = async (req, res) => {
  const config = getAppConfig();
  const [tasks, users] = await Promise.all([listTasks(), listUsers({ active: true })]);

  res.status(200).render("home", {
    pageTitle: `${config.appName} | Mis tareas`,
    projectName: config.appName,
    moduleName: config.appStage,
    currentYear: new Date().getFullYear(),
    tasks,
    users,
    summary: getTaskSummary(tasks)
  });
};

const getUsersPage = async (req, res) => {
  const config = getAppConfig();
  const users = await listUsers();

  res.status(200).render("users", {
    pageTitle: `${config.appName} | Usuarios`,
    projectName: config.appName,
    moduleName: config.appStage,
    currentYear: new Date().getFullYear(),
    users,
    userCount: users.length
  });
};

const getStatus = (req, res) => {
  const config = getAppConfig();

  res.status(200).json({
    status: "ok",
    message: `Servidor ${config.appName} activo`,
    data: {
      project: config.appName,
      module: 7,
      stage: config.appStage,
      database: "PostgreSQL",
      orm: "Sequelize",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime())
    }
  });
};

const createTask = async (req, res) => {
  await addTask(req.body);
  res.redirect(303, "/#tareas");
};

const moveTaskForward = async (req, res) => {
  await advanceTask(req.params.id);
  res.redirect(303, "/#tareas");
};

const deleteTask = async (req, res) => {
  await removeTask(req.params.id);
  res.redirect(303, "/#tareas");
};

const createUserFromForm = async (req, res) => {
  await createUser({ ...req.body, active: true });
  res.redirect(303, "/users");
};

const deleteUserFromForm = async (req, res) => {
  await deleteUser(req.params.id);
  res.redirect(303, "/users");
};

module.exports = {
  createTask,
  createUserFromForm,
  deleteTask,
  deleteUserFromForm,
  getHome,
  getStatus,
  getUsersPage,
  moveTaskForward
};
