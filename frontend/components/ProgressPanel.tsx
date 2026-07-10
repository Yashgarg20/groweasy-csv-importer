interface Props {
  completedBatches: number;
  totalBatches: number;
}

export default function ProgressPanel({ completedBatches, totalBatches }: Props) {
  const pct = totalBatches > 0 ? Math.round((completedBatches / totalBatches) * 100) : 0;
  const determinate = totalBatches > 0;

  return (
    <div className="rounded-xl border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 p-6 shadow-panel">
      <p className="font-display text-base font-medium text-ink-800 dark:text-ink-100">
        Mapping your leads with AI…
      </p>
      <p className="mt-1 text-sm text-ink-400">
        {determinate
          ? `Batch ${completedBatches} of ${totalBatches} processed`
          : "Starting extraction…"}
      </p>
      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
        {determinate ? (
          <div
            className="h-full rounded-full bg-signal-500 transition-all duration-500 ease-out"
            style={{ width: `${pct}%` }}
          />
        ) : (
          <div className="progress-indeterminate h-full w-full" />
        )}
      </div>
    </div>
  );
}
