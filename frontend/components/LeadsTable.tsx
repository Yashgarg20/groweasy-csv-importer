"use client";

import { useMemo, useState } from "react";
import { Search, MoreHorizontal } from "lucide-react";
import type { CrmRecord } from "@/lib/types";
import StatusPill from "./StatusPill";

const PAGE_SIZE = 8;

interface Props {
    leads: CrmRecord[];
    onSelectLead: (lead: CrmRecord) => void;
}

function formatDate(value: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) +
    ", " +
    d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export default function LeadsTable({ leads, onSelectLead }: Props) {
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const filtered = useMemo(() => {
    if (!query.trim()) return leads;
    const q = query.toLowerCase();
    return leads.filter(
      (l) =>
        (l.email || "").toLowerCase().includes(q) ||
        (l.mobile_without_country_code || "").includes(q) ||
        (l.name || "").toLowerCase().includes(q)
    );
  }, [leads, query]);

  const visible = filtered.slice(0, visibleCount);

  if (leads.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 p-12 text-center">
        <p className="font-display text-base font-medium text-ink-700 dark:text-ink-200">
          No leads yet
        </p>
        <p className="mt-1 text-sm text-ink-400">
          Import a CSV to start populating your leads list.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setVisibleCount(PAGE_SIZE);
            }}
            placeholder="Enter email or phone number..."
            className="w-full rounded-lg border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 py-2 pl-9 pr-3 text-sm text-ink-700 dark:text-ink-200 placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 shadow-panel">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-200 dark:border-ink-700 bg-ink-50 dark:bg-ink-800/60">
              {["Lead name", "Email", "Contact", "Date created", "Company", "Status", ""].map(
                (h) => (
                  <th
                    key={h}
                    className="whitespace-nowrap px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-ink-400"
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {visible.map((lead, i) => (
              <tr
                key={i}
                className="border-b border-ink-100 dark:border-ink-800 last:border-0 hover:bg-ink-50/60 dark:hover:bg-ink-800/40"
              >
                <td className="whitespace-nowrap px-4 py-3 font-medium text-ink-800 dark:text-ink-100">
                  {lead.name || "—"}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-ink-500 dark:text-ink-300">
                  {lead.email || "—"}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-ink-500 dark:text-ink-300">
                  {lead.country_code || ""} {lead.mobile_without_country_code || "—"}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-ink-500 dark:text-ink-300">
                  {formatDate(lead.created_at)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-ink-500 dark:text-ink-300">
                  {lead.company || "—"}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <StatusPill status={lead.crm_status} />
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right">
                <button
  onClick={() => onSelectLead(lead)}
  className="inline-flex items-center gap-1 text-xs font-medium text-ink-400 hover:text-ink-700 dark:hover:text-ink-200"
>
  More <MoreHorizontal className="h-3.5 w-3.5" />
</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {visibleCount < filtered.length && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
            className="rounded-full border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 px-5 py-2 text-sm font-medium text-ink-600 dark:text-ink-300 hover:bg-ink-50 dark:hover:bg-ink-800 transition-colors"
          >
            Load more
          </button>
        </div>
      )}
    </div>
  );
}