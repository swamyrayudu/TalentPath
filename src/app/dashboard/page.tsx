import { auth } from '../../lib/auth';
import React from 'react';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { 
  userProgress, 
  problems,
  aptitudeResults,
} from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Code2, 
  Trophy, 
  Target, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  Flame,
  Brain,
  Award,
  BarChart3,
  Activity,
  BookOpen,
  Zap
} from 'lucide-react';
import Link from 'next/link';
import { getUserContestStats } from '@/actions/contest.actions';

export default async function Dashboard() {
  const session = await auth();

  if (!session?.user) {
    redirect('/');
  }

  const userId = session.user.id as string;

  // Fetch all user progress
  const userProgressData = await db
    .select({
      progress: userProgress,
      problem: problems,
    })
    .from(userProgress)
    .leftJoin(problems, eq(userProgress.problemId, problems.id))
    .where(eq(userProgress.userId, userId))
    .orderBy(desc(userProgress.solvedAt));

  // Fetch contest submission statistics
  const contestStatsResult = await getUserContestStats(userId);
  const contestStats = contestStatsResult.success && contestStatsResult.data 
    ? contestStatsResult.data 
    : {
        totalSubmissions: 0,
        totalAccepted: 0,
        uniqueProblemsSolved: 0,
        questionStats: [],
        recentSubmissions: [],
      };

  // Fetch aptitude test results
  const aptitudeResultsData = await db
    .select()
    .from(aptitudeResults)
    .where(eq(aptitudeResults.userId, userId))
    .orderBy(desc(aptitudeResults.completedAt));

  // Calculate aptitude statistics
  const aptitudeStats = {
    totalTests: aptitudeResultsData.length,
    averageScore: aptitudeResultsData.length > 0
      ? Math.round(
          aptitudeResultsData.reduce((sum, r) => sum + r.score, 0) / aptitudeResultsData.length
        )
      : 0,
    bestScore: aptitudeResultsData.length > 0
      ? Math.max(...aptitudeResultsData.map(r => r.score))
      : 0,
    topicStats: (() => {
      const topicMap = new Map<string, { total: number; count: number; best: number }>();
      
      aptitudeResultsData.forEach(result => {
        const existing = topicMap.get(result.topic) || { total: 0, count: 0, best: 0 };
        topicMap.set(result.topic, {
          total: existing.total + result.score,
          count: existing.count + 1,
          best: Math.max(existing.best, result.score),
        });
      });

      return Array.from(topicMap.entries())
        .map(([topic, data]) => ({
          topic,
          testsCompleted: data.count,
          averageScore: Math.round(data.total / data.count),
          bestScore: data.best,
        }))
        .sort((a, b) => b.averageScore - a.averageScore);
    })(),
    recentTests: aptitudeResultsData.slice(0, 5).map(r => ({
      id: r.id,
      topic: r.topic,
      score: r.score,
      totalQuestions: r.totalQuestions,
      correctAnswers: r.correctAnswers,
      completedAt: r.completedAt,
    })),
  };

  // Calculate DSA statistics
  const solved = userProgressData.filter(p => p.progress.status === 'solved');
  const dsaStats = {
    totalSolved: solved.length,
    easy: solved.filter(p => p.problem?.difficulty === 'EASY').length,
    medium: solved.filter(p => p.problem?.difficulty === 'MEDIUM').length,
    hard: solved.filter(p => p.problem?.difficulty === 'HARD').length,
    recentSubmissions: solved.slice(0, 10),
  };

  // Calculate streak
  const calculateStreak = () => {
    if (solved.length === 0) return 0;
    
    const dates = solved
      .filter(p => p.progress.solvedAt)
      .map(p => new Date(p.progress.solvedAt!).toDateString())
      .filter((date, index, self) => self.indexOf(date) === index)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    let streak = 0;
    
    for (let i = 0; i < dates.length; i++) {
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() - i);
      
      if (dates[i] === expectedDate.toDateString()) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  };

  const streak = calculateStreak();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto p-4 md:p-8 space-y-6 max-w-7xl">
        {/* Header Section */}
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1 flex-1">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-amber-500 via-orange-600 to-amber-600 bg-clip-text text-transparent">
                Welcome back, {session.user.name?.split(' ')[0] || 'User'}!
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">Track your progress and keep learning</p>
            </div>
            
            {/* Compact Streak Badge */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-br from-orange-500/10 to-amber-500/10 border border-orange-500/20">
              <Flame className="h-5 w-5 sm:h-6 sm:w-6 text-orange-500 flex-shrink-0" />
              <div className="flex items-baseline gap-1">
                <span className="text-lg sm:text-xl font-bold text-orange-500">{streak}</span>
                <span className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">day streak</span>
              </div>
            </div>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <Card className="border-2 hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">DSA Problems</CardTitle>
              <Code2 className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-500">{dsaStats.totalSolved}</div>
              <p className="text-xs text-muted-foreground mt-1">Problems solved</p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Contest Solved</CardTitle>
              <Trophy className="h-5 w-5 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-500">{contestStats.uniqueProblemsSolved}</div>
              <p className="text-xs text-muted-foreground mt-1">Unique problems</p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Aptitude Tests</CardTitle>
              <Brain className="h-5 w-5 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-500">{aptitudeStats.totalTests}</div>
              <p className="text-xs text-muted-foreground mt-1">Tests completed</p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Best Score</CardTitle>
              <Award className="h-5 w-5 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-500">{aptitudeStats.bestScore}%</div>
              <p className="text-xs text-muted-foreground mt-1">Aptitude best</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabbed Content */}
        <Tabs defaultValue="dsa" className="space-y-6">
          <TabsList className="inline-flex h-auto w-full justify-center items-center gap-3 p-1.5 bg-muted/40 rounded-2xl border-2 border-border/50 backdrop-blur-sm">
            <TabsTrigger 
              value="dsa" 
              className="relative flex items-center gap-2 px-6 py-3 rounded-xl data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-500 data-[state=active]:to-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/30 transition-all duration-300 hover:scale-105 group"
            >
              <Code2 className="h-5 w-5 group-data-[state=active]:animate-pulse" />
              <span className="hidden sm:inline font-semibold">DSA Practice</span>
              <span className="sm:hidden font-semibold">DSA</span>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-400/20 to-cyan-400/20 opacity-0 group-data-[state=active]:opacity-100 transition-opacity duration-300 -z-10" />
            </TabsTrigger>
            <TabsTrigger 
              value="contests" 
              className="relative flex items-center gap-2 px-6 py-3 rounded-xl data-[state=active]:bg-gradient-to-br data-[state=active]:from-amber-500 data-[state=active]:to-orange-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-amber-500/30 transition-all duration-300 hover:scale-105 group"
            >
              <Trophy className="h-5 w-5 group-data-[state=active]:animate-pulse" />
              <span className="hidden sm:inline font-semibold">Contests</span>
              <span className="sm:hidden font-semibold">Contest</span>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-amber-400/20 to-orange-400/20 opacity-0 group-data-[state=active]:opacity-100 transition-opacity duration-300 -z-10" />
            </TabsTrigger>
            <TabsTrigger 
              value="aptitude" 
              className="relative flex items-center gap-2 px-6 py-3 rounded-xl data-[state=active]:bg-gradient-to-br data-[state=active]:from-purple-500 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-500/30 transition-all duration-300 hover:scale-105 group"
            >
              <Brain className="h-5 w-5 group-data-[state=active]:animate-pulse" />
              <span className="hidden sm:inline font-semibold">Aptitude</span>
              <span className="sm:hidden font-semibold">Tests</span>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-400/20 to-pink-400/20 opacity-0 group-data-[state=active]:opacity-100 transition-opacity duration-300 -z-10" />
            </TabsTrigger>
          </TabsList>

          {/* DSA Tab Content */}
          <TabsContent value="dsa" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Difficulty Stats */}
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-amber-500" />
                      Difficulty Distribution
                    </CardTitle>
                    <CardDescription>Your problem-solving breakdown</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="text-center p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                        <div className="text-3xl font-bold text-emerald-500">{dsaStats.easy}</div>
                        <p className="text-sm text-muted-foreground mt-1">Easy</p>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        <div className="text-3xl font-bold text-amber-500">{dsaStats.medium}</div>
                        <p className="text-sm text-muted-foreground mt-1">Medium</p>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-rose-500/10 border border-rose-500/20">
                        <div className="text-3xl font-bold text-rose-500">{dsaStats.hard}</div>
                        <p className="text-sm text-muted-foreground mt-1">Hard</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">Easy</span>
                          <span className="text-muted-foreground">{Math.round((dsaStats.easy / Math.max(dsaStats.totalSolved, 1)) * 100)}%</span>
                        </div>
                        <Progress value={(dsaStats.easy / Math.max(dsaStats.totalSolved, 1)) * 100} className="h-2 [&>div]:bg-emerald-500" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">Medium</span>
                          <span className="text-muted-foreground">{Math.round((dsaStats.medium / Math.max(dsaStats.totalSolved, 1)) * 100)}%</span>
                        </div>
                        <Progress value={(dsaStats.medium / Math.max(dsaStats.totalSolved, 1)) * 100} className="h-2 [&>div]:bg-amber-500" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">Hard</span>
                          <span className="text-muted-foreground">{Math.round((dsaStats.hard / Math.max(dsaStats.totalSolved, 1)) * 100)}%</span>
                        </div>
                        <Progress value={(dsaStats.hard / Math.max(dsaStats.totalSolved, 1)) * 100} className="h-2 [&>div]:bg-rose-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Submissions */}
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-blue-500" />
                      Recent Submissions
                    </CardTitle>
                    <CardDescription>Your latest solved problems</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {dsaStats.recentSubmissions.length === 0 ? (
                      <div className="text-center py-12">
                        <Code2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                        <p className="text-muted-foreground">No submissions yet</p>
                        <Link href="/dsasheet" className="text-sm text-amber-600 hover:underline mt-2 inline-block">
                          Start solving problems →
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {dsaStats.recentSubmissions.map((item) => (
                          <div
                            key={item.progress.id}
                            className="flex items-center justify-between p-3 rounded-lg border hover:border-amber-500/50 hover:bg-accent/50 transition-all duration-200"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{item.problem?.title || 'Unknown Problem'}</p>
                                <p className="text-xs text-muted-foreground">
                                  {item.progress.solvedAt ? new Date(item.progress.solvedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                                </p>
                              </div>
                            </div>
                            <Badge
                              variant="outline"
                              className={
                                item.problem?.difficulty === 'EASY'
                                  ? 'border-emerald-500 text-emerald-500 bg-emerald-500/10'
                                  : item.problem?.difficulty === 'MEDIUM'
                                  ? 'border-amber-500 text-amber-500 bg-amber-500/10'
                                  : 'border-rose-500 text-rose-500 bg-rose-500/10'
                              }
                            >
                              {item.problem?.difficulty || 'N/A'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Activity className="h-5 w-5" />
                      Quick Stats
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-sm text-muted-foreground">Total Solved</span>
                      <span className="font-bold text-lg">{dsaStats.totalSolved}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-sm text-muted-foreground">Success Rate</span>
                      <span className="font-bold text-lg text-emerald-500">100%</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-muted-foreground">Active Days</span>
                      <span className="font-bold text-lg">{streak}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2 bg-gradient-to-br from-amber-500/5 to-orange-500/5">
                  <CardHeader>
                    <CardTitle className="text-lg">Practice More</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Link
                      href="/dsasheet"
                      className="flex items-center justify-between p-4 rounded-lg border-2 border-amber-500/20 hover:border-amber-500 hover:bg-amber-500/5 transition-all duration-200 group"
                    >
                      <div className="flex items-center gap-3">
                        <BookOpen className="h-5 w-5 text-amber-500" />
                        <span className="font-medium">DSA Sheet</span>
                      </div>
                      <Zap className="h-4 w-4 text-amber-500 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Contests Tab Content */}
          <TabsContent value="contests" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-amber-500" />
                      Contest Statistics
                    </CardTitle>
                    <CardDescription>Your competitive programming performance</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="text-center p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                        <div className="text-3xl font-bold text-blue-500">{contestStats.totalSubmissions}</div>
                        <p className="text-sm text-muted-foreground mt-1">Submissions</p>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                        <div className="text-3xl font-bold text-emerald-500">{contestStats.totalAccepted}</div>
                        <p className="text-sm text-muted-foreground mt-1">Accepted</p>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        <div className="text-3xl font-bold text-amber-500">{contestStats.uniqueProblemsSolved}</div>
                        <p className="text-sm text-muted-foreground mt-1">Unique Solved</p>
                      </div>
                    </div>

                    {contestStats.questionStats.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-semibold text-sm">Question Performance</h4>
                        {contestStats.questionStats.map((stat, index) => (
                          <div key={index} className="p-3 rounded-lg border bg-accent/20">
                            <div className="flex justify-between items-start mb-2">
                              <span className="font-medium">{stat.questionTitle}</span>
                              <Badge variant={stat.acceptedSubmissions > 0 ? "default" : "secondary"}>
                                {stat.acceptedSubmissions > 0 ? 'Solved' : 'Attempted'}
                              </Badge>
                            </div>
                            <div className="flex gap-2 text-xs text-muted-foreground">
                              <span>{stat.totalSubmissions} submissions</span>
                              <span>•</span>
                              <span>{stat.acceptedSubmissions} accepted</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Recent Contest Submissions */}
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-blue-500" />
                      Recent Contest Submissions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {contestStats.recentSubmissions.length === 0 ? (
                      <div className="text-center py-12">
                        <Trophy className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                        <p className="text-muted-foreground">No contest submissions yet</p>
                        <Link href="/contest" className="text-sm text-amber-600 hover:underline mt-2 inline-block">
                          Join a contest →
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {contestStats.recentSubmissions.slice(0, 10).map((submission, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 rounded-lg border hover:border-amber-500/50 hover:bg-accent/50 transition-all duration-200"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              {submission.verdict === 'accepted' ? (
                                <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                              ) : (
                                <Clock className="h-5 w-5 text-amber-500 flex-shrink-0" />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{submission.questionTitle}</p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(submission.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </p>
                              </div>
                            </div>
                            <Badge
                              variant="outline"
                              className={
                                submission.verdict === 'accepted'
                                  ? 'border-emerald-500 text-emerald-500 bg-emerald-500/10'
                                  : 'border-amber-500 text-amber-500 bg-amber-500/10'
                              }
                            >
                              {submission.verdict.toUpperCase().replace(/_/g, ' ')}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <TrendingUp className="h-5 w-5" />
                      Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-sm text-muted-foreground">Acceptance Rate</span>
                      <span className="font-bold text-lg text-emerald-500">
                        {contestStats.totalSubmissions > 0 
                          ? `${Math.round((contestStats.totalAccepted / contestStats.totalSubmissions) * 100)}%`
                          : '0%'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-muted-foreground">Total Attempts</span>
                      <span className="font-bold text-lg">{contestStats.totalSubmissions}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2 bg-gradient-to-br from-amber-500/5 to-orange-500/5">
                  <CardHeader>
                    <CardTitle className="text-lg">Join Contests</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Link
                      href="/contest"
                      className="flex items-center justify-between p-4 rounded-lg border-2 border-amber-500/20 hover:border-amber-500 hover:bg-amber-500/5 transition-all duration-200 group"
                    >
                      <div className="flex items-center gap-3">
                        <Trophy className="h-5 w-5 text-amber-500" />
                        <span className="font-medium">Browse Contests</span>
                      </div>
                      <Zap className="h-4 w-4 text-amber-500 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Aptitude Tab Content */}
          <TabsContent value="aptitude" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="h-5 w-5 text-purple-500" />
                      Aptitude Statistics
                    </CardTitle>
                    <CardDescription>Your test performance overview</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="text-center p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                        <div className="text-3xl font-bold text-purple-500">{aptitudeStats.totalTests}</div>
                        <p className="text-sm text-muted-foreground mt-1">Total Tests</p>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                        <div className="text-3xl font-bold text-blue-500">{aptitudeStats.averageScore}%</div>
                        <p className="text-sm text-muted-foreground mt-1">Avg Score</p>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                        <div className="text-3xl font-bold text-emerald-500">{aptitudeStats.bestScore}%</div>
                        <p className="text-sm text-muted-foreground mt-1">Best Score</p>
                      </div>
                    </div>

                    {/* Topic-wise Performance */}
                    {aptitudeStats.topicStats.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-semibold text-sm">Topic-wise Performance</h4>
                        {aptitudeStats.topicStats.map((topic, index) => (
                          <div key={index} className="p-3 rounded-lg border bg-accent/20">
                            <div className="flex justify-between items-start mb-2">
                              <span className="font-medium capitalize">{topic.topic}</span>
                              <Badge variant="secondary">{topic.testsCompleted} tests</Badge>
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Average</span>
                                <span className="font-medium">{topic.averageScore}%</span>
                              </div>
                              <Progress value={topic.averageScore} className="h-2 [&>div]:bg-purple-500" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Recent Tests */}
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-blue-500" />
                      Recent Tests
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {aptitudeStats.recentTests.length === 0 ? (
                      <div className="text-center py-12">
                        <Brain className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                        <p className="text-muted-foreground">No tests taken yet</p>
                        <Link href="/aptitude" className="text-sm text-amber-600 hover:underline mt-2 inline-block">
                          Take a test →
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {aptitudeStats.recentTests.map((test) => (
                          <div
                            key={test.id}
                            className="flex items-center justify-between p-3 rounded-lg border hover:border-purple-500/50 hover:bg-accent/50 transition-all duration-200"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <Target className="h-5 w-5 text-purple-500 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium capitalize truncate">{test.topic}</p>
                                <p className="text-xs text-muted-foreground">
                                  {test.correctAnswers}/{test.totalQuestions} correct • {new Date(test.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-purple-500">{test.score}%</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Award className="h-5 w-5" />
                      Your Best
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-sm text-muted-foreground">Best Score</span>
                      <span className="font-bold text-lg text-emerald-500">{aptitudeStats.bestScore}%</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-sm text-muted-foreground">Average Score</span>
                      <span className="font-bold text-lg">{aptitudeStats.averageScore}%</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-muted-foreground">Tests Taken</span>
                      <span className="font-bold text-lg">{aptitudeStats.totalTests}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2 bg-gradient-to-br from-purple-500/5 to-pink-500/5">
                  <CardHeader>
                    <CardTitle className="text-lg">Practice More</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Link
                      href="/aptitude"
                      className="flex items-center justify-between p-4 rounded-lg border-2 border-purple-500/20 hover:border-purple-500 hover:bg-purple-500/5 transition-all duration-200 group"
                    >
                      <div className="flex items-center gap-3">
                        <Brain className="h-5 w-5 text-purple-500" />
                        <span className="font-medium">Take Tests</span>
                      </div>
                      <Zap className="h-4 w-4 text-purple-500 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
