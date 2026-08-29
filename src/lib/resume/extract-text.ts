import 'server-only';

import mammoth from 'mammoth';

/**
 * Pulls plain text out of an uploaded resume.
 *
 * pdf2json for PDFs (pure JS, no native build step), mammoth for DOCX, direct
 * read for TXT. Scanned/image PDFs contain no text layer at all, so those are
 * reported back as needing a manual paste rather than failing opaquely.
 */

export const MAX_RESUME_BYTES = 5 * 1024 * 1024;

export const ACCEPTED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'text/plain',
] as const;

export const ACCEPTED_EXTENSIONS = ['.pdf', '.docx', '.doc', '.txt'] as const;

export class ResumeExtractionError extends Error {
  constructor(
    message: string,
    /** True when the user can work around this by pasting the text themselves. */
    readonly fallbackToManual = false,
  ) {
    super(message);
    this.name = 'ResumeExtractionError';
  }
}

/** Browsers sometimes send an empty or generic type, so fall back to the extension. */
function resolveKind(file: File): 'pdf' | 'word' | 'text' {
  const name = file.name.toLowerCase();
  const type = file.type;

  if (type === 'application/pdf' || name.endsWith('.pdf')) return 'pdf';
  if (
    type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    type === 'application/msword' ||
    name.endsWith('.docx') ||
    name.endsWith('.doc')
  ) {
    return 'word';
  }
  if (type === 'text/plain' || name.endsWith('.txt')) return 'text';

  throw new ResumeExtractionError('Unsupported file type. Upload a PDF, DOCX or TXT file.');
}

/** NUL bytes turn up in some PDF text layers and break downstream text handling. */
const NUL = String.fromCharCode(0);

function tidy(text: string): string {
  return text
    .split(NUL)
    .join('')
    .replace(/\r\n/g, '\n')
    // pdf2json separates pages with "--------Page (N) Break--------".
    .replace(/-{4,}\s*Page\s*\(\d+\)\s*Break\s*-{4,}/gi, '\n')
    .split('\n')
    .map((line) => line.replace(/[^\S\n]+/g, ' ').trimEnd())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

interface PdfTextRun {
  x?: number;
  y?: number;
  R?: { T?: string }[];
}
interface PdfData {
  Pages?: { Texts?: PdfTextRun[] }[];
}

function median(values: number[]): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

/**
 * Rebuilds text from pdf2json's positioned runs.
 *
 * Only used when the library's own raw-text pass comes back empty. Runs are
 * grouped into lines by their y coordinate and ordered by x; a space is inserted
 * where the horizontal gap is wider than the line's own average character,
 * which is measured per line so the test does not depend on font size.
 */
function textFromGeometry(data: PdfData): string {
  const lines: string[] = [];

  for (const page of data?.Pages ?? []) {
    const rows = new Map<number, { x: number; s: string }[]>();

    for (const run of page.Texts ?? []) {
      const s = (run.R ?? []).map((r) => safeDecode(r.T ?? '')).join('');
      if (!s) continue;
      const key = Math.round((run.y ?? 0) * 4) / 4; // tolerate sub-pixel drift
      const row = rows.get(key);
      if (row) row.push({ x: run.x ?? 0, s });
      else rows.set(key, [{ x: run.x ?? 0, s }]);
    }

    for (const key of [...rows.keys()].sort((a, b) => a - b)) {
      const runs = rows.get(key)!.sort((a, b) => a.x - b.x);

      const perChar: number[] = [];
      for (let i = 0; i < runs.length - 1; i++) {
        const advance = runs[i + 1].x - runs[i].x;
        if (advance > 0 && runs[i].s.length) perChar.push(advance / runs[i].s.length);
      }
      const charWidth = median(perChar);

      let line = runs[0].s;
      for (let i = 1; i < runs.length; i++) {
        const prev = runs[i - 1];
        const gap = runs[i].x - (prev.x + prev.s.length * charWidth);
        const touching = line.endsWith(' ') || runs[i].s.startsWith(' ');
        if (!touching && charWidth > 0 && gap > charWidth * 0.4) line += ' ';
        line += runs[i].s;
      }

      const trimmed = line.trim();
      if (trimmed) lines.push(trimmed);
    }
  }

  return lines.join('\n');
}

/** pdf2json percent-encodes run text; a stray '%' would otherwise throw. */
function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    try {
      return decodeURIComponent(value.replace(/%(?![0-9A-Fa-f]{2})/g, '%25'));
    } catch {
      return value;
    }
  }
}

/** Rough measure of whether a string carries real content rather than punctuation. */
function letterCount(text: string): number {
  return (text.match(/[a-z0-9]/gi) ?? []).length;
}

async function extractPdf(buffer: Buffer): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const PDFParser = require('pdf2json');

  // The second argument is `needRawText`. Without it getRawTextContent() returns
  // an empty string for every document — which read as "this PDF is a scan" and
  // rejected perfectly good resumes.
  const { raw, data } = await new Promise<{ raw: string; data: PdfData }>((resolve, reject) => {
    const parser = new PDFParser(null, 1);
    parser.on('pdfParser_dataError', (err: Error) => reject(err));
    parser.on('pdfParser_dataReady', () => {
      let rawText = '';
      try {
        rawText = parser.getRawTextContent() || '';
      } catch {
        // Throws on some small or unusual files; geometry still works.
      }
      resolve({ raw: rawText, data: (parser.data ?? {}) as PdfData });
    });
    parser.parseBuffer(buffer);
  });

  // The library's own pass keeps words together far better, so prefer it and
  // only rebuild from positions when it produced nothing usable.
  const decodedRaw = safeDecode(raw);
  if (letterCount(decodedRaw) >= 20) return decodedRaw;

  return textFromGeometry(data);
}

export async function extractResumeText(file: File): Promise<string> {
  if (file.size === 0) throw new ResumeExtractionError('That file is empty.');
  if (file.size > MAX_RESUME_BYTES) {
    throw new ResumeExtractionError('File is larger than 5MB.');
  }

  const kind = resolveKind(file);
  const buffer = Buffer.from(await file.arrayBuffer());

  let text = '';
  try {
    if (kind === 'text') {
      text = buffer.toString('utf8');
    } else if (kind === 'pdf') {
      text = await extractPdf(buffer);
    } else {
      text = (await mammoth.extractRawText({ buffer })).value;
    }
  } catch (error) {
    console.error(`[resume] ${kind} extraction failed:`, error);
    throw new ResumeExtractionError(
      kind === 'pdf'
        ? 'Could not read that PDF. It may be encrypted or corrupted.'
        : 'Could not read that document.',
      true,
    );
  }

  const cleaned = tidy(text);

  if (cleaned.length < 20) {
    throw new ResumeExtractionError(
      kind === 'pdf'
        ? 'No text found in that PDF — it is most likely a scan or an image export. Paste the text instead.'
        : 'That file contained almost no text.',
      true,
    );
  }

  return cleaned;
}
