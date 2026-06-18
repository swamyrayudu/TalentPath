import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { dsaPatterns, patternProblems, visibleProblems } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Get all patterns along with the count of VISIBLE problems linked to each
    const patterns = await db
      .select({
        id: dsaPatterns.id,
        name: dsaPatterns.name,
        slug: dsaPatterns.slug,
        description: dsaPatterns.description,
        topic: dsaPatterns.topic,
        orderIndex: dsaPatterns.orderIndex,
        problemCount: sql<number>`cast(count(${visibleProblems.id}) as int)`,
        problemIds: sql<number[]>`coalesce(json_agg(${visibleProblems.id}) filter (where ${visibleProblems.id} is not null), '[]'::json)`
      })
      .from(dsaPatterns)
      .leftJoin(patternProblems, eq(dsaPatterns.id, patternProblems.patternId))
      .leftJoin(visibleProblems, eq(patternProblems.problemId, visibleProblems.id))
      .groupBy(dsaPatterns.id)
      .orderBy(dsaPatterns.orderIndex);

    return NextResponse.json({
      success: true,
      data: patterns
    });
  } catch (error) {
    console.error('Error fetching patterns:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch patterns' },
      { status: 500 }
    );
  }
}
