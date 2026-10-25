import { auth } from '../../lib/auth';
import React, { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { getCachedDashboardData, setCachedDashboardData } from '@/lib/redis';
import {
  Code2,
  Trophy,
  Brain,
  Flame,
  ArrowRight,
  Target,
} from 'lucide-react';
import Link from 'next/link';
import { CORE_TOPICS } from '@/lib/ai-suggestions';
import type { LearnerProfile } from '@/lib/ai-suggestions';
import {
  AiSuggestionsSection,
  AiSuggestionsSkeleton,
} from '@/components/dashboard/ai-suggestions-section';
import { DashboardTabs } from '@/components/dashboard/dashboard-tabs';
import { ProgressWithProblem } from '@/components/dashboard/recently-solved-paginated';

interface DashboardCacheData {
  userProgressData: ProgressWithProblem[];
  contestOverview: { uniqueSolved: number; totalSubmissions: number };
  aptitudeOverview: { totalTests: number; avgScore: number; bestScore: number };
}

function StatCard({
  label,
  value,
  caption,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  caption: string;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-2xl border bg-card p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <Icon className="size-4 text-muted-foreground" strokeWidth={1.75} />
      </div>
      <p className="mt-4 text-3xl font-semibold tracking-tight tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{caption}</p>
    </div>
  );
}

const shortDate = (d: Date | string) =>
  new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

export default async function Dashboard() {
  const session = await auth();

  if (!session?.user) {
    redirect('/');
  }

  const userId = session.user.id as string;

  let userProgressData: ProgressWithProblem[] = [];
  let contestOverview = { uniqueSolved: 0, totalSubmissions: 0 };
  let aptitudeOverview = { totalTests: 0, avgScore: 0, bestScore: 0 };

  const cachedData = (await getCachedDashboardData(userId)) as DashboardCacheData | null;

  if (cachedData && cachedData.userProgressData) {
    userProgressData = cachedData.userProgressData;
    contestOverview = cachedData.contestOverview || contestOverview;
    aptitudeOverview = cachedData.aptitudeOverview || aptitudeOverview;
  } else {
    // Fast parallel queries: only DSA full rows + fast aggregate counts for overview cards
    const [progressResult, contestCountResult, aptitudeCountResult] = await Promise.all([
      db.execute(sql`
        SELECT
          up.id,
          up.status,
          up.solved_at as "solvedAt",
          up.created_at as "createdAt",
          up.updated_at as "updatedAt",
          up.problem_id as "problemId",
          vp.title,
          vp.difficulty,
          vp.platform,
          vp.slug,
          vp.topic_tags as "topicTags"
        FROM user_progress up
        LEFT JOIN visible_problems vp ON up.problem_id = vp.id
        WHERE up.user_id = ${userId}
        ORDER BY up.updated_at DESC
      `) as Promise<unknown>,
      db.execute(sql`
        SELECT
          COUNT(DISTINCT question_id)::int as "uniqueSolved",
          COUNT(*)::int as "totalSubmissions"
        FROM contest_submissions
        WHERE user_id = ${userId}
      `) as Promise<unknown>,
      db.execute(sql`
        SELECT
          COUNT(*)::int as "totalTests",
          COALESCE(ROUND(AVG(score)), 0)::int as "avgScore",
          COALESCE(MAX(score), 0)::int as "bestScore"
        FROM aptitude_results
        WHERE user_id = ${userId}
      `) as Promise<unknown>,
    ]);

    userProgressData = (progressResult as ProgressWithProblem[]) || [];

    const contestRows = (contestCountResult as unknown as Array<{ uniqueSolved: number; totalSubmissions: number }>);
    if (contestRows && contestRows[0]) {
      contestOverview = {
        uniqueSolved: Number(contestRows[0].uniqueSolved) || 0,
        totalSubmissions: Number(contestRows[0].totalSubmissions) || 0,
      };
    }

    const aptitudeRows = (aptitudeCountResult as unknown as Array<{ totalTests: number; avgScore: number; bestScore: number }>);
    if (aptitudeRows && aptitudeRows[0]) {
      aptitudeOverview = {
        totalTests: Number(aptitudeRows[0].totalTests) || 0,
        avgScore: Number(aptitudeRows[0].avgScore) || 0,
        bestScore: Number(aptitudeRows[0].bestScore) || 0,
      };
    }

    await setCachedDashboardData(userId, {
      userProgressData,
      contestOverview,
      aptitudeOverview,
    });
  }

  const solved = userProgressData.filter(p => p.status === 'solved');
  const dsaStats = {
    totalSolved: solved.length,
    easy: solved.filter(p => p.difficulty?.toUpperCase() === 'EASY').length,
    medium: solved.filter(p => p.difficulty?.toUpperCase() === 'MEDIUM').length,
    hard: solved.filter(p => p.difficulty?.toUpperCase() === 'HARD').length,
    recentSubmissions: solved,
  };

  // Solved in the last 7 days
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const solvedThisWeek = solved.filter(
    p => p.solvedAt && new Date(p.solvedAt).getTime() >= weekAgo
  ).length;

  const lastSolvedAt = solved.find(p => p.solvedAt)?.solvedAt ?? null;

  const calculateStreak = () => {
    if (solved.length === 0) return 0;

    const dates = solved
      .filter(p => p.solvedAt)
      .map(p => new Date(p.solvedAt!).toDateString())
      .filter((date, index, self) => self.indexOf(date) === index)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    if (dates.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < dates.length; i++) {
      const expectedDate = new Date(today);
      expectedDate.setDate(expectedDate.getDate() - i);

      if (dates[i] === expectedDate.toDateString()) {
        streak++;
      } else if (i === 0) {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        if (dates[0] === yesterday.toDateString()) {
          streak = 1;
          for (let j = 1; j < dates.length; j++) {
            const checkDate = new Date(yesterday);
            checkDate.setDate(checkDate.getDate() - j);
            if (dates[j] === checkDate.toDateString()) {
              streak++;
            } else {
              break;
            }
          }
        }
        break;
      } else {
        break;
      }
    }

    return streak;
  };

  const streak = calculateStreak();

  // Topic coverage
  const topicCounts = new Map<string, number>();
  for (const item of solved) {
    const tags = item.topicTags;
    if (!Array.isArray(tags)) continue;
    for (const tag of tags) {
      const name = typeof tag === 'string' ? tag : (tag as { name?: string })?.name;
      if (name) topicCounts.set(name, (topicCounts.get(name) ?? 0) + 1);
    }
  }

  const topTopics = [...topicCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([topic]) => topic);

  const missingTopics = CORE_TOPICS.filter(topic => !topicCounts.has(topic)).slice(0, 5);

  const daysSinceLastSolve = lastSolvedAt
    ? Math.floor((Date.now() - new Date(lastSolvedAt).getTime()) / 86_400_000)
    : null;

  const learnerProfile: LearnerProfile = {
    solvedTotal: dsaStats.totalSolved,
    easy: dsaStats.easy,
    medium: dsaStats.medium,
    hard: dsaStats.hard,
    solvedThisWeek,
    daysSinceLastSolve,
    topTopics,
    missingTopics,
    aptitudeTests: aptitudeOverview.totalTests,
    aptitudeAverage: aptitudeOverview.avgScore,
    aptitudeWeakest: null,
    aptitudeStrongest: null,
    contestSubmissions: contestOverview.totalSubmissions,
    contestAcceptance:
      contestOverview.totalSubmissions > 0
        ? Math.round((contestOverview.uniqueSolved / contestOverview.totalSubmissions) * 100)
        : null,
    contestSolved: contestOverview.uniqueSolved,
    dailyStreak: 0,
    dailyLongest: 0,
    dailyThisMonth: 0,
    dailySolvedToday: false,
    interviewsCompleted: 0,
  };

  const hasAnyActivity =
    dsaStats.totalSolved > 0 ||
    contestOverview.totalSubmissions > 0 ||
    aptitudeOverview.totalTests > 0;

  const firstName = session.user.name?.split(' ')[0] || 'there';

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-10">
        {/* ── Header ───────────────────────────────────────────── */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
              Welcome back, {firstName}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {hasAnyActivity
                ? lastSolvedAt
                  ? `Last solved ${shortDate(lastSolvedAt)}. Keep the momentum going.`
                  : 'Here is where your preparation stands.'
                : 'Let’s get your preparation started.'}
            </p>
          </div>

          {streak > 0 && (
            <div className="flex items-center gap-2 rounded-full border bg-card px-3.5 py-2">
              <Flame className="size-4 text-primary" strokeWidth={2} />
              <span className="text-sm font-semibold tabular-nums">{streak}</span>
              <span className="text-sm text-muted-foreground">
                day{streak === 1 ? '' : 's'}
              </span>
            </div>
          )}
        </div>

        {/* ── First-run guidance ───────────────────────────────── */}
        {!hasAnyActivity && (
          <div className="mt-8 rounded-2xl border bg-card p-6 md:p-8">
            <h2 className="text-lg font-semibold tracking-tight">Start here</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Three things worth doing first. Your stats fill in as you go.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                {
                  href: '/dsasheet',
                  icon: Code2,
                  title: 'Solve your first problem',
                  body: 'Work the DSA sheet pattern by pattern.',
                },
                {
                  href: '/aptitude',
                  icon: Brain,
                  title: 'Take an aptitude test',
                  body: 'Find your baseline in 10 minutes.',
                },
                {
                  href: '/contest',
                  icon: Trophy,
                  title: 'Enter a contest',
                  body: 'Practise solving against the clock.',
                },
              ].map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group rounded-xl border p-4 transition-colors hover:border-primary/40 hover:bg-muted/40"
                >
                  <item.icon className="size-5 text-primary" strokeWidth={1.75} />
                  <p className="mt-3 text-sm font-semibold">{item.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {item.body}
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary">
                    Open
                    <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── Overview ─────────────────────────────────────────── */}
        <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="DSA"
            value={dsaStats.totalSolved}
            caption={
              solvedThisWeek > 0 ? `${solvedThisWeek} solved this week` : 'problems solved'
            }
            icon={Code2}
          />
          <StatCard
            label="Contest"
            value={contestOverview.uniqueSolved}
            caption="unique problems solved"
            icon={Trophy}
          />
          <StatCard
            label="Tests"
            value={aptitudeOverview.totalTests}
            caption="aptitude tests taken"
            icon={Brain}
          />
          <StatCard
            label="Average"
            value={aptitudeOverview.totalTests > 0 ? `${aptitudeOverview.avgScore}%` : '—'}
            caption={
              aptitudeOverview.totalTests > 0
                ? `best ${aptitudeOverview.bestScore}%`
                : 'no tests yet'
            }
            icon={Target}
          />
        </div>

        {/* ── Personalised suggestions ─────────────────────────── */}
        <div className="mt-8">
          <Suspense fallback={<AiSuggestionsSkeleton />}>
            <AiSuggestionsSection userId={userId} profile={learnerProfile} />
          </Suspense>
        </div>

        {/* ── Detail Tabs (DSA loaded, Contest & Tests on click) ── */}
        <DashboardTabs
          dsaStats={dsaStats}
          streak={streak}
          solvedThisWeek={solvedThisWeek}
          lastSolvedAt={lastSolvedAt}
        />
      </div>
    </div>
  );
}
