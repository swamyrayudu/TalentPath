'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Code2,
  Trophy,
  Brain,
  ArrowRight,
  Briefcase,
  Loader2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RecentlySolvedPaginated, ProgressWithProblem } from '@/components/dashboard/recently-solved-paginated';
import { ContestSubmissionsPaginated } from '@/components/dashboard/contest-submissions-paginated';
import {
  getContestTabStatsAction,
  getAptitudeTabStatsAction,
  ContestTabData,
  AptitudeTabData,
} from '@/actions/dashboard.actions';

export interface DsaStatsData {
  totalSolved: number;
  easy: number;
  medium: number;
  hard: number;
  recentSubmissions: ProgressWithProblem[];
}

interface DashboardTabsProps {
  dsaStats: DsaStatsData;
  streak: number;
  solvedThisWeek: number;
  lastSolvedAt: string | null;
}

const shortDate = (d: Date | string) =>
  new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

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

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between border-b py-2.5 last:border-b-0 last:pb-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold tabular-nums">{value}</span>
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

function TabSkeleton({ title, count = 3 }: { title: string; count?: number }) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <section className="rounded-2xl border bg-card p-5 animate-pulse">
          <div className="flex items-center gap-2 mb-4">
            <Loader2 className="size-4 animate-spin text-primary" />
            <span className="text-sm font-medium text-muted-foreground">Loading {title}...</span>
          </div>
          <div className="h-10 w-full rounded-lg bg-muted/60 mb-4" />
          <div className="space-y-3">
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="h-12 w-full rounded-lg bg-muted/40" />
            ))}
          </div>
        </section>
      </div>
      <div className="space-y-4">
        <section className="rounded-2xl border bg-card p-5 animate-pulse">
          <div className="h-4 w-24 bg-muted/60 rounded mb-4" />
          <div className="space-y-2">
            <div className="h-6 w-full bg-muted/40 rounded" />
            <div className="h-6 w-full bg-muted/40 rounded" />
          </div>
        </section>
      </div>
    </div>
  );
}

