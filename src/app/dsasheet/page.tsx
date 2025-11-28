'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { 
  Loader2, 
  CheckCircle2, 
  ChevronRight,
  Code2,
  Target,
  Building2,
  Search,
  RefreshCw
} from 'lucide-react';

interface TopicStats {
  name: string;
  slug: string;
  total: number;
  solved: number;
}

interface PlatformStats {
  EASY: { total: number; solved: number };
  MEDIUM: { total: number; solved: number };
  HARD: { total: number; solved: number };
}

interface TopicData {
  platform: string;
  difficulty: string;
  topicSlug: string;
  topicName: string;
  totalCount: number;
  totalLikes?: number;
}

export default function DSASheetPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [topicsData, setTopicsData] = useState<TopicData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<'LEETCODE' | 'GEEKSFORGEEKS'>('LEETCODE');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('EASY');
  const [searchTerm, setSearchTerm] = useState('');
  const [uniqueCounts, setUniqueCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (status === 'loading') return;
    if (!session?.user) {
      router.push('/auth/signin');
      return;
    }
    fetchStats();
  }, [status, session, router]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // Fetch stats from visible_problems table
      const response = await fetch('/api/visible-problems/stats');
      const result = await response.json();

      console.log('📊 API Response:', result);

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch stats');
      }

      setTopicsData(result.data || []);
      
      // Process unique counts
      const counts: Record<string, number> = {};
      if (result.uniqueCounts && Array.isArray(result.uniqueCounts)) {
        result.uniqueCounts.forEach((row: { platform: string; difficulty: string; unique_count: number }) => {
          const key = `${row.platform}-${row.difficulty}`;
          counts[key] = Number(row.unique_count);
        });
      }
      setUniqueCounts(counts);
      
      console.log('✅ Topics loaded:', result.data?.length || 0);
      console.log('✅ Unique counts:', counts);
    } catch (error) {
      console.error('Error fetching DSA stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  };

  // Process topics data into organized structure
  const organizedData = useMemo(() => {
    const result: Record<string, Record<string, Record<string, TopicStats>>> = {
      LEETCODE: { EASY: {}, MEDIUM: {}, HARD: {} },
      GEEKSFORGEEKS: { EASY: {}, MEDIUM: {}, HARD: {} },
    };

    topicsData.forEach((item) => {
      const platform = item.platform?.toUpperCase() || 'LEETCODE';
      const difficulty = item.difficulty?.toUpperCase() || 'EASY';
      
      if (result[platform] && result[platform][difficulty]) {
        result[platform][difficulty][item.topicSlug] = {
          name: item.topicName,
          slug: item.topicSlug,
          total: Number(item.totalCount) || 0,
          solved: 0,
        };
      }
    });

    return result;
  }, [topicsData]);

  // Calculate platform stats
  const platformStats = useMemo((): PlatformStats => {
    return {
      EASY: {
        total: uniqueCounts[`${selectedPlatform}-EASY`] || 0,
        solved: 0,
      },
      MEDIUM: {
        total: uniqueCounts[`${selectedPlatform}-MEDIUM`] || 0,
        solved: 0,
      },
      HARD: {
        total: uniqueCounts[`${selectedPlatform}-HARD`] || 0,
        solved: 0,
      },
    };
  }, [selectedPlatform, uniqueCounts]);

  // Filter topics by search term
  const filteredTopics = useMemo(() => {
    const currentTopics = organizedData[selectedPlatform]?.[selectedDifficulty] || {};
    
    if (!searchTerm) return currentTopics;
    
    const filtered: Record<string, TopicStats> = {};
    Object.entries(currentTopics).forEach(([slug, topic]) => {
      if (topic.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          slug.toLowerCase().includes(searchTerm.toLowerCase())) {
        filtered[slug] = topic;
      }
    });
    return filtered;
  }, [organizedData, selectedPlatform, selectedDifficulty, searchTerm]);

  const totalProgress = {
    total: platformStats.EASY.total + platformStats.MEDIUM.total + platformStats.HARD.total,
    solved: platformStats.EASY.solved + platformStats.MEDIUM.solved + platformStats.HARD.solved,
  };
  const totalPercentage = totalProgress.total > 0 
    ? (totalProgress.solved / totalProgress.total) * 100 
    : 0;

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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6 px-4 max-w-6xl">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <h1 className="text-2xl md:text-3xl font-bold">DSA Practice Sheet</h1>
              <p className="text-sm text-muted-foreground">
                Track your progress across {totalProgress.total} curated problems
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Navigation */}
          <div className="flex gap-2 flex-wrap">
            <Link href="/companies" className="flex-1 min-w-[200px]">
              <Button variant="outline" size="sm" className="w-full gap-2">
                <Building2 className="h-4 w-4" />
                Company-wise Questions
              </Button>
            </Link>
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
                    {totalProgress.solved} / {totalProgress.total}
                  </span>
                </div>
                <Progress value={totalPercentage} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {totalPercentage.toFixed(1)}% complete
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Difficulty Stats */}
          <div className="grid grid-cols-3 gap-3">
            {(['EASY', 'MEDIUM', 'HARD'] as const).map((diff) => {
              const stats = platformStats[diff];
              const isSelected = selectedDifficulty === diff;
              const percentage = stats.total > 0 ? (stats.solved / stats.total) * 100 : 0;
              
              const colorClasses = {
                EASY: 'text-green-600 dark:text-green-400',
                MEDIUM: 'text-yellow-600 dark:text-yellow-400',
                HARD: 'text-red-600 dark:text-red-400',
              };
              
              return (
                <button
                  key={diff}
                  onClick={() => setSelectedDifficulty(diff)}
                  className="text-left"
                >
                  <Card className={`transition-colors ${isSelected ? 'border-primary border-2' : 'hover:border-muted-foreground'}`}>
                    <CardContent className="p-3">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-medium ${colorClasses[diff]}`}>
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
                        <Progress value={percentage} className="h-1" />
                      </div>
                    </CardContent>
                  </Card>
                </button>
              );
            })}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search topics..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Topics */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {selectedDifficulty} Topics
              </h2>
              <Badge variant="secondary" className="text-xs">
                {Object.keys(filteredTopics).length} topics
              </Badge>
            </div>

            {Object.keys(filteredTopics).length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Code2 className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm font-medium">No topics available</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {searchTerm ? 'Try a different search term' : 'Check back later for new problems'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.entries(filteredTopics)
                  .sort(([, a], [, b]) => b.total - a.total)
                  .map(([slug, topic]) => {
                    const topicProgress = topic.total > 0 ? (topic.solved / topic.total) * 100 : 0;
                    const isCompleted = topic.solved === topic.total && topic.total > 0;
                    
                    return (
                      <Link
                        key={slug}
                        href={`/dsasheet/${selectedPlatform.toLowerCase()}/${selectedDifficulty.toLowerCase()}/${slug}`}
                      >
                        <Card className="h-full hover:border-primary transition-colors group cursor-pointer">
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
