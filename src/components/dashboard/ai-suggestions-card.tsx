import React from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { FOCUS_LINKS } from '@/lib/ai-suggestions';
import type { Suggestion } from '@/lib/ai-suggestions';

const FOCUS_LABEL: Record<string, string> = {
  daily: 'Daily',
  dsa: 'DSA',
  aptitude: 'Aptitude',
  contest: 'Contest',
  interview: 'Interview',
  roadmap: 'Roadmap',
  jobs: 'Jobs',
};

/**
 * What to do next, derived from this learner's own numbers. Rendered on the
 * server — the suggestions are already resolved by the time this mounts.
 */
export function AiSuggestionsCard({
  suggestions,
  source,
}: {
  suggestions: Suggestion[];
  source: 'ai' | 'rules';
}) {
  if (suggestions.length === 0) return null;

  return (
    <section className="rounded-2xl border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
        <div className="flex items-center gap-2.5">
          <Sparkles className="size-4 text-primary" strokeWidth={1.75} />
          <h2 className="text-sm font-semibold">Suggested for you</h2>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          {source === 'ai' ? 'AI · from your activity' : 'From your activity'}
        </span>
      </div>

      <div className="divide-y">
        {suggestions.map((suggestion, index) => {
          const link = FOCUS_LINKS[suggestion.focus] ?? FOCUS_LINKS.dsa;

          return (
            <div
              key={`${suggestion.focus}-${index}`}
              className="flex flex-wrap items-start justify-between gap-4 px-5 py-4"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                    {FOCUS_LABEL[suggestion.focus] ?? suggestion.focus}
                  </span>
                </div>
                <p className="mt-1.5 text-sm font-semibold">{suggestion.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {suggestion.detail}
                </p>
              </div>

              <Link
                href={link.href}
                className="group inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-3.5 py-2 text-sm font-medium transition-colors hover:border-primary/40 hover:bg-muted/40"
              >
                {link.label}
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}
