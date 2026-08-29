import React from 'react';
import { Sparkles } from 'lucide-react';
import { getAiSuggestions } from '@/lib/ai-suggestions';
import type { LearnerProfile } from '@/lib/ai-suggestions';
import { AiSuggestionsCard } from '@/components/dashboard/ai-suggestions-card';

/**
 * Streams in behind Suspense. Generating suggestions means a round trip to the
 * model on a cache miss, which is far too slow to hold up the whole dashboard.
 */
export async function AiSuggestionsSection({
  userId,
  profile,
}: {
  userId: string;
  profile: LearnerProfile;
}) {
  const { suggestions, source } = await getAiSuggestions(userId, profile);
  return <AiSuggestionsCard suggestions={suggestions} source={source} />;
}

export function AiSuggestionsSkeleton() {
  return (
    <section className="rounded-2xl border bg-card">
      <div className="flex items-center gap-2.5 border-b px-5 py-4">
        <Sparkles className="size-4 text-primary" strokeWidth={1.75} />
        <h2 className="text-sm font-semibold">Suggested for you</h2>
        <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          Reading your activity
        </span>
      </div>
      <div className="divide-y">
        {[0, 1, 2].map(i => (
          <div key={i} className="animate-pulse px-5 py-4">
            <div className="h-2 w-16 rounded bg-muted" />
            <div className="mt-3 h-3.5 w-1/3 rounded bg-muted" />
            <div className="mt-2.5 h-3 w-2/3 rounded bg-muted" />
          </div>
        ))}
      </div>
    </section>
  );
}
