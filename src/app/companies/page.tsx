'use client';

import React, { useEffect, useState, useMemo, memo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Building2, Search, ChevronLeft, ChevronRight, X } from 'lucide-react';

type CompanyData = {
  name: string;
  count: number;
};

const COMPANIES_PER_PAGE = 32;

const CompanyLogo = memo(({ companyName, size = 'md' }: { companyName: string; size?: 'sm' | 'md' | 'lg' }) => {
  const [logoError, setLogoError] = useState(false);
  const [currentSourceIndex, setCurrentSourceIndex] = useState(0);
  
  const sizeClasses = {
    sm: 'size-9',
    md: 'size-11',
    lg: 'size-14',
  };
  
  const logoSources = useMemo(() => {
    const domain = companyName.toLowerCase().replace(/\s+/g, '') + '.com';
    return [
      `https://logo.clearbit.com/${domain}`,
      `https://img.logo.dev/${domain}?token=pk_X-yFQbLvSf6D9V0wXd1yEQ`,
      `https://www.google.com/s2/favicons?domain=${domain}&sz=256`,
    ];
  }, [companyName]);
  
  const handleError = useCallback(() => {
    if (currentSourceIndex < logoSources.length - 1) {
      setCurrentSourceIndex(prev => prev + 1);
    } else {
      setLogoError(true);
    }
  }, [currentSourceIndex, logoSources.length]);
  
  if (logoError) {
    return (
      <div className={cn(
        sizeClasses[size],
        'flex shrink-0 items-center justify-center rounded-xl border bg-muted text-muted-foreground'
      )}>
        <Building2
          className={size === 'sm' ? 'size-4' : size === 'md' ? 'size-5' : 'size-6'}
          strokeWidth={1.75}
        />
      </div>
    );
  }
  
  return (
    <div className={cn(
      sizeClasses[size],
      'relative shrink-0 overflow-hidden rounded-xl border bg-card'
    )}>
      <img
        src={logoSources[currentSourceIndex]}
        alt={`${companyName} logo`}
        className="w-full h-full object-contain p-2"
        onError={handleError}
        loading="lazy"
      />
    </div>
  );
});

CompanyLogo.displayName = 'CompanyLogo';

function CompaniesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [companies, setCompanies] = useState<CompanyData[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeSearchQuery, setActiveSearchQuery] = useState('');

  useEffect(() => {
    const page = parseInt(searchParams.get('page') || '1');
    const search = searchParams.get('search') || '';
    setCurrentPage(page);
    setSearchQuery(search);
    setActiveSearchQuery(search);
  }, [searchParams]);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setLoading(true);
        const offset = (currentPage - 1) * COMPANIES_PER_PAGE;
        const url = `/api/companies?limit=${COMPANIES_PER_PAGE}&offset=${offset}${activeSearchQuery ? `&search=${encodeURIComponent(activeSearchQuery)}` : ''}`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.success && Array.isArray(data.data)) {
          setCompanies(data.data);
          setTotalCount(data.total || 0);
        }
      } catch (err) {
        console.error('Error loading companies:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCompanies();
  }, [currentPage, activeSearchQuery]);

  const totalPages = Math.ceil(totalCount / COMPANIES_PER_PAGE);
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  const handleCompanyClick = (company: string) => {
    const slug = company.toLowerCase().replace(/\s+/g, '-');
    router.push(`/companies/${slug}`);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    router.push(`/companies?page=${newPage}`, { scroll: false });
  };

  const handleSearch = () => {
    const trimmedQuery = searchQuery.trim();
    setActiveSearchQuery(trimmedQuery);
    setCurrentPage(1);
    if (trimmedQuery) {
      router.push(`/companies?page=1&search=${encodeURIComponent(trimmedQuery)}`, { scroll: false });
    } else {
      router.push(`/companies?page=1`, { scroll: false });
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setActiveSearchQuery('');
    setCurrentPage(1);
    router.push(`/companies?page=1`, { scroll: false });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-10">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Company questions
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {loading
              ? 'Loading companies…'
              : `Interview problems asked at ${totalCount.toLocaleString()} companies.`}
          </p>
        </div>

        {/* Search */}
        <div className="mt-6 flex max-w-xl gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search companies"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
              className="h-11 rounded-xl pl-10 pr-10"
            />
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
          <Button onClick={handleSearch} className="h-11 px-5">
            Search
          </Button>
        </div>

        {/* Companies */}
        {loading ? (
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="h-[86px] rounded-2xl" />
            ))}
          </div>
        ) : companies.length === 0 ? (
          <div className="mt-8 flex flex-col items-center rounded-2xl border bg-card py-16 text-center">
            <Building2 className="size-6 text-muted-foreground/40" strokeWidth={1.5} />
            <h2 className="mt-4 text-sm font-semibold tracking-tight">
              No companies found
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {searchQuery
                ? 'Try a different search term.'
                : 'No company data available right now.'}
            </p>
          </div>
        ) : (
          <>
            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {companies.map((company) => (
                <button
                  key={company.name}
                  onClick={() => handleCompanyClick(company.name)}
                  className="flex items-center gap-3 rounded-2xl border bg-card p-4 text-left transition-colors hover:border-primary/40"
                >
                  <CompanyLogo companyName={company.name || ''} size="md" />
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-medium">{company.name}</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
                      {company.count} {company.count === 1 ? 'problem' : 'problems'}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t pt-6 sm:flex-row">
                <p className="text-sm text-muted-foreground tabular-nums">
                  {(currentPage - 1) * COMPANIES_PER_PAGE + 1}–
                  {Math.min(currentPage * COMPANIES_PER_PAGE, totalCount)} of {totalCount}
                </p>

                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={!hasPrevPage}
                  >
                    <ChevronLeft className="size-4" />
                    <span className="hidden sm:inline">Previous</span>
                  </Button>

                  <div className="hidden items-center gap-1 md:flex">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => handlePageChange(pageNum)}
                          className="w-9 tabular-nums"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>

                  <span className="px-2 text-sm text-muted-foreground tabular-nums md:hidden">
                    {currentPage} / {totalPages}
                  </span>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={!hasNextPage}
                  >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function CompaniesPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-10">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="mt-6 h-11 max-w-xl rounded-xl" />
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="h-[86px] rounded-2xl" />
            ))}
          </div>
        </div>
      }
    >
      <CompaniesContent />
    </Suspense>
  );
}
