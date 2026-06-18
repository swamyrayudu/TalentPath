import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { patternProblems, users, problems } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';

async function verifyAdmin() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Unauthorized', status: 401 };
  }

  const user = await db
    .select()
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (user[0]?.role !== 'admin') {
    return { error: 'Forbidden: Admin access required', status: 403 };
  }

  return { userId: session.user.id };
}

// GET problems linked to this pattern
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminCheck = await verifyAdmin();
    if (adminCheck.error) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
    }

    const { id } = await params;

    // Get problems linked to the pattern
    const linkedProblems = await db
      .select({
        id: problems.id,
        title: problems.title,
        slug: problems.slug,
        difficulty: problems.difficulty,
        platform: problems.platform,
        url: problems.url,
      })
      .from(patternProblems)
      .innerJoin(problems, eq(patternProblems.problemId, problems.id))
      .where(eq(patternProblems.patternId, id))
      .orderBy(problems.title);

    return NextResponse.json({
      success: true,
      data: linkedProblems
    });
  } catch (error) {
    console.error('Error fetching pattern problems:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch pattern problems' },
      { status: 500 }
    );
  }
}

// POST link problem to pattern
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminCheck = await verifyAdmin();
    if (adminCheck.error) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
    }

    const { id } = await params;
    const { problemId } = await request.json();

    if (!problemId) {
      return NextResponse.json({ error: 'problemId is required' }, { status: 400 });
    }

    // Insert relationship
    const link = await db
      .insert(patternProblems)
      .values({
        id: crypto.randomUUID(),
        patternId: id,
        problemId: Number(problemId),
      })
      .returning();

    return NextResponse.json({
      success: true,
      data: link[0]
    });
  } catch (error) {
    console.error('Error linking problem to pattern:', error);
    if (error && typeof error === 'object' && 'code' in error && error.code === '23505') { // unique constraint
      return NextResponse.json({ error: 'This problem is already in this pattern' }, { status: 400 });
    }
    return NextResponse.json(
      { success: false, error: 'Failed to add problem to pattern' },
      { status: 500 }
    );
  }
}

// DELETE unlink problem from pattern
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminCheck = await verifyAdmin();
    if (adminCheck.error) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const problemIdStr = searchParams.get('problemId');

    if (!problemIdStr) {
      return NextResponse.json({ error: 'problemId parameter is required' }, { status: 400 });
    }

    const problemId = Number(problemIdStr);

    const deleted = await db
      .delete(patternProblems)
      .where(
        and(
          eq(patternProblems.patternId, id),
          eq(patternProblems.problemId, problemId)
        )
      )
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json({ error: 'Relation not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Problem removed from pattern successfully'
    });
  } catch (error) {
    console.error('Error removing problem from pattern:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove problem from pattern' },
      { status: 500 }
    );
  }
}
