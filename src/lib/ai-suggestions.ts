import 'server-only';

import { getCachedData, setCachedData } from '@/lib/redis';

/**
 * Turns a learner's own numbers into a handful of "do this next" suggestions.
 *
 * The model gets a compact profile — never raw rows — and must answer in JSON.
 * Every failure path (no key, bad JSON, network) falls through to the rule-based
 * suggestions below, so the dashboard always has something useful to show.
 */

export type SuggestionFocus =
  | 'daily'
  | 'dsa'
  | 'aptitude'
  | 'contest'
  | 'interview'
  | 'roadmap'
  | 'jobs';

export interface Suggestion {
  title: string;
  detail: string;
  focus: SuggestionFocus;
}

export interface LearnerProfile {
  solvedTotal: number;
  easy: number;
  medium: number;
  hard: number;
  solvedThisWeek: number;
  daysSinceLastSolve: number | null;
  topTopics: string[];
  missingTopics: string[];
  aptitudeTests: number;
  aptitudeAverage: number;
  aptitudeWeakest: { topic: string; score: number } | null;
  aptitudeStrongest: { topic: string; score: number } | null;
  contestSubmissions: number;
  contestAcceptance: number | null;
  contestSolved: number;
  dailyStreak: number;
  dailyLongest: number;
  dailyThisMonth: number;
  dailySolvedToday: boolean;
  interviewsCompleted: number;
}

const SUGGESTIONS_TTL = 6 * 60 * 60; // 6 hours

export const getSuggestionsCacheKey = (userId: string) => `ai:suggestions:${userId}`;

export const FOCUS_LINKS: Record<SuggestionFocus, { href: string; label: string }> = {
  daily: { href: '/dsasheet#daily-problem', label: 'Today’s problem' },
  dsa: { href: '/dsasheet', label: 'Open DSA sheet' },
  aptitude: { href: '/aptitude', label: 'Take a test' },
  contest: { href: '/contest', label: 'Browse contests' },
  interview: { href: '/interview', label: 'Mock interview' },
  roadmap: { href: '/roadmap', label: 'View roadmap' },
  jobs: { href: '/jobs', label: 'See jobs' },
};

const VALID_FOCUS = new Set<string>(Object.keys(FOCUS_LINKS));

/** Topics an interview loop keeps coming back to, used to spot coverage gaps. */
export const CORE_TOPICS = [
  'Array',
  'String',
  'Hash Table',
  'Two Pointers',
  'Binary Search',
  'Sliding Window',
  'Linked List',
  'Stack',
  'Tree',
  'Graph',
  'Dynamic Programming',
  'Greedy',
  'Backtracking',
  'Heap (Priority Queue)',
];

/* ── Rule-based fallback ─────────────────────────────────────────── */

/**
 * Deterministic advice from the same profile. Used when the model is
 * unavailable, and as the floor for suggestion quality.
 */
