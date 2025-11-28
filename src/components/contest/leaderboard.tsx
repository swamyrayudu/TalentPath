import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trophy, Medal, Award, Clock } from 'lucide-react';
import React from 'react'
interface LeaderboardProps {
  leaderboard: Array<{
    rank: number | null;
    userId: string;
    userName: string | null;
    userImage: string | null;
    totalScore: number;
    problemsSolved: number;
    totalTimeMinutes: number;
  }>;
  compact?: boolean;
}

export function ContestLeaderboard({ leaderboard, compact = false }: LeaderboardProps) {
  const formatTime = (minutes: number) => {
    if (minutes < 0) return '0 min';
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins} min`;
  };

  const getRankIcon = (rank: number | null) => {
    if (!rank) return null;
    
    switch (rank) {
      case 1:
        return <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />;
      case 2:
        return <Medal className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />;
      case 3:
        return <Award className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />;
      default:
        return <span className="text-xs sm:text-sm text-muted-foreground font-bold">#{rank}</span>;
    }
  };

  const getRankBadge = (rank: number | null) => {
    if (!rank) return null;
    
    switch (rank) {
      case 1:
        return <Badge className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs">1st</Badge>;
      case 2:
        return <Badge variant="secondary" className="text-xs">2nd</Badge>;
      case 3:
        return <Badge className="bg-orange-600 hover:bg-orange-700 text-white text-xs">3rd</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">#{rank}</Badge>;
    }
  };

  if (leaderboard.length === 0) {
    return (
      <Card className="border bg-card">
        <CardContent className="flex flex-col items-center justify-center py-10 sm:py-16">
          <div className="p-3 sm:p-4 rounded-full bg-muted inline-block mb-3 sm:mb-4">
            <Trophy className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground" />
          </div>
          <h3 className="text-base sm:text-lg font-semibold mb-1.5 sm:mb-2">No Submissions Yet</h3>
          <p className="text-xs sm:text-sm text-muted-foreground">Be the first to solve problems!</p>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <Card className="border bg-card">
        <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-6">
          <CardTitle className="text-sm sm:text-base flex items-center gap-1.5 sm:gap-2">
            <Trophy className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
            Top Participants
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0">
          <div className="space-y-2">
            {leaderboard.slice(0, 5).map((entry) => (
              <div key={entry.userId} className="flex items-center gap-2 p-1.5 sm:p-2 rounded-md hover:bg-accent/50 transition-colors">
                <div className="w-5 sm:w-6 flex justify-center flex-shrink-0">
                  {getRankIcon(entry.rank)}
                </div>
                <Avatar className="h-6 w-6 sm:h-7 sm:w-7">
                  <AvatarImage src={entry.userImage || undefined} />
                  <AvatarFallback className="text-[10px] sm:text-xs">{entry.userName?.[0] || 'U'}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium truncate">{entry.userName || 'Anonymous'}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    {entry.totalScore} pts • {entry.problemsSolved} solved
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border bg-card">
      <CardHeader className="p-3 sm:p-4 md:p-5">
        <CardTitle className="text-base sm:text-base md:text-lg flex items-center gap-1.5 sm:gap-2">
          <Trophy className="h-4 w-4 sm:h-4 sm:w-4 md:h-5 md:w-5 text-primary" />
          Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 md:p-5 pt-0">
        <div className="space-y-2.5 sm:space-y-3">
          {leaderboard.map((entry) => (
            <Card key={entry.userId} className={`${entry.rank && entry.rank <= 3 ? 'border-2 border-primary/50' : 'border'}`}>
              <CardContent className="p-3 sm:p-3.5">
                <div className="flex items-start sm:items-center gap-2 sm:gap-3">
                  <div className="w-6 sm:w-7 flex justify-center items-center flex-shrink-0">
                    {getRankIcon(entry.rank)}
                  </div>
                  
                  <Avatar className="h-8 w-8 sm:h-9 sm:w-9">
                    <AvatarImage src={entry.userImage || undefined} />
                    <AvatarFallback className="text-xs sm:text-sm">{entry.userName?.[0] || 'U'}</AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1.5 sm:mb-2">
                      <p className="font-semibold text-sm sm:text-sm truncate">{entry.userName || 'Anonymous'}</p>
                      {getRankBadge(entry.rank)}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Trophy className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span>{entry.totalScore} pts</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Award className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span>{entry.problemsSolved} solved</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span>{formatTime(entry.totalTimeMinutes)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
