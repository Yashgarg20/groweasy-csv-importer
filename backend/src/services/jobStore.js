const { randomUUID } = require("crypto");

// Simple in-memory store. Fine for a single-instance stateless demo app;
// swap for Redis/DB if running multiple backend instances in production.
const jobs = new Map();

function createJob() {
  const id = randomUUID();
  jobs.set(id, {
    id,
    status: "processing", // "processing" | "done" | "error"
    completedBatches: 0,
    totalBatches: 0,
    result: null,
    error: null,
    createdAt: Date.now(),
  });
  return id;
}

function getJob(id) {
  return jobs.get(id);
}

function updateJob(id, patch) {
  const job = jobs.get(id);
  if (!job) return;
  Object.assign(job, patch);
}

// Basic cleanup so memory doesn't grow unbounded in a long-running process.
setInterval(() => {
  const ONE_HOUR = 60 * 60 * 1000;
  for (const [id, job] of jobs) {
    if (Date.now() - job.createdAt > ONE_HOUR) jobs.delete(id);
  }
}, 15 * 60 * 1000).unref();

module.exports = { createJob, getJob, updateJob };
