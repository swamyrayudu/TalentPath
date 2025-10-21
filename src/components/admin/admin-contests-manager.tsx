"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Search, 
  Loader2, 
  Plus, 
  Calendar, 
  Users, 
  Trophy, 
  Settings, 
  Trash2,
  Edit,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { getAllContests, createContest, deleteContest } from "@/actions/contest.actions";
import { 
  getAdminQuestions, 
  getAdminTestCases,
  createAdminQuestion,
  createAdminTestCase,
  updateAdminQuestion,
  deleteAdminQuestion,
  updateAdminTestCase,
  deleteAdminTestCase,
  type AdminQuestion,
  type AdminTestCase 
} from "@/actions/admin-questions.actions";
import { format } from "date-fns";
import { toast } from "sonner";

interface Contest {
  id: string;
  title: string;
  description: string;
  slug: string;
  startTime: Date;
  endTime: Date;
  isPublic: boolean;
  maxParticipants: number | null;
  createdBy: string;
  createdAt: Date;
  _count?: {
    questions: number;
    registrations: number;
  };
}

interface ContestStats {
  totalContests: number;
  activeContests: number;
  upcomingContests: number;
  completedContests: number;
  totalParticipants: number;
}

export function AdminContestsManager() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("contests");
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contestToDelete, setContestToDelete] = useState<Contest | null>(null);
  const [creatingContest, setCreatingContest] = useState(false);
  const [deletingContest, setDeletingContest] = useState(false);

  // Questions management state
  const [questions, setQuestions] = useState<AdminQuestion[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<AdminQuestion | null>(null);
  const [testCases, setTestCases] = useState<AdminTestCase[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [loadingTestCases, setLoadingTestCases] = useState(false);
  const [questionSearch, setQuestionSearch] = useState("");
  const [questionsPage, setQuestionsPage] = useState(1);
  const [hasMoreQuestions, setHasMoreQuestions] = useState(true);
  const [testCasesPage, setTestCasesPage] = useState(1);
  const [hasMoreTestCases, setHasMoreTestCases] = useState(true);
  
  // Edit/Delete dialogs
  const [editQuestionDialog, setEditQuestionDialog] = useState(false);
  const [deleteQuestionDialog, setDeleteQuestionDialog] = useState(false);
  const [questionToEdit, setQuestionToEdit] = useState<AdminQuestion | null>(null);
  const [questionToDelete, setQuestionToDelete] = useState<AdminQuestion | null>(null);
  const [editTestCaseDialog, setEditTestCaseDialog] = useState(false);
  const [deleteTestCaseDialog, setDeleteTestCaseDialog] = useState(false);
  const [testCaseToEdit, setTestCaseToEdit] = useState<AdminTestCase | null>(null);
  const [testCaseToDelete, setTestCaseToDelete] = useState<AdminTestCase | null>(null);
  const [savingQuestion, setSavingQuestion] = useState(false);
  const [savingTestCase, setSavingTestCase] = useState(false);

  // Create dialogs
  const [createQuestionDialog, setCreateQuestionDialog] = useState(false);
  const [newQuestion, setNewQuestion] = useState<Partial<AdminQuestion>>({
    title: "",
    description: "",
    difficulty: "MEDIUM",
    points: 10,
    timeLimitSeconds: 2,
    memoryLimitMb: 256,
    topics: [],
    isActive: true,
  });
  const [creatingQuestion, setCreatingQuestion] = useState(false);

  const [createTestCaseDialog, setCreateTestCaseDialog] = useState(false);
  const [newTestCase, setNewTestCase] = useState<Partial<AdminTestCase>>({
    questionTitle: "",
    input: "",
    expectedOutput: "",
    points: 10,
    isSample: false,
    isHidden: false,
  });
  const [creatingTestCase, setCreatingTestCase] = useState(false);

  // Stats
  const [stats, setStats] = useState<ContestStats>({
    totalContests: 0,
    activeContests: 0,
    upcomingContests: 0,
    completedContests: 0,
    totalParticipants: 0,
  });

  // Form state
  const [newContest, setNewContest] = useState({
    title: "",
    description: "",
    slug: "",
    startTime: "",
    endTime: "",
    isPublic: true,
    maxParticipants: "",
  });

  useEffect(() => {
    loadContests();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [contests]);

  useEffect(() => {
    if (activeTab === "questions") {
      loadQuestions();
    }
  }, [activeTab]);

  const loadContests = async () => {
    setLoading(true);
    try {
      const result = await getAllContests();
      if (result.success && result.data) {
        setContests(result.data as Contest[]);
      } else {
        toast.error("Failed to load contests");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to load contests");
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const now = new Date();
    const active = contests.filter(
      (c) => new Date(c.startTime) <= now && new Date(c.endTime) >= now
    ).length;
    const upcoming = contests.filter((c) => new Date(c.startTime) > now).length;
    const completed = contests.filter((c) => new Date(c.endTime) < now).length;
    const totalParticipants = contests.reduce(
      (sum, c) => sum + (c._count?.registrations || 0),
      0
    );

    setStats({
      totalContests: contests.length,
      activeContests: active,
      upcomingContests: upcoming,
      completedContests: completed,
      totalParticipants,
    });
  };

  const loadQuestions = async () => {
    setLoadingQuestions(true);
    try {
      const result = await getAdminQuestions({
        page: 1,
        limit: 20,
        isActive: true,
      });
      console.log("Questions loaded:", result); // Debug log
      setQuestions(result.questions || []);
      setHasMoreQuestions(result.hasMore);
      setQuestionsPage(1);
    } catch (error: any) {
      console.error("Error loading questions:", error); // Debug log
      toast.error(error.message || "Failed to load questions");
      setQuestions([]);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const loadMoreQuestions = async () => {
    if (loadingQuestions || !hasMoreQuestions) return;
    
    setLoadingQuestions(true);
    try {
      const nextPage = questionsPage + 1;
      const result = await getAdminQuestions({
        page: nextPage,
        limit: 20,
        isActive: true,
      });
      setQuestions((prev) => [...prev, ...(result.questions || [])]);
      setHasMoreQuestions(result.hasMore);
      setQuestionsPage(nextPage);
    } catch (error: any) {
      console.error("Error loading more questions:", error);
      toast.error(error.message || "Failed to load more questions");
    } finally {
      setLoadingQuestions(false);
    }
  };

  const loadTestCasesForQuestion = async (questionTitle: string) => {
    setLoadingTestCases(true);
    try {
      console.log("Loading test cases for question:", questionTitle);
      const result = await getAdminTestCases(questionTitle);
      console.log("Test cases loaded:", result);
      setTestCases(result || []);
    } catch (error: any) {
      console.error("Error loading test cases:", error);
      toast.error(error.message || "Failed to load test cases");
      setTestCases([]);
    } finally {
      setLoadingTestCases(false);
    }
  };

  const handleQuestionSelect = async (question: AdminQuestion) => {
    console.log("Question selected:", question);
    setSelectedQuestion(question);
    setTestCases([]); // Clear previous test cases
    setTestCasesPage(1);
    setHasMoreTestCases(true);
    await loadTestCasesForQuestion(question.title);
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const bottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 50;
    
    if (bottom && hasMoreQuestions && !loadingQuestions) {
      loadMoreQuestions();
    }
  };

  const handleEditQuestion = (question: AdminQuestion) => {
    setQuestionToEdit({ ...question }); // Create a copy
    setEditQuestionDialog(true);
  };

  const handleDeleteQuestion = (question: AdminQuestion) => {
    setQuestionToDelete(question);
    setDeleteQuestionDialog(true);
  };

  const handleSaveQuestion = async () => {
    if (!questionToEdit) return;

    setSavingQuestion(true);
    try {
      const updatedQuestion = await updateAdminQuestion(questionToEdit.id, {
        // Don't include title - it's immutable
        description: questionToEdit.description,
        difficulty: questionToEdit.difficulty,
        points: questionToEdit.points,
        timeLimitSeconds: questionToEdit.timeLimitSeconds,
        memoryLimitMb: questionToEdit.memoryLimitMb,
        topics: questionToEdit.topics || [],
        isActive: questionToEdit.isActive,
      });
      toast.success("Question updated successfully!");
      setEditQuestionDialog(false);
      setQuestionToEdit(null);
      await loadQuestions();
      
      // If this was the selected question, update it
      if (selectedQuestion?.id === questionToEdit.id) {
        setSelectedQuestion(updatedQuestion);
      }
    } catch (error: any) {
      console.error("Error updating question:", error);
      toast.error(error.message || "Failed to update question");
    } finally {
      setSavingQuestion(false);
    }
  };

  const handleCreateQuestion = async () => {
    if (!newQuestion.title?.trim()) {
      toast.error("Question title is required");
      return;
    }
    if (!newQuestion.description?.trim()) {
      toast.error("Question description is required");
      return;
    }

    setCreatingQuestion(true);
    try {
      await createAdminQuestion({
        title: newQuestion.title,
        description: newQuestion.description || "",
        difficulty: newQuestion.difficulty || "MEDIUM",
        points: newQuestion.points || 10,
        timeLimitSeconds: newQuestion.timeLimitSeconds || 2,
        memoryLimitMb: newQuestion.memoryLimitMb || 256,
        topics: newQuestion.topics || [],
        isActive: newQuestion.isActive ?? true,
        createdBy: "", // Will be set by the server action
      });
      toast.success("Question created successfully!");
      setCreateQuestionDialog(false);
      setNewQuestion({
        title: "",
        description: "",
        difficulty: "MEDIUM",
        points: 10,
        timeLimitSeconds: 2,
        memoryLimitMb: 256,
        topics: [],
        isActive: true,
      });
      await loadQuestions();
    } catch (error: any) {
      console.error("Error creating question:", error);
      toast.error(error.message || "Failed to create question");
    } finally {
      setCreatingQuestion(false);
    }
  };

  const handleCreateTestCase = async () => {
    if (!newTestCase.questionTitle?.trim()) {
      toast.error("Question title is required");
      return;
    }
    if (!newTestCase.input?.trim()) {
      toast.error("Test case input is required");
      return;
    }
    if (!newTestCase.expectedOutput?.trim()) {
      toast.error("Expected output is required");
      return;
    }

    setCreatingTestCase(true);
    try {
      await createAdminTestCase({
        questionTitle: newTestCase.questionTitle,
        input: newTestCase.input || "",
        expectedOutput: newTestCase.expectedOutput || "",
        points: newTestCase.points || 10,
        isSample: newTestCase.isSample || false,
        isHidden: newTestCase.isHidden || false,
      });
      toast.success("Test case created successfully!");
      setCreateTestCaseDialog(false);
      setNewTestCase({
        questionTitle: "",
        input: "",
        expectedOutput: "",
        points: 10,
        isSample: false,
        isHidden: false,
      });
      
      // Reload test cases if we're viewing this question
      if (selectedQuestion && selectedQuestion.title === newTestCase.questionTitle) {
        await loadTestCasesForQuestion(newTestCase.questionTitle);
      }
    } catch (error: any) {
      console.error("Error creating test case:", error);
      toast.error(error.message || "Failed to create test case");
    } finally {
      setCreatingTestCase(false);
    }
  };

  const handleConfirmDeleteQuestion = async () => {
    if (!questionToDelete) return;

    setSavingQuestion(true);
    try {
      await deleteAdminQuestion(questionToDelete.id);
      toast.success("Question deleted successfully!");
      setDeleteQuestionDialog(false);
      setQuestionToDelete(null);
      loadQuestions();
      if (selectedQuestion?.id === questionToDelete.id) {
        setSelectedQuestion(null);
        setTestCases([]);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to delete question");
    } finally {
      setSavingQuestion(false);
    }
  };

  const handleEditTestCase = (testCase: AdminTestCase) => {
    setTestCaseToEdit(testCase);
    setEditTestCaseDialog(true);
  };

  const handleDeleteTestCase = (testCase: AdminTestCase) => {
    setTestCaseToDelete(testCase);
    setDeleteTestCaseDialog(true);
  };

  const handleSaveTestCase = async () => {
    if (!testCaseToEdit) return;

    setSavingTestCase(true);
    try {
      await updateAdminTestCase(testCaseToEdit.id, {
        input: testCaseToEdit.input,
        expectedOutput: testCaseToEdit.expectedOutput,
        isSample: testCaseToEdit.isSample,
        isHidden: testCaseToEdit.isHidden,
        points: testCaseToEdit.points,
      });
      toast.success("Test case updated successfully!");
      setEditTestCaseDialog(false);
      setTestCaseToEdit(null);
      if (selectedQuestion) {
        loadTestCasesForQuestion(selectedQuestion.title);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update test case");
    } finally {
      setSavingTestCase(false);
    }
  };

  const handleConfirmDeleteTestCase = async () => {
    if (!testCaseToDelete) return;

    setSavingTestCase(true);
    try {
      await deleteAdminTestCase(testCaseToDelete.id);
      toast.success("Test case deleted successfully!");
      setDeleteTestCaseDialog(false);
      setTestCaseToDelete(null);
      if (selectedQuestion) {
        loadTestCasesForQuestion(selectedQuestion.title);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to delete test case");
    } finally {
      setSavingTestCase(false);
    }
  };

  const handleCreateContest = async () => {
    if (!newContest.title || !newContest.slug || !newContest.startTime || !newContest.endTime) {
      toast.error("Please fill in all required fields");
      return;
    }

    setCreatingContest(true);
    try {
      const result = await createContest({
        title: newContest.title,
        description: newContest.description,
        slug: newContest.slug,
        startTime: new Date(newContest.startTime),
        endTime: new Date(newContest.endTime),
        isPublic: newContest.isPublic,
        maxParticipants: newContest.maxParticipants ? parseInt(newContest.maxParticipants) : null,
      });

      if (result.success) {
        toast.success("Contest created successfully!");
        setCreateDialogOpen(false);
        setNewContest({
          title: "",
          description: "",
          slug: "",
          startTime: "",
          endTime: "",
          isPublic: true,
          maxParticipants: "",
        });
        loadContests();
      } else {
        toast.error(result.error || "Failed to create contest");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to create contest");
    } finally {
      setCreatingContest(false);
    }
  };

  const handleDeleteContest = async () => {
    if (!contestToDelete) return;

    setDeletingContest(true);
    try {
      const result = await deleteContest(contestToDelete.id);
      if (result.success) {
        toast.success("Contest deleted successfully!");
        setDeleteDialogOpen(false);
        setContestToDelete(null);
        loadContests();
      } else {
        toast.error(result.error || "Failed to delete contest");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to delete contest");
    } finally {
      setDeletingContest(false);
    }
  };

  const getContestStatus = (contest: Contest) => {
    const now = new Date();
    const start = new Date(contest.startTime);
    const end = new Date(contest.endTime);

    if (now < start) return "upcoming";
    if (now > end) return "completed";
    return "active";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Active
          </Badge>
        );
      case "upcoming":
        return (
          <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">
            <Calendar className="h-3 w-3 mr-1" />
            Upcoming
          </Badge>
        );
      case "completed":
        return (
          <Badge className="bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20">
            <XCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      default:
        return null;
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const filteredContests = contests.filter(
    (contest) =>
      contest.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contest.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contest.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Contests</CardDescription>
            <CardTitle className="text-3xl">{stats.totalContests}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Active</CardDescription>
            <CardTitle className="text-3xl text-green-600">{stats.activeContests}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Upcoming</CardDescription>
            <CardTitle className="text-3xl text-blue-600">{stats.upcomingContests}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Completed</CardDescription>
            <CardTitle className="text-3xl text-gray-600">{stats.completedContests}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Participants</CardDescription>
            <CardTitle className="text-3xl">{stats.totalParticipants}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="contests">All Contests ({stats.totalContests})</TabsTrigger>
          <TabsTrigger value="questions">Manage Questions</TabsTrigger>
          <TabsTrigger value="create">Create New Contest</TabsTrigger>
        </TabsList>

        <TabsContent value="contests" className="space-y-4">
          {/* Search and Create Button */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search contests by title, description, or slug..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Contest
            </Button>
          </div>

          {/* Contests List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredContests.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Trophy className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">
                  {searchQuery ? "No contests match your search" : "No contests yet. Create your first contest!"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="h-[600px] rounded-md border">
              <div className="p-4 space-y-3">
                {filteredContests.map((contest) => {
                  const status = getContestStatus(contest);
                  return (
                    <Card key={contest.id} className="overflow-hidden hover:border-primary/50 transition-colors">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <CardTitle className="text-lg">{contest.title}</CardTitle>
                              {getStatusBadge(status)}
                              {contest.isPublic ? (
                                <Badge variant="outline" className="text-xs">Public</Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs">Private</Badge>
                              )}
                            </div>
                            <CardDescription className="line-clamp-2">
                              {contest.description || "No description"}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Slug:</span>
                              <div className="font-mono text-xs">{contest.slug}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Questions:</span>
                              <div className="font-medium">{contest._count?.questions || 0}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Participants:</span>
                              <div className="font-medium">{contest._count?.registrations || 0}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Max Participants:</span>
                              <div className="font-medium">{contest.maxParticipants || "Unlimited"}</div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Start:</span>
                              <div className="font-medium">
                                {format(new Date(contest.startTime), "MMM dd, yyyy HH:mm")}
                              </div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">End:</span>
                              <div className="font-medium">
                                {format(new Date(contest.endTime), "MMM dd, yyyy HH:mm")}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 pt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => router.push(`/contest/${contest.slug}/manage`)}
                            >
                              <Settings className="h-4 w-4 mr-1" />
                              Manage
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => router.push(`/contest/${contest.slug}`)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-destructive hover:text-destructive"
                              onClick={() => {
                                setContestToDelete(contest);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        <TabsContent value="questions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Database Questions & Test Cases</CardTitle>
              <CardDescription>
                View all questions from the database with their associated test cases
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Search Bar */}
              <div className="mb-4 flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search questions by title..."
                    value={questionSearch}
                    onChange={(e) => setQuestionSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Button onClick={() => setCreateQuestionDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Question
                </Button>
                <Button
                  onClick={() => {
                    if (selectedQuestion) {
                      setNewTestCase({ ...newTestCase, questionTitle: selectedQuestion.title });
                    }
                    setCreateTestCaseDialog(true);
                  }}
                  variant="outline"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Test Case
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Questions List */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-lg">Questions ({questions.length})</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadQuestions}
                      disabled={loadingQuestions}
                    >
                      {loadingQuestions ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Refresh"
                      )}
                    </Button>
                  </div>
                  {loadingQuestions && questions.length === 0 ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : questions.length === 0 ? (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <p className="text-muted-foreground">No questions found</p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-4"
                          onClick={loadQuestions}
                        >
                          Retry
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="h-[600px] rounded-md border overflow-auto" onScroll={handleScroll}>
                      <div className="p-3 space-y-2">
                        {questions
                          .filter((q) =>
                            questionSearch
                              ? q.title.toLowerCase().includes(questionSearch.toLowerCase())
                              : true
                          )
                          .map((question) => (
                            <Card
                              key={question.id}
                              className={`transition-colors hover:border-primary ${
                                selectedQuestion?.id === question.id
                                  ? "border-primary bg-primary/5"
                                  : ""
                              }`}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between mb-2">
                                  <h4 
                                    className="font-medium text-sm line-clamp-2 cursor-pointer flex-1"
                                    onClick={() => handleQuestionSelect(question)}
                                  >
                                    {question.title}
                                  </h4>
                                  <div className="flex items-center gap-2 ml-2">
                                    <Badge
                                      variant={
                                        question.difficulty === "EASY"
                                          ? "default"
                                          : question.difficulty === "MEDIUM"
                                          ? "secondary"
                                          : "destructive"
                                      }
                                      className="shrink-0"
                                    >
                                      {question.difficulty}
                                    </Badge>
                                  </div>
                                </div>
                                <div 
                                  className="flex flex-wrap gap-1 mb-2 cursor-pointer"
                                  onClick={() => handleQuestionSelect(question)}
                                >
                                  {question.topics?.slice(0, 3).map((topic, idx) => (
                                    <Badge
                                      key={`${question.id}-topic-${idx}`}
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {topic}
                                    </Badge>
                                  ))}
                                  {question.topics && question.topics.length > 3 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{question.topics.length - 3}
                                    </Badge>
                                  )}
                                </div>
                                <div 
                                  className="text-xs text-muted-foreground space-y-1 mb-2 cursor-pointer"
                                  onClick={() => handleQuestionSelect(question)}
                                >
                                  <div className="flex items-center justify-between">
                                    <span>Points: {question.points}</span>
                                    <span>
                                      Time: {question.timeLimitSeconds}s | Memory:{" "}
                                      {question.memoryLimitMb}MB
                                    </span>
                                  </div>
                                </div>
                                <div className="flex gap-2 pt-2 border-t">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditQuestion(question);
                                    }}
                                  >
                                    <Edit className="h-3 w-3 mr-1" />
                                    Edit
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-destructive hover:text-destructive"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteQuestion(question);
                                    }}
                                  >
                                    <Trash2 className="h-3 w-3 mr-1" />
                                    Delete
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        {loadingQuestions && questions.length > 0 && (
                          <div className="flex items-center justify-center py-4">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            <span className="ml-2 text-sm text-muted-foreground">Loading more...</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Test Cases Panel */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg mb-3">
                    Test Cases{" "}
                    {selectedQuestion && `(${testCases.length})`}
                  </h3>
                  {!selectedQuestion ? (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <Trophy className="h-12 w-12 text-muted-foreground mb-3" />
                        <p className="text-muted-foreground">
                          Select a question to view its test cases
                        </p>
                      </CardContent>
                    </Card>
                  ) : loadingTestCases ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : testCases.length === 0 ? (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <p className="text-muted-foreground mb-2">No test cases found</p>
                        {selectedQuestion && (
                          <p className="text-xs text-muted-foreground">
                            for &quot;{selectedQuestion.title}&quot;
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ) : (
                    <ScrollArea className="h-[600px] rounded-md border p-3">
                      <div className="space-y-3">
                        <div className="mb-3 p-3 bg-muted rounded-md">
                          <h4 className="font-semibold text-sm mb-1">
                            {selectedQuestion.title}
                          </h4>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {selectedQuestion.description}
                          </p>
                        </div>
                        {testCases.map((testCase, idx) => (
                          <Card key={testCase.id}>
                            <CardHeader className="pb-3">
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-sm">
                                  Test Case #{idx + 1}
                                </CardTitle>
                                <div className="flex gap-2">
                                  {testCase.isSample && (
                                    <Badge
                                      variant="default"
                                      className="text-xs bg-green-500/10 text-green-600 border-green-500/20"
                                    >
                                      <Eye className="h-3 w-3 mr-1" />
                                      Sample
                                    </Badge>
                                  )}
                                  {testCase.isHidden && (
                                    <Badge
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      <EyeOff className="h-3 w-3 mr-1" />
                                      Hidden
                                    </Badge>
                                  )}
                                  <Badge variant="outline" className="text-xs">
                                    {testCase.points} pts
                                  </Badge>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">
                                  Input:
                                </Label>
                                <div className="bg-muted p-2 rounded-md">
                                  <pre className="text-xs font-mono whitespace-pre-wrap break-all">
                                    {testCase.input || "(empty)"}
                                  </pre>
                                </div>
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">
                                  Expected Output:
                                </Label>
                                <div className="bg-muted p-2 rounded-md">
                                  <pre className="text-xs font-mono whitespace-pre-wrap break-all">
                                    {testCase.expectedOutput || "(empty)"}
                                  </pre>
                                </div>
                              </div>
                              <div className="flex gap-2 pt-2 border-t">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1"
                                  onClick={() => handleEditTestCase(testCase)}
                                >
                                  <Edit className="h-3 w-3 mr-1" />
                                  Edit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => handleDeleteTestCase(testCase)}
                                >
                                  <Trash2 className="h-3 w-3 mr-1" />
                                  Delete
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create New Contest</CardTitle>
              <CardDescription>
                Fill in the details below to create a new coding contest.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Contest Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Spring Coding Challenge 2024"
                  value={newContest.title}
                  onChange={(e) => {
                    setNewContest({ ...newContest, title: e.target.value });
                    if (!newContest.slug) {
                      setNewContest({
                        ...newContest,
                        title: e.target.value,
                        slug: generateSlug(e.target.value),
                      });
                    }
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Contest Slug (URL) *</Label>
                <Input
                  id="slug"
                  placeholder="e.g., spring-challenge-2024"
                  value={newContest.slug}
                  onChange={(e) => setNewContest({ ...newContest, slug: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  This will be used in the URL: /contest/{newContest.slug || "your-slug"}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your contest..."
                  value={newContest.description}
                  onChange={(e) => setNewContest({ ...newContest, description: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time *</Label>
                  <Input
                    id="startTime"
                    type="datetime-local"
                    value={newContest.startTime}
                    onChange={(e) => setNewContest({ ...newContest, startTime: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time *</Label>
                  <Input
                    id="endTime"
                    type="datetime-local"
                    value={newContest.endTime}
                    onChange={(e) => setNewContest({ ...newContest, endTime: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxParticipants">Max Participants (optional)</Label>
                <Input
                  id="maxParticipants"
                  type="number"
                  placeholder="Leave empty for unlimited"
                  value={newContest.maxParticipants}
                  onChange={(e) => setNewContest({ ...newContest, maxParticipants: e.target.value })}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={newContest.isPublic}
                  onChange={(e) => setNewContest({ ...newContest, isPublic: e.target.checked })}
                  className="h-4 w-4"
                />
                <Label htmlFor="isPublic">Make this contest public</Label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setNewContest({
                      title: "",
                      description: "",
                      slug: "",
                      startTime: "",
                      endTime: "",
                      isPublic: true,
                      maxParticipants: "",
                    });
                  }}
                >
                  Reset
                </Button>
                <Button onClick={handleCreateContest} disabled={creatingContest}>
                  {creatingContest ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  Create Contest
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Contest Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Contest</DialogTitle>
            <DialogDescription>
              Fill in the details to create a new coding contest.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="dialog-title">Contest Title *</Label>
              <Input
                id="dialog-title"
                placeholder="e.g., Spring Coding Challenge 2024"
                value={newContest.title}
                onChange={(e) => {
                  setNewContest({ ...newContest, title: e.target.value });
                  if (!newContest.slug) {
                    setNewContest({
                      ...newContest,
                      title: e.target.value,
                      slug: generateSlug(e.target.value),
                    });
                  }
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dialog-slug">Contest Slug (URL) *</Label>
              <Input
                id="dialog-slug"
                placeholder="e.g., spring-challenge-2024"
                value={newContest.slug}
                onChange={(e) => setNewContest({ ...newContest, slug: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dialog-description">Description</Label>
              <Textarea
                id="dialog-description"
                placeholder="Describe your contest..."
                value={newContest.description}
                onChange={(e) => setNewContest({ ...newContest, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dialog-startTime">Start Time *</Label>
                <Input
                  id="dialog-startTime"
                  type="datetime-local"
                  value={newContest.startTime}
                  onChange={(e) => setNewContest({ ...newContest, startTime: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dialog-endTime">End Time *</Label>
                <Input
                  id="dialog-endTime"
                  type="datetime-local"
                  value={newContest.endTime}
                  onChange={(e) => setNewContest({ ...newContest, endTime: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dialog-maxParticipants">Max Participants</Label>
              <Input
                id="dialog-maxParticipants"
                type="number"
                placeholder="Leave empty for unlimited"
                value={newContest.maxParticipants}
                onChange={(e) => setNewContest({ ...newContest, maxParticipants: e.target.value })}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="dialog-isPublic"
                checked={newContest.isPublic}
                onChange={(e) => setNewContest({ ...newContest, isPublic: e.target.checked })}
                className="h-4 w-4"
              />
              <Label htmlFor="dialog-isPublic">Make this contest public</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateContest} disabled={creatingContest}>
              {creatingContest ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Create Contest
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Contest</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{contestToDelete?.title}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteContest}
              disabled={deletingContest}
            >
              {deletingContest ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Question Dialog */}
      <Dialog open={editQuestionDialog} onOpenChange={setEditQuestionDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Question</DialogTitle>
            <DialogDescription>
              Update the question details below
            </DialogDescription>
          </DialogHeader>
          {questionToEdit && (
            <div className="space-y-4 py-4">
              <Alert className="border-orange-500 bg-orange-50">
                <AlertDescription className="text-orange-900">
                  <strong>Note:</strong> Title cannot be changed once created because test cases reference it. 
                  To change the title, delete this question and create a new one.
                </AlertDescription>
              </Alert>
              <div className="space-y-2">
                <Label htmlFor="edit-title">Title *</Label>
                <Input
                  id="edit-title"
                  value={questionToEdit.title}
                  disabled
                  className="bg-gray-100 cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground">
                  Title is read-only to maintain database integrity
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description *</Label>
                <Textarea
                  id="edit-description"
                  value={questionToEdit.description}
                  onChange={(e) =>
                    setQuestionToEdit({ ...questionToEdit, description: e.target.value })
                  }
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-difficulty">Difficulty</Label>
                  <select
                    id="edit-difficulty"
                    value={questionToEdit.difficulty}
                    onChange={(e) =>
                      setQuestionToEdit({
                        ...questionToEdit,
                        difficulty: e.target.value as "EASY" | "MEDIUM" | "HARD",
                      })
                    }
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-points">Points</Label>
                  <Input
                    id="edit-points"
                    type="number"
                    value={questionToEdit.points}
                    onChange={(e) =>
                      setQuestionToEdit({
                        ...questionToEdit,
                        points: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-time">Time Limit (seconds)</Label>
                  <Input
                    id="edit-time"
                    type="number"
                    value={questionToEdit.timeLimitSeconds}
                    onChange={(e) =>
                      setQuestionToEdit({
                        ...questionToEdit,
                        timeLimitSeconds: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-memory">Memory Limit (MB)</Label>
                  <Input
                    id="edit-memory"
                    type="number"
                    value={questionToEdit.memoryLimitMb}
                    onChange={(e) =>
                      setQuestionToEdit({
                        ...questionToEdit,
                        memoryLimitMb: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditQuestionDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveQuestion} disabled={savingQuestion}>
              {savingQuestion && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Question Dialog */}
      <Dialog open={deleteQuestionDialog} onOpenChange={setDeleteQuestionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Question</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{questionToDelete?.title}&quot;? This will also delete all associated test cases. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteQuestionDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDeleteQuestion}
              disabled={savingQuestion}
            >
              {savingQuestion ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Test Case Dialog */}
      <Dialog open={editTestCaseDialog} onOpenChange={setEditTestCaseDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Test Case</DialogTitle>
            <DialogDescription>
              Update the test case details below
            </DialogDescription>
          </DialogHeader>
          {testCaseToEdit && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-tc-input">Input</Label>
                <Textarea
                  id="edit-tc-input"
                  value={testCaseToEdit.input}
                  onChange={(e) =>
                    setTestCaseToEdit({ ...testCaseToEdit, input: e.target.value })
                  }
                  rows={4}
                  className="font-mono text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-tc-output">Expected Output</Label>
                <Textarea
                  id="edit-tc-output"
                  value={testCaseToEdit.expectedOutput}
                  onChange={(e) =>
                    setTestCaseToEdit({ ...testCaseToEdit, expectedOutput: e.target.value })
                  }
                  rows={4}
                  className="font-mono text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-tc-points">Points</Label>
                <Input
                  id="edit-tc-points"
                  type="number"
                  value={testCaseToEdit.points}
                  onChange={(e) =>
                    setTestCaseToEdit({
                      ...testCaseToEdit,
                      points: parseInt(e.target.value),
                    })
                  }
                />
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="edit-tc-sample"
                    checked={testCaseToEdit.isSample}
                    onChange={(e) =>
                      setTestCaseToEdit({ ...testCaseToEdit, isSample: e.target.checked })
                    }
                    className="h-4 w-4"
                  />
                  <Label htmlFor="edit-tc-sample">Sample Test Case</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="edit-tc-hidden"
                    checked={testCaseToEdit.isHidden}
                    onChange={(e) =>
                      setTestCaseToEdit({ ...testCaseToEdit, isHidden: e.target.checked })
                    }
                    className="h-4 w-4"
                  />
                  <Label htmlFor="edit-tc-hidden">Hidden Test Case</Label>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTestCaseDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTestCase} disabled={savingTestCase}>
              {savingTestCase && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Test Case Dialog */}
      <Dialog open={deleteTestCaseDialog} onOpenChange={setDeleteTestCaseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Test Case</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this test case? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTestCaseDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDeleteTestCase}
              disabled={savingTestCase}
            >
              {savingTestCase ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Question Dialog */}
      <Dialog open={createQuestionDialog} onOpenChange={setCreateQuestionDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Question</DialogTitle>
            <DialogDescription>
              Add a new question to the database
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="new-title">Title *</Label>
              <Input
                id="new-title"
                value={newQuestion.title || ""}
                onChange={(e) => setNewQuestion({ ...newQuestion, title: e.target.value })}
                placeholder="Enter question title"
              />
            </div>
            
            <div>
              <Label htmlFor="new-description">Description *</Label>
              <Textarea
                id="new-description"
                value={newQuestion.description || ""}
                onChange={(e) => setNewQuestion({ ...newQuestion, description: e.target.value })}
                placeholder="Enter question description"
                rows={6}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="new-difficulty">Difficulty</Label>
                <Select
                  value={newQuestion.difficulty || "MEDIUM"}
                  onValueChange={(value) =>
                    setNewQuestion({ ...newQuestion, difficulty: value as any })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EASY">Easy</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HARD">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="new-points">Points</Label>
                <Input
                  id="new-points"
                  type="number"
                  value={newQuestion.points || 10}
                  onChange={(e) =>
                    setNewQuestion({ ...newQuestion, points: parseInt(e.target.value) })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="new-time">Time Limit (seconds)</Label>
                <Input
                  id="new-time"
                  type="number"
                  value={newQuestion.timeLimitSeconds || 2}
                  onChange={(e) =>
                    setNewQuestion({ ...newQuestion, timeLimitSeconds: parseFloat(e.target.value) })
                  }
                />
              </div>

              <div>
                <Label htmlFor="new-memory">Memory Limit (MB)</Label>
                <Input
                  id="new-memory"
                  type="number"
                  value={newQuestion.memoryLimitMb || 256}
                  onChange={(e) =>
                    setNewQuestion({ ...newQuestion, memoryLimitMb: parseInt(e.target.value) })
                  }
                />
              </div>
            </div>

            <div>
              <Label htmlFor="new-topics">Topics (comma-separated)</Label>
              <Input
                id="new-topics"
                value={newQuestion.topics?.join(", ") || ""}
                onChange={(e) =>
                  setNewQuestion({
                    ...newQuestion,
                    topics: e.target.value.split(",").map((t) => t.trim()).filter(Boolean),
                  })
                }
                placeholder="e.g., Arrays, Strings, Dynamic Programming"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="new-active"
                checked={newQuestion.isActive ?? true}
                onChange={(e) =>
                  setNewQuestion({ ...newQuestion, isActive: e.target.checked })
                }
                className="h-4 w-4"
              />
              <Label htmlFor="new-active">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateQuestionDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateQuestion} disabled={creatingQuestion}>
              {creatingQuestion && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Question
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Test Case Dialog */}
      <Dialog open={createTestCaseDialog} onOpenChange={setCreateTestCaseDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Test Case</DialogTitle>
            <DialogDescription>
              Add a new test case for a question
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="new-tc-question">Question Title *</Label>
              <Input
                id="new-tc-question"
                value={newTestCase.questionTitle || ""}
                onChange={(e) =>
                  setNewTestCase({ ...newTestCase, questionTitle: e.target.value })
                }
                placeholder="Enter the exact question title"
              />
              {selectedQuestion && (
                <p className="text-xs text-muted-foreground mt-1">
                  Currently selected: {selectedQuestion.title}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="new-tc-input">Input *</Label>
              <Textarea
                id="new-tc-input"
                value={newTestCase.input || ""}
                onChange={(e) => setNewTestCase({ ...newTestCase, input: e.target.value })}
                placeholder="Enter test case input"
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="new-tc-output">Expected Output *</Label>
              <Textarea
                id="new-tc-output"
                value={newTestCase.expectedOutput || ""}
                onChange={(e) =>
                  setNewTestCase({ ...newTestCase, expectedOutput: e.target.value })
                }
                placeholder="Enter expected output"
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="new-tc-points">Points</Label>
              <Input
                id="new-tc-points"
                type="number"
                value={newTestCase.points || 10}
                onChange={(e) =>
                  setNewTestCase({ ...newTestCase, points: parseInt(e.target.value) })
                }
              />
            </div>

            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="new-tc-sample"
                  checked={newTestCase.isSample || false}
                  onChange={(e) =>
                    setNewTestCase({ ...newTestCase, isSample: e.target.checked })
                  }
                  className="h-4 w-4"
                />
                <Label htmlFor="new-tc-sample">Sample Test Case</Label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="new-tc-hidden"
                  checked={newTestCase.isHidden || false}
                  onChange={(e) =>
                    setNewTestCase({ ...newTestCase, isHidden: e.target.checked })
                  }
                  className="h-4 w-4"
                />
                <Label htmlFor="new-tc-hidden">Hidden Test Case</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateTestCaseDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTestCase} disabled={creatingTestCase}>
              {creatingTestCase && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Test Case
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
