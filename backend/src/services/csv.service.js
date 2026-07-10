const { parse } = require("csv-parse/sync");

/**
 * Parses a raw CSV buffer/string into an array of row objects.
 * Each row is tagged with a stable `row_id` so we can reconcile
 * AI output (imported/skipped) back to the original raw data,
 * even across different column layouts.
 */
function parseCsv(csvContent) {
  const records = parse(csvContent, {
    columns: true, // use first row as headers, whatever they are named
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true, // tolerate ragged rows from messy exports
    bom: true,
  });

  return records.map((row, index) => ({
    row_id: index,
    raw: row,
  }));
}

module.exports = { parseCsv };
