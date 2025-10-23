
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Edit, Trash2, Search, Download, AlertCircle, CheckCircle, Loader2, ExternalLink, Eye, EyeOff } from 'lucide-react';
import { useAdminProblemsCache } from '@/components/context/AdminProblemsCacheContext';
import type { Problem } from '@/components/context/AdminProblemsCacheContext';

// ...existing code...
interface ProblemFormData {
  title: string;
  slug: string;
  difficulty: string;
  platform: string;
  likes: string;
  dislikes: string;
  acceptanceRate: string;
  url: string;
  topicTags: string;
  companyTags: string;
  mainTopics: string;
  topicSlugs: string;
  accepted: string;
  submissions: string;
  isPremium: boolean;
  selectedTopic: string; // New field for single topic selection
}

// All available topics organized by platform and difficulty
const ALL_TOPICS = {
  LEETCODE: {
    EASY: [
      { name: 'Arrays', slug: 'array' },
      { name: 'Strings', slug: 'string' },
      { name: 'Linked Lists', slug: 'linked-list' },
      { name: 'Stacks & Queues', slug: 'stack' },
      { name: 'Hash Maps & Sets', slug: 'hash-table' },
      { name: 'Trees', slug: 'tree' },
      { name: 'Sorting & Searching', slug: 'sorting' },
    ],
    MEDIUM: [
      { name: 'Arrays & Hashing', slug: 'array' },
      { name: 'Two Pointers', slug: 'two-pointers' },
      { name: 'Linked Lists', slug: 'linked-list' },
      { name: 'Stacks & Queues', slug: 'stack' },
      { name: 'Trees', slug: 'tree' },
      { name: 'Graphs', slug: 'graph' },
      { name: 'Sorting & Searching', slug: 'binary-search' },
      { name: 'Dynamic Programming', slug: 'dynamic-programming' },
    ],
    HARD: [
      { name: 'Dynamic Programming', slug: 'dynamic-programming' },
      { name: 'Graphs', slug: 'graph' },
      { name: 'Trees & Tries', slug: 'tree' },
      { name: 'Arrays & Strings', slug: 'array' },
      { name: 'Greedy', slug: 'greedy' },
      { name: 'Bit Manipulation', slug: 'bit-manipulation' },
      { name: 'Advanced Data Structures', slug: 'heap' },
    ],
  },
  GEEKSFORGEEKS: {
    EASY: [
      { name: 'Arrays', slug: 'array' },
      { name: 'Strings', slug: 'string' },
    ],
    MEDIUM: [
      { name: 'Linked List', slug: 'linked-list' },
      { name: 'Stacks & Queues', slug: 'stack' },
    ],
    HARD: [
      { name: 'Dynamic Programming', slug: 'dynamic-programming' },
    ],
  },
};
const ITEMS_PER_PAGE = 50;

