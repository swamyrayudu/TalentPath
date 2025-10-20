import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { questions } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.question || !data.topic) {
      return NextResponse.json({ 
        success: false, 
        error: 'Question text and topic are required' 
      }, { status: 400 });
    }

    // Get max s_no to generate next number
    const result = await db
      .select({ maxSNo: sql<number>`COALESCE(MAX(s_no), 0)` })
      .from(questions);
    
    const nextSNo = (result[0]?.maxSNo || 0) + 1;

    // Prepare question data with s_no
    const questionData = {
      s_no: nextSNo,
      question: data.question,
      topic: data.topic,
      option_a: data.option_a || '',
      option_b: data.option_b || '',
      option_c: data.option_c || '',
      option_d: data.option_d || '',
      explanation: data.explanation || '',
    };

    const inserted = await db
      .insert(questions)
      .values(questionData)
      .returning();

    if (!inserted || inserted.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to insert question' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      question: inserted[0] 
    });
  } catch (error: any) {
    console.error('Error creating question:', error);
    return NextResponse.json({ 
      success: false, 
      error: error?.message || 'Internal server error' 
    }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const data = await request.json();
  const { s_no, ...updateData } = data;
  if (!s_no) return NextResponse.json({ success: false, error: 'Missing question s_no' }, { status: 400 });

  const sNoNum = Number(s_no);

  const updated = await db
    .update(questions)
    .set(updateData)
    .where(eq(questions.s_no, sNoNum))
    .returning();

  if (!updated || updated.length === 0) {
    return NextResponse.json({ success: false, error: 'Question not found or not updated' }, { status: 404 });
  }

  return NextResponse.json({ success: true, question: updated[0] });
}
    
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const s_no = searchParams.get('s_no');
  if (!s_no) return NextResponse.json({ success: false, error: 'Missing question s_no' }, { status: 400 });
  await db.delete(questions).where(eq(questions.s_no, Number(s_no)));
  return NextResponse.json({ success: true });
}
