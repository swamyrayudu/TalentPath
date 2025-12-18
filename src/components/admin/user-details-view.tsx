'use client';

import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Shield,
  User,
  CheckCircle2,
  Mail,
  Calendar,
  Clock,
  Activity,
  Code2,
  Brain,
  Map,
  Trophy,
  MessageSquare,
  Users,
  ChevronRight,
  Timer,
} from 'lucide-react';
import { getChatMessagesForConversation } from '@/actions/admin-user-details';

interface UserDetailsData {
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    role: 'user' | 'admin';
    emailVerified: Date | null;
    createdAt: Date | null;
    lastLoginAt: Date | null;
    lastActiveAt: Date | null;
    lastLogoutAt: Date | null;
  };
  timeSpent: {
    totalMinutes: number;
    totalHours: number;
    displayHours: number;
    displayMinutes: number;
    daysSinceJoined: number;
    averageMinutesPerDay: number;
    estimatedSessions: number;
    averageSessionDuration: number;
  };
  dsaSummary: {
    solved: number;
    attempted: number;
    bookmarked: number;
  };
  dsaProgress: Array<{
    problemId: number;
    status: string;
    solvedAt: Date | null;
    language: string | null;
    problemTitle: string | null;
    difficulty: string | null;
    platform: string | null;
  }>;
  aptitudeSummary: {
    totalAttempts: number;
    averageScore: number;
    topicsAttempted: number;
  };
  aptitudeResults: Array<{
    id: string;
    topic: string;
    totalQuestions: number;
    correctAnswers: number;
    score: number;
    timeTaken: number | null;
    completedAt: Date;
  }>;
  roadmapProgress: Array<{
    id: string;
    roadmapId: string;
    completedSteps: string;
    startedAt: Date;
    lastUpdated: Date;
    roadmapTitle: string | null;
    roadmapCategory: string | null;
  }>;
  contestSummary: {
    participated: number;
    totalSubmissions: number;
    bestRank: number | null;
  };
  contestsParticipated: Array<{
    contestId: string;
    joinedAt: Date;
    contestTitle: string | null;
    contestStatus: string | null;
    contestStartTime: Date | null;
    contestEndTime: Date | null;
  }>;
  contestSubmissions: Array<{
    id: string;
    contestId: string;
    questionId: string;
    code: string;
    language: string;
    verdict: string;
    score: number;
    submittedAt: Date;
  }>;
  leaderboardEntries: Array<{
    contestId: string;
    totalScore: number;
    problemsSolved: number;
    rank: number | null;
    contestTitle: string | null;
  }>;
  chatHistory: {
    conversations: Array<{
      id: string;
      title: string | null;
      createdAt: Date;
      updatedAt: Date;
    }>;
    totalMessages: number;
  };
  interviews: Array<{
    id: string;
    type: string;
    status: string;
    difficulty: string | null;
    companyName: string | null;
    duration: number | null;
    score: number | null;
    feedback: string | null;
    createdAt: Date;
    completedAt: Date | null;
    questionsCount: number;
  }>;
}

interface ChatMessage {
  id: string;
  role: string;
  content: string;
  createdAt: Date;
}