export default function AdminProblemsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { allProblems, setAllProblems } = useAdminProblemsCache();

  const [displayedProblems, setDisplayedProblems] = useState<Problem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState<string>('ALL');
  const [topicFilter, setTopicFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState<boolean>(allProblems.length === 0);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProblem, setEditingProblem] = useState<Problem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [toggleLoading, setToggleLoading] = useState<string | null>(null); // Track which problem is being toggled

  const observerTarget = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState<ProblemFormData>({
    title: '', slug: '', difficulty: 'EASY', platform: 'LEETCODE',
    likes: '0', dislikes: '0', acceptanceRate: '0', url: '',
    topicTags: '', companyTags: '', mainTopics: '', topicSlugs: '',
    accepted: '0', submissions: '0', isPremium: false, selectedTopic: ''
  });

  useEffect(() => {
    if (status === 'loading') return;
    if (!session?.user) { router.push('/auth/signin'); return; }
    if ((session.user as { role?: string }).role !== 'admin') { router.push('/dashboard'); return; }
    if (allProblems.length === 0) fetchProblems();
    else setLoading(false);
  }, [status, session, router, allProblems]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loadingMore) loadMore();
    }, { threshold: 0.1 });
    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, page, searchQuery, allProblems]);

  useEffect(() => {
    const filtered = getFilteredProblems();
    setDisplayedProblems(filtered.slice(0, ITEMS_PER_PAGE));
    setPage(1);
    setHasMore(filtered.length > ITEMS_PER_PAGE);
  }, [allProblems, searchQuery, platformFilter, topicFilter]);

  const fetchProblems = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/problems?limit=10000');
      const data = await response.json();
      if (data.success) setAllProblems(data.data);
      else setError(data.error || 'Failed to fetch problems');
    } catch {
      setError('Failed to fetch problems');
    } finally {
      setLoading(false);
    }
  };

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    setTimeout(() => {
      const filtered = getFilteredProblems();
      const nextPage = page + 1;
      const end = nextPage * ITEMS_PER_PAGE;
      setDisplayedProblems(filtered.slice(0, end));
      setPage(nextPage);
      setHasMore(end < filtered.length);
      setLoadingMore(false);
    }, 200);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }, [page, loadingMore, hasMore, allProblems, searchQuery]) as any;

  const getFilteredProblems = () => {
    let filtered = allProblems;
    // Apply platform filter
    if (platformFilter !== 'ALL') {
      filtered = filtered.filter(p => p.platform === platformFilter);
    }
    // Apply topic filter
    if (topicFilter !== 'ALL') {
      filtered = filtered.filter(p => Array.isArray(p.topicSlugs) && p.topicSlugs?.includes(topicFilter));
    }
    // Apply search filter
    if (searchQuery.trim() !== '') {
      filtered = filtered.filter(
        (p: Problem) =>
          p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.slug?.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (Array.isArray(p.topicTags) && p.topicTags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())))
      );
    }
    return filtered;
  };

  // Clear DSA sheet cache so user side updates immediately
  const clearDsaStatsCache = () => {
    const difficulties = ['EASY', 'MEDIUM', 'HARD'];
    const platforms = ['LEETCODE', 'GEEKSFORGEEKS'];
    
    difficulties.forEach(diff => {
      // Clear stats for each difficulty + platform combination (new optimized cache keys)
      platforms.forEach(platform => {
        sessionStorage.removeItem(`dsa-stats-v2-${diff}-${platform}`);
        sessionStorage.removeItem(`dsa-stats-v2-${diff}-${platform}-timestamp`);
      });
      // Clear stats without platform (old keys for backward compatibility)
      sessionStorage.removeItem(`dsa-stats-${diff}`);
      sessionStorage.removeItem(`dsa-stats-${diff}-timestamp`);
      sessionStorage.removeItem(`dsa-stats-v2-${diff}`);
      sessionStorage.removeItem(`dsa-stats-v2-${diff}-timestamp`);
    });
    
    console.log('✅ DSA stats cache cleared - user side will fetch fresh data from optimized table');
  };

  // -------------- CRUD Handlers ----------------
  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      // Use selectedTopic as the primary topic
      const selectedTopicSlug = formData.selectedTopic;
      const topicSlugsArray = selectedTopicSlug ? [selectedTopicSlug] : [];
      const mainTopicsArray = selectedTopicSlug ? [selectedTopicSlug] : [];
      
      const payload = {
        title: formData.title,
        slug: formData.slug,
        difficulty: formData.difficulty,
        platform: formData.platform,
        likes: parseInt(formData.likes) || 0,
        dislikes: parseInt(formData.dislikes) || 0,
        acceptanceRate: formData.acceptanceRate,
        url: formData.url,
        topicTags: formData.topicTags.split(',').map(t => t.trim()).filter(Boolean),
        companyTags: formData.companyTags.split(',').map(t => t.trim()).filter(Boolean),
        mainTopics: mainTopicsArray,
        topicSlugs: topicSlugsArray,
        accepted: parseInt(formData.accepted) || 0,
        submissions: parseInt(formData.submissions) || 0,
        isPremium: formData.isPremium,
      };
      const url = editingProblem
        ? `/api/problems/${editingProblem.id}` : '/api/problems';
      const method = editingProblem ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      console.log('API Response:', data); // Debug log
      
      if (response.ok && data.success) {
        setSuccess(editingProblem ? 'Problem updated successfully!' : 'Problem created successfully!');
        setIsDialogOpen(false);
        resetForm();
        // Update context cache (instant reflect)
        if (editingProblem) {
          setAllProblems(allProblems.map(p => p.id === data.data.id ? data.data : p));
        } else {
          setAllProblems([data.data, ...allProblems]);
        }
        // Clear DSA stats cache so user side updates immediately
        clearDsaStatsCache();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        console.error('API Error:', data); // Debug log
        setError(data.error || 'Failed to save problem');
      }
    } catch {
      setError('Failed to save problem');
    } finally { setSubmitting(false); }
  };

  const handleEdit = (problem: Problem) => {
    setEditingProblem(problem);
    // Extract the first topic slug if available
    const firstTopicSlug = Array.isArray(problem.topicSlugs) && problem.topicSlugs.length > 0 ? problem.topicSlugs[0] : '';
    setFormData({
      title: problem.title,
      slug: problem.slug ?? '',
      difficulty: problem.difficulty,
      platform: problem.platform ?? '',
      likes: problem.likes !== undefined ? problem.likes.toString() : '0',
      dislikes: problem.dislikes !== undefined ? problem.dislikes.toString() : '0',
      acceptanceRate: problem.acceptanceRate ?? '',
      url: problem.url ?? '',
      topicTags: Array.isArray(problem.topicTags) ? problem.topicTags.join(', ') : '',
      companyTags: Array.isArray(problem.companyTags) ? problem.companyTags.join(', ') : '',
      mainTopics: Array.isArray(problem.mainTopics) ? problem.mainTopics.join(', ') : '',
      topicSlugs: Array.isArray(problem.topicSlugs) ? problem.topicSlugs.join(', ') : '',
      accepted: problem.accepted !== undefined ? problem.accepted.toString() : '0',
      submissions: problem.submissions !== undefined ? problem.submissions.toString() : '0',
      isPremium: problem.isPremium ?? false,
      selectedTopic: firstTopicSlug,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string | number) => {
    if (!confirm('Are you sure you want to delete this problem?')) return;
    try {
      const response = await fetch(`/api/problems/${id}`, { method: 'DELETE' });
      const data = await response.json();
      console.log('Delete Response:', data); // Debug log
      
      if (response.ok && data.success) {
        setSuccess('Problem deleted successfully!');
        setAllProblems(allProblems.filter(p => String(p.id) !== String(id)));
        // Clear DSA stats cache so user side updates immediately
        clearDsaStatsCache();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        console.error('Delete Error:', data); // Debug log
        setError(data.error || 'Failed to delete problem');
      }
    } catch {
      setError('Failed to delete problem');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '', slug: '', difficulty: 'EASY', platform: 'LEETCODE',
      likes: '0', dislikes: '0', acceptanceRate: '0', url: '',
      topicTags: '', companyTags: '', mainTopics: '', topicSlugs: '',
      accepted: '0', submissions: '0', isPremium: false, selectedTopic: ''
    });
    setEditingProblem(null);
  };

  const handleExportCSV = () => {
    const csv = [
      [
        'id','title','difficulty','createdAt','isVisibleToUsers'
      ].join(','),
      ...allProblems.map((p) =>
        [
          `"${p.id}"`,
          `"${p.title}"`,
          p.difficulty,
          p.createdAt instanceof Date ? p.createdAt.toISOString() : p.createdAt,
          p.isVisibleToUsers ?? '',
        ].join(',')
      ),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `problems-${Date.now()}.csv`;
    a.click();
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'MEDIUM': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'HARD': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-500';
    }
  };

  const handleToggleSingleVisibility = async (problemId: string | number, currentVisibility: boolean | undefined) => {
    try {
      setToggleLoading(String(problemId));
      const response = await fetch('/api/admin/problems/visibility', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problemIds: [problemId], isVisible: !currentVisibility }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setSuccess(data.message);
        // Update local cache
        setAllProblems(allProblems.map(p => 
          String(p.id) === String(problemId) ? { ...p, isVisibleToUsers: !currentVisibility } : p
        ));
        // Clear DSA stats cache so user side updates immediately
        clearDsaStatsCache();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Failed to update visibility');
      }
    } catch {
      setError('Failed to update visibility');
    } finally {
      setToggleLoading(null);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Manage Problems</h1>
          <p className="text-muted-foreground">Manage DSA problems for the platform</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                Add Problem
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingProblem ? 'Edit Problem' : 'Add New Problem'}</DialogTitle>
                <DialogDescription>
                  {editingProblem ? 'Update problem details' : 'Add a new problem to the database'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateOrUpdate}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input id="title" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="slug">Slug *</Label>
                    <Input id="slug" value={formData.slug} onChange={e => setFormData({ ...formData, slug: e.target.value })} required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Difficulty *</Label>
                      <Select value={formData.difficulty} onValueChange={v => setFormData({ ...formData, difficulty: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EASY">Easy</SelectItem>
                          <SelectItem value="MEDIUM">Medium</SelectItem>
                          <SelectItem value="HARD">Hard</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Platform *</Label>
                      <Select value={formData.platform} onValueChange={v => setFormData({ ...formData, platform: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="LEETCODE">LeetCode</SelectItem>
                          <SelectItem value="CODEFORCES">Codeforces</SelectItem>
                          <SelectItem value="HACKERRANK">HackerRank</SelectItem>
                          <SelectItem value="GEEKSFORGEEKS">GeeksforGeeks</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {/* Topic Selection - Shows topics based on selected platform and difficulty */}
                  <div className="grid gap-2">
                    <Label>DSA Sheet Topic *</Label>
                    <Select 
                      value={formData.selectedTopic} 
                      onValueChange={v => setFormData({ ...formData, selectedTopic: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a topic for this question" />
                      </SelectTrigger>
                      <SelectContent>
                        {formData.platform === 'LEETCODE' && formData.difficulty === 'EASY' && (
                          <>
                            {ALL_TOPICS.LEETCODE.EASY.map(topic => (
                              <SelectItem key={topic.slug} value={topic.slug}>
                                {topic.name} ({topic.slug})
                              </SelectItem>
                            ))}
                          </>
                        )}
                        {formData.platform === 'LEETCODE' && formData.difficulty === 'MEDIUM' && (
                          <>
                            {ALL_TOPICS.LEETCODE.MEDIUM.map(topic => (
                              <SelectItem key={topic.slug} value={topic.slug}>
                                {topic.name} ({topic.slug})
                              </SelectItem>
                            ))}
                          </>
                        )}
                        {formData.platform === 'LEETCODE' && formData.difficulty === 'HARD' && (
                          <>
                            {ALL_TOPICS.LEETCODE.HARD.map(topic => (
                              <SelectItem key={topic.slug} value={topic.slug}>
                                {topic.name} ({topic.slug})
                              </SelectItem>
                            ))}
                          </>
                        )}
                        {formData.platform === 'GEEKSFORGEEKS' && formData.difficulty === 'EASY' && (
                          <>
                            {ALL_TOPICS.GEEKSFORGEEKS.EASY.map(topic => (
                              <SelectItem key={topic.slug} value={topic.slug}>
                                {topic.name} ({topic.slug})
                              </SelectItem>
                            ))}
                          </>
                        )}
                        {formData.platform === 'GEEKSFORGEEKS' && formData.difficulty === 'MEDIUM' && (
                          <>
                            {ALL_TOPICS.GEEKSFORGEEKS.MEDIUM.map(topic => (
                              <SelectItem key={topic.slug} value={topic.slug}>
                                {topic.name} ({topic.slug})
                              </SelectItem>
                            ))}
                          </>
                        )}
                        {formData.platform === 'GEEKSFORGEEKS' && formData.difficulty === 'HARD' && (
                          <>
                            {ALL_TOPICS.GEEKSFORGEEKS.HARD.map(topic => (
                              <SelectItem key={topic.slug} value={topic.slug}>
                                {topic.name} ({topic.slug})
                              </SelectItem>
                            ))}
                          </>
                        )}
                        {(formData.platform === 'CODEFORCES' || formData.platform === 'HACKERRANK') && (
                          <SelectItem value="" disabled>
                            Topic selection only available for LeetCode and GeeksforGeeks
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      This question will appear in the <span className="font-semibold">{formData.platform}</span> - <span className="font-semibold">{formData.difficulty}</span> sheet under the selected topic
                    </p>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="url">Problem URL *</Label>
                    <Input id="url" type="url" value={formData.url} onChange={e => setFormData({ ...formData, url: e.target.value })} required />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="likes">Likes</Label>
                      <Input id="likes" type="number" value={formData.likes} onChange={e => setFormData({ ...formData, likes: e.target.value })} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="dislikes">Dislikes</Label>
                      <Input id="dislikes" type="number" value={formData.dislikes} onChange={e => setFormData({ ...formData, dislikes: e.target.value })} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="acceptanceRate">Acceptance %</Label>
                      <Input id="acceptanceRate" type="number" value={formData.acceptanceRate} onChange={e => setFormData({ ...formData, acceptanceRate: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="accepted">Accepted</Label>
                      <Input id="accepted" type="number" value={formData.accepted} onChange={e => setFormData({ ...formData, accepted: e.target.value })} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="submissions">Submissions</Label>
                      <Input id="submissions" type="number" value={formData.submissions} onChange={e => setFormData({ ...formData, submissions: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="topicTags">Additional Topic Tags (comma-separated, optional)</Label>
                    <Textarea id="topicTags" value={formData.topicTags} onChange={e => setFormData({ ...formData, topicTags: e.target.value })} placeholder="e.g., hash-table, sorting, two-pointers" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="companyTags">Company Tags (comma-separated, optional)</Label>
                    <Textarea id="companyTags" value={formData.companyTags} onChange={e => setFormData({ ...formData, companyTags: e.target.value })} placeholder="e.g., Google, Amazon, Microsoft" />
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="isPremium" checked={formData.isPremium} onChange={e => setFormData({ ...formData, isPremium: e.target.checked })} className="h-4 w-4" />
                    <Label htmlFor="isPremium">Premium Problem</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</>) :
                      editingProblem ? 'Update Problem' : 'Create Problem'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      {error && (<Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>)}
      {success && (<Alert className="mb-4 border-green-500 bg-green-500/10">
        <CheckCircle className="h-4 w-4 text-green-500" />
        <AlertDescription className="text-green-500">{success}</AlertDescription>
      </Alert>)}
    
      {/* Search and Filters */}
      <Card className="mb-4">
        <CardContent className="pt-6">
          <div className="grid gap-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search problems by title, slug, or topics..." 
                value={searchQuery} 
                onChange={e => setSearchQuery(e.target.value)} 
                className="pl-10" 
              />
            </div>
            
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Platform Filter */}
              <div className="grid gap-2">
                <Label>Platform</Label>
                <Select value={platformFilter} onValueChange={setPlatformFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Platforms" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Platforms</SelectItem>
                    <SelectItem value="LEETCODE">LeetCode</SelectItem>
                    <SelectItem value="GEEKSFORGEEKS">GeeksforGeeks</SelectItem>
                    <SelectItem value="CODEFORCES">Codeforces</SelectItem>
                    <SelectItem value="HACKERRANK">HackerRank</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Topic Filter */}
              <div className="grid gap-2">
                <Label>Topic</Label>
                <Select value={topicFilter} onValueChange={setTopicFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Topics" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    <SelectItem value="ALL">All Topics</SelectItem>
                    
                    {/* Common Topics (LeetCode + GFG) */}
                    <SelectItem value="array">Arrays</SelectItem>
                    <SelectItem value="string">Strings</SelectItem>
                    <SelectItem value="linked-list">Linked Lists</SelectItem>
                    <SelectItem value="stack">Stacks & Queues</SelectItem>
                    <SelectItem value="dynamic-programming">Dynamic Programming</SelectItem>
                    
                    {/* LeetCode Only Topics */}
                    <SelectItem value="hash-table">Hash Table</SelectItem>
                    <SelectItem value="tree">Trees</SelectItem>
                    <SelectItem value="graph">Graphs</SelectItem>
                    <SelectItem value="two-pointers">Two Pointers</SelectItem>
                    <SelectItem value="binary-search">Binary Search</SelectItem>
                    <SelectItem value="greedy">Greedy</SelectItem>
                    <SelectItem value="bit-manipulation">Bit Manipulation</SelectItem>
                    <SelectItem value="heap">Heap</SelectItem>
                    <SelectItem value="sorting">Sorting</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Active Filters Display */}
            {(platformFilter !== 'ALL' || topicFilter !== 'ALL') && (
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-sm text-muted-foreground">Active Filters:</span>
                {platformFilter !== 'ALL' && (
                  <Badge variant="secondary" className="gap-1">
                    Platform: {platformFilter}
                    <button onClick={() => setPlatformFilter('ALL')} className="ml-1 hover:bg-destructive/20 rounded-full">
                      ×
                    </button>
                  </Badge>
                )}
                {topicFilter !== 'ALL' && (
                  <Badge variant="secondary" className="gap-1">
                    Topic: {topicFilter}
                    <button onClick={() => setTopicFilter('ALL')} className="ml-1 hover:bg-destructive/20 rounded-full">
                      ×
                    </button>
                  </Badge>
                )}
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => { setPlatformFilter('ALL'); setTopicFilter('ALL'); }}
                >
                  Clear All
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Visible Questions Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-green-500" />
            Visible to Users ({displayedProblems.filter(p => p.isVisibleToUsers).length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Difficulty</TableHead>
                <TableHead>Platform</TableHead>
                <TableHead>Topics</TableHead>
                <TableHead>Stats</TableHead>
                <TableHead>Visibility</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedProblems.filter(p => p.isVisibleToUsers).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <p className="text-muted-foreground">No visible problems yet</p>
                  </TableCell>
                </TableRow>
              ) : (
                displayedProblems.filter(p => p.isVisibleToUsers).map(problem => (
                  <TableRow key={problem.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{problem.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {problem.slug}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getDifficultyColor(problem.difficulty)}>
                        {problem.difficulty}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{problem.platform}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {/* Primary DSA Sheet Topic */}
                        {problem.topicSlugs && problem.topicSlugs.length > 0 && (
                          <Badge className="bg-primary text-primary-foreground border-primary">
                            📌 {problem.topicSlugs[0]}
                          </Badge>
                        )}
                        {/* Additional tags */}
                        {(problem.topicTags ?? []).slice(0, 1).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                        ))}
                        {(problem.topicTags ?? []).length > 1 && (
                          <span className="text-xs text-muted-foreground">
                            +{(problem.topicTags ?? []).length - 1}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>👍 {problem.likes}</p>
                        <p className="text-muted-foreground">{problem.acceptanceRate}%</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleToggleSingleVisibility(problem.id, problem.isVisibleToUsers)}
                        disabled={toggleLoading === String(problem.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {toggleLoading === String(problem.id) ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Eye className="h-4 w-4 mr-1" />
                            Visible
                          </>
                        )}
                      </Button>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="ghost"
                          onClick={() => window.open(problem.url, '_blank')}>
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost"
                          onClick={() => handleEdit(problem)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost"
                          onClick={() => handleDelete(problem.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Hidden Questions Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <EyeOff className="h-5 w-5 text-gray-500" />
            Hidden from Users ({displayedProblems.filter(p => !p.isVisibleToUsers).length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Difficulty</TableHead>
                <TableHead>Platform</TableHead>
                <TableHead>Topics</TableHead>
                <TableHead>Stats</TableHead>
                <TableHead>Visibility</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedProblems.filter(p => !p.isVisibleToUsers).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <p className="text-muted-foreground">All problems are visible</p>
                  </TableCell>
                </TableRow>
              ) : (
                displayedProblems.filter(p => !p.isVisibleToUsers).map(problem => (
                  <TableRow key={problem.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{problem.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {problem.slug}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getDifficultyColor(problem.difficulty)}>
                        {problem.difficulty}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{problem.platform}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {/* Primary DSA Sheet Topic */}
                        {problem.topicSlugs && problem.topicSlugs.length > 0 && (
                          <Badge className="bg-primary text-primary-foreground border-primary">
                            📌 {problem.topicSlugs[0]}
                          </Badge>
                        )}
                        {/* Additional tags */}
                        {(problem.topicTags ?? []).slice(0, 1).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                        ))}
                        {(problem.topicTags ?? []).length > 1 && (
                          <span className="text-xs text-muted-foreground">
                            +{(problem.topicTags ?? []).length - 1}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>👍 {problem.likes}</p>
                        <p className="text-muted-foreground">{problem.acceptanceRate}%</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleSingleVisibility(problem.id, problem.isVisibleToUsers)}
                        disabled={toggleLoading === String(problem.id)}
                      >
                        {toggleLoading === String(problem.id) ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <EyeOff className="h-4 w-4 mr-1" />
                            Hidden
                          </>
                        )}
                      </Button>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="ghost"
                          onClick={() => window.open(problem.url, '_blank')}>
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost"
                          onClick={() => handleEdit(problem)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost"
                          onClick={() => handleDelete(problem.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
              {loadingMore && (
                <TableRow>
                  <TableCell colSpan={7} className="py-4 text-center">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <div ref={observerTarget} className="h-4"/>
          {!hasMore && displayedProblems.length > 0 && (
            <div className="text-center py-2 text-muted-foreground text-xs">
              End of list reached
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
