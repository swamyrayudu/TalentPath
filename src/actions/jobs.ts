'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { jobs } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { notifyJobPosted } from './notifications.actions';

export async function createJob(formData: {
  title: string;
  company: string;
  location: string;
  locationType: 'remote' | 'onsite' | 'hybrid';
  jobType: 'full-time' | 'part-time' | 'contract' | 'internship';
  description: string;
  requirements: string;
  salary?: string;
  applyUrl: string;
  companyLogo?: string;
}) {
  const session = await auth();
  // Require authentication but do not require admin role
  if (!session?.user) {
    throw new Error('Unauthorized: Please login');
  }

  const newJob = await db.insert(jobs).values({
    ...formData,
    createdBy: session?.user?.id as string,
  }).returning();

  // Send notifications to all users
  try {
    console.log('🔔 Attempting to send job notifications...', {
      jobId: newJob[0].id,
      title: newJob[0].title,
      company: newJob[0].company
    });
    
    const result = await notifyJobPosted(newJob[0].id, newJob[0].title, newJob[0].company);
    
    if (result.success) {
      console.log('✅ Job notifications sent successfully');
    } else if ('error' in result) {
      console.error('❌ Failed to send job notifications:', result.error);
    }
  } catch (error) {
    console.error('❌ Error in notifyJobPosted:', error);
  }

  revalidatePath('/admin/jobs');
  revalidatePath('/jobs');

  return newJob[0];
}

export async function getAllJobs() {
  const allJobs = await db
    .select()
    .from(jobs)
    .orderBy(desc(jobs.createdAt));

  return allJobs;
}

export async function getActiveJobs() {
  const activeJobs = await db
    .select()
    .from(jobs)
    .where(eq(jobs.isActive, true))
    .orderBy(desc(jobs.createdAt));

  return activeJobs;
}

export async function updateJob(
  jobId: string,
  formData: {
    title: string;
    company: string;
    location: string;
    locationType: 'remote' | 'onsite' | 'hybrid';
    jobType: 'full-time' | 'part-time' | 'contract' | 'internship';
    description: string;
    requirements: string;
    salary?: string;
    applyUrl: string;
    companyLogo?: string;
    isActive: boolean;
  }
) {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized: Please login');
  }

  const updatedJob = await db
    .update(jobs)
    .set({
      ...formData,
      updatedAt: new Date(),
    })
    .where(eq(jobs.id, jobId))
    .returning();

  revalidatePath('/admin/jobs');
  revalidatePath('/jobs');

  return updatedJob[0];
}

export async function deleteJob(jobId: string) {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized: Please login');
  }

  await db.delete(jobs).where(eq(jobs.id, jobId));

  revalidatePath('/admin/jobs');
  revalidatePath('/jobs');

  return { success: true };
}

export async function toggleJobStatus(jobId: string) {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized: Please login');
  }

  const job = await db.query.jobs.findFirst({
    where: eq(jobs.id, jobId),
  });

  if (!job) {
    throw new Error('Job not found');
  }

  const updatedJob = await db
    .update(jobs)
    .set({
      isActive: !job.isActive,
      updatedAt: new Date(),
    })
    .where(eq(jobs.id, jobId))
    .returning();

  revalidatePath('/admin/jobs');
  revalidatePath('/jobs');

  return updatedJob[0];
}
