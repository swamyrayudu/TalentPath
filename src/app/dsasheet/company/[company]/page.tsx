'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SheetBreadcrumb } from '@/components/dsa/sheet-breadcrumb';
import { SheetProgressHeader } from '@/components/dsa/sheet-progress-header';
import { ProblemRow } from '@/components/dsa/problem-row';
import { Building2, Code2, Search, X } from 'lucide-react';

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
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-4xl px-4 py-8 md:px-6 md:py-10">
          <Skeleton className="h-4 w-56" />
          <Skeleton className="mt-6 h-44 rounded-2xl" />
          <Skeleton className="mt-4 h-11 rounded-xl" />
          <div className="mt-4 space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-12 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8 md:px-6 md:py-10">
        <SheetBreadcrumb
          items={[
            { label: 'DSA Sheet', href: '/dsasheet' },
            { label: 'Companies', href: '/companies' },
            { label: company },
          ]}
        />

        <div className="mt-6">
          <SheetProgressHeader
            icon={Building2}
            title={`${company} DSA Sheet`}
            description={`${totalProblems} problems curated for ${company} interviews`}
            solved={stats.ALL.solved}
            total={stats.ALL.total}
            splits={[
              { label: 'Easy', solved: stats.EASY.solved, total: stats.EASY.total },
              { label: 'Medium', solved: stats.MEDIUM.solved, total: stats.MEDIUM.total },
              { label: 'Hard', solved: stats.HARD.solved, total: stats.HARD.total },
            ]}
          />
        </div>

        {/* Filters */}
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative lg:col-span-2">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search problems"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="h-11 rounded-xl pl-10 pr-10"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setCurrentPage(1);
                }}
                aria-label="Clear search"
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          <Select
            value={selectedDifficulty}
            onValueChange={(value: 'all' | 'EASY' | 'MEDIUM' | 'HARD') =>
              setSelectedDifficulty(value)
            }
          >
            <SelectTrigger className="h-11 rounded-xl">
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All levels</SelectItem>
              <SelectItem value="EASY">Easy</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="HARD">Hard</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={sortBy}
            onValueChange={(value: 'likes' | 'acceptance' | 'title' | 'difficulty') =>
              setSortBy(value)
            }
          >
            <SelectTrigger className="h-11 rounded-xl">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="likes">Most popular</SelectItem>
              <SelectItem value="acceptance">Highest acceptance</SelectItem>
              <SelectItem value="title">Title (A-Z)</SelectItem>
              <SelectItem value="difficulty">Difficulty</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={selectedPlatform}
            onValueChange={(
              value: 'all' | 'LEETCODE' | 'GEEKSFORGEEKS' | 'HACKERRANK' | 'CODEFORCES'
            ) => setSelectedPlatform(value)}
          >
            <SelectTrigger className="h-11 rounded-xl">
              <SelectValue placeholder="Platform" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All platforms</SelectItem>
              <SelectItem value="LEETCODE">LeetCode</SelectItem>
              <SelectItem value="GEEKSFORGEEKS">GeeksforGeeks</SelectItem>
              <SelectItem value="HACKERRANK">HackerRank</SelectItem>
              <SelectItem value="CODEFORCES">CodeForces</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Problems */}
        {problems.length === 0 ? (
          <div className="mt-4 flex flex-col items-center rounded-2xl border bg-card py-16 text-center">
            <Code2 className="size-6 text-muted-foreground/40" strokeWidth={1.5} />
            <p className="mt-4 text-sm font-semibold tracking-tight">No problems found</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Try adjusting your filters.
            </p>
          </div>
        ) : (
          <>
            <div className="mt-6 flex items-center justify-between">
              <h2 className="text-sm font-semibold tracking-tight">
                {selectedDifficulty === 'all'
                  ? 'All problems'
                  : `${selectedDifficulty.charAt(0)}${selectedDifficulty
                      .slice(1)
                      .toLowerCase()} problems`}
              </h2>
              <Badge variant="outline" className="tabular-nums">
                {problems.length}
              </Badge>
            </div>

            <div className="mt-3 space-y-2">
              {problems.map((problem) => (
                <ProblemRow
                  key={problem.id}
                  title={problem.title}
                  url={problem.url}
                  difficulty={problem.difficulty}
                  status={
                    problem.userProgress?.status === 'SOLVED'
                      ? 'solved'
                      : problem.userProgress?.status === 'ATTEMPTED'
                        ? 'attempted'
                        : undefined
                  }
                  onToggle={() => {}}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between gap-4 border-t pt-6">
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
                        variant={currentPage === pageNum ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="w-9 tabular-nums"
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
            )}
          </>
        )}
      </div>
    </div>
  );
}
