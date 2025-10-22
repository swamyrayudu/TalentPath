'use client';

import React from 'react'
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { addTestCase } from '@/actions/contest.actions';
import { toast } from 'sonner';
import { Loader2, Plus, Eye, EyeOff } from 'lucide-react';


interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  isSample: boolean;
  isHidden: boolean;
  points: number;
}

interface TestCaseManagerProps {
  questionId: string;
  testCases: TestCase[];
}

export function TestCaseManager({ questionId, testCases }: TestCaseManagerProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    input: '',
    expectedOutput: '',
    isSample: true,
    isHidden: false,
    points: 10,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await addTestCase({
        questionId,
        ...formData,
      });

      if (result.success) {
        toast.success('Test case added successfully!');
        setFormData({
          input: '',
          expectedOutput: '',
          isSample: true,
          isHidden: false,
          points: 10,
        });
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to add test case');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Add Test Case Form */}
      <Card>
        <CardHeader>
          <CardTitle>Add Test Case</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="input">Input *</Label>
              <Textarea
                id="input"
                value={formData.input}
                onChange={(e) => setFormData({ ...formData, input: e.target.value })}
                placeholder="Enter input data..."
                rows={4}
                required
                className="font-mono text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expectedOutput">Expected Output *</Label>
              <Textarea
                id="expectedOutput"
                value={formData.expectedOutput}
                onChange={(e) => setFormData({ ...formData, expectedOutput: e.target.value })}
                placeholder="Enter expected output..."
                rows={4}
                required
                className="font-mono text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="points">Points *</Label>
              <Input
                id="points"
                type="number"
                value={formData.points}
                onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) })}
                min={1}
                max={100}
                required
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="isSample">Sample Test Case (Visible to users)</Label>
              <Switch
                id="isSample"
                checked={formData.isSample}
                onCheckedChange={(checked: boolean) => setFormData({ ...formData, isSample: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="isHidden">Hidden Test Case</Label>
              <Switch
                id="isHidden"
                checked={formData.isHidden}
                onCheckedChange={(checked: boolean) => setFormData({ ...formData, isHidden: checked })}
              />
            </div>

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Add Test Case
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Test Cases List */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Test Cases ({testCases.length})</CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Eye className="h-4 w-4" />
                <span>Sample</span>
                <EyeOff className="h-4 w-4 ml-2" />
                <span>Hidden</span>
              </div>
            </div>
          </CardHeader>
        </Card>

        {testCases.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <p className="text-muted-foreground">No test cases yet</p>
            </CardContent>
          </Card>
        ) : (
          testCases.map((testCase, index) => (
            <Card key={testCase.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold">Test Case {index + 1}</span>
                      {testCase.isSample && (
                        <Badge variant="secondary" className="gap-1">
                          <Eye className="h-3 w-3" />
                          Sample
                        </Badge>
                      )}
                      {testCase.isHidden && (
                        <Badge variant="outline" className="gap-1">
                          <EyeOff className="h-3 w-3" />
                          Hidden
                        </Badge>
                      )}
                      <Badge>{testCase.points} pts</Badge>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div>
                        <p className="text-muted-foreground mb-1">Input:</p>
                        <pre className="bg-muted p-2 rounded font-mono text-xs overflow-x-auto">
                          {testCase.input}
                        </pre>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Expected Output:</p>
                        <pre className="bg-muted p-2 rounded font-mono text-xs overflow-x-auto">
                          {testCase.expectedOutput}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
