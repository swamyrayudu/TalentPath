import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

interface ProgressWithProblem {
  problemId: number;
  status: string;
  difficulty: string | null;
  platform: string | null;
  topicSlugs: string[] | null;
}

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      // Return empty progress for unauthenticated users instead of 401
      return NextResponse.json(
        { success: true, data: [] },
        { status: 200 }
      );
    }

    // Fetch user progress with problem details from visible_problems
    const progress = await db.execute(sql`
      SELECT 
        up.problem_id as "problemId",
        up.status,
        vp.difficulty,
        vp.platform,
        vp.topic_slugs as "topicSlugs"
      FROM user_progress up
      LEFT JOIN visible_problems vp ON up.problem_id = vp.id
      WHERE up.user_id = ${session.user.id}
        AND up.status = 'solved'
    `);

    // Process the results to ensure topicSlugs is an array
    const progressArray = progress as unknown as ProgressWithProblem[];
    const processedProgress = progressArray.map(p => ({
      problemId: p.problemId,
      status: p.status,
      difficulty: p.difficulty?.toUpperCase() || null,
      platform: p.platform?.toUpperCase() || null,
      topicSlugs: Array.isArray(p.topicSlugs) ? p.topicSlugs : 
                  (typeof p.topicSlugs === 'string' ? JSON.parse(p.topicSlugs) : []),
    }));

    return NextResponse.json({
      success: true,
      data: processedProgress,
    });
  } catch (error) {
    console.error('Error fetching progress with problems:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch progress' },
      { status: 500 }
    );
  }
}
