'use client';
import React from 'react'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { createRoadmap } from '@/actions/roadmap';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const roadmapSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  category: z.enum([
    'frontend',
    'backend',
    'fullstack',
    'devops',
    'mobile',
    'data-science',
    'ai-ml',
    'cybersecurity',
    'other',
  ]),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  estimatedTime: z.string().optional(),
});

type RoadmapFormValues = z.infer<typeof roadmapSchema>;

export function CreateRoadmapForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<RoadmapFormValues>({
    resolver: zodResolver(roadmapSchema),
    defaultValues: {
      title: '',
      description: '',
      category: 'frontend',
      difficulty: 'beginner',
      estimatedTime: '',
    },
  });

  async function onSubmit(data: RoadmapFormValues) {
    setIsLoading(true);
    try {
      const result = await createRoadmap(data);
      toast.success('Roadmap created successfully!');
      router.push(`/admin/roadmap/${result.id}`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create roadmap';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Roadmap Title *</FormLabel>
              <FormControl>
                <Input placeholder="Frontend Developer Roadmap" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="A comprehensive guide to becoming a frontend developer..."
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>Describe what students will learn</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="frontend">Frontend Development</SelectItem>
                    <SelectItem value="backend">Backend Development</SelectItem>
                    <SelectItem value="fullstack">Full Stack Development</SelectItem>
                    <SelectItem value="devops">DevOps</SelectItem>
                    <SelectItem value="mobile">Mobile Development</SelectItem>
                    <SelectItem value="data-science">Data Science</SelectItem>
                    <SelectItem value="ai-ml">AI/ML</SelectItem>
                    <SelectItem value="cybersecurity">Cybersecurity</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="difficulty"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Difficulty Level *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="estimatedTime"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Estimated Time (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="3 months, 6 weeks, etc." {...field} />
              </FormControl>
              <FormDescription>How long will it take to complete?</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-4">
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-primary hover:bg-primary/90"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Roadmap
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/admin/roadmap')}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
