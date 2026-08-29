import { auth } from '../../lib/auth';
import React, { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { aptitudeResults, AptitudeResult, mockInterviews } from '@/lib/db/schema';
import { and, eq, desc, sql } from 'drizzle-orm';
import { getCachedDashboardData, setCachedDashboardData } from '@/lib/redis';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Code2,
  Trophy,
  Brain,
  Flame,
  CheckCircle2,
  ArrowRight,
  Target,
  Briefcase,
} from 'lucide-react';
import Link from 'next/link';
import { getUserContestStats } from '@/actions/contest.actions';
import { getDailyStreak, emptyStreak } from '@/lib/daily-challenge';
import { CORE_TOPICS } from '@/lib/ai-suggestions';
import type { LearnerProfile } from '@/lib/ai-suggestions';
import {
  AiSuggestionsSection,
  AiSuggestionsSkeleton,
} from '@/components/dashboard/ai-suggestions-section';

interface ProgressWithProblem {
  id: number;
  status: string;
  solvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  problemId: number;
  title: string | null;
  difficulty: string | null;
  platform: string | null;
  slug: string | null;
  topicTags?: unknown;
}

interface ContestQuestionStat {
  questionId: string;
  questionTitle: string;
  totalSubmissions: number;
  acceptedSubmissions: number;
  lastSubmittedAt: Date | string | null;
}

interface ContestRecentSubmission {
  id: string;
  contestId: string;
  questionId: string;
  questionTitle: string | null;
  verdict: string;
  score: number | null;
  submittedAt: Date | string;
}

interface ContestStats {
  totalSubmissions: number;
  totalAccepted: number;
  uniqueProblemsSolved: number;
  questionStats: ContestQuestionStat[];
  recentSubmissions: ContestRecentSubmission[];
}

/* ── Presentational building blocks ─────────────────────────────── */

