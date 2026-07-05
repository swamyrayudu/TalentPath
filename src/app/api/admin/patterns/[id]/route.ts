import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { dsaPatterns, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminCheck = await verifyAdmin();
    if (adminCheck.error) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
    }

    const { id } = await params;
    const { name, description, topic, orderIndex } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const slug = slugify(name);

    const updated = await db
      .update(dsaPatterns)
      .set({
        name: name.trim(),
        slug,
        description: description?.trim() || null,
        topic: topic?.trim() || null,
        orderIndex: parseInt(orderIndex) || 0,
        updatedAt: new Date()
      })
      .where(eq(dsaPatterns.id, id))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ error: 'Pattern not found' }, { status: 404 });
    }

    // Clear pattern cache
    await patternCache.clear();

    return NextResponse.json({
      success: true,
      data: updated[0]
    });
  } catch (error) {
    console.error('Error updating pattern:', error);
    if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
      return NextResponse.json({ error: 'A pattern with this name already exists' }, { status: 400 });
    }
    return NextResponse.json(
      { success: false, error: 'Failed to update pattern' },
      { status: 500 }
    );
  }
}

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

    const deleted = await db
      .delete(dsaPatterns)
      .where(eq(dsaPatterns.id, id))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json({ error: 'Pattern not found' }, { status: 404 });
    }

    // Clear pattern cache
    await patternCache.clear();

    return NextResponse.json({
      success: true,
      message: 'Pattern deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting pattern:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete pattern' },
      { status: 500 }
    );
  }
}
