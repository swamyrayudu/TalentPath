'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ExternalLink, Bookmark, CheckCircle2, Circle, ArrowLeft, Lock, TrendingUp, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';

const ITEMS_PER_PAGE = 20;

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

// Optimized animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.2
    }
  }
};

export default function TopicPage() {
  const params = useParams();
  const topicSlug = params.topics as string;
  const { data: session } = useSession();

  const [allProblems, setAllProblems] = useState<Problem[]>([]); // Store all fetched problems
  const [displayedProblems, setDisplayedProblems] = useState<Problem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0); // Store total count from API
  const [userProgress, setUserProgress] = useState<Map<number, UserProgress>>(new Map());
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sortKey, setSortKey] = useState('likes');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const observerTarget = useRef<HTMLDivElement>(null);
  const isFetchingRef = useRef(false); // Prevent duplicate fetches

  // Fetch user progress
  const fetchUserProgress = useCallback(async () => {
    if (!session?.user) return;
    
    try {
      const response = await fetch('/api/progress');
      const data = await response.json();
      if (data.success) {
        const progressMap = new Map();
        data.data.forEach((item: any) => {
          if (item.progress && item.progress.problemId) {
            progressMap.set(Number(item.progress.problemId), item.progress);
          }
        });
        setUserProgress(progressMap);
      }
    } catch (error) {
      console.error('Error fetching progress:', error);
    }
  }, [session]);

  // Fetch problems for the topic
  const fetchProblems = useCallback(async (pageNum: number = 1, sortBy: string = 'likes') => {
    if (!topicSlug || isFetchingRef.current) return;

    try {
      isFetchingRef.current = true;

      if (pageNum === 1) {
        setLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }

      const sortParam = sortBy === 'acceptance' ? 'acceptanceRate' : sortBy;
      const offset = (pageNum - 1) * ITEMS_PER_PAGE;
      
      const response = await fetch(
        `/api/problems?topic=${topicSlug}&sortBy=${sortParam}&sortOrder=desc&limit=${ITEMS_PER_PAGE}&offset=${offset}`
      );
      
      const data = await response.json();

      if (data.success) {
        const newProblems = data.data;
        
        // Set total count if available from API
        if (data.total !== undefined) {
          setTotalCount(data.total);
        }
        
        if (pageNum === 1) {
          setAllProblems(newProblems);
          setDisplayedProblems(newProblems);
          // If no total from API, estimate it
          if (data.total === undefined) {
            setTotalCount(newProblems.length === ITEMS_PER_PAGE ? newProblems.length + 1 : newProblems.length);
          }
        } else {
          setAllProblems(prev => {
            const combined = [...prev, ...newProblems];
            // Remove duplicates based on id
            const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());
            return unique;
          });
          setDisplayedProblems(prev => {
            const combined = [...prev, ...newProblems];
            const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());
            return unique;
          });
        }
        
        // Check if there are more items to load
        const hasMoreItems = newProblems.length === ITEMS_PER_PAGE;
        setHasMore(hasMoreItems);
        setPage(pageNum);
      } else {
        setError(data.error || 'Failed to fetch problems');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Network error occurred');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      isFetchingRef.current = false;
    }
  }, [topicSlug]);

  // Initial load
  useEffect(() => {
    if (topicSlug) {
      setAllProblems([]);
      setDisplayedProblems([]);
      setPage(1);
      setHasMore(true);
      fetchProblems(1, sortKey);
      if (session?.user) {
        fetchUserProgress();
      }
    }
  }, [topicSlug]);

  // Handle sort change - reset everything
  useEffect(() => {
    if (topicSlug && sortKey) {
      setAllProblems([]);
      setDisplayedProblems([]);
      setPage(1);
      setHasMore(true);
      fetchProblems(1, sortKey);
    }
  }, [sortKey, topicSlug]);

  // Fetch user progress when session changes
  useEffect(() => {
    if (session?.user) {
      fetchUserProgress();
    }
  }, [session, fetchUserProgress]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading && !isFetchingRef.current) {
          loadMore();
        }
      },
      { 
        threshold: 0.1,
        rootMargin: '200px' // Start loading earlier
      }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
      observer.disconnect();
    };
  }, [hasMore, loadingMore, loading]);

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore && !isFetchingRef.current) {
      console.log('Loading more... Current page:', page);
      fetchProblems(page + 1, sortKey);
    }
  }, [fetchProblems, page, sortKey, loadingMore, hasMore]);

  const updateProgress = async (problemId: number, status: 'solved' | 'attempted' | 'bookmarked') => {
    if (!session?.user) {
      alert('Please login to track progress');
      return;
    }
    
    // Optimistic update
    const newProgress = new Map(userProgress);
    newProgress.set(problemId, {
      problemId,
      status,
      solvedAt: status === 'solved' ? new Date() : undefined
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
    } catch (error) {
      console.error('Error updating progress:', error);
      // Revert on error
      setUserProgress(userProgress);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'MEDIUM': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'HARD': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      default: return 'bg-gray-500/10 text-gray-500';
    }
  };

  const getStatusIcon = (problemId: number) => {
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
    if (!progress) return <Circle className="h-5 w-5 text-gray-400" />;
    if (progress.status === 'solved') return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
    if (progress.status === 'attempted') return <Circle className="h-5 w-5 text-amber-500 fill-amber-500" />;
    if (progress.status === 'bookmarked') return <Bookmark className="h-5 w-5 text-blue-500 fill-blue-500" />;
  };

  const formatTopicName = (slug: string) => {
    return slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Calculate stats from displayed problems
  const stats = useMemo(() => {
    const difficultyCount = { easy: 0, medium: 0, hard: 0 };
    allProblems.forEach(p => {
      if (p.difficulty === 'EASY') difficultyCount.easy++;
      if (p.difficulty === 'MEDIUM') difficultyCount.medium++;
      if (p.difficulty === 'HARD') difficultyCount.hard++;
    });
    return {
      total: totalCount > 0 ? totalCount : allProblems.length,
      ...difficultyCount,
      avgAcceptance: allProblems.length > 0 
        ? (allProblems.reduce((sum, p) => sum + parseFloat(p.acceptanceRate), 0) / allProblems.length).toFixed(1)
        : 0
    };
  }, [allProblems, totalCount]);

  if (loading && displayedProblems.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading problems...</p>
        </motion.div>
      </div>
    );
  }

  if (!topicSlug) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <Card className="border-2">
          <CardHeader>
            <CardTitle>Topic Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">Invalid topic parameter. Please check the URL.</p>
            <Link href="/dsasheet">
              <Button>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to DSA Sheet
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <Card className="border-2">
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-rose-500 mb-4">{error}</p>
            <div className="flex gap-2">
              <Button onClick={() => {
                setAllProblems([]);
                setDisplayedProblems([]);
                setPage(1);
                setHasMore(true);
                fetchProblems(1, sortKey);
              }} variant="outline">
                Retry
              </Button>
              <Link href="/dsasheet">
                <Button variant="ghost">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to DSA Sheet
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-8"
      >
        <div className="flex items-center gap-4 mb-4">
          <Link href="/dsasheet">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to DSA Sheet
              </Button>
            </motion.div>
          </Link>
        </div>
        
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent mb-2">
          {formatTopicName(topicSlug)} Problems
        </h1>
        <p className="text-muted-foreground text-lg">
          {stats.total > 0 ? `Found ${stats.total} problems` : 'No problems found for this topic'}
        </p>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
          {[
            { label: 'Total', value: stats.total, color: 'text-purple-500', bg: 'bg-purple-500/10' },
            { label: 'Easy', value: stats.easy, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
            { label: 'Medium', value: stats.medium, color: 'text-amber-500', bg: 'bg-amber-500/10' },
            { label: 'Hard', value: stats.hard, color: 'text-rose-500', bg: 'bg-rose-500/10' },
            { label: 'Avg Accept', value: `${stats.avgAcceptance}%`, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 * index }}
              whileHover={{ scale: 1.05 }}
              className={`${stat.bg} border border-border rounded-xl p-4 text-center`}
            >
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Sorting Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="mb-6 border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Sort & Filter
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
                Showing {displayedProblems.length} of {stats.total} problems
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Problems List */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Problems
            </CardTitle>
          </CardHeader>
          <CardContent>
            {displayedProblems.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <p className="text-muted-foreground mb-4">No problems found for this topic.</p>
                <Link href="/dsasheet">
                  <Button variant="outline">
                    Browse All Topics
                  </Button>
                </Link>
              </motion.div>
            ) : (
              <>
                <div className="space-y-3">
                  {displayedProblems.map((problem) => (
                    <motion.div
                      key={problem.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center gap-4 p-4 rounded-xl border-2 bg-card hover:bg-accent/50 transition-colors hover:border-primary/50 hover:shadow-md"
                    >
                      {/* Status Icon */}
                      <div className="flex-shrink-0">
                        <button
                          onClick={() => {
                            if (!session?.user) {
                              alert('Please login to track progress');
                              return;
                            }
                            const currentStatus = userProgress.get(problem.id)?.status;
                            const nextStatus = currentStatus === 'solved' ? 'attempted' : 'solved';
                            updateProgress(problem.id, nextStatus);
                          }}
                          className="hover:scale-110 transition-transform disabled:cursor-not-allowed"
                          disabled={!session}
                        >
                          {getStatusIcon(problem.id)}
                        </button>
                      </div>

                      {/* Problem Info */}
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
                          <Badge variant="outline" className="border-2">
                            {problem.platform}
                          </Badge>
                          {problem.topicTags.slice(0, 2).map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {problem.topicTags.length > 2 && (
                            <span className="text-xs text-muted-foreground font-medium">
                              +{problem.topicTags.length - 2} more
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Stats */}
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

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => updateProgress(problem.id, 'bookmarked')}
                            disabled={!session}
                            className="hover:text-blue-500 transition-transform"
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
                  ))}
                </div>

                {/* Loading More Indicator */}
                {loadingMore && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-center py-6"
                  >
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </motion.div>
                )}

                {/* Intersection Observer Target */}
                <div ref={observerTarget} className="h-10" />

                {/* End of List */}
                {!hasMore && displayedProblems.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-6 text-muted-foreground border-t mt-4"
                  >
                    <p className="font-medium">🎉 You've reached the end!</p>
                    <p className="text-sm">Great job exploring {displayedProblems.length} problems</p>
                  </motion.div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