export function DashboardTabs({
  dsaStats,
  streak,
  solvedThisWeek,
  lastSolvedAt,
}: DashboardTabsProps) {
  const [activeTab, setActiveTab] = useState('dsa');

  // Lazy loaded tab states
  const [contestData, setContestData] = useState<ContestTabData | null>(null);
  const [isContestLoading, setIsContestLoading] = useState(false);

  const [aptitudeData, setAptitudeData] = useState<AptitudeTabData | null>(null);
  const [isAptitudeLoading, setIsAptitudeLoading] = useState(false);

  const handleTabChange = async (tab: string) => {
    setActiveTab(tab);

    if (tab === 'contests' && !contestData && !isContestLoading) {
      setIsContestLoading(true);
      try {
        const res = await getContestTabStatsAction();
        if (res.success && res.data) {
          setContestData(res.data);
        }
      } catch (err) {
        console.error('[DashboardTabs] Failed to load contest stats:', err);
      } finally {
        setIsContestLoading(false);
      }
    }

    if (tab === 'aptitude' && !aptitudeData && !isAptitudeLoading) {
      setIsAptitudeLoading(true);
      try {
        const res = await getAptitudeTabStatsAction();
        if (res.success && res.data) {
          setAptitudeData(res.data);
        }
      } catch (err) {
        console.error('[DashboardTabs] Failed to load aptitude stats:', err);
      } finally {
        setIsAptitudeLoading(false);
      }
    }
  };

  const totalDsa = Math.max(dsaStats.totalSolved, 1);
  const pct = (n: number) => (n / totalDsa) * 100;

  const contestAcceptance =
    contestData && contestData.totalSubmissions > 0
      ? `${Math.round((contestData.totalAccepted / contestData.totalSubmissions) * 100)}%`
      : '—';

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="mt-8">
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
          {isContestLoading && <Loader2 className="size-3 animate-spin text-muted-foreground ml-1" />}
        </TabsTrigger>
        <TabsTrigger
          value="aptitude"
          className="flex-1 gap-1.5 rounded-md text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm"
        >
          <Brain className="size-4" strokeWidth={1.75} />
          Tests
          {isAptitudeLoading && <Loader2 className="size-3 animate-spin text-muted-foreground ml-1" />}
        </TabsTrigger>
      </TabsList>

      {/* ── DSA TAB (Instant) ─────────────────────────────────── */}
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
              <RecentlySolvedPaginated items={dsaStats.recentSubmissions} pageSize={5} />
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

      {/* ── CONTEST TAB (On-Demand) ───────────────────────────── */}
      <TabsContent value="contests" className="mt-5">
        {isContestLoading && !contestData ? (
          <TabSkeleton title="Contest Performance" count={4} />
        ) : !contestData ? (
          <EmptyState
            icon={Trophy}
            message="Click to load your contest statistics."
            href="/contest"
            cta="Browse contests"
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              <Panel title="Contest performance">
                {contestData.totalSubmissions === 0 ? (
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
                        { label: 'Submissions', n: contestData.totalSubmissions },
                        { label: 'Accepted', n: contestData.totalAccepted },
                        { label: 'Solved', n: contestData.uniqueProblemsSolved },
                      ].map(s => (
                        <div key={s.label}>
                          <p className="text-2xl font-semibold tabular-nums">{s.n}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">{s.label}</p>
                        </div>
                      ))}
                    </div>

                    {contestData.questionStats.length > 0 && (
                      <div className="mt-6 border-t pt-5">
                        <h3 className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                          By question
                        </h3>
                        <div className="mt-3">
                          {contestData.questionStats.map((stat, index) => (
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
                <ContestSubmissionsPaginated
                  items={contestData.recentSubmissions}
                  pageSize={5}
                />
              </Panel>
            </div>

            <div className="space-y-4">
              <Panel title="Summary">
                <StatRow label="Acceptance rate" value={contestAcceptance} />
                <StatRow label="Total attempts" value={contestData.totalSubmissions} />
                <StatRow label="Problems solved" value={contestData.uniqueProblemsSolved} />
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
        )}
      </TabsContent>

      {/* ── APTITUDE TAB (On-Demand) ──────────────────────────── */}
      <TabsContent value="aptitude" className="mt-5">
        {isAptitudeLoading && !aptitudeData ? (
          <TabSkeleton title="Aptitude Statistics" count={4} />
        ) : !aptitudeData ? (
          <EmptyState
            icon={Brain}
            message="Click to load your aptitude test results."
            href="/aptitude"
            cta="Take a test"
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              <Panel title="Topic performance">
                {aptitudeData.totalTests === 0 ? (
                  <EmptyState
                    icon={Brain}
                    message="Complete an aptitude test to see your topic breakdown."
                    href="/aptitude"
                    cta="Take a test"
                  />
                ) : (
                  <div className="space-y-4">
                    {aptitudeData.topicStats.map(stat => (
                      <div key={stat.topic} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium">{stat.topic}</span>
                          <span className="text-muted-foreground tabular-nums">
                            {stat.averageScore}% avg · {stat.testsCompleted} test
                            {stat.testsCompleted === 1 ? '' : 's'}
                          </span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                          <div
                            className={`h-full transition-all ${
                              stat.averageScore >= 70
                                ? 'bg-emerald-500'
                                : stat.averageScore >= 50
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                            }`}
                            style={{ width: `${stat.averageScore}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Panel>

              <Panel title="Recent tests">
                {aptitudeData.recentTests.length === 0 ? (
                  <EmptyState
                    icon={Brain}
                    message="No tests completed yet."
                    href="/aptitude"
                    cta="Take your first test"
                  />
                ) : (
                  <div>
                    {aptitudeData.recentTests.map(test => (
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
                <StatRow label="Tests taken" value={aptitudeData.totalTests} />
                <StatRow
                  label="Average score"
                  value={
                    aptitudeData.totalTests > 0 ? `${aptitudeData.averageScore}%` : '—'
                  }
                />
                <StatRow
                  label="Best score"
                  value={aptitudeData.totalTests > 0 ? `${aptitudeData.bestScore}%` : '—'}
                />
                {aptitudeData.topicStats.length > 0 && (
                  <StatRow
                    label="Weakest topic"
                    value={
                      aptitudeData.topicStats[aptitudeData.topicStats.length - 1].topic
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
        )}
      </TabsContent>
    </Tabs>
  );
}
