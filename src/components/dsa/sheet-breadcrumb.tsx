import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export type Crumb = { label: string; href?: string };

/** Trail above a sheet page. The last crumb is the current page and is never a link. */
export function SheetBreadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1 text-sm">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;

          return (
            <li key={`${item.label}-${i}`} className="flex items-center gap-1">
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? 'font-medium' : 'text-muted-foreground'}>
                  {item.label}
                </span>
              )}
              {!isLast && (
                <ChevronRight
                  className="size-3.5 text-muted-foreground/50"
                  strokeWidth={1.75}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