function Panel({
  title,
  action,
  children,
  className = '',
}: {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-2xl border bg-card ${className}`}>
      {title && (
        <div className="flex items-center justify-between gap-4 border-b px-5 py-4">
          <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
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

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between border-b py-2.5 last:border-b-0 last:pb-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold tabular-nums">{value}</span>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  message,
  href,
  cta,
}: {
  icon: React.ElementType;
  message: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="flex flex-col items-center py-10 text-center">
      <Icon className="size-6 text-muted-foreground/40" strokeWidth={1.5} />
      <p className="mt-3 text-sm text-muted-foreground">{message}</p>
      <Link
        href={href}
        className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
      >
        {cta}
        <ArrowRight className="size-3.5" />
      </Link>
    </div>
  );
}

function ListRow({
  title,
  meta,
  trailing,
}: {
  title: string;
  meta: string;
  trailing: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b py-3 last:border-b-0 last:pb-0">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{meta}</p>
      </div>
      {trailing}
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
  let contestStats: ContestStats = {
    totalSubmissions: 0,
    totalAccepted: 0,
    uniqueProblemsSolved: 0,
    questionStats: [],
    recentSubmissions: [],
  };
  let aptitudeResultsData: AptitudeResult[] = [];

  interface DashboardCacheData {
    userProgressData: ProgressWithProblem[];
    contestStats: ContestStats;
    aptitudeResultsData: AptitudeResult[];
  }

  const cachedData = (await getCachedDashboardData(userId)) as DashboardCacheData | null;

  if (cachedData) {
    userProgressData = cachedData.userProgressData;
    contestStats = cachedData.contestStats;
    aptitudeResultsData = cachedData.aptitudeResultsData;
  } else {
    const [progressResult, contestStatsResult, aptitudeResult] = await Promise.all([
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
      getUserContestStats(userId),
      db
        .select()
        .from(aptitudeResults)
        .where(eq(aptitudeResults.userId, userId))
        .orderBy(desc(aptitudeResults.completedAt)),
    ]);

    userProgressData = progressResult as ProgressWithProblem[];

    contestStats =
      contestStatsResult.success && contestStatsResult.data
        ? contestStatsResult.data
        : {
            totalSubmissions: 0,
            totalAccepted: 0,
            uniqueProblemsSolved: 0,
            questionStats: [],
            recentSubmissions: [],
          };

    aptitudeResultsData = aptitudeResult;

    await setCachedDashboardData(userId, {
      userProgressData,
      contestStats,
      aptitudeResultsData,
    });
  }

  const aptitudeStats = {
    totalTests: aptitudeResultsData.length,
    averageScore:
      aptitudeResultsData.length > 0
        ? Math.round(
            aptitudeResultsData.reduce((sum, r) => sum + r.score, 0) / aptitudeResultsData.length
          )
        : 0,
    bestScore:
      aptitudeResultsData.length > 0 ? Math.max(...aptitudeResultsData.map(r => r.score)) : 0,
    topicStats: (() => {
      const topicMap = new Map<string, { total: number; count: number; best: number }>();

      aptitudeResultsData.forEach(result => {
        const existing = topicMap.get(result.topic) || { total: 0, count: 0, best: 0 };
        topicMap.set(result.topic, {
          total: existing.total + result.score,
          count: existing.count + 1,
          best: Math.max(existing.best, result.score),
        });
      });

      return Array.from(topicMap.entries())
        .map(([topic, data]) => ({
          topic,
          testsCompleted: data.count,
          averageScore: Math.round(data.total / data.count),
          bestScore: data.best,
        }))
        .sort((a, b) => b.averageScore - a.averageScore);
    })(),
    recentTests: aptitudeResultsData.slice(0, 5).map(r => ({
      id: r.id,
      topic: r.topic,
      score: r.score,
      totalQuestions: r.totalQuestions,
      correctAnswers: r.correctAnswers,
      completedAt: r.completedAt,
    })),
  };

  const solved = userProgressData.filter(p => p.status === 'solved');
  const dsaStats = {
    totalSolved: solved.length,
    easy: solved.filter(p => p.difficulty?.toUpperCase() === 'EASY').length,
    medium: solved.filter(p => p.difficulty?.toUpperCase() === 'MEDIUM').length,
    hard: solved.filter(p => p.difficulty?.toUpperCase() === 'HARD').length,
    recentSubmissions: solved.slice(0, 8),
  };

  // Solved in the last 7 days — a more actionable number than a lifetime total.
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

  /* ── Personalised suggestions ───────────────────────────────────── */

  // Outside the dashboard cache: the daily streak feeds the suggestions and has
  // to reflect what the DSA sheet recorded a moment ago.
  const [dailyStreak, interviewCountResult] = await Promise.all([
    getDailyStreak(userId).catch(error => {
      console.error('[Dashboard] Daily streak unavailable:', error);
      return emptyStreak();
    }),
    db
      .select({ id: mockInterviews.id })
      .from(mockInterviews)
      .where(
        and(eq(mockInterviews.userId, userId), eq(mockInterviews.status, 'completed'))
      )
      .catch(() => [] as { id: string }[]),
  ]);

  // Topic coverage: what they keep practising, and what they never touch.
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

  const orderedAptitude = aptitudeStats.topicStats;

  const learnerProfile: LearnerProfile = {
    solvedTotal: dsaStats.totalSolved,
    easy: dsaStats.easy,
    medium: dsaStats.medium,
    hard: dsaStats.hard,
    solvedThisWeek,
    daysSinceLastSolve,
    topTopics,
    missingTopics,
    aptitudeTests: aptitudeStats.totalTests,
    aptitudeAverage: aptitudeStats.averageScore,
    aptitudeWeakest: orderedAptitude.length
      ? {
          topic: orderedAptitude[orderedAptitude.length - 1].topic,
          score: orderedAptitude[orderedAptitude.length - 1].averageScore,
        }
      : null,
    aptitudeStrongest: orderedAptitude.length
      ? { topic: orderedAptitude[0].topic, score: orderedAptitude[0].averageScore }
      : null,
    contestSubmissions: contestStats.totalSubmissions,
    contestAcceptance:
      contestStats.totalSubmissions > 0
        ? Math.round((contestStats.totalAccepted / contestStats.totalSubmissions) * 100)
        : null,
    contestSolved: contestStats.uniqueProblemsSolved,
    dailyStreak: dailyStreak.current,
    dailyLongest: dailyStreak.longest,
    dailyThisMonth: dailyStreak.completedThisMonth,
    dailySolvedToday: dailyStreak.solvedToday,
    interviewsCompleted: interviewCountResult.length,
  };

  const hasAnyActivity =
    dsaStats.totalSolved > 0 ||
    contestStats.totalSubmissions > 0 ||
    aptitudeStats.totalTests > 0;

  const totalDsa = Math.max(dsaStats.totalSolved, 1);
  const pct = (n: number) => (n / totalDsa) * 100;

  const contestAcceptance =
    contestStats.totalSubmissions > 0
      ? `${Math.round((contestStats.totalAccepted / contestStats.totalSubmissions) * 100)}%`
      : '—';

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
            value={contestStats.uniqueProblemsSolved}
            caption="unique problems solved"
            icon={Trophy}
          />
          <StatCard
            label="Tests"
            value={aptitudeStats.totalTests}
            caption="aptitude tests taken"
            icon={Brain}
          />
          <StatCard
            label="Average"
            value={aptitudeStats.totalTests > 0 ? `${aptitudeStats.averageScore}%` : '—'}
            caption={
              aptitudeStats.totalTests > 0
                ? `best ${aptitudeStats.bestScore}%`
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

        {/* ── Detail ───────────────────────────────────────────── */}
        <Tabs defaultValue="dsa" className="mt-8">
          <TabsList className="h-10 w-full justify-start gap-1 bg-muted p-1">
            <TabsTrigger
              value="dsa"
              className="flex-1 gap-1.5 rounded-md text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Code2 className="size-4" strokeWidth={1.75} />
              DSA
            </TabsTrigger>
            <TabsTrigger
              value="contests"
              className="flex-1 gap-1.5 rounded-md text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Trophy className="size-4" strokeWidth={1.75} />
              Contest
            </TabsTrigger>
            <TabsTrigger
              value="aptitude"
              className="flex-1 gap-1.5 rounded-md text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Brain className="size-4" strokeWidth={1.75} />
              Tests
            </TabsTrigger>
          </TabsList>

          {/* ── DSA ──────────────────────────────────────────── */}
          <TabsContent value="dsa" className="mt-5">
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="space-y-4 lg:col-span-2">
                <Panel title="Difficulty mix">
                  {dsaStats.totalSolved === 0 ? (
                    <EmptyState
                      icon={Code2}
                      message="Solve a few problems to see how your practice is distributed."
                      href="/dsasheet"
                      cta="Open the DSA sheet"
                    />
                  ) : (
                    <>
                      {/* One stacked bar reads faster than three separate meters */}
                      <div className="flex h-2.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className="bg-emerald-500"
                          style={{ width: `${pct(dsaStats.easy)}%` }}
                        />
                        <div
                          className="bg-amber-500"
                          style={{ width: `${pct(dsaStats.medium)}%` }}
                        />
                        <div
                          className="bg-rose-500"
                          style={{ width: `${pct(dsaStats.hard)}%` }}
                        />
                      </div>
                      <div className="mt-5 grid grid-cols-3 gap-3">
                        {[
                          { label: 'Easy', n: dsaStats.easy, dot: 'bg-emerald-500' },
                          { label: 'Medium', n: dsaStats.medium, dot: 'bg-amber-500' },
                          { label: 'Hard', n: dsaStats.hard, dot: 'bg-rose-500' },
                        ].map(d => (
                          <div key={d.label}>
                            <div className="flex items-center gap-2">
                              <span className={`size-2 rounded-full ${d.dot}`} />
                              <span className="text-xs text-muted-foreground">{d.label}</span>
                            </div>
                            <p className="mt-1.5 text-2xl font-semibold tabular-nums">{d.n}</p>
                            <p className="text-xs text-muted-foreground">
                              {Math.round(pct(d.n))}%
                            </p>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </Panel>

                <Panel
                  title="Recently solved"
                  action={
                    dsaStats.recentSubmissions.length > 0 ? (
                      <Link
                        href="/dsasheet"
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        View all
                      </Link>
                    ) : null
                  }
                >
                  {dsaStats.recentSubmissions.length === 0 ? (
                    <EmptyState
                      icon={Code2}
                      message="Nothing solved yet."
                      href="/dsasheet"
                      cta="Start solving"
                    />
                  ) : (
                    <div>
                      {dsaStats.recentSubmissions.map(item => (
                        <ListRow
                          key={item.id}
                          title={item.title || 'Untitled problem'}
                          meta={item.solvedAt ? shortDate(item.solvedAt) : '—'}
                          trailing={
                            <div className="flex shrink-0 items-center gap-2.5">
                              <Badge variant="outline" className="text-xs font-normal">
                                {item.difficulty || 'N/A'}
                              </Badge>
                              <CheckCircle2 className="size-4 text-emerald-500" />
                            </div>
                          }
                        />
                      ))}
                    </div>
                  )}
                </Panel>
              </div>

              <div className="space-y-4">
                <Panel title="Summary">
                  <StatRow label="Total solved" value={dsaStats.totalSolved} />
                  <StatRow label="This week" value={solvedThisWeek} />
                  <StatRow label="Solving streak" value={`${streak}d`} />
                  <StatRow
                    label="Last solved"
                    value={lastSolvedAt ? shortDate(lastSolvedAt) : '—'}
                  />
                </Panel>

                <Panel title="Jump back in">
                  <div className="space-y-2">
                    {[
                      { href: '/dsasheet', label: 'DSA Sheet', icon: Code2 },
                      { href: '/compiler', label: 'Compiler', icon: Code2 },
                      { href: '/jobs', label: 'Jobs', icon: Briefcase },
                    ].map(l => (
                      <Link
                        key={l.href}
                        href={l.href}
                        className="group flex items-center justify-between rounded-xl border px-4 py-3 transition-colors hover:border-primary/40 hover:bg-muted/40"
                      >
                        <span className="flex items-center gap-2.5 text-sm font-medium">
                          <l.icon
                            className="size-4 text-muted-foreground"
                            strokeWidth={1.75}
                          />
                          {l.label}
                        </span>
                        <ArrowRight className="size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    ))}
                  </div>
                </Panel>
              </div>
            </div>
          </TabsContent>

          {/* ── Contest ──────────────────────────────────────── */}
          <TabsContent value="contests" className="mt-5">
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="space-y-4 lg:col-span-2">
                <Panel title="Contest performance">
                  {contestStats.totalSubmissions === 0 ? (
                    <EmptyState
                      icon={Trophy}
                      message="You haven’t entered a contest yet."
                      href="/contest"
                      cta="Browse contests"
                    />
                  ) : (
                    <>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { label: 'Submissions', n: contestStats.totalSubmissions },
                          { label: 'Accepted', n: contestStats.totalAccepted },
                          { label: 'Solved', n: contestStats.uniqueProblemsSolved },
                        ].map(s => (
                          <div key={s.label}>
                            <p className="text-2xl font-semibold tabular-nums">{s.n}</p>
                            <p className="mt-0.5 text-xs text-muted-foreground">{s.label}</p>
                          </div>
                        ))}
                      </div>

                      {contestStats.questionStats.length > 0 && (
                        <div className="mt-6 border-t pt-5">
                          <h3 className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                            By question
                          </h3>
                          <div className="mt-3">
                            {contestStats.questionStats.map((stat, index) => (
                              <ListRow
                                key={index}
                                title={stat.questionTitle}
                                meta={`${stat.totalSubmissions} submissions · ${stat.acceptedSubmissions} accepted`}
                                trailing={
                                  <Badge
                                    variant={
                                      stat.acceptedSubmissions > 0 ? 'default' : 'secondary'
                                    }
                                    className="shrink-0 text-xs font-normal"
                                  >
                                    {stat.acceptedSubmissions > 0 ? 'Solved' : 'Attempted'}
                                  </Badge>
                                }
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </Panel>

                <Panel title="Recent submissions">
                  {contestStats.recentSubmissions.length === 0 ? (
                    <EmptyState
                      icon={Trophy}
                      message="No contest submissions yet."
                      href="/contest"
                      cta="Join a contest"
                    />
                  ) : (
                    <div>
                      {contestStats.recentSubmissions.slice(0, 8).map((submission, index) => (
                        <ListRow
                          key={index}
                          title={submission.questionTitle || 'Untitled problem'}
                          meta={shortDate(submission.submittedAt)}
                          trailing={
                            <Badge
                              variant="outline"
                              className={`shrink-0 text-xs font-normal ${
                                submission.verdict === 'accepted'
                                  ? 'border-emerald-500/40 text-emerald-600 dark:text-emerald-400'
                                  : ''
                              }`}
                            >
                              {submission.verdict === 'accepted' ? 'Accepted' : 'Pending'}
                            </Badge>
                          }
                        />
                      ))}
                    </div>
                  )}
                </Panel>
              </div>

              <div className="space-y-4">
                <Panel title="Summary">
                  <StatRow label="Acceptance rate" value={contestAcceptance} />
                  <StatRow label="Total attempts" value={contestStats.totalSubmissions} />
                  <StatRow label="Problems solved" value={contestStats.uniqueProblemsSolved} />
                </Panel>

                <Panel title="Jump back in">
                  <Link
                    href="/contest"
                    className="group flex items-center justify-between rounded-xl border px-4 py-3 transition-colors hover:border-primary/40 hover:bg-muted/40"
                  >
                    <span className="flex items-center gap-2.5 text-sm font-medium">
                      <Trophy className="size-4 text-muted-foreground" strokeWidth={1.75} />
                      Contests
                    </span>
                    <ArrowRight className="size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </Panel>
              </div>
            </div>
          </TabsContent>

          {/* ── Aptitude ─────────────────────────────────────── */}
          <TabsContent value="aptitude" className="mt-5">
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="space-y-4 lg:col-span-2">
                <Panel title="Topic performance">
                  {aptitudeStats.totalTests === 0 ? (
                    <EmptyState
                      icon={Brain}
                      message="Take a test to find your strongest and weakest topics."
                      href="/aptitude"
                      cta="Take a test"
                    />
                  ) : (
                    <div className="space-y-5">
                      {aptitudeStats.topicStats.map((topic, index) => (
                        <div key={index}>
                          <div className="flex items-baseline justify-between gap-3">
                            <span className="text-sm font-medium capitalize">{topic.topic}</span>
                            <span className="text-sm tabular-nums text-muted-foreground">
                              {topic.averageScore}%
                              <span className="ml-2 text-xs">
                                ({topic.testsCompleted} test
                                {topic.testsCompleted === 1 ? '' : 's'})
                              </span>
                            </span>
                          </div>
                          <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{ width: `${topic.averageScore}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Panel>

                <Panel title="Recent tests">
                  {aptitudeStats.recentTests.length === 0 ? (
                    <EmptyState
                      icon={Brain}
                      message="No tests completed yet."
                      href="/aptitude"
                      cta="Take your first test"
                    />
                  ) : (
                    <div>
                      {aptitudeStats.recentTests.map(test => (
                        <ListRow
                          key={test.id}
                          title={test.topic}
                          meta={`${test.correctAnswers}/${test.totalQuestions} correct · ${shortDate(test.completedAt)}`}
                          trailing={
                            <span className="shrink-0 text-sm font-semibold tabular-nums">
                              {test.score}%
                            </span>
                          }
                        />
                      ))}
                    </div>
                  )}
                </Panel>
              </div>

              <div className="space-y-4">
                <Panel title="Summary">
                  <StatRow label="Tests taken" value={aptitudeStats.totalTests} />
                  <StatRow
                    label="Average score"
                    value={
                      aptitudeStats.totalTests > 0 ? `${aptitudeStats.averageScore}%` : '—'
                    }
                  />
                  <StatRow
                    label="Best score"
                    value={aptitudeStats.totalTests > 0 ? `${aptitudeStats.bestScore}%` : '—'}
                  />
                  {aptitudeStats.topicStats.length > 0 && (
                    <StatRow
                      label="Weakest topic"
                      value={
                        aptitudeStats.topicStats[aptitudeStats.topicStats.length - 1].topic
                      }
                    />
                  )}
                </Panel>

                <Panel title="Jump back in">
                  <Link
                    href="/aptitude"
                    className="group flex items-center justify-between rounded-xl border px-4 py-3 transition-colors hover:border-primary/40 hover:bg-muted/40"
                  >
                    <span className="flex items-center gap-2.5 text-sm font-medium">
                      <Brain className="size-4 text-muted-foreground" strokeWidth={1.75} />
                      Aptitude tests
                    </span>
                    <ArrowRight className="size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </Panel>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
