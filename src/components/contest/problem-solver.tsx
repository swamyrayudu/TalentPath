'use client';

import { useState, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Play, Loader2, Send, CheckCircle2, XCircle, Clock, Trophy, Award, ArrowLeft } from 'lucide-react';
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

export function ProblemSolver({ contest, question, sampleTestCases, userId }: any) {
  const router = useRouter();
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState(LANGUAGES[0].default);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [submissionResult, setSubmissionResult] = useState<any>(null);
  const editorRef = useRef<any>(null);
  const [timeLeft, setTimeLeft] = useState<string>('');

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

  const handleSubmit = async () => {
    if (!code.trim()) {
      toast.error('Please write some code first!');
      return;
    }

    if (!confirm('Are you sure you want to submit? This will be evaluated against all test cases.')) {
      return;
    }

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
      <div className="border-b bg-background px-6 py-3">
        <div className="flex items-center justify-between">
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
          
          <div className="flex items-center gap-4">
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
        <div className="overflow-y-auto p-6">
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="submissions">Submissions</TabsTrigger>
            </TabsList>

            <TabsContent value="description" className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Problem Statement</h3>
                <div className="prose dark:prose-invert max-w-none">
                  <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded">
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
                      <Card key={testCase.id}>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm flex items-center justify-between">
                            <span>Example {index + 1}</span>
                            <Badge variant="outline">{testCase.points} points</Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground mb-1">Input:</p>
                            <pre className="bg-muted p-2 rounded text-xs font-mono overflow-x-auto">
                              {testCase.input}
                            </pre>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground mb-1">Expected Output:</p>
                            <pre className="bg-muted p-2 rounded text-xs font-mono overflow-x-auto">
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

            <TabsContent value="submissions" className="space-y-4">
              {submissionResult ? (
                <Card className={submissionResult.verdict === 'accepted' ? 'border-green-500' : 'border-red-500'}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">Latest Submission</CardTitle>
                      <Badge 
                        variant={submissionResult.verdict === 'accepted' ? 'default' : 'destructive'}
                        className="font-semibold"
                      >
                        {submissionResult.verdict === 'accepted' ? (
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                        ) : (
                          <XCircle className="h-3 w-3 mr-1" />
                        )}
                        {submissionResult.verdict.replace(/_/g, ' ').toUpperCase()}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground mb-1">Score</p>
                        <p className="font-bold text-lg">
                          {submissionResult.score} / {question.points}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Test Cases</p>
                        <p className="font-bold text-lg">
                          {submissionResult.passedTestCases} / {submissionResult.totalTestCases}
                        </p>
                      </div>
                    </div>

                    {submissionResult.executionTimeMs && (
                      <div className="text-sm">
                        <p className="text-muted-foreground mb-1">Execution Time</p>
                        <p className="font-mono">{submissionResult.executionTimeMs}ms</p>
                      </div>
                    )}

                    {submissionResult.errorMessage && (
                      <div>
                        <p className="text-sm font-medium text-red-500 mb-2">Error Message:</p>
                        <pre className="bg-red-50 dark:bg-red-950 p-3 rounded text-xs overflow-x-auto text-red-700 dark:text-red-300">
                          {submissionResult.errorMessage}
                        </pre>
                      </div>
                    )}

                    {submissionResult.verdict === 'accepted' && (
                      <div className="bg-green-50 dark:bg-green-950 p-4 rounded border border-green-200 dark:border-green-800">
                        <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                          <Award className="h-5 w-5" />
                          <p className="font-semibold">Congratulations! Your solution has been accepted!</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="py-16 text-center">
                    <p className="text-muted-foreground">No submissions yet. Submit your solution to see results.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Panel - Code Editor */}
        <div className="flex flex-col">
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
            <div className="border-t bg-background p-4 max-h-64 overflow-y-auto">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Award className="h-4 w-4" />
                Test Results ({testResults.filter(r => r.passed).length}/{testResults.length} Passed)
              </h3>
              <div className="space-y-2">
                {testResults.map((result: any, index: number) => (
                  <Card 
                    key={index} 
                    className={`border-2 ${result.passed ? 'border-green-500' : 'border-red-500'}`}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Test Case {index + 1}</span>
                        <div className="flex items-center gap-2">
                          {result.passed ? (
                            <>
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                              <Badge variant="outline" className="text-green-700 border-green-500">
                                Passed
                              </Badge>
                            </>
                          ) : (
                            <>
                              <XCircle className="h-4 w-4 text-red-500" />
                              <Badge variant="outline" className="text-red-700 border-red-500">
                                Failed
                              </Badge>
                            </>
                          )}
                        </div>
                      </div>
                      {!result.passed && (
                        <div className="space-y-1 text-xs">
                          <div>
                            <p className="text-muted-foreground">Expected:</p>
                            <pre className="bg-muted p-1 rounded font-mono">{result.expected}</pre>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Got:</p>
                            <pre className="bg-muted p-1 rounded font-mono">{result.actual}</pre>
                          </div>
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
    </div>
  );
}
