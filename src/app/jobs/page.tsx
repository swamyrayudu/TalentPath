'use client';
import React from 'react';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { 
  Briefcase, 
  MapPin, 
  Calendar,
  IndianRupee, 
  Building2,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  Loader2
} from 'lucide-react';
import Link from 'next/link';

type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  locationType: 'remote' | 'onsite' | 'hybrid';
  jobType: 'full-time' | 'part-time' | 'contract' | 'internship';
  description: string;
  requirements: string;
  salary: string | null;
  applyUrl: string;
  companyLogo: string | null;
  isActive: boolean;
  createdAt: Date;
};

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'jobs' | 'internships'>('jobs');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJobTypes, setSelectedJobTypes] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedSalaryRanges, setSelectedSalaryRanges] = useState<string[]>([]);
  
  const [currentPage, setCurrentPage] = useState(1);
  const jobsPerPage = 5;

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [jobs, activeTab, searchQuery, selectedJobTypes, selectedLocations, selectedSalaryRanges]);

  const fetchJobs = async () => {
    try {
      const response = await fetch('/api/jobs');
      const data = await response.json();
      setJobs(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...jobs];

    if (activeTab === 'jobs') {
      filtered = filtered.filter(job => job.jobType !== 'internship');
    } else {
      filtered = filtered.filter(job => job.jobType === 'internship');
    }

    if (searchQuery) {
      filtered = filtered.filter(job =>
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.company.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedJobTypes.length > 0) {
      filtered = filtered.filter(job => selectedJobTypes.includes(job.jobType));
    }

    if (selectedLocations.length > 0) {
      filtered = filtered.filter(job => selectedLocations.includes(job.locationType));
    }

    if (selectedSalaryRanges.length > 0) {
      filtered = filtered.filter(job => {
        if (!job.salary) return false;
        const salary = parseInt(job.salary.split('-')[0]);
        return selectedSalaryRanges.some(range => {
          if (range === '0-5') return salary >= 0 && salary <= 5;
          if (range === '5-10') return salary >= 5 && salary <= 10;
          if (range === '10-15') return salary >= 10 && salary <= 15;
          if (range === '15+') return salary >= 15;
          return false;
        });
      });
    }

    setFilteredJobs(filtered);
    setCurrentPage(1);
  };

  const toggleFilter = (filter: string, setFilter: (filters: string[]) => void, currentFilters: string[]) => {
    if (currentFilters.includes(filter)) {
      setFilter(currentFilters.filter((f: string) => f !== filter));
    } else {
      setFilter([...currentFilters, filter]);
    }
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedJobTypes([]);
    setSelectedLocations([]);
    setSelectedSalaryRanges([]);
  };

  const indexOfLastJob = currentPage * jobsPerPage;
  const indexOfFirstJob = indexOfLastJob - jobsPerPage;
  const currentJobs = filteredJobs.slice(indexOfFirstJob, indexOfLastJob);
  const totalPages = Math.ceil(filteredJobs.length / jobsPerPage);

      if (loading) {
        return (
          <div className="flex min-h-screen items-center justify-center bg-background">
            <div className="text-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
              <p className="text-muted-foreground text-lg">Loading jobs...</p>
            </div>
          </div>
        );
      }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold mb-1">Jobs & Internships</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Explore {filteredJobs.length} opportunities to enhance your career
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={activeTab === 'jobs' ? 'default' : 'outline'}
            onClick={() => setActiveTab('jobs')}
            className="px-4 sm:px-6 text-xs sm:text-sm transition-all duration-200"
            size="sm"
          >
            Jobs
          </Button>
          <Button
            variant={activeTab === 'internships' ? 'default' : 'outline'}
            onClick={() => setActiveTab('internships')}
            className="px-4 sm:px-6 text-xs sm:text-sm transition-all duration-200"
            size="sm"
          >
            Internships
          </Button>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Compact Sidebar */}
          <aside className="lg:w-64 space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                </button>
              )}
            </div>

            {/* Filters Card */}
            <Card className="border shadow-sm">
              <CardContent className="p-3">
                <Accordion type="multiple" className="w-full">
                  {/* Job Type */}
                  <AccordionItem value="job-type" className="border-0">
                    <AccordionTrigger className="py-2 text-xs sm:text-sm font-medium hover:no-underline">
                      Job Type
                    </AccordionTrigger>
                    <AccordionContent className="pb-2">
                      <div className="space-y-2">
                        {activeTab === 'jobs' ? (
                          <>
                            {['full-time', 'part-time', 'contract'].map((type) => (
                              <div key={type} className="flex items-center space-x-2">
                                <Checkbox
                                  id={type}
                                  checked={selectedJobTypes.includes(type)}
                                  onCheckedChange={() =>
                                    toggleFilter(type, setSelectedJobTypes, selectedJobTypes)
                                  }
                                  className="h-4 w-4"
                                />
                                <Label htmlFor={type} className="text-xs sm:text-sm capitalize cursor-pointer font-normal">
                                  {type}
                                </Label>
                              </div>
                            ))}
                          </>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="internship"
                              checked={selectedJobTypes.includes('internship')}
                              onCheckedChange={() =>
                                toggleFilter('internship', setSelectedJobTypes, selectedJobTypes)
                              }
                              className="h-4 w-4"
                            />
                            <Label htmlFor="internship" className="text-xs sm:text-sm cursor-pointer font-normal">
                              Internship
                            </Label>
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Location */}
                  <AccordionItem value="location" className="border-0">
                    <AccordionTrigger className="py-2 text-xs sm:text-sm font-medium hover:no-underline">
                      Location
                    </AccordionTrigger>
                    <AccordionContent className="pb-2">
                      <div className="space-y-2">
                        {['remote', 'onsite', 'hybrid'].map((location) => (
                          <div key={location} className="flex items-center space-x-2">
                            <Checkbox
                              id={location}
                              checked={selectedLocations.includes(location)}
                              onCheckedChange={() =>
                                toggleFilter(location, setSelectedLocations, selectedLocations)
                              }
                              className="h-4 w-4"
                            />
                            <Label htmlFor={location} className="text-xs sm:text-sm capitalize cursor-pointer font-normal">
                              {location}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Salary */}
                  <AccordionItem value="salary" className="border-0">
                    <AccordionTrigger className="py-2 text-xs sm:text-sm font-medium hover:no-underline">
                      Salary
                    </AccordionTrigger>
                    <AccordionContent className="pb-2">
                      <div className="space-y-2">
                        {[
                          { value: '0-5', label: '0-5 LPA' },
                          { value: '5-10', label: '5-10 LPA' },
                          { value: '10-15', label: '10-15 LPA' },
                          { value: '15+', label: '15+ LPA' },
                        ].map((range) => (
                          <div key={range.value} className="flex items-center space-x-2">
                            <Checkbox
                              id={range.value}
                              checked={selectedSalaryRanges.includes(range.value)}
                              onCheckedChange={() =>
                                toggleFilter(range.value, setSelectedSalaryRanges, selectedSalaryRanges)
                              }
                              className="h-4 w-4"
                            />
                            <Label htmlFor={range.value} className="text-xs sm:text-sm cursor-pointer font-normal">
                              {range.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                {(searchQuery || selectedJobTypes.length > 0 || selectedLocations.length > 0 || selectedSalaryRanges.length > 0) && (
                  <Button
                    variant="ghost"
                    onClick={clearAllFilters}
                    className="w-full mt-2 h-8 text-xs"
                    size="sm"
                  >
                    Clear Filters
                  </Button>
                )}
              </CardContent>
            </Card>
          </aside>

          {/* Main Content - Compact Cards */}
          <main className="flex-1">
            {currentJobs.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <h3 className="text-lg font-semibold mb-1">No {activeTab} Found</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Try adjusting your filters
                  </p>
                  <Button onClick={clearAllFilters} size="sm">Clear Filters</Button>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="space-y-3 mb-6">
                  {currentJobs.map((job, index) => (
                    <Card 
                      key={job.id} 
                      className="group hover:shadow-md hover:border-amber-200 transition-all duration-200 animate-in fade-in slide-in-from-bottom-4"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          {/* Logo */}
                          <div className="flex-shrink-0">
                            {job.companyLogo ? (
                              <img 
                                src={job.companyLogo} 
                                alt={job.company}
                                className="w-12 h-12 rounded-md object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-md bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                                <Building2 className="h-6 w-6 text-white" />
                              </div>
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex-1 min-w-0">
                                <h3 className="text-sm sm:text-base font-semibold mb-0.5 truncate group-hover:text-primary transition-colors">
                                  {job.title}
                                </h3>
                                <p className="text-xs sm:text-sm text-muted-foreground">{job.company}</p>
                              </div>
                              <Link href={`/jobs/${job.id}`}>
                                <Button size="sm" className="h-7 sm:h-8 text-xs">
                                  Details
                                </Button>
                              </Link>
                            </div>

                            {/* Info Row */}
                            <div className="flex flex-wrap gap-x-3 sm:gap-x-4 gap-y-1 text-[10px] sm:text-xs text-muted-foreground mb-2">
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                <span>{job.location}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Briefcase className="h-3 w-3" />
                                <span className="capitalize">{job.jobType}</span>
                              </div>
                              {job.salary && (
                                <div className="flex items-center gap-1 font-medium text-primary">
                                  <IndianRupee className="h-3 w-3" />
                                  <span>{job.salary} LPA</span>
                                </div>
                              )}
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>
                                  {new Date(job.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                                </span>
                              </div>
                            </div>

                            {/* Badges */}
                            <div className="flex gap-1.5">
                              <Badge 
                                variant={job.locationType === 'remote' ? 'default' : 'secondary'}
                                className="text-[10px] sm:text-xs h-5 px-1.5 sm:px-2"
                              >
                                {job.locationType}
                              </Badge>
                              <Badge variant="outline" className="text-[10px] sm:text-xs h-5 px-1.5 sm:px-2">
                                {job.jobType}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setCurrentPage(currentPage - 1);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      disabled={currentPage === 1}
                      className="h-8"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>

                    <span className="text-xs text-muted-foreground px-2">
                      Page {currentPage} of {totalPages}
                    </span>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setCurrentPage(currentPage + 1);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      disabled={currentPage === totalPages}
                      className="h-8"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
