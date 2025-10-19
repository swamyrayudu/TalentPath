import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { questions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  // Create new question
  const data = await request.json();
  const inserted = await db.insert(questions).values(data).returning();
  return NextResponse.json({ success: true, question: inserted[0] });
}

export async function PATCH(request: NextRequest) {
  const data = await request.json();
  const { id, ...updateData } = data;
  if (!id) return NextResponse.json({ success: false, error: 'Missing question id' }, { status: 400 });
  const updated = await db.update(questions).set(updateData).where(eq(questions.s_no, id)).returning();
  return NextResponse.json({ success: true, question: updated[0] });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ success: false, error: 'Missing question id' }, { status: 400 });
  await db.delete(questions).where(eq(questions.s_no, Number(id)));
  return NextResponse.json({ success: true });
}
