'use client';
import React from 'react';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
} from 'lucide-react';
import Link from 'next/link';

type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  locationType: 'remote' | 'onsite' | 'hybrid';
  jobType: 'full-time' | 'part-time' | 'contract' | 'internship';
  description: string;
  requirements: string;
  salary: string | null;
  applyUrl: string;
  companyLogo: string | null;
  isActive: boolean;
  createdAt: Date;
};

type ExternalJob = {
  id: string;
  title: string;
  company: string;
  companyLogo: string | null;
  location: string;
  locationType: 'remote' | 'onsite' | 'hybrid';
  jobType: 'full-time' | 'part-time' | 'contract' | 'internship';
  salary: string | null;
  experience: string | null;
  experienceLevel: string | null;
  category: string | null;
  skills: string[];
  postedOn: string | null;
  lastApplyDate: string | null;
  applyUrl: string;
  source: 'geeksforgeeks';
};

type Source = 'talentpath' | 'geeksforgeeks';

/** One shape for the list, whichever board a role came from. */
type Listing = {
  id: string;
  title: string;
  company: string;
  companyLogo: string | null;
  location: string;
  locationType: 'remote' | 'onsite' | 'hybrid';
  jobType: 'full-time' | 'part-time' | 'contract' | 'internship';
  salaryLabel: string | null;
  /** Only set where the source states a comparable number, so the LPA filter can use it. */
  salaryLpa: number | null;
  postedLabel: string | null;
  experience: string | null;
  href: string;
  external: boolean;
  source: Source;
};

const JOBS_PER_PAGE = 12;

const SALARY_RANGES = [
  { value: '0-5', label: '0 – 5 LPA' },
  { value: '5-10', label: '5 – 10 LPA' },
  { value: '10-15', label: '10 – 15 LPA' },
  { value: '15+', label: '15+ LPA' },
];

const SOURCES: { value: Source; label: string }[] = [
  { value: 'talentpath', label: 'TalentPath' },
  { value: 'geeksforgeeks', label: 'GeeksforGeeks' },
];

/* ── Presentational building blocks ─────────────────────────────── */

function FilterGroup({
  value,
  label,
  options,
  selected,
  onToggle,
  note,
}: {
  value: string;
  label: string;
  options: { value: string; label: string }[];
  selected: string[];
  onToggle: (v: string) => void;
  note?: string;
}) {
  return (
    <AccordionItem value={value} className="border-b last:border-b-0">
      <AccordionTrigger className="py-3 text-sm font-medium hover:no-underline">
        {label}
      </AccordionTrigger>
      <AccordionContent className="pb-3">
        <div className="space-y-2.5">
          {options.map((option) => (
            <div key={option.value} className="flex items-center gap-2.5">
              <Checkbox
                id={`${value}-${option.value}`}
                checked={selected.includes(option.value)}
                onCheckedChange={() => onToggle(option.value)}
              />
              <Label
                htmlFor={`${value}-${option.value}`}
                className="cursor-pointer text-sm font-normal text-muted-foreground"
              >
                {option.label}
              </Label>
            </div>
          ))}
        </div>
        {note && <p className="mt-3 text-xs text-muted-foreground/70">{note}</p>}
      </AccordionContent>
    </AccordionItem>
  );
}

/**
 * Company mark: the real logo where there is one, the initial otherwise. Broken
 * URLs fall back too — plenty of listings point at images that no longer load,
 * and an empty grey box down the whole column looks like a bug.
 */
