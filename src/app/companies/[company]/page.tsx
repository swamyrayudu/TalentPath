'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo, memo } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SheetBreadcrumb } from '@/components/dsa/sheet-breadcrumb';
import { ProblemRow } from '@/components/dsa/problem-row';
import { Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSession } from 'next-auth/react';

const ITEMS_PER_PAGE = 20;
const CACHE_DURATION = 600000;
const STORAGE_PREFIX = 'tp_';

type TopicData = {
  name: string;
  count: number;
};

type Problem = {
  id: number;
  title: string;
  slug: string;
  difficulty: string;
  platform: string;
  likes: number;
  dislikes: number;
  acceptanceRate: string;
  url: string;
  topicTags: string[];
  companyTags: string[];
  mainTopics: string[];
  topicSlugs: string[];
  accepted: number;
  submissions: number;
  isPremium: boolean;
  image?: string;
};

type UserProgress = {
  problemId: number;
  status: 'solved' | 'attempted' | 'bookmarked';
  solvedAt?: Date;
};

type CachedData<T> = {
  data: T;
  timestamp: number;
};

// ==================== UTILITY FUNCTIONS ====================

const storage = {
  set: <T,>(key: string, data: T): void => {
    if (typeof window === 'undefined') return;
    try {
      const cached: CachedData<T> = { data, timestamp: Date.now() };
      localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(cached));
    } catch (err) {
      console.warn('Storage set failed:', err);
      if (err instanceof DOMException && err.name === 'QuotaExceededError') {
        storage.clearOld();
        try {
          const cached: CachedData<T> = { data, timestamp: Date.now() };
          localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(cached));
        } catch (retryError) {
          console.error('Storage retry failed:', retryError);
        }
      }
    }
  },

  get: <T,>(key: string): T | null => {
    if (typeof window === 'undefined') return null;
    try {
      const item = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
      if (!item) return null;
      
      const cached: CachedData<T> = JSON.parse(item);
      const age = Date.now() - cached.timestamp;
      
      if (age > CACHE_DURATION) {
        localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
        return null;
      }
      
      return cached.data;
    } catch (err) {
      console.warn('Storage get failed:', err);
      return null;
    }
  },

  remove: (key: string): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
    } catch (err) {
      console.warn('Storage remove failed:', err);
    }
  },

  clearOld: (): void => {
    if (typeof window === 'undefined') return;
    try {
      const keys = Object.keys(localStorage);
      const now = Date.now();
      keys.forEach(key => {
        if (key.startsWith(STORAGE_PREFIX)) {
          try {
            const item = localStorage.getItem(key);
            if (item) {
              const cached = JSON.parse(item);
              if (now - cached.timestamp > CACHE_DURATION) {
                localStorage.removeItem(key);
              }
            }
          } catch {
            localStorage.removeItem(key);
          }
        }
      });
    } catch (err) {
      console.warn('Storage clearOld failed:', err);
    }
  }
};

// ==================== MEMOIZED COMPONENTS ====================

