const { parseCsv } = require("../services/csv.service");
const { extractCrmRecords } = require("../services/ai.service");
const { createJob, getJob, updateJob } = require("../services/jobStore");

/**
 * POST /api/import
 * Accepts a CSV file, parses it, and kicks off async AI extraction.
 * Returns immediately with a jobId so the frontend can poll progress
 * instead of holding one long blocking request open.
 */
async function startImport(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: "No file uploaded" });
    }

    const csvContent = req.file.buffer.toString("utf-8");
    const rows = parseCsv(csvContent);

    if (rows.length === 0) {
      return res.status(400).json({ success: false, error: "CSV file has no data rows" });
    }

    const jobId = createJob();
    const batchSize = parseInt(process.env.AI_BATCH_SIZE || "15", 10);
    updateJob(jobId, { totalBatches: Math.ceil(rows.length / batchSize) });

    // Fire and forget: extraction runs in the background, client polls for progress.
    extractCrmRecords(rows, ({ completedBatches, totalBatches }) => {
      updateJob(jobId, { completedBatches, totalBatches });
    })
      .then((result) => {
        updateJob(jobId, { status: "done", result });
      })
      .catch((err) => {
        updateJob(jobId, { status: "error", error: err.message });
      });

    res.status(202).json({ success: true, jobId });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/import/:jobId/status
 * Lightweight poll endpoint for progress + final result.
 */
function getImportStatus(req, res) {
  const job = getJob(req.params.jobId);
  if (!job) {
    return res.status(404).json({ success: false, error: "Job not found" });
  }

  res.json({
    success: true,
    status: job.status,
    completedBatches: job.completedBatches,
    totalBatches: job.totalBatches,
    result: job.status === "done" ? job.result : null,
    error: job.status === "error" ? job.error : null,
  });
}

module.exports = { startImport, getImportStatus };
