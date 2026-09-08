const express = require("express");
const { body, param } = require("express-validator");
const {
  getProjectById,
  getProjects,
  postMember,
  postProject,
  putProject,
  removeProject
} = require("../controllers/project.controller");
const { validateRequest } = require("../middlewares/validation.middleware");

const router = express.Router();
const idRule = param("id").isInt({ min: 1 }).withMessage("ID de proyecto no válido");
const projectFields = [
  body("name").optional().isString().trim().isLength({ min: 2, max: 80 }),
  body("description").optional().isString().trim().isLength({ max: 240 })
];

router.get("/", getProjects);
router.get("/:id", idRule, validateRequest, getProjectById);
router.post(
  "/",
  [body("name").isString().trim().isLength({ min: 2, max: 80 }), projectFields[1]],
  validateRequest,
  postProject
);
router.put("/:id", [idRule, ...projectFields], validateRequest, putProject);
router.post(
  "/:id/members",
  [idRule, body("userId").isInt({ min: 1 })],
  validateRequest,
  postMember
);
router.delete("/:id", idRule, validateRequest, removeProject);

module.exports = router;
