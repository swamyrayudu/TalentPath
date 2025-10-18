'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle2, 
  Circle, 
  Bookmark, 
  ExternalLink,
  Search,
  Filter,
  TrendingUp
} from 'lucide-react';

interface Problem {
  id: number;
  title: string;
  slug: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  platform: string;
  likes: number;
  dislikes: number;
  acceptanceRate: number;
  url: string;
  topicTags: string[];
  companyTags: string[];
  mainTopics: string[];
  topicSlugs: string[];
  accepted: number;
  submissions: number;
  isPremium: boolean;
}

interface UserProgress {
  problemId: number;
  status: 'solved' | 'attempted' | 'bookmarked';
  solvedAt?: Date;
}

interface TopicGroup {
  name: string;
  slug: string;
  count: number;
  problems: Problem[];
}

export default function DsaSheet() {
  const { data: session } = useSession();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [userProgress, setUserProgress] = useState<Map<number, UserProgress>>(new Map());
  const [topics, setTopics] = useState<TopicGroup[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch problems
  useEffect(() => {
    fetchProblems();
    if (session?.user) {
      fetchUserProgress();
    }
  }, [session]);

  const fetchProblems = async () => {
    try {
      const response = await fetch('/api/problems');
      const data = await response.json();
      
      if (data.success) {
        setProblems(data.data);
        groupProblemsByTopic(data.data);
      }
    } catch (error) {
      console.error('Error fetching problems:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProgress = async () => {
    try {
      const response = await fetch('/api/progress');
      const data = await response.json();
      
      if (data.success) {
        const progressMap = new Map();
        data.data.forEach((progress: any) => {
          progressMap.set(progress.progress.problemId, progress.progress);
        });
        setUserProgress(progressMap);
      }
    } catch (error) {
      console.error('Error fetching user progress:', error);
    }
  };

  const groupProblemsByTopic = (problemsList: Problem[]) => {
    const topicMap = new Map<string, Problem[]>();

    problemsList.forEach(problem => {
      problem.topicTags.forEach(tag => {
        if (!topicMap.has(tag)) {
          topicMap.set(tag, []);
        }
        topicMap.get(tag)!.push(problem);
      });
    });

    const topicGroups: TopicGroup[] = Array.from(topicMap.entries()).map(([name, probs]) => ({
      name,
      slug: name.toLowerCase().replace(/\s+/g, '-'),
      count: probs.length,
      problems: probs,
    }));

    topicGroups.sort((a, b) => b.count - a.count);
    setTopics(topicGroups);
  };

  const updateProgress = async (problemId: number, status: 'solved' | 'attempted' | 'bookmarked') => {
    if (!session?.user) {
      alert('Please login to track progress');
      return;
    }

    try {
      const response = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemId,
          status,
          solvedAt: status === 'solved' ? new Date() : null,
        }),
      });

      if (response.ok) {
        fetchUserProgress();
      }
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const filteredProblems = problems.filter(problem => {
    // Topic filter
    if (selectedTopic !== 'all' && !problem.topicTags.includes(selectedTopic)) {
      return false;
    }

    // Difficulty filter
    if (selectedDifficulty !== 'all' && problem.difficulty !== selectedDifficulty) {
      return false;
    }

    // Platform filter
    if (selectedPlatform !== 'all' && problem.platform !== selectedPlatform) {
      return false;
    }

    // Search filter
    if (searchQuery && !problem.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    return true;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY': return 'bg-green-500/10 text-green-500';
      case 'MEDIUM': return 'bg-yellow-500/10 text-yellow-500';
      case 'HARD': return 'bg-red-500/10 text-red-500';
      default: return 'bg-gray-500/10 text-gray-500';
    }
  };

  const getStatusIcon = (problemId: number) => {
    const progress = userProgress.get(problemId);
    if (!progress) return <Circle className="h-5 w-5 text-gray-400" />;
    
    if (progress.status === 'solved') {
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    } else if (progress.status === 'attempted') {
      return <Circle className="h-5 w-5 text-yellow-500 fill-yellow-500" />;
    } else if (progress.status === 'bookmarked') {
      return <Bookmark className="h-5 w-5 text-blue-500 fill-blue-500" />;
    }
  };

  const stats = {
    total: problems.length,
    solved: Array.from(userProgress.values()).filter(p => p.status === 'solved').length,
    attempted: Array.from(userProgress.values()).filter(p => p.status === 'attempted').length,
    bookmarked: Array.from(userProgress.values()).filter(p => p.status === 'bookmarked').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading problems...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">DSA Practice Sheet</h1>
        <p className="text-muted-foreground">
          Master Data Structures & Algorithms with curated problems from top platforms
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Problems</p>
                <h3 className="text-2xl font-bold">{stats.total}</h3>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Solved</p>
                <h3 className="text-2xl font-bold text-green-500">{stats.solved}</h3>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Attempted</p>
                <h3 className="text-2xl font-bold text-yellow-500">{stats.attempted}</h3>
              </div>
              <Circle className="h-8 w-8 text-yellow-500 fill-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Bookmarked</p>
                <h3 className="text-2xl font-bold text-blue-500">{stats.bookmarked}</h3>
              </div>
              <Bookmark className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search problems..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Topic Filter */}
            <Select value={selectedTopic} onValueChange={setSelectedTopic}>
              <SelectTrigger>
                <SelectValue placeholder="All Topics" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Topics</SelectItem>
                {topics.slice(0, 20).map(topic => (
                  <SelectItem key={topic.slug} value={topic.name}>
                    {topic.name} ({topic.count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Difficulty Filter */}
            <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
              <SelectTrigger>
                <SelectValue placeholder="All Difficulties" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Difficulties</SelectItem>
                <SelectItem value="EASY">Easy</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HARD">Hard</SelectItem>
              </SelectContent>
            </Select>

            {/* Platform Filter */}
            <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
              <SelectTrigger>
                <SelectValue placeholder="All Platforms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                <SelectItem value="LEETCODE">LeetCode</SelectItem>
                <SelectItem value="CODEFORCES">Codeforces</SelectItem>
                <SelectItem value="HACKERRANK">HackerRank</SelectItem>
                <SelectItem value="GEEKSFORGEEKS">GeeksforGeeks</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Problems Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Problems ({filteredProblems.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredProblems.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No problems found</p>
              </div>
            ) : (
              filteredProblems.map((problem) => (
                <div
                  key={problem.id}
                  className="flex items-center gap-4 p-4 rounded-lg border hover:bg-accent transition-colors"
                >
                  {/* Status Icon */}
                  <div className="flex-shrink-0">
                    <button
                      onClick={() => {
                        const currentStatus = userProgress.get(problem.id)?.status;
                        const nextStatus = currentStatus === 'solved' ? 'attempted' : 'solved';
                        updateProgress(problem.id, nextStatus);
                      }}
                      className="hover:scale-110 transition-transform"
                    >
                      {getStatusIcon(problem.id)}
                    </button>
                  </div>

                  {/* Problem Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium truncate">{problem.title}</h3>
                      {problem.isPremium && (
                        <Badge variant="outline" className="text-xs">Premium</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={getDifficultyColor(problem.difficulty)}>
                        {problem.difficulty}
                      </Badge>
                      <Badge variant="outline">{problem.platform}</Badge>
                      {problem.topicTags.slice(0, 3).map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {problem.topicTags.length > 3 && (
                        <span className="text-xs text-muted-foreground">
                          +{problem.topicTags.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="hidden md:flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="text-center">
                      <p className="font-medium">{problem.acceptanceRate}%</p>
                      <p className="text-xs">Acceptance</p>
                    </div>
                    <div className="text-center">
                      <p className="font-medium">{problem.likes}</p>
                      <p className="text-xs">Likes</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => updateProgress(problem.id, 'bookmarked')}
                    >
                      <Bookmark className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="default" asChild>
                      <a href={problem.url} target="_blank" rel="noopener noreferrer">
                        Solve <ExternalLink className="ml-1 h-3 w-3" />
                      </a>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
