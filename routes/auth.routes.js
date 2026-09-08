const express = require("express");
const { body } = require("express-validator");
const { login, register } = require("../controllers/auth.controller");
const { validateRequest } = require("../middlewares/validation.middleware");

const router = express.Router();

router.post(
  "/register",
  [
    body("name").isString().trim().isLength({ min: 2, max: 80 }),
    body("email").isEmail().normalizeEmail().isLength({ max: 120 }),
    body("password").isString().isLength({ min: 8, max: 72 }),
    body("bio").optional().isString().trim().isLength({ max: 240 })
  ],
  validateRequest,
  register
);

router.post(
  "/login",
  [
    body("email").isEmail().normalizeEmail(),
    body("password").isString().notEmpty()
  ],
  validateRequest,
  login
);

module.exports = router;
