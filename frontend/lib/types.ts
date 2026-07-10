export const CRM_FIELDS = [
  "created_at",
  "name",
  "email",
  "country_code",
  "mobile_without_country_code",
  "company",
  "city",
  "state",
  "country",
  "lead_owner",
  "crm_status",
  "crm_note",
  "data_source",
  "possession_time",
  "description",
] as const;

export type CrmField = (typeof CRM_FIELDS)[number];

export type CrmRecord = Record<CrmField, string | null>;

export type CrmStatus =
  | "GOOD_LEAD_FOLLOW_UP"
  | "DID_NOT_CONNECT"
  | "BAD_LEAD"
  | "SALE_DONE";

export interface SkippedRow {
  row_id: number;
  raw: Record<string, unknown>;
  reason: string;
}

export interface ImportResult {
  imported: CrmRecord[];
  skipped: SkippedRow[];
  totalImported: number;
  totalSkipped: number;
}

export interface StartImportResponse {
  success: boolean;
  jobId: string;
  error?: string;
}

export interface ImportStatusResponse {
  success: boolean;
  status: "processing" | "done" | "error";
  completedBatches: number;
  totalBatches: number;
  result: ImportResult | null;
  error: string | null;
}
