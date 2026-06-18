'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Loader2, 
  ListPlus, 
  X, 
  Link2,
  Trash
} from 'lucide-react';
import { toast } from 'sonner';

interface DsaPattern {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  topic: string | null;
  orderIndex: number;
  createdAt: string;
  problemCount: number;
}

interface Problem {
  id: number;
  title: string;
  slug: string;
  difficulty: string;
  platform: string;
  url: string;
}

export default function DSAPatternsManager() {
  const [patterns, setPatterns] = useState<DsaPattern[]>([]);
  const [allProblems, setAllProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pattern Create/Edit Modal State
  const [activeTopic, setActiveTopic] = useState<string>('ALL');
  const [isPatternModalOpen, setIsPatternModalOpen] = useState(false);
  const [editingPattern, setEditingPattern] = useState<DsaPattern | null>(null);
  const [patternName, setPatternName] = useState('');
  const [patternDescription, setPatternDescription] = useState('');
  const [patternTopic, setPatternTopic] = useState('array');
  const [customTopic, setCustomTopic] = useState('');
  const [patternOrderIndex, setPatternOrderIndex] = useState('0');
  const [submittingPattern, setSubmittingPattern] = useState(false);

  const uniqueTopics = useMemo(() => {
    const topicsSet = new Set<string>();
    patterns.forEach(p => {
      if (p.topic) {
        topicsSet.add(p.topic.trim().toLowerCase());
      }
    });
    return Array.from(topicsSet).sort();
  }, [patterns]);

  // Link Problems Modal State
  const [selectedPattern, setSelectedPattern] = useState<DsaPattern | null>(null);
  const [isLinkProblemsModalOpen, setIsLinkProblemsModalOpen] = useState(false);
  const [linkedProblems, setLinkedProblems] = useState<Problem[]>([]);
  const [loadingLinked, setLoadingLinked] = useState(false);
  const [problemSearchQuery, setProblemSearchQuery] = useState('');
  const [linkingProblemId, setLinkingProblemId] = useState<number | null>(null);
  const [unlinkingProblemId, setUnlinkingProblemId] = useState<number | null>(null);

  useEffect(() => {
    fetchPatterns();
    fetchAllProblems();
  }, []);

  const fetchPatterns = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/patterns');
      const data = await res.json();
      if (data.success) {
        setPatterns(data.data);
      } else {
        toast.error(data.error || 'Failed to fetch patterns');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error fetching patterns');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllProblems = async () => {
    try {
      const res = await fetch('/api/problems?limit=10000');
      const data = await res.json();
      if (data.success) {
        setAllProblems(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch all problems', err);
    }
  };

  const fetchLinkedProblems = async (patternId: string) => {
    try {
      setLoadingLinked(true);
      const res = await fetch(`/api/admin/patterns/${patternId}/problems`);
      const data = await res.json();
      if (data.success) {
        setLinkedProblems(data.data);
      } else {
        toast.error(data.error || 'Failed to fetch linked questions');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error fetching linked questions');
    } finally {
      setLoadingLinked(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingPattern(null);
    setPatternName('');
    setPatternDescription('');
    setPatternTopic('array');
    setCustomTopic('');
    setPatternOrderIndex('0');
    setIsPatternModalOpen(true);
  };

  const handleOpenEditModal = (pattern: DsaPattern) => {
    setEditingPattern(pattern);
    setPatternName(pattern.name);
    setPatternDescription(pattern.description || '');
    const matchedCommon = ['array', 'string', 'linked-list', 'stack-queue', 'tree', 'graph', 'heap', 'two-pointers', 'binary-search', 'dynamic-programming', 'greedy', 'backtracking', 'bit-manipulation', 'sorting'].includes(pattern.topic || '');
    if (pattern.topic && !matchedCommon) {
      setPatternTopic('custom');
      setCustomTopic(pattern.topic);
    } else {
      setPatternTopic(pattern.topic || 'array');
      setCustomTopic('');
    }
    setPatternOrderIndex(String(pattern.orderIndex ?? 0));
    setIsPatternModalOpen(true);
  };

  const handleOpenLinkModal = (pattern: DsaPattern) => {
    setSelectedPattern(pattern);
    setLinkedProblems([]);
    setProblemSearchQuery('');
    fetchLinkedProblems(pattern.id);
    setIsLinkProblemsModalOpen(true);
  };

  const handleSavePattern = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patternName.trim()) {
      toast.error('Pattern name is required');
      return;
    }

    setSubmittingPattern(true);
    try {
      const url = editingPattern 
        ? `/api/admin/patterns/${editingPattern.id}`
        : '/api/admin/patterns';
      const method = editingPattern ? 'PUT' : 'POST';
 
      const finalTopic = patternTopic === 'custom' ? customTopic.trim() : patternTopic;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: patternName,
          description: patternDescription,
          topic: finalTopic || null,
          orderIndex: parseInt(patternOrderIndex) || 0,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(editingPattern ? 'Pattern updated successfully!' : 'Pattern created successfully!');
        setIsPatternModalOpen(false);
        fetchPatterns();
      } else {
        toast.error(data.error || 'Failed to save pattern');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error saving pattern');
    } finally {
      setSubmittingPattern(false);
    }
  };

  const handleDeletePattern = async (pattern: DsaPattern) => {
    if (!confirm(`Are you sure you want to delete pattern "${pattern.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/patterns/${pattern.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Pattern deleted successfully');
        fetchPatterns();
      } else {
        toast.error(data.error || 'Failed to delete pattern');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error deleting pattern');
    }
  };

  const handleAddProblemToPattern = async (problemId: number) => {
    if (!selectedPattern) return;
    
    setLinkingProblemId(problemId);
    try {
      const res = await fetch(`/api/admin/patterns/${selectedPattern.id}/problems`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problemId }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Problem added to pattern!');
        fetchLinkedProblems(selectedPattern.id);
        // Update local patterns problemCount
        setPatterns(prev => prev.map(p => p.id === selectedPattern.id ? { ...p, problemCount: p.problemCount + 1 } : p));
      } else {
        toast.error(data.error || 'Failed to add problem');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error adding problem to pattern');
    } finally {
      setLinkingProblemId(null);
    }
  };

  const handleRemoveProblemFromPattern = async (problemId: number) => {
    if (!selectedPattern) return;
    
    if (!confirm('Remove this question from the pattern?')) return;

    setUnlinkingProblemId(problemId);
    try {
      const res = await fetch(`/api/admin/patterns/${selectedPattern.id}/problems?problemId=${problemId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Problem removed from pattern!');
        fetchLinkedProblems(selectedPattern.id);
        // Update local patterns problemCount
        setPatterns(prev => prev.map(p => p.id === selectedPattern.id ? { ...p, problemCount: Math.max(0, p.problemCount - 1) } : p));
      } else {
        toast.error(data.error || 'Failed to remove problem');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error removing problem from pattern');
    } finally {
      setUnlinkingProblemId(null);
    }
  };

  // Filters
  const filteredPatterns = useMemo(() => {
    let result = patterns;
    if (activeTopic !== 'ALL') {
      result = result.filter(p => p.topic?.trim().toLowerCase() === activeTopic);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.slug.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q))
      );
    }
    return result;
  }, [patterns, searchQuery, activeTopic]);

  const filteredUnlinkedProblems = useMemo(() => {
    if (!problemSearchQuery.trim()) return [];
    
    const q = problemSearchQuery.toLowerCase();
    const linkedIds = new Set(linkedProblems.map(p => p.id));
    
    return allProblems
      .filter(p => !linkedIds.has(p.id))
      .filter(p => 
        p.title.toLowerCase().includes(q) || 
        p.slug.toLowerCase().includes(q)
      )
      .slice(0, 10); // Limit to top 10 matches for neat list
  }, [allProblems, linkedProblems, problemSearchQuery]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search patterns by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 border-2"
          />
        </div>
        <Button onClick={handleOpenCreateModal} className="bg-primary hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" />
          Create Pattern
        </Button>
      </div>

      {/* Topics Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        <button
          onClick={() => setActiveTopic('ALL')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer border ${
            activeTopic === 'ALL'
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-card text-muted-foreground border-border hover:text-foreground hover:bg-muted/50'
          }`}
        >
          All Topics ({patterns.length})
        </button>
        {uniqueTopics.map(topic => {
          const count = patterns.filter(p => p.topic?.trim().toLowerCase() === topic).length;
          return (
            <button
              key={topic}
              onClick={() => setActiveTopic(topic)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer border capitalize ${
                activeTopic === topic
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card text-muted-foreground border-border hover:text-foreground hover:bg-muted/50'
              }`}
            >
              {topic.replace('-', ' ')} ({count})
            </button>
          );
        })}
      </div>

      <Card className="border-2">
        <CardHeader>
          <CardTitle>DSA Patterns List</CardTitle>
          <CardDescription>
            Create and organize DSA sheets by design patterns (e.g. Sliding Window, Two Pointers).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredPatterns.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No patterns found. Create one to get started!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pattern Name</TableHead>
                    <TableHead>Topic</TableHead>
                    <TableHead className="text-center">Order</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-center">Questions Linked</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPatterns.map((pattern) => (
                    <TableRow key={pattern.id}>
                      <TableCell className="font-semibold text-foreground">
                        {pattern.name}
                      </TableCell>
                      <TableCell>
                        {pattern.topic ? (
                          <Badge variant="secondary" className="capitalize bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                            {pattern.topic.replace('-', ' ')}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">None</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center font-bold">
                        {pattern.orderIndex}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {pattern.slug}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-muted-foreground">
                        {pattern.description || 'No description provided'}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="font-bold text-sm px-2.5 py-0.5">
                          {pattern.problemCount}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenLinkModal(pattern)}
                            className="h-8 border-2 border-primary/20 hover:border-primary/50 text-primary hover:bg-primary/5 gap-1"
                          >
                            <ListPlus className="h-3.5 w-3.5" />
                            Add/Manage Questions
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenEditModal(pattern)}
                            className="h-8 border-2"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeletePattern(pattern)}
                            className="h-8"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pattern Create/Edit Dialog */}
      <Dialog open={isPatternModalOpen} onOpenChange={setIsPatternModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingPattern ? 'Edit Pattern' : 'Create Pattern'}</DialogTitle>
            <DialogDescription>
              {editingPattern ? 'Modify the details of this pattern' : 'Define a new DSA pattern for problem categorization'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSavePattern} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="pattern-name">Pattern Name *</Label>
              <Input
                id="pattern-name"
                placeholder="e.g., Sliding Window, Backtracking"
                value={patternName}
                onChange={(e) => setPatternName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Topic *</Label>
              <Select value={patternTopic} onValueChange={setPatternTopic}>
                <SelectTrigger>
                  <SelectValue placeholder="Select topic for this pattern" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  <SelectItem value="array">Arrays</SelectItem>
                  <SelectItem value="string">Strings</SelectItem>
                  <SelectItem value="linked-list">Linked Lists</SelectItem>
                  <SelectItem value="stack-queue">Stacks & Queues</SelectItem>
                  <SelectItem value="tree">Trees</SelectItem>
                  <SelectItem value="graph">Graphs</SelectItem>
                  <SelectItem value="heap">Heap</SelectItem>
                  <SelectItem value="two-pointers">Two Pointers</SelectItem>
                  <SelectItem value="binary-search">Binary Search</SelectItem>
                  <SelectItem value="dynamic-programming">Dynamic Programming</SelectItem>
                  <SelectItem value="greedy">Greedy</SelectItem>
                  <SelectItem value="backtracking">Backtracking</SelectItem>
                  <SelectItem value="bit-manipulation">Bit Manipulation</SelectItem>
                  <SelectItem value="sorting">Sorting</SelectItem>
                  <SelectItem value="custom">Custom / Create New...</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pattern-order">Display Order Number (e.g. 1, 2, 3) *</Label>
              <Input
                id="pattern-order"
                type="number"
                placeholder="e.g., 1"
                value={patternOrderIndex}
                onChange={(e) => setPatternOrderIndex(e.target.value)}
                required
              />
            </div>
            {patternTopic === 'custom' && (
              <div className="space-y-1.5">
                <Label htmlFor="custom-topic">Custom Topic Name *</Label>
                <Input
                  id="custom-topic"
                  placeholder="e.g. Math, Recursion"
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  required
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="pattern-desc">Description (Optional)</Label>
              <Textarea
                id="pattern-desc"
                placeholder="Describe this pattern and common approaches..."
                value={patternDescription}
                onChange={(e) => setPatternDescription(e.target.value)}
                rows={3}
              />
            </div>
            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPatternModalOpen(false)}
                disabled={submittingPattern}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submittingPattern}>
                {submittingPattern ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Pattern'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Link / Manage Questions Modal */}
      <Dialog open={isLinkProblemsModalOpen} onOpenChange={setIsLinkProblemsModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Manage Pattern Questions</DialogTitle>
            <DialogDescription>
              Link questions to &quot;{selectedPattern?.name}&quot; or delete existing links.
            </DialogDescription>
          </DialogHeader>

          {/* Search to Link New Problem */}
          <div className="space-y-2 py-2 border-b border-border">
            <Label className="text-sm font-semibold">Search Questions to Link</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search database problems by title..."
                value={problemSearchQuery}
                onChange={(e) => setProblemSearchQuery(e.target.value)}
                className="pl-10"
              />
              {problemSearchQuery && (
                <button
                  onClick={() => setProblemSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 hover:bg-muted p-0.5 rounded"
                >
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              )}
            </div>

            {/* Quick Match Results */}
            {problemSearchQuery.trim() && (
              <div className="bg-muted/50 border rounded-lg divide-y max-h-48 overflow-y-auto mt-2">
                {filteredUnlinkedProblems.length === 0 ? (
                  <div className="p-3 text-sm text-muted-foreground text-center">
                    No unlinked questions match your search
                  </div>
                ) : (
                  filteredUnlinkedProblems.map((prob) => (
                    <div key={prob.id} className="p-2.5 flex items-center justify-between text-sm hover:bg-muted/80 transition-colors">
                      <div>
                        <span className="font-semibold text-foreground">{prob.title}</span>
                        <div className="flex gap-1.5 mt-0.5">
                          <Badge variant="outline" className="text-[10px] py-0 font-normal">
                            {prob.platform}
                          </Badge>
                          <Badge variant="outline" className="text-[10px] py-0 font-normal">
                            {prob.difficulty}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleAddProblemToPattern(prob.id)}
                        disabled={linkingProblemId === prob.id}
                        className="h-8 gap-1"
                      >
                        {linkingProblemId === prob.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Link2 className="h-3.5 w-3.5" />
                        )}
                        Link
                      </Button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Linked Problems List */}
          <div className="flex-1 overflow-y-auto py-2">
            <h4 className="text-sm font-semibold mb-3 flex items-center justify-between">
              <span>Linked Questions ({linkedProblems.length})</span>
            </h4>
            
            {loadingLinked ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : linkedProblems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No questions linked to this pattern yet. Use the search bar above to link some!
              </div>
            ) : (
              <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                {linkedProblems.map((prob) => (
                  <div key={prob.id} className="flex items-center justify-between p-3 border rounded-lg bg-card hover:bg-muted/20 transition-colors">
                    <div>
                      <p className="font-semibold text-sm text-foreground">{prob.title}</p>
                      <div className="flex gap-1.5 mt-1">
                        <Badge variant="outline" className="text-[10px] py-0 font-normal">
                          {prob.platform}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] py-0 font-normal">
                          {prob.difficulty}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRemoveProblemFromPattern(prob.id)}
                      disabled={unlinkingProblemId === prob.id}
                      className="h-8 border-red-200 hover:border-red-500 hover:bg-red-50 text-red-600 hover:text-red-700"
                    >
                      {unlinkingProblemId === prob.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="mt-4 pt-2 border-t">
            <Button onClick={() => setIsLinkProblemsModalOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
