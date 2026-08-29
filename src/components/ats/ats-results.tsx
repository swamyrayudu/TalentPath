'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Check, Info } from 'lucide-react';
import type { AtsAnalysis, Severity } from '@/lib/ats/types';

function scoreTone(score: number) {
  if (score >= 80) return { text: 'text-emerald-600 dark:text-emerald-400', ring: 'stroke-emerald-500' };
  if (score >= 60) return { text: 'text-amber-600 dark:text-amber-400', ring: 'stroke-amber-500' };
  return { text: 'text-rose-600 dark:text-rose-400', ring: 'stroke-rose-500' };
}

const SEVERITY_STYLE: Record<Severity, string> = {
  high: 'border-rose-500/40 text-rose-600 dark:text-rose-400',
  medium: 'border-amber-500/40 text-amber-600 dark:text-amber-400',
  low: 'border-border text-muted-foreground',
};

function ScoreDial({ score }: { score: number }) {
  const tone = scoreTone(score);
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const dash = (Math.max(0, Math.min(100, score)) / 100) * circumference;

  return (
    <div className="relative size-32 shrink-0">
      <svg viewBox="0 0 120 120" className="size-full -rotate-90">
        <circle cx="60" cy="60" r={radius} fill="none" strokeWidth="8" className="stroke-muted" />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          className={tone.ring}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-3xl font-semibold tabular-nums ${tone.text}`}>{score}</span>
        <span className="text-[11px] text-muted-foreground">out of 100</span>
      </div>
    </div>
  );
}

export function AtsResults({ analysis }: { analysis: AtsAnalysis }) {
  const { profile } = analysis;

  return (
    <div className="space-y-6">
      {/* Score */}
      <section className="rounded-2xl border p-6">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
          <ScoreDial score={analysis.score} />
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              ATS score
            </h2>
            <p className="mt-2 text-lg font-medium leading-snug">{analysis.verdict}</p>
            {analysis.degraded && (
              <p className="mt-3 inline-flex items-start gap-1.5 text-xs text-muted-foreground">
                <Info className="mt-px size-3.5 shrink-0" strokeWidth={1.75} />
                AI review was unavailable, so this score covers formatting and structure only.
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 space-y-3 border-t pt-5">
          {analysis.categories.map((category) => {
            const pct = category.max ? (category.score / category.max) * 100 : 0;
            return (
              <div key={category.id}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-sm">{category.label}</span>
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    {category.score}/{category.max}
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full ${
                      pct >= 75 ? 'bg-emerald-500' : pct >= 45 ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{category.detail}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Keyword match — only when a job description was supplied */}
      {analysis.keywords && (
        <section className="rounded-2xl border p-6">
          <h2 className="text-sm font-semibold tracking-tight">Job description keywords</h2>
          {analysis.keywords.matched.length > 0 && (
            <div className="mt-4">
              <p className="text-xs text-muted-foreground">Found in your resume</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {analysis.keywords.matched.map((k) => (
                  <Badge key={k} variant="outline" className="border-emerald-500/40 font-normal text-emerald-600 dark:text-emerald-400">
                    {k}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {analysis.keywords.missing.length > 0 ? (
            <div className="mt-4">
              <p className="text-xs text-muted-foreground">
                Missing — add these only where they are genuinely true of you
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {analysis.keywords.missing.map((k) => (
                  <Badge key={k} variant="outline" className="border-rose-500/40 font-normal text-rose-600 dark:text-rose-400">
                    {k}
                  </Badge>
                ))}
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              No important keywords from the posting are missing.
            </p>
          )}
        </section>
      )}

      {/* Fixes */}
      {analysis.improvements.length > 0 && (
        <section className="rounded-2xl border p-6">
          <h2 className="text-sm font-semibold tracking-tight">What to fix</h2>
          <ul className="mt-4 space-y-4">
            {analysis.improvements.map((item, i) => (
              <li key={i} className="border-l-2 pl-4">
                <div className="flex flex-wrap items-center gap-2">
                  <AlertTriangle className="size-3.5 shrink-0 text-muted-foreground" strokeWidth={1.75} />
                  <span className="text-sm font-medium">{item.issue}</span>
                  <Badge variant="outline" className={`${SEVERITY_STYLE[item.severity]} text-[10px] uppercase`}>
                    {item.severity}
                  </Badge>
                </div>
                <p className="mt-1.5 text-sm text-muted-foreground">{item.fix}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Strengths */}
      {analysis.strengths.length > 0 && (
        <section className="rounded-2xl border p-6">
          <h2 className="text-sm font-semibold tracking-tight">What is working</h2>
          <ul className="mt-4 space-y-2">
            {analysis.strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <Check className="mt-0.5 size-4 shrink-0 text-emerald-500" strokeWidth={2} />
                {s}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Parsed profile — shows the user what an ATS actually read */}
      {(profile.skills.length > 0 || profile.targetRoles.length > 0) && (
        <section className="rounded-2xl border p-6">
          <h2 className="text-sm font-semibold tracking-tight">What a parser read from your resume</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            If anything here is wrong or missing, that is what recruiters&apos; filters will see too.
          </p>

          <dl className="mt-4 space-y-4">
            {profile.targetRoles.length > 0 && (
              <div>
                <dt className="text-xs text-muted-foreground">Best-fit roles</dt>
                <dd className="mt-1.5 flex flex-wrap gap-1.5">
                  {profile.targetRoles.map((r) => (
                    <Badge key={r} variant="secondary" className="font-normal">{r}</Badge>
                  ))}
                </dd>
              </div>
            )}
            {profile.skills.length > 0 && (
              <div>
                <dt className="text-xs text-muted-foreground">Skills detected</dt>
                <dd className="mt-1.5 flex flex-wrap gap-1.5">
                  {profile.skills.map((s) => (
                    <Badge key={s} variant="outline" className="font-normal">{s}</Badge>
                  ))}
                </dd>
              </div>
            )}
            <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Seniority</dt>
                <dd className="mt-0.5 capitalize">{profile.seniority}</dd>
              </div>
              {profile.yearsExperience !== null && (
                <div>
                  <dt className="text-xs text-muted-foreground">Experience</dt>
                  <dd className="mt-0.5">
                    {profile.yearsExperience} {profile.yearsExperience === 1 ? 'year' : 'years'}
                  </dd>
                </div>
              )}
              {profile.education.length > 0 && (
                <div className="min-w-0">
                  <dt className="text-xs text-muted-foreground">Education</dt>
                  <dd className="mt-0.5">{profile.education.join(', ')}</dd>
                </div>
              )}
            </div>
          </dl>
        </section>
      )}
    </div>
  );
}
