'use client';

import React, { useEffect, useState ,useMemo, memo,useCallback} from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Loader2, Building2, Search, TrendingUp, ChevronLeft, ChevronRight, X } from 'lucide-react';

type CompanyData = {
  name: string;
  count: number;
};

const COMPANIES_PER_PAGE = 12;

export default function CompaniesPage() {
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
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

const CompanyLogo = memo(({ companyName }: { companyName: string }) => {
  const [logoError, setLogoError] = useState(false);
  const [logoLoading, setLogoLoading] = useState(true);
  const [currentSourceIndex, setCurrentSourceIndex] = useState(0);
  
  const logoSources = useMemo(() => {
    const domain = companyName.toLowerCase().replace(/\s+/g, '') + '.com';
    return [
      `https://logo.clearbit.com/${domain}`,
      `https://img.logo.dev/${domain}?token=pk_X-yFQbLvSf6D9V0wXd1yEQ`,
      `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
    ];
  }, [companyName]);
  
  const handleError = useCallback(() => {
    if (currentSourceIndex < logoSources.length - 1) {
      setCurrentSourceIndex(prev => prev + 1);
    } else {
      setLogoError(true);
      setLogoLoading(false);
    }
  }, [currentSourceIndex, logoSources.length]);
  
  if (logoError) {
    return (
      <div className="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-primary/20 to-purple-600/20 rounded-xl">
        <Building2 className="w-6 h-6 text-primary" />
      </div>
    );
  }
  
  return (
    <div className="w-12 h-12 relative overflow-hidden rounded-xl bg-white/50 backdrop-blur-sm border border-white/20 shadow-lg">
      {logoLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
        </div>
      )}
      <img
        src={logoSources[currentSourceIndex]}
        alt={`${companyName} logo`}
        className={cn("w-full h-full object-contain p-1.5", logoLoading ? "opacity-0" : "opacity-100")}
        onLoad={() => setLogoLoading(false)}
        onError={handleError}
        loading="lazy"
      />
    </div>
  );
});

CompanyLogo.displayName = 'CompanyLogo';

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent mb-2">
          Company Interview Questions
        </h1>
        <p className="text-muted-foreground">
          Browse {totalCount} companies with curated interview questions
        </p>
      </div>

      <Card className="border-2">
        <CardHeader>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <Building2 className="h-6 w-6 text-primary" />
              All Companies
            </CardTitle>
            <div className="relative w-full md:w-96 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search companies... (Press Enter)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch();
                    }
                  }}
                  className="pl-10 pr-10 border-2"
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
                className="gap-2"
                size="default"
              >
                <Search className="h-4 w-4" />
                <span className="hidden sm:inline">Search</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {companies.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              {searchQuery ? 'No companies found matching your search.' : 'No company data found.'}
            </p>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {companies.map((company) => (
                  <Button
                    key={company.name}
                    variant="outline"
                    className="w-full h-auto py-4 px-4 flex flex-col items-start justify-between gap-2 hover:border-primary hover:bg-primary/5 transition-all group"
                    onClick={() => handleCompanyClick(company.name)}
                  >
                    <span className="font-semibold text-left group-hover:text-primary transition-colors">
                     <div className='flex '>
                      <div className='size-12'>
                         <CompanyLogo companyName={company.name || ''} />
                      </div>
                      <div className='pt-3 text-xl pl-4'>
                        {company.name}
                      </div>
                     </div>
                    </span>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <TrendingUp className="h-3 w-3" />
                      <span>{company.count} problems</span>
                    </div>
                  </Button>
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="mt-8 border-t pt-6">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="text-sm text-muted-foreground order-2 md:order-1">
                      Showing {((currentPage - 1) * COMPANIES_PER_PAGE) + 1} to {Math.min(currentPage * COMPANIES_PER_PAGE, totalCount)} of {totalCount} companies
                    </div>
                    <div className="flex items-center gap-2 order-1 md:order-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={!hasPrevPage}
                        className="gap-2"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        <span className="hidden sm:inline">Previous</span>
                      </Button>
                      <div className="hidden sm:flex items-center gap-1">
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
                              className="w-10"
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>
                      <div className="sm:hidden flex items-center gap-2 px-3 py-1 border rounded-md text-sm font-medium">
                        <span>{currentPage}</span>
                        <span className="text-muted-foreground">/</span>
                        <span>{totalPages}</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={!hasNextPage}
                        className="gap-2"
                      >
                        <span className="hidden sm:inline">Next</span>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
