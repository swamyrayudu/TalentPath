'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { 
  CheckCircle2, 
  Circle, 
  Bookmark, 
  ExternalLink,
  Search,
  TrendingUp,
  Loader2,
  Check,
  X,
  ChevronsUpDown
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Problem {
  id: number;
  title: string;
  slug: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  platform: string;
  likes: number;
  dislikes: number;
  acceptanceRate: string;
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

const ITEMS_PER_PAGE = 50;

// Data Structure topics only (common DSA topics)
const DS_TOPICS = [
  'Array',
  'String',
  'Linked List',
  'Stack',
  'Queue',
  'Hash Table',
  'Tree',
  'Binary Tree',
  'Binary Search Tree',
  'Heap (Priority Queue)',
  'Graph',
  'Trie',
  'Matrix',
  'Monotonic Stack',
  'Monotonic Queue',
  'Dynamic Programming',
  'Greedy',
  'Backtracking',
  'Divide and Conquer',
  'Binary Search',
  'Two Pointers',
  'Sliding Window',
  'Sorting',
  'Recursion',
  'Math',
  'Bit Manipulation',
  'Union Find',
  'Segment Tree',
  'Binary Indexed Tree',
].sort();

export default function DsaSheet() {
  const { data: session } = useSession();
  const [allProblems, setAllProblems] = useState<Problem[]>([]);
  const [displayedProblems, setDisplayedProblems] = useState<Problem[]>([]);
  const [userProgress, setUserProgress] = useState<Map<number, UserProgress>>(new Map());
  const [availableTopics, setAvailableTopics] = useState<string[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [open, setOpen] = useState(false);

  const observerTarget = useRef<HTMLDivElement>(null);

  // Fetch problems on mount
  useEffect(() => {
    fetchProblems();
    if (session?.user) {
      fetchUserProgress();
    }
  }, [session]);

  // Reset and filter when filters change
  useEffect(() => {
    const filtered = getFilteredProblems();
    setDisplayedProblems(filtered.slice(0, ITEMS_PER_PAGE));
    setPage(1);
    setHasMore(filtered.length > ITEMS_PER_PAGE);
  }, [selectedTopics, selectedDifficulty, selectedPlatform, searchQuery, allProblems]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loadingMore, page, selectedTopics, selectedDifficulty, selectedPlatform, searchQuery]);

  const fetchProblems = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching problems...');
      
      const response = await fetch('/api/problems?limit=10000');
      const data = await response.json();
      
      console.log('📦 Response:', data);

      if (data.success) {
        console.log(`✅ Loaded ${data.data.length} problems`);
        setAllProblems(data.data);
        
        // Extract unique topics from problems that match DS_TOPICS
        const problemTopics = Array.from(
          new Set(data.data.flatMap((p: Problem) => p.topicTags))
        ).filter((topic): topic is string => typeof topic === 'string');
        
        // Filter to only include DS topics
        const filteredTopics = problemTopics.filter(topic => 
          DS_TOPICS.some(dsTopic => 
            dsTopic.toLowerCase() === topic.toLowerCase()
          )
        ).sort();
        
        setAvailableTopics(filteredTopics);
        
        // Initially display first page
        setDisplayedProblems(data.data.slice(0, ITEMS_PER_PAGE));
        setHasMore(data.data.length > ITEMS_PER_PAGE);
      }
    } catch (error) {
      console.error('❌ Error fetching problems:', error);
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
        data.data.forEach((item: any) => {
          if (item.progress && item.progress.problemId) {
            progressMap.set(Number(item.progress.problemId), item.progress);
          }
        });
        setUserProgress(progressMap);
      }
    } catch (error) {
      console.error('Error fetching user progress:', error);
    }
  };

  const getFilteredProblems = useCallback(() => {
    return allProblems.filter(problem => {
      // Multi-topic filter - problem must have at least one selected topic
      if (selectedTopics.length > 0) {
        const hasMatchingTopic = selectedTopics.some(selectedTopic =>
          problem.topicTags.some(tag => 
            tag.toLowerCase() === selectedTopic.toLowerCase()
          )
        );
        if (!hasMatchingTopic) {
          return false;
        }
      }

      // Difficulty filter
      if (selectedDifficulty !== 'all' && problem.difficulty !== selectedDifficulty) {
        return false;
      }

      // Platform filter
      if (selectedPlatform !== 'all') {
        const normalizedPlatform = problem.platform?.toUpperCase().trim();
        const selectedNormalized = selectedPlatform.toUpperCase().trim();
        
        if (normalizedPlatform !== selectedNormalized) {
          return false;
        }
      }

      // Search filter
      if (searchQuery && !problem.title.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      return true;
    });
  }, [allProblems, selectedTopics, selectedDifficulty, selectedPlatform, searchQuery]);

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    
    setTimeout(() => {
      const filtered = getFilteredProblems();
      const nextPage = page + 1;
      const start = 0;
      const end = nextPage * ITEMS_PER_PAGE;
      
      const newDisplayed = filtered.slice(start, end);
      setDisplayedProblems(newDisplayed);
      setPage(nextPage);
      setHasMore(end < filtered.length);
      setLoadingMore(false);
    }, 300);
  }, [page, loadingMore, hasMore, getFilteredProblems]);

  const toggleTopic = (topic: string) => {
    setSelectedTopics(prev =>
      prev.includes(topic)
        ? prev.filter(t => t !== topic)
        : [...prev, topic]
    );
  };

  const clearTopics = () => {
    setSelectedTopics([]);
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
          solvedAt: status === 'solved' ? new Date().toISOString() : null,
        }),
      });

      if (response.ok) {
        fetchUserProgress();
      }
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'MEDIUM': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'HARD': return 'bg-red-500/10 text-red-500 border-red-500/20';
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
    total: allProblems.length,
    solved: Array.from(userProgress.values()).filter(p => p.status === 'solved').length,
    attempted: Array.from(userProgress.values()).filter(p => p.status === 'attempted').length,
    bookmarked: Array.from(userProgress.values()).filter(p => p.status === 'bookmarked').length,
  };

  const filteredCount = getFilteredProblems().length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
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
          Master Data Structures & Algorithms with {allProblems.length} curated problems
        </p>
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

            {/* Multi-select Topic Filter */}
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-full justify-between"
                >
                  {selectedTopics.length === 0
                    ? "Select topics..."
                    : `${selectedTopics.length} topic${selectedTopics.length > 1 ? 's' : ''} selected`}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0">
                <Command>
                  <CommandInput placeholder="Search topics..." />
                  <CommandEmpty>No topic found.</CommandEmpty>
                  <CommandGroup className="max-h-[300px] overflow-auto">
                    {availableTopics.map((topic) => (
                      <CommandItem
                        key={topic}
                        onSelect={() => toggleTopic(topic)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedTopics.includes(topic) ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {topic}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>

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
                <SelectItem value="GEEKSFORGEEKS">GeeksforGeeks</SelectItem>
                <SelectItem value="CODEFORCES">Codeforces</SelectItem>
                <SelectItem value="HACKERRANK">HackerRank</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Selected Topics Display */}
          {selectedTopics.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2 items-center">
              <span className="text-sm text-muted-foreground">Selected:</span>
              {selectedTopics.map(topic => (
                <Badge key={topic} variant="secondary" className="gap-1">
                  {topic}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => toggleTopic(topic)}
                  />
                </Badge>
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={clearTopics}
                className="h-6 text-xs"
              >
                Clear all
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Problems List */}
      <Card>
        <CardHeader>
          <CardTitle>
            Problems ({displayedProblems.length} of {filteredCount})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {displayedProblems.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No problems found</p>
                {selectedTopics.length > 0 && (
                  <Button
                    onClick={clearTopics}
                    variant="outline"
                    className="mt-4"
                  >
                    Clear topic filters
                  </Button>
                )}
              </div>
            ) : (
              <>
                {displayedProblems.map((problem) => (
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
                        disabled={!session}
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
                        disabled={!session}
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
                ))}

                {/* Loading indicator */}
                {loadingMore && (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                )}

                {/* Observer target */}
                <div ref={observerTarget} className="h-4" />

                {/* End message */}
                {!hasMore && displayedProblems.length > 0 && (
                  <div className="text-center py-4 text-muted-foreground">
                    <p>You've reached the end of the list</p>
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
