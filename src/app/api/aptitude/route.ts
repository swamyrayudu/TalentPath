import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { questions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const topic = searchParams.get('topic');

    if (!topic) {
      // Return all distinct topics
      const topicsRaw = await db.select({ topic: questions.topic })
        .from(questions)
        .groupBy(questions.topic)
        .orderBy(questions.topic);

      const topics = topicsRaw.map(t => t.topic).filter(Boolean);
      return NextResponse.json({ success: true, topics });
    }

    // Return questions for given topic
    const questionsList = await db.select().from(questions).where(eq(questions.topic, topic));
    return NextResponse.json({ success: true, questions: questionsList });
    
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
