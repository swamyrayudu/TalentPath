import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { dsaPatterns, patternProblems, users } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { patternCache } from '@/lib/redis';

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

// Helper to slugify a string
function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w-]+/g, '') // Remove all non-word chars
    .replace(/--+/g, '-'); // Replace multiple - with single -
}

export async function GET() {
  try {
    const adminCheck = await verifyAdmin();
    if (adminCheck.error) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
    }

    // Fetch all patterns with their problem count and list of problem IDs
    const patterns = await db
      .select({
        id: dsaPatterns.id,
        name: dsaPatterns.name,
        slug: dsaPatterns.slug,
        description: dsaPatterns.description,
        topic: dsaPatterns.topic,
        orderIndex: dsaPatterns.orderIndex,
        createdAt: dsaPatterns.createdAt,
        problemCount: sql<number>`cast(count(${patternProblems.problemId}) as int)`
      })
      .from(dsaPatterns)
      .leftJoin(patternProblems, eq(dsaPatterns.id, patternProblems.patternId))
      .groupBy(dsaPatterns.id)
      .orderBy(dsaPatterns.orderIndex);

    return NextResponse.json({
      success: true,
      data: patterns
    });
  } catch (error) {
    console.error('Error fetching admin patterns:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch patterns' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminCheck = await verifyAdmin();
    if (adminCheck.error) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
    }

    const { name, description, topic, orderIndex } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const slug = slugify(name);

    // Insert new pattern
    const newPattern = await db
      .insert(dsaPatterns)
      .values({
        id: crypto.randomUUID(),
        name: name.trim(),
        slug,
        description: description?.trim() || null,
        topic: topic?.trim() || null,
        orderIndex: parseInt(orderIndex) || 0,
      })
      .returning();

    // Clear pattern cache
    await patternCache.clear();

    return NextResponse.json({
      success: true,
      data: newPattern[0]
    });
  } catch (error) {
    console.error('Error creating pattern:', error);
    if (error && typeof error === 'object' && 'code' in error && error.code === '23505') { // Postgres Unique Constraint Error
      return NextResponse.json({ error: 'A pattern with this name already exists' }, { status: 400 });
    }
    return NextResponse.json(
      { success: false, error: 'Failed to create pattern' },
      { status: 500 }
    );
  }
}
