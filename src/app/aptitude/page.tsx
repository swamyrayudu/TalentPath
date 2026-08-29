'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Search,
  ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';

interface Question {
  s_no?: number;
  id?: string;
  question: string;
  option_a?: string;
  option_b?: string;
  option_c?: string;
  option_d?: string;
  answer: string;
  explanation?: string;
  [key: string]: string | number | undefined;
}

interface AptitudeResultRow {
  id: string;
  topic: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  completedAt: string;
}

type TopicProgress = { attempts: number; best: number };

const QUESTIONS_PER_PAGE = 5;

/**
 * A few topic tables are misspelled in the database (the slug is the table
 * name, so it can't be renamed here). Override the display label only.
 */
const LABEL_OVERRIDES: Record<string, string> = {
  calender: 'Calendar',
  'boats-and-steams': 'Boats and Streams',
  probobility: 'Probability',
  'problems-on-hcf-and-lcm': 'Problems on HCF and LCM',
  'bankers-discount': "Banker's Discount",
};

const SMALL_WORDS = new Set(['and', 'or', 'on', 'of', 'the']);

function topicLabel(slug: string) {
  if (LABEL_OVERRIDES[slug]) return LABEL_OVERRIDES[slug];
  return slug
    .split('-')
    .map((word, i) =>
      i > 0 && SMALL_WORDS.has(word) ? word : word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(' ');
}

function scoreTone(score: number) {
  if (score >= 80) return 'text-emerald-600 dark:text-emerald-400';
  if (score >= 50) return 'text-amber-600 dark:text-amber-400';
  return 'text-rose-600 dark:text-rose-400';
}

export default function AptitudePage() {
  const [topics, setTopics] = useState<string[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [topicsLoading, setTopicsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [progress, setProgress] = useState<Record<string, TopicProgress>>({});

  useEffect(() => {
    setTopicsLoading(true);
    fetch('/api/aptitude')
      .then(res => res.json())
      .then(data => {
        if (data.success) setTopics(data.topics);
        setTopicsLoading(false);
      })
      .catch(() => setTopicsLoading(false));
  }, []);

  // Past results power the per-topic badges. Returns 401 when signed out —
  // in that case we simply show no progress.
  useEffect(() => {
    fetch('/api/aptitude/results')
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (!data?.success || !Array.isArray(data.results)) return;
        const map: Record<string, TopicProgress> = {};
        (data.results as AptitudeResultRow[]).forEach(r => {
          const existing = map[r.topic];
          map[r.topic] = {
            attempts: (existing?.attempts ?? 0) + 1,
            best: Math.max(existing?.best ?? 0, r.score),
          };
        });
        setProgress(map);
      })
      .catch(() => {});
  }, [submitted]);

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
      })
      .catch(() => setLoading(false));
  }, [selectedTopic]);

  const resetToTopics = () => {
    setSelectedTopic(null);
    setQuestions([]);
    setUserAnswers({});
    setSubmitted(false);
    setScore(0);
    setCurrentPage(1);
  };

  // Re-setting the same topic wouldn't re-run the fetch effect, so clear the
  // answer state directly and keep the already-loaded questions.
  const retryTopic = () => {
    setUserAnswers({});
    setSubmitted(false);
    setScore(0);
    setCurrentPage(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOptionSelect = (questionIndex: number, optionValue: string) => {
    if (submitted) return;
    setUserAnswers(prev => ({ ...prev, [questionIndex]: optionValue }));
  };

  const answeredCount = Object.keys(userAnswers).length;

  const firstUnansweredIndex = useMemo(() => {
    for (let i = 0; i < questions.length; i++) {
      if (userAnswers[i] === undefined) return i;
    }
    return -1;
  }, [questions.length, userAnswers]);

  const handleSubmit = async () => {
    if (answeredCount !== questions.length) {
      const target = firstUnansweredIndex;
      toast.error(
        `${questions.length - answeredCount} question${
          questions.length - answeredCount === 1 ? '' : 's'
        } still unanswered.`
      );
      if (target >= 0) {
        setCurrentPage(Math.floor(target / QUESTIONS_PER_PAGE) + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }

    let correctCount = 0;
    questions.forEach((q, idx) => {
      if (userAnswers[idx] === q.answer) correctCount++;
    });

    const scorePercentage = Math.round((correctCount / questions.length) * 100);

    setScore(correctCount);
    setSubmitted(true);
    setCurrentPage(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    toast.success(`Scored ${correctCount} out of ${questions.length}`);

    try {
      await fetch('/api/aptitude/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: selectedTopic,
          totalQuestions: questions.length,
          correctAnswers: correctCount,
          score: scorePercentage,
          answers: userAnswers,
        }),
      });
    } catch (error) {
      console.error('Error saving result:', error);
    }
  };

  const isCorrect = (questionIndex: number) =>
    submitted ? userAnswers[questionIndex] === questions[questionIndex].answer : null;

  const totalPages = Math.ceil(questions.length / QUESTIONS_PER_PAGE);
  const startIndex = (currentPage - 1) * QUESTIONS_PER_PAGE;
  const currentQuestions = questions.slice(startIndex, startIndex + QUESTIONS_PER_PAGE);

  const goToPage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const pageHasUnanswered = (page: number) => {
    if (submitted) return false;
    const from = (page - 1) * QUESTIONS_PER_PAGE;
    const to = Math.min(from + QUESTIONS_PER_PAGE, questions.length);
    for (let i = from; i < to; i++) {
      if (userAnswers[i] === undefined) return true;
    }
    return false;
  };

  const filteredTopics = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return topics;
    return topics.filter(
      t => t.replace(/-/g, ' ').includes(q) || topicLabel(t).toLowerCase().includes(q)
    );
  }, [topics, search]);

  /* ── Topic picker ─────────────────────────────────────────────── */
  if (!selectedTopic) {
    const attemptedCount = topics.filter(t => progress[t]).length;

    return (
      <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Aptitude</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {topicsLoading
                ? 'Loading topics…'
                : `${topics.length} topics${
                    attemptedCount > 0 ? ` · ${attemptedCount} attempted` : ''
                  }`}
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search topics"
              aria-label="Search topics"
              className="h-10 w-full rounded-full border bg-card pl-10 pr-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
            />
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {topicsLoading ? (
            Array.from({ length: 9 }).map((_, idx) => (
              <div key={idx} className="rounded-2xl border bg-card p-5">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="mt-3 h-4 w-1/3" />
              </div>
            ))
          ) : filteredTopics.length === 0 ? (
            <div className="col-span-full rounded-2xl border bg-card px-6 py-16 text-center">
              <p className="text-sm text-muted-foreground">
                {topics.length === 0
                  ? 'No topics available right now.'
                  : `No topics match “${search}”.`}
              </p>
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="mt-3 text-sm font-medium text-primary hover:underline"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            filteredTopics.map(topic => {
              const p = progress[topic];
              return (
                <button
                  key={topic}
                  onClick={() => setSelectedTopic(topic)}
                  className="group rounded-2xl border bg-card p-5 text-left transition-colors hover:border-primary/40 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-[15px] font-semibold leading-snug">
                      {topicLabel(topic)}
                    </h2>
                    {p && (
                      <span
                        className={`shrink-0 text-sm font-semibold tabular-nums ${scoreTone(p.best)}`}
                      >
                        {p.best}%
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {p
                      ? `Best of ${p.attempts} attempt${p.attempts === 1 ? '' : 's'}`
                      : 'Not attempted yet'}
                  </p>
                </button>
              );
            })
          )}
        </div>
      </div>
    );
  }

  /* ── Quiz ─────────────────────────────────────────────────────── */
  const percentage = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:px-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={resetToTopics}
        className="-ml-2 gap-1.5 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        All topics
      </Button>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            {topicLabel(selectedTopic)}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {loading
              ? 'Loading questions…'
              : submitted
                ? `${questions.length} questions · reviewed`
                : `${answeredCount} of ${questions.length} answered`}
          </p>
        </div>

        {!loading && !submitted && questions.length > 0 && (
          <div className="w-full sm:w-48">
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${(answeredCount / questions.length) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Result summary */}
      {submitted && (
        <div className="mt-6 rounded-2xl border bg-card p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Your score
              </p>
              <p className="mt-2 text-3xl font-semibold tabular-nums">
                <span className={scoreTone(percentage)}>{percentage}%</span>
                <span className="ml-2 text-base font-normal text-muted-foreground">
                  {score} of {questions.length} correct
                </span>
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={retryTopic}>
                Retry
              </Button>
              <Button onClick={resetToTopics}>Another topic</Button>
            </div>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="mt-6 space-y-4">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="rounded-2xl border bg-card p-6">
              <Skeleton className="h-5 w-3/4" />
              <div className="mt-5 space-y-2.5">
                {Array.from({ length: 4 }).map((_, o) => (
                  <Skeleton key={o} className="h-11 w-full rounded-xl" />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Questions */}
      {!loading && (
        <div className="mt-6 space-y-4">
          {questions.length === 0 ? (
            <div className="rounded-2xl border bg-card px-6 py-16 text-center">
              <p className="text-sm text-muted-foreground">
                No questions found for this topic.
              </p>
              <button
                onClick={resetToTopics}
                className="mt-3 text-sm font-medium text-primary hover:underline"
              >
                Pick another topic
              </button>
            </div>
          ) : (
            <>
              {currentQuestions.map((q, qi) => {
                const actualIndex = startIndex + qi;
                const correct = isCorrect(actualIndex);
                const unanswered = !submitted && userAnswers[actualIndex] === undefined;

                return (
                  <fieldset
                    key={q.s_no ?? q.id ?? actualIndex}
                    className={`rounded-2xl border bg-card p-6 ${
                      submitted
                        ? correct
                          ? 'border-emerald-500/40'
                          : 'border-rose-500/40'
                        : ''
                    }`}
                  >
                    <legend className="sr-only">Question {actualIndex + 1}</legend>

                    <div className="flex items-start justify-between gap-4">
                      <p className="text-[15px] font-medium leading-relaxed">
                        <span className="mr-2 text-muted-foreground tabular-nums">
                          {actualIndex + 1}.
                        </span>
                        {q.question}
                      </p>
                      {submitted &&
                        (correct ? (
                          <CheckCircle2 className="size-5 shrink-0 text-emerald-500" />
                        ) : (
                          <XCircle className="size-5 shrink-0 text-rose-500" />
                        ))}
                      {unanswered && (
                        <Badge
                          variant="outline"
                          className="shrink-0 text-xs font-normal text-muted-foreground"
                        >
                          Unanswered
                        </Badge>
                      )}
                    </div>

                    <div className="mt-5 space-y-2.5">
                      {(['option_a', 'option_b', 'option_c', 'option_d'] as const).map(
                        (optKey, idx) => {
                          const optValue = q[optKey] as string | undefined;
                          if (!optValue) return null;

                          const isSelected = userAnswers[actualIndex] === optValue;
                          const isCorrectOption = submitted && optValue === q.answer;
                          const isWrongSelection = submitted && isSelected && !isCorrectOption;

                          const tone = isCorrectOption
                            ? 'border-emerald-500/50 bg-emerald-500/10'
                            : isWrongSelection
                              ? 'border-rose-500/50 bg-rose-500/10'
                              : isSelected
                                ? 'border-primary bg-primary/5'
                                : 'hover:border-primary/40 hover:bg-muted/50';

                          return (
                            <label
                              key={optKey}
                              className={`flex items-start gap-3 rounded-xl border p-3 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring/50 ${
                                submitted ? 'cursor-default' : 'cursor-pointer'
                              } ${tone}`}
                            >
                              <input
                                type="radio"
                                name={`question-${actualIndex}`}
                                value={optValue}
                                checked={isSelected}
                                disabled={submitted}
                                onChange={() => handleOptionSelect(actualIndex, optValue)}
                                className="sr-only"
                              />
                              <span
                                className={`flex size-6 shrink-0 items-center justify-center rounded-md border text-xs font-semibold ${
                                  isSelected || isCorrectOption
                                    ? 'border-transparent bg-foreground text-background'
                                    : 'text-muted-foreground'
                                }`}
                              >
                                {String.fromCharCode(65 + idx)}
                              </span>
                              <span className="text-sm leading-relaxed">{optValue}</span>
                            </label>
                          );
                        }
                      )}
                    </div>

                    {submitted && q.explanation && (
                      <details className="group mt-4 border-t pt-4">
                        <summary className="flex cursor-pointer list-none items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                          <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
                          Explanation
                        </summary>
                        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                          {q.explanation}
                        </p>
                      </details>
                    )}
                  </fieldset>
                );
              })}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between gap-3 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="gap-1"
                  >
                    <ChevronLeft className="size-4" />
                    Prev
                  </Button>

                  <div className="flex flex-wrap justify-center gap-1.5">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => goToPage(page)}
                        aria-current={currentPage === page ? 'page' : undefined}
                        className={`relative size-8 rounded-md border text-sm tabular-nums transition-colors ${
                          currentPage === page
                            ? 'border-transparent bg-foreground font-medium text-background'
                            : 'text-muted-foreground hover:border-primary/40 hover:text-foreground'
                        }`}
                      >
                        {page}
                        {pageHasUnanswered(page) && currentPage !== page && (
                          <span className="absolute -right-0.5 -top-0.5 size-1.5 rounded-full bg-primary" />
                        )}
                      </button>
                    ))}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="gap-1"
                  >
                    Next
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              )}

              {/* Submit */}
              {!submitted && (
                <div className="sticky bottom-4 mt-6 rounded-2xl border bg-card/95 p-4 backdrop-blur">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-muted-foreground">
                      {answeredCount === questions.length
                        ? 'All questions answered.'
                        : `${questions.length - answeredCount} left to answer.`}
                    </p>
                    <Button onClick={handleSubmit}>Submit answers</Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
