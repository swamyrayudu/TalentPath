'use client';
import React from 'react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AddQuestionForm } from './add-question-form';
import { QuestionManagementList } from './question-management-list';
import { ContestSettings } from './contest-settings';
import { FileText, Settings, Plus, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import type { contests, contestQuestions } from '@/lib/db/schema';
import type { InferSelectModel } from 'drizzle-orm';

type Contest = InferSelectModel<typeof contests>;
type ContestQuestion = InferSelectModel<typeof contestQuestions>;

interface ContestManagementTabsProps {
  contest: Contest;
  questions: ContestQuestion[];
  contestSlug: string;
}

export function ContestManagementTabs({ contest, questions, contestSlug }: ContestManagementTabsProps) {
  return (
    <div className="w-full space-y-6">
      <Tabs defaultValue="questions" className="w-full">
        {/* Modern Tab Bar */}
        <div className="w-full sticky top-0 z-10 bg-background/95 backdrop-blur-md pb-3 sm:pb-4">
          <TabsList className="w-full h-auto p-1 sm:p-1.5 bg-muted/50 backdrop-blur-sm rounded-lg sm:rounded-xl shadow-md border">
            <TabsTrigger 
              value="questions" 
              className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all py-2 sm:py-3 px-2 sm:px-4 rounded-md sm:rounded-lg text-xs sm:text-sm font-semibold hover:bg-muted"
            >
              <FileText className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Questions</span>
              <span className="sm:hidden">Problems</span>
            </TabsTrigger>
            <TabsTrigger 
              value="add-question" 
              className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all py-2 sm:py-3 px-2 sm:px-4 rounded-md sm:rounded-lg text-xs sm:text-sm font-semibold hover:bg-muted"
            >
              <Plus className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Add Question</span>
              <span className="sm:hidden">Add New</span>
            </TabsTrigger>
            <TabsTrigger 
              value="settings" 
              className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all py-2 sm:py-3 px-2 sm:px-4 rounded-md sm:rounded-lg text-xs sm:text-sm font-semibold hover:bg-muted"
            >
              <Settings className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Settings</span>
              <span className="sm:hidden">Config</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab Contents */}
        <TabsContent value="questions" className="mt-0 space-y-3 sm:space-y-4 focus-visible:outline-none animate-in fade-in-50 duration-300">
          <div className="space-y-3 sm:space-y-4">
            {/* Section Header */}
            <div className="rounded-lg bg-card border p-3 sm:p-4 shadow-sm">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="h-8 sm:h-10 w-1 bg-primary rounded-full" />
                <div>
                  <h3 className="text-base sm:text-lg md:text-xl font-bold">
                    Contest Questions
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                    Manage and organize your problems • {questions.length} total
                  </p>
                </div>
              </div>
            </div>

            {/* Questions List */}
            <QuestionManagementList 
              questions={questions.map(q => ({
                ...q,
                timeLimitSeconds: q.timeLimitSeconds ?? 0,
                memoryLimitMb: q.memoryLimitMb ?? 0,
              }))} 
              contestId={contest.id} 
              contestSlug={contestSlug} 
            />
          </div>
        </TabsContent>

        <TabsContent value="add-question" className="mt-0 space-y-3 sm:space-y-4 focus-visible:outline-none animate-in fade-in-50 duration-300">
          <Card className="border shadow-sm bg-card">
            <div className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
              {/* Section Header */}
              <div className="rounded-lg bg-muted/50 border p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="h-8 sm:h-10 w-1 bg-primary rounded-full" />
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <h3 className="text-base sm:text-lg md:text-xl font-bold">Add New Question</h3>
                      <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                      Create a new coding problem for participants
                    </p>
                  </div>
                </div>
              </div>
              
              <AddQuestionForm 
                contestId={contest.id} 
                orderIndex={questions.length + 1} 
              />
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="mt-0 space-y-3 sm:space-y-4 focus-visible:outline-none animate-in fade-in-50 duration-300">
          <Card className="border shadow-sm bg-card">
            <div className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
              {/* Section Header */}
              <div className="rounded-lg bg-muted/50 border p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="h-8 sm:h-10 w-1 bg-primary rounded-full" />
                  <div>
                    <h3 className="text-base sm:text-lg md:text-xl font-bold">Contest Settings</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                      Configure contest details and preferences
                    </p>
                  </div>
                </div>
              </div>
              
              <ContestSettings contest={contest} />
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
