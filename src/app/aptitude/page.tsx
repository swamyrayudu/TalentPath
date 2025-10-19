'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Filter, ChevronRight, ArrowLeft, Loader2 } from 'lucide-react';

// Dummy for topic platforms/tabs. Replace/add to your real platforms!
const PLATFORMS = [

  { value: 'INDIABIX', label: 'IndiaBIX', color: 'text-amber-600 border-amber-600', gradient: 'from-yellow-400 to-amber-600' },
];

export default function AptitudePage({}) {
  const [topics, setTopics] = useState<string[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState(PLATFORMS[0].value);

  useEffect(() => {
    fetch('/api/aptitude')
      .then(res => res.json())
      .then(data => {
        if (data.success) setTopics(data.topics);
      });
  }, []);

  useEffect(() => {
    if (!selectedTopic) return;
    setLoading(true);
    fetch(`/api/aptitude?topic=${selectedTopic}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setQuestions(data.questions);
        setLoading(false);
      });
  }, [selectedTopic]);

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      {/* Top nav/tabs & breadcrumb */}
      <div className="flex items-center gap-4 mb-6 flex-wrap">
        <Button
          variant="ghost"
          className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          onClick={() => {
            setSelectedTopic(null);
            setQuestions([]);
          }}
        >
          <ArrowLeft className="h-4 w-4" /> Back to Topics
        </Button>
 
      </div>

      {/* Title with gradient and stats/description */}
      <div className="flex items-center gap-4 mb-2">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent capitalize">
          Aptitude - {selectedTopic ? selectedTopic : "Topics"}
        </h1>
      </div>
      {selectedTopic && (
        <p className="text-muted-foreground mb-6">
          {questions.length} problems found
        </p>
      )}

      {/* Platform Tabs */}
      <div className="mb-6">
        <div className="border-b border-border">
          <div className="flex gap-1">
            {PLATFORMS.map(platform => (
              <button
                key={platform.value}
                onClick={() => setSelectedPlatform(platform.value)}
                className={`relative px-6 py-3 font-semibold transition-all duration-200 border-b-2 ${
                  selectedPlatform === platform.value
                    ? `${platform.color} border-b-2`
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }`}
              >
                <span>{platform.label}</span>
                {selectedPlatform === platform.value && (
                  <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${platform.gradient}`} />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Topics list */}
      {!selectedTopic && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {topics.length === 0 ? (
            <Card className="col-span-full text-center">
              <CardContent>No topics available</CardContent>
            </Card>
          ) : (
            topics.map(topic => (
              <Card
                key={topic}
                className="cursor-pointer hover:shadow-lg  hover:text-yellow-400 transition-shadow"
                onClick={() => setSelectedTopic(topic)}
              >
                <CardHeader>
                  <CardTitle className="text-lg">{topic}</CardTitle>
                  <CardDescription>Practice questions for this topic</CardDescription>
                </CardHeader>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Loader */}
      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 className="w-10 h-10 animate-spin text-amber-600" />
        </div>
      )}

      {/* Questions */}
      {selectedTopic && !loading && (
        <div className="space-y-6">
          {questions.length === 0 ? (
            <Card>
              <CardContent className="text-center text-muted-foreground">
                No questions found for this topic.
              </CardContent>
            </Card>
          ) : (
            questions.map((q, qi) => (
              <Card key={q.s_no ?? q.id ?? qi}>
                <CardContent>
                  <CardTitle className="mb-3">{q.question}</CardTitle>
                  <Separator className="mb-4" />
                  {['option_a', 'option_b', 'option_c', 'option_d'].map((optKey, idx) => {
                    const optValue = q[optKey];
                    if (!optValue) return null;
                    return (
                      <div
                        key={optKey}
                        className="mb-2 rounded-md border border-muted p-2 cursor-pointer hover:bg-accent/50"
                      >
                        <Badge className="mr-2">{String.fromCharCode(65 + idx)}</Badge>
                        {optValue}
                      </div>
                    );
                  })}
                  <details className="mt-3">
                    <summary className="cursor-pointer font-semibold text-amber-600 hover:underline">
                      View Explanation
                    </summary>
                    <p className="mt-2 text-muted-foreground">{q.explanation}</p>
                  </details>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
