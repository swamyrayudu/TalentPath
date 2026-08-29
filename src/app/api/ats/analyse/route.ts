import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { analyseResume } from '@/lib/ats/analyse';
import { recommendJobs } from '@/lib/ats/match-jobs';
import {
  ResumeExtractionError,
  extractResumeText,
  MAX_RESUME_BYTES,
} from '@/lib/resume/extract-text';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Parsing plus a Groq call; the default 10s would cut large PDFs off.
export const maxDuration = 60;

const MAX_JD_CHARS = 8_000;
const MIN_RESUME_CHARS = 100;

/**
 * POST /api/ats/analyse
 *
 * multipart/form-data:
 *   resume          — PDF / DOCX / TXT  (or)
 *   resumeText      — pre-extracted text, for the manual-paste fallback
 *   jobDescription  — optional
 *
 * Returns the ATS analysis plus jobs on this site that match the resume.
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: 'Sign in to check your resume.' },
      { status: 401 },
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Could not read the upload.' },
      { status: 400 },
    );
  }

  const file = form.get('resume');
  const pastedText = form.get('resumeText');
  const rawJd = form.get('jobDescription');
  const jobDescription =
    typeof rawJd === 'string' && rawJd.trim() ? rawJd.trim().slice(0, MAX_JD_CHARS) : null;

  let resumeText: string;

  if (file instanceof File && file.size > 0) {
    if (file.size > MAX_RESUME_BYTES) {
      return NextResponse.json(
        { success: false, error: 'File is larger than 5MB.' },
        { status: 400 },
      );
    }
    try {
      resumeText = await extractResumeText(file);
    } catch (error) {
      if (error instanceof ResumeExtractionError) {
        return NextResponse.json(
          { success: false, error: error.message, fallbackToManual: error.fallbackToManual },
          { status: 400 },
        );
      }
      console.error('[ats] extraction failed:', error);
      return NextResponse.json(
        { success: false, error: 'Could not read that file.', fallbackToManual: true },
        { status: 400 },
      );
    }
  } else if (typeof pastedText === 'string' && pastedText.trim()) {
    resumeText = pastedText.trim();
  } else {
    return NextResponse.json(
      { success: false, error: 'Upload a resume or paste its text.' },
      { status: 400 },
    );
  }

  if (resumeText.length < MIN_RESUME_CHARS) {
    return NextResponse.json(
      {
        success: false,
        error: 'That does not look like a full resume — it is too short to score.',
        fallbackToManual: true,
      },
      { status: 400 },
    );
  }

  try {
    const analysis = await analyseResume({ resumeText, jobDescription });

    // Recommendations depend on the extracted profile, so they run after the
    // analysis. A failure here should not lose the score the user came for.
    const recommendations = await recommendJobs(analysis.profile).catch((error) => {
      console.error('[ats] job matching failed:', error);
      return [];
    });

    return NextResponse.json({
      success: true,
      analysis,
      recommendations,
      usedJobDescription: Boolean(jobDescription),
    });
  } catch (error) {
    console.error('[ats] analysis failed:', error);
    return NextResponse.json(
      { success: false, error: 'Could not analyse the resume. Please try again.' },
      { status: 500 },
    );
  }
}
