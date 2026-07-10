"use client";

import { useState } from "react";
import type { ImportResult } from "@/lib/types";
import { CRM_FIELDS } from "@/lib/types";
import StatusPill from "./StatusPill";

export default function ResultsTable({ result }: { result: ImportResult }) {
  const [tab, setTab] = useState<"imported" | "skipped">("imported");

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 p-5 shadow-panel">
          <p className="text-xs uppercase tracking-wide text-ink-400">Total imported</p>
          <p className="font-display mt-1 text-3xl font-bold text-signal-600 dark:text-signal-500">
            {result.totalImported}
          </p>
        </div>
        <div className="rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 p-5 shadow-panel">
          <p className="text-xs uppercase tracking-wide text-ink-400">Total skipped</p>
          <p className="font-display mt-1 text-3xl font-bold text-amber-500">
            {result.totalSkipped}
          </p>
        </div>
      </div>

      <div className="mt-6 flex gap-2 border-b border-ink-200 dark:border-ink-700">
        <button
          onClick={() => setTab("imported")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            tab === "imported"
              ? "border-b-2 border-signal-500 text-ink-900 dark:text-ink-100"
              : "text-ink-400 hover:text-ink-600"
          }`}
        >
          Imported ({result.totalImported})
        </button>
        <button
          onClick={() => setTab("skipped")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            tab === "skipped"
              ? "border-b-2 border-amber-500 text-ink-900 dark:text-ink-100"
              : "text-ink-400 hover:text-ink-600"
          }`}
        >
          Skipped ({result.totalSkipped})
        </button>
      </div>

      <div className="mt-4">
        {tab === "imported" ? (
          <ImportedTable rows={result.imported} />
        ) : (
          <SkippedTable rows={result.skipped} />
        )}
      </div>
    </div>
  );
}

function ImportedTable({ rows }: { rows: ImportResult["imported"] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-ink-400">No records were successfully mapped.</p>;
  }
  return (
    <div className="ledger-scroll max-h-[480px] border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 shadow-panel">
      <table>
        <thead>
          <tr>
            <th className="bg-ink-100 dark:bg-ink-800 px-3 py-2 text-[11px] uppercase tracking-wide text-ink-400">
              #
            </th>
            {CRM_FIELDS.map((f) => (
              <th
                key={f}
                className="bg-ink-100 dark:bg-ink-800 px-3 py-2 text-[11px] uppercase tracking-wide text-ink-600 dark:text-ink-200 border-b border-ink-200 dark:border-ink-700"
              >
                {f}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((record, i) => (
            <tr key={i} className="odd:bg-white even:bg-ink-50 dark:odd:bg-ink-900 dark:even:bg-ink-800/60">
              <td className="bg-inherit px-3 py-1.5 text-ink-400 border-b border-ink-100 dark:border-ink-800">
                {i + 1}
              </td>
              {CRM_FIELDS.map((f) => (
                <td
                  key={f}
                  className="px-3 py-1.5 text-ink-700 dark:text-ink-200 border-b border-ink-100 dark:border-ink-800 max-w-[200px] truncate"
                  title={record[f] ?? ""}
                >
                  {f === "crm_status" ? (
                    <StatusPill status={record[f]} />
                  ) : record[f] ? (
                    record[f]
                  ) : (
                    <span className="text-ink-300 dark:text-ink-600">—</span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SkippedTable({ rows }: { rows: ImportResult["skipped"] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-ink-400">Nothing was skipped — every row had contact info.</p>;
  }
  return (
    <div className="ledger-scroll max-h-[480px] border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 shadow-panel">
      <table>
        <thead>
          <tr>
            <th className="bg-ink-100 dark:bg-ink-800 px-3 py-2 text-[11px] uppercase tracking-wide text-ink-400">
              Row #
            </th>
            <th className="bg-ink-100 dark:bg-ink-800 px-3 py-2 text-[11px] uppercase tracking-wide text-ink-600 dark:text-ink-200 border-b border-ink-200 dark:border-ink-700">
              Reason skipped
            </th>
            <th className="bg-ink-100 dark:bg-ink-800 px-3 py-2 text-[11px] uppercase tracking-wide text-ink-600 dark:text-ink-200 border-b border-ink-200 dark:border-ink-700">
              Raw data
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.row_id} className="odd:bg-white even:bg-ink-50 dark:odd:bg-ink-900 dark:even:bg-ink-800/60">
              <td className="bg-inherit px-3 py-1.5 text-ink-400 border-b border-ink-100 dark:border-ink-800">
                {row.row_id + 1}
              </td>
              <td className="px-3 py-1.5 text-amber-600 dark:text-amber-500 border-b border-ink-100 dark:border-ink-800">
                {row.reason}
              </td>
              <td className="px-3 py-1.5 text-ink-500 dark:text-ink-400 border-b border-ink-100 dark:border-ink-800 max-w-[400px] truncate" title={JSON.stringify(row.raw)}>
                {JSON.stringify(row.raw)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
