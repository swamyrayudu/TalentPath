'use client';

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
import { Plus, Edit, Trash2, Search, Download, AlertCircle, CheckCircle, Loader2, ExternalLink, Eye, EyeOff, ChevronDown } from 'lucide-react';
import { useAdminProblemsCache } from '@/components/context/AdminProblemsCacheContext';

interface Problem {
  id: number;
  title: string;
  slug: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  platform: 'LEETCODE' | 'CODEFORCES' | 'HACKERRANK' | 'GEEKSFORGEEKS';
  likes: number;
  dislikes: number;
  acceptanceRate: string;
  url: string;
  topicTags: string[];
  companyTags: string[];
  mainTopics: string[];
  topicSlugs: string[];
  accepted: number;
  submissions: number;
  isPremium: boolean;
  isVisibleToUsers: boolean;
}
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
}
const ITEMS_PER_PAGE = 50;

export default function AdminProblemsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { allProblems, setAllProblems } = useAdminProblemsCache();

  const [displayedProblems, setDisplayedProblems] = useState<Problem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState<boolean>(allProblems.length === 0);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProblem, setEditingProblem] = useState<Problem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [toggleLoading, setToggleLoading] = useState<number | null>(null); // Track which problem is being toggled

  const observerTarget = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState<ProblemFormData>({
    title: '', slug: '', difficulty: 'EASY', platform: 'LEETCODE',
    likes: '0', dislikes: '0', acceptanceRate: '0', url: '',
    topicTags: '', companyTags: '', mainTopics: '', topicSlugs: '',
    accepted: '0', submissions: '0', isPremium: false
  });

  useEffect(() => {
    if (status === 'loading') return;
    if (!session?.user) { router.push('/auth/signin'); return; }
    if ((session.user as any).role !== 'admin') { router.push('/dashboard'); return; }
    if (allProblems.length === 0) fetchProblems();
    else setLoading(false);
    // eslint-disable-next-line
  }, [status, session, router]);

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
    // eslint-disable-next-line
  }, [allProblems, searchQuery]);

  const fetchProblems = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/problems?limit=10000');
      const data = await response.json();
      if (data.success) setAllProblems(data.data);
      else setError(data.error || 'Failed to fetch problems');
    } catch (error) {
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
  }, [page, loadingMore, hasMore, allProblems, searchQuery]);

  const getFilteredProblems = () => {
    if (searchQuery.trim() === '') return allProblems;
    return allProblems.filter(
      (p: Problem) =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.topicTags.some(tag =>
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        )
    );
  };

  // -------------- CRUD Handlers ----------------
  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
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
        mainTopics: formData.mainTopics.split(',').map(t => t.trim()).filter(Boolean),
        topicSlugs: formData.topicSlugs.split(',').map(t => t.trim()).filter(Boolean),
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
    setFormData({
      title: problem.title,
      slug: problem.slug,
      difficulty: problem.difficulty,
      platform: problem.platform,
      likes: problem.likes.toString(),
      dislikes: problem.dislikes.toString(),
      acceptanceRate: problem.acceptanceRate,
      url: problem.url,
      topicTags: problem.topicTags.join(', '),
      companyTags: problem.companyTags.join(', '),
      mainTopics: problem.mainTopics.join(', '),
      topicSlugs: problem.topicSlugs.join(', '),
      accepted: problem.accepted.toString(),
      submissions: problem.submissions.toString(),
      isPremium: problem.isPremium,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this problem?')) return;
    try {
      const response = await fetch(`/api/problems/${id}`, { method: 'DELETE' });
      const data = await response.json();
      console.log('Delete Response:', data); // Debug log
      
      if (response.ok && data.success) {
        setSuccess('Problem deleted successfully!');
        setAllProblems(allProblems.filter(p => p.id !== id));
        setTimeout(() => setSuccess(''), 3000);
      } else {
        console.error('Delete Error:', data); // Debug log
        setError(data.error || 'Failed to delete problem');
      }
    } catch (error) {
      console.error('Delete Exception:', error); // Debug log
      setError('Failed to delete problem');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '', slug: '', difficulty: 'EASY', platform: 'LEETCODE',
      likes: '0', dislikes: '0', acceptanceRate: '0', url: '',
      topicTags: '', companyTags: '', mainTopics: '', topicSlugs: '',
      accepted: '0', submissions: '0', isPremium: false
    });
    setEditingProblem(null);
  };

  const handleExportCSV = () => {
    const csv = [
      [
        'title','slug','is_premium','difficulty','platform','likes','dislikes','acceptance_rate','url','topic_tags','company_tags','main_topics','topic_slugs','accepted','submissions'
      ].join(','),
      ...allProblems.map((p) =>
        [
          `"${p.title}"`, p.slug, p.isPremium, p.difficulty, p.platform, p.likes, p.dislikes, p.acceptanceRate, p.url,
          `"{${p.topicTags.join(',')}}"`,
          `"{${p.companyTags.join(',')}}"`,
          `"{${p.mainTopics.join(',')}}"`,
          `"{${p.topicSlugs.join(',')}}"`,
          p.accepted, p.submissions,
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

  const handleToggleSingleVisibility = async (problemId: number, currentVisibility: boolean) => {
    try {
      setToggleLoading(problemId);
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
          p.id === problemId ? { ...p, isVisibleToUsers: !currentVisibility } : p
        ));
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Failed to update visibility');
      }
    } catch (error) {
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
                    <Label htmlFor="topicTags">Topic Tags (comma-separated)</Label>
                    <Textarea id="topicTags" value={formData.topicTags} onChange={e => setFormData({ ...formData, topicTags: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="companyTags">Company Tags (comma-separated)</Label>
                    <Textarea id="companyTags" value={formData.companyTags} onChange={e => setFormData({ ...formData, companyTags: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="mainTopics">Main Topics (comma-separated)</Label>
                    <Textarea id="mainTopics" value={formData.mainTopics} onChange={e => setFormData({ ...formData, mainTopics: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="topicSlugs">Topic Slugs (comma-separated)</Label>
                    <Textarea id="topicSlugs" value={formData.topicSlugs} onChange={e => setFormData({ ...formData, topicSlugs: e.target.value })} />
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
    
      <Card className="mb-4"><CardContent className="pt-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search problems by title, slug, or topics..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
        </div>
      </CardContent></Card>

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
                        {problem.topicTags.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                        ))}
                        {problem.topicTags.length > 2 && (
                          <span className="text-xs text-muted-foreground">
                            +{problem.topicTags.length - 2}
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
                        disabled={toggleLoading === problem.id}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {toggleLoading === problem.id ? (
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
                        {problem.topicTags.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                        ))}
                        {problem.topicTags.length > 2 && (
                          <span className="text-xs text-muted-foreground">
                            +{problem.topicTags.length - 2}
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
                        disabled={toggleLoading === problem.id}
                      >
                        {toggleLoading === problem.id ? (
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
