const bcrypt = require("bcryptjs");
const {
  Credential,
  Profile,
  Project,
  ProjectMember,
  Task,
  User,
  sequelize
} = require("../models");
const { getBcryptRounds, validatePassword } = require("./auth.service");

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
  const seedPassword = validatePassword(
    process.env.SEED_USER_PASSWORD || "TaskFlow2026!"
  );
  const passwordHash = await bcrypt.hash(seedPassword, getBcryptRounds());

  for (const userData of sampleUsers) {
    const [user] = await User.findOrCreate({
      where: { email: userData.email },
      defaults: userData
    });
    usersByEmail.set(user.email, user);

    await Credential.findOrCreate({
      where: { userId: user.id },
      defaults: {
        userId: user.id,
        passwordHash,
        role: user.email === "ignacio@taskflow.local" ? "admin" : "user"
      }
    });
    await Profile.findOrCreate({
      where: { userId: user.id },
      defaults: {
        userId: user.id,
        bio: `Perfil de demostración de ${user.name}`
      }
    });
  }

  for (const taskData of sampleTasks) {
    const owner = usersByEmail.get(taskData.ownerEmail);
    const { ownerEmail, ...taskDefaults } = taskData;
    await Task.findOrCreate({
      where: { title: taskData.title, userId: owner.id },
      defaults: { ...taskDefaults, userId: owner.id }
    });
  }

  const owner = usersByEmail.get("ignacio@taskflow.local");
  const [project] = await Project.findOrCreate({
    where: { name: "Entrega integradora TaskFlow", ownerId: owner.id },
    defaults: {
      name: "Entrega integradora TaskFlow",
      description: "Proyecto colaborativo para evidenciar la relación muchos a muchos.",
      ownerId: owner.id
    }
  });
  for (const user of usersByEmail.values()) {
    await ProjectMember.findOrCreate({
      where: { projectId: project.id, userId: user.id },
      defaults: { projectId: project.id, userId: user.id }
    });
  }
};

const setupDatabase = async () => {
  await sequelize.sync();
  await seedDatabase();
};

module.exports = { seedDatabase, setupDatabase };
