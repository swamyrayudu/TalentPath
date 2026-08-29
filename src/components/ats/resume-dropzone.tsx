'use client';

import React, { useCallback, useRef, useState } from 'react';
import { Upload, FileText, X } from 'lucide-react';

const ACCEPT = '.pdf,.docx,.doc,.txt';

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ResumeDropzone({
  file,
  onSelect,
  disabled = false,
}: {
  file: File | null;
  onSelect: (file: File | null) => void;
  disabled?: boolean;
}) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      setDragging(false);
      if (disabled) return;
      const dropped = event.dataTransfer.files?.[0];
      if (dropped) onSelect(dropped);
    },
    [disabled, onSelect],
  );

  const open = () => {
    if (!disabled) inputRef.current?.click();
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`relative overflow-hidden rounded-2xl border transition-colors ${
        dragging ? 'border-primary/60 bg-primary/5' : 'border-border'
      } ${disabled ? 'opacity-60' : ''}`}
    >
      {/* Faint grid, so the drop target reads as a surface rather than empty space. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.18] dark:opacity-[0.13]"
        style={{
          backgroundImage:
            'linear-gradient(to right, var(--color-border) 1px, transparent 1px), linear-gradient(to bottom, var(--color-border) 1px, transparent 1px)',
          backgroundSize: '38px 38px',
          maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 78%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 78%)',
        }}
      />

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        disabled={disabled}
        onChange={(e) => {
          const picked = e.target.files?.[0] ?? null;
          onSelect(picked);
          // Allow re-picking the same file after a removal.
          e.target.value = '';
        }}
      />

      <div className="relative flex flex-col items-center justify-center px-6 py-12 text-center">
        {file ? (
          <>
            <span className="flex size-14 items-center justify-center rounded-xl border bg-muted/50">
              <FileText className="size-6 text-muted-foreground" strokeWidth={1.75} />
            </span>
            <p className="mt-4 max-w-full truncate text-sm font-medium">{file.name}</p>
            <p className="mt-1 text-xs text-muted-foreground">{formatSize(file.size)}</p>
            <div className="mt-4 flex items-center gap-2">
              <button
                type="button"
                onClick={open}
                disabled={disabled}
                className="rounded-md border px-3 py-1.5 text-xs transition-colors hover:bg-muted disabled:opacity-50"
              >
                Replace
              </button>
              <button
                type="button"
                onClick={() => onSelect(null)}
                disabled={disabled}
                className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
              >
                <X className="size-3" />
                Remove
              </button>
            </div>
          </>
        ) : (
          <>
            <h3 className="text-base font-semibold tracking-tight">Upload your Resume</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Drag or drop your files here or click to upload
            </p>

            <button
              type="button"
              onClick={open}
              disabled={disabled}
              className="mt-6 flex size-24 items-center justify-center rounded-xl border border-dashed border-primary/50 bg-muted/40 transition-colors hover:bg-muted disabled:opacity-50"
              aria-label="Choose a resume file"
            >
              <Upload className="size-5 text-muted-foreground" strokeWidth={1.75} />
            </button>

            <p className="mt-6 text-xs text-muted-foreground">PDF, DOCX or TXT · up to 5MB</p>
          </>
        )}
      </div>
    </div>
  );
}
