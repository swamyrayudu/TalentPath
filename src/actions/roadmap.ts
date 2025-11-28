'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { roadmaps, roadmapSteps, userRoadmapProgress } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

// Get all active roadmaps
export async function getAllRoadmaps() {
  const activeRoadmaps = await db
    .select()
    .from(roadmaps)
    .where(eq(roadmaps.isActive, true))
    .orderBy(desc(roadmaps.createdAt));

  return activeRoadmaps;
}

// Get roadmap with steps
export async function getRoadmapWithSteps(roadmapId: string) {
  const roadmap = await db.query.roadmaps.findFirst({
    where: eq(roadmaps.id, roadmapId),
  });

  const steps = await db
    .select()
    .from(roadmapSteps)
    .where(eq(roadmapSteps.roadmapId, roadmapId))
    .orderBy(roadmapSteps.orderIndex);

  return { roadmap, steps };
}

// Create roadmap (admin only)
type RoadmapCategory =
  | 'frontend'
  | 'backend'
  | 'fullstack'
  | 'devops'
  | 'mobile'
  | 'data-science'
  | 'ai-ml'
  | 'cybersecurity'
  | 'other';

type RoadmapDifficulty = 'beginner' | 'intermediate' | 'advanced';

export async function createRoadmap(data: {
  title: string;
  description: string;
  category: RoadmapCategory;
  difficulty: RoadmapDifficulty;
  estimatedTime?: string;
  icon?: string;
}) {
  const session = await auth();

  // Ensure the user is authenticated and an admin
  if (!session?.user) {
    throw new Error('Unauthorized: Admin access required');
  }

  if ((session.user as { role?: string })?.role !== 'admin') {
    throw new Error('Unauthorized: Admin access required');
  }

  const userId = session.user.id as string;

  const newRoadmap = await db.insert(roadmaps).values({
    title: data.title,
    description: data.description,
    category: data.category,
    difficulty: data.difficulty,
    estimatedTime: data.estimatedTime,
    icon: data.icon,
    createdBy: userId,
  }).returning();

  revalidatePath('/admin/roadmap');
  revalidatePath('/roadmap');

  return newRoadmap[0];
}

// Add step to roadmap (admin only)
export async function addRoadmapStep(data: {
  roadmapId: string;
  title: string;
  description: string;
  resources?: string;
  orderIndex: number;
}) {
  const session = await auth();

  if ((session?.user as { role?: string })?.role !== 'admin') {
    throw new Error('Unauthorized: Admin access required');
  }

  const newStep = await db.insert(roadmapSteps).values(data).returning();

  revalidatePath(`/admin/roadmap/${data.roadmapId}`);
  revalidatePath(`/roadmap/${data.roadmapId}`);

  return newStep[0];
}

// Get user progress
export async function getUserProgress(roadmapId: string) {
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  const progress = await db.query.userRoadmapProgress.findFirst({
    where: and(
      eq(userRoadmapProgress.userId, session.user.id as string),
      eq(userRoadmapProgress.roadmapId, roadmapId)
    ),
  });

  return progress;
}

// Toggle step completion
// Toggle step completion
// Toggle step completion
export async function toggleStepCompletion(roadmapId: string, stepId: string) {
  const session = await auth();

  if (!session?.user) {
    throw new Error('Please login to track progress');
  }

  const userId = session.user.id as string;

  // Get existing progress
  const existingProgress = await db.query.userRoadmapProgress.findFirst({
    where: and(
      eq(userRoadmapProgress.userId, userId),
      eq(userRoadmapProgress.roadmapId, roadmapId)
    ),
  });

  if (existingProgress) {
    // Safely parse completedSteps - handle array, string, or empty values
    let completedSteps: string[] = [];
    if (existingProgress.completedSteps) {
      if (Array.isArray(existingProgress.completedSteps)) {
        completedSteps = existingProgress.completedSteps;
      } else if (typeof existingProgress.completedSteps === 'string') {
        try {
          const parsed = JSON.parse(existingProgress.completedSteps);
          completedSteps = Array.isArray(parsed) ? parsed : [];
        } catch {
          completedSteps = [];
        }
      }
    }
    
    const index = completedSteps.indexOf(stepId);

    if (index > -1) {
      completedSteps.splice(index, 1); // Remove step
    } else {
      completedSteps.push(stepId); // Add step
    }

    // ✅ REMOVE lastUpdated from here - trigger will handle it
    await db
      .update(userRoadmapProgress)
      .set({
        completedSteps: JSON.stringify(completedSteps),
        // Removed lastUpdated line
      })
      .where(eq(userRoadmapProgress.id, existingProgress.id));
  } else {
    // Create new progress record
    await db.insert(userRoadmapProgress).values({
      userId,
      roadmapId,
      completedSteps: JSON.stringify([stepId]),
    });
  }

  revalidatePath(`/roadmap/${roadmapId}`);

  return { success: true };
}



// Delete roadmap (admin only)
export async function deleteRoadmap(roadmapId: string) {
  const session = await auth();

  if ((session?.user as { role?: string })?.role !== 'admin') {
    throw new Error('Unauthorized: Admin access required');
  }

  await db.delete(roadmaps).where(eq(roadmaps.id, roadmapId));

  revalidatePath('/admin/roadmap');
  revalidatePath('/roadmap');

  return { success: true };
}
