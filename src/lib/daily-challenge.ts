import 'server-only';

import { db } from '@/lib/db';
import { dailyChallenges, dailyChallengeCompletions } from '@/lib/db/schema';
import { and, eq, gte, lte, desc, sql } from 'drizzle-orm';

/**
 * Daily challenge — one problem a day, the same problem for everyone, keyed on
 * the UTC calendar date so the day flips at the same instant for every user.
 */

export interface DailyProblem {
  challengeDate: string;
  problemId: number;
  title: string;
  slug: string | null;
  difficulty: string;
  platform: string | null;
  url: string | null;
  topics: string[];
  acceptanceRate: number | null;
}

export interface DailyCalendarDay {
  date: string;
  dayOfMonth: number;
  isToday: boolean;
  isFuture: boolean;
  completed: boolean;
}

export interface DailyStreak {
  current: number;
  longest: number;
  completedThisMonth: number;
  daysInMonth: number;
  totalCompleted: number;
  solvedToday: boolean;
  monthLabel: string;
  calendar: DailyCalendarDay[];
}

/** 'YYYY-MM-DD' in UTC. */
export function toDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function todayKey(): string {
  return toDateKey(new Date());
}

/**
 * postgres-js hands back `DATE` columns as Date objects, so every read has to
 * come through here before it is compared against a 'YYYY-MM-DD' key.
 */
export function normalizeDateKey(value: unknown): string {
  if (value instanceof Date) return toDateKey(value);
  return String(value).slice(0, 10);
}

