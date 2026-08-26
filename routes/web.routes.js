const express = require("express");
const {
  createTask,
  createUserFromForm,
  deleteTask,
  deleteUserFromForm,
  getHome,
  getStatus,
  getUsersPage,
  moveTaskForward
} = require("../controllers/web.controller");

const router = express.Router();

router.get("/", getHome);
router.get("/status", getStatus);
router.get("/users", getUsersPage);
router.post("/users", createUserFromForm);
router.post("/users/:id/delete", deleteUserFromForm);
router.post("/tasks", createTask);
router.post("/tasks/:id/advance", moveTaskForward);
router.post("/tasks/:id/delete", deleteTask);

module.exports = router;
