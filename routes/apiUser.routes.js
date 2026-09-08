const express = require("express");
const { body, param, query } = require("express-validator");
const {
  getUser,
  getUsers,
  putUser,
  removeUser
} = require("../controllers/apiUser.controller");
const {
  authorizeAdmin,
  authorizeSelfOrAdmin
} = require("../middlewares/auth.middleware");
const { validateRequest } = require("../middlewares/validation.middleware");

const router = express.Router();
const idRule = param("id").isInt({ min: 1 }).withMessage("ID de usuario no válido");

router.get(
  "/",
  [
    query("search").optional().isString().trim().isLength({ max: 120 }),
    query("active").optional().isBoolean()
  ],
  validateRequest,
  getUsers
);
router.get("/:id", idRule, validateRequest, authorizeSelfOrAdmin, getUser);
router.put(
  "/:id",
  [
    idRule,
    body("name").optional().isString().trim().isLength({ min: 2, max: 80 }),
    body("email").optional().isEmail().normalizeEmail().isLength({ max: 120 }),
    body("bio").optional().isString().trim().isLength({ max: 240 }),
    body("active").optional().isBoolean()
  ],
  validateRequest,
  authorizeSelfOrAdmin,
  putUser
);
router.delete("/:id", idRule, validateRequest, authorizeAdmin, removeUser);

module.exports = router;
