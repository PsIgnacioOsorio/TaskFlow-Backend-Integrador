require("dotenv").config({ quiet: true });

const { closeDatabase, connectDatabase } = require("../config/database");
const { setupDatabase } = require("../services/databaseSetup.service");

const run = async () => {
  try {
    await connectDatabase();
    await setupDatabase();
    console.log("Tablas users y tasks preparadas correctamente.");
    console.log("Datos iniciales disponibles: 3 usuarios y 3 tareas.");
  } catch (error) {
    console.error(`No fue posible preparar la base de datos: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await closeDatabase();
  }
};

run();
