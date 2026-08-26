const { Pool } = require("pg");
const { Sequelize } = require("sequelize");

const readBoolean = (value, fallback = false) => {
  if (value === undefined) return fallback;
  return String(value).toLowerCase() === "true";
};

const databaseConfig = {
  host: process.env.DB_HOST?.trim() || "localhost",
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME?.trim() || "taskflow_db",
  username: process.env.DB_USER?.trim() || "taskflow_user",
  password: process.env.DB_PASSWORD || "",
  ssl: readBoolean(process.env.DB_SSL),
  logging: readBoolean(process.env.DB_LOGGING)
};

const sslOptions = databaseConfig.ssl
  ? { require: true, rejectUnauthorized: false }
  : false;

const sequelize = new Sequelize(
  databaseConfig.database,
  databaseConfig.username,
  databaseConfig.password,
  {
    host: databaseConfig.host,
    port: databaseConfig.port,
    dialect: "postgres",
    logging: databaseConfig.logging ? console.log : false,
    dialectOptions: databaseConfig.ssl ? { ssl: sslOptions } : {},
    define: {
      underscored: true,
      freezeTableName: true
    }
  }
);

// Pool de pg utilizado solamente para demostrar la consulta SQL directa
// solicitada por la pauta y compararla con el resultado de Sequelize.
const sqlPool = new Pool({
  host: databaseConfig.host,
  port: databaseConfig.port,
  database: databaseConfig.database,
  user: databaseConfig.username,
  password: databaseConfig.password,
  ssl: sslOptions
});

const assertDatabaseEnvironment = () => {
  const requiredVariables = ["DB_NAME", "DB_USER", "DB_PASSWORD"];
  const missingVariables = requiredVariables.filter((name) => !process.env[name]);

  if (missingVariables.length > 0) {
    const error = new Error(
      `Faltan variables de base de datos: ${missingVariables.join(", ")}`
    );
    error.code = "DATABASE_CONFIG_ERROR";
    throw error;
  }
};

const connectDatabase = async () => {
  assertDatabaseEnvironment();
  await sequelize.authenticate();
  console.log(
    `Base de datos conectada: ${databaseConfig.database} en ${databaseConfig.host}:${databaseConfig.port}`
  );
};

const closeDatabase = async () => {
  await Promise.allSettled([sequelize.close(), sqlPool.end()]);
};

module.exports = {
  closeDatabase,
  connectDatabase,
  databaseConfig,
  sequelize,
  sqlPool
};
