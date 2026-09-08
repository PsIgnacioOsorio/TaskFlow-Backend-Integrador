const { saveAvatar } = require("../services/upload.service");
const { sendSuccess } = require("../utils/apiResponse.util");

const postUpload = async (req, res) => {
  const upload = await saveAvatar(req.auth.userId, req.file);
  return sendSuccess(res, 201, "Avatar almacenado y asociado al usuario", upload);
};

module.exports = { postUpload };