export function ruleBasedSuggestions(p: LearnerProfile): Suggestion[] {
  const out: Suggestion[] = [];

  if (p.solvedTotal === 0 && p.aptitudeTests === 0 && p.contestSubmissions === 0) {
    return [
      {
        title: 'Solve today’s daily problem',
        detail:
          'One problem a day is the cheapest habit to build. Start the streak today and the rest of the dashboard fills in on its own.',
        focus: 'daily',
      },
      {
        title: 'Take a baseline aptitude test',
        detail:
          'Ten minutes tells you which quantitative topics need work before placement season.',
        focus: 'aptitude',
      },
      {
        title: 'Pick a pattern to work through',
        detail:
          'Arrays and two pointers are the shortest path to your first ten solved problems.',
        focus: 'dsa',
      },
    ];
  }

  if (!p.dailySolvedToday) {
    out.push({
      title:
        p.dailyStreak > 0
          ? `Keep your ${p.dailyStreak}-day streak alive`
          : 'Start a daily streak today',
      detail:
        p.dailyStreak > 0
          ? 'Today’s problem is still open. Solving it now keeps the streak intact.'
          : 'A single problem today puts the first mark on the calendar. Consistency beats volume.',
      focus: 'daily',
    });
  }

  if (p.solvedTotal >= 15) {
    const hardShare = p.hard / p.solvedTotal;
    if (hardShare < 0.12) {
      out.push({
        title: 'Your mix is light on hard problems',
        detail: `Only ${p.hard} of your ${p.solvedTotal} solves are hard. Add one hard problem a week — interviews rarely stop at medium.`,
        focus: 'dsa',
      });
    }
  }

  if (p.missingTopics.length > 0) {
    out.push({
      title: `You haven’t touched ${p.missingTopics[0]}`,
      detail: `${p.missingTopics.slice(0, 3).join(', ')} are missing from your solved set and show up in most interview loops.`,
      focus: 'dsa',
    });
  }

  if (p.aptitudeWeakest && p.aptitudeWeakest.score < 65) {
    out.push({
      title: `Aptitude: ${p.aptitudeWeakest.topic} is your weak spot`,
      detail: `You average ${p.aptitudeWeakest.score}% there. Two more attempts should move it into safe territory.`,
      focus: 'aptitude',
    });
  } else if (p.aptitudeTests === 0) {
    out.push({
      title: 'No aptitude baseline yet',
      detail: 'Most placement rounds start with aptitude. One test tells you where you stand.',
      focus: 'aptitude',
    });
  }

  if (p.contestSubmissions === 0 && p.solvedTotal >= 10) {
    out.push({
      title: 'Try solving under a clock',
      detail:
        'You solve well at your own pace. A contest adds the time pressure that interviews actually have.',
      focus: 'contest',
    });
  } else if (p.contestAcceptance !== null && p.contestAcceptance < 40) {
    out.push({
      title: 'Contest acceptance is low',
      detail: `${p.contestAcceptance}% of your contest submissions pass. Slow down on edge cases before hitting submit.`,
      focus: 'contest',
    });
  }

  if (p.interviewsCompleted === 0 && p.solvedTotal >= 25) {
    out.push({
      title: 'You’re ready for a mock interview',
      detail: 'Explaining your approach out loud is a separate skill from solving. Try one round.',
      focus: 'interview',
    });
  }

  if (p.daysSinceLastSolve !== null && p.daysSinceLastSolve >= 5) {
    out.unshift({
      title: `${p.daysSinceLastSolve} days since your last solve`,
      detail: 'Pick one easy problem to get moving again — restarting is harder than continuing.',
      focus: 'dsa',
    });
  }

  return out.slice(0, 4);
}

/* ── Model-generated suggestions ─────────────────────────────────── */

function buildPrompt(p: LearnerProfile): string {
  const lines = [
    `Problems solved: ${p.solvedTotal} (easy ${p.easy}, medium ${p.medium}, hard ${p.hard})`,
    `Solved in the last 7 days: ${p.solvedThisWeek}`,
    p.daysSinceLastSolve === null
      ? 'Last solve: never'
      : `Days since last solve: ${p.daysSinceLastSolve}`,
    p.topTopics.length ? `Strongest topics by volume: ${p.topTopics.join(', ')}` : 'No topic data',
    p.missingTopics.length
      ? `Core topics never attempted: ${p.missingTopics.join(', ')}`
      : 'All core topics attempted at least once',
    `Daily-problem streak: ${p.dailyStreak} days (longest ${p.dailyLongest}, ${p.dailyThisMonth} this month, today ${p.dailySolvedToday ? 'done' : 'not done'})`,
    `Aptitude tests: ${p.aptitudeTests}, average ${p.aptitudeAverage}%`,
    p.aptitudeWeakest
      ? `Weakest aptitude topic: ${p.aptitudeWeakest.topic} at ${p.aptitudeWeakest.score}%`
      : 'No aptitude topic data',
    p.aptitudeStrongest
      ? `Strongest aptitude topic: ${p.aptitudeStrongest.topic} at ${p.aptitudeStrongest.score}%`
      : '',
    `Contest: ${p.contestSubmissions} submissions, ${p.contestSolved} problems solved${
      p.contestAcceptance !== null ? `, ${p.contestAcceptance}% acceptance` : ''
    }`,
    `Mock interviews completed: ${p.interviewsCompleted}`,
  ].filter(Boolean);

  return `Here is one learner's preparation data on TalentPath:

${lines.join('\n')}

Give exactly 3 suggestions for what this learner should do next.`;
}

