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
        <div className="w-full sticky top-0 z-10 bg-gradient-to-b from-background via-background to-background/95 backdrop-blur-md pb-4">
          <TabsList className="w-full h-auto p-1.5 bg-gradient-to-r from-muted/80 to-muted/60 backdrop-blur-sm rounded-xl shadow-lg border border-border/50">
            <TabsTrigger 
              value="questions" 
              className="flex-1 flex items-center justify-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/90 data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all duration-300 py-3 px-4 rounded-lg text-sm font-semibold group hover:bg-background/50"
            >
              <FileText className="h-4 w-4 flex-shrink-0 group-data-[state=active]:animate-pulse" />
              <span className="hidden sm:inline">Questions</span>
              <span className="sm:hidden">Problems</span>
            </TabsTrigger>
            <TabsTrigger 
              value="add-question" 
              className="flex-1 flex items-center justify-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-600 data-[state=active]:to-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300 py-3 px-4 rounded-lg text-sm font-semibold group hover:bg-background/50"
            >
              <Plus className="h-4 w-4 flex-shrink-0 group-data-[state=active]:scale-110 transition-transform" />
              <span className="hidden sm:inline">Add Question</span>
              <span className="sm:hidden">Add New</span>
            </TabsTrigger>
            <TabsTrigger 
              value="settings" 
              className="flex-1 flex items-center justify-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300 py-3 px-4 rounded-lg text-sm font-semibold group hover:bg-background/50"
            >
              <Settings className="h-4 w-4 flex-shrink-0 group-data-[state=active]:rotate-90 transition-transform duration-500" />
              <span className="hidden sm:inline">Settings</span>
              <span className="sm:hidden">Config</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab Contents */}
        <TabsContent value="questions" className="mt-0 space-y-4 focus-visible:outline-none animate-in fade-in-50 duration-300">
          <div className="space-y-4">
            {/* Section Header */}
            <div className="flex items-center gap-3 px-1">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-lg blur-md" />
                <div className="relative h-10 w-1.5 bg-gradient-to-b from-primary to-primary/50 rounded-full" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  Contest Questions
                </h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Manage and organize your problems • {questions.length} total
                </p>
              </div>
            </div>

            {/* Questions List */}
            <QuestionManagementList 
              questions={questions} 
              contestId={contest.id} 
              contestSlug={contestSlug} 
            />
          </div>
        </TabsContent>

        <TabsContent value="add-question" className="mt-0 space-y-4 focus-visible:outline-none animate-in fade-in-50 duration-300">
          <Card className="border-2 border-green-500/20 bg-gradient-to-br from-green-50/50 to-emerald-50/50 dark:from-green-950/20 dark:to-emerald-950/20 shadow-lg overflow-hidden relative">
            {/* Decorative Background */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-green-400/10 to-emerald-400/10 rounded-full blur-3xl -mr-32 -mt-32" />
            
            <div className="p-4 sm:p-6 space-y-4 relative">
              {/* Section Header */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-green-500/20 rounded-lg blur-md" />
                  <div className="relative h-10 w-1.5 bg-gradient-to-b from-green-500 to-emerald-500 rounded-full" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl sm:text-2xl font-bold">Add New Question</h3>
                    <Sparkles className="h-5 w-5 text-green-600 dark:text-green-500" />
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Create a new coding problem for participants
                  </p>
                </div>
              </div>
              
              <AddQuestionForm 
                contestId={contest.id} 
                orderIndex={questions.length + 1} 
              />
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="mt-0 space-y-4 focus-visible:outline-none animate-in fade-in-50 duration-300">
          <Card className="border-2 border-blue-500/20 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20 shadow-lg overflow-hidden relative">
            {/* Decorative Background */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-400/10 to-indigo-400/10 rounded-full blur-3xl -mr-32 -mt-32" />
            
            <div className="p-4 sm:p-6 space-y-4 relative">
              {/* Section Header */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-500/20 rounded-lg blur-md" />
                  <div className="relative h-10 w-1.5 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold">Contest Settings</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Configure contest details and preferences
                  </p>
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
