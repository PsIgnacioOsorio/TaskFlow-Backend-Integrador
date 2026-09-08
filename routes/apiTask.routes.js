const express = require("express");
const { body, param, query } = require("express-validator");
const {
  deleteTask,
  getTask,
  getTasks,
  postTask,
  putTask
} = require("../controllers/apiTask.controller");
const { validateRequest } = require("../middlewares/validation.middleware");

const router = express.Router();
const idRule = param("id").isInt({ min: 1 }).withMessage("ID de tarea no válido");
const taskFields = [
  body("title").optional().isString().trim().isLength({ min: 2, max: 80 }),
  body("description").optional().isString().trim().isLength({ max: 240 }),
  body("status").optional().isIn(["pending", "in_progress", "completed"]),
  body("priority").optional().isIn(["low", "medium", "high"]),
  body("dueDate").optional({ values: "falsy" }).isISO8601({ strict: true }),
  body("userId").optional().isInt({ min: 1 })
];

router.get(
  "/",
  [
    query("status").optional().isIn(["all", "pending", "in_progress", "completed"]),
    query("search").optional().isString().trim().isLength({ max: 120 }),
    query("limit").optional().isInt({ min: 1, max: 100 })
  ],
  validateRequest,
  getTasks
);
router.get("/:id", idRule, validateRequest, getTask);
router.post(
  "/",
  [
    body("title").isString().trim().isLength({ min: 2, max: 80 }),
    ...taskFields.slice(1)
  ],
  validateRequest,
  postTask
);
router.put("/:id", [idRule, ...taskFields], validateRequest, putTask);
router.delete("/:id", idRule, validateRequest, deleteTask);

module.exports = router;
