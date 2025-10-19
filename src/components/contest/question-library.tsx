'use client';

import { useState, useEffect } from 'react';
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
import { toast } from 'sonner';
import { Search, Plus, Loader2, BookOpen, TestTube } from 'lucide-react';

interface Question {
  id: string;
  title: string;
  description: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  points: number;
  timeLimitSeconds: number | null;
  memoryLimitMb: number | null;
  testCaseCount: number;
  usageCount: number;
  createdAt: Date;
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
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);

  useEffect(() => {
    if (open) {
      loadQuestions();
    }
  }, [open]);

  useEffect(() => {
    filterQuestions();
  }, [searchQuery, difficultyFilter, questions]);

  const loadQuestions = async () => {
    setIsLoading(true);
    try {
      const result = await getAllQuestionsFromLibrary();
      if (result.success && result.data) {
        setQuestions(result.data);
        setFilteredQuestions(result.data);
      } else {
        toast.error('Failed to load questions');
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const filterQuestions = () => {
    let filtered = [...questions];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (q) =>
          q.title.toLowerCase().includes(query) ||
          q.description.toLowerCase().includes(query)
      );
    }

    // Difficulty filter
    if (difficultyFilter !== 'all') {
      filtered = filtered.filter((q) => q.difficulty === difficultyFilter);
    }

    setFilteredQuestions(filtered);
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
            <div className="flex gap-3">
              <div className="flex-1 relative">
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
            </div>

            {/* Questions List */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredQuestions.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">
                  {questions.length === 0
                    ? 'No questions in library yet'
                    : 'No questions match your filters'}
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-3">
                  {filteredQuestions.map((question) => (
                    <Card
                      key={question.id}
                      className="hover:border-primary/50 transition-colors cursor-pointer"
                      onClick={() => setSelectedQuestion(question)}
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
                              <span>
                                Used {question.usageCount}x
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
                  <span className="font-semibold">Times Used:</span>{' '}
                  {selectedQuestion.usageCount}
                </div>
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
