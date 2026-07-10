interface Props {
  headers: string[];
  rows: Record<string, string>[];
  maxRows?: number;
}

export default function PreviewTable({ headers, rows, maxRows = 50 }: Props) {
  const visibleRows = rows.slice(0, maxRows);

  return (
    <div>
      <div className="ledger-scroll max-h-[420px] border border-ink-200 dark:border-ink-700 bg-white dark:bg-ink-900 shadow-panel">
        <table>
          <thead>
            <tr>
              <th className="bg-ink-100 dark:bg-ink-800 px-3 py-2 text-[11px] uppercase tracking-wide text-ink-400">
                #
              </th>
              {headers.map((h) => (
                <th
                  key={h}
                  className="bg-ink-100 dark:bg-ink-800 px-3 py-2 text-[11px] uppercase tracking-wide text-ink-600 dark:text-ink-200 border-b border-ink-200 dark:border-ink-700"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row, i) => (
              <tr
                key={i}
                className="odd:bg-white even:bg-ink-50 dark:odd:bg-ink-900 dark:even:bg-ink-800/60"
              >
                <td className="bg-inherit px-3 py-1.5 text-ink-400 border-b border-ink-100 dark:border-ink-800">
                  {i + 1}
                </td>
                {headers.map((h) => (
                  <td
                    key={h}
                    className="px-3 py-1.5 text-ink-700 dark:text-ink-200 border-b border-ink-100 dark:border-ink-800 max-w-[220px] truncate"
                    title={row[h]}
                  >
                    {row[h] || <span className="text-ink-300 dark:text-ink-600">·</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-ink-400">
        Showing {visibleRows.length} of {rows.length} rows · no AI processing yet
      </p>
    </div>
  );
}
