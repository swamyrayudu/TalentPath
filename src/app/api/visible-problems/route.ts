// API endpoint to fetch visible problems by topic
// Used when user clicks on a topic card in DSA sheet
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { visibleProblems } from '@/lib/db/schema';
import { eq, and, sql, desc, asc, SQL } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const topicSlug = searchParams.get('topic');
    const difficulty = searchParams.get('difficulty')?.toUpperCase();
    const platform = searchParams.get('platform')?.toUpperCase();
    const sortBy = searchParams.get('sortBy') || 'likes';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    console.log(`🔍 Fetching visible problems - Topic: ${topicSlug}, Difficulty: ${difficulty}, Platform: ${platform}`);

    if (!topicSlug) {
      return NextResponse.json(
        { success: false, error: 'Topic slug is required' },
        { status: 400 }
      );
    }

    // Check if user is admin (adjust based on your auth setup)
    const session = await auth();
    const isAdmin = session?.user?.email === 'admin@talentpath.com'; // Modify as needed

    // Build query conditions
    const conditions: SQL[] = [
      sql`${topicSlug} = ANY(${visibleProblems.topicSlugs})`
    ];

    if (difficulty && ['EASY', 'MEDIUM', 'HARD'].includes(difficulty)) {
      conditions.push(eq(visibleProblems.difficulty, difficulty as 'EASY' | 'MEDIUM' | 'HARD'));
    }

    if (platform && ['LEETCODE', 'GEEKSFORGEEKS', 'CODEFORCES', 'HACKERRANK'].includes(platform)) {
      conditions.push(eq(visibleProblems.platform, platform as 'LEETCODE' | 'GEEKSFORGEEKS' | 'CODEFORCES' | 'HACKERRANK'));
    }

    // Fetch total count first
    const allProblems = await db
      .select()
      .from(visibleProblems)
      .where(and(...conditions));
    
    const totalCount = allProblems.length;
    console.log(`📊 Total matching problems: ${totalCount}`);

    // Determine sort order
    let orderByClause: SQL;
    if (sortBy === 'acceptanceRate') {
      orderByClause = sortOrder === 'desc' ? desc(visibleProblems.acceptanceRate) : asc(visibleProblems.acceptanceRate);
    } else if (sortBy === 'title') {
      orderByClause = sortOrder === 'desc' ? desc(visibleProblems.title) : asc(visibleProblems.title);
    } else if (sortBy === 'difficulty') {
      orderByClause = sortOrder === 'desc' ? desc(visibleProblems.difficulty) : asc(visibleProblems.difficulty);
    } else {
      // Default to likes
      orderByClause = sortOrder === 'desc' ? desc(visibleProblems.likes) : asc(visibleProblems.likes);
    }

    // Fetch paginated problems
    const problems = await db
      .select()
      .from(visibleProblems)
      .where(and(...conditions))
      .orderBy(orderByClause)
      .limit(limit)
      .offset(offset);

    console.log(`✅ Returning ${problems.length} problems (offset: ${offset}, limit: ${limit})`);

    return NextResponse.json({
      success: true,
      data: problems,
      total: totalCount,
      count: problems.length,
      isAdmin,
      filters: {
        topic: topicSlug,
        difficulty: difficulty || 'ALL',
        platform: platform || 'ALL',
      },
    });
  } catch (error) {
    console.error('❌ Error fetching visible problems by topic:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch problems',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
