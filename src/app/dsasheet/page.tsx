'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  CheckCircle2,
  Circle,
  Bookmark,
  ExternalLink,
  Search,
  Loader2,
  X,
  Lock,
  ChevronDown,
  Filter,
  TrendingUp,
  Award,
  Target
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useDsaProblemsCache } from '@/components/context/DsaProblemsCacheContext';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

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

const ITEMS_PER_PAGE = 20; // Increased for better UX
const INITIAL_TOPICS_DISPLAY = 12; // Show more topics initially
const DS_TOPICS = [
  'Array', 'String', 'Linked List', 'Stack', 'Queue', 'Hash Table',
  'Tree', 'Binary Tree', 'Binary Search Tree', 'Heap (Priority Queue)',
  'Graph', 'Trie', 'Matrix', 'Monotonic Stack', 'Monotonic Queue',
  'Dynamic Programming', 'Greedy', 'Backtracking', 'Divide and Conquer',
  'Binary Search', 'Two Pointers', 'Sliding Window', 'Sorting', 'Recursion',
  'Math', 'Bit Manipulation', 'Union Find', 'Segment Tree', 'Binary Indexed Tree'
].sort();

// Optimized animation variants - reduced complexity
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03 // Faster stagger
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.2 // Faster animation
    }
  }
};

