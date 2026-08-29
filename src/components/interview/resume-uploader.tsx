'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, X, Loader2 } from 'lucide-react';

interface ResumeUploaderProps {
  onResumeExtracted: (resumeText: string) => void;
  className?: string;
}

export default function ResumeUploader({ onResumeExtracted, className }: ResumeUploaderProps) {
  const [resumeText, setResumeText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    const validTypes = ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a PDF, TXT, or Word document');
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    setUploadedFile(file);
    setIsExtracting(true);

    try {
      // For PDF/Word, you'd need a backend service to extract text
      // For now, we'll handle TXT files directly
      if (file.type === 'text/plain') {
        const text = await file.text();
        setResumeText(text);
        onResumeExtracted(text);
      } else {
        // Send to backend for extraction (PDF/Word)
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/resume/extract', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();

        // Handle not implemented (501) - fallback to manual paste
        if (response.status === 501 && data.fallbackToManual) {
          alert(data.error + '\n\nPlease use the text area below to paste your resume content.');
          setUploadedFile(null);
          return;
        }

        if (!response.ok) {
          // If parsing failed but fallback is suggested
          if (data.fallbackToManual) {
            alert(data.error + '\n\nPlease use the text area below to paste your resume content.');
            setUploadedFile(null);
            return;
          }
          throw new Error(data.error || 'Failed to extract resume text');
        }

        setResumeText(data.text);
        onResumeExtracted(data.text);
      }
    } catch (error) {
      console.error('Error extracting resume:', error);
      alert(`Failed to extract resume: ${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease try pasting the text manually in the text area below.`);
      setUploadedFile(null);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleTextChange = (text: string) => {
    setResumeText(text);
    onResumeExtracted(text);
  };

  const handleClear = () => {
    setResumeText('');
    setUploadedFile(null);
    onResumeExtracted('');
  };

  return (
    <section className={`rounded-2xl border bg-card ${className ?? ''}`}>
      <div className="border-b px-5 py-4">
        <h2 className="text-sm font-semibold tracking-tight">Resume</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Optional — upload or paste it and the questions get tailored to your
          background.
        </p>
      </div>

      <div className="space-y-5 p-5">
        <div className="space-y-2">
          <Input
            id="resume-upload"
            type="file"
            accept=".pdf,.txt,.doc,.docx"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button
            variant="outline"
            onClick={() => document.getElementById('resume-upload')?.click()}
            disabled={isExtracting}
            className="w-full gap-2"
          >
            {isExtracting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Extracting text…
              </>
            ) : (
              <>
                <Upload className="size-4" />
                Upload PDF, TXT or Word
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground">
            Scanned PDFs won&apos;t work — paste the text instead.
          </p>

          {uploadedFile && (
            <div className="flex items-center gap-2 rounded-xl border px-3 py-2">
              <FileText className="size-4 text-muted-foreground" strokeWidth={1.75} />
              <span className="min-w-0 flex-1 truncate text-sm">{uploadedFile.name}</span>
              <Button variant="ghost" size="icon-sm" onClick={handleClear} aria-label="Remove resume">
                <X className="size-4" />
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="resume-text">Or paste the text</Label>
          <Textarea
            id="resume-text"
            value={resumeText}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder="Paste your resume here — experience, skills, education, projects."
            className="min-h-[180px] font-mono text-sm"
          />
        </div>

        {resumeText && (
          <div className="flex items-center justify-between gap-3 rounded-xl border px-4 py-3">
            <p className="text-sm text-muted-foreground">
              Questions will be tailored to your background.
            </p>
            <Badge variant="outline" className="shrink-0 tabular-nums">
              {resumeText.length} chars
            </Badge>
          </div>
        )}
      </div>
    </section>
  );
}
