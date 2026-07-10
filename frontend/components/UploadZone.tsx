"use client";

import { useCallback, useRef, useState } from "react";

interface Props {
  onFileSelected: (file: File) => void;
  error?: string | null;
}

export default function UploadZone({ onFileSelected, error }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const file = files[0];
      if (!file.name.toLowerCase().endsWith(".csv")) return;
      onFileSelected(file);
    },
    [onFileSelected]
  );

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        role="button"
        tabIndex={0}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={`cursor-pointer rounded-xl border-2 border-dashed px-8 py-16 text-center transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-signal-500 ${
          isDragging
            ? "border-signal-500 bg-signal-500/5"
            : "border-ink-200 dark:border-ink-700 hover:border-ink-400 dark:hover:border-ink-400"
        }`}
      >
        <p className="font-display text-lg font-medium text-ink-800 dark:text-ink-100">
          Drop a CSV file here
        </p>
        <p className="mt-1 text-sm text-ink-400">
          or click to browse — any column layout is fine, we&apos;ll figure out the mapping
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
      {error && (
        <p className="mt-3 text-sm font-medium text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
