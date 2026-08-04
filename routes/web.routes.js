const express = require("express");
const { getHome, getStatus } = require("../controllers/web.controller");

// Router separa las URL de la configuración general de app.js.
const router = express.Router();

router.get("/", getHome);
router.get("/status", getStatus);

module.exports = router;
