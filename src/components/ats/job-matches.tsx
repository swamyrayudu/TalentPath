'use client';

import React from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Building2 } from 'lucide-react';
import type { JobRecommendation } from '@/lib/ats/types';

function matchTone(score: number) {
  if (score >= 70) return 'text-emerald-600 dark:text-emerald-400';
  if (score >= 45) return 'text-amber-600 dark:text-amber-400';
  return 'text-muted-foreground';
}

export function JobMatches({ jobs }: { jobs: JobRecommendation[] }) {
  return (
    <section className="rounded-2xl border">
      <div className="border-b px-6 py-5">
        <h2 className="text-sm font-semibold tracking-tight">Jobs that match your resume</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          {jobs.length > 0
            ? 'Ranked by how much of each posting your skills already cover.'
            : 'Nothing on the board lines up closely with your resume yet.'}
        </p>
      </div>

      {jobs.length === 0 ? (
        <div className="px-6 py-10 text-center">
          <p className="text-sm text-muted-foreground">
            Add the technologies you have actually used to your resume and re-run the check —
            matching works off the skills a parser can find.
          </p>
          <Link
            href="/jobs"
            className="mt-4 inline-block text-sm underline underline-offset-4 transition-colors hover:text-foreground"
          >
            Browse all jobs
          </Link>
        </div>
      ) : (
        <>
          <ul className="divide-y">
            {jobs.map((job) => (
              <li key={job.id}>
                <Link href={job.href} className="block px-6 py-4 transition-colors hover:bg-muted/40">
                  <div className="flex items-start gap-4">
                    {job.companyLogo ? (
                      <img
                        src={job.companyLogo}
                        alt=""
                        loading="lazy"
                        className="size-10 shrink-0 rounded-lg border bg-white object-contain p-1"
                      />
                    ) : (
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
                        <Building2 className="size-4" strokeWidth={1.75} />
                      </span>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-3">
                        <h3 className="truncate text-sm font-medium">{job.title}</h3>
                        <span className={`shrink-0 text-xs font-medium tabular-nums ${matchTone(job.matchScore)}`}>
                          {job.matchScore}% match
                        </span>
                      </div>

                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {job.company}
                        <span className="px-1.5 text-muted-foreground/40">·</span>
                        {job.location}
                        <span className="px-1.5 text-muted-foreground/40">·</span>
                        <span className="capitalize">{job.locationType}</span>
                        {job.salaryLabel && (
                          <>
                            <span className="px-1.5 text-muted-foreground/40">·</span>
                            {job.salaryLabel}
                          </>
                        )}
                      </p>

                      {job.matchedSkills.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {job.matchedSkills.map((skill) => (
                            <Badge
                              key={skill}
                              variant="outline"
                              className="border-emerald-500/40 text-[10px] font-normal capitalize text-emerald-600 dark:text-emerald-400"
                            >
                              {skill}
                            </Badge>
                          ))}
                          {job.missingSkills.slice(0, 3).map((skill) => (
                            <Badge
                              key={skill}
                              variant="outline"
                              className="text-[10px] font-normal capitalize text-muted-foreground"
                            >
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          <div className="border-t px-6 py-4 text-center">
            <Link
              href="/jobs"
              className="text-sm text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
            >
              Browse all jobs
            </Link>
          </div>
        </>
      )}
    </section>
  );
}
