'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';
import ResumeUploader from '@/components/interview/resume-uploader';

const jobRoles = [
  'Software Engineer',
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'DevOps Engineer',
  'Data Engineer',
  'Machine Learning Engineer',
  'Product Manager',
  'Engineering Manager',
  'Solutions Architect',
  'Mobile Developer',
  'QA Engineer',
  'Site Reliability Engineer',
  'Security Engineer',
  'Cloud Engineer',
  'Other',
];

const experienceLevels = [
  { value: 'entry', label: 'Entry Level (0-2 years)', questions: 5 },
  { value: 'junior', label: 'Junior (2-4 years)', questions: 6 },
  { value: 'mid', label: 'Mid Level (4-7 years)', questions: 7 },
  { value: 'senior', label: 'Senior (7-10 years)', questions: 8 },
  { value: 'staff', label: 'Staff/Principal (10+ years)', questions: 10 },
];

const durations = [
  { value: 15, label: '15 minutes', description: 'Quick practice session' },
  { value: 30, label: '30 minutes', description: 'Standard interview' },
  { value: 45, label: '45 minutes', description: 'In-depth interview' },
  { value: 60, label: '60 minutes', description: 'Full interview simulation' },
];

export default function ConfigureInterviewPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const interviewType = params.type as string;

  const [jobRole, setJobRole] = useState('');
  const [customRole, setCustomRole] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('mid');
  const [duration, setDuration] = useState(30);
  const [companyName, setCompanyName] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [specificTopics, setSpecificTopics] = useState('');

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="size-6 animate-spin rounded-full border-2 border-muted border-t-foreground" />
      </div>
    );
  }

  if (!session?.user) {
    router.push('/auth/signin');
    return null;
  }

  const handleStartInterview = () => {
    const config = {
      jobRole: jobRole === 'Other' ? customRole : jobRole,
      experienceLevel,
      duration,
      companyName,
      resumeText,
      specificTopics,
    };

    // Store config in sessionStorage
    sessionStorage.setItem('interviewConfig', JSON.stringify(config));
    
    // Navigate to interview start page
    router.push(`/interview/${interviewType}/start`);
  };

  const selectedExperience = experienceLevels.find(e => e.value === experienceLevel);

  const getInterviewTitle = () => {
    switch (interviewType) {
      case 'dsa-coding': return 'DSA & Coding Interview';
      case 'system-design': return 'System Design Interview';
      case 'behavioral': return 'Behavioral Interview';
      case 'company-specific': return 'Company-Specific Interview';
      default: return 'Mock Interview';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-8 md:px-6 md:py-10">
        <button
          onClick={() => router.push('/interview')}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          All interviews
        </button>

        <div className="mt-6">
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Configure your interview
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{getInterviewTitle()}</p>
        </div>

        <div className="mt-8 space-y-4">
          {/* Target role */}
          <section className="rounded-2xl border bg-card">
            <div className="border-b px-5 py-4">
              <h2 className="text-sm font-semibold tracking-tight">Target role</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                What are you interviewing for?
              </p>
            </div>

            <div className="space-y-5 p-5">
              <div className="space-y-2">
                <Label htmlFor="job-role">Job role</Label>
                <Select value={jobRole} onValueChange={setJobRole}>
                  <SelectTrigger id="job-role" className="w-full">
                    <SelectValue placeholder="Select your target role" />
                  </SelectTrigger>
                  <SelectContent>
                    {jobRoles.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {jobRole === 'Other' && (
                <div className="space-y-2">
                  <Label htmlFor="custom-role">Custom role</Label>
                  <Input
                    id="custom-role"
                    placeholder="e.g. Blockchain Developer"
                    value={customRole}
                    onChange={(e) => setCustomRole(e.target.value)}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="experience">Experience level</Label>
                <Select value={experienceLevel} onValueChange={setExperienceLevel}>
                  <SelectTrigger id="experience" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {experienceLevels.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Around {selectedExperience?.questions} questions.
                </p>
              </div>

              {interviewType === 'company-specific' && (
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    placeholder="e.g. Google, Amazon, Microsoft"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty for a general interview.
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Duration */}
          <section className="rounded-2xl border bg-card">
            <div className="border-b px-5 py-4">
              <h2 className="text-sm font-semibold tracking-tight">Duration</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                How long do you want to practise?
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 p-5 md:grid-cols-4">
              {durations.map((dur) => (
                <button
                  key={dur.value}
                  onClick={() => setDuration(dur.value)}
                  className={`rounded-xl border p-4 text-left transition-colors ${
                    duration === dur.value
                      ? 'border-primary/50 bg-primary/5'
                      : 'hover:border-primary/40'
                  }`}
                >
                  <span className="block text-sm font-medium">{dur.label}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {dur.description}
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* Resume */}
          <ResumeUploader onResumeExtracted={(text) => setResumeText(text)} />

          {/* Focus areas */}
          <section className="rounded-2xl border bg-card">
            <div className="border-b px-5 py-4">
              <h2 className="text-sm font-semibold tracking-tight">Focus areas</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Optional — topics the interviewer should prioritise.
              </p>
            </div>

            <div className="p-5">
              <Textarea
                placeholder="e.g. Dynamic programming, caching strategies, leadership situations"
                value={specificTopics}
                onChange={(e) => setSpecificTopics(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </section>

          {/* Summary */}
          <section className="rounded-2xl border bg-card">
            <div className="border-b px-5 py-4">
              <h2 className="text-sm font-semibold tracking-tight">Summary</h2>
            </div>

            <dl className="divide-y px-5">
              {[
                {
                  label: 'Role',
                  value: (jobRole === 'Other' ? customRole : jobRole) || 'Not selected',
                },
                { label: 'Experience', value: selectedExperience?.label ?? '—' },
                { label: 'Duration', value: `${duration} minutes` },
                { label: 'Questions', value: `~${selectedExperience?.questions ?? '—'}` },
                ...(companyName ? [{ label: 'Company', value: companyName }] : []),
                ...(resumeText ? [{ label: 'Resume', value: 'Uploaded' }] : []),
                ...(specificTopics ? [{ label: 'Focus areas', value: 'Specified' }] : []),
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between py-3">
                  <dt className="text-sm text-muted-foreground">{row.label}</dt>
                  <dd className="text-sm font-medium">{row.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <Button
            size="lg"
            className="w-full"
            onClick={handleStartInterview}
            disabled={!jobRole || (jobRole === 'Other' && !customRole)}
          >
            Start interview
          </Button>
        </div>
      </div>
    </div>
  );
}
