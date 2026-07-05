import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { dsaPatterns } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';
import { patternCache } from '@/lib/redis';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cacheKey = 'patterns:all';
    const cached = await patternCache.get(cacheKey);
    if (cached) {
      console.log('[Redis Queue Cache] Hit for all patterns');
      return NextResponse.json({
        success: true,
        data: cached
      });
    }

    // Get all patterns along with the count of VISIBLE problems linked to each
    const patterns = await db
      .select({
        id: dsaPatterns.id,
        name: dsaPatterns.name,
        slug: dsaPatterns.slug,
        description: dsaPatterns.description,
        topic: dsaPatterns.topic,
        orderIndex: dsaPatterns.orderIndex,
        problemCount: dsaPatterns.problemCount,
        problemIds: sql<number[]>`
          coalesce(
            (
              SELECT json_agg(pp.problem_id)
              FROM pattern_problems pp
              JOIN visible_problems vp ON pp.problem_id = vp.id
              WHERE pp.pattern_id = dsa_patterns.id
            ),
            '[]'::json
          )
        `
      })
      .from(dsaPatterns)
      .orderBy(dsaPatterns.orderIndex);

    // Save to Cache
    await patternCache.set(cacheKey, patterns);

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
