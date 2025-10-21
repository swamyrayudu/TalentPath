"use server";

import { db } from "@/lib/db";
import { adminQuestions, adminTestCases } from "@/lib/db/schema";
import { eq, and, like, or, sql, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export interface AdminQuestion {
  id: string;
  title: string;
  description: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  points: number;
  timeLimitSeconds: number;
  memoryLimitMb: number;
  topics: string[];
  createdBy: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminTestCase {
  id: string;
  questionTitle: string;
  input: string;
  expectedOutput: string;
  isSample: boolean;
  isHidden: boolean;
  points: number;
  createdAt: Date;
}

export interface GetAdminQuestionsParams {
  page?: number;
  limit?: number;
  search?: string;
  difficulty?: "EASY" | "MEDIUM" | "HARD" | "all";
  topic?: string;
  isActive?: boolean;
}

export interface AdminQuestionsResponse {
  questions: AdminQuestion[];
  totalCount: number;
  hasMore: boolean;
  page: number;
  limit: number;
}

/**
 * Get admin questions with pagination and filters
 */
export async function getAdminQuestions({
  page = 1,
  limit = 20,
  search = "",
  difficulty = "all",
  topic = "all",
  isActive = true,
}: GetAdminQuestionsParams): Promise<AdminQuestionsResponse> {
  try {
    const session = await auth();
    if (!session?.user) {
      console.error("Unauthorized: No session found");
      return {
        questions: [],
        totalCount: 0,
        hasMore: false,
        page,
        limit,
      };
    }

    // Build where conditions
    const conditions = [];

    if (isActive !== undefined) {
      conditions.push(eq(adminQuestions.isActive, isActive));
    }

    if (search) {
      conditions.push(
        or(
          like(adminQuestions.title, `%${search}%`),
          like(adminQuestions.description, `%${search}%`)
        )
      );
    }

    if (difficulty !== "all") {
      conditions.push(eq(adminQuestions.difficulty, difficulty));
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

    // Get paginated questions
    const offset = (page - 1) * limit;
    const questions = await db
      .select()
      .from(adminQuestions)
      .where(where)
      .orderBy(desc(adminQuestions.createdAt))
      .limit(limit)
      .offset(offset);

    const hasMore = offset + questions.length < totalCount;

    console.log(`Fetched ${questions.length} questions, total: ${totalCount}, hasMore: ${hasMore}`);

    return {
      questions: questions as AdminQuestion[],
      totalCount,
      hasMore,
      page,
      limit,
    };
  } catch (error) {
    console.error("Error fetching admin questions:", error);
    return {
      questions: [],
      totalCount: 0,
      hasMore: false,
      page,
      limit,
    };
  }
}

/**
 * Get all unique topics from admin questions
 */
export async function getAllTopics(): Promise<string[]> {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    const result = await db
      .select({ topics: adminQuestions.topics })
      .from(adminQuestions)
      .where(eq(adminQuestions.isActive, true));

    // Flatten and deduplicate topics
    const allTopics = result.flatMap((r) => r.topics || []);
    const uniqueTopics = [...new Set(allTopics)].filter(Boolean).sort();

    return uniqueTopics;
  } catch {
    // Error fetching topics
    return [];
  }
}

/**
 * Get test cases for a specific question by title
 */
export async function getAdminTestCases(
  questionTitle: string
): Promise<AdminTestCase[]> {
  try {
    const session = await auth();
    if (!session?.user) {
      console.error("Unauthorized: No session found");
      return [];
    }

    console.log(`Fetching test cases for question: "${questionTitle}"`);

    const testCases = await db
      .select()
      .from(adminTestCases)
      .where(eq(adminTestCases.questionTitle, questionTitle))
      .orderBy(desc(adminTestCases.isSample), adminTestCases.createdAt);

    console.log(`Found ${testCases.length} test cases for "${questionTitle}"`);
    
    return testCases as AdminTestCase[];
  } catch (error) {
    console.error("Error fetching test cases:", error);
    return [];
  }
}

/**
 * Get all admin test cases with pagination
 */
export async function getAllAdminTestCases({
  page = 1,
  limit = 50,
  search = "",
  isSample,
}: {
  page?: number;
  limit?: number;
  search?: string;
  isSample?: boolean;
}): Promise<{
  testCases: AdminTestCase[];
  totalCount: number;
  hasMore: boolean;
}> {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new Error("Unauthorized");
    }
    // @ts-expect-error - role exists on user but not in type definition
    if (session.user.role !== "admin") {
      throw new Error("Unauthorized - Admin access required");
    }

    const conditions = [];

    if (search) {
      conditions.push(like(adminTestCases.questionTitle, `%${search}%`));
    }

    if (isSample !== undefined) {
      conditions.push(eq(adminTestCases.isSample, isSample));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(adminTestCases)
      .where(where);

    const totalCount = countResult?.count || 0;

    // Get paginated test cases
    const offset = (page - 1) * limit;
    const testCases = await db
      .select()
      .from(adminTestCases)
      .where(where)
      .orderBy(desc(adminTestCases.createdAt))
      .limit(limit)
      .offset(offset);

    const hasMore = offset + testCases.length < totalCount;

    return {
      testCases: testCases as AdminTestCase[],
      totalCount,
      hasMore,
    };
  } catch (error) {
    // Error fetching test cases
    throw error;
  }
}

/**
 * Create a new admin question
 */
export async function createAdminQuestion(
  data: Omit<AdminQuestion, "id" | "createdAt" | "updatedAt">
): Promise<AdminQuestion> {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new Error("Unauthorized");
    }
    // @ts-ignore - role exists on user
    if (session.user.role !== "admin") {
      throw new Error("Unauthorized - Admin access required");
    }

    const [question] = await db
      .insert(adminQuestions)
      .values({
        ...data,
        createdBy: session.user.id!,
      })
      .returning();

    revalidatePath("/admin/questions");
    return question as AdminQuestion;
  } catch (error) {
    // Error creating admin question
    throw error;
  }
}

