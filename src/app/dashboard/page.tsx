import { auth } from '../../lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { 
  userProgress, 
  problems, 
} from '@/lib/db/schema';
import { eq, desc, and, sql } from 'drizzle-orm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar, Code2, Trophy, Target, TrendingUp, CheckCircle2, Clock, Flame } from 'lucide-react';
import Link from 'next/link';

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

  // Calculate statistics
  const solved = userProgressData.filter(p => p.progress.status === 'solved');
  const stats = {
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
    const today = new Date().toDateString();
    
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto p-4 md:p-8 space-y-8 max-w-7xl">
        {/* Header Section */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            {session.user.name || 'User'}
          </h1>
          <p className="text-muted-foreground flex items-center gap-2">
            <Code2 className="h-4 w-4" />
            Track your coding journey
          </p>
        </div>

        {/* Stats Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Solved */}
          <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Problems Solved</CardTitle>
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-500">{stats.totalSolved}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Total solved problems
              </p>
            </CardContent>
          </Card>

          {/* Easy Problems */}
          <Card className="border-2 hover:border-emerald-500/50 transition-all hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Easy</CardTitle>
              <Target className="h-5 w-5 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-500">{stats.easy}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Easy problems solved
              </p>
            </CardContent>
          </Card>

          {/* Medium Problems */}
          <Card className="border-2 hover:border-amber-500/50 transition-all hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Medium</CardTitle>
              <Target className="h-5 w-5 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-500">{stats.medium}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Medium problems solved
              </p>
            </CardContent>
          </Card>

          {/* Hard Problems */}
          <Card className="border-2 hover:border-rose-500/50 transition-all hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hard</CardTitle>
              <Trophy className="h-5 w-5 text-rose-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-rose-500">{stats.hard}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Hard problems solved
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Progress Section - 2 columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Difficulty Progress */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Progress by Difficulty
                </CardTitle>
                <CardDescription>Your solving distribution</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Easy */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                      Easy
                    </span>
                    <span className="text-muted-foreground">{stats.easy} solved</span>
                  </div>
                  <Progress value={(stats.easy / Math.max(stats.totalSolved, 1)) * 100} className="h-2 bg-emerald-500/20" />
                </div>

                {/* Medium */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                      Medium
                    </span>
                    <span className="text-muted-foreground">{stats.medium} solved</span>
                  </div>
                  <Progress value={(stats.medium / Math.max(stats.totalSolved, 1)) * 100} className="h-2 bg-amber-500/20" />
                </div>

                {/* Hard */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                      Hard
                    </span>
                    <span className="text-muted-foreground">{stats.hard} solved</span>
                  </div>
                  <Progress value={(stats.hard / Math.max(stats.totalSolved, 1)) * 100} className="h-2 bg-rose-500/20" />
                </div>
              </CardContent>
            </Card>

            {/* Recent Submissions */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Submissions
                </CardTitle>
                <CardDescription>Your latest solved problems</CardDescription>
              </CardHeader>
              <CardContent>
                {stats.recentSubmissions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Code2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No submissions yet</p>
                    <p className="text-sm mt-2">Start solving problems to see your progress!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {stats.recentSubmissions.map((item, index) => (
                      <div
                        key={item.progress.id}
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{item.problem?.title || 'Unknown Problem'}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.progress.solvedAt ? new Date(item.progress.solvedAt).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            item.problem?.difficulty === 'EASY'
                              ? 'border-emerald-500 text-emerald-500'
                              : item.problem?.difficulty === 'MEDIUM'
                              ? 'border-amber-500 text-amber-500'
                              : 'border-rose-500 text-rose-500'
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

          {/* Sidebar - 1 column */}
          <div className="space-y-6">
            {/* Streak Card */}
            <Card className="border-2 bg-gradient-to-br from-orange-500/10 to-rose-500/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flame className="h-5 w-5 text-orange-500" />
                  Current Streak
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-5xl font-bold bg-gradient-to-r from-orange-500 to-rose-500 bg-clip-text text-transparent">
                    {streak}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {streak === 1 ? 'day' : 'days'} streak
                  </p>
                  <p className="text-xs text-muted-foreground mt-4">
                    Keep solving to maintain your streak! 🔥
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Problems</span>
                  <span className="font-bold text-lg">{stats.totalSolved}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Success Rate</span>
                  <span className="font-bold text-lg text-emerald-500">
                    {stats.totalSolved > 0 ? '100%' : '0%'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Active Days</span>
                  <span className="font-bold text-lg">{streak}</span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-2 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link
                  href="/problems"
                  className="flex items-center gap-2 p-3 rounded-lg border-2 hover:border-primary hover:bg-primary/5 transition-all"
                >
                  <Code2 className="h-5 w-5 text-primary" />
                  <span className="font-medium">Browse Problems</span>
                </Link>
                <Link
                  href="/companies"
                  className="flex items-center gap-2 p-3 rounded-lg border-2 hover:border-primary hover:bg-primary/5 transition-all"
                >
                  <Trophy className="h-5 w-5 text-primary" />
                  <span className="font-medium">Company Questions</span>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
