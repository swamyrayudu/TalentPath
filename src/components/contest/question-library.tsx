'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
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
    } catch (error: any) {
      console.error('Failed to load topics:', error);
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
    } catch (error: any) {
      toast.error(error.message);
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
    } catch (error: any) {
      console.error('Failed to load test cases:', error);
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
    } catch (error: any) {
      toast.error(error.message);
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
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Question Library
            </DialogTitle>
            <DialogDescription>
              Browse and add existing questions with test cases to your contest
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Filters */}
            <div className="flex gap-3 flex-wrap">
              <div className="flex-1 min-w-[200px] relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search questions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="EASY">Easy</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HARD">Hard</SelectItem>
                </SelectContent>
              </Select>
              <Select value={topicFilter} onValueChange={setTopicFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Topic" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Topics</SelectItem>
                  {topics.map((topic) => (
                    <SelectItem key={topic} value={topic}>
                      {topic}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Questions List */}
            {isLoading && page === 1 ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : questions.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">
                  No questions match your filters
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[500px] pr-4" ref={scrollAreaRef}>
                <div className="space-y-3">
                  {questions.map((question, index) => (
                    <Card
                      key={`${question.id}-${index}`}
                      className="hover:border-primary/50 transition-colors cursor-pointer"
                      onClick={() => handleQuestionClick(question)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-lg">{question.title}</h3>
                              <Badge 
                                variant="outline" 
                                className={getDifficultyColor(question.difficulty)}
                              >
                                {question.difficulty}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {question.points} points
                              </Badge>
                            </div>
                            
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {question.description}
                            </p>
                            
                            {question.topics && question.topics.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {question.topics.map((topic, topicIndex) => (
                                  <Badge key={`${question.id}-topic-${topicIndex}-${topic}`} variant="outline" className="text-xs">
                                    <Tag className="h-3 w-3 mr-1" />
                                    {topic}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <TestTube className="h-3 w-3" />
                                {question.testCaseCount} test cases
                              </span>
                              <span>
                                Time: {question.timeLimitSeconds || 2}s
                              </span>
                              <span>
                                Memory: {question.memoryLimitMb || 256}MB
                              </span>
                            </div>
                          </div>

                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddQuestion(question);
                            }}
                            disabled={isLoading}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add
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
              </ScrollArea>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Question Details Dialog */}
      {selectedQuestion && (
        <Dialog open={!!selectedQuestion} onOpenChange={() => setSelectedQuestion(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedQuestion.title}</DialogTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge 
                  variant="outline" 
                  className={getDifficultyColor(selectedQuestion.difficulty)}
                >
                  {selectedQuestion.difficulty}
                </Badge>
                <Badge variant="secondary">{selectedQuestion.points} points</Badge>
              </div>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Description</h4>
                <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {selectedQuestion.description}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-semibold">Time Limit:</span>{' '}
                  {selectedQuestion.timeLimitSeconds || 2} seconds
                </div>
                <div>
                  <span className="font-semibold">Memory Limit:</span>{' '}
                  {selectedQuestion.memoryLimitMb || 256} MB
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
                  <h4 className="font-semibold mb-2">Topics</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedQuestion.topics.map((topic, idx) => (
                      <Badge key={`selected-topic-${idx}-${topic}`} variant="outline">
                        <Tag className="h-3 w-3 mr-1" />
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Sample Test Cases */}
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <TestTube className="h-4 w-4" />
                  Sample Test Cases
                </h4>
                {loadingTestCases ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : selectedTestCases.length > 0 ? (
                  <div className="space-y-3">
                    {selectedTestCases.map((testCase, idx) => (
                      <Card key={testCase.id} className="border-2">
                        <CardContent className="p-3">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-semibold">Example {idx + 1}</span>
                              <Badge variant="outline" className="text-xs">{testCase.points} points</Badge>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground mb-1">Input:</p>
                              <pre className="bg-muted/50 p-2 rounded text-xs font-mono overflow-x-auto border whitespace-pre-wrap">
                                {testCase.input.replace(/\\n/g, '\n')}
                              </pre>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground mb-1">Expected Output:</p>
                              <pre className="bg-muted/50 p-2 rounded text-xs font-mono overflow-x-auto border whitespace-pre-wrap">
                                {testCase.expectedOutput.replace(/\\n/g, '\n')}
                              </pre>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No sample test cases available</p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setSelectedQuestion(null)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    handleAddQuestion(selectedQuestion);
                    setSelectedQuestion(null);
                  }}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  Add to Contest
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
