// app/api/admin/problems/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createProblem } from '@/lib/db/queries';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

async function isAdmin(userId: string) {
  const user = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return user[0]?.role === 'admin';
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!(await isAdmin(session.user.id))) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await request.json();

    const problemData = {
      title: body.title,
      slug: body.slug,
      isPremium: body.isPremium || false,
      difficulty: body.difficulty,
      platform: body.platform || 'LEETCODE',
      likes: body.likes || 0,
      dislikes: body.dislikes || 0,
      acceptanceRate: body.acceptanceRate?.toString(),
      url: body.url,
      topicTags: body.topicTags || [],
      companyTags: body.companyTags || [],
      mainTopics: body.mainTopics || [],
      topicSlugs: body.topicSlugs || [],
      accepted: body.accepted || 0,
      submissions: body.submissions || 0,
      similarQuestions: body.similarQuestions || [],
    };

    const problem = await createProblem(problemData);

    return NextResponse.json(problem, { status: 201 });
  } catch (error: any) {
    console.error('Error creating problem:', error);
    return NextResponse.json(
      { error: 'Failed to create problem' },
      { status: 500 }
    );
  }
}