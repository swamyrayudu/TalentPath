'use client';

import React from 'react';
import { MarkdownProse } from '@/components/markdown-prose';

/**
 * Renders a contest question description. Statements in the question library are
 * written in Markdown (headings for Input/Output Format, fenced blocks for
 * examples), so rendering them as raw text inside a <pre> shows the markup
 * verbatim. Plain-text descriptions still render correctly — Markdown treats
 * them as paragraphs — so older questions are unaffected.
 */
export function ProblemStatement({
  content,
  compact = false,
}: {
  content: string;
  compact?: boolean;
}) {
  return <MarkdownProse content={content} compact={compact} className="space-y-3" />;
}
