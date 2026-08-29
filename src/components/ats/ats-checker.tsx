'use client';

import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { FileSearch, Loader2, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { ResumeDropzone } from './resume-dropzone';
import { AtsResults } from './ats-results';
import { JobMatches } from './job-matches';
import type { AtsAnalysis, JobRecommendation } from '@/lib/ats/types';

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED = ['.pdf', '.docx', '.doc', '.txt'];

interface AnalyseResponse {
  success: boolean;
  error?: string;
  fallbackToManual?: boolean;
  analysis?: AtsAnalysis;
  recommendations?: JobRecommendation[];
}

export function AtsChecker() {
  const [file, setFile] = useState<File | null>(null);
  const [useJd, setUseJd] = useState(false);
  const [jd, setJd] = useState('');

  // Shown when a PDF has no text layer, so the user still has a way through.
  const [manualMode, setManualMode] = useState(false);
  const [manualText, setManualText] = useState('');

  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AtsAnalysis | null>(null);
  const [recommendations, setRecommendations] = useState<JobRecommendation[]>([]);

  const resultsRef = useRef<HTMLDivElement>(null);

  const selectFile = (picked: File | null) => {
    if (!picked) {
      setFile(null);
      return;
    }
    const name = picked.name.toLowerCase();
    if (!ACCEPTED.some((ext) => name.endsWith(ext))) {
      toast.error('Upload a PDF, DOCX or TXT file.');
      return;
    }
    if (picked.size > MAX_BYTES) {
      toast.error('That file is larger than 5MB.');
      return;
    }
    setFile(picked);
    setManualMode(false);
  };

  const canSubmit = manualMode ? manualText.trim().length >= 100 : Boolean(file);

  const analyse = async () => {
    if (!canSubmit || loading) return;

    setLoading(true);
    setAnalysis(null);
    setRecommendations([]);

    try {
      const form = new FormData();
      if (manualMode) form.append('resumeText', manualText.trim());
      else if (file) form.append('resume', file);
      if (useJd && jd.trim()) form.append('jobDescription', jd.trim());

      const response = await fetch('/api/ats/analyse', { method: 'POST', body: form });
      const data = (await response.json()) as AnalyseResponse;

      if (!response.ok || !data.success || !data.analysis) {
        if (data.fallbackToManual) {
          setManualMode(true);
          setFile(null);
        }
        toast.error(data.error || 'Could not analyse that resume.');
        return;
      }

      setAnalysis(data.analysis);
      setRecommendations(data.recommendations ?? []);
      requestAnimationFrame(() =>
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setAnalysis(null);
    setRecommendations([]);
    setFile(null);
    setManualText('');
    setManualMode(false);
  };

  return (
    <div className="space-y-6">
      {/* Upload */}
      {manualMode ? (
        <div className="rounded-2xl border p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold tracking-tight">Paste your resume</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                That file had no readable text layer — scanned PDFs are images, not text.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setManualMode(false)}
              className="shrink-0 text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
            >
              Upload a file instead
            </button>
          </div>
          <Textarea
            value={manualText}
            onChange={(e) => setManualText(e.target.value)}
            placeholder="Paste the full text of your resume here…"
            className="mt-4 min-h-[220px] text-sm"
            disabled={loading}
          />
          <p className="mt-2 text-xs text-muted-foreground">
            {manualText.trim().length} characters {manualText.trim().length < 100 && '· need at least 100'}
          </p>
        </div>
      ) : (
        <ResumeDropzone file={file} onSelect={selectFile} disabled={loading} />
      )}

      {/* Job description */}
      <div className="rounded-2xl border p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold tracking-tight">
              Job Description <span className="font-normal text-muted-foreground">(optional)</span>
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Enable to compare your resume against a specific job description for a more accurate
              score and targeted suggestions.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="text-xs text-muted-foreground">{useJd ? 'On' : 'Off'}</span>
            <Switch checked={useJd} onCheckedChange={setUseJd} disabled={loading} />
          </div>
        </div>

        {useJd && (
          <Textarea
            value={jd}
            onChange={(e) => setJd(e.target.value)}
            placeholder="Paste the job description here…"
            className="mt-4 min-h-[160px] text-sm"
            disabled={loading}
          />
        )}
      </div>

      {/* Action */}
      <Button size="lg" className="w-full gap-2" disabled={!canSubmit || loading} onClick={analyse}>
        {loading ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Analysing…
          </>
        ) : (
          <>
            <FileSearch className="size-4" />
            Analyse Resume
          </>
        )}
      </Button>

      {loading && (
        <p className="text-center text-xs text-muted-foreground">
          Reading the file, scoring it, then matching it against jobs on TalentPath.
        </p>
      )}

      {/* Results */}
      {analysis && (
        <div ref={resultsRef} className="space-y-6 pt-2">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold tracking-tight">Your results</h2>
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <RotateCcw className="size-3.5" />
              Check another
            </button>
          </div>

          <AtsResults analysis={analysis} />
          <JobMatches jobs={recommendations} />
        </div>
      )}
    </div>
  );
}
