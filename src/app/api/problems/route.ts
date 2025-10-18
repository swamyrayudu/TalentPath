import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { userProgress, problems } from '@/lib/db/schema';
import { eq, and, desc, sql, or, ilike } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const difficulty = searchParams.get('difficulty');
    const platform = searchParams.get('platform');
    const topic = searchParams.get('topic');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'likes';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const limit = parseInt(searchParams.get('limit') || '10000');
    const offset = parseInt(searchParams.get('offset') || '0');

    console.log('📊 Fetching problems:', { difficulty, platform, topic, search, limit, offset });

    const baseQuery = db.select().from(problems);
    const conditions = [];

    if (difficulty && difficulty !== 'all') {
      conditions.push(eq(problems.difficulty, difficulty as any));
    }

    // Fixed GEEKSFORGEEKS filtering
    if (platform && platform !== 'all') {
      const normalizedPlatform = platform.toUpperCase().trim();
      conditions.push(eq(problems.platform, normalizedPlatform as any));
    }

    if (topic && topic !== 'all') {
      // Use PostgreSQL array overlap operator to check if topicSlugs contains the topic
      console.log('🔍 Filtering by topic:', topic);
      conditions.push(sql`${problems.topicSlugs} && ARRAY[${topic}]`);
    }

    if (search) {
      conditions.push(
        or(
          ilike(problems.title, `%${search}%`),
          ilike(problems.slug, `%${search}%`)
        )
      );
    }

    const query = conditions.length > 0 
      ? baseQuery.where(and(...conditions))
      : baseQuery;

    // Dynamic sorting
    let orderByClause;
    switch (sortBy) {
      case 'likes':
        orderByClause = sortOrder === 'asc' ? problems.likes : desc(problems.likes);
        break;
      case 'acceptance':
        orderByClause = sortOrder === 'asc' ? problems.acceptanceRate : desc(problems.acceptanceRate);
        break;
      case 'title':
        orderByClause = sortOrder === 'asc' ? problems.title : desc(problems.title);
        break;
      case 'difficulty':
        orderByClause = sortOrder === 'asc' ? problems.difficulty : desc(problems.difficulty);
        break;
      default:
        orderByClause = desc(problems.likes);
    }

    const result = await query
      .orderBy(orderByClause)
      .limit(limit)
      .offset(offset);

    console.log(`✅ Fetched ${result.length} problems`);

    return NextResponse.json({
      success: true,
      data: result,
      count: result.length,
    }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('❌ Error fetching problems:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch problems',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
  const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const data = await request.json();
    const { problemId, status, code, language, solvedAt } = data;

    // Check if progress exists
    const existing = await db
      .select()
      .from(userProgress)
      .where(
        and(
          eq(userProgress.userId, session.user.id),
          eq(userProgress.problemId, problemId)
        )
      )
      .limit(1);

    let result;

    if (existing.length > 0) {
      // Update existing progress
      result = await db
        .update(userProgress)
        .set({
          status,
          code,
          language,
          solvedAt: solvedAt ? new Date(solvedAt) : null,
          updatedAt: new Date(),
        })
        .where(eq(userProgress.id, existing[0].id))
        .returning();
    } else {
      // Create new progress
      result = await db
        .insert(userProgress)
        .values({
          userId: session.user.id,
          problemId,
          status,
          code,
          language,
          solvedAt: solvedAt ? new Date(solvedAt) : null,
        })
        .returning();
    }

    return NextResponse.json({
      success: true,
      data: result[0],
    });
  } catch (error) {
    console.error('Error updating progress:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update progress' },
      { status: 500 }
    );
  }
}
