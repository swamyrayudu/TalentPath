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

export default function CompanyPage() {
  const params = useParams();
  const companySlug = params.company as string;
  const { data: session } = useSession();

  const [problems, setProblems] = useState<Problem[]>([]);
  const [displayedProblems, setDisplayedProblems] = useState<Problem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [userProgress, setUserProgress] = useState<Map<number, UserProgress>>(new Map());
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sortKey, setSortKey] = useState('likes');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const observerTarget = useRef<HTMLDivElement>(null);
  const isFetchingRef = useRef(false);

  const prettyCompanyName = companySlug
    ?.replace(/-/g, ' ')
    ?.replace(/\b\w/g, char => char.toUpperCase());

  const fetchUserProgress = useCallback(async () => {
    if (!session?.user) return;
    try {
      const res = await fetch('/api/progress');
      const data = await res.json();
      if (data.success) {
        const progressMap = new Map();
        data.data.forEach((item: any) => {
          if (item.progress && item.progress.problemId) {
            progressMap.set(Number(item.progress.problemId), item.progress);
          }
        });
        setUserProgress(progressMap);
      }
    } catch (e) {
      console.error('Error fetching progress:', e);
    }
  }, [session]);

  const fetchProblems = useCallback(async (pageNum = 1, sortBy = 'likes') => {
    if (!companySlug) return;
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const limit = ITEMS_PER_PAGE;
      const offset = (pageNum - 1) * ITEMS_PER_PAGE;
      const sortParam = sortBy === 'acceptance' ? 'acceptanceRate' : sortBy;

      const res = await fetch(
        `/api/problems?company=${companySlug}&sortBy=${sortParam}&sortOrder=desc&limit=${limit}&offset=${offset}`
      );
      const data = await res.json();

      if (data.success) {
        if (pageNum === 1) {
          setProblems(data.data);
          setDisplayedProblems(data.data);
          if (data.total !== undefined) setTotalCount(data.total);
        } else {
          setProblems(prev => [...prev, ...data.data]);
          setDisplayedProblems(prev => [...prev, ...data.data]);
        }
        setHasMore(data.data.length === limit);
        setPage(pageNum);
      } else {
        setError(data.error || 'Failed to fetch problems');
      }
    } catch (err) {
      console.error('Failed to fetch company problems:', err);
      setError('Failed to fetch problems');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      isFetchingRef.current = false;
    }
  }, [companySlug]);

  useEffect(() => {
    fetchProblems(1, sortKey);
    if (session?.user) fetchUserProgress();
  }, [companySlug, sortKey, fetchProblems, fetchUserProgress]);

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loadingMore && !loading && !isFetchingRef.current) {
        fetchProblems(page + 1, sortKey);
      }
    }, {threshold: 0.1, rootMargin: '200px'});

    if (observerTarget.current) observer.observe(observerTarget.current);

    return () => {
      if (observerTarget.current) observer.unobserve(observerTarget.current);
      observer.disconnect();
    };
  }, [hasMore, loadingMore, loading, fetchProblems, page, sortKey]);

  const updateProgress = async (problemId: number, status: 'solved' | 'attempted' | 'bookmarked') => {
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
    } catch (err) {
      console.error('Error updating progress:', err);
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
  return (
    <div className="container mx-auto py-8 px-4 max-w-8xl">
      {/* Back Button */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/companies" className="flex items-center gap-2 text-sm font-medium text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" />
          Back to Companies
        </Link>
      </div>

      {/* Header */}
      <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent mb-2 capitalize">
        {prettyCompanyName} Interview Problems
      </h1>
      <p className="text-muted-foreground mb-6">{totalCount} problems found</p>

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
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Problems List */}
      <motion.div initial="hidden" animate="visible" variants={containerVariants} className="space-y-3">
        {displayedProblems.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12 text-muted-foreground">
            No problems found for this company.
          </motion.div>
        ) : (
          displayedProblems.map(problem => (
            <motion.div
              key={problem.id}
              variants={itemVariants}
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
                    updateProgress(problem.id, nextStatus);
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
                  <Badge className={cn('font-medium', getDifficultyColor(problem.difficulty))}>{problem.difficulty}</Badge>
                  <Badge variant="outline" className="border-2">
                    {problem.platform}
                  </Badge>
                  {problem.topicTags.slice(0, 2).map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {problem.topicTags.length > 2 && (
                    <span className="text-xs text-muted-foreground font-medium">+{problem.topicTags.length - 2} more</span>
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
          ))
        )}
      </motion.div>

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
          <p className="font-medium">🎉 You've reached the end!</p>
          <p className="text-sm">Great job exploring {displayedProblems.length} problems</p>
        </motion.div>
      )}
    </div>
  );
}
