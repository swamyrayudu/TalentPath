'use server';

import { db } from '@/lib/db';
import { 
  contests, 
  contestQuestions, 
  contestTestCases, 
  contestParticipants,
  contestSubmissions,
  contestLeaderboard,
  users,
  adminQuestions,
  adminTestCases
} from '@/lib/db/schema';
import { eq, and, desc, sql, asc, or } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
// Helper function to get the base URL for API calls
async function getBaseUrl(): Promise<string> {
  // In production with NEXT_PUBLIC_APP_URL set
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  
  // In Vercel deployment
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  // Try to get from headers (must be async in Next.js 15)
  try {
    const { headers } = await import('next/headers');
    const headersList = await headers();
    const host = headersList.get('host');
    const protocol = headersList.get('x-forwarded-proto') || 'http';
    if (host) {
      return `${protocol}://${host}`;
    }
  } catch {
    // Headers not available in this context
  }
  
  // Fallback for local development
  return 'http://localhost:3000';
}

// ============================================
// CONTEST MANAGEMENT
// ============================================

// Create Contest
export async function createContest(data: {
  title: string;
  description: string;
  slug?: string;
  startTime: Date;
  endTime?: Date;
  durationMinutes?: number;
  visibility?: 'public' | 'private';
  isPublic?: boolean;
  maxParticipants?: number | null;
  accessCode?: string;
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Generate slug if not provided
    const contestSlug = data.slug || data.title.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();
    
    // Calculate endTime and durationMinutes
    let endTime: Date;
    let durationMinutes: number;
    
    if (data.endTime) {
      endTime = data.endTime;
      durationMinutes = Math.round((data.endTime.getTime() - data.startTime.getTime()) / 60000);
    } else if (data.durationMinutes) {
      durationMinutes = data.durationMinutes;
      endTime = new Date(data.startTime.getTime() + data.durationMinutes * 60000);
    } else {
      // Default to 2 hours if not specified
      durationMinutes = 120;
      endTime = new Date(data.startTime.getTime() + 120 * 60000);
    }

    // Determine visibility
    const visibility = data.visibility || (data.isPublic !== undefined ? (data.isPublic ? 'public' : 'private') : 'public');

    const [contest] = await db.insert(contests).values({
      title: data.title,
      description: data.description || '',
      slug: contestSlug,
      startTime: data.startTime,
      endTime,
      durationMinutes,
      visibility,
      accessCode: data.accessCode,
      createdBy: session.user.id,
    }).returning();

    revalidatePath('/contest');
    revalidatePath('/admin/contests');
    return { success: true, data: contest };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: errorMessage };
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

    // Calculate dynamic status based on current time
    const now = new Date();
    const contestsWithStatus = allContests.map(contest => {
      let status: 'draft' | 'upcoming' | 'live' | 'ended' = 'draft';
      
      if (contest.startTime && contest.endTime) {
        if (now < new Date(contest.startTime)) {
          status = 'upcoming';
        } else if (now >= new Date(contest.startTime) && now <= new Date(contest.endTime)) {
          status = 'live';
        } else {
          status = 'ended';
        }
      }
      
      return {
        ...contest,
        status,
      };
    });

    return { success: true, data: contestsWithStatus };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: errorMessage };
  }
}

