import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch user progress
    const progress = await db.execute(sql`
      SELECT 
        id,
        user_id as "userId",
        problem_id as "problemId",
        status,
        code,
        language,
        solved_at as "solvedAt",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM user_progress
      WHERE user_id = ${session.user.id}
      ORDER BY updated_at DESC
    `);

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

    console.log(`Updating progress - User: ${session.user.id}, Problem: ${problemId}, Status: ${status}`);

    if (!problemId || !status) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: problemId and status' },
        { status: 400 }
      );
    }

    const numericProblemId = Number(problemId);
    const userId = session.user.id;

    // First, check if record exists
    const existingRows = await db.execute(sql`
      SELECT id FROM user_progress 
      WHERE user_id = ${userId} AND problem_id = ${numericProblemId}
      LIMIT 1
    `);

    const existing = existingRows as unknown as { id: number }[];

    if (existing && existing.length > 0) {
      // Update existing record
      console.log(`Updating existing record ID: ${existing[0].id}`);
      await db.execute(sql`
        UPDATE user_progress 
        SET 
          status = ${status},
          code = ${code || null},
          language = ${language || null},
          solved_at = ${solvedAt || null},
          updated_at = NOW()
        WHERE id = ${existing[0].id}
      `);
    } else {
      // Insert new record - generate id from timestamp + random for uniqueness
      const newId = Date.now();
      console.log(`Inserting new progress record with ID: ${newId}`);
      await db.execute(sql`
        INSERT INTO user_progress (id, user_id, problem_id, status, code, language, solved_at, created_at, updated_at)
        VALUES (${newId}, ${userId}, ${numericProblemId}, ${status}, ${code || null}, ${language || null}, ${solvedAt || null}, NOW(), NOW())
      `);
    }

    console.log(`Progress saved successfully`);
    return NextResponse.json({
      success: true,
      data: { problemId: numericProblemId, status },
    });

  } catch (error) {
    console.error('Error updating progress:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update progress', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
