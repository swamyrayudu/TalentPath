// lib/hooks/useInfiniteProblems.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Problem } from '@/lib/db/schema';

interface UseInfiniteProblemsProps {
  initialProblems?: Problem[];
  filters?: {
    difficulty?: string;
    company?: string;
    topic?: string;
    search?: string;
  };
}

export function useInfiniteProblems({ 
  initialProblems = [], 
  filters = {} 
}: UseInfiniteProblemsProps) {
  const [problems, setProblems] = useState<Problem[]>(initialProblems);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Reset when filters change
  useEffect(() => {
    setProblems(initialProblems);
    setCursor(null);
    setHasMore(true);
    setError(null);
  }, [JSON.stringify(filters), initialProblems]);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        limit: '20',
        ...(cursor && { cursor }),
        ...(filters.difficulty && { difficulty: filters.difficulty }),
        ...(filters.company && { company: filters.company }),
        ...(filters.topic && { topic: filters.topic }),
        ...(filters.search && { search: filters.search }),
      });

      const response = await fetch(`/api/problems?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch problems');
      }

      const data = await response.json();

      setProblems(prev => {
        // Avoid duplicates when filters change
        const existingIds = new Set(prev.map(p => p.id));
        const newProblems = data.problems.filter((p: Problem) => !existingIds.has(p.id));
        return [...prev, ...newProblems];
      });

      setCursor(data.nextCursor);
      setHasMore(data.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [cursor, loading, hasMore, filters]);

  return {
    problems,
    loading,
    hasMore,
    error,
    loadMore,
    refresh: () => {
      setProblems([]);
      setCursor(null);
      setHasMore(true);
      loadMore();
    }
  };
}