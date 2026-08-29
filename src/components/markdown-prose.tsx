'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';

/**
 * Renders Markdown as readable prose.
 *
 * Deliberately no `rehype-raw`: some of this content is converted from HTML
 * written by third parties (external job descriptions), and react-markdown does
 * not execute raw HTML unless that plugin is added. Keep it that way.
 *
 * The project has no @tailwindcss/typography plugin, so every element is styled
 * explicitly rather than relying on `prose`.
 */
export function MarkdownProse({
  content,
  compact = false,
  className = '',
}: {
  content: string;
  compact?: boolean;
  className?: string;
}) {
  const text = compact ? 'text-xs' : 'text-sm';
  const heading = compact ? 'text-xs' : 'text-sm';

  return (
    <div className={`${text} leading-relaxed text-foreground/90 ${className}`}>
      <ReactMarkdown
        components={{
          h1: ({ children }) => (
            <h2 className={`${heading} font-semibold uppercase tracking-wide text-muted-foreground mt-5 mb-2`}>{children}</h2>
          ),
          h2: ({ children }) => (
            <h2 className={`${heading} font-semibold uppercase tracking-wide text-muted-foreground mt-5 mb-2`}>{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className={`${heading} font-semibold uppercase tracking-wide text-muted-foreground mt-5 mb-2`}>{children}</h3>
          ),
          h4: ({ children }) => (
            <h4 className={`${heading} font-semibold uppercase tracking-wide text-muted-foreground mt-5 mb-2`}>{children}</h4>
          ),
          h5: ({ children }) => (
            <h5 className={`${heading} font-semibold uppercase tracking-wide text-muted-foreground mt-5 mb-2`}>{children}</h5>
          ),
          h6: ({ children }) => (
            <h6 className={`${heading} font-semibold uppercase tracking-wide text-muted-foreground mt-5 mb-2`}>{children}</h6>
          ),
          p: ({ children }) => <p className="my-2">{children}</p>,
          ul: ({ children }) => <ul className="list-disc pl-5 space-y-1 my-2">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-5 space-y-1 my-2">{children}</ol>,
          li: ({ children }) => <li className="marker:text-muted-foreground">{children}</li>,
          strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
          pre: ({ children }) => (
            <pre className="bg-muted/50 border rounded-md p-3 my-2 overflow-x-auto font-mono text-[0.8125em] whitespace-pre">
              {children}
            </pre>
          ),
          code: ({ children, className: cls }) =>
            cls?.includes('language-') ? (
              <code className="font-mono">{children}</code>
            ) : (
              <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-[0.85em] border">{children}</code>
            ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 pl-3 italic text-muted-foreground my-2">{children}</blockquote>
          ),
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              // noreferrer matters here: these links come from third-party content.
              rel="noopener noreferrer nofollow"
              className="underline underline-offset-2"
            >
              {children}
            </a>
          ),
          hr: () => <hr className="my-4" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
