'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import { Copy, Check } from 'lucide-react';
import 'highlight.js/styles/vs2015.css'; // Dark theme for code blocks

export default function MarkdownMessage({ content }: { content: unknown }) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Ensure we always pass a string to ReactMarkdown. If the incoming content
  // is not a string (for example an object or array), render it as a fenced
  // code block (JSON) so it displays correctly instead of producing
  // "[object Object]".
  const mdContent = typeof content === 'string'
    ? content
    : `\`\`\`json\n${JSON.stringify(content, null, 2)}\n\`\`\``;

  const copyToClipboard = (code: string, id: string) => {
    // Try the async Clipboard API first, fallback to execCommand for older
    // environments or when Clipboard API isn't available (e.g., some iframe
    // contexts).
    const doSet = () => {
      setCopiedCode(id);
      setTimeout(() => setCopiedCode(null), 2000);
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
  navigator.clipboard.writeText(code).then(doSet).catch(() => {
        // Fallback
        const textarea = document.createElement('textarea');
        textarea.value = code;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'absolute';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        try {
          document.execCommand('copy');
          doSet();
        } catch {
          // give up silently
        }
        document.body.removeChild(textarea);
      });
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = code;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'absolute';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        doSet();
      } catch {
        // silent fail
      }
      document.body.removeChild(textarea);
    }
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

            // Robustly extract text from the code element's children. ReactMarkdown
            // sometimes passes nested nodes instead of a plain string, so we need
            // to flatten them into a single string.
            const extractText = (node: unknown): string => {
              if (node == null) return '';
              if (typeof node === 'string') return node;
              if (Array.isArray(node)) return node.map((n) => extractText(n)).join('');
              if (typeof node === 'object' && node !== null) {
                if ('props' in node) {
                  const props = (node as { props?: unknown }).props as { children?: unknown } | undefined;
                  return extractText(props?.children);
                }
                // Handle text nodes from rehype-highlight
                if ('value' in node && typeof (node as {value?: unknown}).value === 'string') {
                  return (node as {value: string}).value;
                }
              }
              return String(node);
            };

            const codeString = extractText(codeElement?.props?.children)?.trim() || '';
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
        {mdContent}
      </ReactMarkdown>
    </div>
  );
}
