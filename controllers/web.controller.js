const {
  TASK_STATUSES,
  addTask,
  advanceTask,
  getTaskSummary,
  listTasks,
  removeTask
} = require("../services/task.service");

const getAppConfig = () => ({
  appName: process.env.APP_NAME?.trim() || "TaskFlow",
  appStage: process.env.APP_STAGE?.trim() || "Parte 1 - Módulo 6"
});

const getHome = (req, res) => {
  const config = getAppConfig();
  const tasks = listTasks();

  // Express entrega a HBS tanto configuración como datos del dominio TaskFlow.
  res.status(200).render("home", {
    pageTitle: `${config.appName} | Mis tareas`,
    projectName: config.appName,
    moduleName: config.appStage,
    currentYear: new Date().getFullYear(),
    tasks,
    summary: getTaskSummary(tasks)
  });
};

const getStatus = (req, res) => {
  const config = getAppConfig();

  // Devuelve información pública y no sensible sobre el estado del servidor.
  res.status(200).json({
    status: "ok",
    message: `Servidor ${config.appName} activo`,
    data: {
      project: config.appName,
      module: 6,
      stage: config.appStage,
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime())
    }
  });
};

const getTasks = (req, res, next) => {
  try {
    const config = getAppConfig();
    const status = req.query.status || "all";
    const search = req.query.search || "";

    if (status !== "all" && !TASK_STATUSES.includes(status)) {
      const error = new Error("Estado de tarea no válido");
      error.statusCode = 400;
      throw error;
    }

    const tasks = listTasks({
      status,
      search
    });

    res.status(200).json({
      status: "ok",
      message: "Tareas obtenidas correctamente",
      data: {
        tasks,
        summary: getTaskSummary(tasks),
        persistence: "memory",
        nextStage: "Reemplazar el arreglo por una base de datos en el Módulo 7"
      }
    });
  } catch (error) {
    next(error);
  }
};

const createTask = (req, res, next) => {
  try {
    addTask(req.body);
    res.redirect(303, "/#tareas");
  } catch (error) {
    next(error);
  }
};

const moveTaskForward = (req, res, next) => {
  try {
    advanceTask(req.params.id);
    res.redirect(303, "/#tareas");
  } catch (error) {
    next(error);
  }
};

const deleteTask = (req, res, next) => {
  try {
    removeTask(req.params.id);
    res.redirect(303, "/#tareas");
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTask,
  deleteTask,
  getHome,
  getStatus,
  getTasks,
  moveTaskForward
};
