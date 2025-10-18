'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AddQuestionForm } from './add-question-form';
import { QuestionManagementList } from './question-management-list';
import { ContestSettings } from './contest-settings';
import { FileText, Settings, Plus } from 'lucide-react';

interface ContestManagementTabsProps {
  contest: any;
  questions: any[];
  contestSlug: string;
}

export function ContestManagementTabs({ contest, questions, contestSlug }: ContestManagementTabsProps) {
  return (
    <Tabs defaultValue="questions" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="questions" className="gap-2">
          <FileText className="h-4 w-4" />
          Questions
        </TabsTrigger>
        <TabsTrigger value="add-question" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Question
        </TabsTrigger>
        <TabsTrigger value="settings" className="gap-2">
          <Settings className="h-4 w-4" />
          Settings
        </TabsTrigger>
      </TabsList>

      <TabsContent value="questions" className="mt-6">
        <QuestionManagementList questions={questions} contestId={contest.id} contestSlug={contestSlug} />
      </TabsContent>

      <TabsContent value="add-question" className="mt-6">
        <AddQuestionForm contestId={contest.id} orderIndex={questions.length + 1} />
      </TabsContent>

      <TabsContent value="settings" className="mt-6">
        <ContestSettings contest={contest} />
      </TabsContent>
    </Tabs>
  );
}
