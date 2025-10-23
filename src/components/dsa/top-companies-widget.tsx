'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowRight, Building2 } from 'lucide-react';

interface TopCompany {
  name: string;
  count: number;
}

export default function TopCompaniesWidget() {
  const router = useRouter();
  const [companies, setCompanies] = useState<TopCompany[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopCompanies = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/companies?limit=5&offset=0');
        const data = await response.json();

        if (data.success && Array.isArray(data.data)) {
          setCompanies(data.data);
        }
      } catch (error) {
        console.error('Error fetching companies:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTopCompanies();
  }, []);

  const handleCompanyClick = (company: string) => {
    const slug = company.toLowerCase().replace(/\s+/g, '-');
    router.push(`/dsasheet/company/${slug}`);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-purple-600/5 border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          Top Companies
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground mb-4">
          Practice problems from top tech companies
        </p>

        {companies.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No companies available
          </p>
        ) : (
          <div className="space-y-2">
            {companies.map((company) => (
              <button
                key={company.name}
                onClick={() => handleCompanyClick(company.name)}
                className="w-full text-left p-3 rounded-lg border border-transparent hover:border-primary hover:bg-primary/5 transition-all group"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm group-hover:text-primary transition-colors line-clamp-1">
                      {company.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {company.count} problems
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-all group-hover:translate-x-0.5 flex-shrink-0" />
                </div>
              </button>
            ))}
          </div>
        )}

        <Button
          variant="outline"
          onClick={() => router.push('/companies')}
          className="w-full mt-4"
        >
          View All Companies
        </Button>
      </CardContent>
    </Card>
  );
}
