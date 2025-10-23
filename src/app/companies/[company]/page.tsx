'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo, memo } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ExternalLink, Bookmark, CheckCircle2, Circle, ArrowLeft, Lock, TrendingUp, Filter, Tags, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';

const ITEMS_PER_PAGE = 20;
const CACHE_DURATION = 600000; // 10 minutes
const STORAGE_PREFIX = 'tp_'; // TalentPath prefix

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

// Enhanced localStorage with compression and error handling
const storage = {
  set: <T,>(key: string, data: T): void => {
    if (typeof window === 'undefined') {return;}
    try {
      const cached: CachedData<T> = { data, timestamp: Date.now() };
      localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(cached));
    } catch (err) {
      console.warn('Storage set failed:', err);
      // Clear old cache if quota exceeded
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
    if (typeof window === 'undefined') {return null;}
    try {
      const item = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
      if (!item) {return null;}
      
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
    if (typeof window === 'undefined') {return;}
    try {
      localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
    } catch (err) {
      console.warn('Storage remove failed:', err);
    }
  },

  clearOld: (): void => {
    if (typeof window === 'undefined') {return;}
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

// Debounce function for URL updates
const debounce = (func: (platform: string, topic?: string) => void, wait: number) => {
  let timeout: NodeJS.Timeout;
  return (platform: string, topic?: string) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(platform, topic), wait);
  };
};

// ==================== MEMOIZED COMPONENTS ====================

const CompanyLogo = memo(({ companyName }: { companyName: string }) => {
  const [logoError, setLogoError] = useState(false);
  const [logoLoading, setLogoLoading] = useState(true);
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
      setLogoLoading(false);
    }
  }, [currentSourceIndex, logoSources.length]);
  
  if (logoError) {
    return (
      <div className="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-primary/20 to-purple-600/20 rounded-xl">
        <Building2 className="w-6 h-6 text-primary" />
      </div>
    );
  }
  
  return (
    <div className="w-12 h-12 relative overflow-hidden rounded-xl bg-white/50 backdrop-blur-sm border border-white/20 shadow-lg">
      {logoLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
        </div>
      )}
      <img
        src={logoSources[currentSourceIndex]}
        alt={`${companyName} logo`}
        className={cn("w-full h-full object-contain p-1.5", logoLoading ? "opacity-0" : "opacity-100")}
        onLoad={() => setLogoLoading(false)}
        onError={handleError}
        loading="lazy"
      />
    </div>
  );
});

CompanyLogo.displayName = 'CompanyLogo';

// Memoized Topic Card
const TopicCard = memo(({ topic, onClick }: { topic: TopicData; onClick: () => void }) => (
  <Button
    variant="outline"
    className="w-full h-auto py-4 px-4 flex flex-col items-start justify-between gap-2 hover:border-primary hover:bg-primary/5 transition-all group"
    onClick={onClick}
  >
    <span className="font-semibold text-left group-hover:text-primary transition-colors">
      {topic.name}
    </span>
    <div className="flex items-center gap-1 text-xs text-muted-foreground">
      <TrendingUp className="h-3 w-3" />
      <span>{topic.count} problems</span>
    </div>
  </Button>
));

TopicCard.displayName = 'TopicCard';

