import type { ImportStatusResponse, StartImportResponse } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

export async function uploadCsv(file: File): Promise<StartImportResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE}/api/import`, {
    method: "POST",
    body: formData,
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || "Failed to start import");
  }
  return data;
}

export async function fetchImportStatus(jobId: string): Promise<ImportStatusResponse> {
  const res = await fetch(`${API_BASE}/api/import/${jobId}/status`);
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || "Failed to fetch import status");
  }
  return data;
}

/**
 * Polls the backend until the job is done or errors, invoking onProgress
 * on every tick so the UI can show a live batch counter.
 */
export function pollImportStatus(
  jobId: string,
  onProgress: (status: ImportStatusResponse) => void,
  intervalMs = 1200
): () => void {
  let cancelled = false;

  const tick = async () => {
    if (cancelled) return;
    try {
      const status = await fetchImportStatus(jobId);
      onProgress(status);
      if (status.status === "processing" && !cancelled) {
        setTimeout(tick, intervalMs);
      }
    } catch (err) {
      if (!cancelled) {
        onProgress({
          success: false,
          status: "error",
          completedBatches: 0,
          totalBatches: 0,
          result: null,
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }
  };

  tick();
  return () => {
    cancelled = true;
  };
}
