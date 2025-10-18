'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { addContestQuestion } from '@/actions/contest.actions';
import { toast } from 'sonner';
import { Loader2, Plus } from 'lucide-react';

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
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Question</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Question Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Two Sum"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Problem Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the problem, input format, output format, and examples..."
              rows={10}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty *</Label>
              <Select
                value={formData.difficulty}
                onValueChange={(value: 'EASY' | 'MEDIUM' | 'HARD') =>
                  setFormData({ ...formData, difficulty: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EASY">Easy</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HARD">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="points">Points *</Label>
              <Input
                id="points"
                type="number"
                value={formData.points}
                onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) })}
                min={10}
                max={1000}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="timeLimit">Time Limit (seconds) *</Label>
              <Input
                id="timeLimit"
                type="number"
                value={formData.timeLimitSeconds}
                onChange={(e) => setFormData({ ...formData, timeLimitSeconds: parseInt(e.target.value) })}
                min={1}
                max={10}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="memoryLimit">Memory Limit (MB) *</Label>
              <Input
                id="memoryLimit"
                type="number"
                value={formData.memoryLimitMb}
                onChange={(e) => setFormData({ ...formData, memoryLimitMb: parseInt(e.target.value) })}
                min={128}
                max={512}
                required
              />
            </div>
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            Add Question
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
