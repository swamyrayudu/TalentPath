'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { SheetBreadcrumb } from '@/components/dsa/sheet-breadcrumb';
import { SheetProgressHeader } from '@/components/dsa/sheet-progress-header';
import { ProblemRow } from '@/components/dsa/problem-row';
import { FileSpreadsheet, Search, Target, X } from 'lucide-react';

interface Problem {
  id: number;
  title: string;
  slug: string;
  difficulty: string;
  platform: string;
  likes: string;
  dislikes: string;
  acceptanceRate: number;
  url: string;
  topicTags: string[];
  topicSlugs: string[];
  companyTags: string[];
  isPremium: boolean;
  isVisibleToUsers: boolean;
  patternId?: string;
  patternName?: string;
  patternSlug?: string;
  patternOrderIndex?: number | string;
}

interface UserProgress {
  problemId: number;
  status: 'solved' | 'attempted' | 'bookmarked';
}

const ITEMS_PER_PAGE = 500;

export default function TopicProblemsPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  
  const platform = (params?.platform as string)?.toUpperCase() as 'LEETCODE' | 'GEEKSFORGEEKS';
  const difficulty = (params?.difficulty as string)?.toUpperCase() as 'EASY' | 'MEDIUM' | 'HARD';
  const topic = params?.topic as string;

  const [problems, setProblems] = useState<Problem[]>([]);
  const [userProgress, setUserProgress] = useState<Record<number, UserProgress>>({});
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [updating, setUpdating] = useState<number | null>(null);
  const [signingIn, setSigningIn] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    // Reset state when params change
    setProblems([]);
    setOffset(0);
    setHasMore(true);
    fetchTopicProblems(0, true);
    if (session?.user) {
      fetchUserProgress();
    }
  }, [status, session, platform, difficulty, topic]);

  // Infinite scroll observer
  const lastProblemRef = useCallback((node: HTMLDivElement | null) => {
    if (loadingMore) return;
    
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
    
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loading) {
        loadMoreProblems();
      }
    }, { threshold: 0.1 });
    
    if (node) {
      observerRef.current.observe(node);
    }
  }, [loadingMore, hasMore, loading]);

  const fetchTopicProblems = async (currentOffset: number, isInitial: boolean = false) => {
    try {
      if (isInitial) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const response = await fetch(
        `/api/visible-problems?topic=${topic}&difficulty=${difficulty}&platform=${platform}&limit=${ITEMS_PER_PAGE}&offset=${currentOffset}`
      );
      const data = await response.json();

      if (data.success) {
        const newProblems = data.data || [];
        
        if (isInitial) {
          setProblems(newProblems);
        } else {
          setProblems(prev => [...prev, ...newProblems]);
        }
        
        setTotalCount(data.total || 0);
        setHasMore(newProblems.length === ITEMS_PER_PAGE && (currentOffset + newProblems.length) < data.total);
        setOffset(currentOffset + newProblems.length);
      }
    } catch (error) {
      console.error('Error fetching problems:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMoreProblems = () => {
    if (!loadingMore && hasMore) {
      fetchTopicProblems(offset, false);
    }
  };

  const fetchUserProgress = async () => {
    try {
      const response = await fetch('/api/progress');
      const result = await response.json();
      
      console.log('User progress response:', result);
      
      if (result.success && result.data) {
        const progressMap: Record<number, UserProgress> = {};
        const dataArray = Array.isArray(result.data) ? result.data : [];
        
        dataArray.forEach((p: { problemId?: number; problem_id?: number; status?: string }) => {
          // Handle both nested and flat response formats
          const problemId = p.problemId || p.problem_id;
          const progressStatus = p.status;
          
          if (problemId && progressStatus) {
            progressMap[problemId] = { 
              problemId: Number(problemId), 
              status: progressStatus as 'solved' | 'attempted' | 'bookmarked' 
            };
          }
        });
        
        console.log('Progress map:', progressMap);
        setUserProgress(progressMap);
      }
    } catch (error) {
      console.error('Error fetching user progress:', error);
    }
  };

  const handleToggleStatus = async (problemId: number) => {
    try {
      setUpdating(problemId);
      const currentStatus = userProgress[problemId]?.status;
      
      console.log(`Toggle status - Problem: ${problemId}, Current: ${currentStatus}`);
      
      // Cycle through statuses: undefined -> attempted -> solved -> undefined
      let newStatus: 'solved' | 'attempted' | 'bookmarked' | undefined;
      if (!currentStatus) newStatus = 'attempted';
      else if (currentStatus === 'attempted') newStatus = 'solved';
      else newStatus = undefined;

      console.log(`New status: ${newStatus}`);

      // Update in database
      const response = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemId,
          status: newStatus || 'attempted', // Default to attempted if clearing
          solvedAt: newStatus === 'solved' ? new Date().toISOString() : null,
        }),
      });

      const result = await response.json();
      console.log('Update response:', result);

      if (result.success) {
        if (newStatus) {
          setUserProgress({
            ...userProgress,
            [problemId]: { problemId, status: newStatus },
          });
        } else {
          // When clearing, set to empty/remove
          const { [problemId]: _removed, ...rest } = userProgress;
          void _removed;
          setUserProgress(rest);
        }
        console.log('Status updated successfully');
      } else {
        console.error('Failed to update status:', result.error);
      }
    } catch (error) {
      console.error('Error updating progress:', error);
    } finally {
      setUpdating(null);
    }
  };

  const filteredProblems = searchTerm 
    ? problems.filter(problem => 
        problem.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        problem.slug?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : problems;

  // Group problems by pattern
  const groupedProblemsByPattern = useMemo<Record<string, { name: string; slug: string | null; orderIndex: number; problems: Problem[] }>>(() => {
    const groups: Record<string, { name: string; slug: string | null; orderIndex: number; problems: Problem[] }> = {};
    
    filteredProblems.forEach(problem => {
      const patternId = problem.patternId || 'uncategorized';
      if (!groups[patternId]) {
        groups[patternId] = {
          name: problem.patternName || 'Uncategorized Questions',
          slug: problem.patternSlug || null,
          orderIndex: problem.patternOrderIndex !== undefined ? Number(problem.patternOrderIndex) : 999999,
          problems: []
        };
      }
      groups[patternId].problems.push(problem);
    });
    
    return groups;
  }, [filteredProblems]);

  // Calculate progress from userProgress for current problems
  const problemIds = new Set(problems.map(p => p.id));
  const relevantProgress = Object.values(userProgress).filter(p => problemIds.has(p.problemId));
  const solvedCount = relevantProgress.filter(p => p.status === 'solved').length;

  const platformNames: Record<string, string> = {
    LEETCODE: 'LeetCode',
    GEEKSFORGEEKS: 'GeeksforGeeks',
  };

  const topicName = topic
    ?.split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  const difficultyLabel =
    difficulty?.charAt(0) + difficulty?.slice(1).toLowerCase();

  const isSignedOut = !session?.user;

  const handleSignIn = async () => {
    setSigningIn(true);
    await signIn('google', { callbackUrl: window.location.href });
    setSigningIn(false);
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-4xl px-4 py-8 md:px-6 md:py-10">
          <Skeleton className="h-4 w-64" />
          <Skeleton className="mt-6 h-32 rounded-2xl" />
          <Skeleton className="mt-4 h-11 rounded-xl" />
          <div className="mt-4 space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-12 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const groups = Object.entries(groupedProblemsByPattern).sort(
    ([, a], [, b]) => a.orderIndex - b.orderIndex
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8 md:px-6 md:py-10">
        <SheetBreadcrumb
          items={[
            { label: 'DSA Sheet', href: '/dsasheet' },
            { label: platformNames[platform] || platform, href: '/dsasheet' },
            { label: difficultyLabel, href: '/dsasheet' },
            { label: topicName },
          ]}
        />

        <div className="mt-6">
          <SheetProgressHeader
            icon={FileSpreadsheet}
            title={topicName}
            description={`${platformNames[platform] || platform} · ${difficultyLabel}`}
            solved={solvedCount}
            total={totalCount}
            splits={[
              {
                label: difficultyLabel as 'Easy' | 'Medium' | 'Hard',
                solved: solvedCount,
                total: totalCount,
              },
            ]}
          />
        </div>

        {/* ── Search ───────────────────────────────────────────── */}
        <div className="relative mt-4">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search problems"
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

        {isSignedOut && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3">
            <p className="text-sm text-muted-foreground">
              Sign in to tick problems off and keep your progress.
            </p>
            <Button size="sm" onClick={handleSignIn} disabled={signingIn}>
              {signingIn ? 'Signing in…' : 'Sign in'}
            </Button>
          </div>
        )}

        {/* ── Problems, grouped by pattern ─────────────────────── */}
        {filteredProblems.length === 0 ? (
          <div className="mt-4 flex flex-col items-center rounded-2xl border bg-card py-16 text-center">
            <Target className="size-6 text-muted-foreground/40" strokeWidth={1.5} />
            <p className="mt-4 text-sm font-semibold tracking-tight">
              {searchTerm ? 'No matching problems' : 'No problems yet'}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {searchTerm
                ? 'Try a different search term.'
                : 'Check back later for new problems.'}
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-8">
            {groups.map(([patternId, group]) => (
              <section key={patternId}>
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-sm font-semibold tracking-tight">
                    {group.name}
                  </h2>
                  <Badge variant="outline" className="tabular-nums">
                    {group.problems.length}
                  </Badge>
                </div>

                <div className="mt-3 space-y-2">
                  {group.problems.map((problem) => (
                    <ProblemRow
                      key={problem.id}
                      title={problem.title}
                      url={problem.url}
                      difficulty={problem.difficulty}
                      status={userProgress[problem.id]?.status}
                      isUpdating={updating === problem.id}
                      isLocked={isSignedOut}
                      onToggle={() => handleToggleStatus(problem.id)}
                      onLockedClick={handleSignIn}
                    />
                  ))}
                </div>
              </section>
            ))}

            {!searchTerm && (
              <div ref={lastProblemRef} className="flex justify-center py-2">
                {loadingMore ? (
                  <span className="text-sm text-muted-foreground">Loading more…</span>
                ) : hasMore ? (
                  <Button variant="outline" size="sm" onClick={loadMoreProblems}>
                    Load more ({totalCount - problems.length} remaining)
                  </Button>
                ) : (
                  <p className="text-sm text-muted-foreground tabular-nums">
                    All {totalCount} problems loaded
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
