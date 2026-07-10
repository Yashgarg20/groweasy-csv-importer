const { GoogleGenerativeAI } = require("@google/generative-ai");
const { buildSystemPrompt, buildUserPrompt } = require("./prompt");
const { chunk, sleep } = require("../utils/batch");
const { CRM_FIELDS } = require("../constants/crmSchema");

const BATCH_SIZE = parseInt(process.env.AI_BATCH_SIZE || "15", 10);
const MAX_RETRIES = parseInt(process.env.AI_MAX_RETRIES || "3", 10);
const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: MODEL,
  systemInstruction: buildSystemPrompt(),
});

/**
 * Extracts a JSON object out of a model response even if it accidentally
 * wraps it in markdown fences or adds stray whitespace/prose.
 */
function extractJson(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON object found in AI response");
  return JSON.parse(candidate.slice(start, end + 1));
}

function normalizeRecord(record) {
  const normalized = {};
  for (const field of CRM_FIELDS) {
    normalized[field] = record && record[field] !== undefined ? record[field] : null;
  }
  return normalized;
}

async function callModelOnce(batch) {
  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: buildUserPrompt(batch) }] }],
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0,
    },
  });

  const text = result.response.text();
  const parsed = extractJson(text);
  if (!parsed || !Array.isArray(parsed.results)) {
    throw new Error("AI response missing 'results' array");
  }
  return parsed.results;
}

/**
 * Runs one batch through the AI with retry/backoff. If every retry fails,
 * every row in the batch is marked skipped with an explanatory reason
 * rather than silently dropped.
 */
async function processBatchWithRetry(batch) {
  let lastError;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const results = await callModelOnce(batch);
      const byRowId = new Map(results.map((r) => [r.row_id, r]));

      return batch.map(({ row_id, raw }) => {
        const result = byRowId.get(row_id);
        if (!result) {
          return {
            row_id,
            raw,
            status: "skipped",
            skip_reason: "AI did not return a result for this row",
            record: null,
          };
        }
        if (result.status === "imported") {
          return {
            row_id,
            raw,
            status: "imported",
            skip_reason: null,
            record: normalizeRecord(result.record),
          };
        }
        return {
          row_id,
          raw,
          status: "skipped",
          skip_reason: result.skip_reason || "No email or mobile number found",
          record: null,
        };
      });
    } catch (err) {
      lastError = err;
      if (attempt < MAX_RETRIES) {
        await sleep(500 * 2 ** (attempt - 1)); // exponential backoff
      }
    }
  }

  // All retries exhausted: fail the whole batch gracefully instead of crashing the request.
  return batch.map(({ row_id, raw }) => ({
    row_id,
    raw,
    status: "skipped",
    skip_reason: `AI extraction failed after ${MAX_RETRIES} attempts: ${lastError?.message || "unknown error"}`,
    record: null,
  }));
}

/**
 * Processes all rows in batches, sequentially (keeps things simple and
 * within rate limits; easy to switch to Promise.all with a concurrency
 * limiter if higher throughput is needed).
 */
async function extractCrmRecords(rows, onProgress) {
  const batches = chunk(rows, BATCH_SIZE);
  const allResults = [];

  for (let i = 0; i < batches.length; i++) {
    const batchResults = await processBatchWithRetry(batches[i]);
    allResults.push(...batchResults);
    if (onProgress) {
      onProgress({ completedBatches: i + 1, totalBatches: batches.length });
    }
  }

  const imported = allResults.filter((r) => r.status === "imported");
  const skipped = allResults.filter((r) => r.status === "skipped");

  return {
    imported: imported.map((r) => r.record),
    skipped: skipped.map((r) => ({ row_id: r.row_id, raw: r.raw, reason: r.skip_reason })),
    totalImported: imported.length,
    totalSkipped: skipped.length,
  };
}

module.exports = { extractCrmRecords };
