'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ExternalLink, Bookmark, CheckCircle2, Circle, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const ITEMS_PER_PAGE = 20;

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

export default function TopicPage() {
  const params = useParams();
  const topicSlug = params.topics as string;

  const [problems, setProblems] = useState<Problem[]>([]);
  const [displayedProblems, setDisplayedProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sortKey, setSortKey] = useState('likes');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const observerTarget = useRef<HTMLDivElement>(null);

  // Fetch problems for the topic
  const fetchProblems = useCallback(async (pageNum: number = 1, sortBy: string = 'likes') => {
    if (!topicSlug) return;

    try {
      if (pageNum === 1) {
        setLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }

      const sortParam = sortBy === 'acceptance' ? 'acceptanceRate' : sortBy;
      const offset = (pageNum - 1) * ITEMS_PER_PAGE;
      
      console.log('Fetching problems for topic:', topicSlug, 'page:', pageNum, 'sort:', sortBy);
      
      const response = await fetch(
        `/api/problems?topic=${topicSlug}&sortBy=${sortParam}&sortOrder=desc&limit=${ITEMS_PER_PAGE}&offset=${offset}`
      );
      
      const data = await response.json();
      console.log('API response:', data);

      if (data.success) {
        const newProblems = data.data;
        
        if (pageNum === 1) {
          setProblems(newProblems);
          setDisplayedProblems(newProblems);
        } else {
          setProblems(prev => [...prev, ...newProblems]);
          setDisplayedProblems(prev => [...prev, ...newProblems]);
        }
        
        setHasMore(newProblems.length === ITEMS_PER_PAGE);
        setPage(pageNum);
      } else {
        setError(data.error || 'Failed to fetch problems');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Network error occurred');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [topicSlug]);

  // Initial load
  useEffect(() => {
    if (topicSlug) {
      fetchProblems(1, sortKey);
    }
  }, [topicSlug, fetchProblems]);

  // Handle sort change
  useEffect(() => {
    if (topicSlug && sortKey) {
      fetchProblems(1, sortKey);
    }
  }, [sortKey, fetchProblems]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading]);

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchProblems(page + 1, sortKey);
    }
  }, [fetchProblems, page, sortKey, loadingMore, hasMore]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'MEDIUM': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'HARD': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-500';
    }
  };

  const formatTopicName = (slug: string) => {
    return slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading && problems.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading problems...</p>
        </div>
      </div>
    );
  }

  if (!topicSlug) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardHeader>
            <CardTitle>Topic Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Invalid topic parameter. Please check the URL.</p>
            <Link href="/dsasheet">
              <Button className="mt-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to DSA Sheet
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-500">{error}</p>
            <div className="flex gap-2 mt-4">
              <Button onClick={() => fetchProblems(1, sortKey)} variant="outline">
                Retry
              </Button>
              <Link href="/dsasheet">
                <Button variant="ghost">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to DSA Sheet
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/dsasheet">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to DSA Sheet
            </Button>
          </Link>
        </div>
        <h1 className="text-4xl font-bold mb-2">
          {formatTopicName(topicSlug)} Problems
        </h1>
        <p className="text-muted-foreground">
          {problems.length > 0 ? `Found ${problems.length} problems` : 'No problems found for this topic'}
        </p>
      </div>

      {/* Sorting Controls */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium">Sort by:</label>
              <Select value={sortKey} onValueChange={setSortKey}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="likes">Most Liked</SelectItem>
                  <SelectItem value="acceptance">Acceptance Rate</SelectItem>
                  <SelectItem value="title">Title (A-Z)</SelectItem>
                  <SelectItem value="difficulty">Difficulty</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-muted-foreground">
              Showing {displayedProblems.length} of {problems.length} problems
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Problems List */}
      <Card>
        <CardContent className="pt-6">
          {displayedProblems.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No problems found for this topic.</p>
              <Link href="/dsasheet">
                <Button variant="outline" className="mt-4">
                  Browse All Topics
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {displayedProblems.map((problem) => (
                <div
                  key={problem.id}
                  className="flex items-center gap-4 p-4 rounded-lg border hover:bg-accent transition-colors"
                >
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
                      disabled
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