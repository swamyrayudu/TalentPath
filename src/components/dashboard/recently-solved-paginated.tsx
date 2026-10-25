'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ChevronLeft, ChevronRight, Code2, ArrowRight } from 'lucide-react';

export interface ProgressWithProblem {
  id: number;
  status: string;
  solvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  problemId: number;
  title: string | null;
  difficulty: string | null;
  platform: string | null;
  slug: string | null;
  topicTags?: unknown;
}

interface RecentlySolvedPaginatedProps {
  items: ProgressWithProblem[];
  pageSize?: number;
}

const shortDate = (d: Date | string) =>
  new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

export function RecentlySolvedPaginated({
  items,
  pageSize = 5,
}: RecentlySolvedPaginatedProps) {
  const [currentPage, setCurrentPage] = useState(1);

  if (!items || items.length === 0) {
    return (
      <div className="flex flex-col items-center py-10 text-center">
        <Code2 className="size-6 text-muted-foreground/40" strokeWidth={1.5} />
        <p className="mt-3 text-sm text-muted-foreground">Nothing solved yet.</p>
        <Link
          href="/dsasheet"
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          Start solving
          <ArrowRight className="size-3.5" />
        </Link>
      </div>
    );
  }

  const totalPages = Math.ceil(items.length / pageSize);
  const validPage = Math.min(currentPage, totalPages);
  const startIndex = (validPage - 1) * pageSize;
  const currentItems = items.slice(startIndex, startIndex + pageSize);

  return (
    <div>
      <div className="divide-y">
        {currentItems.map(item => (
          <div
            key={item.id}
            className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{item.title || 'Untitled problem'}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {item.solvedAt ? shortDate(item.solvedAt) : '—'}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2.5">
              <Badge variant="outline" className="text-xs font-normal">
                {item.difficulty || 'N/A'}
              </Badge>
              <CheckCircle2 className="size-4 text-emerald-500" />
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-3 border-t pt-3.5 mt-3.5">
          <p className="text-xs text-muted-foreground">
            Showing{' '}
            <span className="font-medium text-foreground">
              {startIndex + 1}–{Math.min(startIndex + pageSize, items.length)}
            </span>{' '}
            of <span className="font-medium text-foreground">{items.length}</span>
          </p>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              disabled={validPage === 1}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="size-4" />
              <span className="sr-only">Previous page</span>
            </Button>

            {totalPages <= 5 ? (
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`size-8 rounded-md border text-xs font-medium tabular-nums transition-colors ${
                      validPage === page
                        ? 'border-transparent bg-foreground font-semibold text-background'
                        : 'text-muted-foreground hover:border-primary/40 hover:text-foreground'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
            ) : (
              <span className="px-2 text-xs font-medium tabular-nums text-muted-foreground">
                Page <span className="font-semibold text-foreground">{validPage}</span> of{' '}
                <span className="font-semibold text-foreground">{totalPages}</span>
              </span>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              disabled={validPage === totalPages}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="size-4" />
              <span className="sr-only">Next page</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
