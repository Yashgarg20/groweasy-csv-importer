"use client";

import { useState } from "react";
import { Upload, ChevronRight } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import ImportModal from "@/components/ImportModal";
import LeadsTable from "@/components/LeadsTable";
import LeadDetailModal from "@/components/LeadDetailModal";
import ThemeToggle from "@/components/ThemeToggle";
import type { CrmRecord, ImportResult } from "@/lib/types";

export default function HomePage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [leads, setLeads] = useState<CrmRecord[]>([]);
  const [lastResult, setLastResult] = useState<ImportResult | null>(null);
  const [selectedLead, setSelectedLead] = useState<CrmRecord | null>(null);

  function handleImported(result: ImportResult) {
    setLastResult(result);
    setLeads((prev) => [...result.imported, ...prev]);
  }

  return (
    <div className="flex min-h-screen bg-ink-50 dark:bg-ink-950">
      <Sidebar active="leads" />

      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-6 py-8 sm:px-8">
          <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="flex items-center gap-1 text-xs text-ink-400">
                Lead Sources <ChevronRight className="h-3 w-3" /> Manage Leads
              </p>
              <h1 className="font-display mt-1 text-2xl font-bold text-ink-900 dark:text-ink-50">
                Manage Your Leads
              </h1>
              <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
                Monitor lead status, assign tasks, and close deals faster.
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <ThemeToggle />
              <button
                onClick={() => setModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
              >
                <Upload className="h-4 w-4" />
                Import Leads via CSV
              </button>
            </div>
          </header>

          {lastResult && (
            <div className="mb-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatCard label="Just imported" value={lastResult.totalImported} accent="signal" />
              <StatCard label="Just skipped" value={lastResult.totalSkipped} accent="amber" />
              <StatCard label="Total leads" value={leads.length} accent="ink" />
              <StatCard
                label="Import success rate"
                value={
                  lastResult.totalImported + lastResult.totalSkipped > 0
                    ? `${Math.round(
                        (lastResult.totalImported /
                          (lastResult.totalImported + lastResult.totalSkipped)) *
                          100
                      )}%`
                    : "—"
                }
                accent="brand"
              />
            </div>
          )}

          <LeadsTable leads={leads} onSelectLead={setSelectedLead} />
        </div>
      </main>

      {modalOpen && (
        <ImportModal onClose={() => setModalOpen(false)} onImported={handleImported} />
      )}

      {selectedLead && (
        <LeadDetailModal lead={selectedLead} onClose={() => setSelectedLead(null)} />
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent: "signal" | "amber" | "ink" | "brand";
}) {
  const colors: Record<string, string> = {
    signal: "text-signal-600 dark:text-signal-500",
    amber: "text-amber-600 dark:text-amber-500",
    ink: "text-ink-800 dark:text-ink-100",
    brand: "text-brand-600 dark:text-brand-500",
  };
  return (
    <div className="rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 p-4 shadow-panel">
      <p className="text-[11px] uppercase tracking-wide text-ink-400">{label}</p>
      <p className={`font-display mt-1 text-2xl font-bold ${colors[accent]}`}>{value}</p>
    </div>
  );
}