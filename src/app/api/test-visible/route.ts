import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { visibleProblems } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';

export async function GET() {
  try {
    // Get total count
    const total = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(visibleProblems);

    // Get LEETCODE EASY count
    const leetcodeEasy = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(visibleProblems)
      .where(and(
        eq(visibleProblems.platform, 'LEETCODE'),
        eq(visibleProblems.difficulty, 'EASY')
      ));

    // Check for array problems using ANY
    const arrayProblems = await db.execute(
      sql`SELECT COUNT(*) as count 
          FROM visible_problems 
          WHERE platform='LEETCODE' 
            AND difficulty='EASY' 
            AND 'array' = ANY(topic_slugs)`
    );

    // Get sample topic_slugs
    const samples = await db
      .select({
        title: visibleProblems.title,
        topicSlugs: visibleProblems.topicSlugs
      })
      .from(visibleProblems)
      .where(and(
        eq(visibleProblems.platform, 'LEETCODE'),
        eq(visibleProblems.difficulty, 'EASY')
      ))
      .limit(5);

    return NextResponse.json({
      success: true,
      totalVisible: total[0]?.count || 0,
      leetcodeEasy: leetcodeEasy[0]?.count || 0,
      arrayProblems: (arrayProblems as unknown as { count: number }[])[0]?.count || 0,
      sampleProblems: samples
    });
  } catch (error) {
    console.error('Test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
