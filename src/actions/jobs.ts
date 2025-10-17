'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { jobs } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

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

  // Check if user is admin
  if ((session?.user as any)?.role !== 'admin') {
    throw new Error('Unauthorized: Admin access required');
  }

  const newJob = await db.insert(jobs).values({
    ...formData,
    createdBy: session?.user?.id as string,
  }).returning();

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

  if ((session?.user as any)?.role !== 'admin') {
    throw new Error('Unauthorized: Admin access required');
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

  if ((session?.user as any)?.role !== 'admin') {
    throw new Error('Unauthorized: Admin access required');
  }

  await db.delete(jobs).where(eq(jobs.id, jobId));

  revalidatePath('/admin/jobs');
  revalidatePath('/jobs');

  return { success: true };
}

export async function toggleJobStatus(jobId: string) {
  const session = await auth();

  if ((session?.user as any)?.role !== 'admin') {
    throw new Error('Unauthorized: Admin access required');
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
