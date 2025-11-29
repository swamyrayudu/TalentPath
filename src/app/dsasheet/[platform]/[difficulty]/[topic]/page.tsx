'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Loader2, 
  CheckCircle, 
  Circle, 
  ExternalLink,
  ArrowLeft,
  Trophy,
  Target,
  Clock,
  Search,
  ChevronDown,
  Lock,
  Zap,
  Flame,
  Code2
} from 'lucide-react';

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
}

interface UserProgress {
  problemId: number;
  status: 'solved' | 'attempted' | 'bookmarked';
}

const ITEMS_PER_PAGE = 20;

export default function TopicProblemsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
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

  // Filter problems by search term
  const filteredProblems = searchTerm 
    ? problems.filter(problem => 
        problem.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        problem.slug?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : problems;

  // Calculate progress from userProgress for current problems
  const problemIds = new Set(problems.map(p => p.id));
  const relevantProgress = Object.values(userProgress).filter(p => problemIds.has(p.problemId));
  const solvedCount = relevantProgress.filter(p => p.status === 'solved').length;
  const attemptedCount = relevantProgress.filter(p => p.status === 'attempted').length;
  const progressPercentage = totalCount > 0 ? (solvedCount / totalCount) * 100 : 0;

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-muted border-t-primary animate-spin mx-auto" />
            <Code2 className="h-6 w-6 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground font-medium">Loading problems...</p>
        </div>
      </div>
    );
  }

  const difficultyConfig = {
    EASY: {
      icon: Zap,
      label: 'Easy',
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      gradient: 'from-emerald-500 to-green-600',
    },
    MEDIUM: {
      icon: Flame,
      label: 'Medium',
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      gradient: 'from-amber-500 to-orange-600',
    },
    HARD: {
      icon: Trophy,
      label: 'Hard',
      color: 'text-red-500',
      bg: 'bg-red-500/10',
      border: 'border-red-500/20',
      gradient: 'from-red-500 to-rose-600',
    },
  };

  const config = difficultyConfig[difficulty] || difficultyConfig.EASY;
  const DiffIcon = config.icon;

  const platformNames: Record<string, string> = {
    LEETCODE: 'LeetCode',
    GEEKSFORGEEKS: 'GeeksforGeeks',
  };

  const topicName = topic
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-4 sm:py-6 lg:py-8 px-3 sm:px-4 lg:px-6 max-w-7xl">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => router.push('/dsasheet')} 
          className="mb-4 -ml-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to DSA Sheet
        </Button>

        {/* Hero Header */}
        <div className="mb-6 space-y-4 sm:space-y-6">
          {/* Title Section */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="space-y-3">
              {/* Topic Title with Badge */}
              <div className="flex flex-wrap items-center gap-3">
                <div className={`p-2 sm:p-2.5 rounded-xl bg-gradient-to-br ${config.gradient}`}>
                  <DiffIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
                    {topicName}
                  </h1>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <Badge className={`${config.bg} ${config.color} ${config.border} border font-medium`}>
                      {config.label}
                    </Badge>
                    <Badge variant="secondary" className="font-medium">
                      {platformNames[platform]}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {totalCount} problems
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="flex gap-2 sm:gap-3">
              <Card className="flex-1 sm:flex-none border bg-card/50 backdrop-blur-sm">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10">
                      <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500" />
                    </div>
                    <div>
                      <div className="text-lg sm:text-xl font-bold">{solvedCount}</div>
                      <div className="text-[10px] sm:text-xs text-muted-foreground">Solved</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="flex-1 sm:flex-none border bg-card/50 backdrop-blur-sm">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="p-2 rounded-lg bg-amber-500/10">
                      <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />
                    </div>
                    <div>
                      <div className="text-lg sm:text-xl font-bold">{attemptedCount}</div>
                      <div className="text-[10px] sm:text-xs text-muted-foreground">Attempted</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Progress Section */}
          <Card className="border bg-card/50 backdrop-blur-sm overflow-hidden">
            <CardContent className="p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Circular Progress */}
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="50%"
                        cy="50%"
                        r="40%"
                        stroke="currentColor"
                        strokeWidth="6"
                        fill="none"
                        className="text-muted/20"
                      />
                      <circle
                        cx="50%"
                        cy="50%"
                        r="40%"
                        stroke="currentColor"
                        strokeWidth="6"
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray={`${progressPercentage * 2.51} 251`}
                        className={config.color}
                        style={{ transition: 'stroke-dasharray 0.5s ease' }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-sm sm:text-base font-bold">{progressPercentage.toFixed(0)}%</span>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-primary" />
                      <span className="text-sm font-semibold">Progress</span>
                    </div>
                    <p className="text-lg sm:text-xl font-bold">
                      {solvedCount}
                      <span className="text-sm text-muted-foreground font-normal"> / {totalCount}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {totalCount - solvedCount} remaining
                    </p>
                  </div>
                </div>

                {/* Linear Progress Bar */}
                <div className="flex-1 space-y-2">
                  <div className="h-2.5 sm:h-3 bg-muted/30 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full bg-gradient-to-r ${config.gradient} transition-all duration-500`}
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{solvedCount} solved</span>
                    <span>{attemptedCount} in progress</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search problems..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 sm:pl-11 h-10 sm:h-11 bg-card border rounded-xl"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-7 px-2 text-muted-foreground hover:text-foreground"
              >
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Problems List */}
      {filteredProblems.length === 0 ? (
        <Card>
          <CardContent className="py-16">
            <div className="text-center">
              <Target className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
              <p className="text-lg font-medium text-muted-foreground mb-2">
                {searchTerm ? 'No matching problems found' : 'No problems available yet'}
              </p>
              <p className="text-sm text-muted-foreground">
                {searchTerm ? 'Try a different search term' : 'Check back later for new problems'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredProblems.map((problem, index) => {
            const progress = userProgress[problem.id];
            const isSolved = progress?.status === 'solved';
            const isAttempted = progress?.status === 'attempted';
            const isUpdating = updating === problem.id;
            const companyTags = Array.isArray(problem.companyTags) ? problem.companyTags : [];

            return (
              <Card 
                key={problem.id} 
                className={`transition-all duration-200 hover:shadow-md border-2 ${
                  isSolved ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800' :
                  isAttempted ? 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800' :
                  'hover:border-primary/50'
                }`}
              >
                <CardContent className="p-4 md:p-5">
                  <div className="flex items-center gap-3 md:gap-4">
                    {/* Checkbox */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => session?.user && handleToggleStatus(problem.id)}
                      disabled={isUpdating || !session?.user}
                      className="p-0 h-9 w-9 hover:bg-transparent flex-shrink-0 relative"
                      title={!session?.user ? "Sign in to mark problems" : ""}
                    >
                      {isUpdating ? (
                        <Loader2 className="h-6 w-6 animate-spin" />
                      ) : isSolved ? (
                        <CheckCircle className="h-6 w-6 text-green-600 fill-green-100" />
                      ) : isAttempted ? (
                        <Circle className="h-6 w-6 text-yellow-600 fill-yellow-200" />
                      ) : (
                        <>
                          <Circle className="h-6 w-6 text-gray-400 hover:text-gray-600 transition-colors" />
                          {!session?.user && (
                            <Lock className="h-3 w-3 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-red-600" />
                          )}
                        </>
                      )}
                    </Button>

                    {/* Problem Number */}
                    <div className="text-muted-foreground font-mono text-sm font-semibold w-10 flex-shrink-0">
                      #{index + 1}
                    </div>

                    {/* Problem Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold text-base hover:text-primary transition-colors">
                          {problem.title}
                        </h3>
                        {problem.isPremium && (
                          <Badge variant="secondary" className="text-xs">
                            Premium
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          {problem.likes} likes
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          {problem.acceptanceRate}% acceptance
                        </span>
                        {companyTags.length > 0 && (
                          <>
                            <span>•</span>
                            <div className="flex gap-1 flex-wrap">
                              {companyTags.slice(0, 3).map((company: string) => (
                                <Badge key={company} variant="outline" className="text-xs">
                                  {company}
                                </Badge>
                              ))}
                              {companyTags.length > 3 && (
                                <span className="text-xs">+{companyTags.length - 3}</span>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Status Badge & Action */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isSolved && (
                        <Badge className="bg-green-600 hover:bg-green-700 hidden md:flex">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Solved
                        </Badge>
                      )}
                      <Button
                        variant="default"
                        size="sm"
                        onClick={async () => {
                          if (!session?.user) {
                            setSigningIn(true);
                            await signIn('google', { 
                              callbackUrl: window.location.href
                            });
                            setSigningIn(false);
                          } else {
                            window.open(problem.url, '_blank');
                          }
                        }}
                        disabled={signingIn}
                        className="gap-1 cursor-pointer"
                        title={!session?.user ? "Sign in to solve problems" : ""}
                      >
                        {signingIn ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : !session?.user ? (
                          <Lock className="h-4 w-4" />
                        ) : (
                          <ExternalLink className="h-4 w-4" />
                        )}
                        <span className="hidden sm:inline">
                          {signingIn ? 'Signing in...' : !session?.user ? 'Sign in' : 'Solve'}
                        </span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          
          {/* Infinite Scroll Trigger */}
          {!searchTerm && (
            <div 
              ref={lastProblemRef}
              className="py-4 flex justify-center"
            >
              {loadingMore && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Loading more problems...</span>
                </div>
              )}
              {!loadingMore && hasMore && (
                <Button
                  variant="outline"
                  onClick={loadMoreProblems}
                  className="gap-2"
                >
                  <ChevronDown className="h-4 w-4" />
                  Load More ({totalCount - problems.length} remaining)
                </Button>
              )}
              {!hasMore && problems.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  All {totalCount} problems loaded
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      {problems.length > 0 && (
        <Card className="mt-6 border-2">
          <CardContent className="p-4">
            <div className="flex items-center justify-center gap-6 md:gap-8 text-sm flex-wrap">
              <div className="flex items-center gap-2">
                <Circle className="h-5 w-5 text-gray-400" />
                <span className="text-muted-foreground">Todo</span>
              </div>
              <div className="flex items-center gap-2">
                <Circle className="h-5 w-5 text-yellow-600 fill-yellow-200" />
                <span className="text-muted-foreground">Attempted</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 fill-green-100" />
                <span className="text-muted-foreground">Solved</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      </div>
    </div>
  );
}
