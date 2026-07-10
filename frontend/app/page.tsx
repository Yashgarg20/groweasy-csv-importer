"use client";

import { useCallback, useRef, useState } from "react";
import Papa from "papaparse";
import UploadZone from "@/components/UploadZone";
import PreviewTable from "@/components/PreviewTable";
import ProgressPanel from "@/components/ProgressPanel";
import ResultsTable from "@/components/ResultsTable";
import ThemeToggle from "@/components/ThemeToggle";
import { uploadCsv, pollImportStatus } from "@/lib/api";
import type { ImportResult } from "@/lib/types";

type Step = "upload" | "preview" | "processing" | "done";

export default function HomePage() {
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [previewRows, setPreviewRows] = useState<Record<string, string>[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [progress, setProgress] = useState({ completedBatches: 0, totalBatches: 0 });
  const [result, setResult] = useState<ImportResult | null>(null);
  const cancelPollRef = useRef<(() => void) | null>(null);

  const handleFileSelected = useCallback((selected: File) => {
    setUploadError(null);
    Papa.parse<Record<string, string>>(selected, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (!results.data.length) {
          setUploadError("This CSV appears to have no data rows.");
          return;
        }
        setFile(selected);
        setHeaders(results.meta.fields || []);
        setPreviewRows(results.data);
        setStep("preview");
      },
      error: (err) => setUploadError(`Could not parse CSV: ${err.message}`),
    });
  }, []);

  const handleConfirmImport = useCallback(async () => {
    if (!file) return;
    setStep("processing");
    setProcessingError(null);
    setProgress({ completedBatches: 0, totalBatches: 0 });

    try {
      const { jobId } = await uploadCsv(file);
      cancelPollRef.current = pollImportStatus(jobId, (status) => {
        setProgress({
          completedBatches: status.completedBatches,
          totalBatches: status.totalBatches,
        });
        if (status.status === "done" && status.result) {
          setResult(status.result);
          setStep("done");
        } else if (status.status === "error") {
          setProcessingError(status.error || "AI extraction failed");
          setStep("preview");
        }
      });
    } catch (err) {
      setProcessingError(err instanceof Error ? err.message : "Failed to start import");
      setStep("preview");
    }
  }, [file]);

  function reset() {
    cancelPollRef.current?.();
    setStep("upload");
    setFile(null);
    setHeaders([]);
    setPreviewRows([]);
    setResult(null);
    setUploadError(null);
    setProcessingError(null);
  }

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <header className="mb-8 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-signal-600 dark:text-signal-500">
              GrowEasy CRM
            </p>
            <h1 className="font-display mt-1 text-2xl font-bold text-ink-900 dark:text-ink-50 sm:text-3xl">
              Lead Importer
            </h1>
            <p className="mt-2 max-w-xl text-sm text-ink-500 dark:text-ink-400">
              Upload a CSV from any source — Facebook, Google Ads, Excel, another CRM,
              or a hand-built spreadsheet. The AI figures out the column mapping for you.
            </p>
          </div>
          <ThemeToggle />
        </header>

        <ol className="mb-8 flex flex-wrap gap-x-6 gap-y-2 text-xs font-medium text-ink-400">
          {(["upload", "preview", "processing", "done"] as Step[]).map((s, i) => {
            const isActive = step === s;
            const isPast =
              (["upload", "preview", "processing", "done"] as Step[]).indexOf(step) > i;
            return (
              <li
                key={s}
                className={`flex items-center gap-1.5 ${
                  isActive
                    ? "text-signal-600 dark:text-signal-500"
                    : isPast
                    ? "text-ink-600 dark:text-ink-300"
                    : ""
                }`}
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                    isActive
                      ? "bg-signal-500 text-white"
                      : isPast
                      ? "bg-ink-300 dark:bg-ink-600 text-white"
                      : "bg-ink-100 dark:bg-ink-800"
                  }`}
                >
                  {i + 1}
                </span>
                {s === "upload" && "Upload"}
                {s === "preview" && "Preview"}
                {s === "processing" && "AI mapping"}
                {s === "done" && "Result"}
              </li>
            );
          })}
        </ol>

        {step === "upload" && (
          <UploadZone onFileSelected={handleFileSelected} error={uploadError} />
        )}

        {step === "preview" && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-ink-500 dark:text-ink-400">
                <span className="font-medium text-ink-800 dark:text-ink-100">{file?.name}</span>{" "}
                · {previewRows.length} rows detected
              </p>
              <div className="flex gap-2">
                <button
                  onClick={reset}
                  className="rounded-full border border-ink-200 dark:border-ink-700 px-4 py-2 text-sm font-medium text-ink-600 dark:text-ink-300 hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors"
                >
                  Choose a different file
                </button>
                <button
                  onClick={handleConfirmImport}
                  className="rounded-full bg-signal-500 px-5 py-2 text-sm font-medium text-white hover:bg-signal-600 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal-500"
                >
                  Confirm import
                </button>
              </div>
            </div>
            {processingError && (
              <p className="text-sm font-medium text-red-600 dark:text-red-400">
                {processingError}
              </p>
            )}
            <PreviewTable headers={headers} rows={previewRows} />
          </div>
        )}

        {step === "processing" && (
          <ProgressPanel
            completedBatches={progress.completedBatches}
            totalBatches={progress.totalBatches}
          />
        )}

        {step === "done" && result && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-ink-500 dark:text-ink-400">
                Import complete for <span className="font-medium text-ink-800 dark:text-ink-100">{file?.name}</span>
              </p>
              <button
                onClick={reset}
                className="rounded-full border border-ink-200 dark:border-ink-700 px-4 py-2 text-sm font-medium text-ink-600 dark:text-ink-300 hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors"
              >
                Import another CSV
              </button>
            </div>
            <ResultsTable result={result} />
          </div>
        )}
      </div>
    </main>
  );
}
