const express = require("express");
const {
  createTask,
  deleteTask,
  getHome,
  getStatus,
  getTasks,
  moveTaskForward
} = require("../controllers/web.controller");

// Router separa las URL de la configuración general de app.js.
const router = express.Router();

router.get("/", getHome);
router.get("/status", getStatus);
router.get("/api/tasks", getTasks);
router.post("/tasks", createTask);
router.post("/tasks/:id/advance", moveTaskForward);
router.post("/tasks/:id/delete", deleteTask);

module.exports = router;
