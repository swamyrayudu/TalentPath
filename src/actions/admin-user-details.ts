'use server';

import { auth } from '../lib/auth';
import { db } from '@/lib/db';
import { 
  users, 
  userProgress, 
  problems,
  aptitudeResults, 
  userRoadmapProgress,
  roadmaps,
  contestParticipants,
  contests,
  contestSubmissions,
  contestLeaderboard,
  chatConversations,
  chatMessages,
  mockInterviews,
  interviewQuestions
} from '@/lib/db/schema';
import { eq, desc, count } from 'drizzle-orm';

export async function getUserDetailsById(userId: string) {
  const session = await auth();

  if (!session) {
    throw new Error('Unauthorized: Please login');
  }

  // Check if current user is admin
  const currentUser = await db.query.users.findFirst({
    where: eq(users.email, session.user?.email || ''),
  });

  if (currentUser?.role !== 'admin') {
    throw new Error('Unauthorized: Admin access required');
  }

  // Get user basic info
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Get DSA progress
  const dsaProgress = await db
    .select({
      status: userProgress.status,
      count: count(),
    })
    .from(userProgress)
    .where(eq(userProgress.userId, userId))
    .groupBy(userProgress.status);

  // Get DSA solved problems with details
  const solvedProblems = await db
    .select({
      problemId: userProgress.problemId,
      status: userProgress.status,
      solvedAt: userProgress.solvedAt,
      language: userProgress.language,
      problemTitle: problems.title,
      difficulty: problems.difficulty,
      platform: problems.platform,
    })
    .from(userProgress)
    .leftJoin(problems, eq(userProgress.problemId, problems.id))
    .where(eq(userProgress.userId, userId))
    .orderBy(desc(userProgress.solvedAt))
    .limit(50);

  // Get aptitude results
  const aptitudeData = await db
    .select()
    .from(aptitudeResults)
    .where(eq(aptitudeResults.userId, userId))
    .orderBy(desc(aptitudeResults.completedAt));

  // Get roadmap progress
  const roadmapProgress = await db
    .select({
      id: userRoadmapProgress.id,
      roadmapId: userRoadmapProgress.roadmapId,
      completedSteps: userRoadmapProgress.completedSteps,
      startedAt: userRoadmapProgress.startedAt,
      lastUpdated: userRoadmapProgress.lastUpdated,
      roadmapTitle: roadmaps.title,
      roadmapCategory: roadmaps.category,
    })
    .from(userRoadmapProgress)
    .leftJoin(roadmaps, eq(userRoadmapProgress.roadmapId, roadmaps.id))
    .where(eq(userRoadmapProgress.userId, userId))
    .orderBy(desc(userRoadmapProgress.lastUpdated));

  // Get contest participation
  const contestsParticipated = await db
    .select({
      contestId: contestParticipants.contestId,
      joinedAt: contestParticipants.joinedAt,
      contestTitle: contests.title,
      contestStatus: contests.status,
      contestStartTime: contests.startTime,
      contestEndTime: contests.endTime,
    })
    .from(contestParticipants)
    .leftJoin(contests, eq(contestParticipants.contestId, contests.id))
    .where(eq(contestParticipants.userId, userId))
    .orderBy(desc(contestParticipants.joinedAt));

  // Get contest submissions
  const submissions = await db
    .select()
    .from(contestSubmissions)
    .where(eq(contestSubmissions.userId, userId))
    .orderBy(desc(contestSubmissions.submittedAt))
    .limit(20);

  // Get leaderboard entries
  const leaderboardEntries = await db
    .select({
      contestId: contestLeaderboard.contestId,
      totalScore: contestLeaderboard.totalScore,
      problemsSolved: contestLeaderboard.problemsSolved,
      rank: contestLeaderboard.rank,
      contestTitle: contests.title,
    })
    .from(contestLeaderboard)
    .leftJoin(contests, eq(contestLeaderboard.contestId, contests.id))
    .where(eq(contestLeaderboard.userId, userId))
    .orderBy(desc(contestLeaderboard.totalScore));

  // Get chat conversations with message count
  const conversations = await db
    .select({
      id: chatConversations.id,
      title: chatConversations.title,
      createdAt: chatConversations.createdAt,
      updatedAt: chatConversations.updatedAt,
    })
    .from(chatConversations)
    .where(eq(chatConversations.userId, userId))
    .orderBy(desc(chatConversations.updatedAt));

  // Get total chat messages count
  const totalMessagesResult = await db
    .select({ count: count() })
    .from(chatMessages)
    .innerJoin(chatConversations, eq(chatMessages.conversationId, chatConversations.id))
    .where(eq(chatConversations.userId, userId));

  const totalMessages = totalMessagesResult[0]?.count || 0;

  // Get mock interviews
  const interviews = await db
    .select()
    .from(mockInterviews)
    .where(eq(mockInterviews.userId, userId))
    .orderBy(desc(mockInterviews.createdAt));

  // Get interview questions count per interview
  const interviewStats = await Promise.all(
    interviews.map(async (interview) => {
      const questionsCount = await db
        .select({ count: count() })
        .from(interviewQuestions)
        .where(eq(interviewQuestions.interviewId, interview.id));
      return {
        ...interview,
        questionsCount: questionsCount[0]?.count || 0,
      };
    })
  );

  // Calculate summary stats
  const dsaSummary = {
    solved: dsaProgress.find((p) => p.status === 'solved')?.count || 0,
    attempted: dsaProgress.find((p) => p.status === 'attempted')?.count || 0,
    bookmarked: dsaProgress.find((p) => p.status === 'bookmarked')?.count || 0,
  };

  const aptitudeSummary = {
    totalAttempts: aptitudeData.length,
    averageScore: aptitudeData.length > 0 
      ? Math.round(aptitudeData.reduce((acc, curr) => acc + curr.score, 0) / aptitudeData.length)
      : 0,
    topicsAttempted: [...new Set(aptitudeData.map((a) => a.topic))].length,
  };

  const contestSummary = {
    participated: contestsParticipated.length,
    totalSubmissions: submissions.length,
    bestRank: leaderboardEntries.length > 0 
      ? Math.min(...leaderboardEntries.filter(e => e.rank).map((e) => e.rank || 999))
      : null,
  };

  // Calculate time spent on website based on actual data
  const calculateTimeSpent = () => {
    let totalMinutes = 0;
    
    // 1. Aptitude tests: use ACTUAL time taken (most accurate)
    aptitudeData.forEach(test => {
      if (test.timeTaken) {
        totalMinutes += Math.floor(test.timeTaken / 60);
      }
    });
    
    // 2. Mock interviews: use ACTUAL duration
    interviews.forEach(interview => {
      if (interview.duration) {
        totalMinutes += Math.floor(interview.duration / 60);
      }
    });
    
    // 3. Contest participation: Calculate actual time between join and end
    contestsParticipated.forEach(contest => {
      if (contest.joinedAt && contest.contestEndTime) {
        const joinTime = new Date(contest.joinedAt).getTime();
        const endTime = new Date(contest.contestEndTime).getTime();
        const now = Date.now();
        
        // Use the earlier of contest end time or now
        const actualEndTime = Math.min(endTime, now);
        
        if (actualEndTime > joinTime) {
          const duration = actualEndTime - joinTime;
          totalMinutes += Math.floor(duration / (1000 * 60));
        }
      }
    });
    
    // 4. DSA problems: Analyze timestamps between consecutive solves
    const sortedDsaProgress = [...solvedProblems]
      .filter(p => p.solvedAt)
      .sort((a, b) => new Date(a.solvedAt!).getTime() - new Date(b.solvedAt!).getTime());
    
    for (let i = 0; i < sortedDsaProgress.length; i++) {
      if (i === 0) {
        // First problem: assume 20 minutes
        totalMinutes += 20;
      } else {
        const prevTime = new Date(sortedDsaProgress[i - 1].solvedAt!).getTime();
        const currTime = new Date(sortedDsaProgress[i].solvedAt!).getTime();
        const diffMinutes = Math.floor((currTime - prevTime) / (1000 * 60));
        
        // If problems solved within reasonable session time (< 2 hours), count the gap
        // Otherwise just count 20 minutes for the problem
        if (diffMinutes <= 120) {
          totalMinutes += Math.min(diffMinutes, 60); // Cap at 60 min per problem
        } else {
          totalMinutes += 20;
        }
      }
    }
    
    // 5. Chat conversations: Analyze message timestamps
    let chatMinutes = 0;
    conversations.forEach(conv => {
      const convStart = new Date(conv.createdAt).getTime();
      const convEnd = new Date(conv.updatedAt).getTime();
      const duration = Math.floor((convEnd - convStart) / (1000 * 60));
      
      // Cap each conversation at 60 minutes
      chatMinutes += Math.min(duration, 60);
    });
    
    // Add base 2 minutes per message for active chatting
    chatMinutes += totalMessages * 2;
    totalMinutes += chatMinutes;
    
    // 6. Roadmap progress: Time between start and last update
    roadmapProgress.forEach(rp => {
      const start = new Date(rp.startedAt).getTime();
      const lastUpdate = new Date(rp.lastUpdated).getTime();
      const duration = Math.floor((lastUpdate - start) / (1000 * 60));
      
      // Count time spent on roadmap (max 8 hours per roadmap)
      totalMinutes += Math.min(duration, 480);
    });
    
    // Calculate metadata
    const daysSinceJoined = user.createdAt 
      ? Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))
      : 0;
    
    const totalActivities = dsaSummary.solved + dsaSummary.attempted + 
                           aptitudeData.length + contestsParticipated.length + 
                           conversations.length + interviews.length;
    
    const estimatedSessions = Math.max(Math.ceil(totalActivities / 3), 1);
    
    return {
      totalMinutes,
      totalHours: Math.floor(totalMinutes / 60),
      displayHours: Math.floor(totalMinutes / 60),
      displayMinutes: totalMinutes % 60,
      daysSinceJoined,
      averageMinutesPerDay: daysSinceJoined > 0 ? Math.floor(totalMinutes / daysSinceJoined) : 0,
      estimatedSessions,
      averageSessionDuration: estimatedSessions > 0 ? Math.floor(totalMinutes / estimatedSessions) : 0,
    };
  };

  const timeSpent = calculateTimeSpent();

  return {
    user,
    dsaSummary,
    dsaProgress: solvedProblems,
    aptitudeSummary,
    aptitudeResults: aptitudeData,
    roadmapProgress,
    contestSummary,
    contestsParticipated,
    contestSubmissions: submissions,
    leaderboardEntries,
    chatHistory: {
      conversations,
      totalMessages,
    },
    interviews: interviewStats,
    timeSpent,
  };
}

export async function getChatMessagesForConversation(conversationId: string) {
  const session = await auth();

  if (!session) {
    throw new Error('Unauthorized: Please login');
  }

  // Check if current user is admin
  const currentUser = await db.query.users.findFirst({
    where: eq(users.email, session.user?.email || ''),
  });

  if (currentUser?.role !== 'admin') {
    throw new Error('Unauthorized: Admin access required');
  }

  const messages = await db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.conversationId, conversationId))
    .orderBy(chatMessages.createdAt);

  return messages;
}
