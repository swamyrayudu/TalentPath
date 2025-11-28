// API endpoint to fetch visible problems by topic
// Used when user clicks on a topic card in DSA sheet
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { visibleProblems } from '@/lib/db/schema';
import { eq, and, or, isNull, SQL } from 'drizzle-orm';
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

    // Check if user is admin
    const session = await auth();
    const isAdmin = session?.user?.email === 'admin@talentpath.com';

    // Build base query conditions
    const conditions: SQL[] = [
      or(
        eq(visibleProblems.isVisibleToUsers, true),
        isNull(visibleProblems.isVisibleToUsers)
      )!
    ];

    if (difficulty && ['EASY', 'MEDIUM', 'HARD'].includes(difficulty)) {
      conditions.push(eq(visibleProblems.difficulty, difficulty));
    }

    if (platform && ['LEETCODE', 'GEEKSFORGEEKS', 'CODEFORCES', 'HACKERRANK'].includes(platform)) {
      conditions.push(eq(visibleProblems.platform, platform));
    }

    // Get all problems matching base conditions
    const allProblems = await db
      .select()
      .from(visibleProblems)
      .where(and(...conditions));

    console.log(`📦 Found ${allProblems.length} problems with base filters`);

    // Filter by topic slug in application code (JSONB handling)
    let filteredProblems = allProblems;
    
    if (topicSlug) {
      filteredProblems = allProblems.filter(problem => {
        if (!problem.topicSlugs) return false;
        
        let topicSlugs: string[] = [];
        
        if (Array.isArray(problem.topicSlugs)) {
          topicSlugs = problem.topicSlugs as string[];
        } else if (typeof problem.topicSlugs === 'string') {
          try {
            const parsed = JSON.parse(problem.topicSlugs);
            if (Array.isArray(parsed)) {
              topicSlugs = parsed;
            }
          } catch {
            return false;
          }
        }
        
        return topicSlugs.includes(topicSlug);
      });
      
      console.log(`Filtered to ${filteredProblems.length} problems for topic: ${topicSlug}`);
    }

    // Sort problems
    filteredProblems.sort((a, b) => {
      let aVal: number | string = 0;
      let bVal: number | string = 0;
      
      if (sortBy === 'acceptanceRate') {
        aVal = Number(a.acceptanceRate) || 0;
        bVal = Number(b.acceptanceRate) || 0;
      } else if (sortBy === 'title') {
        aVal = a.title || '';
        bVal = b.title || '';
      } else if (sortBy === 'difficulty') {
        const order = { EASY: 0, MEDIUM: 1, HARD: 2 };
        aVal = order[(a.difficulty || 'MEDIUM').toUpperCase() as keyof typeof order] || 1;
        bVal = order[(b.difficulty || 'MEDIUM').toUpperCase() as keyof typeof order] || 1;
      } else {
        // Default to likes
        aVal = parseInt(a.likes || '0', 10) || 0;
        bVal = parseInt(b.likes || '0', 10) || 0;
      }
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortOrder === 'desc' ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal);
      }
      
      return sortOrder === 'desc' ? (bVal as number) - (aVal as number) : (aVal as number) - (bVal as number);
    });

    const totalCount = filteredProblems.length;
    
    // Apply pagination
    const paginatedProblems = filteredProblems.slice(offset, offset + limit);

    console.log(`Returning ${paginatedProblems.length} problems (offset: ${offset}, limit: ${limit})`);

    return NextResponse.json({
      success: true,
      data: paginatedProblems,
      total: totalCount,
      count: paginatedProblems.length,
      hasMore: offset + paginatedProblems.length < totalCount,
      isAdmin,
      filters: {
        topic: topicSlug || 'ALL',
        difficulty: difficulty || 'ALL',
        platform: platform || 'ALL',
      },
    });
  } catch (error) {
    console.error('Error fetching visible problems by topic:', error);
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
