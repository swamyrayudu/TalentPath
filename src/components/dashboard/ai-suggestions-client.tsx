'use client';

import React, { useState } from 'react';
import { Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AiSuggestionsCard } from '@/components/dashboard/ai-suggestions-card';
import { generateAiReviewAction } from '@/actions/ai-suggestions.actions';
import type { LearnerProfile, SuggestionResult } from '@/lib/ai-suggestions-types';

interface AiSuggestionsClientProps {
  profile: LearnerProfile;
  initialResult: SuggestionResult | null;
}

export function AiSuggestionsClient({
  profile,
  initialResult,
}: AiSuggestionsClientProps) {
  const [reviewData, setReviewData] = useState<SuggestionResult | null>(initialResult);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleGetAiReview = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await generateAiReviewAction(profile);
      if (response.success && response.data) {
        setReviewData(response.data);
      } else {
        setError(response.error || 'Unable to generate AI review right now. Please try again.');
      }
    } catch (err) {
      console.error('[AI Review Client] Error:', err);
      setError('An unexpected error occurred while contacting AI service.');
    } finally {
      setLoading(false);
    }
  };

  // Loading state while waiting for AI model response
  if (loading && !reviewData) {
    return (
      <section className="rounded-2xl border bg-card p-5 md:p-6 shadow-sm animate-pulse">
        <div className="flex items-center gap-2.5 border-b pb-4">
          <Loader2 className="size-4 animate-spin text-primary" />
          <h2 className="text-sm font-semibold">Generating AI Review...</h2>
          <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            Analyzing your activity
          </span>
        </div>
        <div className="divide-y pt-2">
          {[0, 1, 2].map(i => (
            <div key={i} className="py-4">
              <div className="h-2.5 w-16 rounded bg-muted" />
              <div className="mt-3 h-4 w-1/3 rounded bg-muted" />
              <div className="mt-2.5 h-3.5 w-2/3 rounded bg-muted" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  // Error state
  if (error && !reviewData) {
    return (
      <section className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleGetAiReview}
            disabled={loading}
            className="shrink-0 gap-1.5"
          >
            <Sparkles className="size-3.5" />
            Try AI Review Again
          </Button>
        </div>
      </section>
    );
  }

  // Not yet called — prompt card with "AI Review" button
  if (!reviewData) {
    return (
      <section className="rounded-2xl border bg-card/60 p-5 md:p-6 shadow-sm transition-all hover:border-primary/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Sparkles className="size-4" />
              </div>
              <h2 className="text-base font-semibold tracking-tight">AI Performance Review</h2>
              <span className="rounded-md border bg-muted/60 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                On Demand
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Analyze your solved DSA problems, aptitude accuracy, and contest performance with AI to uncover weak spots and get personalized next steps.
            </p>
          </div>

          <Button
            onClick={handleGetAiReview}
            disabled={loading}
            className="group shrink-0 gap-2 font-medium shadow-sm"
          >
            <Sparkles className="size-4 transition-transform group-hover:rotate-12" />
            AI Review
          </Button>
        </div>
      </section>
    );
  }

  // Generated suggestions view
  return (
    <AiSuggestionsCard
      suggestions={reviewData.suggestions}
      source={reviewData.source}
      onRefresh={handleGetAiReview}
      isRefreshing={loading}
    />
  );
}
