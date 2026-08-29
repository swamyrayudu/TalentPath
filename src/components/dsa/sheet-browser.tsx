'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { SheetShelf } from '@/components/dsa/sheet-shelf';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  ClipboardList,
  Layers,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';

interface UserProgressItem {
  problemId: number;
  status: string;
  difficulty?: string;
  platform?: string;
  topicSlugs?: string[];
}

interface PatternData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  topic?: string | null;
  problemCount: number;
  problemIds: number[];
}

/**
 * The sheet/pattern browser. `daily` is a slot so the server page can hand down
 * the (server-rendered) problem of the day without this file losing 'use client'.
 */
export function SheetBrowser({ daily }: { daily?: React.ReactNode }) {
  const { data: session, status } = useSession();

  const [userProgress, setUserProgress] = useState<UserProgressItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [activeMode, setActiveMode] = useState<'sheets' | 'patterns'>('sheets');
  const [patterns, setPatterns] = useState<PatternData[]>([]);
  const [loadingPatterns, setLoadingPatterns] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;
    fetchPatterns();
    if (session?.user) {
      fetchUserProgress();
    }
  }, [status, session]);

  const fetchPatterns = async () => {
    try {
      setLoadingPatterns(true);
      const response = await fetch('/api/patterns');
      const result = await response.json();
      if (result.success) {
        setPatterns(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching patterns:', error);
    } finally {
      setLoadingPatterns(false);
    }
  };

  const fetchUserProgress = async () => {
    try {
      const response = await fetch('/api/progress/with-problems');
      const result = await response.json();

      if (result.success && result.data) {
        setUserProgress(result.data);
      }
    } catch (error) {
      console.error('Error fetching user progress:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchPatterns(), fetchUserProgress()]);
    setRefreshing(false);
  };

  const computedPatterns = useMemo(() => {
    const solvedIds = new Set(
      userProgress.filter(p => p.status === 'solved').map(p => Number(p.problemId))
    );

    return patterns.map(pattern => {
      const pIds = Array.isArray(pattern.problemIds) ? pattern.problemIds : [];
      const solvedCount = pIds.filter(id => solvedIds.has(Number(id))).length;
      return {
        ...pattern,
        solvedCount,
      };
    });
  }, [patterns, userProgress]);

  const filteredPatterns = useMemo(() => {
    if (!searchTerm) return computedPatterns;
    const q = searchTerm.toLowerCase();
    return computedPatterns.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.description && p.description.toLowerCase().includes(q))
    );
  }, [computedPatterns, searchTerm]);

  const groupedPatternsByTopic = useMemo(() => {
    const groups: Record<string, typeof filteredPatterns> = {};
    filteredPatterns.forEach(pattern => {
      const topic = pattern.topic ? pattern.topic.trim().toLowerCase() : 'other';
      if (!groups[topic]) {
        groups[topic] = [];
      }
      groups[topic].push(pattern);
    });
    return groups;
  }, [filteredPatterns]);

  if (status === 'loading') {
    return (
      <>
        <Skeleton className="h-8 w-56" />
        <Skeleton className="mt-6 h-10 w-56 rounded-full" />
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            DSA practice sheet
          </h1>
          <p className="mt-1 text-sm text-muted-foreground tabular-nums">
            {activeMode === 'sheets'
              ? 'Follow a curated sheet, or work through the patterns.'
              : `${computedPatterns.length} patterns, grouped by topic.`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={refreshing}
            aria-label="Refresh progress"
          >
            <RefreshCw className={`size-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="outline" className="gap-2" asChild>
            <Link href="/companies">
              <Building2 className="size-4" />
              Companies
            </Link>
          </Button>
        </div>
      </div>

      {daily && <div className="mt-6">{daily}</div>}

      {/* Mode */}
      <div className="mt-6 inline-flex rounded-full border bg-card p-1">
        {[
          { key: 'sheets' as const, label: 'DSA Sheets', icon: ClipboardList },
          { key: 'patterns' as const, label: 'By pattern', icon: Layers },
        ].map((mode) => (
          <button
            key={mode.key}
            onClick={() => setActiveMode(mode.key)}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm transition-colors ${
              activeMode === mode.key
                ? 'bg-muted font-medium text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <mode.icon className="size-4" strokeWidth={1.75} />
            {mode.label}
          </button>
        ))}
      </div>

      {activeMode === 'sheets' ? (
        <SheetShelf />
      ) : (
        <>
          <div className="relative mt-4">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search patterns"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-11 rounded-xl pl-10 pr-10"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                aria-label="Clear search"
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          {loadingPatterns ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-2xl" />
              ))}
            </div>
          ) : filteredPatterns.length === 0 ? (
            <div className="mt-4 flex flex-col items-center rounded-2xl border bg-card py-16 text-center">
              <Layers className="size-6 text-muted-foreground/40" strokeWidth={1.5} />
              <p className="mt-4 text-sm font-semibold tracking-tight">
                No patterns available
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {searchTerm
                  ? 'Try a different search term.'
                  : 'Check back later for curated patterns.'}
              </p>
            </div>
          ) : (
            <div className="mt-8 space-y-8">
              {Object.entries(groupedPatternsByTopic).map(([topicSlug, topicPatterns]) => (
                <section key={topicSlug}>
                  <h2 className="text-sm font-semibold capitalize tracking-tight">
                    {topicSlug.replace(/-/g, ' ')}
                  </h2>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {topicPatterns.map((pattern) => {
                      const progress =
                        pattern.problemCount > 0
                          ? (pattern.solvedCount / pattern.problemCount) * 100
                          : 0;
                      const isCompleted =
                        pattern.solvedCount === pattern.problemCount &&
                        pattern.problemCount > 0;

                      return (
                        <Link
                          key={pattern.id}
                          href={`/dsasheet/patterns/${pattern.slug}`}
                          className="group flex flex-col rounded-2xl border bg-card p-5 transition-colors hover:border-primary/40"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="line-clamp-1 text-sm font-semibold tracking-tight">
                              {pattern.name}
                            </h3>
                            {isCompleted ? (
                              <CheckCircle2
                                className="size-4 shrink-0 text-emerald-500"
                                strokeWidth={2}
                              />
                            ) : (
                              <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                            )}
                          </div>

                          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                            {pattern.description || 'Curated problems for this pattern.'}
                          </p>

                          <div className="mt-auto pt-4">
                            <div className="flex items-center justify-between text-xs tabular-nums">
                              <span className="text-muted-foreground">
                                {pattern.problemCount} problems
                              </span>
                              <span className="font-medium">
                                {pattern.solvedCount}/{pattern.problemCount}
                              </span>
                            </div>
                            <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
                              <div
                                className={`h-full rounded-full transition-[width] duration-500 ${
                                  isCompleted ? 'bg-emerald-500' : 'bg-primary'
                                }`}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}
