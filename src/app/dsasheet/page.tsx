'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ChevronRight, Trophy, Zap, Building2, Code2, GitBranch, Database, Network, Boxes, Search as SearchIcon, List, Binary } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

type Problem = {
  id: number;
  title: string;
  slug: string;
  difficulty: string;
  platform: string;
  topicTags: string[];
  topicSlugs: string[];
  isPremium: boolean;
};

type UserProgress = {
  problemId: number;
  status: 'solved' | 'attempted' | 'bookmarked';
  solvedAt?: Date;
};

type TopicCard = {
  name: string;
  slug: string;
  icon: React.ReactNode;
  total: number;
  solved: number;
  color: string;
};

// Topic categories with icon components instead of emojis
const BEGINNER_TOPICS = [
  { name: 'Arrays', slug: 'array', icon: Database, color: 'text-blue-500' },
  { name: 'Strings', slug: 'string', icon: Code2, color: 'text-purple-500' },
  { name: 'Linked Lists', slug: 'linked-list', icon: GitBranch, color: 'text-orange-500' },
  { name: 'Stacks & Queues', slug: 'stack', icon: List, color: 'text-cyan-500' },
  { name: 'Hash Maps & Sets', slug: 'hash-table', icon: Boxes, color: 'text-pink-500' },
  { name: 'Trees', slug: 'tree', icon: Network, color: 'text-green-500' },
  { name: 'Sorting & Searching', slug: 'sorting', icon: SearchIcon, color: 'text-indigo-500' },
];

const INTERMEDIATE_TOPICS = [
  { name: 'Arrays & Hashing', slug: 'array', icon: Database, color: 'text-blue-500' },
  { name: 'Two Pointers', slug: 'two-pointers', icon: Binary, color: 'text-violet-500' },
  { name: 'Linked Lists', slug: 'linked-list', icon: GitBranch, color: 'text-orange-500' },
  { name: 'Stacks & Queues', slug: 'stack', icon: List, color: 'text-cyan-500' },
  { name: 'Trees', slug: 'binary-tree', icon: Network, color: 'text-green-500' },
  { name: 'Graphs', slug: 'graph', icon: Network, color: 'text-emerald-500' },
  { name: 'Sorting & Searching', slug: 'binary-search', icon: SearchIcon, color: 'text-indigo-500' },
  { name: 'Dynamic Programming', slug: 'dynamic-programming', icon: Zap, color: 'text-yellow-500' },
];

// Skeleton loader component
function TopicCardSkeleton() {
  return (
    <Card className="border-2 h-full">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 bg-muted rounded-lg animate-pulse" />
        </div>
        <div className="h-6 bg-muted rounded animate-pulse mb-3" />
        <div className="flex items-center justify-between mb-3">
          <div className="h-4 w-20 bg-muted rounded animate-pulse" />
          <div className="h-4 w-12 bg-muted rounded animate-pulse" />
        </div>
        <div className="w-full h-2 bg-muted rounded animate-pulse" />
      </CardContent>
    </Card>
  );
}

