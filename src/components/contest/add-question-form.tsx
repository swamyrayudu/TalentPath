'use client';
import React from 'react';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { addContestQuestion } from '@/actions/contest.actions';
import { QuestionLibrary } from '@/components/contest/question-library';
import { toast } from 'sonner';
import { Loader2, Plus, BookOpen, FileEdit } from 'lucide-react';

interface AddQuestionFormProps {
  contestId: string;
  orderIndex: number;
}

export function AddQuestionForm({ contestId, orderIndex }: AddQuestionFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    difficulty: 'EASY' as 'EASY' | 'MEDIUM' | 'HARD',
    points: 100,
    timeLimitSeconds: 2,
    memoryLimitMb: 256,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await addContestQuestion({
        contestId,
        ...formData,
        orderIndex,
      });

      if (result.success) {
        toast.success('Question added successfully!');
        // Reset form
        setFormData({
          title: '',
          description: '',
          difficulty: 'EASY',
          points: 100,
          timeLimitSeconds: 2,
          memoryLimitMb: 256,
        });
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to add question');
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('An unexpected error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <Tabs defaultValue="library" className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-9 sm:h-10 p-0.5 sm:p-1">
          <TabsTrigger value="library" className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 gap-1 sm:gap-2">
            <BookOpen className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Question Library</span>
            <span className="sm:hidden">Library</span>
          </TabsTrigger>
          <TabsTrigger value="new" className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 gap-1 sm:gap-2">
            <FileEdit className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Create New</span>
            <span className="sm:hidden">New</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="library" className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
          <div className="text-xs sm:text-sm text-muted-foreground">
            Add questions from the library with pre-configured test cases
          </div>
          <QuestionLibrary contestId={contestId} orderIndex={orderIndex} />
        </TabsContent>

        <TabsContent value="new" className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="title" className="text-xs sm:text-sm">Question Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Two Sum"
                  className="text-sm h-9 sm:h-10"
                  required
                />
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="description" className="text-xs sm:text-sm">Problem Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the problem, input format, output format, and examples..."
                  rows={8}
                  className="text-xs sm:text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="difficulty" className="text-xs sm:text-sm">Difficulty *</Label>
                  <Select
                    value={formData.difficulty}
                    onValueChange={(value: 'EASY' | 'MEDIUM' | 'HARD') =>
                      setFormData({ ...formData, difficulty: value })
                    }
                  >
                    <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EASY" className="text-xs sm:text-sm">Easy</SelectItem>
                      <SelectItem value="MEDIUM" className="text-xs sm:text-sm">Medium</SelectItem>
                      <SelectItem value="HARD" className="text-xs sm:text-sm">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="points" className="text-xs sm:text-sm">Points *</Label>
                  <Input
                    id="points"
                    type="number"
                    value={formData.points}
                    onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 100 })}
                    min={10}
                    max={1000}
                    className="text-sm h-9 sm:h-10"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="timeLimit" className="text-xs sm:text-sm">Time Limit (seconds) *</Label>
                  <Input
                    id="timeLimit"
                    type="number"
                    value={formData.timeLimitSeconds}
                    onChange={(e) => setFormData({ ...formData, timeLimitSeconds: parseInt(e.target.value) || 2 })}
                    min={1}
                    max={10}
                    className="text-sm h-9 sm:h-10"
                    required
                  />
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="memoryLimit" className="text-xs sm:text-sm">Memory Limit (MB) *</Label>
                  <Input
                    id="memoryLimit"
                    type="number"
                    value={formData.memoryLimitMb}
                    onChange={(e) => setFormData({ ...formData, memoryLimitMb: parseInt(e.target.value) || 256 })}
                    min={128}
                    max={512}
                    className="text-sm h-9 sm:h-10"
                    required
                  />
                </div>
              </div>

              <Button type="submit" disabled={isLoading} size="sm" className="w-full text-xs sm:text-sm h-9 sm:h-10">
                {isLoading ? (
                  <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 animate-spin" />
                ) : (
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                )}
                Create Question
              </Button>
            </form>
          </TabsContent>
      </Tabs>
    </div>
  );
}
