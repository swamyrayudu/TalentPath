'use client';
import React from 'react';
import { useState, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Play, Loader2, Send, CheckCircle2, XCircle, Clock, Trophy, Award, ArrowLeft, AlertTriangle, X } from 'lucide-react';
import { submitSolution, runTestCases } from '@/actions/contest.actions';
import { toast } from 'sonner';
import Link from 'next/link';
// import { useRouter } from 'next/navigation'; // Unused

const LANGUAGES = [
  { 
    value: 'python', 
    label: 'Python', 
    default: '# Write your solution here\n\ndef solution():\n    pass\n\nif __name__ == "__main__":\n    solution()' 
  },
  { 
    value: 'javascript', 
    label: 'JavaScript', 
    default: '// Write your solution here\n\nfunction solution() {\n    \n}\n\nsolution();' 
  },
  { 
    value: 'java', 
    label: 'Java', 
    default: 'import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // Write your solution here\n        sc.close();\n    }\n}' 
  },
  { 
    value: 'cpp', 
    label: 'C++', 
    default: '#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your solution here\n    return 0;\n}' 
  },
];

interface Submission {
  id: string;
  timestamp: number;
  code: string;
  language: string;
  verdict: string;
  score: number;
  passedTestCases: number;
  totalTestCases: number;
  executionTimeMs?: number;
  errorMessage?: string;
}

interface Contest {
  id: string;
  slug: string;
  endTime: string | Date;
}
interface Question {
  id: string;
  title: string;
  description: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  points: number;
  timeLimitSeconds: number;
  memoryLimitMb: number;
}
interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  points: number;
}
interface TestResult {
  passed: boolean;
  actual: string;
  expected: string;
  error?: string;
}

