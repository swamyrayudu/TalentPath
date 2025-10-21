'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Loader2, CheckCircle2, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

const PLATFORMS = [
  { value: 'INDIABIX', label: 'IndiaBIX', color: 'text-amber-600 border-amber-600', gradient: 'from-yellow-400 to-amber-600' },
];

const QUESTIONS_PER_PAGE = 5;

export default function AptitudePage() {
  const [topics, setTopics] = useState<string[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState(PLATFORMS[0].value);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

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
    setSubmitted(false);
    setUserAnswers({});
    setScore(0);
    setCurrentPage(1);
    fetch(`/api/aptitude?topic=${selectedTopic}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setQuestions(data.questions);
        setLoading(false);
      });
  }, [selectedTopic]);

  const handleOptionSelect = (questionIndex: number, optionValue: string) => {
    if (submitted) return;
    setUserAnswers(prev => ({
      ...prev,
      [questionIndex]: optionValue
    }));
  };

  const handleSubmit = async () => {
    if (Object.keys(userAnswers).length !== questions.length) {
      toast.error('Please answer all questions before submitting!');
      return;
    }

    let correctCount = 0;
    questions.forEach((q, idx) => {
      if (userAnswers[idx] === q.answer) {
        correctCount++;
      }
    });

    const scorePercentage = Math.round((correctCount / questions.length) * 100);

    setScore(correctCount);
    setSubmitted(true);
    setCurrentPage(1); // Reset to first page on submission
    
    toast.success(`Quiz submitted! You scored ${correctCount} out of ${questions.length}`);

    // Save result to database
    try {
      const response = await fetch('/api/aptitude/results', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: selectedTopic,
          totalQuestions: questions.length,
          correctAnswers: correctCount,
          score: scorePercentage,
          answers: userAnswers,
        }),
      });

      const data = await response.json();
      if (data.success) {
        console.log('Result saved successfully');
      }
    } catch (error) {
      console.error('Error saving result:', error);
    }
  };

  const isCorrect = (questionIndex: number) => {
    if (!submitted) return null;
    return userAnswers[questionIndex] === questions[questionIndex].answer;
  };

  // Pagination logic
  const totalPages = Math.ceil(questions.length / QUESTIONS_PER_PAGE);
  const startIndex = (currentPage - 1) * QUESTIONS_PER_PAGE;
  const endIndex = startIndex + QUESTIONS_PER_PAGE;
  const currentQuestions = questions.slice(startIndex, endIndex);
  const isLastPage = currentPage === totalPages;
  const isFirstPage = currentPage === 1;

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Top nav - only show on questions page */}
      {selectedTopic && (
        <div className="flex items-center gap-4 mb-6 flex-wrap">
          <Button
            variant="ghost"
            className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            onClick={() => {
              setSelectedTopic(null);
              setQuestions([]);
              setUserAnswers({});
              setSubmitted(false);
              setScore(0);
              setCurrentPage(1);
            }}
          >
            <ArrowLeft className="h-4 w-4" /> Back to Topics
          </Button>
        </div>
      )}

      {/* Title with gradient and stats/description */}
      <div className="flex items-center gap-4 mb-2">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent capitalize">
          Aptitude - {selectedTopic ? selectedTopic : 'Topics'}
        </h1>
      </div>
      {selectedTopic && (
        <div className="flex items-center justify-between mb-6">
          <p className="text-muted-foreground">{questions.length} problems found</p>
          {submitted && (
            <Badge variant="default" className="text-lg px-4 py-2">
              Score: {score}/{questions.length}
            </Badge>
          )}
        </div>
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
                className="cursor-pointer hover:shadow-lg hover:text-yellow-400 transition-shadow"
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
            <>
              {/* Pagination Info */}
              <div className="flex justify-between items-center mb-4">

              </div>

              {currentQuestions.map((q, qi) => {
                const actualIndex = startIndex + qi;
                return (
                  <Card key={q.s_no ?? q.id ?? actualIndex} className={submitted ? (isCorrect(actualIndex) ? 'border-green-500' : 'border-red-500') : ''}>
                    <CardContent>
                      <div className="flex items-start justify-between">
                        <CardTitle className="mb-3 text-lg">
                          {actualIndex + 1}. {q.question}
                        </CardTitle>
                        {submitted && (
                          isCorrect(actualIndex) ? (
                            <CheckCircle2 className="h-6 w-6 text-green-500" />
                          ) : (
                            <XCircle className="h-6 w-6 text-red-500" />
                          )
                        )}
                      </div>
                      <Separator className="mb-4" />
                      {['option_a', 'option_b', 'option_c', 'option_d'].map((optKey, idx) => {
                        const optValue = q[optKey];
                        if (!optValue) return null;

                        const isSelected = userAnswers[actualIndex] === optValue;
                        const isCorrectOption = submitted && optValue === q.answer;
                        const isWrongSelection = submitted && isSelected && !isCorrectOption;

                        return (
                          <div
                            key={optKey}
                            onClick={() => handleOptionSelect(actualIndex, optValue)}
                            className={`mb-2 rounded-md border p-2 cursor-pointer transition-colors ${
                              isSelected && !submitted
                                ? 'bg-amber-100 border-amber-500 dark:bg-amber-950'
                                : isCorrectOption
                                ? 'bg-green-100 border-green-500 dark:bg-green-950'
                                : isWrongSelection
                                ? 'bg-red-100 border-red-500 dark:bg-red-950'
                                : 'border-muted hover:bg-accent/50'
                            }`}
                          >
                            <Badge className="mr-2">{String.fromCharCode(65 + idx)}</Badge>
                            {optValue}
                            {isCorrectOption && <Badge className="ml-2 bg-green-600">Correct</Badge>}
                          </div>
                        );
                      })}
                      {submitted && (
                        <details className="mt-3">
                          <summary className="cursor-pointer font-semibold text-amber-600 hover:underline">
                            View Explanation
                          </summary>
                          <p className="mt-2 text-muted-foreground">{q.explanation}</p>
                        </details>
                      )}
                    </CardContent>
                  </Card>
                );
              })}

              {/* Pagination Controls */}
              <div className="flex justify-between items-center mt-6">
                {/* Previous Button - Hidden on first page */}
                {!isFirstPage && (
                  <Button
                    variant="outline"
                    onClick={goToPreviousPage}
                    className="flex items-center gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                )}

                {/* Spacer if first page */}
                {isFirstPage && <div></div>}

                <div className="flex gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <Button
                      key={page}
                      variant={currentPage === page ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setCurrentPage(page);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                    >
                      {page}
                    </Button>
                  ))}
                </div>

                {/* Next Button - Hidden on last page */}
                {!isLastPage && (
                  <Button
                    variant="outline"
                    onClick={goToNextPage}
                    className="flex items-center gap-2"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                )}

                {/* Spacer if last page */}
                {isLastPage && <div></div>}
              </div>

              {/* Submit Button - Only show on last page and when not submitted */}
              {!submitted && isLastPage && (
                <div className="mt-8 flex justify-end">
                  <Button
                    onClick={handleSubmit}
                    className="mt-4"
                    size="lg"
                    disabled={Object.keys(userAnswers).length !== questions.length}
                  >
                    Submit Quiz ({Object.keys(userAnswers).length}/{questions.length} answered)
                  </Button>
                </div>
              )}

              {submitted && (
                <Card className="border-2 border-primary mt-6">
                  <CardContent className="text-center py-6">
                    <h2 className="text-2xl font-bold mb-2">Quiz Completed!</h2>
                    <p className="text-lg">
                      Your Score: <span className="font-bold text-primary">{score}/{questions.length}</span>
                    </p>
                    <p className="text-muted-foreground mt-2">
                      Percentage: {((score / questions.length) * 100).toFixed(1)}%
                    </p>
                    <Button
                      onClick={() => {
                        setSelectedTopic(null);
                        setQuestions([]);
                        setUserAnswers({});
                        setSubmitted(false);
                        setScore(0);
                        setCurrentPage(1);
                      }}
                      className="mt-4"
                    >
                      Try Another Topic
                    </Button>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}