export function addDays(dateKey: string, delta: number): string {
  const d = new Date(`${dateKey}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return toDateKey(d);
}

/** Stable 32-bit hash so a given date always resolves to the same problem. */
function seedFromDate(dateKey: string): number {
  let h = 2166136261;
  for (let i = 0; i < dateKey.length; i++) {
    h ^= dateKey.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

// A week's worth of difficulty so nobody gets seven hard problems in a row.
const DIFFICULTY_CYCLE = ['EASY', 'MEDIUM', 'MEDIUM', 'HARD', 'MEDIUM', 'MEDIUM', 'EASY'];

function difficultyForDate(dateKey: string): string {
  const dayOfWeek = new Date(`${dateKey}T00:00:00.000Z`).getUTCDay();
  return DIFFICULTY_CYCLE[dayOfWeek];
}

function parseTopics(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map(t => (typeof t === 'string' ? t : (t as { name?: string })?.name))
    .filter((t): t is string => Boolean(t))
    .slice(0, 4);
}

interface ProblemRow {
  id: number | string;
  title: string | null;
  slug: string | null;
  difficulty: string | null;
  platform: string | null;
  url: string | null;
  topic_tags: unknown;
  acceptance_rate: string | null;
}

async function countEligible(difficulty: string | null): Promise<number> {
  const rows = (await db.execute(sql`
    SELECT COUNT(*)::int AS count
    FROM visible_problems
    WHERE (is_visible_to_users IS TRUE OR is_visible_to_users IS NULL)
      AND title IS NOT NULL
      AND url IS NOT NULL
      ${difficulty ? sql`AND UPPER(difficulty) = ${difficulty}` : sql``}
  `)) as unknown as { count: number }[];

  return Number(rows[0]?.count ?? 0);
}

async function pickProblemForDate(dateKey: string): Promise<ProblemRow | null> {
  const difficulty = difficultyForDate(dateKey);

  // Fall back to the whole pool if this difficulty happens to be empty.
  let total = await countEligible(difficulty);
  const useDifficulty = total > 0;
  if (!useDifficulty) total = await countEligible(null);
  if (!total) return null;

  const offset = seedFromDate(dateKey) % total;

  const rows = (await db.execute(sql`
    SELECT id, title, slug, difficulty, platform, url, topic_tags, acceptance_rate
    FROM visible_problems
    WHERE (is_visible_to_users IS TRUE OR is_visible_to_users IS NULL)
      AND title IS NOT NULL
      AND url IS NOT NULL
      ${useDifficulty ? sql`AND UPPER(difficulty) = ${difficulty}` : sql``}
    ORDER BY id
    OFFSET ${offset}
    LIMIT 1
  `)) as unknown as ProblemRow[];

  return rows[0] ?? null;
}

function toDailyProblem(dateKey: string, row: ProblemRow): DailyProblem {
  return {
    challengeDate: dateKey,
    problemId: Number(row.id),
    title: row.title ?? 'Untitled problem',
    slug: row.slug,
    difficulty: (row.difficulty ?? 'MEDIUM').toUpperCase(),
    platform: row.platform,
    url: row.url,
    topics: parseTopics(row.topic_tags),
    acceptanceRate: row.acceptance_rate ? Number(row.acceptance_rate) : null,
  };
}

/**
 * The challenge for a date, creating it on first request. Concurrent first
 * requests race on the unique index; `onConflictDoNothing` lets the loser keep
 * serving the same problem it just picked, which is the winner's row anyway
 * because the pick is deterministic.
 */
export async function getOrCreateDailyChallenge(
  dateKey: string = todayKey()
): Promise<DailyProblem | null> {
  const existing = (await db.execute(sql`
    SELECT
      vp.id, vp.title, vp.slug, vp.difficulty, vp.platform, vp.url,
      vp.topic_tags, vp.acceptance_rate
    FROM daily_challenges dc
    JOIN visible_problems vp ON vp.id = dc.problem_id
    WHERE dc.challenge_date = ${dateKey}
    LIMIT 1
  `)) as unknown as ProblemRow[];

  if (existing[0]) return toDailyProblem(dateKey, existing[0]);

  const picked = await pickProblemForDate(dateKey);
  if (!picked) return null;

  try {
    await db
      .insert(dailyChallenges)
      .values({
        challengeDate: dateKey,
        problemId: Number(picked.id),
        difficulty: (picked.difficulty ?? '').toUpperCase() || null,
      })
      .onConflictDoNothing();
  } catch (error) {
    console.error('[DailyChallenge] Failed to persist challenge:', error);
  }

  return toDailyProblem(dateKey, picked);
}

/** Length of the run of consecutive completed days ending at `endKey`. */
function runLengthEndingAt(completed: Set<string>, endKey: string): number {
  let n = 0;
  let cursor = endKey;
  while (completed.has(cursor)) {
    n++;
    cursor = addDays(cursor, -1);
  }
  return n;
}

function longestRun(sortedDates: string[]): number {
  let best = 0;
  let run = 0;
  let previous: string | null = null;

  for (const date of sortedDates) {
    run = previous && addDays(previous, 1) === date ? run + 1 : 1;
    previous = date;
    if (run > best) best = run;
  }
  return best;
}

/** The current month's grid with nothing completed — signed-out and error states. */
export function emptyStreak(monthOffset = 0): DailyStreak {
  const now = new Date();
  const monthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + monthOffset, 1)
  );
  const year = monthStart.getUTCFullYear();
  const month = monthStart.getUTCMonth();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const today = todayKey();

  return {
    current: 0,
    longest: 0,
    completedThisMonth: 0,
    daysInMonth,
    totalCompleted: 0,
    solvedToday: false,
    monthLabel: monthStart.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }),
    calendar: Array.from({ length: daysInMonth }, (_, i) => {
      const key = toDateKey(new Date(Date.UTC(year, month, i + 1)));
      return {
        date: key,
        dayOfMonth: i + 1,
        isToday: key === today,
        isFuture: key > today,
        completed: false,
      };
    }),
  };
}

/**
 * Streak numbers plus a month grid for the calendar. `monthOffset` of -1 is
 * last month.
 */
export async function getDailyStreak(
  userId: string,
  monthOffset = 0
): Promise<DailyStreak> {
  const rows = await db
    .select({ challengeDate: dailyChallengeCompletions.challengeDate })
    .from(dailyChallengeCompletions)
    .where(eq(dailyChallengeCompletions.userId, userId))
    .orderBy(desc(dailyChallengeCompletions.challengeDate));

  const dates = rows.map(r => normalizeDateKey(r.challengeDate));
  const completed = new Set(dates);
  const today = todayKey();

  // A streak survives until a whole day is missed, so yesterday still anchors it.
  const current = completed.has(today)
    ? runLengthEndingAt(completed, today)
    : runLengthEndingAt(completed, addDays(today, -1));

  const now = new Date();
  const monthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + monthOffset, 1)
  );
  const year = monthStart.getUTCFullYear();
  const month = monthStart.getUTCMonth();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

  const calendar: DailyCalendarDay[] = [];
  let completedThisMonth = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const key = toDateKey(new Date(Date.UTC(year, month, day)));
    const isDone = completed.has(key);
    if (isDone) completedThisMonth++;
    calendar.push({
      date: key,
      dayOfMonth: day,
      isToday: key === today,
      isFuture: key > today,
      completed: isDone,
    });
  }

  return {
    current,
    longest: longestRun([...dates].sort()),
    completedThisMonth,
    daysInMonth,
    totalCompleted: dates.length,
    solvedToday: completed.has(today),
    monthLabel: monthStart.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }),
    calendar,
  };
}

/** Recent daily problems with the user's completion state, newest first. */
export async function getRecentDailyChallenges(userId: string, days = 7) {
  const from = addDays(todayKey(), -(days - 1));

  const rows = (await db.execute(sql`
    SELECT
      dc.challenge_date AS "challengeDate",
      vp.id, vp.title, vp.slug, vp.difficulty, vp.platform, vp.url,
      vp.topic_tags, vp.acceptance_rate,
      (c.id IS NOT NULL) AS completed
    FROM daily_challenges dc
    JOIN visible_problems vp ON vp.id = dc.problem_id
    LEFT JOIN daily_challenge_completions c
      ON c.challenge_date = dc.challenge_date AND c.user_id = ${userId}
    WHERE dc.challenge_date >= ${from}
    ORDER BY dc.challenge_date DESC
  `)) as unknown as (ProblemRow & { challengeDate: string; completed: boolean })[];

  return rows.map(row => ({
    ...toDailyProblem(normalizeDateKey(row.challengeDate), row),
    completed: Boolean(row.completed),
  }));
}

export async function hasCompletedDaily(userId: string, dateKey: string) {
  const [row] = await db
    .select({ id: dailyChallengeCompletions.id })
    .from(dailyChallengeCompletions)
    .where(
      and(
        eq(dailyChallengeCompletions.userId, userId),
        eq(dailyChallengeCompletions.challengeDate, dateKey)
      )
    )
    .limit(1);

  return Boolean(row);
}

/** Completions inside a window — used to summarise recent activity for the AI. */
export async function countCompletionsSince(userId: string, sinceKey: string) {
  const rows = await db
    .select({ challengeDate: dailyChallengeCompletions.challengeDate })
    .from(dailyChallengeCompletions)
    .where(
      and(
        eq(dailyChallengeCompletions.userId, userId),
        gte(dailyChallengeCompletions.challengeDate, sinceKey),
        lte(dailyChallengeCompletions.challengeDate, todayKey())
      )
    );

  return rows.length;
}
