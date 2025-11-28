'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
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
  ChevronDown
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
  const [searchTerm, setSearchTerm] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session?.user) {
      router.push('/auth/signin');
      return;
    }
    // Reset state when params change
    setProblems([]);
    setOffset(0);
    setHasMore(true);
    fetchTopicProblems(0, true);
    fetchUserProgress();
  }, [status, session, router, platform, difficulty, topic]);

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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground">Loading problems...</p>
        </div>
      </div>
    );
  }

  const difficultyColors: Record<string, string> = {
    EASY: 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700',
    MEDIUM: 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700',
    HARD: 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700',
  };

  const platformNames: Record<string, string> = {
    LEETCODE: 'LeetCode',
    GEEKSFORGEEKS: 'GeeksforGeeks',
  };

  const topicName = topic
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.push('/dsasheet')} className="mb-4 -ml-2">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to DSA Sheet
        </Button>

        <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl md:text-4xl font-bold">{topicName}</h1>
              <Badge variant="outline" className={`${difficultyColors[difficulty]} text-sm`}>
                {difficulty}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Badge variant="secondary" className="text-xs">
                {platformNames[platform]}
              </Badge>
              <span>•</span>
              <span>{totalCount} problems</span>
              {problems.length < totalCount && (
                <>
                  <span>•</span>
                  <span className="text-xs">Showing {problems.length}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Card className="px-4 py-3 border-2">
              <div className="flex items-center gap-3">
                <Trophy className="h-6 w-6 text-primary" />
                <div>
                  <div className="text-2xl font-bold">{solvedCount}</div>
                  <div className="text-xs text-muted-foreground">Solved</div>
                </div>
              </div>
            </Card>
            <Card className="px-4 py-3 border-2">
              <div className="flex items-center gap-3">
                <Clock className="h-6 w-6 text-blue-500" />
                <div>
                  <div className="text-2xl font-bold">{attemptedCount}</div>
                  <div className="text-xs text-muted-foreground">Attempted</div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Progress Bar */}
        <Card className="border-2">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                <span className="font-semibold">Topic Progress</span>
              </div>
              <span className="text-sm font-medium text-muted-foreground">
                {progressPercentage.toFixed(1)}%
              </span>
            </div>
            <Progress value={progressPercentage} className="h-3 mb-3" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{solvedCount} solved</span>
              <span>{totalCount - solvedCount} remaining</span>
            </div>
          </CardContent>
        </Card>

        {/* Search */}
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search problems..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
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
                      onClick={() => handleToggleStatus(problem.id)}
                      disabled={isUpdating}
                      className="p-0 h-9 w-9 hover:bg-transparent flex-shrink-0"
                    >
                      {isUpdating ? (
                        <Loader2 className="h-6 w-6 animate-spin" />
                      ) : isSolved ? (
                        <CheckCircle className="h-6 w-6 text-green-600 fill-green-100" />
                      ) : isAttempted ? (
                        <Circle className="h-6 w-6 text-yellow-600 fill-yellow-200" />
                      ) : (
                        <Circle className="h-6 w-6 text-gray-400 hover:text-gray-600 transition-colors" />
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
                      {isAttempted && !isSolved && (
                        <Badge className="bg-yellow-600 hover:bg-yellow-700 hidden md:flex">
                          <Clock className="h-3 w-3 mr-1" />
                          Attempted
                        </Badge>
                      )}
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => window.open(problem.url, '_blank')}
                        className="gap-1"
                      >
                        <ExternalLink className="h-4 w-4" />
                        <span className="hidden sm:inline">Solve</span>
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
  );
}
