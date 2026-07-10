const STATUS_STYLES: Record<string, string> = {
  GOOD_LEAD_FOLLOW_UP:
    "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 ring-1 ring-inset ring-emerald-500/30",
  SALE_DONE:
    "bg-blue-500/10 text-blue-700 dark:text-blue-400 ring-1 ring-inset ring-blue-500/30",
  DID_NOT_CONNECT:
    "bg-ink-200/50 text-ink-600 dark:text-ink-300 ring-1 ring-inset ring-ink-300/40",
  BAD_LEAD:
    "bg-red-500/10 text-red-700 dark:text-red-400 ring-1 ring-inset ring-red-500/30",
};

const STATUS_LABELS: Record<string, string> = {
  GOOD_LEAD_FOLLOW_UP: "Good Lead",
  SALE_DONE: "Sale Done",
  DID_NOT_CONNECT: "Not Dialed",
  BAD_LEAD: "Bad Lead",
};

export default function StatusPill({ status }: { status: string | null }) {
  if (!status) {
    return (
      <span className="inline-block rounded-full bg-ink-200/50 px-2 py-0.5 text-[11px] font-medium text-ink-500 ring-1 ring-inset ring-ink-300/40">
        Not Dialed
      </span>
    );
  }
  const style = STATUS_STYLES[status] || "bg-ink-200/40 text-ink-600 ring-1 ring-inset ring-ink-200";
  const label = STATUS_LABELS[status] || status.replaceAll("_", " ");
  return (
    <span className={`inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium ${style}`}>
      {label}
    </span>
  );
}