const CompanyLogo = memo(({ companyName }: { companyName: string }) => {
  const [logoError, setLogoError] = useState(false);
  const [currentSourceIndex, setCurrentSourceIndex] = useState(0);
  
  const logoSources = useMemo(() => {
    const domain = companyName.toLowerCase().replace(/\s+/g, '') + '.com';
    return [
      `https://logo.clearbit.com/${domain}`,
      `https://img.logo.dev/${domain}?token=pk_X-yFQbLvSf6D9V0wXd1yEQ`,
      `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
    ];
  }, [companyName]);
  
  const handleError = useCallback(() => {
    if (currentSourceIndex < logoSources.length - 1) {
      setCurrentSourceIndex(prev => prev + 1);
    } else {
      setLogoError(true);
    }
  }, [currentSourceIndex, logoSources.length]);
  
  if (logoError) {
    return (
      <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border bg-muted text-muted-foreground">
        <Building2 className="size-5" strokeWidth={1.75} />
      </div>
    );
  }
  
  return (
    <div className="relative size-12 shrink-0 overflow-hidden rounded-2xl border bg-card">
      <img
        src={logoSources[currentSourceIndex]}
        alt=""
        className="size-full object-contain p-2"
        onError={handleError}
        loading="lazy"
      />
    </div>
  );
});

CompanyLogo.displayName = 'CompanyLogo';

const TopicCard = memo(({ topic, onClick }: { topic: TopicData; onClick: () => void }) => {
  // Counts arrive either as a plain total or as "solved/total".
  const parts = topic.count.toString().split('/');
  const total = parts.length > 1 ? parseInt(parts[1]) : topic.count;
  const solved = parts.length > 1 ? parseInt(parts[0]) : 0;
  const progressPercent = total > 0 ? (solved / total) * 100 : 0;

  return (
    <button
      onClick={onClick}
      className="rounded-2xl border bg-card p-4 text-left transition-colors hover:border-primary/40"
    >
      <h3 className="line-clamp-2 text-sm font-medium leading-snug">{topic.name}</h3>

      <div className="mt-4">
        <div className="flex items-center justify-between text-xs tabular-nums">
          <span className="text-muted-foreground">{total} problems</span>
          {solved > 0 && <span className="font-medium">{solved}/{total}</span>}
        </div>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </button>
  );
});

TopicCard.displayName = 'TopicCard';

// ==================== MAIN COMPONENT ====================

export default function CompanyPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const companySlug = params.company as string;
  const selectedTopic = searchParams.get('topic');
  const platformFromUrl = searchParams.get('platform') as 'LEETCODE' | 'GEEKSFORGEEKS' | null;
  const { data: session } = useSession();

  const [topics, setTopics] = useState<TopicData[]>([]);
  const [displayedProblems, setDisplayedProblems] = useState<Problem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [userProgress, setUserProgress] = useState<Map<number, UserProgress>>(new Map());
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sortKey, setSortKey] = useState('likes');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTopics, setShowTopics] = useState(true);
  const [selectedPlatform, setSelectedPlatform] = useState<'LEETCODE' | 'GEEKSFORGEEKS'>(
    platformFromUrl || 'LEETCODE'
  );
  const [switchingPlatform, setSwitchingPlatform] = useState(false);
  const [loadingTopics, setLoadingTopics] = useState(true);

  const observerTarget = useRef<HTMLDivElement>(null);
  const isFetchingRef = useRef(false);
  const prefetchedRef = useRef<Set<string>>(new Set());

  const prettyCompanyName = useMemo(() => 
    companySlug?.replace(/-/g, ' ')?.replace(/\b\w/g, char => char.toUpperCase()),
    [companySlug]
  );

  const fetchTopics = useCallback(async (platform: string) => {
    if (!companySlug) return;
    
    const cacheKey = `topics_${companySlug}_${platform}`;
    const cached = storage.get<TopicData[]>(cacheKey);
    
    if (cached) {
      requestAnimationFrame(() => {
        setTopics(cached);
        setLoadingTopics(false);
        setSwitchingPlatform(false);
      });
      return;
    }
    
    setLoadingTopics(true);
    
    try {
      const res = await fetch(`/api/companies/${companySlug}/topics?platform=${platform}`, {
        signal: AbortSignal.timeout(8000)
      });
      const data = await res.json();
      
      if (data.success) {
        requestAnimationFrame(() => {
          setTopics(data.data);
          storage.set(cacheKey, data.data);
          setLoadingTopics(false);
          setSwitchingPlatform(false);
        });
      }
    } catch (err) {
      console.error('Error fetching topics:', err);
      setLoadingTopics(false);
      setSwitchingPlatform(false);
    }
  }, [companySlug]);

  const fetchUserProgress = useCallback(async () => {
    if (!session?.user) return;
    
    const cacheKey = 'user_progress';
    const cached = storage.get<{ progress: UserProgress }[]>(cacheKey);
    
    if (cached) {
      const progressMap = new Map();
      cached.forEach((item: { progress: UserProgress }) => {
        if (item.progress?.problemId) {
          progressMap.set(Number(item.progress.problemId), item.progress);
        }
      });
      setUserProgress(progressMap);
    }
    
    try {
      const res = await fetch('/api/progress');
      const data = await res.json();
      if (data.success) {
        const progressMap = new Map();
        data.data.forEach((item: { progress: UserProgress }) => {
          if (item.progress?.problemId) {
            progressMap.set(Number(item.progress.problemId), item.progress);
          }
        });
        setUserProgress(progressMap);
        storage.set(cacheKey, data.data);
      }
    } catch (e) {
      console.error('Error fetching progress:', e);
    }
  }, [session]);

  const fetchProblems = useCallback(async (
    pageNum = 1, 
    sortBy = 'likes', 
    topic?: string, 
    platform?: string
  ) => {
    if (!companySlug || isFetchingRef.current) return;
    
    const cacheKey = `problems_${companySlug}_${topic}_${platform}_${sortBy}_${pageNum}`;
    
    if (pageNum === 1) {
      const cached = storage.get<{ data: Problem[]; total: number }>(cacheKey);
      if (cached) {
        setDisplayedProblems(cached.data);
        setTotalCount(cached.total);
        setLoading(false);
        return;
      }
    }
    
    isFetchingRef.current = true;
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const limit = ITEMS_PER_PAGE;
      const offset = (pageNum - 1) * ITEMS_PER_PAGE;
      const sortParam = sortBy === 'acceptance' ? 'acceptanceRate' : sortBy;
      const topicParam = topic ? `&topic=${encodeURIComponent(topic)}` : '';
      const platformParam = platform && platform !== 'ALL' ? `&platform=${platform}` : '';

      const res = await fetch(
        `/api/problems?company=${companySlug}&sortBy=${sortParam}&sortOrder=desc&limit=${limit}&offset=${offset}${topicParam}${platformParam}`
      );
      
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      
      const data = await res.json();

      if (data.success) {
        if (pageNum === 1) {
          setDisplayedProblems(data.data);
          if (data.total !== undefined) setTotalCount(data.total);
          storage.set(cacheKey, { data: data.data, total: data.total });
        } else {
          setDisplayedProblems(prev => [...prev, ...data.data]);
        }
        setHasMore(data.data.length === limit);
        setPage(pageNum);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch problems');
      }
    } catch (err) {
      console.error('Failed to fetch problems:', err);
      setError('Failed to fetch problems. Please try again.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      isFetchingRef.current = false;
    }
  }, [companySlug]);

  // Load both platforms on component mount and when company changes
  useEffect(() => {
    if (!companySlug || typeof window === 'undefined') return;
    
    const loadBothPlatforms = async () => {
      const platforms = ['LEETCODE', 'GEEKSFORGEEKS'];
      
      for (const platform of platforms) {
        const cacheKey = `topics_${companySlug}_${platform}`;
        const cached = storage.get(cacheKey);
        
        if (!cached) {
          try {
            const res = await fetch(`/api/companies/${companySlug}/topics?platform=${platform}`, {
              signal: AbortSignal.timeout(8000)
            });
            const data = await res.json();
            if (data.success) {
              storage.set(cacheKey, data.data);
              prefetchedRef.current.add(cacheKey);
            }
          } catch (err) {
            console.error(`Error loading ${platform} topics:`, err);
          }
        } else {
          prefetchedRef.current.add(cacheKey);
        }
      }
    };
    
    loadBothPlatforms();
  }, [companySlug]);

  useEffect(() => {
    if (platformFromUrl && platformFromUrl !== selectedPlatform) {
      setSelectedPlatform(platformFromUrl);
    }
  }, [platformFromUrl, selectedPlatform]);

  useEffect(() => {
    if (!selectedTopic) {
      setShowTopics(true);
      setLoading(false);
      fetchTopics(selectedPlatform);
    } else {
      setShowTopics(false);
      fetchProblems(1, sortKey, selectedTopic, selectedPlatform);
    }
    
    if (session?.user) fetchUserProgress();
  }, [companySlug, selectedTopic, selectedPlatform]);

  useEffect(() => {
    if (!selectedTopic) return;
    
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loadingMore && !loading && !isFetchingRef.current) {
        fetchProblems(page + 1, sortKey, selectedTopic, selectedPlatform);
      }
    }, { threshold: 0.1, rootMargin: '200px' });

    if (observerTarget.current) observer.observe(observerTarget.current);

    return () => {
      if (observerTarget.current) observer.unobserve(observerTarget.current);
      observer.disconnect();
    };
  }, [hasMore, loadingMore, loading, fetchProblems, page, sortKey, selectedTopic, selectedPlatform]);

  const updateProgress = useCallback(async (problemId: number, status: 'solved' | 'attempted' | 'bookmarked') => {
    if (!session?.user) {
      alert('Please login to track progress');
      return;
    }
    
    const newProgress = new Map(userProgress);
    newProgress.set(problemId, {
      problemId,
      status,
      solvedAt: status === 'solved' ? new Date() : undefined,
    });
    setUserProgress(newProgress);

    try {
      await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemId,
          status,
          solvedAt: status === 'solved' ? new Date().toISOString() : null,
        }),
      });
      storage.remove('user_progress');
    } catch (err) {
      console.error('Error updating progress:', err);
      setUserProgress(userProgress);
    }
  }, [session, userProgress]);

  const handleTopicClick = useCallback((topic: string) => {
    const params = new URLSearchParams();
    params.set('topic', topic);
    params.set('platform', selectedPlatform);
    router.push(`/companies/${companySlug}?${params.toString()}`);
  }, [companySlug, router, selectedPlatform]);

  const handlePlatformChange = useCallback((platform: 'LEETCODE' | 'GEEKSFORGEEKS') => {
    if (platform === selectedPlatform || switchingPlatform) return;
    
    // Update state synchronously
    setTopics([]);
    setLoadingTopics(true);
    setSwitchingPlatform(true);
    setSelectedPlatform(platform);
    setPage(1);
    setHasMore(true);
    
    // Fetch topics for the new platform
    fetchTopics(platform);
  }, [selectedPlatform, switchingPlatform, fetchTopics]);

  // ==================== RENDER ====================

  const solvedInView = displayedProblems.filter(
    (p) => userProgress.get(p.id)?.status === 'solved'
  ).length;

  const platformLabels: Record<string, string> = {
    LEETCODE: 'LeetCode',
    GEEKSFORGEEKS: 'GeeksforGeeks',
  };

  if (loading && !showTopics) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-4xl px-4 py-8 md:px-6 md:py-10">
          <Skeleton className="h-4 w-56" />
          <Skeleton className="mt-6 h-16 rounded-2xl" />
          <div className="mt-6 space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-12 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-4xl px-4 py-8 md:px-6 md:py-10">
          <SheetBreadcrumb
            items={[{ label: 'Companies', href: '/companies' }, { label: prettyCompanyName }]}
          />
          <div className="mt-6 flex flex-col items-center rounded-2xl border bg-card py-16 text-center">
            <Building2 className="size-6 text-muted-foreground/40" strokeWidth={1.5} />
            <h2 className="mt-4 text-sm font-semibold tracking-tight">
              Could not load problems
            </h2>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">{error}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-5"
              onClick={() => fetchProblems(1, sortKey, selectedTopic || undefined)}
            >
              Try again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Topics view ─────────────────────────────────────────────────
  if (showTopics && !selectedTopic) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-5xl px-4 py-8 md:px-6 md:py-10">
          <SheetBreadcrumb
            items={[{ label: 'Companies', href: '/companies' }, { label: prettyCompanyName }]}
          />

          <div className="mt-6 flex items-center gap-4">
            <CompanyLogo companyName={prettyCompanyName || ''} />
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-semibold capitalize tracking-tight md:text-3xl">
                {prettyCompanyName}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Problems asked in {prettyCompanyName} interviews.
              </p>
            </div>
          </div>

          {/* Platform */}
          <div className="mt-6 inline-flex rounded-full border bg-card p-1">
            {(['LEETCODE', 'GEEKSFORGEEKS'] as const).map((key) => (
              <button
                key={key}
                onClick={() => handlePlatformChange(key)}
                disabled={switchingPlatform}
                className={cn(
                  'rounded-full px-4 py-1.5 text-sm transition-colors',
                  selectedPlatform === key
                    ? 'bg-muted font-medium text-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                  switchingPlatform && 'opacity-60'
                )}
              >
                {platformLabels[key]}
              </button>
            ))}
          </div>

          {/* Topics */}
          <div className="mt-8 flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-tight">Topics</h2>
            <Badge variant="outline" className="tabular-nums">
              {topics.length}
            </Badge>
          </div>

          {loadingTopics || switchingPlatform ? (
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-[104px] rounded-2xl" />
              ))}
            </div>
          ) : topics.length === 0 ? (
            <div className="mt-3 flex flex-col items-center rounded-2xl border bg-card py-16 text-center">
              <Building2 className="size-6 text-muted-foreground/40" strokeWidth={1.5} />
              <p className="mt-4 text-sm font-semibold tracking-tight">No topics found</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Nothing indexed for this company on {platformLabels[selectedPlatform]} yet.
              </p>
            </div>
          ) : (
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {topics.map((topic) => (
                <TopicCard
                  key={topic.name}
                  topic={topic}
                  onClick={() => handleTopicClick(topic.name)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Problems view ───────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8 md:px-6 md:py-10">
        <SheetBreadcrumb
          items={[
            { label: 'Companies', href: '/companies' },
            {
              label: prettyCompanyName,
              href: `/companies/${companySlug}?platform=${selectedPlatform}`,
            },
            { label: selectedTopic || '' },
          ]}
        />

        <div className="mt-6 rounded-2xl border bg-card p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <CompanyLogo companyName={prettyCompanyName || ''} />
              <div className="min-w-0">
                <h1 className="truncate text-lg font-semibold capitalize tracking-tight">
                  {selectedTopic}
                </h1>
                <p className="mt-0.5 text-sm text-muted-foreground tabular-nums">
                  {prettyCompanyName} · {totalCount} problems
                </p>
              </div>
            </div>

            <Select value={sortKey} onValueChange={setSortKey}>
              <SelectTrigger className="w-[168px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="likes">Most liked</SelectItem>
                <SelectItem value="acceptance">Acceptance rate</SelectItem>
                <SelectItem value="title">Title (A-Z)</SelectItem>
                <SelectItem value="difficulty">Difficulty</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Overall progress</span>
              <span className="text-xs text-muted-foreground tabular-nums">
                <span className="font-semibold text-foreground">{solvedInView}</span>/
                {displayedProblems.length} loaded
              </span>
            </div>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-500"
                style={{
                  width: `${
                    displayedProblems.length > 0
                      ? (solvedInView / displayedProblems.length) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Problems */}
        {displayedProblems.length === 0 ? (
          <div className="mt-4 flex flex-col items-center rounded-2xl border bg-card py-16 text-center">
            <Building2 className="size-6 text-muted-foreground/40" strokeWidth={1.5} />
            <p className="mt-4 text-sm font-semibold tracking-tight">No problems found</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Nothing indexed for this topic yet.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-2">
            {displayedProblems.map((problem) => {
              const current = userProgress.get(problem.id)?.status;

              return (
                <ProblemRow
                  key={problem.id}
                  title={problem.title}
                  url={problem.url}
                  difficulty={problem.difficulty}
                  status={current}
                  isLocked={!session?.user}
                  onToggle={() =>
                    updateProgress(
                      problem.id,
                      current === 'attempted' ? 'solved' : 'attempted'
                    )
                  }
                />
              );
            })}
          </div>
        )}

        {loadingMore && (
          <div className="py-6 text-center">
            <span className="text-sm text-muted-foreground">Loading more…</span>
          </div>
        )}

        <div ref={observerTarget} className="h-10" />

        {!hasMore && displayedProblems.length > 0 && (
          <p className="pb-4 text-center text-sm text-muted-foreground tabular-nums">
            All {displayedProblems.length} problems loaded
          </p>
        )}
      </div>
    </div>
  );
}
