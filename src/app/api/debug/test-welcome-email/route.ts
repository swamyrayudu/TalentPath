import { NextResponse } from 'next/server';
import { emailQueue } from '@/lib/email-queue';

export async function POST(req: Request) {
  try {
    const { email, name } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const jobName = 'sendWelcomeEmail';
    const jobData = {
      email,
      name: name || 'Test Candidate',
    };

    console.log(`[Debug Route] Adding job to email-queue for ${email}`);
    const job = await emailQueue.add(jobName, jobData);

    return NextResponse.json({
      success: true,
      message: 'Job successfully queued',
      jobId: job.id,
      data: jobData,
    });
  } catch (error) {
    console.error('[Debug Route] Error queuing welcome email job:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    }, { status: 500 });
  }
}
