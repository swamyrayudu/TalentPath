'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Eye, EyeOff, CheckCircle, AlertCircle, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type VisibilityStats = {
  difficulty: string;
  platform: string;
  total: number;
  visible: number;
  hidden: number;
};

const DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD'];
const PLATFORMS = ['LEETCODE', 'GEEKSFORGEEKS', 'CODEFORCES', 'HACKERRANK'];
const TOPICS = [
  'Array', 'String', 'Linked List', 'Stack', 'Queue', 'Hash Table',
  'Tree', 'Binary Tree', 'Graph', 'Sorting', 'Binary Search',
  'Two Pointers', 'Dynamic Programming', 'Greedy', 'Backtracking',
  'Sliding Window', 'Heap', 'Trie', 'Recursion', 'Math'
];

export default function DSAVisibilityManager() {
  const [stats, setStats] = useState<VisibilityStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const [filters, setFilters] = useState({
    difficulty: 'all',
    platform: 'all',
    topic: 'all',
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/problems/bulk-visibility');
      const data = await response.json();

      if (data.success) {
        setStats(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch stats');
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to load visibility statistics');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkUpdate = async (action: 'show' | 'hide') => {
    const activeFilters: { [key: string]: string } = {};

    if (filters.difficulty !== 'all') activeFilters.difficulty = filters.difficulty;
    if (filters.platform !== 'all') activeFilters.platform = filters.platform;
    if (filters.topic !== 'all') activeFilters.topic = filters.topic;

    if (Object.keys(activeFilters).length === 0) {
      toast.error('Please select at least one filter');
      return;
    }

    const confirmMessage = `Are you sure you want to ${action} all problems matching:\n${Object.entries(activeFilters)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n')}`;

    if (!confirm(confirmMessage)) return;

    try {
      setUpdating(true);

      const response = await fetch('/api/admin/problems/bulk-visibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          filters: activeFilters,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
        fetchStats(); // Refresh stats
      } else {
        throw new Error(data.error || 'Failed to update visibility');
      }
    } catch (error) {
      console.error('Error updating visibility:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update visibility');
    } finally {
      setUpdating(false);
    }
  };

  const totalStats = stats.reduce(
    (acc, stat) => ({
      total: acc.total + stat.total,
      visible: acc.visible + stat.visible,
      hidden: acc.hidden + stat.hidden,
    }),
    { total: 0, visible: 0, hidden: 0 }
  );

  const visibilityPercentage =
    totalStats.total > 0 ? Math.round((totalStats.visible / totalStats.total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-2">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Problems</p>
                <p className="text-3xl font-bold">{totalStats.total}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-500/20 bg-green-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Visible</p>
                <p className="text-3xl font-bold text-green-600">{totalStats.visible}</p>
                <p className="text-xs text-muted-foreground mt-1">{visibilityPercentage}% of total</p>
              </div>
              <Eye className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-red-500/20 bg-red-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Hidden</p>
                <p className="text-3xl font-bold text-red-600">{totalStats.hidden}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {100 - visibilityPercentage}% of total
                </p>
              </div>
              <EyeOff className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bulk Actions */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle>Bulk Visibility Control</CardTitle>
          <CardDescription>
            Select filters to show or hide multiple problems at once
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Difficulty</label>
              <Select value={filters.difficulty} onValueChange={(val) => setFilters({ ...filters, difficulty: val })}>
                <SelectTrigger className="border-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Difficulties</SelectItem>
                  {DIFFICULTIES.map((diff) => (
                    <SelectItem key={diff} value={diff}>
                      {diff}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Platform</label>
              <Select value={filters.platform} onValueChange={(val) => setFilters({ ...filters, platform: val })}>
                <SelectTrigger className="border-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Platforms</SelectItem>
                  {PLATFORMS.map((plat) => (
                    <SelectItem key={plat} value={plat}>
                      {plat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Topic</label>
              <Select value={filters.topic} onValueChange={(val) => setFilters({ ...filters, topic: val })}>
                <SelectTrigger className="border-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Topics</SelectItem>
                  {TOPICS.map((topic) => (
                    <SelectItem key={topic} value={topic}>
                      {topic}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={() => handleBulkUpdate('show')}
              disabled={updating || loading}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {updating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Eye className="mr-2 h-4 w-4" />
              )}
              Show Matching Problems
            </Button>

            <Button
              onClick={() => handleBulkUpdate('hide')}
              disabled={updating || loading}
              variant="destructive"
              className="flex-1"
            >
              {updating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <EyeOff className="mr-2 h-4 w-4" />
              )}
              Hide Matching Problems
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Table */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle>Visibility Statistics by Category</CardTitle>
          <CardDescription>Overview of problem visibility across difficulties and platforms</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-2">
              {stats.map((stat, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-4 rounded-lg border-2 bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <Badge
                      className={cn(
                        'font-medium',
                        stat.difficulty === 'EASY' && 'bg-green-500',
                        stat.difficulty === 'MEDIUM' && 'bg-amber-500',
                        stat.difficulty === 'HARD' && 'bg-red-500'
                      )}
                    >
                      {stat.difficulty}
                    </Badge>
                    <Badge variant="outline">{stat.platform}</Badge>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Total</p>
                      <p className="text-lg font-bold">{stat.total}</p>
                    </div>

                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Visible</p>
                      <p className="text-lg font-bold text-green-600">{stat.visible}</p>
                    </div>

                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Hidden</p>
                      <p className="text-lg font-bold text-red-600">{stat.hidden}</p>
                    </div>

                    <div className="text-center min-w-[100px]">
                      <div className="w-full bg-muted rounded-full h-2.5">
                        <div
                          className="bg-green-600 h-2.5 rounded-full transition-all"
                          style={{
                            width: `${stat.total > 0 ? (stat.visible / stat.total) * 100 : 0}%`,
                          }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {stat.total > 0 ? Math.round((stat.visible / stat.total) * 100) : 0}% visible
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="border-2 border-amber-500/20 bg-amber-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            onClick={() => {
              if (confirm('Show ALL problems to users?')) {
                fetch('/api/admin/problems/bulk-visibility', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ action: 'show', filters: {} }),
                })
                  .then((res) => res.json())
                  .then((data) => {
                    if (data.success) {
                      toast.success(data.message);
                      fetchStats();
                    }
                  });
              }
            }}
            variant="outline"
            className="w-full"
            disabled={updating}
          >
            <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
            Show All Problems
          </Button>

          <Button
            onClick={() => {
              if (confirm('Hide ALL problems from users?')) {
                fetch('/api/admin/problems/bulk-visibility', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ action: 'hide', filters: {} }),
                })
                  .then((res) => res.json())
                  .then((data) => {
                    if (data.success) {
                      toast.success(data.message);
                      fetchStats();
                    }
                  });
              }
            }}
            variant="outline"
            className="w-full"
            disabled={updating}
          >
            <EyeOff className="mr-2 h-4 w-4 text-red-600" />
            Hide All Problems
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
