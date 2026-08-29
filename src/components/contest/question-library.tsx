'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  addExistingQuestionToContest,
  getAllQuestionsFromLibrary,
  getLibraryQuestion,
} from '@/actions/contest.actions';
import { getAllTopics, getAdminTestCases } from '@/actions/admin-questions.actions';
import { toast } from 'sonner';
import { Search, Plus, Loader2, BookOpen } from 'lucide-react';
import { ProblemStatement } from './problem-statement';

const PAGE_SIZE = 20;

const DIFFICULTY_STYLE: Record<string, string> = {
  EASY: 'border-emerald-500/40 text-emerald-600 dark:text-emerald-400',
  MEDIUM: 'border-amber-500/40 text-amber-600 dark:text-amber-400',
  HARD: 'border-rose-500/40 text-rose-600 dark:text-rose-400',
};

/**
 * Rows show a plain-text lead-in. Statements are Markdown documents, so the raw
 * text would leak `###` and backticks into the list.
 */
function plainPreview(description: string) {
  return description
    .split(/\n#{1,6}\s/)[0]
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[`*_>#]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

interface Question {
  id: string;
  title: string;
  description: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  points: number;
  timeLimitSeconds: number | null;
  memoryLimitMb: number | null;
  topics: string[];
  testCaseCount: number;
  createdAt: Date;
}

interface TestCase {
  id: string;
  questionTitle: string;
  input: string;
  expectedOutput: string;
  isSample: boolean;
  isHidden: boolean;
  points: number;
}

interface QuestionLibraryProps {
  contestId: string;
  orderIndex: number;
}

export function QuestionLibrary({ contestId, orderIndex }: QuestionLibraryProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [topicFilter, setTopicFilter] = useState('all');
  const [topics, setTopics] = useState<string[]>([]);

  const [selected, setSelected] = useState<Question | null>(null);
  const [selectedTestCases, setSelectedTestCases] = useState<TestCase[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);

  const observerTarget = useRef<HTMLDivElement>(null);

  // Only the newest request is allowed to write state; a slow page-1 response
  // must not overwrite results the user has already filtered past.
  const requestId = useRef(0);

  useEffect(() => {
    if (!open) return;
    getAllTopics()
      .then(setTopics)
      .catch(() => setTopics([]));
  }, [open]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadPage = useCallback(
    async (nextPage: number) => {
      const id = ++requestId.current;
      if (nextPage === 1) setIsLoading(true);
      else setLoadingMore(true);
      try {
        const result = await getAllQuestionsFromLibrary({
          page: nextPage,
          limit: PAGE_SIZE,
          search: debouncedSearch,
          difficulty: difficultyFilter,
          topic: topicFilter,
        });
        if (id !== requestId.current) return;

        if (!result.success) {
          toast.error(result.error || 'Failed to load questions');
          return;
        }
        const rows = result.data as Question[];
        setTotal(result.totalCount || 0);
        setHasMore(Boolean(result.hasMore));
        setQuestions((prev) => (nextPage === 1 ? rows : [...prev, ...rows]));
      } catch (error) {
        if (id === requestId.current) {
          toast.error(error instanceof Error ? error.message : String(error));
        }
      } finally {
        if (id === requestId.current) {
          setIsLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [debouncedSearch, difficultyFilter, topicFilter],
  );

  // Filters changed (or the dialog opened): restart from page 1.
  useEffect(() => {
    if (!open) return;
    setPage(1);
    setHasMore(true);
    loadPage(1);
  }, [open, loadPage]);

  useEffect(() => {
    if (page > 1) loadPage(page);
  }, [page, loadPage]);

  // Infinite scroll. The cleanup captures the node it observed — reading
  // `.current` at cleanup time can unobserve the wrong element after a re-render.
  useEffect(() => {
    const node = observerTarget.current;
    if (!node || !open) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) setPage((p) => p + 1);
      },
      { threshold: 0.1 },
    );
    if (hasMore && !isLoading && !loadingMore) observer.observe(node);
    return () => observer.disconnect();
  }, [open, hasMore, isLoading, loadingMore]);

  const openDetails = async (question: Question) => {
    setSelected(question);
    setSelectedTestCases([]);
    setLoadingDetails(true);
    try {
      // The list only carries a truncated description, so pull the real
      // statement and the samples together when the row is opened.
      const [full, cases] = await Promise.all([
        getLibraryQuestion(question.id),
        getAdminTestCases(question.title),
      ]);
      if (full.success && full.data) {
        setSelected((cur) => (cur?.id === question.id ? { ...cur, ...full.data } : cur));
      }
      setSelectedTestCases(cases.filter((tc) => tc.isSample).slice(0, 3));
    } catch {
      setSelectedTestCases([]);
    } finally {
      setLoadingDetails(false);
    }
  };

  const addQuestion = async (question: Question) => {
    setAdding(question.id);
    try {
      const result = await addExistingQuestionToContest({
        contestId,
        existingQuestionId: question.id,
        orderIndex,
      });
      if (result.success) {
        toast.success(`"${question.title}" added to contest`);
        setSelected(null);
        setOpen(false);
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to add question');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setAdding(null);
    }
  };

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)} className="w-full">
        <BookOpen className="h-4 w-4 mr-2" />
        Add from Question Library
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl h-[85vh] flex flex-col gap-0 p-0">
          <DialogHeader className="shrink-0 border-b px-5 py-4">
            <DialogTitle className="text-base">Question Library</DialogTitle>
            <DialogDescription className="text-xs">
              {total > 0
                ? `${total} question${total === 1 ? '' : 's'} with ready-made test cases`
                : 'Questions with ready-made test cases'}
            </DialogDescription>
          </DialogHeader>

          {/* Filters */}
          <div className="shrink-0 flex gap-2 border-b px-5 py-3">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search questions"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 pl-8 text-sm"
              />
            </div>
            <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
              <SelectTrigger className="h-9 w-28 text-sm shrink-0">
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All levels</SelectItem>
                <SelectItem value="EASY">Easy</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HARD">Hard</SelectItem>
              </SelectContent>
            </Select>
            <Select value={topicFilter} onValueChange={setTopicFilter}>
              <SelectTrigger className="h-9 w-36 text-sm shrink-0">
                <SelectValue placeholder="Topic" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All topics</SelectItem>
                {topics.map((topic) => (
                  <SelectItem key={topic} value={topic}>
                    {topic}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Rows */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            {isLoading ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : questions.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
                <p className="text-sm text-muted-foreground">No questions match these filters.</p>
              </div>
            ) : (
              <ul className="divide-y">
                {questions.map((question) => (
                  <li key={question.id}>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => openDetails(question)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          openDetails(question);
                        }
                      }}
                      className="flex w-full items-center gap-3 px-5 py-3 text-left outline-none transition-colors hover:bg-muted/50 focus-visible:bg-muted/50"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-2">
                          <span className="truncate text-sm font-medium">{question.title}</span>
                          <span
                            className={`shrink-0 text-[11px] ${
                              question.difficulty === 'EASY'
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : question.difficulty === 'MEDIUM'
                                  ? 'text-amber-600 dark:text-amber-400'
                                  : 'text-rose-600 dark:text-rose-400'
                            }`}
                          >
                            {question.difficulty[0] + question.difficulty.slice(1).toLowerCase()}
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {question.topics?.length
                            ? question.topics.join(' · ')
                            : plainPreview(question.description)}
                        </p>
                      </div>

                      <span className="hidden shrink-0 text-xs tabular-nums text-muted-foreground sm:block">
                        {question.testCaseCount} tests
                      </span>
                      <span className="hidden shrink-0 text-xs tabular-nums text-muted-foreground sm:block">
                        {question.points} pts
                      </span>

                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 shrink-0 px-2 text-xs"
                        disabled={adding === question.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          addQuestion(question);
                        }}
                      >
                        {adding === question.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Plus className="h-3.5 w-3.5" />
                        )}
                        <span className="ml-1 hidden sm:inline">Add</span>
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {loadingMore && (
              <div className="flex justify-center py-3">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}
            <div ref={observerTarget} className="h-px" />
            {!hasMore && questions.length > 0 && (
              <p className="py-4 text-center text-xs text-muted-foreground">
                End of library
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Details */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl h-[85vh] flex flex-col gap-0 p-0">
          {selected && (
            <>
              <DialogHeader className="shrink-0 border-b px-5 py-4">
                <DialogTitle className="text-base">{selected.title}</DialogTitle>
                <DialogDescription asChild>
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <Badge variant="outline" className={`${DIFFICULTY_STYLE[selected.difficulty]} text-[11px]`}>
                      {selected.difficulty}
                    </Badge>
                    <Badge variant="outline" className="text-[11px]">{selected.points} pts</Badge>
                    <Badge variant="outline" className="text-[11px]">{selected.testCaseCount} tests</Badge>
                    <Badge variant="outline" className="text-[11px]">{selected.timeLimitSeconds ?? 2}s</Badge>
                    <Badge variant="outline" className="text-[11px]">{selected.memoryLimitMb ?? 256} MB</Badge>
                  </div>
                </DialogDescription>
              </DialogHeader>

              <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4">
                {loadingDetails ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <>
                    <ProblemStatement content={selected.description} compact />

                    {selectedTestCases.length > 0 && (
                      <div className="mt-6">
                        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Sample test cases
                        </h4>
                        <div className="space-y-2">
                          {selectedTestCases.map((tc, i) => (
                            <div key={tc.id} className="rounded-md border p-3">
                              <p className="mb-2 text-xs font-medium">Example {i + 1}</p>
                              <div className="grid gap-2 sm:grid-cols-2">
                                <div>
                                  <p className="mb-1 text-[11px] text-muted-foreground">Input</p>
                                  <pre className="overflow-x-auto rounded bg-muted/50 p-2 font-mono text-[11px] whitespace-pre">
                                    {tc.input.replace(/\\n/g, '\n')}
                                  </pre>
                                </div>
                                <div>
                                  <p className="mb-1 text-[11px] text-muted-foreground">Output</p>
                                  <pre className="overflow-x-auto rounded bg-muted/50 p-2 font-mono text-[11px] whitespace-pre">
                                    {tc.expectedOutput.replace(/\\n/g, '\n')}
                                  </pre>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="shrink-0 flex justify-end gap-2 border-t px-5 py-3">
                <Button variant="outline" size="sm" onClick={() => setSelected(null)}>
                  Cancel
                </Button>
                <Button size="sm" disabled={adding === selected.id} onClick={() => addQuestion(selected)}>
                  {adding === selected.id ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  Add to contest
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