function CompanyMark({ name, logo }: { name: string; logo: string | null }) {
  const [failed, setFailed] = useState(false);

  if (logo && !failed) {
    return (
      <img
        src={logo}
        alt=""
        loading="lazy"
        onError={() => setFailed(true)}
        // contain + a light plate: these logos are wide banners, often transparent.
        className="size-10 shrink-0 rounded-lg border bg-white object-contain p-1"
      />
    );
  }

  return (
    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border bg-muted text-sm font-medium text-muted-foreground">
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

const DOT = <span className="px-1.5 text-muted-foreground/40">·</span>;

/** Joins facts with middots, dropping anything empty. */
function joinFacts(items: (string | null | undefined)[]) {
  const shown = items.filter(Boolean) as string[];

  return shown.map((item, i) => (
    <React.Fragment key={item + i}>
      {i > 0 && DOT}
      {item}
    </React.Fragment>
  ));
}

function jobTypeLabel(jobType: Listing['jobType']) {
  return jobType.charAt(0).toUpperCase() + jobType.slice(1);
}

/**
 * One line of the board. Facts sit right-aligned so salary and location line up
 * down the column, which is what makes a long list scannable.
 */
function JobRow({ job }: { job: Listing }) {
  const placement =
    job.locationType.charAt(0).toUpperCase() + job.locationType.slice(1);

  const inner = (
    <div className="flex items-center gap-4 px-5 py-4">
      <CompanyMark name={job.company} logo={job.companyLogo} />

      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-medium">
          {job.title}

        </h3>
        <p className="mt-1 truncate text-xs text-muted-foreground">
          {joinFacts([
            job.company,
            job.location,
            jobTypeLabel(job.jobType),
            job.experience,
          ])}
        </p>

        {/* Below sm the right-hand column is gone, so carry its facts here. */}
        <p className="mt-1 truncate text-xs text-muted-foreground sm:hidden">
          {joinFacts([job.salaryLabel, placement, job.postedLabel])}
        </p>
      </div>

      <div className="hidden shrink-0 text-right sm:block">
        {job.salaryLabel && (
          <p className="max-w-[190px] truncate text-sm font-medium">{job.salaryLabel}</p>
        )}
        <p className="mt-1 text-xs text-muted-foreground">
          {joinFacts([placement, job.postedLabel])}
        </p>
      </div>
    </div>
  );

  return (
    <Link href={job.href} className="block transition-colors hover:bg-muted/40">
      {inner}
    </Link>
  );
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [externalJobs, setExternalJobs] = useState<ExternalJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'jobs' | 'internships'>('jobs');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJobTypes, setSelectedJobTypes] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedSalaryRanges, setSelectedSalaryRanges] = useState<string[]>([]);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);

  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchJobs();
    fetchExternalJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await fetch('/api/jobs');
      const data = await response.json();
      setJobs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchExternalJobs = async () => {
    try {
      const response = await fetch('/api/jobs/external');
      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        setExternalJobs(result.data);
      }
    } catch (error) {
      console.error('Error fetching external jobs:', error);
    }
  };

  /** Both boards mapped onto one shape before any filtering happens. */
  const listings = useMemo<Listing[]>(() => {
    const internal: Listing[] = jobs.map((job) => {
      const lpa = job.salary ? parseInt(job.salary.split('-')[0]) : NaN;

      return {
        id: job.id,
        title: job.title,
        company: job.company,
        companyLogo: job.companyLogo,
        location: job.location,
        locationType: job.locationType,
        jobType: job.jobType,
        salaryLabel: job.salary ? `${job.salary} LPA` : null,
        salaryLpa: Number.isNaN(lpa) ? null : lpa,
        postedLabel: new Date(job.createdAt).toLocaleDateString('en-IN', {
          month: 'short',
          day: 'numeric',
        }),
        experience: null,
        href: `/jobs/${job.id}`,
        external: false,
        source: 'talentpath',
      };
    });

    const external: Listing[] = externalJobs.map((job) => ({
      id: job.id,
      title: job.title,
      company: job.company,
      companyLogo: job.companyLogo,
      location: job.location,
      locationType: job.locationType,
      jobType: job.jobType,
      salaryLabel: job.salary,
      salaryLpa: null,
      postedLabel: job.postedOn,
      experience: job.experience,
      // The in-app detail page, not the source — it renders the full description,
      // skills and company profile, and links out to apply from there.
      href: `/jobs/${job.id}`,
      external: true,
      source: 'geeksforgeeks',
    }));

    return [...internal, ...external];
  }, [jobs, externalJobs]);

  const filteredJobs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return listings.filter((job) => {
      if (activeTab === 'internships' ? job.jobType !== 'internship' : job.jobType === 'internship') {
        return false;
      }

      if (
        query &&
        !job.title.toLowerCase().includes(query) &&
        !job.company.toLowerCase().includes(query)
      ) {
        return false;
      }

      if (selectedSources.length > 0 && !selectedSources.includes(job.source)) {
        return false;
      }

      if (selectedJobTypes.length > 0 && !selectedJobTypes.includes(job.jobType)) {
        return false;
      }

      if (selectedLocations.length > 0 && !selectedLocations.includes(job.locationType)) {
        return false;
      }

      if (selectedSalaryRanges.length > 0) {
        // Only listings that state a comparable number can match a range.
        if (job.salaryLpa === null) return false;
        const salary = job.salaryLpa;

        const matches = selectedSalaryRanges.some((range) => {
          if (range === '0-5') return salary >= 0 && salary <= 5;
          if (range === '5-10') return salary >= 5 && salary <= 10;
          if (range === '10-15') return salary >= 10 && salary <= 15;
          if (range === '15+') return salary >= 15;
          return false;
        });

        if (!matches) return false;
      }

      return true;
    });
  }, [
    listings,
    activeTab,
    searchQuery,
    selectedSources,
    selectedJobTypes,
    selectedLocations,
    selectedSalaryRanges,
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery, selectedSources, selectedJobTypes, selectedLocations, selectedSalaryRanges]);

  const toggleFilter = (
    filter: string,
    setFilter: (filters: string[]) => void,
    currentFilters: string[]
  ) => {
    if (currentFilters.includes(filter)) {
      setFilter(currentFilters.filter((f: string) => f !== filter));
    } else {
      setFilter([...currentFilters, filter]);
    }
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedJobTypes([]);
    setSelectedLocations([]);
    setSelectedSalaryRanges([]);
    setSelectedSources([]);
  };

  const indexOfLastJob = currentPage * JOBS_PER_PAGE;
  const currentJobs = filteredJobs.slice(indexOfLastJob - JOBS_PER_PAGE, indexOfLastJob);
  const totalPages = Math.ceil(filteredJobs.length / JOBS_PER_PAGE);

  const hasFilters =
    !!searchQuery ||
    selectedJobTypes.length > 0 ||
    selectedLocations.length > 0 ||
    selectedSalaryRanges.length > 0 ||
    selectedSources.length > 0;

  const jobTypeOptions =
    activeTab === 'jobs'
      ? [
          { value: 'full-time', label: 'Full-time' },
          { value: 'part-time', label: 'Part-time' },
          { value: 'contract', label: 'Contract' },
        ]
      : [{ value: 'internship', label: 'Internship' }];

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-10">
        {/* ── Header ─────────────────────────────────────────────── */}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Jobs &amp; internships
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {loading
              ? 'Loading openings…'
              : `${filteredJobs.length} ${
                  filteredJobs.length === 1 ? 'opening' : 'openings'
                } from TalentPath and GeeksforGeeks.`}
          </p>
        </div>

        {/* ── Segmented switch ───────────────────────────────────── */}
        <div className="mt-6 inline-flex rounded-full border bg-card p-1">
          {(['jobs', 'internships'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-full px-4 py-1.5 text-sm capitalize transition-colors ${
                activeTab === tab
                  ? 'bg-muted font-medium text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-6 lg:flex-row">
          {/* ── Filters ──────────────────────────────────────────── */}
          <aside className="space-y-3 lg:sticky lg:top-24 lg:w-64 lg:shrink-0 lg:self-start">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search roles or companies"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 rounded-xl pl-9 pr-9"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>

            <div className="rounded-2xl border bg-card px-4">
              <Accordion type="multiple" defaultValue={['source']} className="w-full">
                <FilterGroup
                  value="source"
                  label="Source"
                  options={SOURCES}
                  selected={selectedSources}
                  onToggle={(v) => toggleFilter(v, setSelectedSources, selectedSources)}
                />
                <FilterGroup
                  value="job-type"
                  label="Job type"
                  options={jobTypeOptions}
                  selected={selectedJobTypes}
                  onToggle={(v) => toggleFilter(v, setSelectedJobTypes, selectedJobTypes)}
                />
                <FilterGroup
                  value="location"
                  label="Location"
                  options={[
                    { value: 'remote', label: 'Remote' },
                    { value: 'onsite', label: 'Onsite' },
                    { value: 'hybrid', label: 'Hybrid' },
                  ]}
                  selected={selectedLocations}
                  onToggle={(v) => toggleFilter(v, setSelectedLocations, selectedLocations)}
                />
                <FilterGroup
                  value="salary"
                  label="Salary"
                  options={SALARY_RANGES}
                  selected={selectedSalaryRanges}
                  onToggle={(v) =>
                    toggleFilter(v, setSelectedSalaryRanges, selectedSalaryRanges)
                  }
                  note="Applies to TalentPath listings — GeeksforGeeks quotes salary as free text."
                />
              </Accordion>
            </div>

            {hasFilters && (
              <Button
                variant="ghost"
                onClick={clearAllFilters}
                size="sm"
                className="w-full text-muted-foreground"
              >
                Clear all filters
              </Button>
            )}
          </aside>

          {/* ── Listings ─────────────────────────────────────────── */}
          <main className="min-w-0 flex-1">
            {loading ? (
              <div className="divide-y overflow-hidden rounded-2xl border bg-card">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 px-5 py-4">
                    <Skeleton className="size-10 shrink-0 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3.5 w-1/3" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                    <div className="hidden w-28 space-y-2 sm:block">
                      <Skeleton className="ml-auto h-3.5 w-20" />
                      <Skeleton className="ml-auto h-3 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : currentJobs.length === 0 ? (
              <div className="flex flex-col items-center rounded-2xl border bg-card py-16 text-center">
                <Briefcase className="size-6 text-muted-foreground/40" strokeWidth={1.5} />
                <h3 className="mt-4 text-sm font-semibold tracking-tight">
                  No {activeTab} found
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {hasFilters
                    ? 'Try loosening your filters.'
                    : 'Check back soon — new roles are added regularly.'}
                </p>
                {hasFilters && (
                  <Button
                    onClick={clearAllFilters}
                    variant="outline"
                    size="sm"
                    className="mt-4"
                  >
                    Clear filters
                  </Button>
                )}
              </div>
            ) : (
              <>
                <div className="divide-y overflow-hidden rounded-2xl border bg-card">
                  {currentJobs.map((job) => (
                    <JobRow key={job.id} job={job} />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="mt-6 flex items-center justify-between gap-4 border-t pt-6">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setCurrentPage(currentPage - 1);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="size-4" />
                      Previous
                    </Button>

                    <span className="text-sm text-muted-foreground tabular-nums">
                      Page {currentPage} of {totalPages}
                    </span>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setCurrentPage(currentPage + 1);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
