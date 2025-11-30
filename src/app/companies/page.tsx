'use client';

import React, { useEffect, useState, useMemo, memo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Loader2, Building2, Search, TrendingUp, ChevronLeft, ChevronRight, X } from 'lucide-react';

type CompanyData = {
  name: string;
  count: number;
};

const COMPANIES_PER_PAGE = 32;

const CompanyLogo = memo(({ companyName, size = 'md' }: { companyName: string; size?: 'sm' | 'md' | 'lg' }) => {
  const [logoError, setLogoError] = useState(false);
  const [currentSourceIndex, setCurrentSourceIndex] = useState(0);
  
  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
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
        "flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/20 rounded-lg flex-shrink-0 border border-border"
      )}>
        <Building2 className={cn(
          "text-primary",
          size === 'sm' ? 'w-5 h-5' : size === 'md' ? 'w-6 h-6' : 'w-8 h-8'
        )} />
      </div>
    );
  }
  
  return (
    <div className={cn(
      sizeClasses[size],
      "relative overflow-hidden rounded-lg bg-card border border-border shadow-sm flex-shrink-0"
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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground text-lg">Loading companies...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="container mx-auto py-8 md:py-12 px-4 md:px-6 max-w-7xl">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-primary via-primary/90 to-primary/70 bg-clip-text text-transparent mb-3">
            Company Interview Questions
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Browse interview questions from top tech companies
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 md:px-6 max-w-7xl py-6 md:py-8">
        {/* Search Bar */}
        <div className="mb-6 md:mb-8">
          <div className="flex gap-2 max-w-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                type="text"
                placeholder="Search companies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  }
                }}
                className="pl-10 pr-10 h-10 md:h-11 text-sm bg-background border-input"
              />
              {searchQuery && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Button
              onClick={handleSearch}
              size="default"
              className="gap-2 h-10 md:h-11 px-4 md:px-6"
            >
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline">Search</span>
            </Button>
          </div>
        </div>

        {/* Companies Grid */}
        {companies.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 md:py-20">
              <div className="rounded-full bg-muted p-6 mb-4">
                <Building2 className="h-12 w-12 md:h-16 md:w-16 text-muted-foreground" />
              </div>
              <h3 className="text-lg md:text-xl font-semibold mb-2">No companies found</h3>
              <p className="text-sm md:text-base text-muted-foreground text-center max-w-sm">
                {searchQuery ? 'Try adjusting your search criteria' : 'No company data available at the moment'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
              {companies.map((company) => (
                <Card
                  key={company.name}
                  className="group cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-primary/50 hover:bg-accent/50"
                  onClick={() => handleCompanyClick(company.name)}
                >
                  <CardContent className="p-4 md:p-5">
                    <div className="flex items-start gap-3 md:gap-4">
                      <CompanyLogo companyName={company.name || ''} size="md" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm md:text-base leading-tight mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                          {company.name}
                        </h3>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <TrendingUp className="h-3.5 w-3.5 flex-shrink-0" />
                          <span className="text-xs md:text-sm font-medium">
                            {company.count} {company.count === 1 ? 'problem' : 'problems'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 md:mt-10">
                <Card>
                  <CardContent className="p-4 md:p-6">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <p className="text-sm text-muted-foreground order-2 sm:order-1">
                        Showing <span className="font-medium text-foreground">{((currentPage - 1) * COMPANIES_PER_PAGE) + 1}</span> to <span className="font-medium text-foreground">{Math.min(currentPage * COMPANIES_PER_PAGE, totalCount)}</span> of <span className="font-medium text-foreground">{totalCount}</span> companies
                      </p>
                      
                      <div className="flex items-center gap-1.5 order-1 sm:order-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={!hasPrevPage}
                          className="gap-1.5 h-9 px-3"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          <span className="hidden sm:inline">Previous</span>
                        </Button>
                        
                        <div className="hidden md:flex items-center gap-1">
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
                                variant={currentPage === pageNum ? "default" : "outline"}
                                size="sm"
                                onClick={() => handlePageChange(pageNum)}
                                className="w-9 h-9"
                              >
                                {pageNum}
                              </Button>
                            );
                          })}
                        </div>
                        
                        <div className="md:hidden flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-md bg-muted/50">
                          <span className="text-sm font-medium">{currentPage}</span>
                          <span className="text-sm text-muted-foreground">/</span>
                          <span className="text-sm font-medium">{totalPages}</span>
                        </div>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={!hasNextPage}
                          className="gap-1.5 h-9 px-3"
                        >
                          <span className="hidden sm:inline">Next</span>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
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
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    }>
      <CompaniesContent />
    </Suspense>
  );
}
