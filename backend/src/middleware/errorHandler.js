// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error("[error]", err);

  if (err.message === "Only CSV files are accepted") {
    return res.status(400).json({ success: false, error: err.message });
  }
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ success: false, error: "File too large (max 15MB)" });
  }

  res.status(500).json({
    success: false,
    error: err.message || "Internal server error",
  });
}

module.exports = errorHandler;
