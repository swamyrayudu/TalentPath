'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

const ITEMS_PER_PAGE = 20;

export default function TopicPage() {
  const params = useParams();
  const topicSlug = params.topic;

  const [problems, setProblems] = useState([]);
  const [displayedProblems, setDisplayedProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState('likes');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (!topicSlug) return;
    setLoading(true);
    fetch(`/api/problems?topic=${topicSlug}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          let filtered = data.data;
          filtered = sortProblems(filtered, sortKey);
          setProblems(filtered);
          setDisplayedProblems(filtered.slice(0, ITEMS_PER_PAGE));
          setHasMore(filtered.length > ITEMS_PER_PAGE);
          setPage(1);
        }
      })
      .finally(() => setLoading(false));
  }, [topicSlug, sortKey]);

  const sortProblems = (problems, key) => {
    switch(key) {
      case 'likes':
        return [...problems].sort((a,b) => b.likes - a.likes);
      case 'acceptance':
        return [...problems].sort((a,b) => parseFloat(b.acceptanceRate) - parseFloat(a.acceptanceRate));
      case 'title':
        return [...problems].sort((a,b) => a.title.localeCompare(b.title));
      default:
        return problems;
    }
  };

  const loadMore = () => {
    const nextPage = page + 1;
    const nextSlice = problems.slice(0, nextPage * ITEMS_PER_PAGE);
    setDisplayedProblems(nextSlice);
    setPage(nextPage);
    setHasMore(nextSlice.length < problems.length);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="border  rounded-md shadow-sm">
        <CardHeader className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <CardTitle className="text-xl font-semibold capitalize">{topicSlug?.replace(/-/g, ' ')} Problems</CardTitle>
          <div className="flex items-center gap-2">
            <label htmlFor="sort" className="text-sm font-medium text-gray-700">Sort by:</label>
            <select
              id="sort"
              value={sortKey}
              onChange={e => setSortKey(e.target.value)}
              className="border border-gray-300  rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="likes">Likes</option>
              <option value="acceptance">Acceptance Rate</option>
              <option value="title">Title</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {displayedProblems.length === 0 ? (
            <p className="text-center text-gray-500 mt-8 text-sm font-medium">No problems found for this topic.</p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {displayedProblems.map((problem) => (
                <li key={problem.id} className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center space-x-3">
                    <a
                      href={problem.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium  hover:underline"
                    >
                      {problem.title}
                    </a>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 mt-2 sm:mt-0">
                    <Badge className="text-xs uppercase">{problem.difficulty}</Badge>
                    <Badge variant="outline" className="text-xs uppercase">{problem.platform}</Badge>
                    <span className="text-xs text-gray-600">{problem.likes} Likes</span>
                    <span className="text-xs text-gray-600">{problem.acceptanceRate}% Acceptance</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {hasMore && (
            <div className="mt-6 flex justify-center">
              <Button onClick={loadMore} className="px-6 py-2 rounded-md">
                Load More
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
