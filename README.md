**Live app:** https://groweasy-csv-importer-xi-blush.vercel.app
**Backend API:** https://groweasy-csv-importer-quxr.onrender.com
**Position applied for:Intern
# GrowEasy AI CSV Lead Importer

Upload a CSV from *any* source — Facebook Lead Ads, Google Ads, Excel exports, another CRM, a marketing agency's spreadsheet, or a hand-built sheet — and have AI intelligently map it into the GrowEasy CRM lead format, regardless of column names or layout.

## How it works

1. **Upload** — drag & drop or pick a CSV file. Nothing is sent to the server yet.
2. **Preview** — the file is parsed entirely in the browser and shown in a scrollable, sticky-header table so you can sanity-check it before committing.
3. **Confirm import** — only now does the file get uploaded to the backend.
4. **AI mapping** — the backend chunks rows into batches and sends each batch to Claude (or any LLM you configure) with a detailed field-mapping prompt. Progress is polled and shown live.
5. **Result** — a results screen shows every successfully mapped record plus every skipped row with the reason it was skipped (e.g. "no email or mobile number found").

## Architecture

```
groweasy-csv-importer/
├── backend/           Node.js + Express API
│   └── src/
│       ├── constants/crmSchema.js     canonical CRM field list + allowed enums
│       ├── services/csv.service.js    CSV → row objects (any column layout)
│       ├── services/prompt.js         system/user prompt builder for the LLM
│       ├── services/ai.service.js     batching + AI call + retry/backoff
│       ├── services/jobStore.js       in-memory async job tracking (for progress polling)
│       ├── controllers/import.controller.js
│       ├── routes/import.routes.js
│       └── server.js
└── frontend/          Next.js (App Router) + TypeScript + Tailwind
    ├── app/page.tsx                   4-step upload → preview → processing → result flow
    ├── components/UploadZone.tsx      drag & drop + file picker
    ├── components/PreviewTable.tsx    raw CSV preview (client-side parse only)
    ├── components/ProgressPanel.tsx   live batch progress bar
    ├── components/ResultsTable.tsx    imported / skipped tabs
    └── lib/api.ts                     upload + polling client
```

**Why an async job + polling instead of one long request?** AI extraction over many batches can take a while. The backend returns a `jobId` immediately, processes batches in the background, and the frontend polls `/api/import/:jobId/status` every ~1.2s — this is what powers the real (not fake) progress bar, and avoids a single request timing out on large files.

## Setup

### 1. Backend

```bash
cd backend
cp .env.example .env
# edit .env and set GEMINI_API_KEY (free, no credit card: https://aistudio.google.com/apikey)
npm install
npm run dev   # or: npm start
```
Runs on `http://localhost:4000` by default.

### 2. Frontend

```bash
cd frontend
cp .env.example .env.local   # defaults already point at localhost:4000
npm install
npm run dev
```
Runs on `http://localhost:3000`.

Open `http://localhost:3000`, upload a CSV, and go through the flow.

### 3. Docker (optional)

```bash
export GEMINI_API_KEY=your_key_here
docker compose up --build
```

## Using a different LLM provider

The AI call is isolated in `backend/src/services/ai.service.js` (`callModelOnce`). This project defaults to **Google Gemini** (`gemini-2.5-flash`), which has a genuinely free tier — no credit card needed, just a Google account. To swap it for Claude or OpenAI instead, replace the body of that function with the equivalent SDK call — the batching, retry, JSON-extraction, and row-reconciliation logic around it doesn't need to change, since it's provider-agnostic (it just expects a `{ results: [...] }` JSON payload back).

## AI mapping rules (encoded in `services/prompt.js`)

- `crm_status` is constrained to exactly one of `GOOD_LEAD_FOLLOW_UP`, `DID_NOT_CONNECT`, `BAD_LEAD`, `SALE_DONE` (or `null`).
- `data_source` is constrained to exactly one of `leads_on_demand`, `meridian_tower`, `eden_park`, `varah_swamy`, `sarjapur_plots` (or `null`).
- `created_at` must be parseable by `new Date(...)`.
- Multiple emails/phone numbers: first one wins the dedicated field, the rest are appended into `crm_note`.
- Rows with neither an email nor a mobile number anywhere are skipped, with the reason surfaced in the UI — never silently dropped.
- The model is told never to fabricate a value; anything it can't confidently determine is `null`.

## Resilience

- Each batch is retried up to `AI_MAX_RETRIES` times (exponential backoff) if the model call fails or returns malformed JSON.
- If a batch still fails after all retries, those rows are marked **skipped** with the underlying error as the reason, rather than crashing the whole import.
- File upload is restricted to CSV, capped at 15MB, with centralized error handling for both.

## Configuration

| Variable | Where | Default | Purpose |
|---|---|---|---|
| `GEMINI_API_KEY` | backend `.env` | — (required) | Google AI Studio API key (free tier) |
| `GEMINI_MODEL` | backend `.env` | `gemini-2.5-flash` | Model used for extraction |
| `AI_BATCH_SIZE` | backend `.env` | `15` | Rows sent to the AI per request |
| `AI_MAX_RETRIES` | backend `.env` | `3` | Retry attempts per failed batch |
| `NEXT_PUBLIC_API_BASE_URL` | frontend `.env.local` | `http://localhost:4000` | Backend URL the UI calls |

## Notes / assumptions

- No database is used — the app is stateless per the assignment's "optional" note; job progress lives in memory for the life of the process, which is sufficient for a single-instance demo/evaluation deployment.
- Dark mode preference is stored in the browser's `localStorage` (this is a normal deployed web app running in the user's own browser, not a sandboxed preview, so `localStorage` is appropriate here).