export function ProblemSolver({ contest, question, sampleTestCases, userId }: {
  contest: Contest;
  question: Question;
  sampleTestCases: TestCase[];
  userId: string;
}) {
  // const router = useRouter(); // Unused
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState(LANGUAGES[0].default);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  // const [submissionResult, setSubmissionResult] = useState<Submission | null>(null); // Unused
  const [allSubmissions, setAllSubmissions] = useState<Submission[]>([]);
  const [activeTab, setActiveTab] = useState<'description' | 'submissions'>('description');
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  // const editorRef = useRef<typeof Editor | null>(null); // Unused
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isContestEnded, setIsContestEnded] = useState(() => {
    // Check if contest has already ended on mount
    const now = new Date().getTime();
    const end = new Date(contest.endTime).getTime();
    return now > end;
  });
  
  // Resizable test results panel
  const [testPanelHeight, setTestPanelHeight] = useState(300);
  const [isResizing, setIsResizing] = useState(false);
  const testPanelRef = useRef<HTMLDivElement>(null);
  const mobileDetailsRef = useRef<HTMLDetailsElement>(null);

  // Load submissions from localStorage on mount
  useEffect(() => {
    const storageKey = `submissions_${contest.id}_${question.id}_${userId}`;
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const submissions: Submission[] = JSON.parse(stored);
        setAllSubmissions(submissions);
      } catch (error) {
        console.error('Failed to parse stored submissions:', error instanceof Error ? error.message : String(error));
      }
    }
  }, [contest.id, question.id, userId]);

  // Save submissions to localStorage whenever they change
  useEffect(() => {
    if (allSubmissions.length > 0) {
      const storageKey = `submissions_${contest.id}_${question.id}_${userId}`;
      localStorage.setItem(storageKey, JSON.stringify(allSubmissions));
    }
  }, [allSubmissions, contest.id, question.id, userId]);

  // Auto-open mobile details panel when switching to submissions tab
  useEffect(() => {
    if (activeTab === 'submissions' && mobileDetailsRef.current && window.innerWidth < 1024) {
      mobileDetailsRef.current.open = true;
      // Scroll to the submissions section
      setTimeout(() => {
        mobileDetailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [activeTab]);

  // Contest timer
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const end = new Date(contest.endTime).getTime();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft('Contest Ended');
        setIsContestEnded(true);
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [contest.endTime]);

  // Handle resizing of test results panel
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !testPanelRef.current) return;
      
      const container = testPanelRef.current.parentElement;
      if (!container) return;
      
      const containerRect = container.getBoundingClientRect();
      const newHeight = containerRect.bottom - e.clientY;
      
      // Min 150px, Max 80% of container height
      const minHeight = 150;
      const maxHeight = containerRect.height * 0.8;
      
      setTestPanelHeight(Math.min(Math.max(newHeight, minHeight), maxHeight));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'ns-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    const langConfig = LANGUAGES.find(l => l.value === newLang);
    if (langConfig) {
      setCode(langConfig.default);
    }
  };

  const handleRunTests = async () => {
    if (isContestEnded) {
      toast.error('Contest has ended. You can no longer run tests.');
      return;
    }

    if (!code.trim()) {
      toast.error('Please write some code first!');
      return;
    }

    setIsRunning(true);
    setTestResults([]);

    try {
      const result = await runTestCases({
        questionId: question.id,
        code,
        language,
        testCaseIds: sampleTestCases.map((tc: TestCase) => tc.id),
      });

      if (result.success && result.data) {
        setTestResults(result.data as TestResult[]);
        const passed = (result.data as TestResult[]).filter((r) => r.passed).length;
        if (passed === (result.data as TestResult[]).length) {
          toast.success(`All ${passed} test cases passed! 🎉`);
        } else {
          toast.warning(`${passed}/${(result.data as TestResult[]).length} test cases passed`);
        }
      } else {
        toast.error(result.error || 'Failed to run tests');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = () => {
    if (isContestEnded) {
      toast.error('Contest has ended. You can no longer submit solutions.');
      return;
    }

    if (!code.trim()) {
      toast.error('Please write some code first!');
      return;
    }
    setShowSubmitDialog(true);
  };

  const confirmSubmit = async () => {
    setShowSubmitDialog(false);
    setIsSubmitting(true);
  // setSubmissionResult(null); // Removed unused

    try {
      const result = await submitSolution({
        contestId: contest.id,
        questionId: question.id,
        code,
        language,
      });

      if (result.success && result.data) {
  // setSubmissionResult(result.data); // Removed unused
        
        // Create submission object
        const newSubmission: Submission = {
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          code,
          language,
          verdict: result.data.verdict,
          score: result.data.score,
          passedTestCases: result.data.passedTestCases,
          totalTestCases: result.data.totalTestCases,
          executionTimeMs: result.data.executionTimeMs || undefined,
          errorMessage: result.data.errorMessage || undefined,
        };

        // Add to submissions list (newest first)
        setAllSubmissions((prev) => [newSubmission, ...prev]);

        // Switch to submissions tab
        setActiveTab('submissions');

        if (result.data.verdict === 'accepted') {
          toast.success(`🎉 Accepted! Score: ${result.data.score}/${question.points}`);
        } else {
          const verdictText = result.data.verdict.replace(/_/g, ' ').toUpperCase();
          toast.error(`${verdictText}`);
        }
      } else {
        toast.error(result.error || 'Submission failed');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY': return 'bg-green-500';
      case 'MEDIUM': return 'bg-yellow-500';
      case 'HARD': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="border-b bg-background px-3 lg:px-6 py-2 lg:py-3 shrink-0 sticky top-0 z-10">
        <div className="flex items-center justify-between gap-2 lg:gap-4 flex-wrap">
          <div className="flex items-center gap-2 lg:gap-4 flex-1 min-w-0">
            <Link href={`/contest/${contest.slug}`}>
              <Button variant="ghost" size="sm" className="h-8 lg:h-9 px-2 lg:px-3">
                <ArrowLeft className="h-3 w-3 lg:h-4 lg:w-4 lg:mr-2" />
                <span className="hidden lg:inline">Back</span>
              </Button>
            </Link>
            <div className="h-6 w-px bg-border hidden lg:block" />
            <div className="flex items-center gap-2 flex-wrap min-w-0 flex-1">
              <h1 className="text-sm lg:text-xl font-bold truncate">{question.title}</h1>
              <Badge className={`${getDifficultyColor(question.difficulty)} text-[10px] lg:text-xs px-1 lg:px-2`}>
                {question.difficulty}
              </Badge>
              <div className="flex items-center gap-1 text-xs lg:text-sm">
                <Trophy className="h-3 w-3 lg:h-4 lg:w-4 text-primary" />
                <span className="font-medium">{question.points}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 lg:gap-4 shrink-0 flex-wrap w-full lg:w-auto">
            <div className="flex items-center gap-1 lg:gap-2 text-xs lg:text-sm order-1 lg:order-none">
              <Clock className="h-3 w-3 lg:h-4 lg:w-4 text-orange-500" />
              <span className="font-mono font-bold text-xs lg:text-sm">{timeLeft}</span>
            </div>

            <Select value={language} onValueChange={handleLanguageChange}>
              <SelectTrigger className="w-[100px] lg:w-[180px] h-8 lg:h-9 text-xs lg:text-sm order-2 lg:order-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value} className="text-xs lg:text-sm">
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              onClick={handleRunTests} 
              disabled={isRunning || isSubmitting || isContestEnded}
              size="sm"
              className="h-8 lg:h-9 text-xs lg:text-sm px-2 lg:px-3 order-3 lg:order-none"
            >
              {isRunning ? (
                <Loader2 className="h-3 w-3 lg:h-4 lg:w-4 lg:mr-2 animate-spin" />
              ) : (
                <Play className="h-3 w-3 lg:h-4 lg:w-4 lg:mr-2" />
              )}
              <span className="hidden sm:inline">Run</span>
            </Button>

            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting || isRunning || isContestEnded}
              size="sm"
              className="bg-primary hover:bg-primary/90 h-8 lg:h-9 text-xs lg:text-sm px-2 lg:px-3 order-4 lg:order-none"
            >
              {isSubmitting ? (
                <Loader2 className="h-3 w-3 lg:h-4 lg:w-4 lg:mr-2 animate-spin" />
              ) : (
                <Send className="h-3 w-3 lg:h-4 lg:w-4 lg:mr-2" />
              )}
              <span className="hidden sm:inline">Submit</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Contest Ended Banner */}
      {isContestEnded && (
        <div className="bg-red-500/10 border-b border-red-500/20 px-6 py-3">
          <p className="text-red-600 dark:text-red-400 font-medium text-center flex items-center justify-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Contest has ended. You can view solutions but cannot submit or run tests.
          </p>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:grid lg:grid-cols-2 lg:divide-x min-h-0">
        {/* Left Panel - Problem Description - Desktop Only */}
        <div className="hidden lg:flex flex-col h-full overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 lg:p-6 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800">
            <Tabs value={activeTab} onValueChange={v => setActiveTab(v as 'description' | 'submissions')} className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="description">Description</TabsTrigger>
                <TabsTrigger value="submissions">
                  Submissions
                  {allSubmissions.length > 0 && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {allSubmissions.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="description" className="space-y-6 mt-0">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Problem Statement</h3>
                  <div className="prose dark:prose-invert max-w-none">
                    <pre className="whitespace-pre-wrap text-sm bg-muted/50 p-4 rounded-lg border">
                      {question.description}
                    </pre>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Sample Test Cases</h3>
                  <div className="space-y-4">
                    {sampleTestCases.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No sample test cases available</p>
                    ) : (
                      <>
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                          <p className="text-xs text-blue-700 dark:text-blue-300">
                            <strong>Automatic Input Processing:</strong> Arrays like <code className="bg-blue-500/20 px-1 rounded">[1,2,3]</code> are automatically converted to space-separated format <code className="bg-blue-500/20 px-1 rounded">1 2 3</code>. 
                            Just use <code className="bg-blue-500/20 px-1 rounded">input().split()</code> in Python or <code className="bg-blue-500/20 px-1 rounded">Scanner</code> in Java. No manual parsing needed!
                          </p>
                        </div>
                        {sampleTestCases.map((testCase: TestCase, index: number) => (
                          <Card key={testCase.id} className="border-2">
                            <CardHeader className="pb-3">
                              <CardTitle className="text-sm flex items-center justify-between">
                                <span>Example {index + 1}</span>
                                <Badge variant="outline">{testCase.points} points</Badge>
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
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
                            </CardContent>
                          </Card>
                        ))}
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Constraints</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li>Time Limit: {question.timeLimitSeconds} second(s)</li>
                    <li>Memory Limit: {question.memoryLimitMb} MB</li>
                  </ul>
                </div>
              </TabsContent>

              <TabsContent value="submissions" className="space-y-4 mt-0">
                {allSubmissions.length === 0 ? (
                  <Card>
                    <CardContent className="py-16 text-center">
                      <Send className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">No submissions yet. Submit your solution to see results.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Submission History</h3>
                      <Badge variant="outline">{allSubmissions.length} submission{allSubmissions.length !== 1 ? 's' : ''}</Badge>
                    </div>

                    {allSubmissions.map((submission, index) => {
                      const isLatest = index === 0;
                      const submissionDate = new Date(submission.timestamp);
                      
                      return (
                        <Card 
                          key={submission.id}
                          className={`${
                            submission.verdict === 'accepted' 
                              ? 'border-green-500 border-2' 
                              : 'border-red-500 border-2'
                          } ${isLatest ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
                        >
                          <CardHeader>
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div className="flex items-center gap-2">
                                <CardTitle className="text-sm">
                                  {isLatest && <Badge variant="secondary" className="mr-2">Latest</Badge>}
                                  Submission #{allSubmissions.length - index}
                                </CardTitle>
                              </div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant="outline" className="text-xs">
                                  {submission.language.toUpperCase()}
                                </Badge>
                                <Badge 
                                  variant={submission.verdict === 'accepted' ? 'default' : 'destructive'}
                                  className="font-semibold"
                                >
                                  {submission.verdict === 'accepted' ? (
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                  ) : (
                                    <XCircle className="h-3 w-3 mr-1" />
                                  )}
                                  {submission.verdict.replace(/_/g, ' ').toUpperCase()}
                                </Badge>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {submissionDate.toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                              })}
                            </p>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground mb-1">Score</p>
                                <p className="font-bold text-lg">
                                  {submission.score} / {question.points}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground mb-1">Test Cases</p>
                                <p className="font-bold text-lg">
                                  {submission.passedTestCases} / {submission.totalTestCases}
                                </p>
                              </div>
                            </div>

                            {submission.executionTimeMs && (
                              <div className="text-sm">
                                <p className="text-muted-foreground mb-1">Execution Time</p>
                                <p className="font-mono">{submission.executionTimeMs}ms</p>
                              </div>
                            )}

                            {submission.errorMessage && (
                              <div>
                                <p className="text-sm font-medium text-red-500 mb-2">Error Message:</p>
                                <pre className="bg-red-50 dark:bg-red-950 p-3 rounded text-xs overflow-x-auto text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 max-h-32">
                                  {submission.errorMessage}
                                </pre>
                              </div>
                            )}

                            {submission.verdict === 'accepted' && (
                              <div className="bg-green-50 dark:bg-green-950 p-4 rounded border border-green-200 dark:border-green-800">
                                <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                                  <Award className="h-5 w-5" />
                                  <p className="font-semibold">Congratulations! Your solution has been accepted!</p>
                                </div>
                              </div>
                            )}

                            {/* Code Preview */}
                            <details className="mt-4">
                              <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
                                View Code
                              </summary>
                              <pre className="mt-2 bg-muted p-3 rounded text-xs overflow-x-auto border max-h-64">
                                {submission.code}
                              </pre>
                            </details>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Mobile Problem Description - Collapsible */}
        <div className="lg:hidden block border-b">
          <details ref={mobileDetailsRef} className="group">
            <summary className="cursor-pointer p-4 flex items-center justify-between bg-muted/50 hover:bg-muted transition-colors">
              <span className="font-semibold">📖 View Problem</span>
              <span className="text-xs text-muted-foreground group-open:hidden">Tap to expand</span>
              <span className="text-xs text-muted-foreground hidden group-open:inline">Tap to collapse</span>
            </summary>
            <div className="max-h-[50vh] overflow-y-auto p-4 bg-background">
              <Tabs value={activeTab} onValueChange={v => setActiveTab(v as 'description' | 'submissions')} className="w-full">
                <TabsList className="mb-4 w-full">
                  <TabsTrigger value="description" className="flex-1">Description</TabsTrigger>
                  <TabsTrigger value="submissions" className="flex-1">
                    Submissions
                    {allSubmissions.length > 0 && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {allSubmissions.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="description" className="space-y-4 mt-0">
                  <div>
                    <h3 className="text-base font-semibold mb-2">Problem Statement</h3>
                    <div className="prose dark:prose-invert max-w-none">
                      <pre className="whitespace-pre-wrap text-xs bg-muted/50 p-3 rounded-lg border">
                        {question.description}
                      </pre>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-semibold mb-2">Sample Test Cases</h3>
                    <div className="space-y-3">
                      {sampleTestCases.length === 0 ? (
                        <p className="text-xs text-muted-foreground">No sample test cases available</p>
                      ) : (
                        <>
                          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-2">
                            <p className="text-[10px] text-blue-700 dark:text-blue-300">
                              Arrays are auto-converted to space-separated format
                            </p>
                          </div>
                          {sampleTestCases.map((testCase: TestCase, index: number) => (
                            <Card key={testCase.id} className="border-2">
                              <CardHeader className="pb-2 p-3">
                                <CardTitle className="text-xs flex items-center justify-between">
                                  <span>Example {index + 1}</span>
                                  <Badge variant="outline" className="text-[10px]">{testCase.points} pts</Badge>
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-2 p-3 pt-0">
                                <div>
                                  <p className="text-[10px] font-semibold text-muted-foreground mb-1">Input:</p>
                                  <pre className="bg-muted/50 p-2 rounded text-[10px] font-mono overflow-x-auto border whitespace-pre-wrap">
                                    {testCase.input.replace(/\\n/g, '\n')}
                                  </pre>
                                </div>
                                <div>
                                  <p className="text-[10px] font-semibold text-muted-foreground mb-1">Expected Output:</p>
                                  <pre className="bg-muted/50 p-2 rounded text-[10px] font-mono overflow-x-auto border whitespace-pre-wrap">
                                    {testCase.expectedOutput.replace(/\\n/g, '\n')}
                                  </pre>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-semibold mb-2">Constraints</h3>
                    <ul className="list-disc list-inside space-y-1 text-xs text-muted-foreground">
                      <li>Time Limit: {question.timeLimitSeconds} second(s)</li>
                      <li>Memory Limit: {question.memoryLimitMb} MB</li>
                    </ul>
                  </div>
                </TabsContent>

                <TabsContent value="submissions" className="space-y-3 mt-0">
                  {allSubmissions.length === 0 ? (
                    <Card>
                      <CardContent className="py-8 text-center">
                        <Send className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">No submissions yet</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      {allSubmissions.slice(0, 3).map((submission, index) => {
                        const isLatest = index === 0;
                        // const submissionDate = new Date(submission.timestamp); // Unused
                        
                        return (
                          <Card 
                            key={submission.id}
                            className={`${
                              submission.verdict === 'accepted' 
                                ? 'border-green-500 border-2' 
                                : 'border-red-500 border-2'
                            } ${isLatest ? 'ring-1 ring-blue-500' : ''}`}
                          >
                            <CardHeader className="p-3 pb-2">
                              <div className="flex items-center justify-between flex-wrap gap-1">
                                <CardTitle className="text-xs flex items-center gap-1">
                                  {isLatest && <Badge variant="secondary" className="text-[10px] px-1">Latest</Badge>}
                                  #{allSubmissions.length - index}
                                </CardTitle>
                                <Badge 
                                  variant={submission.verdict === 'accepted' ? 'default' : 'destructive'}
                                  className="text-[10px] px-1"
                                >
                                  {submission.verdict === 'accepted' ? (
                                    <CheckCircle2 className="h-2 w-2 mr-0.5" />
                                  ) : (
                                    <XCircle className="h-2 w-2 mr-0.5" />
                                  )}
                                  {submission.verdict.replace(/_/g, ' ').toUpperCase()}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent className="p-3 pt-0 space-y-2">
                              <div className="grid grid-cols-2 gap-2 text-[10px]">
                                <div>
                                  <p className="text-muted-foreground">Score</p>
                                  <p className="font-bold text-sm">{submission.score}/{question.points}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Tests</p>
                                  <p className="font-bold text-sm">{submission.passedTestCases}/{submission.totalTestCases}</p>
                                </div>
                              </div>
                              
                              {/* Error message for failed submissions */}
                              {submission.verdict !== 'accepted' && submission.errorMessage && (
                                <div className="mt-2 pt-2 border-t border-red-200 dark:border-red-800">
                                  <p className="text-[9px] font-semibold text-red-600 dark:text-red-400 mb-1">Error:</p>
                                  <pre className="bg-red-100 dark:bg-red-900/30 p-1.5 rounded text-[9px] font-mono overflow-x-auto border border-red-300 dark:border-red-700 whitespace-pre-wrap break-all max-h-20 line-clamp-3">
                                    {submission.errorMessage}
                                  </pre>
                                </div>
                              )}
                              
                              {/* Success message */}
                              {submission.verdict === 'accepted' && (
                                <div className="mt-2 pt-2 border-t border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20 -mx-3 -mb-3 px-3 pb-3 rounded-b">
                                  <p className="text-[9px] text-green-700 dark:text-green-300 flex items-center gap-1">
                                    <CheckCircle2 className="h-2.5 w-2.5" />
                                    Accepted!
                                  </p>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </details>
        </div>

        {/* Right Panel - Code Editor */}
        <div className="flex flex-col h-full overflow-hidden flex-1">
          <div className="flex-1 min-h-0 overflow-hidden">
            <Editor
              height="100%"
              language={language}
              value={code}
              onChange={(value) => setCode(value || '')}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 4,
                wordWrap: 'on',
              }}
            />
          </div>

          {/* Test Results Panel - Resizable */}
          {testResults.length > 0 && (
            <div 
              ref={testPanelRef}
              className="border-t bg-background shrink-0 flex flex-col relative"
              style={{ height: `${testPanelHeight}px` }}
            >
              {/* Resize Handle */}
              <div 
                className="absolute top-0 left-0 right-0 h-1 cursor-ns-resize hover:bg-blue-500 transition-colors z-10 group hidden lg:block"
                onMouseDown={() => setIsResizing(true)}
              >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-gray-400 dark:bg-gray-600 rounded-full group-hover:bg-blue-500 transition-colors" />
              </div>

              <div className="p-2 lg:p-4 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800">
                <div className="flex items-center justify-between mb-2 lg:mb-3">
                  <h3 className="text-xs lg:text-sm font-semibold flex items-center gap-2">
                    <Award className="h-3 w-3 lg:h-4 lg:w-4" />
                    Test Results ({testResults.filter(r => r.passed).length}/{testResults.length} Passed)
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setTestResults([])}
                    className="h-6 w-6 lg:h-7 lg:w-7 p-0 hover:bg-destructive/10 hover:text-destructive"
                    title="Close test results"
                  >
                    <X className="h-3 w-3 lg:h-4 lg:w-4" />
                  </Button>
                </div>
              <div className="space-y-2">
                {testResults.map((result: TestResult, index: number) => (
                  <Card 
                    key={index} 
                    className={`border-2 ${result.passed ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : 'border-red-500 bg-red-50 dark:bg-red-950/20'}`}
                  >
                    <CardContent className="p-2 lg:p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs lg:text-sm font-medium">Test Case {index + 1}</span>
                        <div className="flex items-center gap-1 lg:gap-2">
                          {result.passed ? (
                            <>
                              <CheckCircle2 className="h-3 w-3 lg:h-4 lg:w-4 text-green-500" />
                              <Badge variant="outline" className="text-[10px] lg:text-xs text-green-700 border-green-500 bg-green-100 dark:bg-green-900 px-1 lg:px-2">
                                Passed
                              </Badge>
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3 lg:h-4 lg:w-4 text-red-500" />
                              <Badge variant="outline" className="text-[10px] lg:text-xs text-red-700 border-red-500 bg-red-100 dark:bg-red-900 px-1 lg:px-2">
                                Failed
                              </Badge>
                            </>
                          )}
                        </div>
                      </div>
                      
                      {/* Show output for PASSED tests with green styling */}
                      {result.passed && (
                        <div className="space-y-2 text-[10px] lg:text-xs mt-2 lg:mt-3">
                          <div>
                            <p className="text-green-700 dark:text-green-300 font-semibold mb-1">Output:</p>
                            <pre className="bg-green-50 dark:bg-green-950/30 p-1.5 lg:p-2 rounded font-mono overflow-x-auto border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 text-[10px] lg:text-xs whitespace-pre-wrap break-all">{result.actual}</pre>
                          </div>
                          <div>
                            <p className="text-muted-foreground font-semibold mb-1">Expected:</p>
                            <pre className="bg-muted/50 p-1.5 lg:p-2 rounded font-mono overflow-x-auto border text-[10px] lg:text-xs whitespace-pre-wrap break-all">{result.expected}</pre>
                          </div>
                        </div>
                      )}
                      
                      {/* Show output for FAILED tests with red styling */}
                      {!result.passed && (
                        <div className="space-y-2 text-[10px] lg:text-xs mt-2 lg:mt-3">
                          {result.error && result.error.includes('Runtime Error') && (
                            <div className="bg-red-100 dark:bg-red-900/30 p-1.5 lg:p-2 rounded border border-red-300 dark:border-red-700">
                              <p className="text-red-700 dark:text-red-300 font-semibold mb-1">Runtime Error</p>
                              <pre className="text-red-600 dark:text-red-400 whitespace-pre-wrap text-[10px] break-all">{result.actual}</pre>
                            </div>
                          )}
                          {result.error && result.error.includes('Timeout') && (
                            <div className="bg-orange-100 dark:bg-orange-900/30 p-1.5 lg:p-2 rounded border border-orange-300 dark:border-orange-700">
                              <p className="text-orange-700 dark:text-orange-300 font-semibold mb-1">Timeout</p>
                              <pre className="text-orange-600 dark:text-orange-400 whitespace-pre-wrap text-[10px] break-all">{result.actual}</pre>
                            </div>
                          )}
                          {!result.error || (!result.error.includes('Runtime Error') && !result.error.includes('Timeout')) && (
                            <>
                              <div>
                                <p className="text-muted-foreground font-semibold mb-1">Expected:</p>
                                <pre className="bg-muted p-1.5 lg:p-2 rounded font-mono overflow-x-auto border text-[10px] lg:text-xs whitespace-pre-wrap break-all">{result.expected}</pre>
                              </div>
                              <div>
                                <p className="text-red-700 dark:text-red-300 font-semibold mb-1">Got:</p>
                                <pre className="bg-red-50 dark:bg-red-950/30 p-1.5 lg:p-2 rounded font-mono overflow-x-auto border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-[10px] lg:text-xs whitespace-pre-wrap break-all">{result.actual}</pre>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Confirm Submission
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to submit your solution? This will be evaluated against all test cases and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
