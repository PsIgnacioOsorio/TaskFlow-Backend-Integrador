const multer = require("multer");
const { createHttpError } = require("../utils/httpError.util");

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const maxFileSize = Math.min(
  Math.max(Number(process.env.UPLOAD_MAX_BYTES) || 2 * 1024 * 1024, 1024),
  5 * 1024 * 1024
);

const uploadAvatar = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maxFileSize, files: 1 },
  fileFilter: (req, file, callback) => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      return callback(createHttpError(415, "Solo se permiten imágenes JPEG, PNG o WEBP"));
    }
    callback(null, true);
  }
}).single("file");

module.exports = { ALLOWED_IMAGE_TYPES, maxFileSize, uploadAvatar };