// Get All Contests with Counts (Admin)
export async function getAllContests() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const allContests = await db
      .select({
        id: contests.id,
        title: contests.title,
        description: contests.description,
        slug: contests.slug,
        startTime: contests.startTime,
        endTime: contests.endTime,
        isPublic: sql<boolean>`${contests.visibility} = 'public'`,
        maxParticipants: sql<number | null>`NULL`,
        createdBy: contests.createdBy,
        createdAt: contests.createdAt,
        questionCount: sql<number>`(
          SELECT COUNT(*)::int 
          FROM ${contestQuestions} 
          WHERE ${contestQuestions.contestId} = ${contests.id}
        )`,
        participantCount: sql<number>`(
          SELECT COUNT(*)::int 
          FROM ${contestParticipants} 
          WHERE ${contestParticipants.contestId} = ${contests.id}
        )`,
      })
      .from(contests)
      .orderBy(desc(contests.createdAt));

    const contestsWithCounts = allContests.map(contest => ({
      ...contest,
      _count: {
        questions: contest.questionCount || 0,
        registrations: contest.participantCount || 0,
      },
    }));

    return { success: true, data: contestsWithCounts };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: errorMessage };
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
        updatedAt: contests.updatedAt,
        creatorName: users.name,
      })
      .from(contests)
      .leftJoin(users, eq(contests.createdBy, users.id))
      .where(eq(contests.slug, slug))
      .limit(1);

    if (!contest) {
      return { success: false, error: 'Contest not found' };
    }

    // Calculate dynamic status based on current time
    const now = new Date();
    let status: 'draft' | 'upcoming' | 'live' | 'ended' = 'draft';
    
    if (contest.startTime && contest.endTime) {
      if (now < new Date(contest.startTime)) {
        status = 'upcoming';
      } else if (now >= new Date(contest.startTime) && now <= new Date(contest.endTime)) {
        status = 'live';
      } else {
        status = 'ended';
      }
    }

    return { success: true, data: { ...contest, status } };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: errorMessage };
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
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: errorMessage };
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
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: errorMessage };
  }
}

// ============================================
// QUESTION MANAGEMENT
// ============================================

