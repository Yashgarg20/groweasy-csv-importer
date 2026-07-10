const express = require("express");
const upload = require("../middleware/upload");
const { startImport, getImportStatus } = require("../controllers/import.controller");

const router = express.Router();

router.post("/", upload.single("file"), startImport);
router.get("/:jobId/status", getImportStatus);

module.exports = router;
