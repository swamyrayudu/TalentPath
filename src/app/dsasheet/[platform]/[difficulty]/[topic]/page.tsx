'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Loader2, 
  CheckCircle, 
  Circle, 
  ExternalLink,
  ArrowLeft,
  Trophy,
  Target,
  Clock
} from 'lucide-react';

interface Problem {
  id: number;
  title: string;
  slug: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  platform: 'LEETCODE' | 'GEEKSFORGEEKS' | 'CODEFORCES' | 'HACKERRANK';
  likes: number;
  acceptanceRate: string;
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
  const [updating, setUpdating] = useState<number | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session?.user) {
      router.push('/auth/signin');
      return;
    }
    fetchTopicProblems();
  }, [status, session, router, platform, difficulty, topic]);

  const fetchTopicProblems = async () => {
    try {
      setLoading(true);

      // Fetch problems for this specific topic
      const response = await fetch(
        `/api/problems?platform=${platform}&difficulty=${difficulty}&topic=${topic}&onlyApproved=true`
      );
      const data = await response.json();

      if (data.success) {
        // Filter problems to only show those with matching topicSlugs
        const filteredProblems = data.data.filter((p: Problem) => 
          p.topicSlugs && p.topicSlugs.includes(topic)
        );
        setProblems(filteredProblems);

        // TODO: Fetch user progress for these problems
        // For now, initialize empty progress
        const progressMap: Record<number, UserProgress> = {};
        filteredProblems.forEach((p: Problem) => {
          progressMap[p.id] = { problemId: p.id, status: 'bookmarked' };
        });
        setUserProgress(progressMap);
      }
    } catch (error) {
      console.error('Error fetching problems:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (problemId: number) => {
    try {
      setUpdating(problemId);
      const currentStatus = userProgress[problemId]?.status || 'bookmarked';
      
      // Cycle through statuses: bookmarked -> attempted -> solved -> bookmarked
      let newStatus: 'solved' | 'attempted' | 'bookmarked';
      if (currentStatus === 'bookmarked') newStatus = 'attempted';
      else if (currentStatus === 'attempted') newStatus = 'solved';
      else newStatus = 'bookmarked';

      // Update in database
      const response = await fetch('/api/problems', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemId,
          status: newStatus,
          solvedAt: newStatus === 'solved' ? new Date().toISOString() : null,
        }),
      });

      if (response.ok) {
        setUserProgress({
          ...userProgress,
          [problemId]: { problemId, status: newStatus },
        });
      }
    } catch (error) {
      console.error('Error updating progress:', error);
    } finally {
      setUpdating(null);
    }
  };

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

  const difficultyColors = {
    EASY: 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700',
    MEDIUM: 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700',
    HARD: 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700',
  };

  const platformNames = {
    LEETCODE: 'LeetCode',
    GEEKSFORGEEKS: 'GeeksforGeeks',
  };

  const topicName = topic
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  const solvedCount = Object.values(userProgress).filter(p => p.status === 'solved').length;
  const attemptedCount = Object.values(userProgress).filter(p => p.status === 'attempted').length;
  const progressPercentage = problems.length > 0 ? (solvedCount / problems.length) * 100 : 0;

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
              <span>{platformNames[platform]}</span>
              <span>•</span>
              <span>{problems.length} problems</span>
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
              <span>{problems.length - solvedCount} remaining</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Problems List */}
      {problems.length === 0 ? (
        <Card>
          <CardContent className="py-16">
            <div className="text-center">
              <Target className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
              <p className="text-lg font-medium text-muted-foreground mb-2">
                No problems available yet
              </p>
              <p className="text-sm text-muted-foreground">
                Admin needs to add problems and mark them as visible
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {problems.map((problem, index) => {
            const progress = userProgress[problem.id];
            const isSolved = progress?.status === 'solved';
            const isAttempted = progress?.status === 'attempted';
            const isUpdating = updating === problem.id;

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
                          👍 {problem.likes}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          ✅ {problem.acceptanceRate}%
                        </span>
                        {problem.companyTags.length > 0 && (
                          <>
                            <span>•</span>
                            <div className="flex gap-1 flex-wrap">
                              {problem.companyTags.slice(0, 3).map(company => (
                                <Badge key={company} variant="outline" className="text-xs">
                                  {company}
                                </Badge>
                              ))}
                              {problem.companyTags.length > 3 && (
                                <span className="text-xs">+{problem.companyTags.length - 3}</span>
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
