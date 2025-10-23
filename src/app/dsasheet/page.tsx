'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Loader2, 
  CheckCircle2, 
  ChevronRight,
  Code2,
  Target
} from 'lucide-react';

interface TopicStats {
  name: string;
  slug: string;
  total: number;
  solved: number;
}

interface DifficultyStats {
  EASY: Record<string, TopicStats>;
  MEDIUM: Record<string, TopicStats>;
  HARD: Record<string, TopicStats>;
}

interface PlatformData {
  LEETCODE: DifficultyStats;
  GEEKSFORGEEKS: DifficultyStats;
}

export default function DSASheetPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [platformData, setPlatformData] = useState<PlatformData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlatform, setSelectedPlatform] = useState<'LEETCODE' | 'GEEKSFORGEEKS'>('LEETCODE');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('EASY');

  useEffect(() => {
    if (status === 'loading') return;
    if (!session?.user) {
      router.push('/auth/signin');
      return;
    }
    fetchAllStats();
  }, [status, session, router]);

  const fetchAllStats = async () => {
    try {
      setLoading(true);
      
      const responses = await Promise.all([
        fetch('/api/dsa-stats?difficulty=EASY&platform=LEETCODE'),
        fetch('/api/dsa-stats?difficulty=MEDIUM&platform=LEETCODE'),
        fetch('/api/dsa-stats?difficulty=HARD&platform=LEETCODE'),
        fetch('/api/dsa-stats?difficulty=EASY&platform=GEEKSFORGEEKS'),
        fetch('/api/dsa-stats?difficulty=MEDIUM&platform=GEEKSFORGEEKS'),
        fetch('/api/dsa-stats?difficulty=HARD&platform=GEEKSFORGEEKS'),
      ]);

      const data = await Promise.all(responses.map(r => r.json()));

      const organized: PlatformData = {
        LEETCODE: {
          EASY: data[0].success ? data[0].data.EASY : {},
          MEDIUM: data[1].success ? data[1].data.MEDIUM : {},
          HARD: data[2].success ? data[2].data.HARD : {},
        },
        GEEKSFORGEEKS: {
          EASY: data[3].success ? data[3].data.EASY : {},
          MEDIUM: data[4].success ? data[4].data.MEDIUM : {},
          HARD: data[5].success ? data[5].data.HARD : {},
        },
      };

      setPlatformData(organized);
    } catch (error) {
      console.error('Error fetching DSA stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = (topics: Record<string, TopicStats>) => {
    const totalProblems = Object.values(topics).reduce((sum, topic) => sum + topic.total, 0);
    const solvedProblems = Object.values(topics).reduce((sum, topic) => sum + topic.solved, 0);
    return { 
      total: totalProblems, 
      solved: solvedProblems, 
      percentage: totalProblems > 0 ? (solvedProblems / totalProblems) * 100 : 0 
    };
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-3">
          <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">Loading DSA Sheet...</p>
        </div>
      </div>
    );
  }

  if (!platformData) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card className="max-w-md mx-auto">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No data available</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentTopics = platformData[selectedPlatform][selectedDifficulty];

  const platformStats = {
    EASY: calculateProgress(platformData[selectedPlatform].EASY),
    MEDIUM: calculateProgress(platformData[selectedPlatform].MEDIUM),
    HARD: calculateProgress(platformData[selectedPlatform].HARD),
  };

  const totalPlatformProgress = {
    total: platformStats.EASY.total + platformStats.MEDIUM.total + platformStats.HARD.total,
    solved: platformStats.EASY.solved + platformStats.MEDIUM.solved + platformStats.HARD.solved,
    percentage: 0,
  };
  totalPlatformProgress.percentage = totalPlatformProgress.total > 0 
    ? (totalPlatformProgress.solved / totalPlatformProgress.total) * 100 
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6 px-4 max-w-6xl">
        <div className="space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-bold">DSA Practice Sheet</h1>
            <p className="text-sm text-muted-foreground">
              Track your progress across {totalPlatformProgress.total} curated problems
            </p>
          </div>

          {/* Platform Selector */}
          <div className="flex gap-2">
            <Button
              variant={selectedPlatform === 'LEETCODE' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPlatform('LEETCODE')}
              className="flex-1"
            >
              <Code2 className="h-4 w-4 mr-2" />
              LeetCode
            </Button>
            <Button
              variant={selectedPlatform === 'GEEKSFORGEEKS' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPlatform('GEEKSFORGEEKS')}
              className="flex-1"
            >
              <Target className="h-4 w-4 mr-2" />
              GeeksforGeeks
            </Button>
          </div>

          {/* Overall Stats */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Overall Progress</span>
                  <span className="text-sm text-muted-foreground">
                    {totalPlatformProgress.solved} / {totalPlatformProgress.total}
                  </span>
                </div>
                <Progress value={totalPlatformProgress.percentage} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {totalPlatformProgress.percentage.toFixed(1)}% complete
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Difficulty Stats */}
          <div className="grid grid-cols-3 gap-3">
            {(['EASY', 'MEDIUM', 'HARD'] as const).map((diff) => {
              const stats = platformStats[diff];
              const isSelected = selectedDifficulty === diff;
              
              return (
                <button
                  key={diff}
                  onClick={() => setSelectedDifficulty(diff)}
                  className="text-left"
                >
                  <Card className={`transition-colors ${isSelected ? 'border-primary' : 'hover:border-muted-foreground'}`}>
                    <CardContent className="p-3">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-muted-foreground">
                            {diff}
                          </span>
                          {isSelected && (
                            <CheckCircle2 className="h-3 w-3 text-primary" />
                          )}
                        </div>
                        <p className="text-lg font-bold">
                          {stats.solved}
                          <span className="text-sm text-muted-foreground">/{stats.total}</span>
                        </p>
                        <Progress value={stats.percentage} className="h-1" />
                      </div>
                    </CardContent>
                  </Card>
                </button>
              );
            })}
          </div>

          {/* Topics */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {selectedDifficulty} Topics
              </h2>
              <Badge variant="secondary" className="text-xs">
                {Object.keys(currentTopics).length} topics
              </Badge>
            </div>

            {Object.keys(currentTopics).length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Code2 className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm font-medium">No topics available</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Check back later for new problems
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.entries(currentTopics).map(([slug, topic]) => {
                  const topicProgress = topic.total > 0 ? (topic.solved / topic.total) * 100 : 0;
                  const isCompleted = topic.solved === topic.total && topic.total > 0;
                  
                  return (
                    <Link
                      key={slug}
                      href={`/dsasheet/${selectedPlatform.toLowerCase()}/${selectedDifficulty.toLowerCase()}/${slug}`}
                    >
                      <Card className="h-full hover:border-primary transition-colors group">
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-medium text-sm group-hover:text-primary transition-colors line-clamp-2">
                                  {topic.name}
                                </h3>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {topic.total} problems
                                </p>
                              </div>
                              {isCompleted ? (
                                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500 flex-shrink-0" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-all group-hover:translate-x-0.5 flex-shrink-0" />
                              )}
                            </div>

                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">Progress</span>
                                <span className="font-medium">
                                  {topic.solved}/{topic.total}
                                </span>
                              </div>
                              <Progress value={topicProgress} className="h-1.5" />
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">
                                  {topicProgress.toFixed(0)}%
                                </span>
                                {isCompleted && (
                                  <Badge variant="secondary" className="h-5 text-xs">
                                    Done
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
