const express = require("express");
const authRoutes = require("./auth.routes");
const userRoutes = require("./apiUser.routes");
const taskRoutes = require("./apiTask.routes");
const projectRoutes = require("./project.routes");
const uploadRoutes = require("./upload.routes");
const { authenticateToken } = require("../middlewares/auth.middleware");
const { sendSuccess } = require("../utils/apiResponse.util");

const router = express.Router();

router.get("/status", (req, res) => sendSuccess(res, 200, "API disponible", {
  apiVersion: "v1",
  module: 8,
  persistence: "postgresql",
  authentication: "jwt"
}));
router.use("/auth", authRoutes);
router.use("/users", authenticateToken, userRoutes);
router.use("/tasks", authenticateToken, taskRoutes);
router.use("/projects", authenticateToken, projectRoutes);
router.use("/upload", authenticateToken, uploadRoutes);

module.exports = router;
