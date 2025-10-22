'use client';
import React from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, GripVertical, Save, ExternalLink, Map } from 'lucide-react';
import { addRoadmapStep } from '@/actions/roadmap';
import { toast } from 'sonner';
import type { RoadmapStep } from '@/lib/db/schema';

export function RoadmapStepsManager({
  roadmapId,
  initialSteps,
}: {
  roadmapId: string;
  initialSteps: RoadmapStep[];
}) {
  const router = useRouter();
  const [steps, setSteps] = useState(initialSteps);
  const [newStep, setNewStep] = useState({
    title: '',
    description: '',
    resources: '',
  });
  const [isAdding, setIsAdding] = useState(false);

  const handleAddStep = async () => {
    if (!newStep.title || !newStep.description) {
      toast.error('Please fill in title and description');
      return;
    }

    setIsAdding(true);
    try {
      const result = await addRoadmapStep({
        roadmapId,
        title: newStep.title,
        description: newStep.description,
        resources: newStep.resources,
        orderIndex: steps.length,
      });

      setSteps([...steps, result]);
      setNewStep({ title: '', description: '', resources: '' });
      toast.success('Step added successfully!');
      router.refresh();
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message || 'Failed to add step');
      } else {
        toast.error('Failed to add step');
      }
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Existing Steps */}
      <div className="space-y-3">
        {steps.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
            <Map className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No steps added yet</p>
            <p className="text-sm">Add your first step below to get started</p>
          </div>
        ) : (
          steps.map((step, index) => (
            <Card key={step.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
                    <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center p-0">
                      {index + 1}
                    </Badge>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">{step.title}</h4>
                    <p className="text-sm text-muted-foreground mb-2">{step.description}</p>
                    {step.resources && (
                      <a
                        href={step.resources}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        {step.resources}
                      </a>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add New Step Form */}
      <Card className="border-2 border-primary/20 bg-primary/5">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2 text-lg">
            <Plus className="h-5 w-5 text-primary" />
            Add New Step
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Step Title <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="e.g., Learn HTML Basics"
                value={newStep.title}
                onChange={(e) => setNewStep({ ...newStep, title: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">
                Description <span className="text-red-500">*</span>
              </label>
              <Textarea
                placeholder="Describe what students will learn in this step..."
                value={newStep.description}
                onChange={(e) => setNewStep({ ...newStep, description: e.target.value })}
                className="min-h-[100px]"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">
                Resources URL (Optional)
              </label>
              <Input
                placeholder="https://developer.mozilla.org/en-US/docs/Web/HTML"
                value={newStep.resources}
                onChange={(e) => setNewStep({ ...newStep, resources: e.target.value })}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Add a link to documentation, tutorial, or learning resource
              </p>
            </div>
            <Button
              onClick={handleAddStep}
              disabled={isAdding}
              className="gap-2 w-full sm:w-auto"
              size="lg"
            >
              <Save className="h-4 w-4" />
              {isAdding ? 'Adding Step...' : 'Add Step'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