/**
 * Create admin test case
 */
export async function createAdminTestCase(
  data: Omit<AdminTestCase, "id" | "createdAt">
): Promise<AdminTestCase> {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new Error("Unauthorized");
    }
    // @ts-expect-error - role exists on user but not in type definition
    if (session.user.role !== "admin") {
      throw new Error("Unauthorized - Admin access required");
    }

    const [testCase] = await db
      .insert(adminTestCases)
      .values(data)
      .returning();

    revalidatePath("/admin/questions");
    return testCase as AdminTestCase;
  } catch (error) {
    // Error creating test case
    throw error;
  }
}

/**
 * Bulk import questions from CSV data
 */
export async function bulkImportQuestions(
  questions: Array<Omit<AdminQuestion, "id" | "createdAt" | "updatedAt" | "createdBy">>
): Promise<{ success: number; failed: number; errors: string[] }> {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new Error("Unauthorized");
    }
    // @ts-ignore - role exists on user
    if (session.user.role !== "admin") {
      throw new Error("Unauthorized - Admin access required");
    }

    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const question of questions) {
      try {
        await db.insert(adminQuestions).values({
          ...question,
          createdBy: session.user.id!,
        });
        success++;
      } catch (error) {
        failed++;
        const errorMessage = error instanceof Error ? error.message : String(error);
        errors.push(`${question.title}: ${errorMessage}`);
      }
    }

    revalidatePath("/admin/questions");
    return { success, failed, errors };
  } catch (error) {
    // Error bulk importing questions
    throw error;
  }
}

/**
 * Bulk import test cases from CSV data
 */
export async function bulkImportTestCases(
  testCases: Array<Omit<AdminTestCase, "id" | "createdAt">>
): Promise<{ success: number; failed: number; errors: string[] }> {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new Error("Unauthorized");
    }
    // @ts-expect-error - role exists on user but not in type definition
    if (session.user.role !== "admin") {
      throw new Error("Unauthorized - Admin access required");
    }

    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const testCase of testCases) {
      try {
        await db.insert(adminTestCases).values(testCase);
        success++;
      } catch (error) {
        failed++;
        const errorMessage = error instanceof Error ? error.message : String(error);
        errors.push(`${testCase.questionTitle}: ${errorMessage}`);
      }
    }

    revalidatePath("/admin/questions");
    return { success, failed, errors };
  } catch (error) {
    // Error bulk importing test cases
    throw error;
  }
}

/**
 * Get statistics about admin questions
 */
