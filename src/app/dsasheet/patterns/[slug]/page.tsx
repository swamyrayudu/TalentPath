'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  Target,
  Clock,
  Search,
  Lock,
  Code2,
  Bookmark
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
  const attemptedCount = problems.filter(p => userProgress[p.id]?.status === 'attempted').length;
  const totalCount = problems.length;
  const progressPercentage = totalCount > 0 ? (solvedCount / totalCount) * 100 : 0;

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-muted border-t-primary animate-spin mx-auto" />
            <Code2 className="h-6 w-6 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground font-medium">Loading pattern problems...</p>
        </div>
      </div>
    );
  }

  if (!pattern) {
    return (
      <div className="container mx-auto py-12 px-4 text-center">
        <p className="text-lg text-muted-foreground">Pattern not found</p>
        <Button onClick={() => router.push('/dsasheet')} className="mt-4">
          Back to DSA Sheet
        </Button>
      </div>
    );
  }

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
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <div className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600">
                  <Bookmark className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
                    {pattern.name} Pattern
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1 max-w-xl">
                    {pattern.description || 'Practice curated problems focusing on this structural coding pattern.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="flex gap-2 sm:gap-3 shrink-0">
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
                        className="text-indigo-600"
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
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-500"
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
              placeholder="Search pattern problems..."
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
            <CardContent className="py-16 text-center">
              <Target className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
              <p className="text-lg font-medium text-muted-foreground mb-2">
                {searchTerm ? 'No matching problems found' : 'No problems linked to this pattern yet'}
              </p>
              <p className="text-sm text-muted-foreground">
                {searchTerm ? 'Try a different search term' : 'Check back later for newly added pattern questions'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {displayedProblems.map((problem, index) => {
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
                          <Badge variant="secondary" className="text-xs">
                            {problem.platform}
                          </Badge>
                          <Badge variant="outline" className={`text-xs ${
                            problem.difficulty === 'EASY' ? 'text-green-500 border-green-200 bg-green-50/50 dark:bg-green-950/20' :
                            problem.difficulty === 'MEDIUM' ? 'text-yellow-500 border-yellow-200 bg-yellow-50/50 dark:bg-yellow-950/20' :
                            'text-red-500 border-red-200 bg-red-50/50 dark:bg-red-950/20'
                          }`}>
                            {problem.difficulty}
                          </Badge>
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

            {visibleCount < filteredProblems.length && (
              <div ref={loaderRef} className="flex justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-2 text-sm text-muted-foreground">Loading more problems...</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
