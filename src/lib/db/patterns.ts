import { db } from './index';
import { dsaPatterns, patternProblems, visibleProblems } from './schema';
import { eq, sql, inArray } from 'drizzle-orm';

/**
 * Recalculates and updates the count of visible questions for specified patterns.
 */
export async function recalculatePatternCounts(patternIds: string[]) {
  const filteredPatternIds = patternIds.filter(Boolean);
  if (filteredPatternIds.length === 0) return;

  const counts = await db
    .select({
      patternId: dsaPatterns.id,
      visibleCount: sql<number>`cast(count(${visibleProblems.id}) as int)`
    })
    .from(dsaPatterns)
    .leftJoin(patternProblems, eq(dsaPatterns.id, patternProblems.patternId))
    .leftJoin(visibleProblems, eq(patternProblems.problemId, visibleProblems.id))
    .where(inArray(dsaPatterns.id, filteredPatternIds))
    .groupBy(dsaPatterns.id);

  // Initialize all specified patterns to 0 first in case they have no visible questions left
  for (const pid of filteredPatternIds) {
    const row = counts.find(c => c.patternId === pid);
    const count = row ? row.visibleCount : 0;
    await db
      .update(dsaPatterns)
      .set({ problemCount: count })
      .where(eq(dsaPatterns.id, pid));
  }
}

/**
 * Recalculates and updates the count of visible questions for all patterns.
 */
export async function recalculateAllPatternCounts() {
  const counts = await db
    .select({
      patternId: dsaPatterns.id,
      visibleCount: sql<number>`cast(count(${visibleProblems.id}) as int)`
    })
    .from(dsaPatterns)
    .leftJoin(patternProblems, eq(dsaPatterns.id, patternProblems.patternId))
    .leftJoin(visibleProblems, eq(patternProblems.problemId, visibleProblems.id))
    .groupBy(dsaPatterns.id);

  for (const row of counts) {
    await db
      .update(dsaPatterns)
      .set({ problemCount: row.visibleCount })
      .where(eq(dsaPatterns.id, row.patternId));
  }
}