export async function getAdminQuestionsStats(): Promise<{
  total: number;
  byDifficulty: { EASY: number; MEDIUM: number; HARD: number };
  byTopic: Record<string, number>;
  totalTestCases: number;
}> {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new Error("Unauthorized");
    }
    // @ts-expect-error - role exists on user but not in type definition
    if (session.user.role !== "admin") {
      throw new Error("Unauthorized - Admin access required");
    }

    // Get total questions
    const [totalResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(adminQuestions)
      .where(eq(adminQuestions.isActive, true));

    const total = totalResult?.count || 0;

    // Get by difficulty
    const difficultyStats = await db
      .select({
        difficulty: adminQuestions.difficulty,
        count: sql<number>`count(*)::int`,
      })
      .from(adminQuestions)
      .where(eq(adminQuestions.isActive, true))
      .groupBy(adminQuestions.difficulty);

    const byDifficulty = {
      EASY: 0,
      MEDIUM: 0,
      HARD: 0,
    };

    difficultyStats.forEach((stat) => {
      byDifficulty[stat.difficulty] = stat.count;
    });

    // Get topics distribution
    const allQuestions = await db
      .select({ topics: adminQuestions.topics })
      .from(adminQuestions)
      .where(eq(adminQuestions.isActive, true));

    const byTopic: Record<string, number> = {};
    allQuestions.forEach((q) => {
      q.topics?.forEach((topic) => {
        byTopic[topic] = (byTopic[topic] || 0) + 1;
      });
    });

    // Get total test cases
    const [testCasesResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(adminTestCases);

    const totalTestCases = testCasesResult?.count || 0;

    return {
      total,
      byDifficulty,
      byTopic,
      totalTestCases,
    };
  } catch (error) {
    // Error fetching stats
    throw error;
  }
}

/**
 * Update admin question
 */
export async function updateAdminQuestion(
  id: string,
  data: Partial<Omit<AdminQuestion, "id" | "createdAt" | "updatedAt" | "createdBy">>
): Promise<AdminQuestion> {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new Error("Unauthorized");
    }
    // @ts-expect-error - role exists on user but not in type definition
    if (session.user.role !== "admin") {
      throw new Error("Unauthorized - Admin access required");
    }

    // Get the current question
    const [currentQuestion] = await db
      .select()
      .from(adminQuestions)
      .where(eq(adminQuestions.id, id))
      .limit(1);

    if (!currentQuestion) {
      throw new Error("Question not found");
    }

    // Prevent title changes due to foreign key constraints
    if (data.title && currentQuestion.title !== data.title) {
      throw new Error("Cannot change question title. Test cases reference the title. Please create a new question instead.");
    }

    // Update the question (without changing title)
    const updateData = { ...data };
    delete updateData.title; // Remove title from updates

    const [question] = await db
      .update(adminQuestions)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(adminQuestions.id, id))
      .returning();

    console.log("Question updated successfully");

    revalidatePath("/admin/questions");
    revalidatePath("/admin/contests");
    return question as AdminQuestion;
  } catch (error) {
    console.error("Error updating admin question:", error);
    throw error;
  }
}

/**
 * Delete admin question
 */
export async function deleteAdminQuestion(id: string): Promise<boolean> {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new Error("Unauthorized");
    }
    // @ts-expect-error - role exists on user but not in type definition
    if (session.user.role !== "admin") {
      throw new Error("Unauthorized - Admin access required");
    }

    await db.delete(adminQuestions).where(eq(adminQuestions.id, id));

    revalidatePath("/admin/questions");
    revalidatePath("/admin/contests");
    return true;
  } catch (error) {
    console.error("Error deleting admin question:", error);
    throw error;
  }
}

/**
 * Update admin test case
 */
export async function updateAdminTestCase(
  id: string,
  data: Partial<Omit<AdminTestCase, "id" | "createdAt">>
): Promise<AdminTestCase> {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new Error("Unauthorized");
    }
    // @ts-expect-error - role exists on user but not in type definition
    if (session.user.role !== "admin") {
      throw new Error("Unauthorized - Admin access required");
    }

    const [testCase] = await db
      .update(adminTestCases)
      .set(data)
      .where(eq(adminTestCases.id, id))
      .returning();

    revalidatePath("/admin/questions");
    revalidatePath("/admin/contests");
    return testCase as AdminTestCase;
  } catch (error) {
    console.error("Error updating admin test case:", error);
    throw error;
  }
}

/**
 * Delete admin test case
 */
export async function deleteAdminTestCase(id: string): Promise<boolean> {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new Error("Unauthorized");
    }
    // @ts-expect-error - role exists on user but not in type definition
    if (session.user.role !== "admin") {
      throw new Error("Unauthorized - Admin access required");
    }

    await db.delete(adminTestCases).where(eq(adminTestCases.id, id));

    revalidatePath("/admin/questions");
    revalidatePath("/admin/contests");
    return true;
  } catch (error) {
    console.error("Error deleting admin test case:", error);
    throw error;
  }
}
