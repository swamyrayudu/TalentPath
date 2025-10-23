import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { problems, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function isAdmin(userId: string) {
  const user = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return user[0]?.role === 'admin';
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (!(await isAdmin(session.user.id))) {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    const { id } = await params;
    const parsedId = parseInt(id);
    if (isNaN(parsedId)) {
      return NextResponse.json({ success: false, error: 'Invalid problem ID' }, { status: 400 });
    }

    const data = await request.json();

    const problemData = {
      title: data.title,
      slug: data.slug,
      isPremium: data.isPremium || false,
      difficulty: data.difficulty,
      platform: data.platform || 'LEETCODE',
      likes: data.likes || 0,
      dislikes: data.dislikes || 0,
      acceptanceRate: data.acceptanceRate?.toString(),
      url: data.url,
      topicTags: data.topicTags || [],
      companyTags: data.companyTags || [],
      mainTopics: data.mainTopics || [],
      topicSlugs: data.topicSlugs || [],
      accepted: data.accepted || 0,
      submissions: data.submissions || 0,
      similarQuestions: data.similarQuestions || [],
      updatedAt: new Date(),
    };

    const result = await db
      .update(problems)
      .set(problemData)
      .where(eq(problems.id, parsedId))
      .returning();

    if (result.length === 0) {
      return NextResponse.json({ success: false, error: 'Problem not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: result[0],
    });
  } catch (error) {
    console.error('Error updating problem:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update problem' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (!(await isAdmin(session.user.id))) {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    const { id } = await params;
    const parsedId = parseInt(id);
    if (isNaN(parsedId)) {
      return NextResponse.json({ success: false, error: 'Invalid problem ID' }, { status: 400 });
    }

    const result = await db
      .delete(problems)
      .where(eq(problems.id, parsedId))
      .returning();

    if (result.length === 0) {
      return NextResponse.json({ success: false, error: 'Problem not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Problem deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting problem:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete problem' },
      { status: 500 }
    );
  }
}
