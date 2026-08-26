const express = require("express");
const {
  compareUserQueries,
  getTasks,
  getUserTasks,
  getUsers,
  getUsersSql,
  postTask,
  postUser,
  postUserTransaction,
  putTask,
  putUser,
  removeTaskById,
  removeUser
} = require("../controllers/data.controller");

const router = express.Router();

router.get("/usuarios/comparacion", compareUserQueries);
router.get("/usuarios/sql", getUsersSql);
router.get("/usuarios/:id/tareas", getUserTasks);
router.get("/usuarios", getUsers);
router.post("/usuarios", postUser);
router.put("/usuarios/:id", putUser);
router.delete("/usuarios/:id", removeUser);

router.get("/tareas", getTasks);
router.post("/tareas", postTask);
router.put("/tareas/:id", putTask);
router.delete("/tareas/:id", removeTaskById);

router.post("/transacciones/usuario-tarea", postUserTransaction);

// Conserva la ruta de lectura usada en el Módulo 6, ahora respaldada por PostgreSQL.
router.get("/api/tasks", getTasks);

module.exports = router;