export default function DsaSheet() {
  const { data: session, status: sessionStatus } = useSession();
  
  const [loading, setLoading] = useState(true);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [userProgress, setUserProgress] = useState<Map<number, UserProgress>>(new Map());
  const [beginnerTopics, setBeginnerTopics] = useState<TopicCard[]>([]);
  const [intermediateTopics, setIntermediateTopics] = useState<TopicCard[]>([]);

  // Fetch all problems and user progress with caching
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Check cache first
        const cachedProblems = sessionStorage.getItem('dsa-problems');
        const cacheTimestamp = sessionStorage.getItem('dsa-problems-timestamp');
        const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

        let problemsData;

        // Use cache if valid
        if (cachedProblems && cacheTimestamp) {
          const age = Date.now() - parseInt(cacheTimestamp);
          if (age < CACHE_DURATION) {
            problemsData = JSON.parse(cachedProblems);
            setProblems(problemsData);
          }
        }

        // Fetch fresh data if no cache or expired
        // Force fetch only approved problems for DSA sheet (even for admins)
        if (!problemsData) {
          const problemsRes = await fetch('/api/problems?limit=10000&onlyApproved=true', {
            next: { revalidate: 300 } // Cache for 5 minutes
          });
          const result = await problemsRes.json();

          if (result.success) {
            problemsData = result.data;
            setProblems(problemsData);
            // Cache the data
            sessionStorage.setItem('dsa-problems', JSON.stringify(problemsData));
            sessionStorage.setItem('dsa-problems-timestamp', Date.now().toString());
          }
        }

        // Fetch user progress if logged in
        if (session?.user) {
          const cachedProgress = sessionStorage.getItem(`dsa-progress-${session.user.id}`);
          const progressTimestamp = sessionStorage.getItem(`dsa-progress-timestamp-${session.user.id}`);

          let progressData;

          if (cachedProgress && progressTimestamp) {
            const age = Date.now() - parseInt(progressTimestamp);
            if (age < CACHE_DURATION) {
              progressData = JSON.parse(cachedProgress);
            }
          }

          if (!progressData) {
            const progressRes = await fetch('/api/progress');
            const result = await progressRes.json();
            
            if (result.success) {
              progressData = result.data;
              sessionStorage.setItem(`dsa-progress-${session.user.id}`, JSON.stringify(progressData));
              sessionStorage.setItem(`dsa-progress-timestamp-${session.user.id}`, Date.now().toString());
            }
          }

          if (progressData) {
            const progressMap = new Map();
            progressData.forEach((item: any) => {
              if (item.progress?.problemId) {
                progressMap.set(Number(item.progress.problemId), item.progress);
              }
            });
            setUserProgress(progressMap);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (sessionStatus !== 'loading') {
      fetchData();
    }
  }, [session, sessionStatus]);

  // Calculate topic stats
  const topicStats = useMemo(() => {
    const stats = new Map<string, { total: number; solved: number }>();

    // Initialize all topics
    [...BEGINNER_TOPICS, ...INTERMEDIATE_TOPICS].forEach(topic => {
      stats.set(topic.slug, { total: 0, solved: 0 });
    });

    // Count problems per topic
    problems.forEach(problem => {
      problem.topicSlugs?.forEach(slug => {
        const current = stats.get(slug);
        if (current) {
          current.total++;
          const progress = userProgress.get(problem.id);
          if (progress?.status === 'solved') {
            current.solved++;
          }
        }
      });
    });

    return stats;
  }, [problems, userProgress]);

  // Build topic cards with stats
  useEffect(() => {
    const beginner = BEGINNER_TOPICS.map(topic => {
      const stats = topicStats.get(topic.slug) || { total: 0, solved: 0 };
      return {
        ...topic,
        icon: <topic.icon className={cn("w-6 h-6", topic.color)} />,
        total: stats.total,
        solved: stats.solved,
      };
    });

    const intermediate = INTERMEDIATE_TOPICS.map(topic => {
      const stats = topicStats.get(topic.slug) || { total: 0, solved: 0 };
      return {
        ...topic,
        icon: <topic.icon className={cn("w-6 h-6", topic.color)} />,
        total: stats.total,
        solved: stats.solved,
      };
    });

    setBeginnerTopics(beginner);
    setIntermediateTopics(intermediate);
  }, [topicStats]);

  // Calculate overall progress
  const overallStats = useMemo(() => {
    const totalProblems = problems.length;
    const solvedProblems = Array.from(userProgress.values()).filter(
      p => p.status === 'solved'
    ).length;
    
    return {
      total: totalProblems,
      solved: solvedProblems,
      percentage: totalProblems > 0 ? Math.round((solvedProblems / totalProblems) * 100) : 0
    };
  }, [problems, userProgress]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header Skeleton */}
        <div className="mb-8">
          <div className="h-12 w-64 bg-muted rounded-lg animate-pulse mb-4" />
          <div className="h-6 w-96 bg-muted rounded animate-pulse" />
        </div>

        {/* Beginner Topics Skeleton */}
        <Card className="mb-12 border-2">
          <CardHeader>
            <div className="h-8 w-80 bg-muted rounded animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(7)].map((_, i) => (
                <TopicCardSkeleton key={i} />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Intermediate Topics Skeleton */}
        <Card className="border-2">
          <CardHeader>
            <div className="h-8 w-80 bg-muted rounded animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <TopicCardSkeleton key={i} />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header with Stats */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent">
              DSA Sheets
            </h1>
            <p className="text-muted-foreground mt-2 text-base md:text-lg">
              Master data structures and algorithms with curated problem sets
            </p>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <Link href="/companies">
              <Button 
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 gap-2 shadow-lg hover:shadow-xl transition-all"
              >
                <Building2 className="w-5 h-5" />
                Company-wise
              </Button>
            </Link>
            
            {session?.user && (
              <Card className="border-2 border-primary/30 shadow-lg">
                <CardContent className="pt-6 pb-6 px-6">
                  <div className="text-center">
                    <Trophy className="w-8 h-8 text-primary mx-auto mb-2" />
                    <div className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                      {overallStats.solved}/{overallStats.total}
                    </div>
                    <div className="text-sm text-muted-foreground font-medium">
                      {overallStats.percentage}% Complete
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* LeetCode Beginner Sheet */}
      <div className="mb-12">
        <Card className="border-2 border-green-500/20 bg-gradient-to-br from-green-500/5 via-transparent to-transparent shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                <Zap className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <CardTitle className="text-2xl text-green-600 dark:text-green-400 font-bold">
                  Beginner Level
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Start with fundamental data structures
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {beginnerTopics.map((topic, index) => (
                <TopicCardComponent
                  key={topic.slug + '-beginner'}
                  topic={topic}
                  index={index}
                  level="beginner"
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* LeetCode Intermediate Sheet */}
      <div>
        <Card className="border-2 border-purple-500/20 bg-gradient-to-br from-purple-500/5 via-transparent to-transparent shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <CardTitle className="text-2xl text-purple-600 dark:text-purple-400 font-bold">
                  Intermediate Level
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Master advanced algorithms and techniques
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {intermediateTopics.map((topic, index) => (
                <TopicCardComponent
                  key={topic.slug + '-intermediate'}
                  topic={topic}
                  index={index}
                  level="intermediate"
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Topic Card Component
function TopicCardComponent({ 
  topic, 
  index,
  level 
}: { 
  topic: TopicCard; 
  index: number;
  level: 'beginner' | 'intermediate';
}) {
  const progressPercentage = topic.total > 0 
    ? Math.round((topic.solved / topic.total) * 100) 
    : 0;

  const isComplete = progressPercentage === 100;

  return (
    <Link href={`/topics/${topic.slug}`} prefetch={true}>
      <Card className={cn(
        "border-2 transition-all cursor-pointer h-full group hover:shadow-xl",
        "hover:border-primary/50 hover:-translate-y-1",
        isComplete && level === 'beginner' && "border-green-500/50 bg-green-500/5",
        isComplete && level === 'intermediate' && "border-purple-500/50 bg-purple-500/5"
      )}>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-muted/50 rounded-xl group-hover:scale-110 transition-transform">
              {topic.icon}
            </div>
            {isComplete && (
              <Badge className={cn(
                "shadow-sm",
                level === 'beginner' ? 'bg-green-500 hover:bg-green-600' : 'bg-purple-500 hover:bg-purple-600'
              )}>
                <Trophy className="w-3 h-3 mr-1" />
                Done
              </Badge>
            )}
          </div>

          <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-2">
            {topic.name}
          </h3>

          <div className="flex items-center justify-between text-sm mb-3">
            <span className="text-muted-foreground font-medium">
              {topic.solved}/{topic.total} solved
            </span>
            <span className={cn(
              "font-bold text-base",
              progressPercentage > 0 
                ? level === 'beginner' ? 'text-green-600 dark:text-green-400' : 'text-purple-600 dark:text-purple-400'
                : "text-muted-foreground"
            )}>
              {progressPercentage}%
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden mb-4 shadow-inner">
            <div
              style={{ width: `${progressPercentage}%` }}
              className={cn(
                "h-full rounded-full transition-all duration-500",
                level === 'beginner' ? "bg-gradient-to-r from-green-500 to-green-600" : "bg-gradient-to-r from-purple-500 to-purple-600"
              )}
            />
          </div>

          <div className="flex items-center text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors">
            <span>View problems</span>
            <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
