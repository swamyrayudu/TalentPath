'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, X, Sparkles, Loader2 } from 'lucide-react';

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
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Resume Upload (Optional)
        </CardTitle>
        <CardDescription>
          Upload your resume (text-based PDF, Word, or TXT) or paste the text manually below to get personalized interview questions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* File Upload */}
        <div className="space-y-2">
          <Label htmlFor="resume-upload">Upload Resume</Label>
          <div className="flex items-center gap-2">
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
              className="w-full"
            >
              {isExtracting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Extracting text...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload PDF, TXT, or Word
                </>
              )}
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground">
            Note: Scanned PDFs (images) won&apos;t work. Use the text paste option below instead.
          </p>
          
          {uploadedFile && (
            <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm flex-1">{uploadedFile.name}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Or Manual Input */}
        <div className="space-y-2">
          <Label htmlFor="resume-text">Or Paste Resume Text</Label>
          <Textarea
            id="resume-text"
            value={resumeText}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder="Paste your resume text here...&#10;&#10;Example:&#10;John Doe&#10;Software Engineer&#10;&#10;Experience:&#10;- 3 years at Google as SWE&#10;- Python, React, AWS&#10;- Led team of 5 engineers..."
            className="min-h-[200px] font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Include your experience, skills, education, and projects for personalized questions
          </p>
        </div>

        {/* AI Badge */}
        {resumeText && (
          <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/20">
            <Sparkles className="h-4 w-4 text-purple-500" />
            <div className="flex-1">
              <p className="text-sm font-medium">AI Personalization Active</p>
              <p className="text-xs text-muted-foreground">
                Interview questions will be tailored to your background
              </p>
            </div>
            <Badge variant="secondary" className="bg-purple-500/10 text-purple-700 dark:text-purple-300">
              {resumeText.length} chars
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
