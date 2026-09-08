require("dotenv").config({ quiet: true });

const { closeDatabase, connectDatabase } = require("../config/database");
const { setupDatabase } = require("../services/databaseSetup.service");

const run = async () => {
  try {
    await connectDatabase();
    await setupDatabase();
    console.log("Tablas y relaciones del Módulo 8 preparadas correctamente.");
    console.log("Datos iniciales: 3 usuarios, 3 tareas, perfiles, credenciales y 1 proyecto.");
    console.log("Acceso de demostración: ignacio@taskflow.local / SEED_USER_PASSWORD");
  } catch (error) {
    console.error(`No fue posible preparar la base de datos: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await closeDatabase();
  }
};

run();
