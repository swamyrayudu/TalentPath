'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Loader2,
  CheckCircle2,
  ChevronRight,
  ArrowLeft,
  Building2,
  Search,
  Code2,
} from 'lucide-react';

interface Problem {
  id: string;
  title: string;
  slug: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  platform: string;
  likes: number;
  dislikes: number;
  acceptanceRate: string | null;
  url: string;
  topicTags: string[];
  companyTags: string[];
  isPremium: boolean;
  accepted: number;
  submissions: number;
  userProgress?: {
    id: string;
    status: string;
    code: string;
    language: string;
    solvedAt: Date | null;
  } | null;
}

interface ApiResponse {
  success: boolean;
  data: Problem[];
  count: number;
  total: number;
  company: string;
  difficultyBreakdown: {
    EASY: number;
    MEDIUM: number;
    HARD: number;
  };
  isAdmin: boolean;
  pagination: {
    limit: number;
    offset: number;
    totalPages: number;
    currentPage: number;
  };
}

interface DifficultyStats {
  total: number;
  solved: number;
  percentage: number;
}

export default function CompanyDSAPage({
  params,
}: {
  params: Promise<{ company: string }>;
}) {
  const { status } = useSession();
  const router = useRouter();

  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<string>('');

  // Filters
  const [selectedDifficulty, setSelectedDifficulty] = useState<'all' | 'EASY' | 'MEDIUM' | 'HARD'>('all');
  const [selectedPlatform, setSelectedPlatform] = useState<'all' | 'LEETCODE' | 'GEEKSFORGEEKS' | 'HACKERRANK' | 'CODEFORCES'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'likes' | 'acceptance' | 'title' | 'difficulty'>('likes');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProblems, setTotalProblems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [paramsCompany, setParamsCompany] = useState<string>('');
  const itemsPerPage = 20;

  useEffect(() => {
    // Resolve the async params
    if (params && typeof params === 'object' && 'then' in params) {
      params.then((p: { company: string }) => {
        setParamsCompany(p.company);
      });
    }
  }, [params]);

  useEffect(() => {
    if (status === 'loading') return;
    fetchCompanyProblems();
  }, [status, selectedDifficulty, selectedPlatform, sortBy, currentPage, searchQuery, paramsCompany]);

  const fetchCompanyProblems = useCallback(async () => {
    try {
      setLoading(true);
      const decodedCompany = decodeURIComponent(paramsCompany);
      const offset = (currentPage - 1) * itemsPerPage;

      const queryParams = new URLSearchParams({
        company: decodedCompany,
        limit: itemsPerPage.toString(),
        offset: offset.toString(),
        sortBy,
      });

      if (selectedDifficulty !== 'all') {
        queryParams.append('difficulty', selectedDifficulty);
      }

      if (selectedPlatform !== 'all') {
        queryParams.append('platform', selectedPlatform);
      }

      if (searchQuery.trim()) {
        queryParams.append('search', searchQuery);
      }

      console.log('📚 Fetching company problems:', {
        company: decodedCompany,
        difficulty: selectedDifficulty,
        platform: selectedPlatform,
        page: currentPage,
      });

      const response = await fetch(`/api/problems/by-company?${queryParams.toString()}`);
      const data: ApiResponse = await response.json();

      if (data.success) {
        setProblems(data.data);
        setCompany(data.company);
        setTotalProblems(data.total);
        setTotalPages(data.pagination.totalPages);
      } else {
        console.error('Error fetching problems:', data);
      }
    } catch (error) {
      console.error('Error fetching company problems:', error);
    } finally {
      setLoading(false);
    }
  }, [paramsCompany, selectedDifficulty, selectedPlatform, sortBy, currentPage, searchQuery]);

  // Calculate statistics
  const stats = useMemo(() => {
    const stats: { [key: string]: DifficultyStats } = {
      EASY: { total: 0, solved: 0, percentage: 0 },
      MEDIUM: { total: 0, solved: 0, percentage: 0 },
      HARD: { total: 0, solved: 0, percentage: 0 },
      ALL: { total: 0, solved: 0, percentage: 0 },
    };

    problems.forEach((problem) => {
      const diffKey = problem.difficulty;
      if (!stats[diffKey]) {
        stats[diffKey] = { total: 0, solved: 0, percentage: 0 };
      }

      stats[diffKey].total++;
      stats.ALL.total++;

      if (problem.userProgress?.status === 'SOLVED') {
        stats[diffKey].solved++;
        stats.ALL.solved++;
      }
    });

    // Calculate percentages
    Object.keys(stats).forEach((key) => {
      if (stats[key].total > 0) {
        stats[key].percentage = (stats[key].solved / stats[key].total) * 100;
      }
    });

    return stats;
  }, [problems]);

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-3">
          <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">Loading company problems...</p>
        </div>
      </div>
    );
  }

  const difficultyColors: { [key: string]: string } = {
    EASY: 'text-green-600 dark:text-green-500 bg-green-50 dark:bg-green-950',
    MEDIUM: 'text-yellow-600 dark:text-yellow-500 bg-yellow-50 dark:bg-yellow-950',
    HARD: 'text-red-600 dark:text-red-500 bg-red-50 dark:bg-red-950',
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6 px-4 max-w-7xl">
        {/* Header */}
        <div className="space-y-4 mb-6">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-primary" />
              <h1 className="text-3xl md:text-4xl font-bold">{company} DSA Sheet</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              {totalProblems} problems curated for {company} interviews
            </p>
          </div>
        </div>

        {/* Overall Progress */}
        <Card className="mb-6 border-2">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Overall Progress</span>
                <span className="text-sm font-medium">
                  {stats.ALL.solved} / {stats.ALL.total}
                </span>
              </div>
              <Progress value={stats.ALL.percentage} className="h-3" />
              <p className="text-xs text-muted-foreground">
                {stats.ALL.percentage.toFixed(1)}% complete
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Difficulty Breakdown */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {(['EASY', 'MEDIUM', 'HARD'] as const).map((diff) => (
            <button
              key={diff}
              onClick={() =>
                setSelectedDifficulty(selectedDifficulty === diff ? 'all' : diff)
              }
              className="text-left"
            >
              <Card
                className={`transition-all ${
                  selectedDifficulty === diff ? 'border-primary border-2' : 'hover:border-muted-foreground'
                }`}
              >
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-semibold ${difficultyColors[diff]}`}>
                        {diff}
                      </span>
                      {selectedDifficulty === diff && (
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <p className="text-2xl font-bold">
                      {stats[diff].solved}
                      <span className="text-sm text-muted-foreground">/{stats[diff].total}</span>
                    </p>
                    <Progress value={stats[diff].percentage} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      {stats[diff].percentage.toFixed(0)}%
                    </p>
                  </div>
                </CardContent>
              </Card>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Platform
            </label>
            <Select value={selectedPlatform} onValueChange={(value: 'all' | 'LEETCODE' | 'GEEKSFORGEEKS' | 'HACKERRANK' | 'CODEFORCES') => setSelectedPlatform(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                <SelectItem value="LEETCODE">LeetCode</SelectItem>
                <SelectItem value="GEEKSFORGEEKS">GeeksforGeeks</SelectItem>
                <SelectItem value="HACKERRANK">HackerRank</SelectItem>
                <SelectItem value="CODEFORCES">CodeForces</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Difficulty
            </label>
            <Select value={selectedDifficulty} onValueChange={(value: 'all' | 'EASY' | 'MEDIUM' | 'HARD') => setSelectedDifficulty(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="EASY">Easy</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HARD">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Sort By
            </label>
            <Select value={sortBy} onValueChange={(value: 'likes' | 'acceptance' | 'title' | 'difficulty') => setSortBy(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="likes">Most Popular</SelectItem>
                <SelectItem value="acceptance">Highest Acceptance</SelectItem>
                <SelectItem value="title">Title (A-Z)</SelectItem>
                <SelectItem value="difficulty">Difficulty</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search problems..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {/* Problems List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {selectedDifficulty === 'all' ? 'All Problems' : `${selectedDifficulty} Problems`}
            </h2>
            <Badge variant="secondary">
              {problems.length} problems
            </Badge>
          </div>

          {problems.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Code2 className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm font-medium">No problems found</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Try adjusting your filters
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="space-y-2">
                {problems.map((problem) => {
                  const isSolved = problem.userProgress?.status === 'SOLVED';
                  const isAttempted = problem.userProgress?.status === 'ATTEMPTED';

                  return (
                    <Link
                      key={problem.id}
                      href={`/problems/${problem.slug}`}
                    >
                      <Card className="hover:shadow-md transition-all group hover:border-primary">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            {/* Status */}
                            <div className="flex-shrink-0">
                              {isSolved ? (
                                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-500" />
                              ) : isAttempted ? (
                                <div className="h-5 w-5 rounded-full border-2 border-yellow-600 dark:border-yellow-500" />
                              ) : (
                                <div className="h-5 w-5 rounded-full border-2 border-muted-foreground" />
                              )}
                            </div>

                            {/* Problem Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-medium text-sm group-hover:text-primary transition-colors line-clamp-1">
                                  {problem.title}
                                </h3>
                                {problem.isPremium && (
                                  <Badge variant="secondary" className="text-xs">
                                    Premium
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${difficultyColors[problem.difficulty]}`}
                                >
                                  {problem.difficulty}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {problem.platform}
                                </Badge>
                                {problem.acceptanceRate && (
                                  <span className="text-xs text-muted-foreground">
                                    {problem.acceptanceRate} acceptance
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Stats */}
                            <div className="hidden md:flex items-center gap-6 text-xs text-muted-foreground">
                              <div className="text-center">
                                <p className="font-medium">{problem.likes}</p>
                                <p>Likes</p>
                              </div>
                              {problem.submissions > 0 && (
                                <div className="text-center">
                                  <p className="font-medium">
                                    {((problem.accepted / problem.submissions) * 100).toFixed(1)}%
                                  </p>
                                  <p>Pass Rate</p>
                                </div>
                              )}
                            </div>

                            {/* Arrow */}
                            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-all group-hover:translate-x-0.5 flex-shrink-0" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6 border-t pt-6">
                  <div className="flex items-center justify-between gap-4">
                    <div className="text-sm text-muted-foreground">
                      Page {currentPage} of {totalPages} ({totalProblems} total problems)
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                          return (
                            <Button
                              key={pageNum}
                              variant={currentPage === pageNum ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setCurrentPage(pageNum)}
                              className="w-10"
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
