'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import { Copy, Check } from 'lucide-react';
import 'highlight.js/styles/vs2015.css'; // Dark theme for code blocks

export default function MarkdownMessage({ content }: { content: string }) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="prose prose-sm dark:prose-invert max-w-none markdown-content">
      <ReactMarkdown
        rehypePlugins={[rehypeHighlight, rehypeRaw]}
        components={{
        // Headings with unique styling
        h1: ({ children }) => (
          <h1 className="text-xl font-bold mt-4 mb-2 text-amber-600 dark:text-amber-400 border-b-2 border-amber-500 pb-2">
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-lg font-bold mt-3 mb-2 text-amber-600 dark:text-amber-400">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-base font-semibold mt-2 mb-1 text-amber-600 dark:text-amber-400">
            {children}
          </h3>
        ),
        
        // Code blocks with syntax highlighting and copy button
        pre: ({ children, ...props }) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const codeElement = children as any;
          const codeString = codeElement?.props?.children?.toString() || '';
          const className = codeElement?.props?.className || '';
          const match = /language-(\w+)/.exec(className);
          const language = match ? match[1] : 'text';
          const codeId = `code-${Math.random().toString(36).substr(2, 9)}`;

          return (
            <div className="relative group my-4">
              <div className="flex items-center justify-between bg-gray-800 px-4 py-2 rounded-t-lg">
                <span className="text-xs text-gray-400 font-mono">{language}</span>
                <button
                  onClick={() => copyToClipboard(codeString, codeId)}
                  className="text-gray-400 hover:text-white transition-colors"
                  title="Copy code"
                >
                  {copiedCode === codeId ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
              <pre className="!mt-0 !mb-0 rounded-b-lg overflow-x-auto" {...props}>
                {children}
              </pre>
            </div>
          );
        },
        
        // Inline code
        code: ({ inline, children, ...props }: {
          inline?: boolean;
          children?: React.ReactNode;
        }) => {
          return inline ? (
            <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono text-amber-600 dark:text-amber-400" {...props}>
              {children}
            </code>
          ) : (
            <code {...props}>{children}</code>
          );
        },

        // Lists
        ul: ({ children }) => (
          <ul className="list-disc list-inside space-y-1 my-2">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal list-inside space-y-1 my-2">{children}</ol>
        ),

        // Links
        a: ({ children, href }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-600 dark:text-amber-400 hover:underline"
          >
            {children}
          </a>
        ),

        // Blockquotes
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-amber-500 pl-4 italic text-gray-700 dark:text-gray-300 my-2">
            {children}
          </blockquote>
        ),

        // Paragraphs
        p: ({ children }) => (
          <p className="my-2 leading-relaxed">{children}</p>
        ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