// Memoized Problem Card
const ProblemCard = memo(({ 
  problem, 
  userProgress, 
  session, 
  onUpdateProgress,
  getDifficultyColor,
  getStatusIcon
}: { 
  problem: Problem;
  userProgress: Map<number, UserProgress>;
  session: { user?: { id?: string; email?: string | null; name?: string | null } } | null;
  onUpdateProgress: (id: number, status: 'solved' | 'attempted' | 'bookmarked') => void;
  getDifficultyColor: (difficulty: string) => string;
  getStatusIcon: (problemId: number) => React.ReactNode;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.2 }}
    className="flex items-center gap-4 p-4 rounded-xl border-2 bg-card hover:bg-accent/50 transition-colors hover:border-primary/50 hover:shadow-md"
  >
    <div className="flex-shrink-0">
      <button
        onClick={() => {
          if (!session?.user) {
            alert('Please login to track progress');
            return;
          }
          const currentStatus = userProgress.get(problem.id)?.status;
          const nextStatus = currentStatus === 'solved' ? 'attempted' : 'solved';
          onUpdateProgress(problem.id, nextStatus);
        }}
        className="hover:scale-110 transition-transform disabled:cursor-not-allowed"
        disabled={!session}
      >
        {getStatusIcon(problem.id)}
      </button>
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-2">
        <h3 className="font-semibold truncate text-lg">{problem.title}</h3>
        {problem.isPremium && (
          <Badge variant="outline" className="text-xs border-amber-500 text-amber-500">
            Premium
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <Badge className={cn('font-medium', getDifficultyColor(problem.difficulty))}>
          {problem.difficulty}
        </Badge>
        <Badge variant="outline" className="border-2">{problem.platform}</Badge>
        {problem.topicTags.slice(0, 2).map(tag => (
          <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
        ))}
        {problem.topicTags.length > 2 && (
          <span className="text-xs text-muted-foreground font-medium">
            +{problem.topicTags.length - 2} more
          </span>
        )}
      </div>
    </div>
    <div className="hidden lg:flex items-center gap-6 text-sm">
      <div className="text-center">
        <p className="font-bold text-lg text-emerald-500">{problem.acceptanceRate}%</p>
        <p className="text-xs text-muted-foreground">Accepted</p>
      </div>
      <div className="text-center">
        <p className="font-bold text-lg">{problem.likes}</p>
        <p className="text-xs text-muted-foreground">Likes</p>
      </div>
    </div>
    <div className="flex items-center gap-2">
      <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onUpdateProgress(problem.id, 'bookmarked')}
          disabled={!session}
          className="hover:text-blue-500"
        >
          <Bookmark className="h-4 w-4" />
        </Button>
      </motion.div>
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button size="sm" className="gap-2 font-medium" asChild>
          <a href={problem.url} target="_blank" rel="noopener noreferrer">
            Solve <ExternalLink className="h-3 w-3" />
          </a>
        </Button>
      </motion.div>
    </div>
  </motion.div>
));

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

  // Debounced URL update
  const updateUrlDebounced = useMemo(
    () => debounce((platform: string, topic?: string) => {
      const params = new URLSearchParams();
      params.set('platform', platform);
      if (topic) {params.set('topic', topic);}
      router.replace(`/companies/${companySlug}?${params.toString()}`, { scroll: false });
    }, 300),
    [companySlug, router]
  );

  // Fetch topics with aggressive caching
  const fetchTopics = useCallback(async (platform: string) => {
    if (!companySlug) {return;}
    
    const cacheKey = `topics_${companySlug}_${platform}`;
    const cached = storage.get<TopicData[]>(cacheKey);
    
    if (cached) {
      setTopics(cached);
      setLoadingTopics(false);
      setSwitchingPlatform(false);
      return;
    }
    
    setSwitchingPlatform(true);
    setLoadingTopics(true);
    
    try {
      const res = await fetch(`/api/companies/${companySlug}/topics?platform=${platform}`);
      const data = await res.json();
      
      if (data.success) {
        setTopics(data.data);
        storage.set(cacheKey, data.data);
      }
    } catch (err) {
      console.error('Error fetching topics:', err);
    } finally {
      setSwitchingPlatform(false);
      setLoadingTopics(false);
    }
  }, [companySlug]);

  // Fetch user progress with caching
  const fetchUserProgress = useCallback(async () => {
    if (!session?.user) {return;}
    
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

  // Fetch problems with caching
  const fetchProblems = useCallback(async (
    pageNum = 1, 
    sortBy = 'likes', 
    topic?: string, 
    platform?: string
  ) => {
    if (!companySlug || isFetchingRef.current) {return;}
    
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
    if (pageNum === 1) {setLoading(true);}
    else {setLoadingMore(true);}

    try {
      const limit = ITEMS_PER_PAGE;
      const offset = (pageNum - 1) * ITEMS_PER_PAGE;
      const sortParam = sortBy === 'acceptance' ? 'acceptanceRate' : sortBy;
      const topicParam = topic ? `&topic=${encodeURIComponent(topic)}` : '';
      const platformParam = platform && platform !== 'ALL' ? `&platform=${platform}` : '';

      const res = await fetch(
        `/api/problems?company=${companySlug}&sortBy=${sortParam}&sortOrder=desc&limit=${limit}&offset=${offset}${topicParam}${platformParam}`
      );
      
      if (!res.ok) {throw new Error(`HTTP error! status: ${res.status}`);}
      
      const data = await res.json();

      if (data.success) {
        if (pageNum === 1) {
          setDisplayedProblems(data.data);
          if (data.total !== undefined) {setTotalCount(data.total);}
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

  // Prefetch both platforms
  useEffect(() => {
    if (!companySlug || typeof window === 'undefined') {return;}
    
    const prefetch = () => {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
          ['LEETCODE', 'GEEKSFORGEEKS'].forEach(async (platform) => {
            const cacheKey = `topics_${companySlug}_${platform}`;
            if (!prefetchedRef.current.has(cacheKey) && !storage.get(cacheKey)) {
              try {
                const res = await fetch(`/api/companies/${companySlug}/topics?platform=${platform}`);
                const data = await res.json();
                if (data.success) {
                  storage.set(cacheKey, data.data);
                  prefetchedRef.current.add(cacheKey);
                }
              } catch (err) {
                console.error(`Prefetch error for ${platform}:`, err);
              }
            }
          });
        }, { timeout: 2000 });
      }
    };
    
    prefetch();
  }, [companySlug]);

  // Initialize from URL
  useEffect(() => {
    if (platformFromUrl && platformFromUrl !== selectedPlatform) {
      setSelectedPlatform(platformFromUrl);
    }
  }, [platformFromUrl, selectedPlatform]);

  // Main data fetching effect
  useEffect(() => {
    if (!selectedTopic) {
      fetchTopics(selectedPlatform);
      setShowTopics(true);
      setLoading(false);
    } else {
      setShowTopics(false);
      fetchProblems(1, sortKey, selectedTopic, selectedPlatform);
    }
    
    if (session?.user) {fetchUserProgress();}
  }, [companySlug, sortKey, selectedTopic, selectedPlatform, fetchTopics, fetchProblems, fetchUserProgress, session]);

  // Intersection observer for infinite scroll
  useEffect(() => {
    if (!selectedTopic) {return;}
    
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loadingMore && !loading && !isFetchingRef.current) {
        fetchProblems(page + 1, sortKey, selectedTopic, selectedPlatform);
      }
    }, { threshold: 0.1, rootMargin: '200px' });

    if (observerTarget.current) {observer.observe(observerTarget.current);}

    return () => {
      if (observerTarget.current) {observer.unobserve(observerTarget.current);}
      observer.disconnect();
    };
  }, [hasMore, loadingMore, loading, fetchProblems, page, sortKey, selectedTopic, selectedPlatform]);

  // Update progress
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
      case 'EASY': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'MEDIUM': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'HARD': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      default: return 'bg-gray-500/10 text-gray-500';
    }
  }, []);

  const handleTopicClick = useCallback((topic: string) => {
    const params = new URLSearchParams();
    params.set('topic', topic);
    params.set('platform', selectedPlatform);
    router.push(`/companies/${companySlug}?${params.toString()}`);
  }, [companySlug, router, selectedPlatform]);

  const handleBackToTopics = useCallback(() => {
    const params = new URLSearchParams();
    params.set('platform', selectedPlatform);
    router.push(`/companies/${companySlug}?${params.toString()}`);
  }, [companySlug, router, selectedPlatform]);

  const handlePlatformChange = useCallback((platform: 'LEETCODE' | 'GEEKSFORGEEKS') => {
    if (platform === selectedPlatform) {return;}
    setSelectedPlatform(platform);
    updateUrlDebounced(platform, selectedTopic || undefined);
  }, [selectedPlatform, selectedTopic, updateUrlDebounced]);

  const getStatusIcon = useCallback((problemId: number) => {
    if (!session?.user) {
      return (
        <div className="relative group">
          <Lock className="h-5 w-5 text-gray-400 cursor-not-allowed" />
          <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
            Login to track
          </span>
        </div>
      );
    }

    const progress = userProgress.get(problemId);
    if (!progress) {return <Circle className="h-5 w-5 text-gray-400" />;}
    if (progress.status === 'solved') {return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;}
    if (progress.status === 'attempted') {return <Circle className="h-5 w-5 text-amber-500 fill-amber-500" />;}
    if (progress.status === 'bookmarked') {return <Bookmark className="h-5 w-5 text-blue-500 fill-blue-500" />;}
  }, [session, userProgress]);

  // ==================== RENDER ====================

  if (loading && !showTopics) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading {prettyCompanyName} problems...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-8xl">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/companies" className="flex items-center gap-2 text-sm font-medium text-primary hover:underline">
            <ArrowLeft className="h-4 w-4" />
            Back to Companies
          </Link>
        </div>
        <Card className="border-2 border-destructive">
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <p className="text-destructive font-semibold mb-2">Error loading problems</p>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={() => fetchProblems(1, sortKey, selectedTopic || undefined)}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Topics View
  if (showTopics && !selectedTopic) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-8xl">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/companies" className="flex items-center gap-2 text-sm font-medium text-primary hover:underline">
            <ArrowLeft className="h-4 w-4" />
            Back to Companies
          </Link>
        </div>

        <div className="flex items-center gap-4 mb-2">
          <CompanyLogo companyName={prettyCompanyName || ''} />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent capitalize">
            {prettyCompanyName} Topics
          </h1>
        </div>
        <p className="text-muted-foreground mb-6">Select a topic to view related interview problems</p>

        {/* Platform Tabs */}
        <div className="mb-6">
          <div className="border-b border-border">
            <div className="flex gap-1">
              <button
                onClick={() => handlePlatformChange('LEETCODE')}
                disabled={switchingPlatform}
                className={cn(
                  "relative px-6 py-3 font-semibold transition-all duration-200 border-b-2",
                  selectedPlatform === 'LEETCODE'
                    ? "border-orange-500 text-orange-500"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border",
                  switchingPlatform && "opacity-50 cursor-not-allowed"
                )}
              >
                <span className="flex items-center gap-2">
                  {switchingPlatform && selectedPlatform === 'LEETCODE' && (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M13.483 0a1.374 1.374 0 0 0-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 0 0-1.209 2.104 5.35 5.35 0 0 0-.125.513 5.527 5.527 0 0 0 .062 2.362 5.83 5.83 0 0 0 .349 1.017 5.938 5.938 0 0 0 1.271 1.818l4.277 4.193.039.038c2.248 2.165 5.852 2.133 8.063-.074l2.396-2.392c.54-.54.54-1.414.003-1.955a1.378 1.378 0 0 0-1.951-.003l-2.396 2.392a3.021 3.021 0 0 1-4.205.038l-.02-.019-4.276-4.193c-.652-.64-.972-1.469-.948-2.263a2.68 2.68 0 0 1 .066-.523 2.545 2.545 0 0 1 .619-1.164L9.13 8.114c1.058-1.134 3.204-1.27 4.43-.278l3.501 2.831c.593.48 1.461.387 1.94-.207a1.384 1.384 0 0 0-.207-1.943l-3.5-2.831c-.8-.647-1.766-1.045-2.774-1.202l2.015-2.158A1.384 1.384 0 0 0 13.483 0zm-2.866 12.815a1.38 1.38 0 0 0-1.38 1.382 1.38 1.38 0 0 0 1.38 1.382H20.79a1.38 1.38 0 0 0 1.38-1.382 1.38 1.38 0 0 0-1.38-1.382z"/>
                  </svg>
                  LeetCode
                </span>
                {selectedPlatform === 'LEETCODE' && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </button>
              <button
                onClick={() => handlePlatformChange('GEEKSFORGEEKS')}
                disabled={switchingPlatform}
                className={cn(
                  "relative px-6 py-3 font-semibold transition-all duration-200 border-b-2",
                  selectedPlatform === 'GEEKSFORGEEKS'
                    ? "border-green-600 text-green-600"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border",
                  switchingPlatform && "opacity-50 cursor-not-allowed"
                )}
              >
                <span className="flex items-center gap-2">
                  {switchingPlatform && selectedPlatform === 'GEEKSFORGEEKS' && (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                  GeeksforGeeks
                </span>
                {selectedPlatform === 'GEEKSFORGEEKS' && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-600"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Topics Grid */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tags className="h-5 w-5" /> All Topics
              <Badge variant="secondary" className="ml-2">
                {selectedPlatform === 'LEETCODE' ? 'LeetCode' : 'GeeksforGeeks'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingTopics ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-muted-foreground font-medium">Loading topics...</p>
                </div>
              </div>
            ) : topics.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No topics found for this company.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {topics.map((topic) => (
                  <TopicCard 
                    key={topic.name} 
                    topic={topic} 
                    onClick={() => handleTopicClick(topic.name)} 
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Problems View
  return (
    <div className="container mx-auto py-8 px-4 max-w-8xl">
      <div className="flex items-center gap-4 mb-6 flex-wrap">
        <button
          onClick={handleBackToTopics}
          className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Topics
        </button>
        <span className="text-muted-foreground">|</span>
        <Link href="/companies" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary hover:underline">
          All Companies
        </Link>
      </div>

      <div className="flex items-center gap-4 mb-2">
        <CompanyLogo companyName={prettyCompanyName || ''} />
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent capitalize">
          {prettyCompanyName} - {selectedTopic}
        </h1>
      </div>
      <p className="text-muted-foreground mb-6">{totalCount} problems found</p>

      {/* Platform Tabs */}
      <div className="mb-6">
        <div className="border-b border-border">
          <div className="flex gap-1">
            <button
              onClick={() => handlePlatformChange('LEETCODE')}
              className={cn(
                "relative px-6 py-3 font-semibold transition-all duration-200 border-b-2",
                selectedPlatform === 'LEETCODE'
                  ? "border-orange-500 text-orange-500"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              )}
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M13.483 0a1.374 1.374 0 0 0-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 0 0-1.209 2.104 5.35 5.35 0 0 0-.125.513 5.527 5.527 0 0 0 .062 2.362 5.83 5.83 0 0 0 .349 1.017 5.938 5.938 0 0 0 1.271 1.818l4.277 4.193.039.038c2.248 2.165 5.852 2.133 8.063-.074l2.396-2.392c.54-.54.54-1.414.003-1.955a1.378 1.378 0 0 0-1.951-.003l-2.396 2.392a3.021 3.021 0 0 1-4.205.038l-.02-.019-4.276-4.193c-.652-.64-.972-1.469-.948-2.263a2.68 2.68 0 0 1 .066-.523 2.545 2.545 0 0 1 .619-1.164L9.13 8.114c1.058-1.134 3.204-1.27 4.43-.278l3.501 2.831c.593.48 1.461.387 1.94-.207a1.384 1.384 0 0 0-.207-1.943l-3.5-2.831c-.8-.647-1.766-1.045-2.774-1.202l2.015-2.158A1.384 1.384 0 0 0 13.483 0zm-2.866 12.815a1.38 1.38 0 0 0-1.38 1.382 1.38 1.38 0 0 0 1.38 1.382H20.79a1.38 1.38 0 0 0 1.38-1.382 1.38 1.38 0 0 0-1.38-1.382z"/>
                </svg>
                LeetCode
              </span>
              {selectedPlatform === 'LEETCODE' && (
                <motion.div
                  layoutId="problemsActiveTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </button>
            <button
              onClick={() => handlePlatformChange('GEEKSFORGEEKS')}
              disabled={switchingPlatform}
              className={cn(
                "relative px-6 py-3 font-semibold transition-all duration-200 border-b-2",
                selectedPlatform === 'GEEKSFORGEEKS'
                  ? "border-green-600 text-green-600"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border",
                switchingPlatform && "opacity-50 cursor-not-allowed"
              )}
            >
              <span className="flex items-center gap-2">
                {switchingPlatform && selectedPlatform === 'GEEKSFORGEEKS' && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                GeeksforGeeks
              </span>
              {selectedPlatform === 'GEEKSFORGEEKS' && (
                <motion.div
                  layoutId="problemsActiveTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-600"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Sort controls */}
      <Card className="mb-6 border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" /> Sort & Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium">Sort by:</label>
              <Select value={sortKey} onValueChange={setSortKey}>
                <SelectTrigger className="w-[200px] border-2">
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
            <div className="text-sm text-muted-foreground">
              Showing {displayedProblems.length} of {totalCount} problems
              <span className="font-semibold"> ({selectedPlatform === 'LEETCODE' ? 'LeetCode' : 'GeeksforGeeks'})</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Problems List */}
      <div className="space-y-3">
        {displayedProblems.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No problems found for this company.
          </div>
        ) : (
          displayedProblems.map(problem => (
            <ProblemCard
              key={problem.id}
              problem={problem}
              userProgress={userProgress}
              session={session}
              onUpdateProgress={updateProgress}
              getDifficultyColor={getDifficultyColor}
              getStatusIcon={getStatusIcon}
            />
          ))
        )}
      </div>

      {loadingMore && (
        <div className="flex justify-center py-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      <div ref={observerTarget} className="h-10" />

      {!hasMore && displayedProblems.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-6 text-muted-foreground border-t mt-4"
        >
          <p className="font-medium">🎉 You&apos;ve reached the end!</p>
          <p className="text-sm">Great job exploring {displayedProblems.length} problems</p>
        </motion.div>
      )}
    </div>
  );
}
