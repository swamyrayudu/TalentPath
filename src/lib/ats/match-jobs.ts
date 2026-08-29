import 'server-only';

import { db } from '@/lib/db';
import { jobs as jobsTable } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getGeeksforgeeksJobs } from '@/lib/jobs/geeksforgeeks';
import type { JobRecommendation, ResumeProfile } from './types';

/**
 * Matching is done in code, not by the model.
 *
 * Ranking ~150 postings by asking an LLM would be slow, cost a call per run and
 * give a different answer each time. Skill overlap is exactly the kind of thing
 * a scoring function does better: it is instant, deterministic, and every match
 * can point at the specific skills that earned it.
 *
 * The model's only job upstream is turning prose into a clean skill list.
 */

/** Different spellings of the same thing, so "JS" on a resume matches "JavaScript" on a posting. */
const ALIASES: Record<string, string> = {
  js: 'javascript',
  ts: 'typescript',
  reactjs: 'react',
  'react.js': 'react',
  nextjs: 'next.js',
  node: 'node.js',
  nodejs: 'node.js',
  express: 'express.js',
  expressjs: 'express.js',
  postgres: 'postgresql',
  psql: 'postgresql',
  mongo: 'mongodb',
  k8s: 'kubernetes',
  gcp: 'google cloud',
  'amazon web services': 'aws',
  ml: 'machine learning',
  ai: 'artificial intelligence',
  dl: 'deep learning',
  nlp: 'natural language processing',
  'c++': 'cpp',
  'c#': 'csharp',
  golang: 'go',
  'rest api': 'rest',
  'restful': 'rest',
  'restful api': 'rest',
  html5: 'html',
  css3: 'css',
  tailwindcss: 'tailwind',
  'spring boot': 'spring',
  springboot: 'spring',
  'ci/cd': 'cicd',
  dsa: 'data structures',
};

/**
 * Terms worth spotting in a free-text job description. Internal listings have no
 * skills column, so the requirements text is mined for these.
 */
const TECH_TERMS = [
  'javascript', 'typescript', 'python', 'java', 'cpp', 'csharp', 'go', 'rust', 'php', 'ruby', 'kotlin', 'swift', 'scala', 'r',
  'react', 'next.js', 'angular', 'vue', 'svelte', 'redux', 'html', 'css', 'tailwind', 'bootstrap', 'sass', 'jquery',
  'node.js', 'express.js', 'django', 'flask', 'fastapi', 'spring', 'laravel', 'rails', '.net', 'graphql', 'rest', 'grpc',
  'sql', 'postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch', 'cassandra', 'dynamodb', 'sqlite', 'oracle',
  'aws', 'azure', 'google cloud', 'docker', 'kubernetes', 'terraform', 'jenkins', 'cicd', 'linux', 'nginx', 'git', 'github',
  'machine learning', 'deep learning', 'artificial intelligence', 'natural language processing', 'pytorch', 'tensorflow',
  'pandas', 'numpy', 'scikit-learn', 'opencv', 'data structures', 'algorithms',
  'android', 'ios', 'flutter', 'react native', 'unity',
  'figma', 'jira', 'agile', 'scrum', 'selenium', 'cypress', 'jest', 'junit', 'pytest', 'power bi', 'tableau', 'excel',
  'kafka', 'rabbitmq', 'spark', 'hadoop', 'airflow', 'snowflake', 'dbt',
];

const SENIORITY_RANK: Record<ResumeProfile['seniority'], number> = {
  intern: 0,
  fresher: 0,
  junior: 1,
  mid: 2,
  senior: 3,
  unknown: 1,
};

function canonical(term: string): string {
  const t = term.trim().toLowerCase().replace(/\s+/g, ' ');
  return ALIASES[t] ?? t;
}

function canonicalSet(terms: string[]): Set<string> {
  return new Set(terms.map(canonical).filter(Boolean));
}

/** Pulls known technology terms out of a free-text posting. */
function mineTerms(text: string): string[] {
  const haystack = ` ${text.toLowerCase().replace(/[^a-z0-9+#. ]/g, ' ').replace(/\s+/g, ' ')} `;
  return TECH_TERMS.filter((term) => haystack.includes(` ${term} `));
}

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'for', 'of', 'in', 'to', 'with', 'at', 'on',
  'jr', 'sr', 'i', 'ii', 'iii', 'intern', 'internship', 'trainee', 'fresher',
  'junior', 'senior', 'lead', 'staff', 'principal', 'associate', 'executive',
]);

