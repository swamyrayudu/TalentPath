import 'server-only';

import { getCachedData, setCachedData } from '@/lib/redis';
import { htmlToMarkdown, htmlToPlainText } from './html-to-markdown';

/**
 * GeeksforGeeks publishes its job board through a public, paginated JSON API.
 * We pull the newest few pages once a day and cache the normalised result, so
 * the jobs page never waits on their server and we never hammer it.
 */
const GFG_API = 'https://practiceapi.geeksforgeeks.org/api/latest/jobs/';
const GFG_JOB_URL = 'https://www.geeksforgeeks.org/jobs/';

// v3 carries the full job description and company profile; v2 entries lack them.
const CACHE_KEY = 'jobs:external:geeksforgeeks:v3';

/** How old the cached sweep may get before we refresh it. */
const REFRESH_AFTER_MS = 24 * 60 * 60 * 1000;

/** Kept well past the refresh window so there is always something to serve. */
const CACHE_TTL_SECONDS = 7 * 24 * 60 * 60;

/**
 * Their API returns 21k+ rows, but all but ~150 are `Archived` expired postings:
 * the live ones cluster in the newest few hundred. So we sweep with the largest
 * page size they allow and stop once several pages in a row hold nothing open,
 * which captures every applicable job in a handful of requests.
 */
const PAGE_SIZE = 500;
const MAX_PAGES = 6;

export type ExternalJobType = 'full-time' | 'part-time' | 'contract' | 'internship';
export type ExternalLocationType = 'remote' | 'onsite' | 'hybrid';

/** The fields every job row on /jobs needs. Kept free of the bulky prose. */
export interface ExternalJobSummary {
  id: string;
  title: string;
  company: string;
  companyLogo: string | null;
  location: string;
  locationType: ExternalLocationType;
  jobType: ExternalJobType;
  /** Free text as the source writes it — never a parsed number. */
  salary: string | null;
  experience: string | null;
  experienceLevel: string | null;
  /** The source's own category, e.g. "Technology & Engineering". */
  category: string | null;
  skills: string[];
  postedOn: string | null;
  lastApplyDate: string | null;
  applyUrl: string;
  source: 'geeksforgeeks';
}

/** Everything the detail page renders. */
export interface ExternalJob extends ExternalJobSummary {
  /** The full job description, converted from the source's HTML to Markdown. */
  description: string;
  /** First couple of lines of the description, as plain text. */
  summary: string;
  companyAbout: string;
  companyWebsite: string | null;
}

/** Bulky fields that only the detail page needs. */
const DETAIL_ONLY = ['description', 'summary', 'companyAbout', 'companyWebsite'] as const;

export function toSummary(job: ExternalJob): ExternalJobSummary {
  const light = { ...job } as Partial<ExternalJob>;
  for (const key of DETAIL_ONLY) delete light[key];
  return light as ExternalJobSummary;
}

interface GfgJob {
  job_id?: string;
  slug?: string;
  role?: string | null;
  designation?: { text?: string } | null;
  organization?: {
    name?: string;
    logo?: string | null;
    /** WYSIWYG HTML. */
    about?: string | null;
    website?: string | null;
  } | null;
  location?: string[] | null;
  location_type?: string | null;
  employment_type?: string | null;
  salary?: string | null;
  experience?: string | null;
  experience_level?: string | null;
  /** WYSIWYG HTML — the actual job description. */
  description?: string | null;
  job_type?: string | null;
  skills?: string[] | null;
  status?: string | null;
  job_posted_on?: string | null;
  last_apply_date?: string | null;
  apply_link?: string | null;
}

const EMPLOYMENT_TYPES: Record<string, ExternalJobType> = {
  'full time': 'full-time',
  'part time': 'part-time',
  internship: 'internship',
  'internship + ppo': 'internship',
  freelancer: 'contract',
  contract: 'contract',
};

const LOCATION_TYPES: Record<string, ExternalLocationType> = {
  onsite: 'onsite',
  remote: 'remote',
  hybrid: 'hybrid',
};

function normalize(job: GfgJob): ExternalJob | null {
  const id = job.job_id;
  const title = job.designation?.text?.trim() || job.role?.trim();
  const company = job.organization?.name?.trim();

  // Without an id, a title and somewhere to apply, a listing is not usable.
  if (!id || !title || !company) return null;

  const applyUrl = job.apply_link?.trim() || (job.slug ? `${GFG_JOB_URL}${job.slug}/` : null);
  if (!applyUrl) return null;

  const employment = (job.employment_type || '').trim().toLowerCase();
  const locationType = (job.location_type || '').trim().toLowerCase();
  const locations = (job.location || []).filter(Boolean);

  // Some listings repeat the employment type in the experience field; showing
  // "Internship · Internship" on a row helps nobody.
  const experience = job.experience?.trim() || null;
  const experienceLabel =
    experience && experience.toLowerCase() !== employment ? experience : null;

  const description = htmlToMarkdown(job.description);

  return {
    id: `gfg-${id}`,
    title,
    company,
    companyLogo: job.organization?.logo || null,
    location: locations.length ? locations.join(', ') : 'Not specified',
    locationType: LOCATION_TYPES[locationType] ?? 'onsite',
    jobType: EMPLOYMENT_TYPES[employment] ?? 'full-time',
    salary: job.salary?.trim() || null,
    experience: experienceLabel,
    experienceLevel: job.experience_level?.trim() || null,
    category: job.job_type?.trim() || null,
    // The full list — the row UI truncates, but the detail page shows every one.
    skills: (job.skills || []).map((s) => s?.trim()).filter(Boolean) as string[],
    postedOn: job.job_posted_on?.trim() || null,
    lastApplyDate: job.last_apply_date || null,
    applyUrl,
    source: 'geeksforgeeks',
    description,
    summary: htmlToPlainText(job.description, 220),
    companyAbout: htmlToMarkdown(job.organization?.about),
    companyWebsite: normalizeWebsite(job.organization?.website),
  };
}

