// lib/db/queries.ts - NEW FILE
import { string } from 'zod';
import { db } from './index';
import { problems, userProgress, users } from './schema';
import { eq, desc, lt, and, or, ilike, sql, inArray } from 'drizzle-orm';

export interface ProblemFilters {
  cursor?: string;
  limit?: number;
  difficulty?: string;
  company?: string;
  topic?: string;
  platform?: string;
  search?: string;
  userId?: string; // For filtering user's solved/attempted problems
}

export async function getProblems(filters: ProblemFilters = {}) {
  const {
    cursor,
    limit = 20,
    difficulty,
    company,
    topic,
    platform,
    search,
  } = filters;

  let query = db
    .select()
    .from(problems)
    .orderBy(desc(problems.createdAt))
    .limit(limit);

  const conditions = [];

  if (cursor) {
    conditions.push(lt(problems.createdAt, new Date(cursor)));
  }

  if (difficulty) {
    conditions.push(eq(problems.difficulty, difficulty.toUpperCase() as any));
  }

  if (platform) {
    conditions.push(eq(problems.platform, platform.toUpperCase() as any));
  }

  if (company) {
    conditions.push(sql`${problems.companyTags} @> ARRAY[${company}]::text[]`);
  }

  if (topic) {
    conditions.push(sql`${problems.topicTags} @> ARRAY[${topic}]::text[]`);
  }

  if (search) {
    conditions.push(
      or(
        ilike(problems.title, `%${search}%`),
        ilike(problems.slug, `%${search}%`)
      )!
    );
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions)!) as any;
  }

  const result = await query;

  return {
    problems: result,
    nextCursor: result.length > 0 ? result[result.length - 1].createdAt?.toISOString() : null,
    hasMore: result.length === limit,
  };
}

export async function getProblemBySlug(slug: string) {
  const result = await db
    .select()
    .from(problems)
    .where(eq(problems.slug, slug))
    .limit(1);

  return result[0] || null;
}

export async function getProblemById(id: number) {
  const result = await db
    .select()
    .from(problems)
    .where(eq(problems.id, id))
    .limit(1);

  return result[0] || null;
}

export async function createProblem(data: typeof problems.$inferInsert) {
  const result = await db.insert(problems).values(data).returning();
  return result[0];
}

export async function updateProblem(id: number, data: Partial<typeof problems.$inferInsert>) {
  const result = await db
    .update(problems)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(problems.id, id))
    .returning();

  return result[0];
}

export async function deleteProblem(id: number) {
  await db.delete(problems).where(eq(problems.id, id));
  return { success: true };
}

// User Progress functions
export async function getUserProgress(userId: string, problemId: number) {
  const result = await db
    .select()
    .from(userProgress)
    .where(
      and(
        eq(userProgress.userId, userId),
        eq(userProgress.problemId, problemId)
      )
    )
    .limit(1);

  return result[0] || null;
}

export async function saveUserProgress(data: typeof userProgress.$inferInsert) {
  const existing = await getUserProgress(data.userId, data.problemId as number);

  if (existing) {
    const result = await db
      .update(userProgress)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(userProgress.id, existing.id))
      .returning();
    return result[0];
  }

  const result = await db.insert(userProgress).values(data).returning();
  return result[0];
}

export async function getUserSolvedProblems(userId: string) {
  return await db
    .select({
      problem: problems,
      progress: userProgress,
    })
    .from(userProgress)
    .innerJoin(problems, eq(userProgress.problemId, problems.id))
    .where(
      and(
        eq(userProgress.userId, userId),
        eq(userProgress.status, 'solved')
      )
    )
    .orderBy(desc(userProgress.solvedAt));
}

export async function getProblemsWithUserProgress(
  userId: string,
  filters: ProblemFilters = {}
) {
  const { problems: problemsList } = await getProblems(filters);

  const problemsWithProgress = await Promise.all(
    problemsList.map(async (problem) => {
      const progress = await getUserProgress(userId, problem.id);
      return {
        ...problem,
        userProgress: progress,
      };
    })
  );

  return problemsWithProgress;
}

// Stats
export async function getUserStats(userId: string) {
  const allProgress = await db
    .select()
    .from(userProgress)
    .where(eq(userProgress.userId, userId));

  const solved = allProgress.filter((p) => p.status === 'solved');
  const attempted = allProgress.filter((p) => p.status === 'attempted');

  const easy = solved.filter((p) => 
    allProgress.find((pr) => pr.problemId === p.problemId)
  ).length;

  return {
    totalSolved: solved.length,
    totalAttempted: attempted.length,
    totalBookmarked: allProgress.filter((p) => p.status === 'bookmarked').length,
    easy: 0, // Calculate based on joined data
    medium: 0,
    hard: 0,
  };
}