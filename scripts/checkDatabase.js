require("dotenv").config({ quiet: true });

const { closeDatabase, connectDatabase } = require("../config/database");
const { Task, User } = require("../models");

const run = async () => {
  try {
    await connectDatabase();
    const [users, tasks] = await Promise.all([User.count(), Task.count()]);
    console.log(`Usuarios almacenados: ${users}`);
    console.log(`Tareas almacenadas: ${tasks}`);
  } catch (error) {
    console.error(`Comprobación fallida: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await closeDatabase();
  }
};

run();
