'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  ArrowLeft,
  Clock,
  Briefcase,
  Target,
  Play,
  Settings,
  Sparkles,
} from 'lucide-react';
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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
  const selectedDuration = durations.find(d => d.value === duration);

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
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" size="sm" onClick={() => router.push('/interview')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Interviews
          </Button>
        </div>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
              <Settings className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Configure Your Interview</h1>
              <p className="text-muted-foreground">{getInterviewTitle()}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          {/* Job Role */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Target Role
              </CardTitle>
              <CardDescription>
                What role are you interviewing for?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="job-role">Job Role *</Label>
                <Select value={jobRole} onValueChange={setJobRole}>
                  <SelectTrigger id="job-role">
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
                  <Label htmlFor="custom-role">Custom Role</Label>
                  <Input
                    id="custom-role"
                    placeholder="e.g., Blockchain Developer"
                    value={customRole}
                    onChange={(e) => setCustomRole(e.target.value)}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="experience">Experience Level *</Label>
                <Select value={experienceLevel} onValueChange={setExperienceLevel}>
                  <SelectTrigger id="experience">
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
                  Will ask ~{selectedExperience?.questions} questions
                </p>
              </div>

              {interviewType === 'company-specific' && (
                <div className="space-y-2">
                  <Label htmlFor="company">Company Name</Label>
                  <Input
                    id="company"
                    placeholder="e.g., Google, Amazon, Microsoft"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty for general interview
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Duration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Interview Duration
              </CardTitle>
              <CardDescription>
                How long do you want to practice?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {durations.map((dur) => (
                  <Button
                    key={dur.value}
                    variant={duration === dur.value ? 'default' : 'outline'}
                    className="flex flex-col h-auto py-4"
                    onClick={() => setDuration(dur.value)}
                  >
                    <span className="text-lg font-bold">{dur.label}</span>
                    <span className="text-xs text-muted-foreground mt-1">
                      {dur.description}
                    </span>
                  </Button>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-3">
                Selected: <strong>{selectedDuration?.label}</strong> - {selectedDuration?.description}
              </p>
            </CardContent>
          </Card>

          {/* Resume Upload */}
          <ResumeUploader
            onResumeExtracted={(text) => setResumeText(text)}
          />

          {/* Specific Topics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Focus Areas (Optional)
              </CardTitle>
              <CardDescription>
                Mention specific topics you want to focus on
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="e.g., Dynamic Programming, System Design Scalability, Leadership Situations, React Performance"
                value={specificTopics}
                onChange={(e) => setSpecificTopics(e.target.value)}
                className="min-h-[100px]"
              />
              <p className="text-xs text-muted-foreground mt-2">
                AI will prioritize these topics during the interview
              </p>
            </CardContent>
          </Card>

          {/* Summary Card */}
          <Card className="border-primary/50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-primary mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">Interview Configuration</h3>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>• Role: <strong>{jobRole === 'Other' ? customRole : jobRole || 'Not selected'}</strong></p>
                    <p>• Experience: <strong>{selectedExperience?.label}</strong></p>
                    <p>• Duration: <strong>{duration} minutes</strong></p>
                    <p>• Questions: <strong>~{selectedExperience?.questions}</strong></p>
                    {companyName && <p>• Company: <strong>{companyName}</strong></p>}
                    {resumeText && <p>• Resume: <strong>✓ Uploaded ({resumeText.length} chars)</strong></p>}
                    {specificTopics && <p>• Focus Areas: <strong>✓ Specified</strong></p>}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Start Button */}
          <Button
            size="lg"
            className="w-full"
            onClick={handleStartInterview}
            disabled={!jobRole || (jobRole === 'Other' && !customRole)}
          >
            <Play className="h-5 w-5 mr-2" />
            Start AI Interview
          </Button>
        </div>
      </div>
    </div>
  );
}
