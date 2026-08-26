const { Task, User, sequelize } = require("../models");

const sampleUsers = [
  { name: "Ignacio Osorio", email: "ignacio@taskflow.local", active: true },
  { name: "Camila Soto", email: "camila@taskflow.local", active: true },
  { name: "Matías Rojas", email: "matias@taskflow.local", active: true }
];

const sampleTasks = [
  {
    ownerEmail: "ignacio@taskflow.local",
    title: "Preparar entrega del módulo",
    description: "Revisar el proyecto, las capturas y el enlace del repositorio.",
    status: "in_progress",
    priority: "high",
    dueDate: "2026-09-04"
  },
  {
    ownerEmail: "camila@taskflow.local",
    title: "Ordenar documentos en Drive",
    description: "Separar evidencias obligatorias y archivos de entrega.",
    status: "pending",
    priority: "medium",
    dueDate: "2026-09-05"
  },
  {
    ownerEmail: "matias@taskflow.local",
    title: "Comprobar rutas del servidor",
    description: "Verificar la página principal, el estado y la conexión PostgreSQL.",
    status: "completed",
    priority: "medium",
    dueDate: "2026-09-03"
  }
];

const seedDatabase = async () => {
  const usersByEmail = new Map();

  for (const userData of sampleUsers) {
    const [user] = await User.findOrCreate({
      where: { email: userData.email },
      defaults: userData
    });
    usersByEmail.set(user.email, user);
  }

  for (const taskData of sampleTasks) {
    const owner = usersByEmail.get(taskData.ownerEmail);
    const { ownerEmail, ...taskDefaults } = taskData;
    await Task.findOrCreate({
      where: { title: taskData.title, userId: owner.id },
      defaults: { ...taskDefaults, userId: owner.id }
    });
  }
};

const setupDatabase = async () => {
  await sequelize.sync();
  await seedDatabase();
};

module.exports = { seedDatabase, setupDatabase };
