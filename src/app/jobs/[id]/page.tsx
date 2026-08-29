import React from 'react';

import { db } from '@/lib/db';
import { jobs } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  MapPin,
  IndianRupee,
  ExternalLink,
  Building2,
  ArrowLeft,
  Lock,
  Globe,
  CalendarClock,
  Clock,
} from 'lucide-react';
import Link from 'next/link';
import { SignInButton } from '../../../components/auth/sign-in-button';
import { MarkdownProse } from '@/components/markdown-prose';
import {
  getGeeksforgeeksJob,
  isExternalJobId,
  type ExternalJob,
} from '@/lib/jobs/geeksforgeeks';

/**
 * One shape for both sources so the page body is written once. Internal jobs
 * come from the `jobs` table; external ones from the cached GeeksforGeeks feed.
 */
interface JobView {
  title: string;
  company: string;
  companyLogo: string | null;
  location: string;
  locationType: string;
  jobType: string;
  /** Rendered as-is; internal salaries get the " LPA" suffix at build time. */
  salaryLabel: string | null;
  experience: string | null;
  category: string | null;
  postedOn: string | null;
  lastApplyDate: string | null;
  skills: string[];
  /** Markdown. */
  description: string;
  /** Markdown. Empty when the source gives no separate requirements block. */
  requirements: string;
  companyAbout: string;
  companyWebsite: string | null;
  applyUrl: string;
  sourceLabel: string | null;
}

function fromExternal(job: ExternalJob): JobView {
  return {
    title: job.title,
    company: job.company,
    companyLogo: job.companyLogo,
    location: job.location,
    locationType: job.locationType,
    jobType: job.jobType,
    salaryLabel: job.salary,
    experience: job.experience,
    category: job.category,
    postedOn: job.postedOn,
    lastApplyDate: job.lastApplyDate,
    skills: job.skills,
    description: job.description,
    requirements: '',
    companyAbout: job.companyAbout,
    companyWebsite: job.companyWebsite,
    applyUrl: job.applyUrl,
    sourceLabel: 'GeeksforGeeks',
  };
}

function formatDate(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t pt-6">
      <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const isLoggedIn = !!session?.user;
  const { id } = await params;

  let view: JobView;

  if (isExternalJobId(id)) {
    // External listings are not in the database — they live in the cached feed,
    // and drop out of it once the source archives them.
    const external = await getGeeksforgeeksJob(id);
    if (!external) notFound();
    view = fromExternal(external);
  } else {
    const job = await db.query.jobs.findFirst({ where: eq(jobs.id, id) });
    if (!job || !job.isActive) notFound();

    view = {
      title: job.title,
      company: job.company,
      companyLogo: job.companyLogo,
      location: job.location,
      locationType: job.locationType,
      jobType: job.jobType,
      salaryLabel: job.salary ? `${job.salary} LPA` : null,
      experience: null,
      category: null,
      postedOn: null,
      lastApplyDate: null,
      skills: [],
      description: job.description,
      requirements: job.requirements,
      companyAbout: '',
      companyWebsite: null,
      applyUrl: job.applyUrl,
      sourceLabel: null,
    };
  }

  const applyBy = formatDate(view.lastApplyDate);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-8 md:px-6 md:py-10">
        <Link
          href="/jobs"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          All jobs
        </Link>

        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="mt-6 flex items-start gap-4">
          {view.companyLogo ? (
            <img
              src={view.companyLogo}
              alt=""
              className="size-14 shrink-0 rounded-2xl border bg-white object-contain p-1"
            />
          ) : (
            <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl border bg-muted text-muted-foreground">
              <Building2 className="size-6" strokeWidth={1.75} />
            </span>
          )}

          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{view.title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Building2 className="size-4" strokeWidth={1.75} />
                {view.company}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-4" strokeWidth={1.75} />
                {view.location}
              </span>
              {view.postedOn && (
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="size-4" strokeWidth={1.75} />
                  {view.postedOn}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Badge variant="secondary" className="capitalize">
            {view.locationType}
          </Badge>
          <Badge variant="outline" className="capitalize">
            {view.jobType.replace('-', ' ')}
          </Badge>
          {view.experience && <Badge variant="outline">{view.experience}</Badge>}
          {view.category && <Badge variant="outline">{view.category}</Badge>}
          {view.salaryLabel && (
            <Badge variant="outline" className="gap-1">
              <IndianRupee className="size-3" />
              {view.salaryLabel}
            </Badge>
          )}
        </div>

        {applyBy && (
          <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarClock className="size-3.5" strokeWidth={1.75} />
            Apply by {applyBy}
          </p>
        )}

        {/* ── Body ───────────────────────────────────────────────── */}
        <div className="mt-8 space-y-6">
          {view.skills.length > 0 && (
            <Section title="Skills">
              <div className="flex flex-wrap gap-1.5">
                {view.skills.map((skill) => (
                  <Badge key={skill} variant="secondary" className="font-normal">
                    {skill}
                  </Badge>
                ))}
              </div>
            </Section>
          )}

          <Section title="About the role">
            {view.description ? (
              <MarkdownProse content={view.description} />
            ) : (
              <p className="text-sm text-muted-foreground">
                No description was provided for this role.
              </p>
            )}
          </Section>

          {view.requirements && (
            <Section title="Requirements">
              <MarkdownProse content={view.requirements} />
            </Section>
          )}

          {view.companyAbout && (
            <Section title={`About ${view.company}`}>
              <MarkdownProse content={view.companyAbout} />
              {view.companyWebsite && (
                <a
                  href={view.companyWebsite}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="mt-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground underline underline-offset-2 transition-colors hover:text-foreground"
                >
                  <Globe className="size-3.5" strokeWidth={1.75} />
                  Company website
                </a>
              )}
            </Section>
          )}
        </div>

        {/* ── Apply ──────────────────────────────────────────────── */}
        <div className="mt-8 rounded-2xl border bg-card p-6">
          {isLoggedIn ? (
            <>
              <h2 className="text-sm font-semibold tracking-tight">Ready to apply?</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {view.sourceLabel
                  ? `This role is listed on ${view.sourceLabel}. You'll be taken there to apply.`
                  : `You'll be taken to ${view.company}'s application page.`}
              </p>
              <Button size="lg" className="mt-5 w-full gap-2" asChild>
                <a href={view.applyUrl} target="_blank" rel="noopener noreferrer">
                  Apply now
                  <ExternalLink className="size-4" />
                </a>
              </Button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <Lock className="size-4 text-muted-foreground" strokeWidth={1.75} />
                <h2 className="text-sm font-semibold tracking-tight">Sign in to apply</h2>
              </div>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Applications are tied to your account so you can track them later.
              </p>
              <div className="mt-5">
                <SignInButton />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
