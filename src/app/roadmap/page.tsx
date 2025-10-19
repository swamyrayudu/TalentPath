'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ChevronRight } from 'lucide-react';
import { Loader2 } from 'lucide-react';

const difficultyColors: Record<string, string> = {
  beginner: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  intermediate: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  advanced: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

export default function AptitudePage() {
  const [topics, setTopics] = useState<string[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

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
      })
      .finally(() => setLoading(false));
  }, [selectedTopic]);

  return (
    <div className="container mx-auto py-8 px-4 max-w-8xl">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold">Aptitude Preparation</h1>
        <p className="text-muted-foreground mt-2">
          Choose a topic to start practicing aptitude questions.
        </p>
      </header>

      {!selectedTopic ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {topics.length === 0 ? (
            <Card className="col-span-full text-center">
              <CardContent>No topics available</CardContent>
            </Card>
          ) : (
            topics.map(topic => (
              <Card
                key={topic}
                className="cursor-pointer hover:shadow-lg transition-shadow"
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
      ) : (
        <>
          <Button
            variant="outline"
            className="mb-6 flex items-center gap-2"
            onClick={() => {
              setSelectedTopic(null);
              setQuestions([]);
            }}
          >
            <ChevronRight className="rotate-180 w-4 h-4" />
            Back to Topics
          </Button>

          {loading ? (
<div className="flex items-center justify-center h-screen w-screen">
  <Loader2 className="w-10 h-10 animate-spin text-amber-600" />
</div>

          ) : (
            <div className="space-y-6">
              {questions.length === 0 ? (
                <Card>
                  <CardContent className="text-center text-muted-foreground">
                    No questions found for this topic.
                  </CardContent>
                </Card>
              ) : (
                questions.map(q => (
                  <Card key={q.id}>
                    <CardContent>
                      <CardTitle className="mb-3">{q.question}</CardTitle>
                      <Separator className="mb-4" />
                      {['option_a', 'option_b', 'option_c', 'option_d'].map((optKey, idx) => {
                        const optValue = q[optKey];
                        if (!optValue) return null;
                        return (
                          <div
                            key={optKey}
                            className={`mb-2 rounded-md border p-2 cursor-pointer hover:bg-amber-50 border-amber-300`}
                          >
                            <Badge className={`mr-2 ${difficultyColors['beginner']}`}>
                              {String.fromCharCode(65 + idx)}
                            </Badge>
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
        </>
      )}
    </div>
  );
}
