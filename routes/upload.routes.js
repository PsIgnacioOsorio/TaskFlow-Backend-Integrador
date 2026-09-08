const express = require("express");
const { postUpload } = require("../controllers/upload.controller");
const { uploadAvatar } = require("../middlewares/upload.middleware");

const router = express.Router();
router.post("/", uploadAvatar, postUpload);

module.exports = router;
