'use server';

import { db } from '@/lib/db';
import { 
  contests, 
  contestQuestions, 
  contestTestCases, 
  contestParticipants,
  contestSubmissions,
  contestLeaderboard,
  users
} from '@/lib/db/schema';
import { eq, and, desc, sql, asc } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

// ============================================
// CONTEST MANAGEMENT
// ============================================

// Create Contest
export async function createContest(data: {
  title: string;
  description: string;
  startTime: Date;
  durationMinutes: number;
  visibility: 'public' | 'private';
  accessCode?: string;
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const slug = data.title.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();
    const endTime = new Date(data.startTime.getTime() + data.durationMinutes * 60000);

    const [contest] = await db.insert(contests).values({
      title: data.title,
      description: data.description,
      slug,
      startTime: data.startTime,
      endTime,
      durationMinutes: data.durationMinutes,
      visibility: data.visibility,
      accessCode: data.accessCode,
      createdBy: session.user.id,
    }).returning();

    revalidatePath('/contest');
    return { success: true, data: contest };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Get All Contests
export async function getContests() {
  try {
    const allContests = await db
      .select({
        id: contests.id,
        title: contests.title,
        description: contests.description,
        slug: contests.slug,
        startTime: contests.startTime,
        endTime: contests.endTime,
        durationMinutes: contests.durationMinutes,
        status: contests.status,
        visibility: contests.visibility,
        createdBy: contests.createdBy,
        createdAt: contests.createdAt,
        creatorName: users.name,
      })
      .from(contests)
      .leftJoin(users, eq(contests.createdBy, users.id))
      .where(eq(contests.visibility, 'public'))
      .orderBy(desc(contests.startTime));

    return { success: true, data: allContests };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Get Contest by Slug
export async function getContest(slug: string) {
  try {
    const [contest] = await db
      .select({
        id: contests.id,
        title: contests.title,
        description: contests.description,
        slug: contests.slug,
        startTime: contests.startTime,
        endTime: contests.endTime,
        durationMinutes: contests.durationMinutes,
        status: contests.status,
        visibility: contests.visibility,
        accessCode: contests.accessCode,
        createdBy: contests.createdBy,
        createdAt: contests.createdAt,
        creatorName: users.name,
      })
      .from(contests)
      .leftJoin(users, eq(contests.createdBy, users.id))
      .where(eq(contests.slug, slug))
      .limit(1);

    if (!contest) {
      return { success: false, error: 'Contest not found' };
    }

    return { success: true, data: contest };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Update Contest Status (Auto-update based on time)
export async function updateContestStatus(contestId: string) {
  try {
    const [contest] = await db.select().from(contests).where(eq(contests.id, contestId)).limit(1);
    
    if (!contest) {
      return { success: false, error: 'Contest not found' };
    }

    const now = new Date();
    let newStatus: 'draft' | 'upcoming' | 'live' | 'ended' = 'draft';

    if (now < contest.startTime) {
      newStatus = 'upcoming';
    } else if (now >= contest.startTime && now <= contest.endTime) {
      newStatus = 'live';
    } else {
      newStatus = 'ended';
    }

    await db.update(contests).set({ status: newStatus }).where(eq(contests.id, contestId));

    return { success: true, status: newStatus };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Delete Contest
export async function deleteContest(contestId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Check if user is the creator
    const [contest] = await db.select().from(contests).where(eq(contests.id, contestId)).limit(1);
    
    if (!contest || contest.createdBy !== session.user.id) {
      return { success: false, error: 'Unauthorized to delete this contest' };
    }

    await db.delete(contests).where(eq(contests.id, contestId));

    revalidatePath('/contest');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ============================================
// QUESTION MANAGEMENT
// ============================================

// Add Question to Contest
export async function addContestQuestion(data: {
  contestId: string;
  title: string;
  description: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  points: number;
  orderIndex: number;
  timeLimitSeconds?: number;
  memoryLimitMb?: number;
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Verify user is contest creator
    const [contest] = await db.select().from(contests).where(eq(contests.id, data.contestId)).limit(1);
    if (!contest || contest.createdBy !== session.user.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const [question] = await db.insert(contestQuestions).values({
      ...data,
      timeLimitSeconds: data.timeLimitSeconds || 2,
      memoryLimitMb: data.memoryLimitMb || 256,
    }).returning();

    revalidatePath(`/contest/${contest.slug}`);
    return { success: true, data: question };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Get Contest Questions
export async function getContestQuestions(contestId: string) {
  try {
    const questions = await db
      .select()
      .from(contestQuestions)
      .where(eq(contestQuestions.contestId, contestId))
      .orderBy(asc(contestQuestions.orderIndex));
    
    return { success: true, data: questions };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Get Single Question
export async function getQuestion(questionId: string) {
  try {
    const [question] = await db
      .select()
      .from(contestQuestions)
      .where(eq(contestQuestions.id, questionId))
      .limit(1);

    if (!question) {
      return { success: false, error: 'Question not found' };
    }

    return { success: true, data: question };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Update Question
export async function updateQuestion(questionId: string, data: {
  title?: string;
  description?: string;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
  points?: number;
  timeLimitSeconds?: number;
  memoryLimitMb?: number;
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const [question] = await db
      .update(contestQuestions)
      .set(data)
      .where(eq(contestQuestions.id, questionId))
      .returning();

    return { success: true, data: question };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Delete Question
export async function deleteQuestion(questionId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    await db.delete(contestQuestions).where(eq(contestQuestions.id, questionId));

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ============================================
// TEST CASE MANAGEMENT
// ============================================

// Add Test Case
export async function addTestCase(data: {
  questionId: string;
  input: string;
  expectedOutput: string;
  isSample: boolean;
  isHidden: boolean;
  points: number;
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const [testCase] = await db.insert(contestTestCases).values(data).returning();

    return { success: true, data: testCase };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Get All Test Cases (Admin Only)
export async function getAllTestCases(questionId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const testCases = await db
      .select()
      .from(contestTestCases)
      .where(eq(contestTestCases.questionId, questionId));

    return { success: true, data: testCases };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Get Sample Test Cases (Public)
export async function getSampleTestCases(questionId: string) {
  try {
    const testCases = await db
      .select()
      .from(contestTestCases)
      .where(
        and(
          eq(contestTestCases.questionId, questionId),
          eq(contestTestCases.isSample, true)
        )
      );

    return { success: true, data: testCases };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Update Test Case
export async function updateTestCase(testCaseId: string, data: {
  input?: string;
  expectedOutput?: string;
  isSample?: boolean;
  isHidden?: boolean;
  points?: number;
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const [testCase] = await db
      .update(contestTestCases)
      .set(data)
      .where(eq(contestTestCases.id, testCaseId))
      .returning();

    return { success: true, data: testCase };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Delete Test Case
export async function deleteTestCase(testCaseId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    await db.delete(contestTestCases).where(eq(contestTestCases.id, testCaseId));

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ============================================
// PARTICIPATION
// ============================================

// Join Contest
export async function joinContest(contestId: string, accessCode?: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Check if contest exists and validate access code
    const [contest] = await db.select().from(contests).where(eq(contests.id, contestId)).limit(1);
    
    if (!contest) {
      return { success: false, error: 'Contest not found' };
    }

    if (contest.visibility === 'private' && contest.accessCode !== accessCode) {
      return { success: false, error: 'Invalid access code' };
    }

    // Check if already joined
    const existing = await db.select().from(contestParticipants)
      .where(and(
        eq(contestParticipants.contestId, contestId),
        eq(contestParticipants.userId, session.user.id)
      )).limit(1);

    if (existing.length > 0) {
      return { success: true, message: 'Already joined' };
    }

    await db.insert(contestParticipants).values({
      contestId,
      userId: session.user.id,
    });

    // Initialize leaderboard entry
    await db.insert(contestLeaderboard).values({
      contestId,
      userId: session.user.id,
      totalScore: 0,
      problemsSolved: 0,
      totalTimeMinutes: 0,
    });

    revalidatePath(`/contest/${contest.slug}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Check Participation
export async function checkParticipation(contestId: string, userId: string) {
  try {
    const [participant] = await db
      .select()
      .from(contestParticipants)
      .where(
        and(
          eq(contestParticipants.contestId, contestId),
          eq(contestParticipants.userId, userId)
        )
      )
      .limit(1);

    return { success: true, isParticipant: !!participant };
  } catch (error: any) {
    return { success: false, error: error.message, isParticipant: false };
  }
}

// Get Contest Participants
export async function getContestParticipants(contestId: string) {
  try {
    const participants = await db
      .select({
        id: contestParticipants.id,
        userId: contestParticipants.userId,
        userName: users.name,
        userImage: users.image,
        joinedAt: contestParticipants.joinedAt,
      })
      .from(contestParticipants)
      .leftJoin(users, eq(contestParticipants.userId, users.id))
      .where(eq(contestParticipants.contestId, contestId));

    return { success: true, data: participants };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ============================================
// CODE EXECUTION & SUBMISSION
// ============================================

// Run Test Cases (Before Submit)
export async function runTestCases(data: {
  questionId: string;
  code: string;
  language: string;
  testCaseIds: string[];
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Helper function to normalize output for comparison
    const normalizeOutput = (str: string) => {
      return str
        .trim()
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .join('\n');
    };

    // Get test cases
    const testCases = await db
      .select()
      .from(contestTestCases)
      .where(eq(contestTestCases.questionId, data.questionId));

    const results = [];

    // Run code against each test case
    for (const testCase of testCases) {
      if (!data.testCaseIds.includes(testCase.id)) continue;

      try {
        // Get the base URL - use multiple fallbacks
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                       process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                       'http://localhost:3000';

        const response = await fetch(`${baseUrl}/api/compile`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            language: data.language,
            code: data.code,
            stdin: testCase.input,
          }),
        });

        if (!response.ok) {
          throw new Error(`API returned ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();

        // Check for errors first
        if (!result.success || result.stderr || result.exitCode !== 0) {
          results.push({
            testCaseId: testCase.id,
            passed: false,
            expected: testCase.expectedOutput,
            actual: result.stderr || result.error || result.output || 'Runtime Error',
            executionTime: result.executionTime || 0,
            error: result.stderr || result.error || 'Runtime Error',
          });
          continue;
        }

        const normalizedExpected = normalizeOutput(testCase.expectedOutput);
        const normalizedActual = normalizeOutput(result.output || '');
        const passed = normalizedExpected === normalizedActual;

        results.push({
          testCaseId: testCase.id,
          passed,
          expected: testCase.expectedOutput,
          actual: result.output || 'No output',
          executionTime: result.executionTime || 0,
          error: passed ? undefined : `Expected: "${testCase.expectedOutput.trim()}", Got: "${(result.output || '').trim()}"`,
        });
      } catch (error: any) {
        results.push({
          testCaseId: testCase.id,
          passed: false,
          expected: testCase.expectedOutput,
          actual: 'Network Error',
          executionTime: 0,
          error: error.message || 'Failed to execute test',
        });
      }
    }

    return { success: true, data: results };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Submit Solution
export async function submitSolution(data: {
  contestId: string;
  questionId: string;
  code: string;
  language: string;
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Helper function to normalize output for comparison
    const normalizeOutput = (str: string) => {
      return str
        .trim()
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .join('\n');
    };

    // Get all test cases (including hidden)
    const testCases = await db
      .select()
      .from(contestTestCases)
      .where(eq(contestTestCases.questionId, data.questionId));

    let passedTests = 0;
    let totalScore = 0;
    let verdict: 'pending' | 'accepted' | 'wrong_answer' | 'runtime_error' | 'time_limit_exceeded' | 'compilation_error' = 'pending';
    let errorMessage = '';
    let executionTimeMs = 0;

    // Run code against all test cases
    for (const testCase of testCases) {
      try {
        const startTime = Date.now();
        
        // Get the base URL - use multiple fallbacks
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                       process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                       'http://localhost:3000';
        
        const response = await fetch(`${baseUrl}/api/compile`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            language: data.language,
            code: data.code,
            stdin: testCase.input,
          }),
        });

        const endTime = Date.now();
        executionTimeMs = Math.max(executionTimeMs, endTime - startTime);

        if (!response.ok) {
          throw new Error(`API returned ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();

        if (result.timeout) {
          verdict = 'time_limit_exceeded';
          errorMessage = 'Time limit exceeded';
          break;
        }

        if (!result.success) {
          verdict = 'compilation_error';
          errorMessage = result.stderr || result.error || 'Compilation failed';
          break;
        }

        const normalizedExpected = normalizeOutput(testCase.expectedOutput);
        const normalizedActual = normalizeOutput(result.output || '');
        
        if (normalizedExpected === normalizedActual) {
          passedTests++;
          totalScore += testCase.points;
        } else {
          if (verdict === 'pending') {
            verdict = 'wrong_answer';
            errorMessage = `Expected: "${testCase.expectedOutput.trim()}", Got: "${(result.output || '').trim()}"`;
          }
        }
      } catch (error) {
        verdict = 'runtime_error';
        errorMessage = 'Runtime error occurred';
        break;
      }
    }

    // If all tests passed
    if (passedTests === testCases.length) {
      verdict = 'accepted';
      errorMessage = '';
    }

    // Create submission record
    const [submission] = await db.insert(contestSubmissions).values({
      contestId: data.contestId,
      questionId: data.questionId,
      userId: session.user.id,
      code: data.code,
      language: data.language,
      verdict: verdict,
      score: totalScore,
      passedTestCases: passedTests,
      totalTestCases: testCases.length,
      executionTimeMs,
      errorMessage,
    }).returning();

    // Update leaderboard
    await updateLeaderboard(data.contestId, session.user.id);

    revalidatePath(`/contest/${data.contestId}`);
    return { success: true, data: submission };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Get User Submissions
export async function getUserSubmissions(contestId: string, userId: string) {
  try {
    const submissions = await db
      .select({
        id: contestSubmissions.id,
        questionId: contestSubmissions.questionId,
        questionTitle: contestQuestions.title,
        code: contestSubmissions.code,
        language: contestSubmissions.language,
        verdict: contestSubmissions.verdict,
        score: contestSubmissions.score,
        passedTestCases: contestSubmissions.passedTestCases,
        totalTestCases: contestSubmissions.totalTestCases,
        executionTimeMs: contestSubmissions.executionTimeMs,
        errorMessage: contestSubmissions.errorMessage,
        submittedAt: contestSubmissions.submittedAt,
      })
      .from(contestSubmissions)
      .leftJoin(contestQuestions, eq(contestSubmissions.questionId, contestQuestions.id))
      .where(
        and(
          eq(contestSubmissions.contestId, contestId),
          eq(contestSubmissions.userId, userId)
        )
      )
      .orderBy(desc(contestSubmissions.submittedAt));

    return { success: true, data: submissions };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ============================================
// LEADERBOARD
// ============================================

// Update Leaderboard
async function updateLeaderboard(contestId: string, userId: string) {
  try {
    // Calculate user's total score and problems solved
    const stats = await db
      .select({
        totalScore: sql<number>`COALESCE(SUM(CASE WHEN ${contestSubmissions.verdict} = 'accepted' THEN ${contestSubmissions.score} ELSE 0 END), 0)`,
        problemsSolved: sql<number>`COUNT(DISTINCT CASE WHEN ${contestSubmissions.verdict} = 'accepted' THEN ${contestSubmissions.questionId} END)`,
        lastSubmission: sql<Date>`MAX(${contestSubmissions.submittedAt})`,
      })
      .from(contestSubmissions)
      .where(
        and(
          eq(contestSubmissions.contestId, contestId),
          eq(contestSubmissions.userId, userId)
        )
      );

    if (stats.length > 0 && stats[0].lastSubmission) {
      const stat = stats[0];
      
      // Get contest start time to calculate total time
      const [contest] = await db.select().from(contests).where(eq(contests.id, contestId)).limit(1);
      const timeInMinutes = Math.floor(
        (new Date(stat.lastSubmission).getTime() - new Date(contest.startTime).getTime()) / 60000
      );

      await db
        .update(contestLeaderboard)
        .set({
          totalScore: Number(stat.totalScore),
          problemsSolved: Number(stat.problemsSolved),
          totalTimeMinutes: timeInMinutes,
          lastSubmissionTime: new Date(stat.lastSubmission),
        })
        .where(
          and(
            eq(contestLeaderboard.contestId, contestId),
            eq(contestLeaderboard.userId, userId)
          )
        );

      // Update ranks
      await updateRanks(contestId);
    }
  } catch (error) {
    console.error('Error updating leaderboard:', error);
  }
}

// Update Ranks
async function updateRanks(contestId: string) {
  try {
    const leaderboard = await db
      .select()
      .from(contestLeaderboard)
      .where(eq(contestLeaderboard.contestId, contestId))
      .orderBy(
        desc(contestLeaderboard.totalScore),
        asc(contestLeaderboard.totalTimeMinutes)
      );

    for (let i = 0; i < leaderboard.length; i++) {
      await db
        .update(contestLeaderboard)
        .set({ rank: i + 1 })
        .where(eq(contestLeaderboard.id, leaderboard[i].id));
    }
  } catch (error) {
    console.error('Error updating ranks:', error);
  }
}

// Get Leaderboard
export async function getLeaderboard(contestId: string) {
  try {
    const leaderboard = await db
      .select({
        rank: contestLeaderboard.rank,
        userId: contestLeaderboard.userId,
        userName: users.name,
        userImage: users.image,
        totalScore: contestLeaderboard.totalScore,
        problemsSolved: contestLeaderboard.problemsSolved,
        totalTimeMinutes: contestLeaderboard.totalTimeMinutes,
        lastSubmissionTime: contestLeaderboard.lastSubmissionTime,
      })
      .from(contestLeaderboard)
      .leftJoin(users, eq(contestLeaderboard.userId, users.id))
      .where(eq(contestLeaderboard.contestId, contestId))
      .orderBy(asc(contestLeaderboard.rank));

    return { success: true, data: leaderboard };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Get User Rank
export async function getUserRank(contestId: string, userId: string) {
  try {
    const [userEntry] = await db
      .select()
      .from(contestLeaderboard)
      .where(
        and(
          eq(contestLeaderboard.contestId, contestId),
          eq(contestLeaderboard.userId, userId)
        )
      )
      .limit(1);

    return { success: true, data: userEntry };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
