import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { userProgress, problems } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
  const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const progress = await db
      .select({
        progress: userProgress,
        problem: problems,
      })
      .from(userProgress)
      .leftJoin(problems, eq(userProgress.problemId, problems.id))
      .where(eq(userProgress.userId, session.user.id))
      .orderBy(desc(userProgress.updatedAt));

    return NextResponse.json({
      success: true,
      data: progress,
    });
  } catch (error) {
    console.error('Error fetching progress:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch progress' },
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