// Get All Questions from Library (for reuse) - Using admin questions
export async function getAllQuestionsFromLibrary(params?: {
  page?: number;
  limit?: number;
  search?: string;
  difficulty?: string;
  topic?: string;
}) {
  try {
    const { page = 1, limit = 50, search = "", difficulty = "all", topic = "all" } = params || {};
    
    // Build where conditions
    const conditions = [];
    conditions.push(eq(adminQuestions.isActive, true));

    if (search && search.trim() !== "") {
      conditions.push(
        or(
          sql`LOWER(${adminQuestions.title}) LIKE LOWER(${`%${search}%`})`,
          sql`LOWER(${adminQuestions.description}) LIKE LOWER(${`%${search}%`})`
        )
      );
    }

    if (difficulty !== "all") {
      const upperDifficulty = difficulty.toUpperCase() as "EASY" | "MEDIUM" | "HARD";
      conditions.push(eq(adminQuestions.difficulty, upperDifficulty));
    }

    // Topic filter using array contains
    if (topic !== "all") {
      conditions.push(sql`${adminQuestions.topics} @> ARRAY[${topic}]::text[]`);
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(adminQuestions)
      .where(where);

    const totalCount = countResult?.count || 0;

    // Get paginated questions with test case count
    const offset = (page - 1) * limit;
    const allQuestions = await db
      .select({
        id: adminQuestions.id,
        title: adminQuestions.title,
        description: adminQuestions.description,
        difficulty: adminQuestions.difficulty,
        points: adminQuestions.points,
        timeLimitSeconds: adminQuestions.timeLimitSeconds,
        memoryLimitMb: adminQuestions.memoryLimitMb,
        topics: adminQuestions.topics,
        createdAt: adminQuestions.createdAt,
        testCaseCount: sql<number>`(
          SELECT COUNT(*)::int 
          FROM ${adminTestCases} 
          WHERE ${adminTestCases.questionTitle} = ${adminQuestions.title}
        )`,
      })
      .from(adminQuestions)
      .where(where)
      .orderBy(desc(adminQuestions.createdAt))
      .limit(limit)
      .offset(offset);

    const hasMore = offset + allQuestions.length < totalCount;

    return {
      success: true,
      data: allQuestions,
      totalCount,
      hasMore,
      page,
      limit,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: errorMessage, data: [], totalCount: 0, hasMore: false, page: 1, limit: 50 };
  }
}

// Add Existing Question to Contest (with all test cases) - From Admin Library
export async function addExistingQuestionToContest(data: {
  contestId: string;
  existingQuestionId: string;
  orderIndex: number;
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

    // Check if contest has ended
    if (contest.status === 'ended' || (contest.endTime && new Date(contest.endTime) < new Date())) {
      return { success: false, error: 'Cannot add questions to an ended contest' };
    }

    // Get the original question from admin library
    const [originalQuestion] = await db
      .select()
      .from(adminQuestions)
      .where(eq(adminQuestions.id, data.existingQuestionId))
      .limit(1);

    if (!originalQuestion) {
      return { success: false, error: 'Question not found' };
    }

    // Create a copy of the question for this contest
    const [newQuestion] = await db.insert(contestQuestions).values({
      contestId: data.contestId,
      title: originalQuestion.title,
      description: originalQuestion.description,
      difficulty: originalQuestion.difficulty,
      points: originalQuestion.points,
      orderIndex: data.orderIndex,
      timeLimitSeconds: originalQuestion.timeLimitSeconds,
      memoryLimitMb: originalQuestion.memoryLimitMb,
    }).returning();

    // Copy all test cases from admin test cases
    const originalTestCases = await db
      .select()
      .from(adminTestCases)
      .where(eq(adminTestCases.questionTitle, originalQuestion.title));

    if (originalTestCases.length > 0) {
      await db.insert(contestTestCases).values(
        originalTestCases.map((tc) => ({
          questionId: newQuestion.id,
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          isSample: tc.isSample,
          isHidden: tc.isHidden,
          points: tc.points,
        }))
      );
    }

    revalidatePath(`/contest/${contest.slug}`);
    return { success: true, data: newQuestion };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: errorMessage };
  }
}

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

    // Check if contest has ended
    if (contest.status === 'ended' || (contest.endTime && new Date(contest.endTime) < new Date())) {
      return { success: false, error: 'Cannot add questions to an ended contest' };
    }

    const [question] = await db.insert(contestQuestions).values({
      ...data,
      timeLimitSeconds: data.timeLimitSeconds || 2,
      memoryLimitMb: data.memoryLimitMb || 256,
    }).returning();

    revalidatePath(`/contest/${contest.slug}`);
    return { success: true, data: question };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: errorMessage };
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
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: errorMessage };
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
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: errorMessage };
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
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: errorMessage };
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
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: errorMessage };
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

    // Get the question and verify contest creator
    const [question] = await db
      .select()
      .from(contestQuestions)
      .where(eq(contestQuestions.id, data.questionId))
      .limit(1);

    if (!question) {
      return { success: false, error: 'Question not found' };
    }

    // Get the contest to check status
    const [contest] = await db
      .select()
      .from(contests)
      .where(eq(contests.id, question.contestId))
      .limit(1);

    if (!contest) {
      return { success: false, error: 'Contest not found' };
    }

    // Verify user is contest creator
    if (contest.createdBy !== session.user.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Check if contest has ended
    if (contest.status === 'ended' || (contest.endTime && new Date(contest.endTime) < new Date())) {
      return { success: false, error: 'Cannot add test cases to an ended contest' };
    }

    const [testCase] = await db.insert(contestTestCases).values(data).returning();

    return { success: true, data: testCase };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: errorMessage };
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
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: errorMessage };
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
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: errorMessage };
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
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: errorMessage };
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
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: errorMessage };
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

    revalidatePath('/contest');
    revalidatePath(`/contest/${contest.slug}`);
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: errorMessage };
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
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: errorMessage, isParticipant: false };
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
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: errorMessage };
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

    // Get question details to check if order-independent comparison is needed
    const [question] = await db
      .select()
      .from(contestQuestions)
      .where(eq(contestQuestions.id, data.questionId))
      .limit(1);

    const isOrderIndependent = question?.title?.toLowerCase().includes('subset') || 
                               question?.title?.toLowerCase().includes('combination') ||
                               question?.title?.toLowerCase().includes('permutation');

    // Helper function to normalize output for comparison
    const normalizeOutput = (str: string) => {
      return str
        .trim()
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .replace(/\\n/g, '\n')  // Handle escaped newlines like \n in strings
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(line => {
          // Normalize spaces in arrays, objects, etc.
          return line
            .replace(/\s*,\s*/g, ',')  // Remove spaces around commas: "1, 2" -> "1,2"
            .replace(/\s*:\s*/g, ':')  // Remove spaces around colons
            .replace(/\s*\[\s*/g, '[') // Remove spaces after opening brackets
            .replace(/\s*\]\s*/g, ']') // Remove spaces before closing brackets
            .replace(/\s*\{\s*/g, '{') // Remove spaces after opening braces
            .replace(/\s*\}\s*/g, '}') // Remove spaces before closing braces
            .replace(/\s*\(\s*/g, '(') // Remove spaces after opening parentheses
            .replace(/\s*\)\s*/g, ')') // Remove spaces before closing parentheses
            .replace(/\s+/g, ' ');     // Normalize multiple spaces to single space
        })
        .join('\n');
    };

    // Helper function for order-independent comparison (for subsets, combinations, etc.)
    const compareOrderIndependent = (expected: string, actual: string): boolean => {
      try {
        const normalizedExpected = normalizeOutput(expected);
        const normalizedActual = normalizeOutput(actual);

        // Parse the arrays
        const expectedArray = JSON.parse(normalizedExpected);
        const actualArray = JSON.parse(normalizedActual);

        if (!Array.isArray(expectedArray) || !Array.isArray(actualArray)) {
          return normalizedExpected === normalizedActual;
        }

        if (expectedArray.length !== actualArray.length) {
          return false;
        }

        // Sort both arrays by their string representation for comparison
        const sortArray = (arr: unknown[]) => {
          return arr.map(item => JSON.stringify(Array.isArray(item) ? item.sort() : item)).sort();
        };

        const sortedExpected = sortArray(expectedArray);
        const sortedActual = sortArray(actualArray);

        return JSON.stringify(sortedExpected) === JSON.stringify(sortedActual);
      } catch {
        // If JSON parsing fails, fall back to string comparison
        return normalizeOutput(expected) === normalizeOutput(actual);
      }
    };

    // Helper function to convert escaped newlines to actual newlines in input
    const processInput = (input: string) => {
      return input.replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\r/g, '\r');
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
        const baseUrl = await getBaseUrl();

        const response = await fetch(`${baseUrl}/api/compile`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            language: data.language,
            code: data.code,
            stdin: processInput(testCase.input),
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

        // Use order-independent comparison for specific question types
        let passed: boolean;
        if (isOrderIndependent) {
          passed = compareOrderIndependent(testCase.expectedOutput, result.output || '');
        } else {
          const normalizedExpected = normalizeOutput(testCase.expectedOutput);
          const normalizedActual = normalizeOutput(result.output || '');
          passed = normalizedExpected === normalizedActual;
        }

        results.push({
          testCaseId: testCase.id,
          passed,
          expected: testCase.expectedOutput,
          actual: result.output || 'No output',
          executionTime: result.executionTime || 0,
          error: passed ? undefined : `Expected: "${testCase.expectedOutput.trim()}", Got: "${(result.output || '').trim()}"`,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to execute test';
        results.push({
          testCaseId: testCase.id,
          passed: false,
          expected: testCase.expectedOutput,
          actual: 'Network Error',
          executionTime: 0,
          error: errorMessage,
        });
      }
    }

    return { success: true, data: results };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: errorMessage };
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

    // Get question details to check if order-independent comparison is needed
    const [question] = await db
      .select()
      .from(contestQuestions)
      .where(eq(contestQuestions.id, data.questionId))
      .limit(1);

    const isOrderIndependent = question?.title?.toLowerCase().includes('subset') || 
                               question?.title?.toLowerCase().includes('combination') ||
                               question?.title?.toLowerCase().includes('permutation');

    // Helper function to normalize output for comparison
    const normalizeOutput = (str: string) => {
      return str
        .trim()
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .replace(/\\n/g, '\n')  // Handle escaped newlines like \n in strings
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(line => {
          // Normalize spaces in arrays, objects, etc.
          return line
            .replace(/\s*,\s*/g, ',')  // Remove spaces around commas: "1, 2" -> "1,2"
            .replace(/\s*:\s*/g, ':')  // Remove spaces around colons
            .replace(/\s*\[\s*/g, '[') // Remove spaces after opening brackets
            .replace(/\s*\]\s*/g, ']') // Remove spaces before closing brackets
            .replace(/\s*\{\s*/g, '{') // Remove spaces after opening braces
            .replace(/\s*\}\s*/g, '}') // Remove spaces before closing braces
            .replace(/\s*\(\s*/g, '(') // Remove spaces after opening parentheses
            .replace(/\s*\)\s*/g, ')') // Remove spaces before closing parentheses
            .replace(/\s+/g, ' ');     // Normalize multiple spaces to single space
        })
        .join('\n');
    };

    // Helper function for order-independent comparison (for subsets, combinations, etc.)
    const compareOrderIndependent = (expected: string, actual: string): boolean => {
      try {
        const normalizedExpected = normalizeOutput(expected);
        const normalizedActual = normalizeOutput(actual);

        // Parse the arrays
        const expectedArray = JSON.parse(normalizedExpected);
        const actualArray = JSON.parse(normalizedActual);

        if (!Array.isArray(expectedArray) || !Array.isArray(actualArray)) {
          return normalizedExpected === normalizedActual;
        }

        if (expectedArray.length !== actualArray.length) {
          return false;
        }

        // Sort both arrays by their string representation for comparison
        const sortArray = (arr: unknown[]) => {
          return arr.map(item => JSON.stringify(Array.isArray(item) ? item.sort() : item)).sort();
        };

        const sortedExpected = sortArray(expectedArray);
        const sortedActual = sortArray(actualArray);

        return JSON.stringify(sortedExpected) === JSON.stringify(sortedActual);
      } catch {
        // If JSON parsing fails, fall back to string comparison
        return normalizeOutput(expected) === normalizeOutput(actual);
      }
    };

    // Helper function to convert escaped newlines to actual newlines in input
    const processInput = (input: string) => {
      return input.replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\r/g, '\r');
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
        const baseUrl = await getBaseUrl();
        
        const response = await fetch(`${baseUrl}/api/compile`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            language: data.language,
            code: data.code,
            stdin: processInput(testCase.input),
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

        // Use order-independent comparison for specific question types
        let isCorrect: boolean;
        if (isOrderIndependent) {
          isCorrect = compareOrderIndependent(testCase.expectedOutput, result.output || '');
        } else {
          const normalizedExpected = normalizeOutput(testCase.expectedOutput);
          const normalizedActual = normalizeOutput(result.output || '');
          isCorrect = normalizedExpected === normalizedActual;
        }
        
        if (isCorrect) {
          passedTests++;
          totalScore += testCase.points;
        } else {
          if (verdict === 'pending') {
            verdict = 'wrong_answer';
            errorMessage = `Expected: "${testCase.expectedOutput.trim()}", Got: "${(result.output || '').trim()}"`;
          }
        }
      } catch {
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
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: errorMessage };
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
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: errorMessage };
  }
}

