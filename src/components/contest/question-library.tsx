'use client';
'use client';
import React from 'react';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { addExistingQuestionToContest, getAllQuestionsFromLibrary } from '@/actions/contest.actions';
import { getAllTopics, getAdminTestCases } from '@/actions/admin-questions.actions';
import { toast } from 'sonner';
import { Search, Plus, Loader2, BookOpen, TestTube, Tag } from 'lucide-react';

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
  const [isLoading, setIsLoading] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [topicFilter, setTopicFilter] = useState<string>('all');
  const [topics, setTopics] = useState<string[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [selectedTestCases, setSelectedTestCases] = useState<TestCase[]>([]);
  const [loadingTestCases, setLoadingTestCases] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  
  const observerTarget = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Load topics on mount
  useEffect(() => {
    if (open) {
      loadTopics();
    }
  }, [open]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset and reload questions when filters change
  useEffect(() => {
    if (open) {
      setPage(1);
      setQuestions([]);
      setHasMore(true);
      loadQuestions(1);
    }
  }, [open, debouncedSearch, difficultyFilter, topicFilter]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !isLoading) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [hasMore, loadingMore, isLoading]);

  // Load more when page changes
  useEffect(() => {
    if (page > 1 && hasMore) {
      loadQuestions(page);
    }
  }, [page]);

  const loadTopics = async () => {
    try {
      const topicsList = await getAllTopics();
        setTopics(topicsList);
  } catch (error) {
        console.error('Failed to load topics:', error instanceof Error ? error.message : String(error));
    }
  };

  const loadQuestions = async (currentPage: number) => {
    if (currentPage === 1) {
      setIsLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const result = await getAllQuestionsFromLibrary({
        page: currentPage,
        limit: 20,
        search: debouncedSearch,
        difficulty: difficultyFilter,
        topic: topicFilter,
      });

      if (result.success && result.data) {
        if (currentPage === 1) {
          setQuestions(result.data);
        } else {
          // Avoid duplicates by filtering out questions that already exist
          setQuestions((prev) => {
            const existingIds = new Set(prev.map(q => q.id));
            const newQuestions = result.data.filter(q => !existingIds.has(q.id));
            return [...prev, ...newQuestions];
          });
        }
        setHasMore(result.hasMore || false);
      } else {
        toast.error('Failed to load questions');
      }
  } catch (error) {
        toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoading(false);
      setLoadingMore(false);
    }
  };

  const loadTestCases = async (questionTitle: string) => {
    setLoadingTestCases(true);
    try {
      const testCases = await getAdminTestCases(questionTitle);
      // Show only sample test cases (first 2)
      const sampleTestCases = testCases.filter(tc => tc.isSample).slice(0, 2);
      setSelectedTestCases(sampleTestCases);
  } catch (error) {
        console.error('Failed to load test cases:', error instanceof Error ? error.message : String(error));
      setSelectedTestCases([]);
    } finally {
      setLoadingTestCases(false);
    }
  };

  const handleQuestionClick = (question: Question) => {
    setSelectedQuestion(question);
    loadTestCases(question.title);
  };

  const handleAddQuestion = async (question: Question) => {
    setIsLoading(true);
    try {
      const result = await addExistingQuestionToContest({
        contestId,
        existingQuestionId: question.id,
        orderIndex,
      });

      if (result.success) {
        toast.success(`"${question.title}" added to contest!`);
        setOpen(false);
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to add question');
      }
  } catch (error) {
        toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY':
        return 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20';
      case 'MEDIUM':
        return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20';
      case 'HARD':
        return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';
      default:
        return '';
    }
  };

  return (
    <>
      <Button 
        variant="outline" 
        onClick={() => setOpen(true)}
        className="w-full"
      >
        <BookOpen className="h-4 w-4 mr-2" />
        Add from Question Library
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl h-[90vh] sm:h-[85vh] flex flex-col p-0">
          <div className="flex flex-col h-full overflow-hidden">
            <DialogHeader className="shrink-0 px-4 lg:px-6 pt-4 lg:pt-6 pb-3 lg:pb-4">
              <DialogTitle className="flex items-center gap-2 text-base lg:text-lg">
                <BookOpen className="h-4 w-4 lg:h-5 lg:w-5" />
                Question Library
              </DialogTitle>
              <DialogDescription className="text-xs lg:text-sm">
                Browse and add existing questions with test cases to your contest
              </DialogDescription>
            </DialogHeader>

            {/* Filters */}
            <div className="shrink-0 px-4 lg:px-6 pb-3 lg:pb-4">
              <div className="flex gap-2 lg:gap-3 flex-wrap">
                <div className="flex-1 min-w-[150px] lg:min-w-[200px] relative">
                  <Search className="absolute left-2 lg:left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 lg:h-4 lg:w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search questions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-7 lg:pl-9 h-8 lg:h-10 text-xs lg:text-sm"
                  />
                </div>
                <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                  <SelectTrigger className="w-28 lg:w-40 h-8 lg:h-10 text-xs lg:text-sm">
                    <SelectValue placeholder="Difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs lg:text-sm">All Levels</SelectItem>
                    <SelectItem value="EASY" className="text-xs lg:text-sm">Easy</SelectItem>
                    <SelectItem value="MEDIUM" className="text-xs lg:text-sm">Medium</SelectItem>
                    <SelectItem value="HARD" className="text-xs lg:text-sm">Hard</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={topicFilter} onValueChange={setTopicFilter}>
                  <SelectTrigger className="w-32 lg:w-48 h-8 lg:h-10 text-xs lg:text-sm">
                    <SelectValue placeholder="Topic" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs lg:text-sm">All Topics</SelectItem>
                    {topics.map((topic) => (
                      <SelectItem key={topic} value={topic} className="text-xs lg:text-sm">
                        {topic}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Questions List */}
            <div className="flex-1 min-h-0 overflow-hidden px-4 lg:px-6 pb-4 lg:pb-6">
              {isLoading && page === 1 ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : questions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <BookOpen className="h-12 w-12 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">
                    No questions match your filters
                  </p>
                </div>
              ) : (
                <div className="h-full overflow-y-auto pr-2 -mr-2 space-y-2 lg:space-y-3" ref={scrollAreaRef}>
                  {questions.map((question, index) => (
                    <Card
                      key={`${question.id}-${index}`}
                      className="hover:border-primary/50 transition-colors cursor-pointer"
                      onClick={() => handleQuestionClick(question)}
                    >
                      <CardContent className="p-3 lg:p-4">
                        <div className="flex items-start justify-between gap-2 lg:gap-4">
                          <div className="flex-1 space-y-1.5 lg:space-y-2 min-w-0">
                            <div className="flex items-center gap-1.5 lg:gap-2 flex-wrap">
                              <h3 className="font-semibold text-sm lg:text-lg break-words">{question.title}</h3>
                              <Badge 
                                variant="outline" 
                                className={`${getDifficultyColor(question.difficulty)} text-[10px] lg:text-xs px-1 lg:px-2`}
                              >
                                {question.difficulty}
                              </Badge>
                              <Badge variant="secondary" className="text-[10px] lg:text-xs px-1 lg:px-2">
                                {question.points} pts
                              </Badge>
                            </div>
                            
                            <p className="text-xs lg:text-sm text-muted-foreground line-clamp-2 break-words">
                              {question.description}
                            </p>
                            
                            {question.topics && question.topics.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {question.topics.slice(0, 3).map((topic, topicIndex) => (
                                  <Badge key={`${question.id}-topic-${topicIndex}-${topic}`} variant="outline" className="text-[10px] lg:text-xs px-1 lg:px-2">
                                    <Tag className="h-2 w-2 lg:h-3 lg:w-3 mr-0.5 lg:mr-1" />
                                    {topic}
                                  </Badge>
                                ))}
                                {question.topics.length > 3 && (
                                  <Badge variant="outline" className="text-[10px] lg:text-xs px-1 lg:px-2">
                                    +{question.topics.length - 3}
                                  </Badge>
                                )}
                              </div>
                            )}
                            
                            <div className="flex items-center gap-2 lg:gap-4 text-[10px] lg:text-xs text-muted-foreground flex-wrap">
                              <span className="flex items-center gap-0.5 lg:gap-1">
                                <TestTube className="h-2.5 w-2.5 lg:h-3 lg:w-3" />
                                {question.testCaseCount} tests
                              </span>
                              <span>
                                {question.timeLimitSeconds || 2}s
                              </span>
                              <span>
                                {question.memoryLimitMb || 256}MB
                              </span>
                            </div>
                          </div>

                          <Button
                            size="sm"
                            className="shrink-0 h-7 lg:h-8 text-xs lg:text-sm px-2 lg:px-3"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddQuestion(question);
                            }}
                            disabled={isLoading}
                          >
                            <Plus className="h-3 w-3 lg:h-4 lg:w-4 lg:mr-1" />
                            <span className="hidden sm:inline">Add</span>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {/* Loading more indicator */}
                  {loadingMore && (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  )}

                  {/* Infinite scroll trigger */}
                  <div ref={observerTarget} className="h-4" />

                  {/* No more results */}
                  {!hasMore && questions.length > 0 && (
                    <div className="text-center py-4 text-sm text-muted-foreground">
                      No more questions
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Question Details Dialog */}
      {selectedQuestion && (
        <Dialog open={!!selectedQuestion} onOpenChange={() => setSelectedQuestion(null)}>
          <DialogContent className="max-w-3xl h-[90vh] sm:h-[85vh] flex flex-col p-0">
            <div className="flex flex-col h-full overflow-hidden">
              <DialogHeader className="shrink-0 px-4 lg:px-6 pt-4 lg:pt-6 pb-3 lg:pb-4">
                <DialogTitle className="break-words text-base lg:text-lg">{selectedQuestion.title}</DialogTitle>
                <div className="flex items-center gap-1.5 lg:gap-2 mt-2 flex-wrap">
                  <Badge 
                    variant="outline" 
                    className={`${getDifficultyColor(selectedQuestion.difficulty)} text-[10px] lg:text-xs px-1 lg:px-2`}
                  >
                    {selectedQuestion.difficulty}
                  </Badge>
                  <Badge variant="secondary" className="text-[10px] lg:text-xs px-1 lg:px-2">{selectedQuestion.points} points</Badge>
                </div>
              </DialogHeader>

              <div className="flex-1 min-h-0 overflow-y-auto px-4 lg:px-6 pb-4 lg:pb-6">
                <div className="space-y-3 lg:space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2 text-sm lg:text-base">Description</h4>
                    <div className="text-xs lg:text-sm text-muted-foreground whitespace-pre-wrap break-words">
                      {selectedQuestion.description}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 lg:gap-4 text-xs lg:text-sm">
                    <div>
                      <span className="font-semibold">Time Limit:</span>{' '}
                      {selectedQuestion.timeLimitSeconds || 2}s
                    </div>
                    <div>
                      <span className="font-semibold">Memory Limit:</span>{' '}
                      {selectedQuestion.memoryLimitMb || 256}MB
                    </div>
                    <div>
                      <span className="font-semibold">Test Cases:</span>{' '}
                      {selectedQuestion.testCaseCount}
                    </div>
                    <div>
                      <span className="font-semibold">Points:</span>{' '}
                      {selectedQuestion.points}
                    </div>
                  </div>

                  {selectedQuestion.topics && selectedQuestion.topics.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2 text-sm lg:text-base">Topics</h4>
                      <div className="flex flex-wrap gap-1.5 lg:gap-2">
                        {selectedQuestion.topics.map((topic, idx) => (
                          <Badge key={`selected-topic-${idx}-${topic}`} variant="outline" className="text-[10px] lg:text-xs px-1 lg:px-2">
                            <Tag className="h-2.5 w-2.5 lg:h-3 lg:w-3 mr-0.5 lg:mr-1" />
                            {topic}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sample Test Cases */}
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-1.5 lg:gap-2 text-sm lg:text-base">
                      <TestTube className="h-3 w-3 lg:h-4 lg:w-4" />
                      Sample Test Cases
                    </h4>
                    {loadingTestCases ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-4 w-4 lg:h-5 lg:w-5 animate-spin text-muted-foreground" />
                      </div>
                    ) : selectedTestCases.length > 0 ? (
                      <div className="space-y-2 lg:space-y-3">
                        {selectedTestCases.map((testCase, idx) => (
                          <Card key={testCase.id} className="border-2">
                            <CardContent className="p-2 lg:p-3">
                              <div className="space-y-1.5 lg:space-y-2">
                                <div className="flex items-center justify-between mb-1.5 lg:mb-2 flex-wrap gap-1 lg:gap-2">
                                  <span className="text-xs lg:text-sm font-semibold">Example {idx + 1}</span>
                                  <Badge variant="outline" className="text-[10px] lg:text-xs px-1 lg:px-2">{testCase.points} points</Badge>
                                </div>
                                <div>
                                  <p className="text-[10px] lg:text-xs font-semibold text-muted-foreground mb-1">Input:</p>
                                  <pre className="bg-muted/50 p-1.5 lg:p-2 rounded text-[10px] lg:text-xs font-mono overflow-x-auto border whitespace-pre-wrap break-all">
                                    {testCase.input.replace(/\\n/g, '\n')}
                                  </pre>
                                </div>
                                <div>
                                  <p className="text-[10px] lg:text-xs font-semibold text-muted-foreground mb-1">Expected Output:</p>
                                  <pre className="bg-muted/50 p-1.5 lg:p-2 rounded text-[10px] lg:text-xs font-mono overflow-x-auto border whitespace-pre-wrap break-all">
                                    {testCase.expectedOutput.replace(/\\n/g, '\n')}
                                  </pre>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs lg:text-sm text-muted-foreground">No sample test cases available</p>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 pt-3 lg:pt-4 sticky bottom-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t -mx-4 lg:-mx-6 px-4 lg:px-6 py-3 lg:py-4 mt-3 lg:mt-4">
                    <Button variant="outline" onClick={() => setSelectedQuestion(null)} size="sm" className="h-8 lg:h-10 text-xs lg:text-sm">
                      Cancel
                    </Button>
                    <Button
                      onClick={() => {
                        handleAddQuestion(selectedQuestion);
                        setSelectedQuestion(null);
                      }}
                      disabled={isLoading}
                      size="sm"
                      className="h-8 lg:h-10 text-xs lg:text-sm"
                    >
                      {isLoading ? (
                        <Loader2 className="h-3 w-3 lg:h-4 lg:w-4 lg:mr-2 animate-spin" />
                      ) : (
                        <Plus className="h-3 w-3 lg:h-4 lg:w-4 lg:mr-2" />
                      )}
                      Add to Contest
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
