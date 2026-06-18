import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { dsaPatterns, patternProblems, visibleProblems } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    
    // Get pattern details
    const pattern = await db
      .select()
      .from(dsaPatterns)
      .where(eq(dsaPatterns.slug, slug))
      .limit(1);

    if (pattern.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Pattern not found' },
        { status: 404 }
      );
    }

    // Get visible problems linked to this pattern
    const problems = await db
      .select({
        id: visibleProblems.id,
        title: visibleProblems.title,
        slug: visibleProblems.slug,
        isPremium: visibleProblems.isPremium,
        difficulty: visibleProblems.difficulty,
        platform: visibleProblems.platform,
        likes: visibleProblems.likes,
        dislikes: visibleProblems.dislikes,
        acceptanceRate: visibleProblems.acceptanceRate,
        url: visibleProblems.url,
        topicTags: visibleProblems.topicTags,
        companyTags: visibleProblems.companyTags,
        mainTopics: visibleProblems.mainTopics,
        topicSlugs: visibleProblems.topicSlugs,
        accepted: visibleProblems.accepted,
        submissions: visibleProblems.submissions,
      })
      .from(patternProblems)
      .innerJoin(dsaPatterns, eq(patternProblems.patternId, dsaPatterns.id))
      .innerJoin(visibleProblems, eq(patternProblems.problemId, visibleProblems.id))
      .where(eq(dsaPatterns.slug, slug))
      .orderBy(visibleProblems.title);

    return NextResponse.json({
      success: true,
      pattern: pattern[0],
      data: problems
    });
  } catch (error) {
    console.error('Error fetching pattern problems:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch pattern problems' },
      { status: 500 }
    );
  }
}
