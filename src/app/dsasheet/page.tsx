'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ChevronRight, Trophy, Zap, Building2 } from 'lucide-react';
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
  icon: string;
  total: number;
  solved: number;
};

// Topic categories matching your screenshot
const BEGINNER_TOPICS = [
  { name: 'Arrays', slug: 'array', icon: '📊' },
  { name: 'Strings', slug: 'string', icon: '📝' },
  { name: 'Linked Lists', slug: 'linked-list', icon: '🔗' },
  { name: 'Stacks & Queues', slug: 'stack', icon: '📚' },
  { name: 'Hash Maps & Sets', slug: 'hash-table', icon: '🗂️' },
  { name: 'Trees', slug: 'tree', icon: '🌳' },
  { name: 'Sorting & Searching', slug: 'sorting', icon: '🔍' },
];

const INTERMEDIATE_TOPICS = [
  { name: 'Arrays & Hashing', slug: 'array', icon: '🔢' },
  { name: 'Two Pointers', slug: 'two-pointers', icon: '👉' },
  { name: 'Linked Lists', slug: 'linked-list', icon: '⛓️' },
  { name: 'Stacks & Queues', slug: 'stack', icon: '📦' },
  { name: 'Trees', slug: 'binary-tree', icon: '🌲' },
  { name: 'Graphs', slug: 'graph', icon: '🕸️' },
  { name: 'Sorting & Searching', slug: 'binary-search', icon: '🎯' },
  { name: 'Dynamic Programming', slug: 'dynamic-programming', icon: '⚡' },
];

export default function DsaSheet() {
  const { data: session } = useSession();
  
  const [loading, setLoading] = useState(true);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [userProgress, setUserProgress] = useState<Map<number, UserProgress>>(new Map());
  const [beginnerTopics, setBeginnerTopics] = useState<TopicCard[]>([]);
  const [intermediateTopics, setIntermediateTopics] = useState<TopicCard[]>([]);

  // Fetch all problems and user progress
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch problems (API will filter by visibility)
        const problemsRes = await fetch('/api/problems?limit=10000');
        const problemsData = await problemsRes.json();

        if (problemsData.success) {
          setProblems(problemsData.data);
        }

        // Fetch user progress if logged in
        if (session?.user) {
          const progressRes = await fetch('/api/progress');
          const progressData = await progressRes.json();
          
          if (progressData.success) {
            const progressMap = new Map();
            progressData.data.forEach((item: any) => {
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

    fetchData();
  }, [session]);

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
        total: stats.total,
        solved: stats.solved,
      };
    });

    const intermediate = INTERMEDIATE_TOPICS.map(topic => {
      const stats = topicStats.get(topic.slug) || { total: 0, solved: 0 };
      return {
        ...topic,
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading DSA Sheets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header with Stats */}
      <div className="mb-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-4 flex-wrap gap-4"
        >
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              DSA Sheets
            </h1>
            <p className="text-muted-foreground mt-2">
              Master data structures and algorithms step by step
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/companies">
              <Button 
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 gap-2"
              >
                <Building2 className="w-5 h-5" />
                Company-wise Sheet
              </Button>
            </Link>
            
            {session?.user && (
              <Card className="border-2 border-primary/20">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Trophy className="w-8 h-8 text-primary mx-auto mb-2" />
                    <div className="text-3xl font-bold text-primary">
                      {overallStats.solved}/{overallStats.total}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {overallStats.percentage}% Complete
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </motion.div>
      </div>

      {/* LeetCode Beginner Sheet */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-12"
      >
        <Card className="border-2 border-green-500/20 bg-gradient-to-br from-green-500/5 to-transparent">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                <Zap className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <CardTitle className="text-2xl text-green-600 dark:text-green-400">
                  LeetCode Beginner Sheet
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Start your DSA journey with these fundamental topics
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {beginnerTopics.map((topic, index) => (
                <TopicCardComponent
                  key={topic.slug}
                  topic={topic}
                  index={index}
                  level="beginner"
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* LeetCode Intermediate Sheet */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-2 border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <CardTitle className="text-2xl text-purple-600 dark:text-purple-400">
                  LeetCode Intermediate Sheet
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Level up with advanced problem-solving techniques
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {intermediateTopics.map((topic, index) => (
                <TopicCardComponent
                  key={topic.slug}
                  topic={topic}
                  index={index}
                  level="intermediate"
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
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

  const levelColor = level === 'beginner' ? 'green' : 'purple';
  const isComplete = progressPercentage === 100;

  return (
    <Link href={`/topics/${topic.slug}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        whileHover={{ scale: 1.02, y: -4 }}
        className="group"
      >
        <Card className={cn(
          "border-2 transition-all cursor-pointer h-full",
          "hover:shadow-xl hover:border-primary",
          isComplete && level === 'beginner' && "border-green-500/50 bg-green-500/5",
          isComplete && level === 'intermediate' && "border-purple-500/50 bg-purple-500/5"
        )}>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between mb-4">
              <div className="text-4xl">{topic.icon}</div>
              {isComplete && (
                <Badge className={level === 'beginner' ? 'bg-green-500' : 'bg-purple-500'}>
                  <Trophy className="w-3 h-3 mr-1" />
                  Done
                </Badge>
              )}
            </div>

            <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
              {topic.name}
            </h3>

            <div className="flex items-center justify-between text-sm mb-3">
              <span className="text-muted-foreground">
                {topic.solved}/{topic.total} solved
              </span>
              <span className={cn(
                "font-semibold",
                progressPercentage > 0 
                  ? level === 'beginner' ? 'text-green-600' : 'text-purple-600'
                  : "text-muted-foreground"
              )}>
                {progressPercentage}%
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.8, delay: index * 0.05 }}
                className={cn(
                  "h-full rounded-full",
                  level === 'beginner' ? "bg-green-500" : "bg-purple-500"
                )}
              />
            </div>

            <div className="mt-4 flex items-center text-xs text-muted-foreground group-hover:text-primary transition-colors">
              <span>View problems</span>
              <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </Link>
  );
}
