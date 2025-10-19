'use client';

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
import { Play, Loader2, Send, CheckCircle2, XCircle, Clock, Trophy, Award, ArrowLeft, AlertTriangle } from 'lucide-react';
import { submitSolution, runTestCases } from '@/actions/contest.actions';
import { toast } from 'sonner';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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

export function ProblemSolver({ contest, question, sampleTestCases, userId }: any) {
  const router = useRouter();
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState(LANGUAGES[0].default);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [submissionResult, setSubmissionResult] = useState<any>(null);
  const [allSubmissions, setAllSubmissions] = useState<Submission[]>([]);
  const [activeTab, setActiveTab] = useState('description');
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const editorRef = useRef<any>(null);
  const [timeLeft, setTimeLeft] = useState<string>('');

  // Load submissions from localStorage on mount
  useEffect(() => {
    const storageKey = `submissions_${contest.id}_${question.id}_${userId}`;
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const submissions = JSON.parse(stored);
        setAllSubmissions(submissions);
      } catch (error) {
        console.error('Failed to parse stored submissions:', error);
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

  // Contest timer
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const end = new Date(contest.endTime).getTime();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft('Contest Ended');
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

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    const langConfig = LANGUAGES.find(l => l.value === newLang);
    if (langConfig) {
      setCode(langConfig.default);
    }
  };

  const handleRunTests = async () => {
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
        testCaseIds: sampleTestCases.map((tc: any) => tc.id),
      });

      if (result.success && result.data) {
        setTestResults(result.data);
        const passed = result.data.filter((r: any) => r.passed).length;
        if (passed === result.data.length) {
          toast.success(`All ${passed} test cases passed! 🎉`);
        } else {
          toast.warning(`${passed}/${result.data.length} test cases passed`);
        }
      } else {
        toast.error(result.error || 'Failed to run tests');
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = () => {
    if (!code.trim()) {
      toast.error('Please write some code first!');
      return;
    }
    setShowSubmitDialog(true);
  };

  const confirmSubmit = async () => {
    setShowSubmitDialog(false);
    setIsSubmitting(true);
    setSubmissionResult(null);

    try {
      const result = await submitSolution({
        contestId: contest.id,
        questionId: question.id,
        code,
        language,
      });

      if (result.success && result.data) {
        setSubmissionResult(result.data);
        
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
    } catch (error: any) {
      toast.error(error.message);
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
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-background px-6 py-4 shrink-0">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <Link href={`/contest/${contest.slug}`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div className="h-6 w-px bg-border" />
            <h1 className="text-xl font-bold">{question.title}</h1>
            <Badge className={getDifficultyColor(question.difficulty)}>
              {question.difficulty}
            </Badge>
            <div className="flex items-center gap-2 text-sm">
              <Trophy className="h-4 w-4 text-yellow-500" />
              <span className="font-medium">{question.points} points</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4 shrink-0">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-orange-500" />
              <span className="font-mono font-bold">{timeLeft}</span>
            </div>

            <Select value={language} onValueChange={handleLanguageChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              onClick={handleRunTests} 
              disabled={isRunning || isSubmitting}
            >
              {isRunning ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Run Tests
            </Button>

            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting || isRunning}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Submit
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-2 divide-x overflow-hidden">
        {/* Left Panel - Problem Description */}
        <div className="flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
                      sampleTestCases.map((testCase: any, index: number) => (
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
                              <pre className="bg-muted/50 p-2 rounded text-xs font-mono overflow-x-auto border">
                                {testCase.input}
                              </pre>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground mb-1">Expected Output:</p>
                              <pre className="bg-muted/50 p-2 rounded text-xs font-mono overflow-x-auto border">
                                {testCase.expectedOutput}
                              </pre>
                            </div>
                          </CardContent>
                        </Card>
                      ))
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

        {/* Right Panel - Code Editor */}
        <div className="flex flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden">
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

          {/* Test Results Panel */}
          {testResults.length > 0 && (
            <div className="border-t bg-background p-4 max-h-64 overflow-y-auto shrink-0">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Award className="h-4 w-4" />
                Test Results ({testResults.filter(r => r.passed).length}/{testResults.length} Passed)
              </h3>
              <div className="space-y-2">
                {testResults.map((result: any, index: number) => (
                  <Card 
                    key={index} 
                    className={`border-2 ${result.passed ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : 'border-red-500 bg-red-50 dark:bg-red-950/20'}`}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Test Case {index + 1}</span>
                        <div className="flex items-center gap-2">
                          {result.passed ? (
                            <>
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                              <Badge variant="outline" className="text-green-700 border-green-500 bg-green-100 dark:bg-green-900">
                                Passed
                              </Badge>
                            </>
                          ) : (
                            <>
                              <XCircle className="h-4 w-4 text-red-500" />
                              <Badge variant="outline" className="text-red-700 border-red-500 bg-red-100 dark:bg-red-900">
                                Failed
                              </Badge>
                            </>
                          )}
                        </div>
                      </div>
                      {!result.passed && (
                        <div className="space-y-2 text-xs mt-3">
                          {result.error && result.error.includes('Runtime Error') && (
                            <div className="bg-red-100 dark:bg-red-900/30 p-2 rounded border border-red-300 dark:border-red-700">
                              <p className="text-red-700 dark:text-red-300 font-semibold mb-1">⚠️ Runtime Error</p>
                              <pre className="text-red-600 dark:text-red-400 whitespace-pre-wrap text-[10px]">{result.actual}</pre>
                            </div>
                          )}
                          {result.error && result.error.includes('Timeout') && (
                            <div className="bg-orange-100 dark:bg-orange-900/30 p-2 rounded border border-orange-300 dark:border-orange-700">
                              <p className="text-orange-700 dark:text-orange-300 font-semibold mb-1">⏱️ Timeout</p>
                              <pre className="text-orange-600 dark:text-orange-400 whitespace-pre-wrap text-[10px]">{result.actual}</pre>
                            </div>
                          )}
                          {!result.error || (!result.error.includes('Runtime Error') && !result.error.includes('Timeout')) && (
                            <>
                              <div>
                                <p className="text-muted-foreground font-semibold mb-1">Expected:</p>
                                <pre className="bg-muted p-2 rounded font-mono overflow-x-auto border">{result.expected}</pre>
                              </div>
                              <div>
                                <p className="text-muted-foreground font-semibold mb-1">Got:</p>
                                <pre className="bg-muted p-2 rounded font-mono overflow-x-auto border">{result.actual}</pre>
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
