import React from 'react';

type Split = { label: 'Easy' | 'Medium' | 'Hard'; solved: number; total: number };

const SPLIT_TONE: Record<Split['label'], { chip: string; bar: string }> = {
  Easy: {
    chip: 'border-emerald-500/40 text-emerald-600 dark:text-emerald-400',
    bar: 'bg-emerald-500',
  },
  Medium: {
    chip: 'border-amber-500/40 text-amber-600 dark:text-amber-400',
    bar: 'bg-amber-500',
  },
  Hard: {
    chip: 'border-rose-500/40 text-rose-600 dark:text-rose-400',
    bar: 'bg-rose-500',
  },
};

function SplitBar({ label, solved, total }: Split) {
  const tone = SPLIT_TONE[label];
  const pct = total > 0 ? (solved / total) * 100 : 0;

  return (
    <div className="flex items-center gap-3">
      <span
        className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium ${tone.chip}`}
      >
        {label}
      </span>
      <div className="h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-[width] duration-500 ${tone.bar}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
        {solved}/{total}
      </span>
    </div>
  );
}

/**
 * The card that opens every problem list: what you're looking at, what you've
 * done, and the easy/medium/hard split — in one block, so the list below can
 * stay a plain stack of rows.
 */
export function SheetProgressHeader({
  icon: Icon,
  title,
  description,
  actions,
  solved,
  total,
  splits,
}: {
  icon?: React.ElementType;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  solved: number;
  total: number;
  splits?: Split[];
}) {
  const pct = total > 0 ? Math.round((solved / total) * 100) : 0;

  return (
    <section className="rounded-2xl border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          {Icon && (
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <Icon className="size-[18px]" strokeWidth={1.75} />
            </span>
          )}
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold tracking-tight">{title}</h1>
            {description && (
              <p className="mt-0.5 truncate text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </div>
        </div>

        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Overall progress</span>
          <span className="text-xs text-muted-foreground tabular-nums">
            <span className="font-semibold text-foreground">{solved}</span>/{total} (
            {pct}%)
          </span>
        </div>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {splits && splits.length > 0 && (
        <div className="mt-5 grid gap-3 sm:grid-cols-3 sm:gap-5">
          {splits.map((split) => (
            <SplitBar key={split.label} {...split} />
          ))}
        </div>
      )}
    </section>
  );
}