// Get Question Completion Status
export async function getQuestionCompletionStatus(contestId: string, userId: string) {
  try {
    // Get all accepted submissions for this user in this contest
    const acceptedSubmissions = await db
      .select({
        questionId: contestSubmissions.questionId,
      })
      .from(contestSubmissions)
      .where(
        and(
          eq(contestSubmissions.contestId, contestId),
          eq(contestSubmissions.userId, userId),
          eq(contestSubmissions.verdict, 'accepted')
        )
      )
      .groupBy(contestSubmissions.questionId);

    // Create a Set of completed question IDs for fast lookup
    const completedQuestionIds = new Set(
      acceptedSubmissions.map(sub => sub.questionId)
    );

    return { success: true, data: completedQuestionIds };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: errorMessage };
  }
}

// ============================================
// LEADERBOARD
// ============================================

// Update Leaderboard
async function updateLeaderboard(contestId: string, userId: string) {
  try {
    // Get contest start time
    const [contest] = await db.select().from(contests).where(eq(contests.id, contestId)).limit(1);
    if (!contest) return;

    // Get all accepted submissions for this user, ordered by time
    // We only count the FIRST accepted submission for each question
    const acceptedSubmissions = await db
      .select({
        questionId: contestSubmissions.questionId,
        score: contestSubmissions.score,
        submittedAt: contestSubmissions.submittedAt,
      })
      .from(contestSubmissions)
      .where(
        and(
          eq(contestSubmissions.contestId, contestId),
          eq(contestSubmissions.userId, userId),
          eq(contestSubmissions.verdict, 'accepted')
        )
      )
      .orderBy(contestSubmissions.submittedAt);

    if (acceptedSubmissions.length > 0) {
      // Calculate total score
      const totalScore = acceptedSubmissions.reduce((sum, sub) => sum + (sub.score || 0), 0);
      
      // Calculate total time: time from contest start to LAST accepted submission
      // This shows how long the user took to solve all their problems
      const lastSubmission = acceptedSubmissions[acceptedSubmissions.length - 1].submittedAt;
      const totalTimeMinutes = Math.floor(
        (new Date(lastSubmission).getTime() - new Date(contest.startTime).getTime()) / 60000
      );
      
      // Count unique problems solved
      const solvedQuestions = new Set<string>();
      for (const submission of acceptedSubmissions) {
        solvedQuestions.add(submission.questionId);
      }
      const problemsSolved = solvedQuestions.size;

      await db
        .update(contestLeaderboard)
        .set({
          totalScore,
          problemsSolved,
          totalTimeMinutes,
          lastSubmissionTime: new Date(lastSubmission),
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
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: errorMessage };
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
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: errorMessage };
  }
}

// Get User Contest Submissions Statistics
export async function getUserContestStats(userId: string) {
  try {
    // Get all submissions by user
    const allSubmissions = await db
      .select({
        id: contestSubmissions.id,
        contestId: contestSubmissions.contestId,
        questionId: contestSubmissions.questionId,
        questionTitle: contestQuestions.title,
        verdict: contestSubmissions.verdict,
        score: contestSubmissions.score,
        submittedAt: contestSubmissions.submittedAt,
      })
      .from(contestSubmissions)
      .leftJoin(contestQuestions, eq(contestSubmissions.questionId, contestQuestions.id))
      .where(eq(contestSubmissions.userId, userId))
      .orderBy(desc(contestSubmissions.submittedAt));

    // Calculate statistics
    const totalSubmissions = allSubmissions.length;
    const acceptedSubmissions = allSubmissions.filter(s => s.verdict === 'accepted');
    const totalAccepted = acceptedSubmissions.length;

    // Count unique problems solved
    const uniqueProblemsSolved = new Set(
      acceptedSubmissions.map(s => s.questionId)
    ).size;

    // Group submissions by question with counts
    const submissionsByQuestion = allSubmissions.reduce((acc, submission) => {
      const questionTitle = submission.questionTitle || 'Unknown Question';
      if (!acc[questionTitle]) {
        acc[questionTitle] = {
          questionId: submission.questionId,
          questionTitle,
          totalSubmissions: 0,
          acceptedSubmissions: 0,
          lastSubmittedAt: submission.submittedAt,
        };
      }
      acc[questionTitle].totalSubmissions++;
      if (submission.verdict === 'accepted') {
        acc[questionTitle].acceptedSubmissions++;
      }
      // Update last submission time if newer
      if (submission.submittedAt && 
          (!acc[questionTitle].lastSubmittedAt || 
           new Date(submission.submittedAt) > new Date(acc[questionTitle].lastSubmittedAt))) {
        acc[questionTitle].lastSubmittedAt = submission.submittedAt;
      }
      return acc;
    }, {} as Record<string, {
      questionId: string;
      questionTitle: string;
      totalSubmissions: number;
      acceptedSubmissions: number;
      lastSubmittedAt: Date | null;
    }>);

    // Convert to array and sort by submission count
    const questionStats = Object.values(submissionsByQuestion)
      .sort((a, b) => b.totalSubmissions - a.totalSubmissions);

    return {
      success: true,
      data: {
        totalSubmissions,
        totalAccepted,
        uniqueProblemsSolved,
        questionStats,
        recentSubmissions: allSubmissions.slice(0, 10),
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: errorMessage };
  }
}
