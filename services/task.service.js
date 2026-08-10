const TASK_STATUSES = ["pending", "in_progress", "completed"];
const TASK_PRIORITIES = ["low", "medium", "high"];

// Almacenamiento temporal. En el Módulo 7 estas funciones podrán conservarse
// y reemplazar el arreglo por consultas a la base de datos.
let tasks = [
  {
    id: 1,
    title: "Preparar entrega del módulo",
    description: "Revisar el proyecto, las capturas y el enlace del repositorio.",
    status: "in_progress",
    priority: "high",
    dueDate: "2026-08-08"
  },
  {
    id: 2,
    title: "Ordenar documentos en Drive",
    description: "Separar evidencias obligatorias y archivos de entrega.",
    status: "pending",
    priority: "medium",
    dueDate: "2026-08-09"
  },
  {
    id: 3,
    title: "Comprobar rutas del servidor",
    description: "Verificar la página principal, el estado y el registro de accesos.",
    status: "completed",
    priority: "medium",
    dueDate: "2026-08-06"
  }
];

let nextTaskId = 4;

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

const presentTask = (task) => ({
  ...task,
  statusLabel: statusDetails[task.status].label,
  statusClass: statusDetails[task.status].className,
  nextActionLabel: statusDetails[task.status].action,
  priorityLabel: priorityDetails[task.priority].label,
  priorityClass: priorityDetails[task.priority].className,
  dueLabel: task.dueDate || "Sin fecha",
  searchText: normalizeText(`${task.title} ${task.description}`)
});

const listTasks = ({ status = "all", search = "", limit = tasks.length } = {}) => {
  const normalizedSearch = normalizeText(search);
  const safeLimit = Number.isInteger(limit) && limit > 0 ? limit : tasks.length;

  return tasks
    .filter((task) => status === "all" || task.status === status)
    .filter((task) => {
      if (!normalizedSearch) return true;

      const searchableText = normalizeText([
        task.title,
        task.description,
        statusDetails[task.status].label,
        priorityDetails[task.priority].label
      ].join(" "));

      return searchableText.includes(normalizedSearch);
    })
    .slice(0, safeLimit)
    .map(presentTask);
};

const getTaskSummary = (taskList = tasks) => {
  return taskList.reduce((summary, task) => {
    summary.total += 1;
    summary[task.status] += 1;
    return summary;
  }, {
    total: 0,
    pending: 0,
    in_progress: 0,
    completed: 0
  });
};

const addTask = ({ title, description = "", priority = "medium", dueDate = "" }) => {
  const cleanTitle = String(title || "").trim();
  const cleanDescription = String(description || "").trim();

  if (!cleanTitle) {
    const error = new Error("El título de la tarea es obligatorio");
    error.statusCode = 400;
    throw error;
  }

  if (!TASK_PRIORITIES.includes(priority)) {
    const error = new Error("La prioridad indicada no es válida");
    error.statusCode = 400;
    throw error;
  }

  const task = {
    id: nextTaskId,
    title: cleanTitle.slice(0, 80),
    description: cleanDescription.slice(0, 240),
    status: "pending",
    priority,
    dueDate: String(dueDate || "").trim()
  };

  nextTaskId += 1;
  tasks.unshift(task);
  return presentTask(task);
};

const findTask = (id) => {
  const task = tasks.find((item) => item.id === Number(id));

  if (!task) {
    const error = new Error("Tarea no encontrada");
    error.statusCode = 404;
    throw error;
  }

  return task;
};

const advanceTask = (id) => {
  const task = findTask(id);
  const currentIndex = TASK_STATUSES.indexOf(task.status);
  task.status = TASK_STATUSES[(currentIndex + 1) % TASK_STATUSES.length];
  return presentTask(task);
};

const removeTask = (id) => {
  const task = findTask(id);
  tasks = tasks.filter((item) => item.id !== task.id);
  return presentTask(task);
};

module.exports = {
  TASK_STATUSES,
  addTask,
  advanceTask,
  getTaskSummary,
  listTasks,
  removeTask
};
