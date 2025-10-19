'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Building2 } from 'lucide-react';

export default function CompaniesPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/problems?limit=5000'); // fetch problems
        const data = await res.json();

        if (data.success && Array.isArray(data.data)) {
          const allCompanyTags = new Set<string>();
          data.data.forEach((p: any) => {
            if (p.companyTags && p.companyTags.length > 0) {
              p.companyTags.forEach((tag: string) => {
                if (tag.trim() !== '') allCompanyTags.add(tag.trim());
              });
            }
          });

          const sortedCompanies = Array.from(allCompanyTags).sort((a, b) => a.localeCompare(b));
          setCompanies(sortedCompanies);
        }
      } catch (err) {
        console.error('Error loading companies:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCompanies();
  }, []);

  const handleCompanyClick = (company: string) => {
    const slug = company.toLowerCase().replace(/\s+/g, '-');
    router.push(`/companies/${slug}`);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="border-2">
        <CardHeader className="flex flex-col md:flex-row items-center justify-between gap-4">
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            Company‑wise Questions
          </CardTitle>
          <p className="text-muted-foreground text-sm">
            Select a company to view all related interview questions.
          </p>
        </CardHeader>
        <CardContent>
          {companies.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No company data found.</p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {companies.map((company) => (
                <Button
                  key={company}
                  variant="outline"
                  className="rounded-full px-5 py-2 text-sm font-medium hover:border-primary hover:text-primary transition"
                  onClick={() => handleCompanyClick(company)}
                >
                  {company}
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