export function UserDetailsView({ data }: { data: UserDetailsData }) {
  const { user, timeSpent, dsaSummary, dsaProgress, aptitudeSummary, aptitudeResults, roadmapProgress, 
          contestSummary, leaderboardEntries, chatHistory, interviews } = data;
  
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (date: Date | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getDifficultyColor = (difficulty: string | null) => {
    switch (difficulty?.toUpperCase()) {
      case 'EASY':
        return 'bg-green-500/10 text-green-500';
      case 'MEDIUM':
        return 'bg-yellow-500/10 text-yellow-500';
      case 'HARD':
        return 'bg-red-500/10 text-red-500';
      default:
        return 'bg-gray-500/10 text-gray-500';
    }
  };

  const handleViewConversation = async (conversationId: string) => {
    setIsLoadingMessages(true);
    setSelectedConversation(conversationId);
    try {
      const messages = await getChatMessagesForConversation(conversationId);
      setChatMessages(messages);
    } catch (error) {
      console.error('Failed to load messages:', error);
      setChatMessages([]);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const parseCompletedSteps = (stepsString: string): string[] => {
    try {
      return JSON.parse(stepsString) || [];
    } catch {
      return [];
    }
  };

  return (
    <div className="space-y-6">
      {/* User Profile Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={user.image || ''} alt={user.name || 'User'} />
              <AvatarFallback className="bg-gradient-to-br from-amber-500 to-amber-600 text-white text-2xl">
                {user.name?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">{user.name || 'Unknown User'}</h1>
                <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                  {user.role === 'admin' ? (
                    <>
                      <Shield className="mr-1 h-3 w-3" />
                      Admin
                    </>
                  ) : (
                    <>
                      <User className="mr-1 h-3 w-3" />
                      User
                    </>
                  )}
                </Badge>
                {user.emailVerified && (
                  <Badge variant="outline" className="text-green-500 border-green-500">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Verified
                  </Badge>
                )}
              </div>
              
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  {user.email}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Joined {formatDate(user.createdAt)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Last login: {formatDateTime(user.lastLoginAt)}
                </span>
                <span className="flex items-center gap-1">
                  <Activity className="h-4 w-4" />
                  Last active: {formatDateTime(user.lastActiveAt)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="col-span-1 md:col-span-2 lg:col-span-1 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-200 dark:border-purple-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time on Website</CardTitle>
            <Timer className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-500">
              {timeSpent.totalHours > 0 
                ? `${timeSpent.totalHours}h ${timeSpent.displayMinutes}m`
                : `${timeSpent.displayMinutes}m`
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Total time spent
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">DSA Problems</CardTitle>
            <Code2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{dsaSummary.solved}</div>
            <p className="text-xs text-muted-foreground">
              {dsaSummary.attempted} attempted · {dsaSummary.bookmarked} bookmarked
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aptitude Tests</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aptitudeSummary.totalAttempts}</div>
            <p className="text-xs text-muted-foreground">
              Avg Score: {aptitudeSummary.averageScore}% · {aptitudeSummary.topicsAttempted} topics
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contests</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contestSummary.participated}</div>
            <p className="text-xs text-muted-foreground">
              {contestSummary.totalSubmissions} submissions · Best rank: {contestSummary.bestRank || 'N/A'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Chat</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{chatHistory.totalMessages}</div>
            <p className="text-xs text-muted-foreground">
              {chatHistory.conversations.length} conversations
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tabs */}
      <Tabs defaultValue="dsa" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="dsa" className="flex items-center gap-1">
            <Code2 className="h-4 w-4" />
            <span className="hidden sm:inline">DSA</span>
          </TabsTrigger>
          <TabsTrigger value="aptitude" className="flex items-center gap-1">
            <Brain className="h-4 w-4" />
            <span className="hidden sm:inline">Aptitude</span>
          </TabsTrigger>
          <TabsTrigger value="roadmap" className="flex items-center gap-1">
            <Map className="h-4 w-4" />
            <span className="hidden sm:inline">Roadmap</span>
          </TabsTrigger>
          <TabsTrigger value="contests" className="flex items-center gap-1">
            <Trophy className="h-4 w-4" />
            <span className="hidden sm:inline">Contests</span>
          </TabsTrigger>
          <TabsTrigger value="chat" className="flex items-center gap-1">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Chat</span>
          </TabsTrigger>
          <TabsTrigger value="interviews" className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Interviews</span>
          </TabsTrigger>
        </TabsList>

        {/* DSA Tab */}
        <TabsContent value="dsa" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code2 className="h-5 w-5" />
                DSA Progress
              </CardTitle>
              <CardDescription>
                Problems solved, attempted, and bookmarked by this user
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 rounded-lg bg-green-500/10">
                  <div className="text-3xl font-bold text-green-500">{dsaSummary.solved}</div>
                  <div className="text-sm text-muted-foreground">Solved</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-yellow-500/10">
                  <div className="text-3xl font-bold text-yellow-500">{dsaSummary.attempted}</div>
                  <div className="text-sm text-muted-foreground">Attempted</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-blue-500/10">
                  <div className="text-3xl font-bold text-blue-500">{dsaSummary.bookmarked}</div>
                  <div className="text-sm text-muted-foreground">Bookmarked</div>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Problem</TableHead>
                    <TableHead>Difficulty</TableHead>
                    <TableHead>Platform</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Language</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dsaProgress.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No DSA progress yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    dsaProgress.map((problem) => (
                      <TableRow key={problem.problemId}>
                        <TableCell className="font-medium">{problem.problemTitle || `Problem #${problem.problemId}`}</TableCell>
                        <TableCell>
                          <Badge className={getDifficultyColor(problem.difficulty)}>
                            {problem.difficulty || 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell>{problem.platform || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{problem.status}</Badge>
                        </TableCell>
                        <TableCell>{problem.language || 'N/A'}</TableCell>
                        <TableCell>{formatDate(problem.solvedAt)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aptitude Tab */}
        <TabsContent value="aptitude" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Aptitude Test Results
              </CardTitle>
              <CardDescription>
                All aptitude tests taken by this user
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 rounded-lg bg-blue-500/10">
                  <div className="text-3xl font-bold text-blue-500">{aptitudeSummary.totalAttempts}</div>
                  <div className="text-sm text-muted-foreground">Total Tests</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-green-500/10">
                  <div className="text-3xl font-bold text-green-500">{aptitudeSummary.averageScore}%</div>
                  <div className="text-sm text-muted-foreground">Average Score</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-purple-500/10">
                  <div className="text-3xl font-bold text-purple-500">{aptitudeSummary.topicsAttempted}</div>
                  <div className="text-sm text-muted-foreground">Topics Covered</div>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Topic</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Correct / Total</TableHead>
                    <TableHead>Time Taken</TableHead>
                    <TableHead>Completed At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {aptitudeResults.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No aptitude tests taken yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    aptitudeResults.map((result) => (
                      <TableRow key={result.id}>
                        <TableCell className="font-medium capitalize">{result.topic}</TableCell>
                        <TableCell>
                          <Badge className={result.score >= 70 ? 'bg-green-500/10 text-green-500' : result.score >= 50 ? 'bg-yellow-500/10 text-yellow-500' : 'bg-red-500/10 text-red-500'}>
                            {result.score}%
                          </Badge>
                        </TableCell>
                        <TableCell>{result.correctAnswers} / {result.totalQuestions}</TableCell>
                        <TableCell>{result.timeTaken ? `${Math.floor(result.timeTaken / 60)}m ${result.timeTaken % 60}s` : 'N/A'}</TableCell>
                        <TableCell>{formatDateTime(result.completedAt)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Roadmap Tab */}
        <TabsContent value="roadmap" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Map className="h-5 w-5" />
                Roadmap Progress
              </CardTitle>
              <CardDescription>
                Learning paths and progress for this user
              </CardDescription>
            </CardHeader>
            <CardContent>
              {roadmapProgress.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No roadmaps started yet
                </div>
              ) : (
                <div className="space-y-4">
                  {roadmapProgress.map((roadmap) => {
                    const completedSteps = parseCompletedSteps(roadmap.completedSteps);
                    return (
                      <div key={roadmap.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h3 className="font-semibold">{roadmap.roadmapTitle || 'Unknown Roadmap'}</h3>
                            <Badge variant="outline" className="mt-1">{roadmap.roadmapCategory}</Badge>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-green-500">{completedSteps.length}</div>
                            <div className="text-sm text-muted-foreground">steps completed</div>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground mt-2">
                          Started: {formatDate(roadmap.startedAt)} · Last updated: {formatDate(roadmap.lastUpdated)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contests Tab */}
        <TabsContent value="contests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Contest Participation
              </CardTitle>
              <CardDescription>
                All contests participated by this user
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 rounded-lg bg-blue-500/10">
                  <div className="text-3xl font-bold text-blue-500">{contestSummary.participated}</div>
                  <div className="text-sm text-muted-foreground">Participated</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-green-500/10">
                  <div className="text-3xl font-bold text-green-500">{contestSummary.totalSubmissions}</div>
                  <div className="text-sm text-muted-foreground">Submissions</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-yellow-500/10">
                  <div className="text-3xl font-bold text-yellow-500">#{contestSummary.bestRank || 'N/A'}</div>
                  <div className="text-sm text-muted-foreground">Best Rank</div>
                </div>
              </div>

              <h4 className="font-semibold mb-3">Leaderboard Entries</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contest</TableHead>
                    <TableHead>Rank</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Problems Solved</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaderboardEntries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        No contest entries yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    leaderboardEntries.map((entry) => (
                      <TableRow key={entry.contestId}>
                        <TableCell className="font-medium">{entry.contestTitle || 'Unknown Contest'}</TableCell>
                        <TableCell>
                          <Badge className={entry.rank && entry.rank <= 3 ? 'bg-yellow-500/10 text-yellow-500' : ''}>
                            #{entry.rank || 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell>{entry.totalScore}</TableCell>
                        <TableCell>{entry.problemsSolved}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Chat History Tab */}
        <TabsContent value="chat" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                AI Chat History
              </CardTitle>
              <CardDescription>
                All conversations this user has had with the AI chatbot
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center p-4 rounded-lg bg-blue-500/10">
                  <div className="text-3xl font-bold text-blue-500">{chatHistory.conversations.length}</div>
                  <div className="text-sm text-muted-foreground">Conversations</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-green-500/10">
                  <div className="text-3xl font-bold text-green-500">{chatHistory.totalMessages}</div>
                  <div className="text-sm text-muted-foreground">Total Messages</div>
                </div>
              </div>

              <div className="space-y-2">
                {chatHistory.conversations.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    No chat conversations yet
                  </div>
                ) : (
                  chatHistory.conversations.map((conversation) => (
                    <div 
                      key={conversation.id} 
                      className="border rounded-lg p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => handleViewConversation(conversation.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{conversation.title || 'Untitled Conversation'}</h4>
                          <p className="text-sm text-muted-foreground">
                            Created: {formatDateTime(conversation.createdAt)} · Last updated: {formatDateTime(conversation.updatedAt)}
                          </p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Mock Interviews Tab */}
        <TabsContent value="interviews" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Mock Interviews
              </CardTitle>
              <CardDescription>
                All mock interview sessions by this user
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Difficulty</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Questions</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {interviews.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground">
                        No mock interviews taken yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    interviews.map((interview) => (
                      <TableRow key={interview.id}>
                        <TableCell className="font-medium capitalize">{interview.type.replace('-', ' ')}</TableCell>
                        <TableCell>
                          <Badge className={interview.status === 'completed' ? 'bg-green-500/10 text-green-500' : interview.status === 'in-progress' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-gray-500/10 text-gray-500'}>
                            {interview.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="capitalize">{interview.difficulty || 'N/A'}</TableCell>
                        <TableCell>{interview.companyName || 'N/A'}</TableCell>
                        <TableCell>
                          {interview.score !== null ? (
                            <Badge className={interview.score >= 70 ? 'bg-green-500/10 text-green-500' : interview.score >= 50 ? 'bg-yellow-500/10 text-yellow-500' : 'bg-red-500/10 text-red-500'}>
                              {interview.score}%
                            </Badge>
                          ) : 'N/A'}
                        </TableCell>
                        <TableCell>{interview.questionsCount}</TableCell>
                        <TableCell>{interview.duration ? `${Math.floor(interview.duration / 60)}m` : 'N/A'}</TableCell>
                        <TableCell>{formatDateTime(interview.createdAt)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Chat Messages Dialog */}
      <Dialog open={!!selectedConversation} onOpenChange={() => setSelectedConversation(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Conversation Messages</DialogTitle>
            <DialogDescription>
              View the full conversation history
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[60vh] pr-4">
            {isLoadingMessages ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading messages...
              </div>
            ) : chatMessages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No messages in this conversation
              </div>
            ) : (
              <div className="space-y-4">
                {chatMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`p-4 rounded-lg ${
                      message.role === 'user' 
                        ? 'bg-primary/10 ml-8' 
                        : 'bg-muted mr-8'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={message.role === 'user' ? 'default' : 'secondary'}>
                        {message.role === 'user' ? 'User' : 'Assistant'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(message.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
