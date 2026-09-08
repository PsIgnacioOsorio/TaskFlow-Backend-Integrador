const fs = require("node:fs");
const path = require("node:path");
const hbs = require("hbs");

const task = {
  id: 1,
  title: "Tarea de comprobación",
  description: "Vista compilada sin errores",
  status: "pending",
  statusClass: "text-bg-secondary",
  statusLabel: "Pendiente",
  priorityClass: "text-bg-warning",
  priorityLabel: "Media",
  nextActionLabel: "Comenzar",
  dueLabel: "2026-09-15",
  searchText: "tarea de comprobacion",
  user: { id: 1, name: "Usuario TaskFlow" }
};

const contexts = {
  "home.hbs": {
    pageTitle: "TaskFlow",
    projectName: "TaskFlow",
    moduleName: "Parte 3 - Módulo 8",
    currentYear: 2026,
    tasks: [task],
    users: [task.user],
    summary: { total: 1, pending: 1, in_progress: 0, completed: 0 }
  },
  "users.hbs": {
    pageTitle: "Usuarios",
    projectName: "TaskFlow",
    moduleName: "Parte 3 - Módulo 8",
    currentYear: 2026,
    userCount: 1,
    users: [
      { id: 1, name: "Usuario TaskFlow", email: "usuario@taskflow.local", active: true }
    ]
  },
  "not-found.hbs": {
    pageTitle: "404",
    projectName: "TaskFlow",
    requestedPath: "/prueba",
    currentYear: 2026
  }
};

for (const [fileName, context] of Object.entries(contexts)) {
  const templatePath = path.join(__dirname, "../views", fileName);
  const html = hbs.compile(fs.readFileSync(templatePath, "utf8"))(context);

  if (html.includes("<!DOCTYPE html>") === false) {
    throw new Error(`${fileName} no produjo un documento HTML válido`);
  }

  console.log(`${fileName}: plantilla compilada correctamente`);
}
