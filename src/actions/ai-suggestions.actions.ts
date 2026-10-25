'use server';

import { auth } from '@/lib/auth';
import { requestAiReview } from '@/lib/ai-suggestions';
import type { LearnerProfile, SuggestionResult } from '@/lib/ai-suggestions';

export interface AiReviewActionResult {
  success: boolean;
  data?: SuggestionResult;
  error?: string;
}

/**
 * Triggered explicitly when the user clicks the "AI Review" button.
 * Generates custom AI review & suggestions based on their latest stats.
 */
export async function generateAiReviewAction(
  profile: LearnerProfile
): Promise<AiReviewActionResult> {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return {
        success: false,
        error: 'You need to be signed in to generate an AI review.',
      };
    }

    // Force fresh generation on explicit button click
    const result = await requestAiReview(userId, profile, true);

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error('[AI Review Action] Failed to generate review:', error);
    return {
      success: false,
      error: 'Could not generate AI review at this time. Please try again.',
    };
  }
}