/** Only absolute http(s) URLs are linkable. */
function normalizeWebsite(website: string | null | undefined): string | null {
  const trimmed = website?.trim();
  if (!trimmed) return null;
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(withScheme);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}

async function fetchPage(page: number): Promise<GfgJob[]> {
  const response = await fetch(`${GFG_API}?page=${page}&page_size=${PAGE_SIZE}`, {
    headers: {
      accept: 'application/json',
      // Their edge rejects requests without a browser-ish UA.
      'user-agent': 'Mozilla/5.0 (compatible; TalentPath/1.0)',
      referer: 'https://www.geeksforgeeks.org/',
    },
    // We do our own daily caching in Redis.
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`GeeksforGeeks jobs API returned ${response.status}`);
  }

  const data = (await response.json()) as { results?: GfgJob[] };
  return data.results ?? [];
}

/** Fetches straight from the source, bypassing the cache. */
export async function fetchGeeksforgeeksJobs(maxPages = MAX_PAGES): Promise<ExternalJob[]> {
  // Pages are ~2MB each, so fetch them together rather than one after another —
  // sequentially this sweep takes about a minute.
  const batches = await Promise.all(
    Array.from({ length: maxPages }, (_, i) =>
      fetchPage(i + 1).catch((error) => {
        // One bad page shouldn't lose the rest of the sweep.
        console.error(`[jobs] GeeksforGeeks page ${i + 1} failed:`, error);
        return [] as GfgJob[];
      })
    )
  );

  const seen = new Set<string>();
  const jobs: ExternalJob[] = [];

  for (const batch of batches) {
    for (const raw of batch) {
      // Archived postings still come back from the API but can no longer be applied to.
      if ((raw.status || '').toLowerCase() !== 'published') continue;

      const job = normalize(raw);
      if (!job || seen.has(job.id)) continue;

      seen.add(job.id);
      jobs.push(job);
    }
  }

  return jobs;
}

interface CacheEntry {
  fetchedAt: number;
  jobs: ExternalJob[];
}

/** Guards against a burst of requests all kicking off the same refresh. */
let refreshInFlight: Promise<unknown> | null = null;

async function refresh(): Promise<ExternalJob[]> {
  const jobs = await fetchGeeksforgeeksJobs();
  if (jobs.length > 0) {
    const entry: CacheEntry = { fetchedAt: Date.now(), jobs };
    await setCachedData(CACHE_KEY, entry, CACHE_TTL_SECONDS);
  }
  return jobs;
}

function refreshInBackground() {
  if (refreshInFlight) return;
  refreshInFlight = refresh()
    .catch((error) => console.error('[jobs] GeeksforGeeks refresh failed:', error))
    .finally(() => {
      refreshInFlight = null;
    });
}

/**
 * The list the app renders. Stale-while-revalidate: a cached sweep is returned
 * straight away and refreshed in the background once it passes a day old, so a
 * visitor never pays for the ~18s upstream sweep. Only the very first call
 * (cold cache) waits for it.
 */
export async function getGeeksforgeeksJobs(
  { force = false }: { force?: boolean } = {}
): Promise<{ jobs: ExternalJob[]; cached: boolean; fetchedAt: number | null }> {
  if (force) {
    const jobs = await refresh();
    return { jobs, cached: false, fetchedAt: Date.now() };
  }

  const entry = await getCachedData<CacheEntry>(CACHE_KEY);

  if (entry && Array.isArray(entry.jobs) && entry.jobs.length > 0) {
    if (Date.now() - entry.fetchedAt > REFRESH_AFTER_MS) {
      refreshInBackground();
    }
    return { jobs: entry.jobs, cached: true, fetchedAt: entry.fetchedAt };
  }

  try {
    const jobs = await refresh();
    return { jobs, cached: false, fetchedAt: Date.now() };
  } catch (error) {
    console.error('[jobs] GeeksforGeeks fetch failed:', error);
    return { jobs: [], cached: false, fetchedAt: null };
  }
}

/**
 * The same feed without the descriptions. The board renders ~150 rows and shows
 * none of the prose, so sending it would roughly quadruple the payload for
 * nothing — the detail page fetches the full record by id instead.
 */
export async function getGeeksforgeeksJobSummaries(
  options: { force?: boolean } = {},
): Promise<{ jobs: ExternalJobSummary[]; cached: boolean; fetchedAt: number | null }> {
  const { jobs, cached, fetchedAt } = await getGeeksforgeeksJobs(options);
  return { jobs: jobs.map(toSummary), cached, fetchedAt };
}

/** One job by its prefixed id (`gfg-<job_id>`), or null if it is no longer live. */
export async function getGeeksforgeeksJob(id: string): Promise<ExternalJob | null> {
  if (!isExternalJobId(id)) return null;
  const { jobs } = await getGeeksforgeeksJobs();
  return jobs.find((job) => job.id === id) ?? null;
}

/** True for ids this module owns, so the detail route knows not to hit the DB. */
export function isExternalJobId(id: string): boolean {
  return typeof id === 'string' && id.startsWith('gfg-');
}
