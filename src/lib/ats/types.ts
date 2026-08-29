export type Severity = 'high' | 'medium' | 'low';

export interface ScoreCategory {
  id: string;
  label: string;
  score: number;
  max: number;
  /** One line explaining the number. */
  detail: string;
}

export interface Improvement {
  issue: string;
  fix: string;
  severity: Severity;
}

export interface ResumeProfile {
  skills: string[];
  /** Job titles the resume is aimed at, e.g. "Backend Developer". */
  targetRoles: string[];
  seniority: 'intern' | 'fresher' | 'junior' | 'mid' | 'senior' | 'unknown';
  yearsExperience: number | null;
  education: string[];
  domains: string[];
}

export interface KeywordMatch {
  matched: string[];
  missing: string[];
}

export interface AtsAnalysis {
  score: number;
  verdict: string;
  categories: ScoreCategory[];
  strengths: string[];
  improvements: Improvement[];
  /** Only meaningful when a job description was supplied. */
  keywords: KeywordMatch | null;
  profile: ResumeProfile;
  /** True when the score came from the deterministic checks alone. */
  degraded: boolean;
}

export interface JobRecommendation {
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
  /** 0-100. How well the resume lines up with this posting. */
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  reason: string;
}
