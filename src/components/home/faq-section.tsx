'use client';

import * as React from 'react';
import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { ArrowRight } from 'lucide-react';
import { useSession, signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';

const faqs = [
  {
    question: 'What is TalentPath?',
    answer:
      'TalentPath is a complete interview preparation platform. It brings structured DSA practice, aptitude tests, an online compiler, live coding contests, AI mock interviews, and a curated job board together in one place — so your preparation and your applications stay connected.',
  },
  {
    question: 'How is this different from other practice sites?',
    answer:
      'Most sites give you a pile of problems and leave you to it. TalentPath organises everything around patterns and tracks your progress across all of it, so the roadmap you follow and the jobs you see actually reflect what you have mastered.',
  },
  {
    question: 'Do I need to install anything to write code?',
    answer:
      'No. The built-in compiler runs multiple languages directly in your browser with instant feedback, so you can go from reading a problem to running a solution without leaving the page.',
  },
  {
    question: 'Can I practise for aptitude rounds too?',
    answer:
      'Yes. Alongside DSA there are quantitative, logical, and verbal reasoning drills built specifically for placement season, with results you can review afterwards.',
  },
  {
    question: 'How do the coding contests work?',
    answer:
      'Contests are timed challenges you enter against other candidates. You solve problems under real constraints, submissions are judged automatically, and results feed into a leaderboard so you can see where you stand.',
  },
  {
    question: 'Is TalentPath free to use?',
    answer:
      'You can sign in with Google and start practising immediately at no cost. There is no setup and no installation — you pick up wherever you are in your preparation.',
  },
];

/**
 * Self-contained FAQ block. Drop `<FaqSection />` into a page to enable it;
 * remove that one line to take it out again.
 */
export function FaqSection() {
  const { data: session } = useSession();

  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)] lg:gap-16">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              Questions, answered
            </p>
            <h2 className="mt-5 text-4xl font-bold leading-[1.08] tracking-[-0.035em] md:text-5xl">
              Frequently asked questions
            </h2>
            <p className="mt-6 max-w-md leading-relaxed text-muted-foreground">
              What TalentPath is, how practice and contests fit together, and what you
              get the moment you sign in.
            </p>
            {!session?.user && (
              <Button
                size="lg"
                onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
                className="mt-8 h-12 gap-2 rounded-full px-7 text-sm"
              >
                Get started
                <ArrowRight className="size-4" />
              </Button>
            )}
          </div>

          <AccordionPrimitive.Root
            type="single"
            collapsible
            defaultValue="item-0"
            className="rounded-3xl border bg-surface/60 px-6 sm:px-8"
          >
            {faqs.map((item, index) => (
              <AccordionPrimitive.Item
                key={item.question}
                value={`item-${index}`}
                className="border-b border-dashed last:border-b-0"
              >
                <AccordionPrimitive.Header>
                  <AccordionPrimitive.Trigger className="group flex w-full cursor-pointer items-center justify-between gap-6 py-6 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
                    <span className="text-base font-semibold sm:text-[17px]">
                      {item.question}
                    </span>
                    {/* Plus whose vertical stroke rotates away to leave a minus */}
                    <span
                      aria-hidden
                      className="relative size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground"
                    >
                      <span className="absolute left-0 top-1/2 h-px w-4 -translate-y-1/2 bg-current" />
                      <span className="absolute left-1/2 top-0 h-4 w-px -translate-x-1/2 bg-current transition-transform duration-300 group-data-[state=open]:rotate-90 group-data-[state=open]:opacity-0" />
                    </span>
                  </AccordionPrimitive.Trigger>
                </AccordionPrimitive.Header>
                <AccordionPrimitive.Content className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                  <p className="max-w-prose pb-6 text-[15px] leading-relaxed text-muted-foreground">
                    {item.answer}
                  </p>
                </AccordionPrimitive.Content>
              </AccordionPrimitive.Item>
            ))}
          </AccordionPrimitive.Root>
        </div>
      </div>
    </section>
  );
}
