'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  ChevronsUpDown,
  Image as ImageIcon
} from 'lucide-react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useDsaProblemsCache } from '@/components/context/DsaProblemsCacheContext';
import { useRouter } from 'next/navigation';

type Problem = {
  id: number;
  title: string;
  slug: string;
  difficulty: string;
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
  image?: string;
};

type UserProgress = {
  problemId: number;
  status: 'solved' | 'attempted' | 'bookmarked';
  solvedAt?: Date;
};

const ITEMS_PER_PAGE = 10;
const DS_TOPICS = [
  'Array', 'String', 'Linked List', 'Stack', 'Queue', 'Hash Table',
  'Tree', 'Binary Tree', 'Binary Search Tree', 'Heap (Priority Queue)',
  'Graph', 'Trie', 'Matrix', 'Monotonic Stack', 'Monotonic Queue',
  'Dynamic Programming', 'Greedy', 'Backtracking', 'Divide and Conquer',
  'Binary Search', 'Two Pointers', 'Sliding Window', 'Sorting', 'Recursion',
  'Math', 'Bit Manipulation', 'Union Find', 'Segment Tree', 'Binary Indexed Tree'
].sort();

export default function DsaSheet() {
  const { data: session } = useSession();
  const router = useRouter();
  const { allProblems, setAllProblems, userProgress, setUserProgress } = useDsaProblemsCache();
  const [displayedProblems, setDisplayedProblems] = useState<Problem[]>([]);
  const [topicCounts, setTopicCounts] = useState<Record<string, number>>({});
  const [availableTopics, setAvailableTopics] = useState<string[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(allProblems.length === 0);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [open, setOpen] = useState(false);

  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (allProblems.length > 0) {
      setLoading(false);
      processTopics(allProblems);
      setDisplayedProblems(getFilteredProblems(allProblems).slice(0, ITEMS_PER_PAGE));
      setHasMore(getFilteredProblems(allProblems).length > ITEMS_PER_PAGE);
    } else {
      fetchProblems();
    }
    if (session?.user) fetchUserProgress();
    // eslint-disable-next-line
  }, [session]);

  useEffect(() => {
    if (allProblems.length === 0) return;
    setDisplayedProblems(getFilteredProblems(allProblems).slice(0, ITEMS_PER_PAGE));
    setPage(1);
    setHasMore(getFilteredProblems(allProblems).length > ITEMS_PER_PAGE);
    // eslint-disable-next-line
  }, [selectedTopics, selectedDifficulty, selectedPlatform, searchQuery]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loadingMore) loadMore();
    }, { threshold: 0.1 });

    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, page, selectedTopics, selectedDifficulty, selectedPlatform, searchQuery, allProblems]);

  const fetchProblems = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/problems?limit=10000');
      const data = await response.json();
      if (data.success) {
        setAllProblems(data.data);
        processTopics(data.data);
        setDisplayedProblems(getFilteredProblems(data.data).slice(0, ITEMS_PER_PAGE));
        setHasMore(getFilteredProblems(data.data).length > ITEMS_PER_PAGE);
      }
    } finally {
      setLoading(false);
    }
  };

  const processTopics = (problems: Problem[]) => {
    // Count topics (DS_TOPICS only)
    const counts: Record<string, number> = {};
    problems.forEach(p => {
      p.topicTags.forEach(tag => {
        if (
          DS_TOPICS.some(
            ds => ds.toLowerCase() === tag.toLowerCase()
          )
        ) {
          const match = DS_TOPICS.find(ds => ds.toLowerCase() === tag.toLowerCase());
          if (match) {
            counts[match] = (counts[match] || 0) + 1;
          }
        }
      });
    });
    setTopicCounts(counts);
    setAvailableTopics(
      DS_TOPICS.filter(ds =>
        typeof counts[ds] === 'number' && counts[ds] > 0
      )
    );
  };

  const fetchUserProgress = async () => {
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
  };

  const getFilteredProblems = useCallback((problems: Problem[]) => {
    return problems.filter(problem => {
      if (selectedTopics.length > 0) {
        const hasMatchingTopic = selectedTopics.some(selectedTopic =>
          problem.topicTags.some(tag =>
            tag.toLowerCase() === selectedTopic.toLowerCase()
          )
        );
        if (!hasMatchingTopic) return false;
      }
      if (selectedDifficulty !== 'all' && problem.difficulty !== selectedDifficulty) return false;
      if (selectedPlatform !== 'all') {
        const normalizedPlatform = problem.platform?.toUpperCase().trim();
        const selectedNormalized = selectedPlatform.toUpperCase().trim();
        if (normalizedPlatform !== selectedNormalized) return false;
      }
      if (searchQuery && !problem.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
    // eslint-disable-next-line
  }, [selectedTopics, selectedDifficulty, selectedPlatform, searchQuery]);

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    setTimeout(() => {
      const filtered = getFilteredProblems(allProblems);
      const nextPage = page + 1;
      const start = 0;
      const end = nextPage * ITEMS_PER_PAGE;
      setDisplayedProblems(filtered.slice(start, end));
      setPage(nextPage);
      setHasMore(end < filtered.length);
      setLoadingMore(false);
    }, 250);
  }, [page, loadingMore, hasMore, getFilteredProblems, allProblems]);

  const toggleTopic = (topic: string) => {
    setSelectedTopics(prev =>
      prev.includes(topic)
        ? prev.filter(t => t !== topic)
        : [...prev, topic]
    );
  };

  const clearTopics = () => setSelectedTopics([]);

  // Helper function to convert topic name to URL-safe slug
  const topicToSlug = (topic: string): string => {
    return topic.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  };

  // Handle topic button click - navigate to topic page
  const handleTopicClick = (topic: string) => {
    const slug = topicToSlug(topic);
    router.push(`/topics/${slug}`);
  };

  const updateProgress = async (problemId: number, status: 'solved' | 'attempted' | 'bookmarked') => {
    if (!session?.user) {
      alert('Please login to track progress');
      return;
    }
    await fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        problemId,
        status,
        solvedAt: status === 'solved' ? new Date().toISOString() : null,
      }),
    });
    fetchUserProgress();
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
    if (progress.status === 'solved') return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    if (progress.status === 'attempted') return <Circle className="h-5 w-5 text-yellow-500 fill-yellow-500" />;
    if (progress.status === 'bookmarked') return <Bookmark className="h-5 w-5 text-blue-500 fill-blue-500" />;
  };

  const stats = {
    total: allProblems.length,
    solved: Array.from(userProgress.values()).filter(p => p.status === 'solved').length,
    attempted: Array.from(userProgress.values()).filter(p => p.status === 'attempted').length,
    bookmarked: Array.from(userProgress.values()).filter(p => p.status === 'bookmarked').length,
  };

  const filteredCount = getFilteredProblems(allProblems).length;

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

  // --- BADGE RIBBON: scrollable topics with counts as shown in your image ---
  const mainTopicRibbon = (
    <div className="flex flex-wrap gap-x-5 gap-y-2 items-center mb-6 max-w-full overflow-auto">
      {availableTopics.map(topic => (
        <button
          key={topic}
          className={cn(
            'text-lg font-medium inline-flex items-center cursor-pointer rounded-md px-2 py-1 transition-colors hover:text-primary hover:bg-primary/10',
            selectedTopics.includes(topic) ? 'text-primary bg-primary/20' : 'text-slate-100'
          )}
          onClick={() => handleTopicClick(topic)}
        >
          {topic}
          <span className='ml-1 px-2 py-0.5 rounded-full bg-gray-700/60 text-xs text-slate-100'>
            {topicCounts[topic] ?? 0}
          </span>
        </button>
      ))}
      {availableTopics.length > 10 && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button size="icon" variant="ghost" className="w-6 h-6">
              <ChevronsUpDown />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[260px] p-1">
            <Command>
              <CommandInput placeholder="Search topics..." />
              <CommandEmpty>No topic found.</CommandEmpty>
              <CommandGroup className="max-h-[300px] overflow-auto">
                {availableTopics.map((topic) => (
                  <CommandItem
                    key={topic}
                    onSelect={() => toggleTopic(topic)}
                  >
                    <Check className={cn("mr-2 h-4 w-4", selectedTopics.includes(topic) ? "opacity-100" : "opacity-0")} />
                    {topic} <span className="ml-1 text-xs text-muted-foreground">{topicCounts[topic] ?? 0}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">DSA Practice Sheet</h1>
        <p className="text-muted-foreground">
          Master Data Structures & Algorithms with {allProblems.length} curated problems
        </p>
        
        {/* Stats */}
        {session?.user && (
          <div className="flex gap-6 mt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-500">{stats.solved}</p>
              <p className="text-sm text-muted-foreground">Solved</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-500">{stats.attempted}</p>
              <p className="text-sm text-muted-foreground">Attempted</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-500">{stats.bookmarked}</p>
              <p className="text-sm text-muted-foreground">Bookmarked</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-500">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total</p>
            </div>
          </div>
        )}
      </div>

      {/* Topic Ribbon */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Topics</CardTitle>
        </CardHeader>
        <CardContent>
          {mainTopicRibbon}
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search problems..." 
                value={searchQuery} 
                onChange={e => setSearchQuery(e.target.value)} 
                className="pl-10" 
              />
            </div>
            
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
          
          {/* Selected Topics */}
          {selectedTopics.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center p-3 bg-muted/50 rounded-lg">
              <span className="text-sm font-medium text-muted-foreground">Selected topics:</span>
              {selectedTopics.map(topic => (
                <Badge key={topic} variant="secondary" className="gap-1">
                  {topic}
                  <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => toggleTopic(topic)} />
                </Badge>
              ))}
              <Button variant="ghost" size="sm" onClick={clearTopics} className="h-6 text-xs">
                Clear all
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Problems List */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>
            Problems ({filteredCount})
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            Showing {displayedProblems.length} of {filteredCount} problems
          </div>
        </CardHeader>
        <CardContent>
          {displayedProblems.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No problems found</p>
              {selectedTopics.length > 0 && (
                <Button onClick={clearTopics} variant="outline" className="mt-4">
                  Clear topic filters
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
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
              
              {/* Loading More Indicator */}
              {loadingMore && (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              )}
              
              {/* Intersection Observer Target */}
              <div ref={observerTarget} className="h-4" />
              
              {/* End of List Indicator */}
              {!hasMore && displayedProblems.length > 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  <p>You've reached the end of the list</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}