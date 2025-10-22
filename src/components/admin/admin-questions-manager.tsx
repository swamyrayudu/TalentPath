"use client";
import React from 'react';
import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Search, Loader2, Upload, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import Papa from "papaparse";

import {
  getAdminQuestions,
  getAllTopics,
  getAllAdminTestCases,
  bulkImportQuestions,
  bulkImportTestCases,
  getAdminQuestionsStats,
  type AdminQuestion,
  type AdminTestCase,
} from "@/actions/admin-questions.actions";

export function AdminQuestionsManager() {
  const [activeTab, setActiveTab] = useState("questions");
  
  // Questions state
  const [questions, setQuestions] = useState<AdminQuestion[]>([]);
  const [questionPage, setQuestionPage] = useState(1);
  const [hasMoreQuestions, setHasMoreQuestions] = useState(true);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<"all" | "EASY" | "MEDIUM" | "HARD">("all");
  const [selectedTopic, setSelectedTopic] = useState<string>("all");
  const [topics, setTopics] = useState<string[]>([]);
  
  // Test cases state
  const [testCases, setTestCases] = useState<AdminTestCase[]>([]);
  const [testCasePage, setTestCasePage] = useState(1);
  const [hasMoreTestCases, setHasMoreTestCases] = useState(true);
  const [loadingTestCases, setLoadingTestCases] = useState(false);
  const [testCaseSearch, setTestCaseSearch] = useState("");
  
  // Stats state
  const [stats, setStats] = useState<{
    total: number;
    byDifficulty: { EASY: number; MEDIUM: number; HARD: number };
    byTopic: Record<string, number>;
    totalTestCases: number;
  } | null>(null);
  
  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    success: number;
    failed: number;
    errors: string[];
  } | null>(null);

  // Infinite scroll observers
  const questionsObserver = useRef<IntersectionObserver | null>(null);
  const testCasesObserver = useRef<IntersectionObserver | null>(null);
  const questionsEndRef = useRef<HTMLDivElement>(null);
  const testCasesEndRef = useRef<HTMLDivElement>(null);

  // Load stats on mount
  useEffect(() => {
    loadStats();
  }, []);

  // Load topics
  useEffect(() => {
    loadTopics();
  }, []);

  // Load questions when filters change
  useEffect(() => {
    setQuestionPage(1);
    setQuestions([]);
    setHasMoreQuestions(true);
  }, [searchQuery, selectedDifficulty, selectedTopic]);

  // Load test cases when search changes
  useEffect(() => {
    setTestCasePage(1);
    setTestCases([]);
    setHasMoreTestCases(true);
  }, [testCaseSearch]);

  // Load questions
  useEffect(() => {
    if (activeTab === "questions" && hasMoreQuestions && !loadingQuestions) {
      loadQuestions();
    }
  }, [activeTab, questionPage, searchQuery, selectedDifficulty, selectedTopic]);

  // Load test cases
  useEffect(() => {
    if (activeTab === "testcases" && hasMoreTestCases && !loadingTestCases) {
      loadTestCases();
    }
  }, [activeTab, testCasePage, testCaseSearch]);

  // Infinite scroll for questions
  useEffect(() => {
    if (loadingQuestions) return;

    if (questionsObserver.current) questionsObserver.current.disconnect();

    questionsObserver.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMoreQuestions && !loadingQuestions) {
        setQuestionPage((prev) => prev + 1);
      }
    });

    if (questionsEndRef.current) {
      questionsObserver.current.observe(questionsEndRef.current);
    }

    return () => {
      if (questionsObserver.current) {
        questionsObserver.current.disconnect();
      }
    };
  }, [hasMoreQuestions, loadingQuestions]);

  // Infinite scroll for test cases
  useEffect(() => {
    if (loadingTestCases) return;

    if (testCasesObserver.current) testCasesObserver.current.disconnect();

    testCasesObserver.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMoreTestCases && !loadingTestCases) {
        setTestCasePage((prev) => prev + 1);
      }
    });

    if (testCasesEndRef.current) {
      testCasesObserver.current.observe(testCasesEndRef.current);
    }

    return () => {
      if (testCasesObserver.current) {
        testCasesObserver.current.disconnect();
      }
    };
  }, [hasMoreTestCases, loadingTestCases]);

  const loadStats = async () => {
    try {
      const data = await getAdminQuestionsStats();
      setStats(data);
    } catch (error) {
      console.error("Failed to load stats:", error);
    }
  };

  const loadTopics = async () => {
    try {
      const data = await getAllTopics();
      setTopics(data);
    } catch (error) {
      console.error("Failed to load topics:", error);
    }
  };

  const loadQuestions = async () => {
    if (loadingQuestions) return;
    
    setLoadingQuestions(true);
    try {
      const response = await getAdminQuestions({
        page: questionPage,
        limit: 20,
        search: searchQuery,
        difficulty: selectedDifficulty,
        topic: selectedTopic,
        isActive: true,
      });

      if (questionPage === 1) {
        setQuestions(response.questions);
      } else {
        setQuestions((prev) => [...prev, ...response.questions]);
      }
      
      setHasMoreQuestions(response.hasMore);
    } catch (error) {
      console.error("Failed to load questions:", error);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const loadTestCases = async () => {
    if (loadingTestCases) return;
    
    setLoadingTestCases(true);
    try {
      const response = await getAllAdminTestCases({
        page: testCasePage,
        limit: 50,
        search: testCaseSearch,
      });

      if (testCasePage === 1) {
        setTestCases(response.testCases);
      } else {
        setTestCases((prev) => [...prev, ...response.testCases]);
      }
      
      setHasMoreTestCases(response.hasMore);
    } catch (error) {
      console.error("Failed to load test cases:", error);
    } finally {
      setLoadingTestCases(false);
    }
  };

  const handleQuestionsCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadResult(null);

    Papa.parse(file, {
      header: true,
      complete: async (results) => {
        try {
          const parsedQuestions = (results.data as Array<Record<string, unknown>>)
            .filter((row) => row.title)
            .map((row) => ({
              title: (row.title as string)?.trim(),
              description: (row.description as string)?.trim() || "",
              difficulty: ((row.difficulty as string)?.toUpperCase() as "EASY" | "MEDIUM" | "HARD") || "MEDIUM",
              points: parseInt(row.points as string) || 100,
              timeLimitSeconds: parseInt(row.timeLimitSeconds as string) || 2,
              memoryLimitMb: parseInt(row.memoryLimitMb as string) || 256,
              topics: (row.topics as string) ? (row.topics as string).split(",").map((t: string) => t.trim()) : [],
              isActive: (row.isActive as string) !== "false",
            }));

          const result = await bulkImportQuestions(parsedQuestions);
          setUploadResult(result);
          
          // Refresh questions and stats
          setQuestionPage(1);
          setQuestions([]);
          setHasMoreQuestions(true);
          loadStats();
          loadTopics();
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          setUploadResult({
            success: 0,
            failed: results.data.length,
            errors: [errorMessage],
          });
        } finally {
          setUploading(false);
        }
      },
      error: (error) => {
        console.error("CSV parsing error:", error);
        setUploading(false);
      },
    });
  };

  const handleTestCasesCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadResult(null);

    Papa.parse(file, {
      header: true,
      complete: async (results) => {
        try {
          const parsedTestCases = (results.data as Array<Record<string, unknown>>)
            .filter((row) => row.questionTitle)
            .map((row) => ({
              questionTitle: (row.questionTitle as string)?.trim(),
              input: (row.input as string)?.trim() || "",
              expectedOutput: (row.expectedOutput as string)?.trim() || "",
              isSample: (row.isSample as string) === "true" || (row.isSample as string) === "1",
              isHidden: (row.isHidden as string) === "true" || (row.isHidden as string) === "1",
              points: parseInt(row.points as string) || 10,
            }));

          const result = await bulkImportTestCases(parsedTestCases);
          setUploadResult(result);
          
          // Refresh test cases and stats
          setTestCasePage(1);
          setTestCases([]);
          setHasMoreTestCases(true);
          loadStats();
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          setUploadResult({
            success: 0,
            failed: results.data.length,
            errors: [errorMessage],
          });
        } finally {
          setUploading(false);
        }
      },
      error: (error) => {
        console.error("CSV parsing error:", error);
        setUploading(false);
      },
    });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "EASY":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "MEDIUM":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "HARD":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Questions</CardDescription>
              <CardTitle className="text-3xl">{stats.total}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Easy / Medium / Hard</CardDescription>
              <CardTitle className="text-3xl">
                <span className="text-green-500">{stats.byDifficulty.EASY}</span> /{" "}
                <span className="text-yellow-500">{stats.byDifficulty.MEDIUM}</span> /{" "}
                <span className="text-red-500">{stats.byDifficulty.HARD}</span>
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Test Cases</CardDescription>
              <CardTitle className="text-3xl">{stats.totalTestCases}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Unique Topics</CardDescription>
              <CardTitle className="text-3xl">{Object.keys(stats.byTopic).length}</CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="questions">Questions ({stats?.total || 0})</TabsTrigger>
          <TabsTrigger value="testcases">Test Cases ({stats?.totalTestCases || 0})</TabsTrigger>
          <TabsTrigger value="import">Import CSV</TabsTrigger>
        </TabsList>

        <TabsContent value="questions" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search questions by title or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={selectedDifficulty} onValueChange={(value: string) => setSelectedDifficulty(value as "all" | "EASY" | "MEDIUM" | "HARD")}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Difficulties</SelectItem>
                <SelectItem value="EASY">Easy</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HARD">Hard</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedTopic} onValueChange={setSelectedTopic}>
              <SelectTrigger className="w-full md:w-[200px]">
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

          {/* Questions List with Infinite Scroll */}
          <ScrollArea className="h-[600px] rounded-md border">
            <div className="p-4 space-y-3">
              {questions.map((question, qIndex) => (
                <Card key={`${question.id}-${qIndex}`} className="overflow-hidden">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{question.title}</CardTitle>
                        <CardDescription className="mt-2 line-clamp-2">
                          {question.description}
                        </CardDescription>
                      </div>
                      <Badge className={getDifficultyColor(question.difficulty)}>
                        {question.difficulty}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {question.topics.map((topic, tIndex) => (
                        <Badge key={`${question.id}-topic-${tIndex}-${topic}`} variant="outline" className="text-xs">
                          {topic}
                        </Badge>
                      ))}
                    </div>
                    <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{question.points} points</span>
                      <span>•</span>
                      <span>{question.timeLimitSeconds}s</span>
                      <span>•</span>
                      <span>{question.memoryLimitMb}MB</span>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Loading indicator */}
              {loadingQuestions && (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}

              {/* Intersection observer target */}
              <div ref={questionsEndRef} className="h-4" />

              {/* No more results */}
              {!hasMoreQuestions && questions.length > 0 && (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  No more questions
                </div>
              )}

              {/* No results */}
              {!loadingQuestions && questions.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No questions found
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="testcases" className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search test cases by question title..."
              value={testCaseSearch}
              onChange={(e) => setTestCaseSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Test Cases List with Infinite Scroll */}
          <ScrollArea className="h-[600px] rounded-md border">
            <div className="p-4 space-y-3">
              {testCases.map((testCase, tcIndex) => (
                <Card key={`${testCase.id}-${tcIndex}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base">{testCase.questionTitle}</CardTitle>
                      <div className="flex gap-2">
                        {testCase.isSample && (
                          <Badge variant="outline" className="bg-blue-500/10 text-blue-500">
                            Sample
                          </Badge>
                        )}
                        {testCase.isHidden && (
                          <Badge variant="outline" className="bg-purple-500/10 text-purple-500">
                            Hidden
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium">Input:</span>
                        <pre className="mt-1 rounded bg-muted p-2 text-xs overflow-x-auto">
                          {testCase.input}
                        </pre>
                      </div>
                      <div>
                        <span className="font-medium">Expected Output:</span>
                        <pre className="mt-1 rounded bg-muted p-2 text-xs overflow-x-auto">
                          {testCase.expectedOutput}
                        </pre>
                      </div>
                      <div className="text-muted-foreground">{testCase.points} points</div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Loading indicator */}
              {loadingTestCases && (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}

              {/* Intersection observer target */}
              <div ref={testCasesEndRef} className="h-4" />

              {/* No more results */}
              {!hasMoreTestCases && testCases.length > 0 && (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  No more test cases
                </div>
              )}

              {/* No results */}
              {!loadingTestCases && testCases.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No test cases found
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="import" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Import Questions from CSV</CardTitle>
              <CardDescription>
                Upload a CSV file with columns: title, description, difficulty, points, timeLimitSeconds,
                memoryLimitMb, topics (comma-separated), isActive
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Input
                  type="file"
                  accept=".csv"
                  onChange={handleQuestionsCSVUpload}
                  disabled={uploading}
                  className="flex-1"
                />
                <Button disabled={uploading}>
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  <span className="ml-2">Upload Questions</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Import Test Cases from CSV</CardTitle>
              <CardDescription>
                Upload a CSV file with columns: questionTitle, input, expectedOutput, isSample, isHidden, points
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Input
                  type="file"
                  accept=".csv"
                  onChange={handleTestCasesCSVUpload}
                  disabled={uploading}
                  className="flex-1"
                />
                <Button disabled={uploading}>
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  <span className="ml-2">Upload Test Cases</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Upload Result */}
          {uploadResult && (
            <Alert variant={uploadResult.failed > 0 ? "destructive" : "default"}>
              {uploadResult.failed === 0 ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : uploadResult.success === 0 ? (
                <XCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>
                <div className="font-medium mb-2">
                  Import completed: {uploadResult.success} successful, {uploadResult.failed} failed
                </div>
                {uploadResult.errors.length > 0 && (
                  <div className="mt-2 max-h-40 overflow-y-auto">
                    <div className="text-sm font-medium mb-1">Errors:</div>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {uploadResult.errors.slice(0, 10).map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                      {uploadResult.errors.length > 10 && (
                        <li>...and {uploadResult.errors.length - 10} more errors</li>
                      )}
                    </ul>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* CSV Format Guide */}
          <Card>
            <CardHeader>
              <CardTitle>CSV Format Guide</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Questions CSV Example:</h4>
                <pre className="bg-muted p-4 rounded text-xs overflow-x-auto">
{`title,description,difficulty,points,timeLimitSeconds,memoryLimitMb,topics,isActive
Two Sum,Find two numbers that sum to target,EASY,100,2,256,"Array,Hash Table",true
Binary Search,Implement binary search algorithm,EASY,100,1,128,"Binary Search,Array",true`}
                </pre>
              </div>
              <div>
                <h4 className="font-medium mb-2">Test Cases CSV Example:</h4>
                <pre className="bg-muted p-4 rounded text-xs overflow-x-auto">
{`questionTitle,input,expectedOutput,isSample,isHidden,points
Two Sum,"[2,7,11,15]\\n9","[0,1]",true,false,10
Two Sum,"[3,2,4]\\n6","[1,2]",false,false,10`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
