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
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-orange-500" />;
      default:
        return <span className="text-muted-foreground font-bold">#{rank}</span>;
    }
  };

  const getRankBadge = (rank: number | null) => {
    if (!rank) return null;
    
    switch (rank) {
      case 1:
        return <Badge className="bg-yellow-500">🥇 1st Place</Badge>;
      case 2:
        return <Badge className="bg-gray-400">🥈 2nd Place</Badge>;
      case 3:
        return <Badge className="bg-orange-500">🥉 3rd Place</Badge>;
      default:
        return <Badge variant="outline">#{rank}</Badge>;
    }
  };

  if (leaderboard.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Trophy className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Submissions Yet</h3>
          <p className="text-muted-foreground">Be the first to solve problems!</p>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Top Participants
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {leaderboard.slice(0, 5).map((entry) => (
              <div key={entry.userId} className="flex items-center gap-3">
                <div className="w-8 flex justify-center">
                  {getRankIcon(entry.rank)}
                </div>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={entry.userImage || undefined} />
                  <AvatarFallback>{entry.userName?.[0] || 'U'}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{entry.userName || 'Anonymous'}</p>
                  <p className="text-xs text-muted-foreground">
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-6 w-6 text-yellow-500" />
          Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {leaderboard.map((entry) => (
            <Card key={entry.userId} className={entry.rank && entry.rank <= 3 ? 'border-2 border-yellow-500' : ''}>
              <CardContent className="pt-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 flex justify-center items-center">
                    {getRankIcon(entry.rank)}
                  </div>
                  
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={entry.userImage || undefined} />
                    <AvatarFallback className="text-lg">{entry.userName?.[0] || 'U'}</AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-lg">{entry.userName || 'Anonymous'}</p>
                      {getRankBadge(entry.rank)}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Trophy className="h-4 w-4" />
                        <span>{entry.totalScore} points</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Award className="h-4 w-4" />
                        <span>{entry.problemsSolved} solved</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
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
