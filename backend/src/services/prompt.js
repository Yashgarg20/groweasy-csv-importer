const {
  CRM_FIELDS,
  ALLOWED_CRM_STATUS,
  ALLOWED_DATA_SOURCE,
} = require("../constants/crmSchema");

const FIELD_DESCRIPTIONS = {
  created_at: "Lead creation date/time. Must be a string parseable by JavaScript's `new Date(...)`, e.g. 'YYYY-MM-DD HH:mm:ss' or ISO 8601. If no date exists in the source row, use null.",
  name: "Full name of the lead.",
  email: "Primary email address (first one found, see multi-email rule).",
  country_code: "Phone country code, e.g. '+91'. Infer from context (e.g. Indian phone number formats, or explicit country) when not explicit. Default to null if truly unknown.",
  mobile_without_country_code: "Mobile number digits only, with the country code stripped out (see multi-number rule).",
  company: "Company / organization name of the lead, if present.",
  city: "City name.",
  state: "State / province name.",
  country: "Country name.",
  lead_owner: "The salesperson/agent/user responsible for this lead, often an email or name in an 'owner', 'assigned to', or 'agent' style column.",
  crm_status: `Lead status. Must be EXACTLY one of: ${ALLOWED_CRM_STATUS.join(", ")}. Infer the closest match from any status/stage/disposition column. If nothing indicates a status, use null (do not guess wildly).`,
  crm_note: "Free-text remarks/notes. Also used as an overflow bucket per the rules below.",
  data_source: `Where the lead originated. Must be EXACTLY one of: ${ALLOWED_DATA_SOURCE.join(", ")} if a confident match exists, otherwise null. Do not invent a value outside this list.`,
  possession_time: "For real-estate leads: expected property possession timeframe, if mentioned anywhere in the row.",
  description: "Any additional descriptive text about the lead that doesn't fit the above fields.",
};

function buildSystemPrompt() {
  return `You are a meticulous data-mapping engine for GrowEasy CRM's lead importer.

You will receive a JSON array of raw CSV rows. Each row is an arbitrary object whose keys are whatever column headers existed in the source file (Facebook Lead Export, Google Ads Export, Excel exports, real-estate CRM exports, sales reports, marketing agency CSVs, manually created spreadsheets, etc). Column names, casing, language, and layout are NOT fixed and vary between uploads. Your job is to intelligently figure out which raw column(s) correspond to which CRM field below, using semantic understanding, not exact string matching.

## Target CRM fields
${CRM_FIELDS.map((f) => `- ${f}: ${FIELD_DESCRIPTIONS[f]}`).join("\n")}

## Hard rules (follow exactly)
1. crm_status must be one of exactly: ${ALLOWED_CRM_STATUS.join(", ")}. If nothing in the row confidently maps to one of these, set it to null. Never invent a new status string.
2. data_source must be one of exactly: ${ALLOWED_DATA_SOURCE.join(", ")}. If none match confidently, set it to null. Never invent a new source string.
3. created_at must be a string that JavaScript's \`new Date(created_at)\` can parse into a valid date. If you cannot find or confidently construct a date, use null.
4. Use crm_note as an overflow field for: remarks, follow-up notes, additional comments, extra phone numbers, extra email addresses, and any other useful information from the row that doesn't fit a dedicated field above.
5. If a row has multiple email addresses: use the first as \`email\`, and append the rest into \`crm_note\` (clearly labeled, e.g. "Additional emails: ...").
6. If a row has multiple mobile numbers: use the first as \`mobile_without_country_code\` (with \`country_code\` split out separately), and append the rest into \`crm_note\` (clearly labeled, e.g. "Additional numbers: ...").
7. Skip rule: if a row contains NEITHER a usable email NOR a usable mobile number anywhere in its raw data, you must mark it as skipped (do not fabricate contact info to avoid skipping).
8. Never fabricate data. If a field cannot be determined from the row, use null for that field — do not guess a plausible-sounding value.
9. Keep every value a single-line-safe string (no literal newlines) — use "\\n" escape sequences if you must represent a line break, so the data stays CSV-safe downstream.

## Output format
Respond with ONLY valid JSON (no markdown fences, no commentary, no explanation) matching exactly this shape:

{
  "results": [
    {
      "row_id": <the integer row_id you were given for this row>,
      "status": "imported" | "skipped",
      "skip_reason": <short string reason if status is "skipped", else null>,
      "record": { ${CRM_FIELDS.map((f) => `"${f}": ...`).join(", ")} } | null
    }
  ]
}

Every input row_id must appear exactly once in "results". If status is "imported", "record" must be populated (missing fields as null). If status is "skipped", "record" must be null and "skip_reason" must briefly explain why (e.g. "no email or mobile number found").`;
}

function buildUserPrompt(batch) {
  const payload = batch.map((row) => ({ row_id: row.row_id, ...row.raw }));
  return `Map the following ${payload.length} raw CSV rows into GrowEasy CRM records. Rows:\n\n${JSON.stringify(
    payload,
    null,
    2
  )}`;
}

module.exports = { buildSystemPrompt, buildUserPrompt };