export default function DsaSheet() {
  const { data: session } = useSession();
  const router = useRouter();
  const { allProblems, setAllProblems, userProgress, setUserProgress } = useDsaProblemsCache();
  
  const [displayedProblems, setDisplayedProblems] = useState<Problem[]>([]);
  const [topicCounts, setTopicCounts] = useState<Record<string, number>>({});
  const [availableTopics, setAvailableTopics] = useState<string[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [showAllTopics, setShowAllTopics] = useState<boolean>(false);
  const [showFilters, setShowFilters] = useState<boolean>(true); // Open by default
  const [totalProblemsCount, setTotalProblemsCount] = useState<number>(0); // Track total from DB

  const observerTarget = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);
  const hasFetchedTotal = useRef(false);

  // Memoize filtered problems for performance
  const filteredProblems = useMemo(() => {
    if (allProblems.length === 0) return [];
    
    return allProblems.filter(problem => {
      if (selectedTopics.length > 0) {
        const hasMatchingTopic = selectedTopics.some(selectedTopic =>
          problem.topicTags.some((tag: string) => tag.toLowerCase() === selectedTopic.toLowerCase())
        );
        if (!hasMatchingTopic) return false;
      }
      if (selectedDifficulty !== 'all' && problem.difficulty !== selectedDifficulty) return false;
      if (selectedPlatform !== 'all') {
        const normalizedPlatform = problem.platform?.toUpperCase().trim();
        const selectedNormalized = selectedPlatform.toUpperCase().trim();
        if (normalizedPlatform !== selectedNormalized) return false;
      }
      if (searchQuery && !problem.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [allProblems, selectedTopics, selectedDifficulty, selectedPlatform, searchQuery]);

  // Process topics only once when problems load
  useEffect(() => {
    if (allProblems.length > 0 && isInitialMount.current) {
      processTopics(allProblems);
      isInitialMount.current = false;
    }
  }, [allProblems]);

  // Update topic counts when all problems are loaded
  useEffect(() => {
    if (allProblems.length > 200) {
      processTopics(allProblems);
    }
  }, [allProblems.length]);

  // Initial load - check cache first
  useEffect(() => {
    if (allProblems.length > 0) {
      // Data already cached - instant display
      const initialProblems = filteredProblems.slice(0, ITEMS_PER_PAGE);
      setDisplayedProblems(initialProblems);
      setHasMore(filteredProblems.length > ITEMS_PER_PAGE);
      setPage(1);
      setLoading(false);
      
      // Fetch total count if we don't have it yet
      if (!hasFetchedTotal.current) {
        fetchTotalCount();
      }
    } else {
      // No cache - fetch data with progressive loading
      fetchProblemsProgressively();
    }
    
    // Fetch user progress if logged in
    if (session?.user) {
      fetchUserProgress();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update displayed problems when filters change
  useEffect(() => {
    if (allProblems.length === 0) return;
    
    const initialProblems = filteredProblems.slice(0, ITEMS_PER_PAGE);
    setDisplayedProblems(initialProblems);
    setPage(1);
    setHasMore(filteredProblems.length > ITEMS_PER_PAGE);
  }, [filteredProblems]);

  // Intersection observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && displayedProblems.length > 0) {
          loadMore();
        }
      },
      { 
        threshold: 0.1,
        rootMargin: '100px' // Start loading before reaching bottom
      }
    );

    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, displayedProblems.length]);

  // Fetch just the total count (lightweight query)
  const fetchTotalCount = async () => {
    try {
      const response = await fetch('/api/problems?limit=1'); // Just need the total
      const data = await response.json();
      if (data.success && data.total) {
        setTotalProblemsCount(data.total);
        hasFetchedTotal.current = true;
      }
    } catch (error) {
      console.error('Error fetching total count:', error);
    }
  };

  // Progressive loading - load initial batch then rest in background
  const fetchProblemsProgressively = async () => {
    try {
      setLoading(true);
      
      // First, load just visible problems (for users) or initial batch (for admins)
      const initialResponse = await fetch('/api/problems?limit=10000');
      const initialData = await initialResponse.json();
      
      if (initialData.success) {
        setAllProblems(initialData.data);
        // Set total count from API
        if (initialData.total) {
          setTotalProblemsCount(initialData.total);
          hasFetchedTotal.current = true;
        }
        // processTopics will be called by useEffect when allProblems changes
        
        // Show initial problems immediately
        const filtered = initialData.data.filter((problem: Problem) => {
          if (selectedTopics.length > 0) {
            const hasMatchingTopic = selectedTopics.some(selectedTopic =>
              problem.topicTags.some((tag: string) => tag.toLowerCase() === selectedTopic.toLowerCase())
            );
            if (!hasMatchingTopic) return false;
          }
          if (selectedDifficulty !== 'all' && problem.difficulty !== selectedDifficulty) return false;
          if (selectedPlatform !== 'all') {
            const normalizedPlatform = problem.platform?.toUpperCase().trim();
            const selectedNormalized = selectedPlatform.toUpperCase().trim();
            if (normalizedPlatform !== selectedNormalized) return false;
          }
          if (searchQuery && !problem.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
          return true;
        });
        
        setDisplayedProblems(filtered.slice(0, ITEMS_PER_PAGE));
        setHasMore(filtered.length > ITEMS_PER_PAGE);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching initial problems:', error);
      setLoading(false);
    }
  };

  const fetchProblems = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/problems?limit=10000');
      const data = await response.json();
      if (data.success) {
        setAllProblems(data.data);
        // Set total count from API
        if (data.total) {
          setTotalProblemsCount(data.total);
          hasFetchedTotal.current = true;
        }
        // processTopics will be called by useEffect when allProblems changes
        
        // Apply initial filters
        const filtered = data.data.filter((problem: Problem) => {
          if (selectedTopics.length > 0) {
            const hasMatchingTopic = selectedTopics.some(selectedTopic =>
              problem.topicTags.some((tag: string) => tag.toLowerCase() === selectedTopic.toLowerCase())
            );
            if (!hasMatchingTopic) return false;
          }
          if (selectedDifficulty !== 'all' && problem.difficulty !== selectedDifficulty) return false;
          if (selectedPlatform !== 'all') {
            const normalizedPlatform = problem.platform?.toUpperCase().trim();
            const selectedNormalized = selectedPlatform.toUpperCase().trim();
            if (normalizedPlatform !== selectedNormalized) return false;
          }
          if (searchQuery && !problem.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
          return true;
        });
        
        setDisplayedProblems(filtered.slice(0, ITEMS_PER_PAGE));
        setHasMore(filtered.length > ITEMS_PER_PAGE);
      }
    } catch (error) {
      console.error('Error fetching problems:', error);
    } finally {
      setLoading(false);
    }
  };

  const processTopics = (problems: Problem[]) => {
    const counts: Record<string, number> = {};
    problems.forEach(p => {
      p.topicTags.forEach(tag => {
        const match = DS_TOPICS.find(ds => ds.toLowerCase() === tag.toLowerCase());
        if (match) {
          counts[match] = (counts[match] || 0) + 1;
        }
      });
    });
    setTopicCounts(counts);
    setAvailableTopics(
      DS_TOPICS.filter(ds => typeof counts[ds] === 'number' && counts[ds] > 0)
    );
  };

  const fetchUserProgress = async () => {
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
  };

  // Optimized load more function
  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    
    // Use requestAnimationFrame for smoother scrolling
    requestAnimationFrame(() => {
      const nextPage = page + 1;
      const start = 0;
      const end = nextPage * ITEMS_PER_PAGE;
      
      const newProblems = filteredProblems.slice(start, end);
      setDisplayedProblems(newProblems);
      setPage(nextPage);
      setHasMore(end < filteredProblems.length);
      setLoadingMore(false);
    });
  }, [page, loadingMore, hasMore, filteredProblems]);

  const topicToSlug = (topic: string): string => {
    return topic.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  };

  const handleTopicClick = (topic: string) => {
    const slug = topicToSlug(topic);
    router.push(`/topics/${slug}`);
  };

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

  const stats = useMemo(() => ({
    total: totalProblemsCount > 0 ? totalProblemsCount : allProblems.length, // Use total from DB if available
    solved: Array.from(userProgress.values()).filter(p => p.status === 'solved').length,
    attempted: Array.from(userProgress.values()).filter(p => p.status === 'attempted').length,
    bookmarked: Array.from(userProgress.values()).filter(p => p.status === 'bookmarked').length,
  }), [allProblems, userProgress, totalProblemsCount]);

  const displayTopics = showAllTopics ? availableTopics : availableTopics.slice(0, INITIAL_TOPICS_DISPLAY);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground">Loading problems...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-8xl">
      {/* Header with Stats */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-8"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div >
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent mb-2">
              DSA Practice Sheet
            </h1>
            <p className="text-muted-foreground text-lg">
              Master Data Structures & Algorithms with {(totalProblemsCount > 0 ? totalProblemsCount : allProblems.length).toLocaleString()} curated problems
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        {session?.user && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Solved', value: stats.solved, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
              { label: 'Attempted', value: stats.attempted, icon: Target, color: 'text-amber-500', bg: 'bg-amber-500/10' },
              { label: 'Bookmarked', value: stats.bookmarked, icon: Bookmark, color: 'text-blue-500', bg: 'bg-blue-500/10' },
              { label: 'Total', value: stats.total, icon: Award, color: 'text-purple-500', bg: 'bg-purple-500/10' },
            ].map((stat) => (
              <div
                key={stat.label}
                className={`${stat.bg} border border-border rounded-xl p-4 flex items-center gap-3 transition-transform hover:scale-105`}
              >
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
                <div>
                  <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
{/* Tabs (Added) */}
<div className="w-full mb-8 flex justify-items-end">
  <Button asChild variant="outline" className="px-6 py-2 hover:bg-yellow-500 cursor-pointer transition-colors rounded-md">
    <Link href="/companies">
      Company‑wise Questions
    </Link>
  </Button>
</div>

      {/* Topics Section */}
      <Card className="mb-6 border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Topics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            <AnimatePresence mode="popLayout">
              {displayTopics.map((topic) => (
                <motion.button
                  key={topic}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleTopicClick(topic)}
                  className={cn(
                    'px-4 py-2 rounded-lg font-medium text-sm transition-all border-2',
                    'hover:shadow-lg hover:border-primary',
                    selectedTopics.includes(topic)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-secondary/50 text-foreground border-border'
                  )}
                >
                  <span>{topic}</span>
                  <span className="ml-2 px-2 py-0.5 rounded-full bg-background/40 text-xs">
                    {topicCounts[topic] ?? 0}
                  </span>
                </motion.button>
              ))}
            </AnimatePresence>
          </div>

          {availableTopics.length > INITIAL_TOPICS_DISPLAY && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAllTopics(!showAllTopics)}
              className="w-full border-2 hover:border-primary"
            >
              {showAllTopics ? 'Show Less' : `Show More (${availableTopics.length - INITIAL_TOPICS_DISPLAY} more)`}
              <ChevronDown className={cn('ml-2 h-4 w-4 transition-transform', showAllTopics && 'rotate-180')} />
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Filters Section */}
      <Card className="mb-6 border-2">
        <CardHeader className="cursor-pointer" onClick={() => setShowFilters(!showFilters)}>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </div>
            <ChevronDown className={cn('h-5 w-5 transition-transform', showFilters && 'rotate-180')} />
          </CardTitle>
        </CardHeader>
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search problems..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="pl-10 border-2"
                    />
                  </div>

                  <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                    <SelectTrigger className="border-2">
                      <SelectValue placeholder="All Difficulties" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Difficulties</SelectItem>
                      <SelectItem value="EASY">Easy</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HARD">Hard</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                    <SelectTrigger className="border-2">
                      <SelectValue placeholder="All Platforms" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Platforms</SelectItem>
                      <SelectItem value="LEETCODE">LeetCode</SelectItem>
                      <SelectItem value="GEEKSFORGEEKS">GeeksforGeeks</SelectItem>
                      <SelectItem value="CODEFORCES">Codeforces</SelectItem>
                      <SelectItem value="HACKERRANK">HackerRank</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {selectedTopics.length > 0 && (
                  <div className="flex flex-wrap gap-2 items-center p-3 bg-muted/50 rounded-lg border-2">
                    <span className="text-sm font-medium">Active filters:</span>
                    {selectedTopics.map(topic => (
                      <Badge key={topic} variant="secondary" className="gap-1">
                        {topic}
                        <X
                          className="h-3 w-3 cursor-pointer hover:text-destructive"
                          onClick={() => setSelectedTopics(prev => prev.filter(t => t !== topic))}
                        />
                      </Badge>
                    ))}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedTopics([])}
                      className="h-6 text-xs"
                    >
                      Clear all
                    </Button>
                  </div>
                )}
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* Problems List */}
      <Card className="border-2">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Problems ({filteredProblems.length.toLocaleString()})</CardTitle>
          <div className="text-sm text-muted-foreground">
            Showing {displayedProblems.length} of {filteredProblems.length}
          </div>
        </CardHeader>
        <CardContent>
          {displayedProblems.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No problems found</p>
              {(selectedTopics.length > 0 || searchQuery) && (
                <Button
                  onClick={() => {
                    setSelectedTopics([]);
                    setSearchQuery('');
                  }}
                  variant="outline"
                >
                  Clear all filters
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {displayedProblems.map((problem) => (
                  <motion.div
                    key={problem.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
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
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => updateProgress(problem.id, 'bookmarked')}
                        disabled={!session}
                        className="hover:text-blue-500 transition-transform hover:scale-110"
                      >
                        <Bookmark className="h-4 w-4" />
                      </Button>
                      <Button size="sm" className="gap-2 font-medium" asChild>
                        <a href={problem.url} target="_blank" rel="noopener noreferrer">
                          Solve <ExternalLink className="h-3 w-3" />
                        </a>
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Loading More Indicator */}
              {loadingMore && (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}

              {/* Intersection Observer Target for Infinite Scroll */}
              <div ref={observerTarget} className="h-10" />

              {/* End of List */}
              {!hasMore && displayedProblems.length > 0 && (
                <div className="text-center py-6 text-muted-foreground border-t mt-4">
                  <p className="font-medium">🎉 You&apos;ve reached the end!</p>
                  <p className="text-sm">Great job exploring {filteredProblems.length} problems</p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
