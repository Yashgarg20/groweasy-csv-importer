const STATUS_STYLES: Record<string, string> = {
  GOOD_LEAD_FOLLOW_UP:
    "bg-signal-500/10 text-signal-600 dark:text-signal-500 ring-1 ring-inset ring-signal-500/30",
  SALE_DONE:
    "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 ring-1 ring-inset ring-emerald-500/30",
  DID_NOT_CONNECT:
    "bg-amber-500/10 text-amber-700 dark:text-amber-500 ring-1 ring-inset ring-amber-500/30",
  BAD_LEAD:
    "bg-red-500/10 text-red-700 dark:text-red-400 ring-1 ring-inset ring-red-500/30",
};

export default function StatusPill({ status }: { status: string | null }) {
  if (!status) {
    return <span className="text-ink-400">—</span>;
  }
  const style = STATUS_STYLES[status] || "bg-ink-200/40 text-ink-600 ring-1 ring-inset ring-ink-200";
  return (
    <span className={`inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium ${style}`}>
      {status.replaceAll("_", " ")}
    </span>
  );
}
