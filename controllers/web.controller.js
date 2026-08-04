const getHome = (req, res) => {
  // Los datos se envían a HBS para demostrar renderizado dinámico desde Express.
  res.status(200).render("home", {
    pageTitle: "TaskFlow Backend Integrador",
    projectName: "TaskFlow",
    moduleName: "Módulo 6 - Parte 1",
    currentYear: new Date().getFullYear(),
    nodeVersion: process.version,
    routes: [
      { method: "GET", path: "/", response: "Vista dinámica HBS" },
      { method: "GET", path: "/status", response: "Estado del servidor en JSON" },
      { method: "GET", path: "/css/styles.css", response: "Archivo estático" }
    ]
  });
};

const getStatus = (req, res) => {
  // Devuelve información pública y no sensible sobre el estado del servidor.
  res.status(200).json({
    status: "ok",
    message: "Servidor TaskFlow activo",
    data: {
      project: "TaskFlow Backend Integrador",
      module: 6,
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime())
    }
  });
};

module.exports = { getHome, getStatus };
