import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import mammoth from 'mammoth';

// Configure the route to handle file uploads
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Resume Text Extraction API
 * Extracts text from uploaded resume files (PDF, DOCX, TXT)
 * 
 * Uses:
 * - pdf2json for PDF files (no native dependencies)
 * - mammoth for DOCX files
 * - Native text reading for TXT files
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    let formData;
    try {
      formData = await request.formData();
    } catch (formError) {
      console.error('FormData parsing error:', formError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid request format. Please ensure you are uploading a file.' 
        },
        { status: 400 }
      );
    }

    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Check file type
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain',
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid file type. Only PDF, DOCX, DOC, and TXT files are supported.' 
        },
        { status: 400 }
      );
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds 5MB limit' },
        { status: 400 }
      );
    }

    // Extract text based on file type
    let extractedText = '';

    if (file.type === 'text/plain') {
      // Plain text files - direct read
      extractedText = await file.text();
    } else if (file.type === 'application/pdf') {
      // PDF files - extract text from buffer
      try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        // Try multiple PDF parsing approaches
        let pdfText = '';
        
        try {
          // Approach 1: Try pdf2json first (no native deps)
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const PDFParser = require('pdf2json');
          
          const parsePDF = (): Promise<string> => {
            return new Promise((resolve, reject) => {
              const pdfParser = new PDFParser();
              
              pdfParser.on('pdfParser_dataError', (errData: Error) => {
                reject(errData);
              });
              
              pdfParser.on('pdfParser_dataReady', () => {
                try {
                  const text = pdfParser.getRawTextContent();
                  resolve(text || '');
                } catch (err) {
                  reject(err);
                }
              });
              
              pdfParser.parseBuffer(buffer);
            });
          };
          
          pdfText = await parsePDF();
        } catch (pdfError) {
          console.log('pdf2json failed, trying alternative method...', pdfError);
          
          // Approach 2: Fallback to simple text extraction
          // This is a basic fallback - just look for readable text in the buffer
          const bufferStr = buffer.toString('binary');
          const textMatches = bufferStr.match(/\(([^)]+)\)/g);
          if (textMatches) {
            pdfText = textMatches
              .map(match => match.slice(1, -1))
              .join(' ')
              .replace(/\\[nr]/g, '\n')
              .trim();
          }
        }
        
        // Clean up the text
        extractedText = pdfText
          .replace(/\r\n/g, '\n')
          .replace(/\n\s*\n\s*\n/g, '\n\n')
          .trim();
        
        console.log('PDF extracted text length:', extractedText.length);
        console.log('PDF extracted text preview:', extractedText.substring(0, 200));
        
        // If no text extracted, the PDF might be scanned/image-based
        if (!extractedText || extractedText.length === 0) {
          return NextResponse.json({
            success: false,
            error: 'No text could be extracted from this PDF. This usually means:\n\n' +
                   '• The PDF is a scanned image (not searchable text)\n' +
                   '• The PDF uses complex formatting or embedded images\n' +
                   '• The PDF is encrypted or password-protected\n\n' +
                   'Please copy the text from your PDF and paste it manually in the text area below.',
            fallbackToManual: true,
          }, { status: 400 });
        }
          
      } catch (error) {
        console.error('PDF parsing error:', error);
        return NextResponse.json({
          success: false,
          error: 'Failed to parse PDF file. The file may be encrypted, scanned, or corrupted. Please try copying the text manually.',
          fallbackToManual: true,
        }, { status: 400 });
      }
    } else if (
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.type === 'application/msword'
    ) {
      // Word documents - use mammoth
      try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const result = await mammoth.extractRawText({ buffer });
        extractedText = result.value;
        
        if (result.messages && result.messages.length > 0) {
          console.log('Mammoth warnings:', result.messages);
        }
      } catch (error) {
        console.error('Word document parsing error:', error);
        return NextResponse.json({
          success: false,
          error: 'Failed to parse Word document. Please ensure it\'s a valid DOCX file or try copying the text manually.',
          fallbackToManual: true,
        }, { status: 400 });
      }
    }

    // Basic validation - allow shorter text for PDFs that might have formatting issues
    if (!extractedText || extractedText.trim().length < 20) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Resume text is too short or could not be extracted. If you uploaded a scanned PDF or image-based PDF, please copy and paste the text manually instead.',
          fallbackToManual: true,
        },
        { status: 400 }
      );
    }

    // Warn if text seems very short
    if (extractedText.trim().length < 100) {
      console.warn('Warning: Extracted resume text is very short:', extractedText.length, 'characters');
    }

    // Truncate to reasonable length (max 10,000 characters to avoid token limits)
    const maxLength = 10000;
    if (extractedText.length > maxLength) {
      extractedText = extractedText.substring(0, maxLength) + '\n\n[Resume truncated for length]';
    }

    return NextResponse.json({
      success: true,
      text: extractedText,
      metadata: {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        characterCount: extractedText.length,
      },
    });

  } catch (error) {
    console.error('Resume extraction error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to extract resume text',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to check if resume extraction is available
 */
export async function GET() {
  return NextResponse.json({
    available: true,
    supportedFormats: [
      { type: 'text/plain', status: 'fully-supported', name: 'Plain Text (.txt)' },
      { type: 'application/pdf', status: 'fully-supported', name: 'PDF (.pdf)' },
      { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', status: 'fully-supported', name: 'Word Document (.docx)' },
      { type: 'application/msword', status: 'fully-supported', name: 'Word Document (.doc)' },
    ],
    note: 'All document formats are fully supported with automatic text extraction.',
    maxFileSize: '5MB',
    maxTextLength: 10000,
    libraries: {
      pdf: 'pdf2json',
      word: 'mammoth',
    },
  });
}