function titleTokens(title: string): Set<string> {
  return new Set(
    title
      .toLowerCase()
      .split(/[^a-z0-9+#.]+/)
      .filter((w) => w.length > 1 && !STOP_WORDS.has(w)),
  );
}

function inferSeniority(text: string): number {
  const t = text.toLowerCase();
  if (/\b(intern|internship|trainee)\b/.test(t)) return 0;
  if (/\b(senior|sr\.?|lead|principal|staff|architect)\b/.test(t)) return 3;
  if (/\b(junior|jr\.?|entry[- ]level|fresher|graduate)\b/.test(t)) return 1;
  return 2;
}

interface Candidate {
  id: string;
  title: string;
  company: string;
  companyLogo: string | null;
  location: string;
  jobType: string;
  locationType: string;
  salaryLabel: string | null;
  href: string;
  source: 'talentpath' | 'geeksforgeeks';
  skills: string[];
  seniorityRank: number;
}

function scoreCandidate(
  candidate: Candidate,
  resumeSkills: Set<string>,
  roleTokens: Set<string>,
  resumeRank: number,
): JobRecommendation | null {
  const jobSkills = canonicalSet(candidate.skills);
  if (jobSkills.size === 0 && roleTokens.size === 0) return null;

  const matched: string[] = [];
  const missing: string[] = [];
  for (const skill of jobSkills) {
    (resumeSkills.has(skill) ? matched : missing).push(skill);
  }

  // Skills, 60 points. Measured against the posting's requirements, capped at 6
  // so a listing with 12 tags is not unreachable.
  const denominator = Math.max(3, Math.min(6, jobSkills.size));
  const skillScore = jobSkills.size ? Math.min(1, matched.length / denominator) * 60 : 0;

  // Title, 25 points.
  const jobTokens = titleTokens(candidate.title);
  let titleHits = 0;
  for (const token of jobTokens) if (roleTokens.has(token)) titleHits++;
  const titleScore = jobTokens.size ? Math.min(1, titleHits / Math.min(3, jobTokens.size)) * 25 : 0;

  // Seniority, 15 points. One level either way is still a reasonable apply.
  const levelDelta = candidate.seniorityRank - resumeRank;
  const gap = Math.abs(levelDelta);
  const seniorityScore = gap === 0 ? 15 : gap === 1 ? 9 : gap === 2 ? 3 : 0;

  let matchScore = skillScore + titleScore + seniorityScore;

  // Being two or more levels under-qualified is not the same as being over it.
  // Strong skill overlap alone would otherwise float senior roles to the top of
  // a fresher's list, which is a waste of their time.
  if (levelDelta >= 2) matchScore *= 0.75;

  matchScore = Math.round(matchScore);
  if (matchScore < 20) return null;

  const reason = matched.length
    ? `Your ${matched.slice(0, 3).join(', ')} experience lines up with this role.`
    : 'The role title matches what your resume is aimed at.';

  return {
    id: candidate.id,
    title: candidate.title,
    company: candidate.company,
    companyLogo: candidate.companyLogo,
    location: candidate.location,
    jobType: candidate.jobType,
    locationType: candidate.locationType,
    salaryLabel: candidate.salaryLabel,
    href: candidate.href,
    source: candidate.source,
    matchScore,
    matchedSkills: matched.slice(0, 8),
    missingSkills: missing.slice(0, 6),
    reason,
  };
}

export async function recommendJobs(
  profile: ResumeProfile,
  { limit = 8 }: { limit?: number } = {},
): Promise<JobRecommendation[]> {
  const resumeSkills = canonicalSet(profile.skills);
  if (resumeSkills.size === 0 && profile.targetRoles.length === 0) return [];

  const roleTokens = new Set<string>();
  for (const role of profile.targetRoles) {
    for (const token of titleTokens(role)) roleTokens.add(token);
  }
  // Skills help the title match too — a "React" resume should surface "React Developer".
  for (const skill of resumeSkills) roleTokens.add(skill);

  const resumeRank = SENIORITY_RANK[profile.seniority];

  const [internal, external] = await Promise.all([
    db.select().from(jobsTable).where(eq(jobsTable.isActive, true)).catch((error) => {
      console.error('[ats] internal job lookup failed:', error);
      return [];
    }),
    getGeeksforgeeksJobs()
      .then((r) => r.jobs)
      .catch((error) => {
        console.error('[ats] external job lookup failed:', error);
        return [];
      }),
  ]);

  const candidates: Candidate[] = [
    ...internal.map((job) => ({
      id: job.id,
      title: job.title,
      company: job.company,
      companyLogo: job.companyLogo,
      location: job.location,
      jobType: job.jobType,
      locationType: job.locationType,
      salaryLabel: job.salary ? `${job.salary} LPA` : null,
      href: `/jobs/${job.id}`,
      source: 'talentpath' as const,
      // No skills column on internal listings, so mine the text.
      skills: mineTerms(`${job.title} ${job.description} ${job.requirements}`),
      seniorityRank: inferSeniority(`${job.title} ${job.jobType}`),
    })),
    ...external.map((job) => ({
      id: job.id,
      title: job.title,
      company: job.company,
      companyLogo: job.companyLogo,
      location: job.location,
      jobType: job.jobType,
      locationType: job.locationType,
      salaryLabel: job.salary,
      href: `/jobs/${job.id}`,
      source: 'geeksforgeeks' as const,
      // Their tags are good but sparse — top them up from the description.
      skills: [...new Set([...job.skills, ...mineTerms(`${job.title} ${job.description}`)])],
      seniorityRank: inferSeniority(`${job.title} ${job.jobType} ${job.experienceLevel ?? ''}`),
    })),
  ];

  return candidates
    .map((c) => scoreCandidate(c, resumeSkills, roleTokens, resumeRank))
    .filter((r): r is JobRecommendation => r !== null)
    .sort((a, b) => b.matchScore - a.matchScore || a.title.localeCompare(b.title))
    .slice(0, limit);
}
