const sendSuccess = (res, statusCode, message, data = null) => {
  return res.status(statusCode).json({ status: "ok", message, data });
};

module.exports = { sendSuccess };
