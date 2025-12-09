'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo, memo } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ExternalLink, CheckCircle, Circle, ArrowLeft, Lock, TrendingUp, Filter, Tags, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { motion } from 'framer-motion';
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
      <div className="w-16 h-16 md:w-20 md:h-20 flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/20 dark:to-primary/30 rounded-2xl border-2 border-border">
        <Building2 className="w-8 h-8 md:w-10 md:h-10 text-primary" />
      </div>
    );
  }
  
  return (
    <div className="w-16 h-16 md:w-20 md:h-20 relative overflow-hidden rounded-2xl bg-white dark:bg-card border-2 border-border shadow-sm hover:shadow-md transition-shadow">
      <img
        src={logoSources[currentSourceIndex]}
        alt={`${companyName} logo`}
        className="w-full h-full object-contain p-2.5"
        onError={handleError}
        loading="lazy"
      />
    </div>
  );
});

CompanyLogo.displayName = 'CompanyLogo';

// Improved Topic Card with DSA Sheet style - larger cards with progress
const TopicCard = memo(({ topic, onClick }: { topic: TopicData; onClick: () => void }) => {
  // Parse topic count if it has solved/total format
  const parts = topic.count.toString().split('/');
  const total = parts.length > 1 ? parseInt(parts[1]) : topic.count;
  const solved = parts.length > 1 ? parseInt(parts[0]) : 0;
  const progressPercent = total > 0 ? (solved / total) * 100 : 0;
  
  return (
    <div 
      onClick={onClick}
      className="group cursor-pointer transition-all duration-300 hover:scale-105"
    >
      <Card 
        className="h-full border border-border/50 bg-card hover:border-primary/60 transition-all duration-300 shadow-md hover:shadow-lg"
      >
        <CardContent className="p-5 h-full flex flex-col justify-between">
          <div className="flex-1">
            <h3 className="font-bold text-lg leading-snug line-clamp-2 group-hover:text-primary transition-colors mb-3 text-foreground">
              {topic.name}
            </h3>
          </div>
          
          <div className="space-y-3 mt-4">
            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="w-full h-2 bg-muted/40 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary via-primary/80 to-primary/60 transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground font-medium">{solved}/{total}</span>
                <span className="text-primary font-semibold">{Math.round(progressPercent)}%</span>
              </div>
            </div>
            
            {/* Problem Count */}
            <div className="flex items-center gap-2 pt-1 border-t border-border/30">
              <TrendingUp className="h-4 w-4 text-primary/70" />
              <span className="text-sm font-semibold text-foreground">
                {topic.count} problems
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

TopicCard.displayName = 'TopicCard';

// Improved Problem Card
const ProblemCard = memo(({ 
  problem,
  index,
  userProgress, 
  session, 
  onUpdateProgress,
  getDifficultyColor,
}: { 
  problem: Problem;
  index: number;
  userProgress: Map<number, UserProgress>;
  session: { user?: { id?: string; email?: string | null; name?: string | null } } | null;
  onUpdateProgress: (id: number, status: 'solved' | 'attempted' | 'bookmarked') => void;
  getDifficultyColor: (difficulty: string) => string;
}) => {
  const progress = userProgress.get(problem.id);
  const isSolved = progress?.status === 'solved';
  const isAttempted = progress?.status === 'attempted';
  const [isUpdating, setIsUpdating] = useState(false);

  const handleToggleStatus = async () => {
    if (!session?.user) return;
    setIsUpdating(true);
    
    let newStatus: 'solved' | 'attempted' | undefined;
    if (!progress?.status) newStatus = 'attempted';
    else if (progress.status === 'attempted') newStatus = 'solved';
    else newStatus = undefined;

    if (newStatus) {
      await onUpdateProgress(problem.id, newStatus);
    }
    setIsUpdating(false);
  };

  return (
    <Card 
      className={cn(
        "transition-all duration-200 hover:shadow-md",
        isSolved ? 'bg-green-50/50 dark:bg-green-950/20 border-green-500/30' :
        isAttempted ? 'bg-yellow-50/50 dark:bg-yellow-950/20 border-yellow-500/30' :
        'hover:border-primary/30 hover:bg-accent/30'
      )}
    >
      <CardContent className="p-4 md:p-5">
        <div className="flex items-start gap-3 md:gap-4">
          {/* Checkbox */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggleStatus}
            disabled={isUpdating || !session?.user}
            className="p-0 h-8 w-8 hover:bg-transparent flex-shrink-0"
            title={!session?.user ? "Sign in to mark problems" : ""}
          >
            {isUpdating ? (
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            ) : isSolved ? (
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-500" />
            ) : isAttempted ? (
              <Circle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 fill-current" />
            ) : (
              <div className="relative">
                <Circle className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
                {!session?.user && (
                  <Lock className="h-3 w-3 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-destructive" />
                )}
              </div>
            )}
          </Button>

          {/* Problem Number */}
          <div className="text-muted-foreground font-mono text-sm font-semibold w-10 flex-shrink-0">
            #{index + 1}
          </div>

          {/* Problem Details */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-start gap-2 flex-wrap">
              <h3 className="font-semibold text-base md:text-lg hover:text-primary transition-colors cursor-pointer flex-1 min-w-0">
                {problem.title}
              </h3>
              {problem.isPremium && (
                <Badge variant="secondary" className="text-xs">Premium</Badge>
              )}
              {isSolved && (
                <Badge className="bg-green-600 dark:bg-green-700 hover:bg-green-700 dark:hover:bg-green-800 text-xs lg:flex hidden">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Solved
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={cn('font-medium', getDifficultyColor(problem.difficulty))}>
                {problem.difficulty}
              </Badge>
              <Badge variant="outline" className="border-2">{problem.platform}</Badge>
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                👍 {(problem.likes / 1000).toFixed(1)}k
              </span>
              {problem.acceptanceRate && (
                <span className="text-sm text-muted-foreground hidden md:inline">
                  ✓ {problem.acceptanceRate}%
                </span>
              )}
            </div>
          </div>

          {/* Action Button */}
          <Button
            size="default"
            className="gap-2 flex-shrink-0"
            onClick={() => window.open(problem.url, '_blank')}
          >
            {!session?.user ? (
              <Lock className="h-4 w-4" />
            ) : (
              <ExternalLink className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">Solve</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});

ProblemCard.displayName = 'ProblemCard';

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

  const getDifficultyColor = useCallback((difficulty: string) => {
    switch (difficulty) {
      case 'EASY': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'MEDIUM': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'HARD': return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  }, []);

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

  if (loading && !showTopics) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground text-lg">Loading {prettyCompanyName} problems...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8 px-4 md:px-6 max-w-7xl">
          <div className="mb-6">
            <Link href="/companies" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
              <ArrowLeft className="h-4 w-4" />
              Back to Companies
            </Link>
          </div>
          <Card className="border-destructive/50">
            <CardContent className="pt-6">
              <div className="text-center py-12 space-y-4">
                <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
                  <Building2 className="h-8 w-8 text-destructive" />
                </div>
                <div>
                  <p className="text-destructive font-semibold text-lg mb-2">Error loading problems</p>
                  <p className="text-muted-foreground">{error}</p>
                </div>
                <Button onClick={() => fetchProblems(1, sortKey, selectedTopic || undefined)}>
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Topics View
  if (showTopics && !selectedTopic) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b border-border/50 bg-card/40 dark:bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/40">
          <div className="container mx-auto py-6 md:py-8 px-4 md:px-6 max-w-7xl">
            <div className="mb-6">
              <Link href="/companies" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline transition-colors">
                <ArrowLeft className="h-4 w-4" />
                Back to Companies
              </Link>
            </div>

            <div className="flex items-start gap-4 md:gap-6">
              <div className="flex-1 min-w-0">
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground capitalize mb-3">
                    {prettyCompanyName}
                  </h1>
                  <p className="text-muted-foreground text-base md:text-lg">
                    Master DSA problems asked in {prettyCompanyName} interviews
                  </p>
                </motion.div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto py-6 md:py-8 px-4 md:px-6 max-w-7xl">
          {/* Platform Tabs */}
          <motion.div 
            className="mb-6"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex gap-3 w-fit">
              <button
                onClick={() => handlePlatformChange('LEETCODE')}
                disabled={switchingPlatform}
                className={cn(
                  "flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold transition-all duration-300 text-sm",
                  selectedPlatform === 'LEETCODE'
                    ? "bg-primary text-primary-foreground shadow-md hover:shadow-lg hover:bg-primary/90"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80",
                  switchingPlatform && "opacity-60 cursor-not-allowed"
                )}
              >
                {switchingPlatform && selectedPlatform !== 'LEETCODE' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M13.483 0a1.374 1.374 0 0 0-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 0 0-1.209 2.104 5.35 5.35 0 0 0-.125.513 5.527 5.527 0 0 0 .062 2.362 5.83 5.83 0 0 0 .349 1.017 5.938 5.938 0 0 0 1.271 1.818l4.277 4.193.039.038c2.248 2.165 5.852 2.133 8.063-.074l2.396-2.392c.54-.54.54-1.414.003-1.955a1.378 1.378 0 0 0-1.951-.003l-2.396 2.392a3.021 3.021 0 0 1-4.205.038l-.02-.019-4.276-4.193c-.652-.64-.972-1.469-.948-2.263a2.68 2.68 0 0 1 .066-.523 2.545 2.545 0 0 1 .619-1.164L9.13 8.114c1.058-1.134 3.204-1.27 4.43-.278l3.501 2.831c.593.48 1.461.387 1.94-.207a1.384 1.384 0 0 0-.207-1.943l-3.5-2.831c-.8-.647-1.766-1.045-2.774-1.202l2.015-2.158A1.384 1.384 0 0 0 13.483 0zm-2.866 12.815a1.38 1.38 0 0 0-1.38 1.382 1.38 1.38 0 0 0 1.38 1.382H20.79a1.38 1.38 0 0 0 1.38-1.382 1.38 1.38 0 0 0-1.38-1.382z"/>
                  </svg>
                )}
                LeetCode
              </button>
              <button
                onClick={() => handlePlatformChange('GEEKSFORGEEKS')}
                disabled={switchingPlatform}
                className={cn(
                  "flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold transition-all duration-300 text-sm",
                  selectedPlatform === 'GEEKSFORGEEKS'
                    ? "bg-primary text-primary-foreground shadow-md hover:shadow-lg hover:bg-primary/90"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80",
                  switchingPlatform && "opacity-60 cursor-not-allowed"
                )}
              >
                {switchingPlatform && selectedPlatform !== 'GEEKSFORGEEKS' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : null}
                GeeksforGeeks
              </button>
            </div>
          </motion.div>

          {/* Topics Grid */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3">
                <Tags className="h-5 w-5 text-primary" /> 
                <span>Topics</span>
                <Badge 
                  className={cn(
                    "ml-auto text-xs font-semibold border",
                    selectedPlatform === 'LEETCODE' 
                      ? "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-500/30" 
                      : "bg-green-100 text-green-700 border-green-300 dark:bg-green-950/40 dark:text-green-400 dark:border-green-500/30"
                  )}
                >
                  {topics.length} topics
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingTopics || switchingPlatform ? (
                <motion.div 
                  className="flex items-center justify-center py-12"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="text-center space-y-3">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                    <p className="text-muted-foreground text-sm">
                      Loading {selectedPlatform === 'LEETCODE' ? 'LeetCode' : 'GeeksforGeeks'} topics...
                    </p>
                  </div>
                </motion.div>
              ) : topics.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <Tags className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">No topics found for this company</p>
                </div>
              ) : (
                <motion.div 
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                >
                  {topics.map((topic, index) => (
                    <motion.div
                      key={topic.name}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ 
                        duration: 0.3, 
                        delay: index * 0.05,
                        ease: "easeOut"
                      }}
                    >
                      <TopicCard 
                        topic={topic} 
                        onClick={() => handleTopicClick(topic.name)} 
                      />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Problems View
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="container mx-auto py-6 md:py-8 px-4 md:px-6 max-w-7xl">
          <div className="mb-4">
            <Link 
              href={`/companies/${companySlug}?platform=${selectedPlatform}`} 
              className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Topics
            </Link>
          </div>

          <div className="flex items-start gap-4">
            <CompanyLogo companyName={prettyCompanyName || ''} />
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-primary via-primary/90 to-primary/70 bg-clip-text text-transparent capitalize mb-2">
                {prettyCompanyName} - {selectedTopic}
              </h1>
              <p className="text-sm md:text-base text-muted-foreground">
                {displayedProblems.length} of {totalCount} problems
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto py-6 md:py-8 px-4 md:px-6 max-w-7xl">
        {/* Sort & Filter */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Filter className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <label className="text-sm font-medium">Sort by:</label>
              <Select value={sortKey} onValueChange={setSortKey}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="likes">Most Liked</SelectItem>
                  <SelectItem value="acceptance">Acceptance Rate</SelectItem>
                  <SelectItem value="title">Title (A-Z)</SelectItem>
                  <SelectItem value="difficulty">Difficulty</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Problems List */}
        <div className="space-y-3">
          {displayedProblems.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12">
                <div className="text-center space-y-3">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
                    <Building2 className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">No problems found for this topic</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            displayedProblems.map((problem, index) => (
              <ProblemCard
                key={problem.id}
                problem={problem}
                index={index}
                userProgress={userProgress}
                session={session}
                onUpdateProgress={updateProgress}
                getDifficultyColor={getDifficultyColor}
              />
            ))
          )}
        </div>

        {/* Legend */}
        {displayedProblems.length > 0 && (
          <Card className="mt-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-center gap-6 text-sm flex-wrap">
                <div className="flex items-center gap-2">
                  <Circle className="h-5 w-5 text-muted-foreground" />
                  <span className="text-muted-foreground font-medium">Todo</span>
                </div>
                <div className="flex items-center gap-2">
                  <Circle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 fill-current" />
                  <span className="text-muted-foreground font-medium">Attempted</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-500" />
                  <span className="text-muted-foreground font-medium">Solved</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {loadingMore && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        )}

        <div ref={observerTarget} className="h-10" />

        {!hasMore && displayedProblems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8"
          >
            <Card className="border-dashed">
              <CardContent className="py-8 text-center space-y-2">
                <p className="text-lg font-semibold">🎉 You&apos;ve reached the end!</p>
                <p className="text-sm text-muted-foreground">
                  Explored all {displayedProblems.length} problems in this topic
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
