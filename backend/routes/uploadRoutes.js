const express = require("express");
const multer = require("multer");
const path = require("path");
const uploadController = require("../controllers/uploadController");

const router = express.Router();

const uploadDir = path.join(__dirname, "..", "uploads");
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safeName = `${Date.now()}-${file.originalname.replace(/\\s+/g, "_")}`;
    cb(null, safeName);
  },
});

const upload = multer({ storage });

router.post("/", upload.single("file"), uploadController.uploadFile);

module.exports = router;
