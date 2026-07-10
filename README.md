# GrowEasy AI CSV Lead Importer

**Live app:** https://groweasy-csv-importer-xi-blush.vercel.app
**Backend API:** https://groweasy-csv-importer-quxr.onrender.com
**Position applied for:** Intern

Upload a CSV from *any* source — Facebook Lead Ads, Google Ads, Excel exports, another CRM, a marketing agency's spreadsheet, or a hand-built sheet — and have AI intelligently map it into the GrowEasy CRM lead format, regardless of column names or layout.

## How it works

The UI is modeled as a lead-management dashboard ("Manage Your Leads"), with import happening in a modal rather than a separate page:

1. **Import Leads via CSV** — click the button to open the import modal.
2. **Select a file** — drag & drop or browse. A sample CSV template is available to download from the modal. Nothing is sent to the server yet.
3. **Preview** — the file is parsed entirely in the browser and shown in a table so you can sanity-check it before committing. No AI processing happens at this stage.
4. **Upload File** — only now does the file get uploaded to the backend for AI processing, with a live progress bar (real batch progress, not simulated).
5. **Import summary** — the modal shows total imported / total skipped, plus the reason for every skipped row (e.g. "no email or mobile number found").
6. **View leads** — closing the modal drops the newly imported leads straight into the main leads table, with a searchable list, colored status pills, and a **More** button per row that opens a detail panel showing every CRM field, including `crm_note` (where overflow emails/phone numbers and remarks live).

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
    ├── app/page.tsx                     "Manage Your Leads" dashboard shell + state
    ├── components/Sidebar.tsx           GrowEasy-style nav shell
    ├── components/ImportModal.tsx       modal: select → preview → processing → summary
    ├── components/LeadsTable.tsx        searchable leads table with status pills
    ├── components/LeadDetailModal.tsx   "More" button — full record incl. crm_note
    ├── components/StatusPill.tsx        crm_status → colored pill + label
    ├── components/ThemeToggle.tsx       dark mode toggle
    └── lib/api.ts                       upload + polling client
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

The AI call is isolated in `backend/src/services/ai.service.js` (`callModelOnce`). This project defaults to **Google Gemini** (`gemini-3.5-flash`), which has a genuinely free tier — no credit card needed, just a Google account. Google retires Gemini model IDs on a rolling basis (often faster than their published shutdown dates), so if you hit a `404 ... no longer available` error, check [ai.google.dev/gemini-api/docs/models](https://ai.google.dev/gemini-api/docs/models) for the current model name and update `GEMINI_MODEL` in `.env`. To swap Gemini for Claude or OpenAI instead, replace the body of `callModelOnce` with the equivalent SDK call — the batching, retry, JSON-extraction, and row-reconciliation logic around it doesn't need to change, since it's provider-agnostic (it just expects a `{ results: [...] }` JSON payload back).

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
| `GEMINI_MODEL` | backend `.env` | `gemini-3.5-flash` | Model used for extraction — check [current model list](https://ai.google.dev/gemini-api/docs/models) if it 404s |
| `AI_BATCH_SIZE` | backend `.env` | `15` | Rows sent to the AI per request |
| `AI_MAX_RETRIES` | backend `.env` | `3` | Retry attempts per failed batch |
| `NEXT_PUBLIC_API_BASE_URL` | frontend `.env.local` | `http://localhost:4000` | Backend URL the UI calls |

## Notes / assumptions

- No database is used — the app is stateless per the assignment's "optional" note; job progress lives in memory for the life of the process, which is sufficient for a single-instance demo/evaluation deployment.
- Dark mode preference is stored in the browser's `localStorage` (this is a normal deployed web app running in the user's own browser, not a sandboxed preview, so `localStorage` is appropriate here).
- The sidebar mirrors GrowEasy's actual product navigation for visual context, but only **Manage Leads** (the CSV import + leads list) is implemented, since that's the only feature this assignment asked for. Every other nav item (Dashboard, Generate Leads, Lead Sources, etc.) is shown with a "Soon" badge and is intentionally non-interactive rather than a broken link.