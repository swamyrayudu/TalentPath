import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  ResumeExtractionError,
  extractResumeText,
  MAX_RESUME_BYTES,
} from '@/lib/resume/extract-text';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Resume text extraction (PDF, DOCX, TXT).
 *
 * The parsing itself lives in @/lib/resume/extract-text so this route and the
 * ATS checker cannot drift apart on what counts as a readable resume.
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: 'Authentication required' },
      { status: 401 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch (error) {
    console.error('FormData parsing error:', error);
    return NextResponse.json(
      { success: false, error: 'Invalid request format. Please ensure you are uploading a file.' },
      { status: 400 },
    );
  }

  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
  }
  if (file.size > MAX_RESUME_BYTES) {
    return NextResponse.json(
      { success: false, error: 'File size exceeds 5MB limit' },
      { status: 400 },
    );
  }

  try {
    const text = await extractResumeText(file);
    return NextResponse.json({
      success: true,
      text,
      characters: text.length,
      words: text.split(/\s+/).filter(Boolean).length,
    });
  } catch (error) {
    if (error instanceof ResumeExtractionError) {
      return NextResponse.json(
        { success: false, error: error.message, fallbackToManual: error.fallbackToManual },
        { status: 400 },
      );
    }
    console.error('Resume extraction failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to read that file. Please try copying the text manually.',
        fallbackToManual: true,
      },
      { status: 500 },
    );
  }
}
