'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2, Building2, Search, TrendingUp } from 'lucide-react';

interface CompanyDSAFilterProps {
  onSelectCompany?: (company: string) => void;
  className?: string;
}

export default function CompanyDSAFilter({
  onSelectCompany,
  className = '',
}: CompanyDSAFilterProps) {
  const router = useRouter();
  const [companies, setCompanies] = useState<Array<{ name: string; count: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCompanies, setFilteredCompanies] = useState<Array<{ name: string; count: number }>>([]);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/companies?limit=1000&offset=0');
        const data = await response.json();

        if (data.success && Array.isArray(data.data)) {
          setCompanies(data.data);
          setFilteredCompanies(data.data);
        }
      } catch (error) {
        console.error('Error fetching companies:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanies();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredCompanies(companies);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredCompanies(
        companies.filter((company) =>
          company.name.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, companies]);

  const handleCompanyClick = (company: string) => {
    const slug = company.toLowerCase().replace(/\s+/g, '-');
    
    if (onSelectCompany) {
      onSelectCompany(company);
    } else {
      // Navigate to company DSA page
      router.push(`/dsasheet/company/${slug}`);
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Company DSA Sheets</h2>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search companies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Companies Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {filteredCompanies.slice(0, 9).map((company) => (
              <Button
                key={company.name}
                variant="outline"
                onClick={() => handleCompanyClick(company.name)}
                className="h-auto py-3 px-4 flex flex-col items-start justify-between gap-2 hover:border-primary hover:bg-primary/5 transition-all group text-left"
              >
                <span className="font-medium text-sm group-hover:text-primary transition-colors line-clamp-1">
                  {company.name}
                </span>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3" />
                  <span>{company.count} problems</span>
                </div>
              </Button>
            ))}
          </div>

          {/* View All */}
          {companies.length > 9 && (
            <Button
              variant="ghost"
              onClick={() => router.push('/companies')}
              className="w-full"
            >
              View All {companies.length} Companies
            </Button>
          )}

          {/* Info */}
          <p className="text-xs text-muted-foreground text-center">
            {searchQuery.trim() === ''
              ? `Showing top ${Math.min(9, filteredCompanies.length)} companies`
              : `Found ${filteredCompanies.length} companies`}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
