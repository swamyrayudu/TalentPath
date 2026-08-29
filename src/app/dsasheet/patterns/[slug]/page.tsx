'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { SheetBreadcrumb } from '@/components/dsa/sheet-breadcrumb';
import { SheetProgressHeader } from '@/components/dsa/sheet-progress-header';
import { ProblemRow } from '@/components/dsa/problem-row';
import { Bookmark, Search, Target, X } from 'lucide-react';

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
}

interface DsaPattern {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

interface UserProgress {
  problemId: number;
  status: 'solved' | 'attempted' | 'bookmarked';
}

export default function PatternProblemsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  
  const slug = params?.slug as string;

  const [pattern, setPattern] = useState<DsaPattern | null>(null);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [userProgress, setUserProgress] = useState<Record<number, UserProgress>>({});
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);
  const [signingIn, setSigningIn] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleCount, setVisibleCount] = useState(25);
  const loaderRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    fetchPatternData();
    if (session?.user) {
      fetchUserProgress();
    }
  }, [status, session, slug]);

  useEffect(() => {
    setVisibleCount(25);
  }, [searchTerm]);

  const fetchPatternData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/patterns/${slug}`);
      const result = await response.json();

      if (result.success) {
        setPattern(result.pattern);
        setProblems(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching pattern data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProgress = async () => {
    try {
      const response = await fetch('/api/progress');
      const result = await response.json();
      
      if (result.success && result.data) {
        const progressMap: Record<number, UserProgress> = {};
        const dataArray = Array.isArray(result.data) ? result.data : [];
        
        dataArray.forEach((p: { problemId?: number; problem_id?: number; status?: string }) => {
          const problemId = p.problemId || p.problem_id;
          const progressStatus = p.status;
          
          if (problemId && progressStatus) {
            progressMap[problemId] = { 
              problemId: Number(problemId), 
              status: progressStatus as 'solved' | 'attempted' | 'bookmarked' 
            };
          }
        });
        
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
      
      let newStatus: 'solved' | 'attempted' | 'bookmarked' | undefined;
      if (!currentStatus) newStatus = 'attempted';
      else if (currentStatus === 'attempted') newStatus = 'solved';
      else newStatus = undefined;

      const response = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemId,
          status: newStatus || 'attempted',
          solvedAt: newStatus === 'solved' ? new Date().toISOString() : null,
        }),
      });

      const result = await response.json();

      if (result.success) {
        if (newStatus) {
          setUserProgress({
            ...userProgress,
            [problemId]: { problemId, status: newStatus },
          });
        } else {
          const { [problemId]: _removed, ...rest } = userProgress;
          void _removed;
          setUserProgress(rest);
        }
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

  const displayedProblems = filteredProblems.slice(0, visibleCount);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => prev + 25);
        }
      },
      { threshold: 0.1 }
    );

    const currentLoader = loaderRef.current;
    if (currentLoader) {
      observer.observe(currentLoader);
    }

    return () => {
      if (currentLoader) {
        observer.unobserve(currentLoader);
      }
    };
  }, [filteredProblems, visibleCount]);

  const solvedCount = problems.filter(p => userProgress[p.id]?.status === 'solved').length;
  const totalCount = problems.length;

  const splitFor = (level: string) => {
    const inLevel = problems.filter(p => p.difficulty?.toUpperCase() === level);
    return {
      solved: inLevel.filter(p => userProgress[p.id]?.status === 'solved').length,
      total: inLevel.length,
    };
  };

  const splits = [
    { label: 'Easy' as const, ...splitFor('EASY') },
    { label: 'Medium' as const, ...splitFor('MEDIUM') },
    { label: 'Hard' as const, ...splitFor('HARD') },
  ];

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
          <Skeleton className="mt-6 h-44 rounded-2xl" />
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

  if (!pattern) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <p className="text-sm text-muted-foreground">Pattern not found.</p>
        <Button variant="outline" onClick={() => router.push('/dsasheet')} className="mt-4">
          Back to DSA Sheet
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8 md:px-6 md:py-10">
        <SheetBreadcrumb
          items={[
            { label: 'DSA Sheet', href: '/dsasheet' },
            { label: 'Patterns', href: '/dsasheet' },
            { label: pattern.name },
          ]}
        />

        <div className="mt-6">
          <SheetProgressHeader
            icon={Bookmark}
            title={`${pattern.name} Pattern`}
            description={
              pattern.description ||
              'Curated problems that share one structural approach.'
            }
            solved={solvedCount}
            total={totalCount}
            splits={splits}
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

        {/* ── Problems ─────────────────────────────────────────── */}
        {filteredProblems.length === 0 ? (
          <div className="mt-4 flex flex-col items-center rounded-2xl border bg-card py-16 text-center">
            <Target className="size-6 text-muted-foreground/40" strokeWidth={1.5} />
            <p className="mt-4 text-sm font-semibold tracking-tight">
              {searchTerm ? 'No matching problems' : 'No problems yet'}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {searchTerm
                ? 'Try a different search term.'
                : 'Check back once questions are linked to this pattern.'}
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-2">
            {displayedProblems.map((problem) => (
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

            {visibleCount < filteredProblems.length && (
              <div ref={loaderRef} className="py-6 text-center">
                <span className="text-sm text-muted-foreground">Loading more…</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
