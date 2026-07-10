"use client";

import { X } from "lucide-react";
import type { CrmRecord } from "@/lib/types";
import StatusPill from "./StatusPill";

interface Props {
  lead: CrmRecord;
  onClose: () => void;
}

const FIELD_LABELS: Record<keyof CrmRecord, string> = {
  created_at: "Created at",
  name: "Name",
  email: "Email",
  country_code: "Country code",
  mobile_without_country_code: "Mobile",
  company: "Company",
  city: "City",
  state: "State",
  country: "Country",
  lead_owner: "Lead owner",
  crm_status: "Status",
  crm_note: "Notes",
  data_source: "Data source",
  possession_time: "Possession time",
  description: "Description",
};

export default function LeadDetailModal({ lead, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/40 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-ink-900 shadow-2xl">
        <div className="flex items-start justify-between border-b border-ink-100 dark:border-ink-800 px-6 py-5">
          <div>
            <h2 className="font-display text-lg font-bold text-ink-900 dark:text-ink-50">
              {lead.name || "Lead details"}
            </h2>
            <div className="mt-1.5">
              <StatusPill status={lead.crm_status} />
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-ink-300 hover:bg-ink-100 dark:hover:bg-ink-800 hover:text-ink-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[70vh] space-y-3 overflow-y-auto px-6 py-5">
          {(Object.keys(FIELD_LABELS) as (keyof CrmRecord)[])
            .filter((key) => key !== "crm_status" && key !== "name")
            .map((key) => (
              <div key={key} className="grid grid-cols-3 gap-3 border-b border-ink-50 dark:border-ink-800 pb-2.5">
                <p className="text-xs font-medium uppercase tracking-wide text-ink-400">
                  {FIELD_LABELS[key]}
                </p>
                <p className="col-span-2 text-sm text-ink-700 dark:text-ink-200 whitespace-pre-wrap break-words">
                  {lead[key] || <span className="text-ink-300 dark:text-ink-600">—</span>}
                </p>
              </div>
            ))}
        </div>

        <div className="flex justify-end border-t border-ink-100 dark:border-ink-800 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-ink-200 dark:border-ink-700 px-4 py-2 text-sm font-medium text-ink-600 dark:text-ink-300 hover:bg-ink-50 dark:hover:bg-ink-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}