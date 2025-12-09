'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSession, signIn } from 'next-auth/react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Loader2,
  CheckCircle2, 
  ChevronRight,
  Code2,
  Target,
  Building2,
  Search,
  RefreshCw,
  Flame,
  Trophy,
  Zap,
  Lock,
  TrendingUp,
  BookOpen
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

interface UserProgressItem {
  problemId: number;
  status: string;
  difficulty?: string;
  platform?: string;
  topicSlugs?: string[];
}

export default function DSASheetPage() {
  const { data: session, status } = useSession();
  
  const [topicsData, setTopicsData] = useState<TopicData[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgressItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<'LEETCODE' | 'GEEKSFORGEEKS'>('LEETCODE');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('EASY');
  const [searchTerm, setSearchTerm] = useState('');
  const [uniqueCounts, setUniqueCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (status === 'loading') return;
    fetchStats();
    if (session?.user) {
      fetchUserProgress();
    }
  }, [status, session]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/visible-problems/stats');
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch stats');
      }

      setTopicsData(result.data || []);
      
      const counts: Record<string, number> = {};
      if (result.uniqueCounts && Array.isArray(result.uniqueCounts)) {
        result.uniqueCounts.forEach((row: { platform: string; difficulty: string; unique_count: number }) => {
          const key = `${row.platform}-${row.difficulty}`;
          counts[key] = Number(row.unique_count);
        });
      }
      setUniqueCounts(counts);
    } catch (error) {
      console.error('Error fetching DSA stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProgress = async () => {
    try {
      const response = await fetch('/api/progress/with-problems');
      const result = await response.json();

      if (result.success && result.data) {
        setUserProgress(result.data);
      }
    } catch (error) {
      console.error('Error fetching user progress:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchStats(), fetchUserProgress()]);
    setRefreshing(false);
  };

  const solvedCounts = useMemo(() => {
    const counts: Record<string, Record<string, number>> = {
      LEETCODE: { EASY: 0, MEDIUM: 0, HARD: 0 },
      GEEKSFORGEEKS: { EASY: 0, MEDIUM: 0, HARD: 0 },
    };

    const countedProblems = new Set<number>();

    userProgress.forEach((p) => {
      if (p.status === 'solved' && p.platform && p.difficulty && !countedProblems.has(p.problemId)) {
        const platform = p.platform.toUpperCase();
        const difficulty = p.difficulty.toUpperCase();
        if (counts[platform] && counts[platform][difficulty] !== undefined) {
          counts[platform][difficulty]++;
          countedProblems.add(p.problemId);
        }
      }
    });

    return counts;
  }, [userProgress]);

  const solvedByTopic = useMemo(() => {
    const topicCounts: Record<string, Record<string, Record<string, number>>> = {};

    userProgress.forEach((p) => {
      if (p.status === 'solved' && p.platform && p.difficulty && p.topicSlugs) {
        const platform = p.platform.toUpperCase();
        const difficulty = p.difficulty.toUpperCase();
        
        if (!topicCounts[platform]) topicCounts[platform] = {};
        if (!topicCounts[platform][difficulty]) topicCounts[platform][difficulty] = {};

        p.topicSlugs.forEach((slug: string) => {
          if (!topicCounts[platform][difficulty][slug]) {
            topicCounts[platform][difficulty][slug] = 0;
          }
          topicCounts[platform][difficulty][slug]++;
        });
      }
    });

    return topicCounts;
  }, [userProgress]);

  const organizedData = useMemo(() => {
    const result: Record<string, Record<string, Record<string, TopicStats>>> = {
      LEETCODE: { EASY: {}, MEDIUM: {}, HARD: {} },
      GEEKSFORGEEKS: { EASY: {}, MEDIUM: {}, HARD: {} },
    };

    topicsData.forEach((item) => {
      const platform = item.platform?.toUpperCase() || 'LEETCODE';
      const difficulty = item.difficulty?.toUpperCase() || 'EASY';
      const topicSlug = item.topicSlug;
      
      if (result[platform] && result[platform][difficulty]) {
        const solvedCount = solvedByTopic[platform]?.[difficulty]?.[topicSlug] || 0;
        result[platform][difficulty][item.topicSlug] = {
          name: item.topicName,
          slug: item.topicSlug,
          total: Number(item.totalCount) || 0,
          solved: solvedCount,
        };
      }
    });

    return result;
  }, [topicsData, solvedByTopic]);

  const platformStats = useMemo((): PlatformStats => {
    return {
      EASY: {
        total: uniqueCounts[`${selectedPlatform}-EASY`] || 0,
        solved: solvedCounts[selectedPlatform]?.EASY || 0,
      },
      MEDIUM: {
        total: uniqueCounts[`${selectedPlatform}-MEDIUM`] || 0,
        solved: solvedCounts[selectedPlatform]?.MEDIUM || 0,
      },
      HARD: {
        total: uniqueCounts[`${selectedPlatform}-HARD`] || 0,
        solved: solvedCounts[selectedPlatform]?.HARD || 0,
      },
    };
  }, [selectedPlatform, uniqueCounts, solvedCounts]);

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
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground text-lg">Loading DSA Sheet...</p>
        </div>
      </div>
    );
  }

  const difficultyConfig = {
    EASY: {
      icon: Zap,
      bgGradient: 'bg-primary/10',
      borderColor: 'border-primary/30',
      textColor: 'text-green-500',
      ringColor: 'ring-primary/40',
      barColor: 'bg-primary',
    },
    MEDIUM: {
      icon: Flame,
      bgGradient: 'bg-primary/10',
      borderColor: 'border-primary/30',
      textColor: 'text-yellow-500',
      ringColor: 'ring-primary/40',
      barColor: 'bg-primary',
    },
    HARD: {
      icon: Trophy,
      bgGradient: 'bg-primary/10',
      borderColor: 'border-primary/30',
      textColor: 'text-red-500',
      ringColor: 'ring-primary/40',
      barColor: 'bg-primary',
    },
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-4 sm:py-5 px-3 sm:px-4 max-w-6xl">
        <div className="space-y-4">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">DSA Practice Sheet</h1>
                <p className="text-sm text-muted-foreground">
                  {totalProgress.total} curated problems
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
                className="h-9 px-3"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
              <Link href="/companies">
                <Button variant="default" size="sm" className="gap-2 h-9 px-4">
                  <Building2 className="h-4 w-4" />
                  <span className="text-sm">Companies</span>
                </Button>
              </Link>
            </div>
          </div>

          {/* Platform Tabs */}
          <div className="flex gap-1 p-1 bg-muted rounded-lg">
            {[
              { key: 'LEETCODE' as const, label: 'LeetCode', icon: Code2 },
              { key: 'GEEKSFORGEEKS' as const, label: 'GeeksforGeeks', shortLabel: 'GFG', icon: Target },
            ].map((platform) => (
              <button
                key={platform.key}
                onClick={() => setSelectedPlatform(platform.key)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-sm font-medium transition-colors ${
                  selectedPlatform === platform.key
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <platform.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{platform.label}</span>
                <span className="sm:hidden">{platform.shortLabel || platform.label}</span>
              </button>
            ))}
          </div>

          {/* Progress Overview Card */}
          <Card className="border">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center gap-4">
                {/* Circular Progress */}
                <div className="relative w-14 h-14 sm:w-16 sm:h-16 shrink-0">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="50%"
                      cy="50%"
                      r="40%"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                      className="text-muted"
                    />
                    <circle
                      cx="50%"
                      cy="50%"
                      r="40%"
                      stroke="hsl(var(--primary))"
                      strokeWidth="4"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={`${totalPercentage * 2.51} 251`}
                      className="transition-all duration-500"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-bold text-foreground">{totalPercentage.toFixed(0)}%</span>
                  </div>
                </div>
                  
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">Overall Progress</span>
                  </div>
                  <p className="text-xl font-bold text-foreground">
                    {totalProgress.solved}
                    <span className="text-sm text-muted-foreground font-normal"> / {totalProgress.total}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {totalProgress.total - totalProgress.solved} remaining
                  </p>
                </div>

                {/* Sign in prompt for guests */}
                {!session?.user && (
                  <div className="ml-auto flex items-center gap-3 pl-4 border-l border-border">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => signIn('google', { callbackUrl: window.location.href })}
                      className="h-8 text-sm"
                    >
                      Sign In
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Difficulty Cards */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {(['EASY', 'MEDIUM', 'HARD'] as const).map((diff) => {
              const stats = platformStats[diff];
              const config = difficultyConfig[diff];
              const isSelected = selectedDifficulty === diff;
              const percentage = stats.total > 0 ? (stats.solved / stats.total) * 100 : 0;
              const DiffIcon = config.icon;
              
              return (
                <button
                  key={diff}
                  onClick={() => setSelectedDifficulty(diff)}
                  className="text-left w-full"
                >
                  <Card className={`h-full transition-all ${
                    isSelected 
                      ? `ring-2 ${config.ringColor} border-transparent` 
                      : 'hover:border-muted-foreground/30'
                  }`}>
                    <CardContent className="p-2 sm:p-3">
                      <div className="flex items-center justify-between gap-1 sm:hidden">
                        <div>
                          <span className={`text-[10px] font-semibold ${config.textColor}`}>{diff}</span>
                          <p className="text-sm font-bold text-foreground">
                            {stats.solved}<span className="text-[10px] text-muted-foreground font-normal">/{stats.total}</span>
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-muted-foreground">{percentage.toFixed(0)}%</p>
                          {isSelected && <CheckCircle2 className={`h-3 w-3 ${config.textColor} ml-auto`} />}
                        </div>
                      </div>
                      <div className="h-1 bg-muted rounded-full overflow-hidden sm:hidden mt-1">
                        <div className={`h-full rounded-full ${config.barColor}`} style={{ width: `${percentage}%` }} />
                      </div>
                      
                      <div className="hidden sm:block space-y-2">
                        <div className="flex items-center justify-between">
                          <div className={`p-1.5 rounded-md ${config.bgGradient}`}>
                            <DiffIcon className={`h-4 w-4 ${config.textColor}`} />
                          </div>
                          {isSelected && <CheckCircle2 className={`h-4 w-4 ${config.textColor}`} />}
                        </div>
                        <div>
                          <span className={`text-xs font-semibold ${config.textColor}`}>{diff}</span>
                          <p className="text-lg font-bold text-foreground">
                            {stats.solved}<span className="text-xs text-muted-foreground font-normal">/{stats.total}</span>
                          </p>
                        </div>
                        <div className="space-y-1">
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${config.barColor}`} style={{ width: `${percentage}%` }} />
                          </div>
                          <p className="text-xs text-muted-foreground">{percentage.toFixed(0)}% done</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </button>
              );
            })}
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search topics..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10 text-sm"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchTerm('')}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 px-3 text-sm"
              >
                Clear
              </Button>
            )}
          </div>

          {/* Topics Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-md ${difficultyConfig[selectedDifficulty].bgGradient}`}>
                  {React.createElement(difficultyConfig[selectedDifficulty].icon, { 
                    className: `h-4 w-4 ${difficultyConfig[selectedDifficulty].textColor}` 
                  })}
                </div>
                <h2 className="text-base font-semibold text-foreground">
                  {selectedDifficulty} Topics
                </h2>
              </div>
              <Badge variant="secondary" className="text-xs">
                {Object.keys(filteredTopics).length} topics
              </Badge>
            </div>

            {/* Topics Grid */}
            {Object.keys(filteredTopics).length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-8 text-center">
                  <Code2 className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm font-medium">No topics available</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {searchTerm ? 'Try a different search term' : 'Check back later'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
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
                        <Card className={`h-full group cursor-pointer transition-colors hover:border-primary/50 ${
                          isCompleted ? 'border-primary/30' : ''
                        }`}>
                          <CardContent className="p-3 sm:p-4">
                            <div className="space-y-2.5">
                              <div className="flex items-start justify-between gap-2">
                                <h3 className="font-medium text-sm leading-tight group-hover:text-primary transition-colors line-clamp-2 flex-1 text-foreground">
                                  {topic.name}
                                </h3>
                                {isCompleted ? (
                                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0" />
                                )}
                              </div>

                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-muted-foreground">{topic.total} problems</span>
                                  <span className={`font-medium ${isCompleted ? 'text-primary' : 'text-foreground'}`}>
                                    {topic.solved}/{topic.total}
                                  </span>
                                </div>
                                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                  <div 
                                    className="h-full rounded-full bg-primary"
                                    style={{ width: `${topicProgress}%` }}
                                  />
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
