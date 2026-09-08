require("dotenv").config({ quiet: true });

const { closeDatabase, connectDatabase } = require("../config/database");
const { Credential, Profile, Project, ProjectMember, Task, User } = require("../models");

const run = async () => {
  try {
    await connectDatabase();
    const [users, credentials, profiles, tasks, projects, memberships] = await Promise.all([
      User.count(),
      Credential.count(),
      Profile.count(),
      Task.count(),
      Project.count(),
      ProjectMember.count()
    ]);
    console.log(`Usuarios almacenados: ${users}`);
    console.log(`Credenciales protegidas: ${credentials}`);
    console.log(`Perfiles disponibles: ${profiles}`);
    console.log(`Tareas almacenadas: ${tasks}`);
    console.log(`Proyectos almacenados: ${projects}`);
    console.log(`Membresías N:M: ${memberships}`);
  } catch (error) {
    console.error(`Comprobación fallida: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await closeDatabase();
  }
};

run();
