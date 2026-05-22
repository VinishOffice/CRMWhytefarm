const path = require("path");

const uploadFile = (req, res) => {
  if (!req.file) return res.status(400).json({ error: "file is required" });
  const url = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
  res.json({ url, path: path.resolve(req.file.path) });
};

module.exports = { uploadFile };
