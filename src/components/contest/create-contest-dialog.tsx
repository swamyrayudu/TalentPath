'use client';
import React from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { createContest } from '@/actions/contest.actions';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export function CreateContestDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startTime: '',
    durationMinutes: '',
    visibility: 'public' as 'public' | 'private',
    accessCode: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await createContest({
        ...formData,
        startTime: new Date(formData.startTime),
        durationMinutes: parseInt(formData.durationMinutes) || 60,
      });

      if (result.success && result.data) {
        toast.success('Contest created successfully!');
        setOpen(false);
        router.push(`/contest/${result.data.slug}`);
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to create contest');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Contest</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Contest Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Weekly Coding Challenge"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe your contest..."
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                value={formData.durationMinutes}
                onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })}
                placeholder="60"
                min={15}
                max={480}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Visibility</Label>
            <RadioGroup
              value={formData.visibility}
              onValueChange={(value: 'public' | 'private') => setFormData({ ...formData, visibility: value })}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="public" id="public" />
                <Label htmlFor="public" className="font-normal">Public - Anyone can join</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="private" id="private" />
                <Label htmlFor="private" className="font-normal">Private - Requires access code</Label>
              </div>
            </RadioGroup>
          </div>

          {formData.visibility === 'private' && (
            <div className="space-y-2">
              <Label htmlFor="accessCode">Access Code</Label>
              <Input
                id="accessCode"
                value={formData.accessCode}
                onChange={(e) => setFormData({ ...formData, accessCode: e.target.value })}
                placeholder="Enter access code"
                required
              />
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Contest
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
