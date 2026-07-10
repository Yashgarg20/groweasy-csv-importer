"use client";

import { useCallback, useRef, useState } from "react";
import Papa from "papaparse";
import { X, UploadCloud, FileText, Download, Loader2, CheckCircle2 } from "lucide-react";
import { uploadCsv, pollImportStatus } from "@/lib/api";
import type { ImportResult } from "@/lib/types";
import { CRM_FIELDS } from "@/lib/types";

type Step = "select" | "preview" | "processing" | "summary";

interface Props {
  onClose: () => void;
  onImported: (result: ImportResult) => void;
}

function downloadSampleTemplate() {
  const headerRow = CRM_FIELDS.join(",");
  const exampleRow = [
    "2026-05-13 14:20:48",
    "John Doe",
    "john.doe@example.com",
    "+91",
    "9876543210",
    "GrowEasy",
    "Mumbai",
    "Maharashtra",
    "India",
    "owner@groweasy.ai",
    "GOOD_LEAD_FOLLOW_UP",
    "Client is asking to reschedule demo",
    "",
    "",
    "",
  ].join(",");
  const blob = new Blob([`${headerRow}\n${exampleRow}\n`], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "groweasy_sample_leads_template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export default function ImportModal({ onClose, onImported }: Props) {
  const [step, setStep] = useState<Step>("select");
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState({ completedBatches: 0, totalBatches: 0 });
  const [result, setResult] = useState<ImportResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    const selected = files[0];
    if (!selected.name.toLowerCase().endsWith(".csv")) {
      setError("Only .csv files are supported.");
      return;
    }
    if (selected.size > 5 * 1024 * 1024) {
      setError("File is too large — max 5MB.");
      return;
    }
    setError(null);
    Papa.parse<Record<string, string>>(selected, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (!results.data.length) {
          setError("This CSV appears to have no data rows.");
          return;
        }
        setFile(selected);
        setHeaders(results.meta.fields || []);
        setRows(results.data);
        setStep("preview");
      },
      error: (err) => setError(`Could not parse CSV: ${err.message}`),
    });
  }, []);

  async function handleUpload() {
    if (!file) return;
    setStep("processing");
    setProgress({ completedBatches: 0, totalBatches: 0 });
    try {
      const { jobId } = await uploadCsv(file);
      pollImportStatus(jobId, (status) => {
        setProgress({
          completedBatches: status.completedBatches,
          totalBatches: status.totalBatches,
        });
        if (status.status === "done" && status.result) {
          setResult(status.result);
          setStep("summary");
        } else if (status.status === "error") {
          setError(status.error || "AI extraction failed");
          setStep("preview");
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start import");
      setStep("preview");
    }
  }

  function handleDone() {
    if (result) onImported(result);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/40 px-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-ink-900 shadow-2xl">
        <div className="flex items-start justify-between border-b border-ink-100 dark:border-ink-800 px-6 py-5">
          <div>
            <h2 className="font-display text-lg font-bold text-ink-900 dark:text-ink-50">
              Import Leads via CSV
            </h2>
            <p className="mt-0.5 text-sm text-ink-400">
              Upload a CSV file to bulk import leads into your system.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-ink-300 hover:bg-ink-100 dark:hover:bg-ink-800 hover:text-ink-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[65vh] overflow-y-auto px-6 py-6">
          {step === "select" && (
            <div>
              <div
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  handleFiles(e.dataTransfer.files);
                }}
                role="button"
                tabIndex={0}
                className={`flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors ${
                  isDragging
                    ? "border-brand-500 bg-brand-50 dark:bg-brand-500/5"
                    : "border-ink-200 dark:border-ink-700 hover:border-ink-300"
                }`}
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-ink-100 dark:bg-ink-800">
                  <UploadCloud className="h-5 w-5 text-ink-500" />
                </div>
                <p className="font-display text-base font-semibold text-ink-800 dark:text-ink-100">
                  Drop your CSV file here
                </p>
                <p className="mt-1 text-sm text-ink-400">or click to browse files</p>

                <span className="mt-4 inline-block rounded-full border border-ink-200 dark:border-ink-700 px-3 py-1 text-xs text-ink-500">
                  Supported file: .csv (max 5MB)
                </span>

                <p className="mt-4 max-w-md text-xs leading-relaxed text-ink-400">
                  Any column layout works — our AI maps whatever headers your file has into
                  GrowEasy's lead fields. Template below shows the default + custom CRM fields to
                  reduce upload errors.
                </p>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    downloadSampleTemplate();
                  }}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-signal-500/30 bg-signal-500/5 px-3 py-1.5 text-xs font-medium text-signal-600 hover:bg-signal-500/10"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download Sample CSV Template
                </button>

                <input
                  ref={inputRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(e) => handleFiles(e.target.files)}
                />
              </div>
              {error && <p className="mt-3 text-sm font-medium text-red-600">{error}</p>}
            </div>
          )}

          {step === "preview" && file && (
            <div>
              <div className="mb-4 flex items-center justify-between rounded-lg border border-ink-200 dark:border-ink-700 px-3 py-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded bg-ink-100 dark:bg-ink-800">
                    <FileText className="h-4 w-4 text-ink-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-ink-800 dark:text-ink-100">
                      {file.name}
                    </p>
                    <p className="text-xs text-ink-400">{(file.size / 1024).toFixed(2)} KB</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setFile(null);
                    setStep("select");
                  }}
                  className="rounded-md p-1 text-ink-300 hover:bg-ink-100 dark:hover:bg-ink-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="ledger-scroll max-h-56 rounded-lg border border-ink-200 dark:border-ink-700">
                <table className="w-full text-xs">
                  <thead>
                    <tr>
                      {headers.map((h) => (
                        <th
                          key={h}
                          className="whitespace-nowrap bg-ink-50 dark:bg-ink-800 px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-ink-400"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 6).map((row, i) => (
                      <tr key={i} className="border-t border-ink-100 dark:border-ink-800">
                        {headers.map((h) => (
                          <td
                            key={h}
                            className="whitespace-nowrap px-3 py-1.5 text-ink-600 dark:text-ink-300 max-w-[140px] truncate"
                          >
                            {row[h] || "—"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-2 text-xs text-ink-400">
                Showing {Math.min(6, rows.length)} of {rows.length} rows · no AI processing yet
              </p>
              {error && <p className="mt-2 text-sm font-medium text-red-600">{error}</p>}
            </div>
          )}

          {step === "processing" && (
            <div className="flex flex-col items-center py-10 text-center">
              <Loader2 className="mb-4 h-8 w-8 animate-spin text-brand-500" />
              <p className="font-display text-base font-medium text-ink-800 dark:text-ink-100">
                Mapping your leads with AI…
              </p>
              <p className="mt-1 text-sm text-ink-400">
                {progress.totalBatches > 0
                  ? `Batch ${progress.completedBatches} of ${progress.totalBatches} processed`
                  : "Starting extraction…"}
              </p>
              <div className="mt-4 h-2 w-full max-w-xs overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
                <div
                  className="h-full rounded-full bg-brand-500 transition-all duration-500 ease-out"
                  style={{
                    width:
                      progress.totalBatches > 0
                        ? `${Math.round((progress.completedBatches / progress.totalBatches) * 100)}%`
                        : "15%",
                  }}
                />
              </div>
            </div>
          )}

          {step === "summary" && result && (
            <div>
              <div className="mb-5 flex flex-col items-center text-center">
                <CheckCircle2 className="mb-2 h-8 w-8 text-signal-500" />
                <p className="font-display text-base font-semibold text-ink-800 dark:text-ink-100">
                  Import complete
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-ink-200 dark:border-ink-700 p-4 text-center">
                  <p className="text-[11px] uppercase tracking-wide text-ink-400">
                    Total imported
                  </p>
                  <p className="mt-1 font-display text-2xl font-bold text-signal-600">
                    {result.totalImported}
                  </p>
                </div>
                <div className="rounded-lg border border-ink-200 dark:border-ink-700 p-4 text-center">
                  <p className="text-[11px] uppercase tracking-wide text-ink-400">
                    Total skipped
                  </p>
                  <p className="mt-1 font-display text-2xl font-bold text-amber-600">
                    {result.totalSkipped}
                  </p>
                </div>
              </div>

              {result.skipped.length > 0 && (
                <div className="mt-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">
                    Skipped rows
                  </p>
                  <div className="max-h-32 space-y-1.5 overflow-y-auto">
                    {result.skipped.map((s) => (
                      <div
                        key={s.row_id}
                        className="rounded-md bg-ink-50 dark:bg-ink-800/60 px-3 py-1.5 text-xs text-ink-500 dark:text-ink-400"
                      >
                        Row {s.row_id + 1}: {s.reason}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2.5 border-t border-ink-100 dark:border-ink-800 px-6 py-4">
          {step === "select" && (
            <button
              onClick={onClose}
              className="rounded-lg border border-ink-200 dark:border-ink-700 px-4 py-2 text-sm font-medium text-ink-600 dark:text-ink-300 hover:bg-ink-50 dark:hover:bg-ink-800"
            >
              Cancel
            </button>
          )}
          {step === "preview" && (
            <>
              <button
                onClick={onClose}
                className="rounded-lg border border-ink-200 dark:border-ink-700 px-4 py-2 text-sm font-medium text-ink-600 dark:text-ink-300 hover:bg-ink-50 dark:hover:bg-ink-800"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                className="rounded-lg bg-brand-500 px-5 py-2 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
              >
                Upload File
              </button>
            </>
          )}
          {step === "summary" && (
            <button
              onClick={handleDone}
              className="rounded-lg bg-brand-500 px-5 py-2 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
            >
              View leads
            </button>
          )}
        </div>
      </div>
    </div>
  );
}