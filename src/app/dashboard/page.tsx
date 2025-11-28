
import { auth } from '../../lib/auth';
import React from 'react';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { 
  aptitudeResults,
} from '@/lib/db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

interface ProgressWithProblem {
  id: number;
  status: string;
  solvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  problemId: number;
  title: string | null;
  difficulty: string | null;
  platform: string | null;
  slug: string | null;
}

export default async function Dashboard() {
  const session = await auth();

  if (!session?.user) {
    redirect('/');
  }

  const userId = session.user.id as string;

  // Fetch user progress with visible_problems join using raw SQL
  const userProgressData = await db.execute(sql`
    SELECT 
      up.id,
      up.status,
      up.solved_at as "solvedAt",
      up.created_at as "createdAt",
      up.updated_at as "updatedAt",
      up.problem_id as "problemId",
      vp.title,
      vp.difficulty,
      vp.platform,
      vp.slug
    FROM user_progress up
    LEFT JOIN visible_problems vp ON up.problem_id = vp.id
    WHERE up.user_id = ${userId}
    ORDER BY up.updated_at DESC
  `) as unknown as ProgressWithProblem[];

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

  // Calculate DSA statistics - using new flat structure from raw SQL
  const solved = userProgressData.filter(p => p.status === 'solved');
  const dsaStats = {
    totalSolved: solved.length,
    easy: solved.filter(p => p.difficulty?.toUpperCase() === 'EASY').length,
    medium: solved.filter(p => p.difficulty?.toUpperCase() === 'MEDIUM').length,
    hard: solved.filter(p => p.difficulty?.toUpperCase() === 'HARD').length,
    recentSubmissions: solved.slice(0, 10),
  };

  // Calculate streak
  const calculateStreak = () => {
    if (solved.length === 0) return 0;
    
    // Get all dates when problems were solved
    const dates = solved
      .filter(p => p.solvedAt)
      .map(p => {
        // Handle both timestamp and string formats
        const date = new Date(p.solvedAt!);
        return date.toDateString();
      })
      .filter((date, index, self) => self.indexOf(date) === index) // unique dates
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    if (dates.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < dates.length; i++) {
      const expectedDate = new Date(today);
      expectedDate.setDate(expectedDate.getDate() - i);
      
      if (dates[i] === expectedDate.toDateString()) {
        streak++;
      } else if (i === 0) {
        // If today hasn't been solved yet, check from yesterday
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        if (dates[0] === yesterday.toDateString()) {
          streak = 1;
          // Continue checking from day before yesterday
          for (let j = 1; j < dates.length; j++) {
            const checkDate = new Date(yesterday);
            checkDate.setDate(checkDate.getDate() - j);
            if (dates[j] === checkDate.toDateString()) {
              streak++;
            } else {
              break;
            }
          }
        }
        break;
      } else {
        break;
      }
    }
    
    return streak;
  };

  const streak = calculateStreak();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-3 md:p-6 space-y-4 md:space-y-6 max-w-7xl">
        {/* Header Section */}
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <h1 className="text-xl md:text-2xl font-semibold">
              Welcome, <span className="text-primary">{session.user.name?.split(' ')[0] || 'User'}</span>
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground">Track your progress</p>
          </div>
          
          {/* Streak Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 md:px-3 md:py-2 rounded-lg bg-muted">
            <Flame className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary" />
            <div className="flex items-baseline gap-0.5">
              <span className="text-sm md:text-base font-semibold">{streak}</span>
              <span className="text-[10px] md:text-xs text-muted-foreground">days</span>
            </div>
          </div>
        </div>

        {/* Overview Stats - Compact */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
          <Card className="border bg-card hover:bg-accent/5 transition-colors">
            <CardHeader className="p-2 md:p-4 pb-1 md:pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-[10px] md:text-sm font-medium text-foreground">DSA</CardTitle>
                <Code2 className="h-3 w-3 md:h-4 md:w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent className="p-2 md:p-4 pt-0">
              <div className="text-lg md:text-2xl font-bold text-foreground">{dsaStats.totalSolved}</div>
              <p className="text-[9px] md:text-xs text-muted-foreground">solved</p>
            </CardContent>
          </Card>

          <Card className="border bg-card hover:bg-accent/5 transition-colors">
            <CardHeader className="p-2 md:p-4 pb-1 md:pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-[10px] md:text-sm font-medium text-foreground">Contest</CardTitle>
                <Trophy className="h-3 w-3 md:h-4 md:w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent className="p-2 md:p-4 pt-0">
              <div className="text-lg md:text-2xl font-bold text-foreground">{contestStats.uniqueProblemsSolved}</div>
              <p className="text-[9px] md:text-xs text-muted-foreground">unique</p>
            </CardContent>
          </Card>

          <Card className="border bg-card hover:bg-accent/5 transition-colors">
            <CardHeader className="p-2 md:p-4 pb-1 md:pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-[10px] md:text-sm font-medium text-foreground">Tests</CardTitle>
                <Brain className="h-3 w-3 md:h-4 md:w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent className="p-2 md:p-4 pt-0">
              <div className="text-lg md:text-2xl font-bold text-foreground">{aptitudeStats.totalTests}</div>
              <p className="text-[9px] md:text-xs text-muted-foreground">completed</p>
            </CardContent>
          </Card>

          <Card className="border bg-card hover:bg-accent/5 transition-colors">
            <CardHeader className="p-2 md:p-4 pb-1 md:pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-[10px] md:text-sm font-medium text-foreground">Best</CardTitle>
                <Award className="h-3 w-3 md:h-4 md:w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent className="p-2 md:p-4 pt-0">
              <div className="text-lg md:text-2xl font-bold text-foreground">{aptitudeStats.bestScore}%</div>
              <p className="text-[9px] md:text-xs text-muted-foreground">score</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabbed Content */}
        <Tabs defaultValue="dsa" className="space-y-4 md:space-y-6">
          <TabsList className="w-full h-9 md:h-10 bg-muted p-1 gap-1">
            <TabsTrigger 
              value="dsa" 
              className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm data-[state=inactive]:text-muted-foreground hover:bg-primary/20 hover:text-primary transition-all text-xs md:text-sm rounded-sm"
            >
              <Code2 className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5" />
              <span className="font-semibold">DSA</span>
            </TabsTrigger>
            <TabsTrigger 
              value="contests" 
              className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm data-[state=inactive]:text-muted-foreground hover:bg-primary/20 hover:text-primary transition-all text-xs md:text-sm rounded-sm"
            >
              <Trophy className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5" />
              <span className="font-semibold">Contest</span>
            </TabsTrigger>
            <TabsTrigger 
              value="aptitude" 
              className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm data-[state=inactive]:text-muted-foreground hover:bg-primary/20 hover:text-primary transition-all text-xs md:text-sm rounded-sm"
            >
              <Brain className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5" />
              <span className="font-semibold">Tests</span>
            </TabsTrigger>
          </TabsList>

          {/* DSA Tab Content */}
          <TabsContent value="dsa" className="space-y-3 md:space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-3 md:space-y-4">
                {/* Difficulty Stats */}
                <Card className="border">
                  <CardHeader className="p-3 md:p-6 pb-2">
                    <CardTitle className="text-xs md:text-base flex items-center gap-1.5 text-foreground">
                      <BarChart3 className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary" />
                      <span className="hidden sm:inline">Difficulty Distribution</span>
                      <span className="sm:hidden">Difficulty</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 md:p-6 pt-0">
                    <div className="grid grid-cols-3 gap-1.5 md:gap-3 mb-3">
                      <div className="text-center p-1.5 md:p-3 rounded-md bg-muted">
                        <div className="text-base md:text-2xl font-bold">{dsaStats.easy}</div>
                        <p className="text-[9px] md:text-xs text-muted-foreground mt-0.5">Easy</p>
                      </div>
                      <div className="text-center p-1.5 md:p-3 rounded-md bg-muted">
                        <div className="text-base md:text-2xl font-bold">{dsaStats.medium}</div>
                        <p className="text-[9px] md:text-xs text-muted-foreground mt-0.5">Medium</p>
                      </div>
                      <div className="text-center p-1.5 md:p-3 rounded-md bg-muted">
                        <div className="text-base md:text-2xl font-bold">{dsaStats.hard}</div>
                        <p className="text-[9px] md:text-xs text-muted-foreground mt-0.5">Hard</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs md:text-sm">
                          <span className="font-medium">Easy</span>
                          <span className="text-muted-foreground">{Math.round((dsaStats.easy / Math.max(dsaStats.totalSolved, 1)) * 100)}%</span>
                        </div>
                        <Progress value={(dsaStats.easy / Math.max(dsaStats.totalSolved, 1)) * 100} className="h-1.5" />
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs md:text-sm">
                          <span className="font-medium">Medium</span>
                          <span className="text-muted-foreground">{Math.round((dsaStats.medium / Math.max(dsaStats.totalSolved, 1)) * 100)}%</span>
                        </div>
                        <Progress value={(dsaStats.medium / Math.max(dsaStats.totalSolved, 1)) * 100} className="h-1.5" />
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs md:text-sm">
                          <span className="font-medium">Hard</span>
                          <span className="text-muted-foreground">{Math.round((dsaStats.hard / Math.max(dsaStats.totalSolved, 1)) * 100)}%</span>
                        </div>
                        <Progress value={(dsaStats.hard / Math.max(dsaStats.totalSolved, 1)) * 100} className="h-1.5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Submissions */}
                <Card className="border">
                  <CardHeader className="p-3 md:p-6 pb-2">
                    <CardTitle className="text-xs md:text-base flex items-center gap-1.5 text-foreground">
                      <Clock className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary" />
                      Recent
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 md:p-6 pt-0">
                    {dsaStats.recentSubmissions.length === 0 ? (
                      <div className="text-center py-8">
                        <Code2 className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                        <p className="text-xs md:text-sm text-muted-foreground">No submissions yet</p>
                        <Link href="/dsasheet" className="text-xs text-primary hover:underline mt-1 inline-block">
                          Start solving →
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-1.5 md:space-y-2">
                        {dsaStats.recentSubmissions.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-2 md:p-2.5 rounded-md border hover:bg-accent/50 transition-colors"
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <CheckCircle2 className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs md:text-sm font-medium truncate">{item.title || 'Unknown'}</p>
                                <p className="text-[10px] md:text-xs text-muted-foreground">
                                  {item.solvedAt ? new Date(item.solvedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'}
                                </p>
                              </div>
                            </div>
                            <Badge
                              variant="outline"
                              className="text-[10px] md:text-xs"
                            >
                              {item.difficulty || 'N/A'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-3 md:space-y-4">
                <Card className="border">
                  <CardHeader className="p-3 md:p-6 pb-2">
                    <CardTitle className="text-xs md:text-base flex items-center gap-1.5 text-foreground">
                      <Activity className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary" />
                      Stats
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 md:p-6 pt-0 space-y-1.5">
                    <div className="flex justify-between items-center py-1.5 border-b">
                      <span className="text-xs md:text-sm text-muted-foreground">Total Solved</span>
                      <span className="font-semibold text-sm md:text-base">{dsaStats.totalSolved}</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 border-b">
                      <span className="text-xs md:text-sm text-muted-foreground">Success Rate</span>
                      <span className="font-semibold text-sm md:text-base">100%</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5">
                      <span className="text-xs md:text-sm text-muted-foreground">Active Days</span>
                      <span className="font-semibold text-sm md:text-base">{streak}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border">
                  <CardHeader className="p-3 md:p-6 pb-2">
                    <CardTitle className="text-xs md:text-base text-foreground">Practice</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 md:p-6 pt-0">
                    <Link
                      href="/dsasheet"
                      className="flex items-center justify-between p-3 rounded-md border hover:bg-accent transition-colors group"
                    >
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        <span className="text-sm font-medium">DSA Sheet</span>
                      </div>
                      <Zap className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Contests Tab Content */}
          <TabsContent value="contests" className="space-y-3 md:space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4">
              <div className="lg:col-span-2 space-y-3 md:space-y-4">
                <Card className="border">
                  <CardHeader className="p-3 md:p-6 pb-2">
                    <CardTitle className="text-xs md:text-base flex items-center gap-1.5 text-foreground">
                      <Trophy className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary" />
                      <span className="hidden sm:inline">Contest Statistics</span>
                      <span className="sm:hidden">Contest</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 md:p-6 pt-0">
                    <div className="grid grid-cols-3 gap-1.5 md:gap-3 mb-3">
                      <div className="text-center p-1.5 md:p-3 rounded-md bg-muted">
                        <div className="text-base md:text-2xl font-bold">{contestStats.totalSubmissions}</div>
                        <p className="text-[9px] md:text-xs text-muted-foreground mt-0.5">Submissions</p>
                      </div>
                      <div className="text-center p-1.5 md:p-3 rounded-md bg-muted">
                        <div className="text-base md:text-2xl font-bold">{contestStats.totalAccepted}</div>
                        <p className="text-[9px] md:text-xs text-muted-foreground mt-0.5">Accepted</p>
                      </div>
                      <div className="text-center p-1.5 md:p-3 rounded-md bg-muted">
                        <div className="text-base md:text-2xl font-bold">{contestStats.uniqueProblemsSolved}</div>
                        <p className="text-[9px] md:text-xs text-muted-foreground mt-0.5">Solved</p>
                      </div>
                    </div>

                    {contestStats.questionStats.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-xs md:text-sm text-foreground">Question Performance</h4>
                        {contestStats.questionStats.map((stat, index) => (
                          <div key={index} className="p-2 md:p-2.5 rounded-md border">
                            <div className="flex justify-between items-start mb-1">
                              <span className="text-xs md:text-sm font-medium">{stat.questionTitle}</span>
                              <Badge variant={stat.acceptedSubmissions > 0 ? "default" : "secondary"} className="text-[10px] md:text-xs">
                                {stat.acceptedSubmissions > 0 ? 'Solved' : 'Attempted'}
                              </Badge>
                            </div>
                            <div className="flex gap-1.5 text-[10px] md:text-xs text-muted-foreground">
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
                <Card className="border">
                  <CardHeader className="p-3 md:p-6 pb-2">
                    <CardTitle className="text-xs md:text-base flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 md:h-4 md:w-4" />
                      Recent
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 md:p-6 pt-0">
                    {contestStats.recentSubmissions.length === 0 ? (
                      <div className="text-center py-8">
                        <Trophy className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                        <p className="text-xs md:text-sm text-muted-foreground">No submissions yet</p>
                        <Link href="/contest" className="text-xs text-primary hover:underline mt-1 inline-block">
                          Join contest →
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-1.5 md:space-y-2">
                        {contestStats.recentSubmissions.slice(0, 10).map((submission, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 md:p-2.5 rounded-md border hover:bg-accent/50 transition-colors"
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              {submission.verdict === 'accepted' ? (
                                <CheckCircle2 className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary flex-shrink-0" />
                              ) : (
                                <Clock className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground flex-shrink-0" />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-xs md:text-sm font-medium truncate">{submission.questionTitle}</p>
                                <p className="text-[10px] md:text-xs text-muted-foreground">
                                  {new Date(submission.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </p>
                              </div>
                            </div>
                            <Badge
                              variant="outline"
                              className="text-[10px] md:text-xs"
                            >
                              {submission.verdict === 'accepted' ? 'Accepted' : 'Pending'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-3 md:space-y-4">
                <Card className="border">
                  <CardHeader className="p-3 md:p-6 pb-2">
                    <CardTitle className="text-xs md:text-base flex items-center gap-1.5 text-foreground">
                      <TrendingUp className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary" />
                      Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 md:p-6 pt-0 space-y-1.5">
                    <div className="flex justify-between items-center py-1.5 border-b">
                      <span className="text-xs md:text-sm text-muted-foreground">Acceptance</span>
                      <span className="font-semibold text-sm md:text-base">
                        {contestStats.totalSubmissions > 0 
                          ? `${Math.round((contestStats.totalAccepted / contestStats.totalSubmissions) * 100)}%`
                          : '0%'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1.5">
                      <span className="text-xs md:text-sm text-muted-foreground">Attempts</span>
                      <span className="font-semibold text-sm md:text-base">{contestStats.totalSubmissions}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border">
                  <CardHeader className="p-3 md:p-6 pb-2">
                    <CardTitle className="text-xs md:text-base text-foreground">Contests</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 md:p-6 pt-0">
                    <Link
                      href="/contest"
                      className="flex items-center justify-between p-3 rounded-md border hover:bg-accent transition-colors group"
                    >
                      <div className="flex items-center gap-2">
                        <Trophy className="h-4 w-4" />
                        <span className="text-sm font-medium">Contests</span>
                      </div>
                      <Zap className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Aptitude Tab Content */}
          <TabsContent value="aptitude" className="space-y-3 md:space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4">
              <div className="lg:col-span-2 space-y-3 md:space-y-4">
                <Card className="border">
                  <CardHeader className="p-3 md:p-6 pb-2">
                    <CardTitle className="text-xs md:text-base flex items-center gap-1.5 text-foreground">
                      <Brain className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary" />
                      <span className="hidden sm:inline">Test Statistics</span>
                      <span className="sm:hidden">Tests</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 md:p-6 pt-0">
                    <div className="grid grid-cols-3 gap-1.5 md:gap-3 mb-3">
                      <div className="text-center p-1.5 md:p-3 rounded-md bg-muted">
                        <div className="text-base md:text-2xl font-bold">{aptitudeStats.totalTests}</div>
                        <p className="text-[9px] md:text-xs text-muted-foreground mt-0.5">Tests</p>
                      </div>
                      <div className="text-center p-1.5 md:p-3 rounded-md bg-muted">
                        <div className="text-base md:text-2xl font-bold">{aptitudeStats.averageScore}%</div>
                        <p className="text-[9px] md:text-xs text-muted-foreground mt-0.5">Average</p>
                      </div>
                      <div className="text-center p-1.5 md:p-3 rounded-md bg-muted">
                        <div className="text-base md:text-2xl font-bold">{aptitudeStats.bestScore}%</div>
                        <p className="text-[9px] md:text-xs text-muted-foreground mt-0.5">Best</p>
                      </div>
                    </div>

                    {/* Topic-wise Performance */}
                    {aptitudeStats.topicStats.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-xs md:text-sm text-foreground">Topic Performance</h4>
                        {aptitudeStats.topicStats.map((topic, index) => (
                          <div key={index} className="p-2 md:p-2.5 rounded-md border">
                            <div className="flex justify-between items-start mb-1.5">
                              <span className="text-xs md:text-sm font-medium capitalize">{topic.topic}</span>
                              <Badge variant="secondary" className="text-[10px] md:text-xs">{topic.testsCompleted}</Badge>
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between text-[10px] md:text-xs">
                                <span className="text-muted-foreground">Average</span>
                                <span className="font-medium">{topic.averageScore}%</span>
                              </div>
                              <Progress value={topic.averageScore} className="h-1.5" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Recent Tests */}
                <Card className="border">
                  <CardHeader className="p-3 md:p-6 pb-2">
                    <CardTitle className="text-xs md:text-base flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 md:h-4 md:w-4" />
                      Recent
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 md:p-6 pt-0">
                    {aptitudeStats.recentTests.length === 0 ? (
                      <div className="text-center py-8">
                        <Brain className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                        <p className="text-xs md:text-sm text-muted-foreground">No tests yet</p>
                        <Link href="/aptitude" className="text-xs text-primary hover:underline mt-1 inline-block">
                          Take test →
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-1.5 md:space-y-2">
                        {aptitudeStats.recentTests.map((test) => (
                          <div
                            key={test.id}
                            className="flex items-center justify-between p-2 md:p-2.5 rounded-md border hover:bg-accent/50 transition-colors"
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <Target className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs md:text-sm font-medium capitalize truncate">{test.topic}</p>
                                <p className="text-[10px] md:text-xs text-muted-foreground">
                                  {test.correctAnswers}/{test.totalQuestions} • {new Date(test.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm md:text-base font-semibold">{test.score}%</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-3 md:space-y-4">
                <Card className="border">
                  <CardHeader className="p-3 md:p-6 pb-2">
                    <CardTitle className="text-xs md:text-base flex items-center gap-1.5 text-foreground">
                      <Award className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary" />
                      Best
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 md:p-6 pt-0 space-y-1.5">
                    <div className="flex justify-between items-center py-1.5 border-b">
                      <span className="text-xs md:text-sm text-muted-foreground">Best Score</span>
                      <span className="font-semibold text-sm md:text-base">{aptitudeStats.bestScore}%</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 border-b">
                      <span className="text-xs md:text-sm text-muted-foreground">Average</span>
                      <span className="font-semibold text-sm md:text-base">{aptitudeStats.averageScore}%</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5">
                      <span className="text-xs md:text-sm text-muted-foreground">Tests Taken</span>
                      <span className="font-semibold text-sm md:text-base">{aptitudeStats.totalTests}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border">
                  <CardHeader className="p-3 md:p-6 pb-2">
                    <CardTitle className="text-xs md:text-base text-foreground">Tests</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 md:p-6 pt-0">
                    <Link
                      href="/aptitude"
                      className="flex items-center justify-between p-3 rounded-md border hover:bg-accent transition-colors group"
                    >
                      <div className="flex items-center gap-2">
                        <Brain className="h-4 w-4" />
                        <span className="text-sm font-medium">Aptitude</span>
                      </div>
                      <Zap className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
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