const SYSTEM_PROMPT = `You are a placement-preparation coach on TalentPath, a platform where students practise DSA problems, aptitude tests, coding contests, and mock interviews.

You are given one learner's statistics. Reply with ONLY a JSON array — no prose, no markdown fences — of objects shaped:
{"title": string, "detail": string, "focus": "daily"|"dsa"|"aptitude"|"contest"|"interview"|"roadmap"|"jobs"}

Rules:
- title: sentence case, under 60 characters, specific to their numbers, no generic pep talk.
- detail: one or two sentences, under 200 characters, and it must cite a number from their data.
- focus: the platform area the suggestion sends them to.
- Prioritise the biggest actual gap. Do not repeat the same focus twice.
- Address the learner as "you". Never invent statistics you were not given.`;

interface ChatChoice {
  message?: { content?: string };
}

function parseSuggestions(raw: string): Suggestion[] {
  // Models like to wrap JSON in fences even when told not to.
  const cleaned = raw
    .replace(/```(?:json)?/gi, '')
    .replace(/```/g, '')
    .trim();

  const start = cleaned.indexOf('[');
  const end = cleaned.lastIndexOf(']');
  if (start === -1 || end === -1) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    return [];
  }

  if (!Array.isArray(parsed)) return [];

  return parsed
    .map(item => item as Partial<Suggestion>)
    .filter(
      (item): item is Suggestion =>
        typeof item?.title === 'string' &&
        typeof item?.detail === 'string' &&
        typeof item?.focus === 'string' &&
        VALID_FOCUS.has(item.focus)
    )
    .map(item => ({
      title: item.title.slice(0, 90),
      detail: item.detail.slice(0, 240),
      focus: item.focus,
    }))
    .slice(0, 4);
}

async function generateSuggestions(profile: LearnerProfile): Promise<Suggestion[]> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.PERPLEXITY_API_KEY;
  if (!apiKey) return [];

  const isGemini = !!process.env.GEMINI_API_KEY;
  const endpoint = isGemini
    ? 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions'
    : 'https://api.perplexity.ai/chat/completions';
  const model = isGemini ? 'gemini-2.5-flash' : 'sonar';

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: buildPrompt(profile) },
        ],
        temperature: 0.4,
        // Gemini 2.5 spends ~1.3k tokens thinking before it writes anything, and
        // that counts against this budget — a smaller cap truncates the JSON.
        max_tokens: 2048,
      }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    if (!response.ok) {
      console.error('[AI Suggestions] Provider returned', response.status);
      return [];
    }

    const data = (await response.json()) as { choices?: ChatChoice[] };
    const content = data.choices?.[0]?.message?.content;
    return content ? parseSuggestions(content) : [];
  } catch (error) {
    console.error('[AI Suggestions] Generation failed:', error);
    return [];
  }
}

export interface SuggestionResult {
  suggestions: Suggestion[];
  source: 'ai' | 'rules';
  generatedAt: string;
}

/**
 * Cached per user. The cache key carries a fingerprint of the profile so the
 * advice refreshes as soon as the numbers behind it move, not on a timer.
 */
export async function getAiSuggestions(
  userId: string,
  profile: LearnerProfile
): Promise<SuggestionResult> {
  const fingerprint = [
    profile.solvedTotal,
    profile.hard,
    profile.solvedThisWeek,
    profile.aptitudeTests,
    profile.aptitudeAverage,
    profile.contestSubmissions,
    profile.dailyStreak,
    profile.dailySolvedToday ? 1 : 0,
    profile.interviewsCompleted,
  ].join('-');

  const key = `${getSuggestionsCacheKey(userId)}:${fingerprint}`;
  const cached = await getCachedData<SuggestionResult>(key);
  if (cached) return cached;

  const aiSuggestions = await generateSuggestions(profile);
  const result: SuggestionResult = aiSuggestions.length
    ? { suggestions: aiSuggestions, source: 'ai', generatedAt: new Date().toISOString() }
    : {
        suggestions: ruleBasedSuggestions(profile),
        source: 'rules',
        generatedAt: new Date().toISOString(),
      };

  // Only worth caching a real answer; rules are cheap to recompute.
  if (result.source === 'ai') {
    await setCachedData(key, result, SUGGESTIONS_TTL);
  }

  return result;
}
