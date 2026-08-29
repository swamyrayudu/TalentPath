'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Code,
  Brain,
  Trophy,
  Briefcase,
  FileSpreadsheet,
  Map,
  ArrowRight,
  ArrowUpRight,
  Mail,
  Github,
  Linkedin,
  Instagram,
  MessageCircle,
} from 'lucide-react';
import { useSession, signIn } from 'next-auth/react';

type UserStats = {
  totalUsers: number;
  recentUsers: {
    id: string;
    name: string;
    designation: string;
    image: string;
    fallbackLetter?: string;
  }[];
};

const features = [
  {
    icon: FileSpreadsheet,
    title: 'DSA Sheet',
    description:
      'A structured curriculum covering every pattern in data structures and algorithms.',
    href: '/dsasheet',
  },
  {
    icon: Code,
    title: 'Online Compiler',
    description:
      'Write and run code in multiple languages with instant feedback, right in the browser.',
    href: '/compiler',
  },
  {
    icon: Trophy,
    title: 'Coding Contests',
    description:
      'Timed challenges against real opponents. Climb the leaderboard, sharpen your instincts.',
    href: '/contest',
  },
  {
    icon: Brain,
    title: 'Aptitude Tests',
    description:
      'Quantitative, logical, and verbal reasoning drills built for placement season.',
    href: '/aptitude',
  },
  {
    icon: Briefcase,
    title: 'Job Portal',
    description:
      'Curated openings at product companies and startups, matched to your progress.',
    href: '/jobs',
  },
  {
    icon: Map,
    title: 'Career Roadmap',
    description:
      'A personalized path from where you are to the role you want — step by step.',
    href: '/roadmap',
  },
];

const steps = [
  {
    step: '01',
    title: 'Learn the pattern',
    description:
      'Work through the DSA sheet pattern by pattern instead of grinding random problems.',
  },
  {
    step: '02',
    title: 'Prove it under pressure',
    description:
      'Enter timed contests and mock interviews where the clock is part of the problem.',
  },
  {
    step: '03',
    title: 'Apply with evidence',
    description:
      'Your progress feeds a roadmap and a job feed matched to what you can actually do.',
  },
];

const developers = [
  {
    name: 'R.V.V. Swamy',
    role: 'Full Stack Developer',
    socials: {
      github: 'https://github.com/swamyrayudu',
      linkedin: 'https://www.linkedin.com/in/rayudu-veera-venkata-swamy/',
      instagram: 'https://www.instagram.com/swamy__rayudu/',
      whatsapp: 'https://wa.me/917288819391',
    },
  },
  {
    name: 'Durga Prasad',
    role: 'Full Stack Developer',
    socials: {
      github: 'https://github.com/Durga62823',
      linkedin: 'https://www.linkedin.com/in/durga-prasad-peddapalli-1616a8297/',
      instagram: 'https://www.instagram.com/the_addicted__person_78/',
      whatsapp: 'https://wa.me/919030512334',
    },
  },
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
      {children}
    </p>
  );
}

function SocialLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="text-muted-foreground transition-colors hover:text-foreground"
    >
      {children}
    </a>
  );
}

export default function Home() {
  const { data: session, status } = useSession();
  const [userStats, setUserStats] = useState<UserStats | null>(null);

  useEffect(() => {
    fetch('/api/users/stats')
      .then((res) => res.json())
      .then((data) => setUserStats(data))
      .catch(() => {});
  }, []);

  const handleGoogleSignIn = async () => {
    await signIn('google', { callbackUrl: '/dashboard' });
  };

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="size-6 animate-spin rounded-full border-2 border-muted border-t-foreground" />
      </div>
    );
  }

  const proofAvatars = userStats?.recentUsers?.filter((u) => u.image)?.slice(0, 5) ?? [];

  return (
    <div className="min-h-screen bg-background">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="relative mx-auto max-w-5xl px-6 pb-20 pt-20 text-center md:pb-28 md:pt-28">
          <div className="flex justify-center">
            <SectionLabel>Practice · Compete · Get hired</SectionLabel>
          </div>

          <h1 className="mx-auto mt-8 max-w-3xl text-[2.5rem] font-bold leading-[1.05] tracking-[-0.04em] sm:text-6xl md:text-[4.5rem]">
            Master the craft.
            <br />
            <span className="text-muted-foreground">Land the career.</span>
          </h1>

          <p className="mx-auto mt-7 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
            Structured DSA practice, aptitude prep, live contests, and curated jobs —
            the whole path from first problem to first offer, in one place.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            {session?.user ? (
              <Button size="lg" className="h-12 gap-2 rounded-full px-7 text-sm" asChild>
                <Link href="/dashboard">
                  Go to dashboard
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            ) : (
              <>
                <Button
                  size="lg"
                  className="h-12 gap-2 rounded-full px-7 text-sm"
                  onClick={handleGoogleSignIn}
                >
                  Start practicing free
                  <ArrowRight className="size-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 rounded-full px-7 text-sm"
                  asChild
                >
                  <Link href="#features">Explore the platform</Link>
                </Button>
              </>
            )}
          </div>

          {userStats && userStats.totalUsers > 0 && (
            <div className="mt-12 flex items-center justify-center gap-3.5">
              {proofAvatars.length > 0 && (
                <div className="flex -space-x-2.5">
                  {proofAvatars.map((user) => (
                    <Avatar
                      key={user.id}
                      className="size-8 border-2 border-background"
                      title={user.name}
                    >
                      <AvatarImage src={user.image} alt="" className="object-cover" />
                      <AvatarFallback className="bg-muted text-xs font-medium">
                        {user.fallbackLetter || user.name.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </div>
              )}
              <p className="text-sm text-muted-foreground">
                Joined by{' '}
                <span className="font-semibold text-foreground">
                  {userStats.totalUsers.toLocaleString()}
                </span>{' '}
                developers
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────── */}
      <section className="bg-surface/60 py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] lg:gap-20">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <SectionLabel>How it works</SectionLabel>
              <h2 className="mt-5 text-4xl font-bold leading-[1.08] tracking-[-0.035em] md:text-5xl">
                Preparation that
                <br />
                <span className="text-muted-foreground">compounds.</span>
              </h2>
              <p className="mt-6 max-w-md leading-relaxed text-muted-foreground">
                Scattered practice is why most preparation stalls. TalentPath connects
                every stage, so the work you do today is the evidence you carry into
                your interview tomorrow.
              </p>
              <Button
                size="lg"
                className="mt-8 h-12 gap-2 rounded-full px-7 text-sm"
                onClick={session?.user ? undefined : handleGoogleSignIn}
                asChild={!!session?.user}
              >
                {session?.user ? (
                  <Link href="/dsasheet">
                    Open the DSA sheet
                    <ArrowRight className="size-4" />
                  </Link>
                ) : (
                  <>
                    Get started
                    <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
            </div>

            <div className="space-y-4">
              {steps.map((item) => (
                <div
                  key={item.step}
                  className="rounded-3xl border bg-card p-8 transition-colors hover:border-primary/40"
                >
                  <span className="font-mono text-xs font-medium text-primary">
                    {item.step}
                  </span>
                  <h3 className="mt-4 text-xl font-semibold tracking-tight">
                    {item.title}
                  </h3>
                  <p className="mt-3 leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────── */}
      <section id="features" className="scroll-mt-24 py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-8 md:grid-cols-2 md:items-end">
            <div>
              <SectionLabel>The platform</SectionLabel>
              <h2 className="mt-5 text-4xl font-bold leading-[1.08] tracking-[-0.035em] md:text-5xl">
                Six tools.
                <br />
                <span className="text-muted-foreground">One path.</span>
              </h2>
            </div>
            <p className="max-w-md leading-relaxed text-muted-foreground md:justify-self-end">
              Every stage of interview preparation, connected — so what you practice
              today lines up with the role you interview for tomorrow.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Link
                key={feature.href}
                href={feature.href}
                className="group relative rounded-3xl border bg-surface/60 p-8 transition-colors hover:border-primary/40 hover:bg-surface"
              >
                <span className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <feature.icon className="size-[18px]" strokeWidth={1.9} />
                </span>
                <h3 className="mt-8 text-lg font-semibold tracking-tight">
                  {feature.title}
                </h3>
                <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
                <ArrowUpRight className="absolute right-8 top-8 size-4 text-muted-foreground opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Team ─────────────────────────────────────────────── */}
      <section className="bg-surface/60 py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <div className="flex justify-center">
              <SectionLabel>The team</SectionLabel>
            </div>
            <h2 className="mt-5 text-4xl font-bold leading-[1.08] tracking-[-0.035em] md:text-5xl">
              Built by developers,
              <br />
              for developers
            </h2>
          </div>

          <div className="mx-auto mt-14 grid max-w-2xl gap-4 sm:grid-cols-2">
            {developers.map((dev) => (
              <div key={dev.name} className="rounded-3xl border bg-card p-7">
                <p className="text-base font-semibold tracking-tight">{dev.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">{dev.role}</p>
                <div className="mt-6 flex items-center gap-4 border-t pt-5">
                  <SocialLink href={dev.socials.github} label={`GitHub — ${dev.name}`}>
                    <Github className="size-4" />
                  </SocialLink>
                  <SocialLink href={dev.socials.linkedin} label={`LinkedIn — ${dev.name}`}>
                    <Linkedin className="size-4" />
                  </SocialLink>
                  <SocialLink href={dev.socials.instagram} label={`Instagram — ${dev.name}`}>
                    <Instagram className="size-4" />
                  </SocialLink>
                  <SocialLink href={dev.socials.whatsapp} label={`WhatsApp — ${dev.name}`}>
                    <MessageCircle className="size-4" />
                  </SocialLink>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      {!session?.user && (
        <section className="py-20 md:py-28">
          <div className="mx-auto max-w-6xl px-6">
            <div className="rounded-[2rem] bg-foreground px-8 py-16 text-center text-background md:py-24">
              <h2 className="mx-auto max-w-xl text-4xl font-bold leading-[1.08] tracking-[-0.035em] md:text-5xl">
                Your first problem is waiting
              </h2>
              <p className="mx-auto mt-5 max-w-md text-background/60">
                Free to start. No setup — just sign in and begin where you are.
              </p>
              <Button
                size="lg"
                onClick={handleGoogleSignIn}
                className="mt-9 h-12 gap-2 rounded-full bg-background px-7 text-sm text-foreground hover:bg-background/90"
              >
                Get started with Google
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="border-t bg-surface/60">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid grid-cols-2 gap-10 md:grid-cols-12">
            <div className="col-span-2 md:col-span-5">
              <div className="flex items-center gap-2.5">
                <img src="/talentpath-logo.svg" alt="" className="size-8" />
                <span className="text-[17px] font-semibold tracking-tight">TalentPath</span>
              </div>
              <p className="mt-5 max-w-sm leading-relaxed text-muted-foreground">
                TalentPath brings structured practice, real contests, and curated
                openings together — so preparation turns into offers.
              </p>
              <a
                href="mailto:contact@talentpath.com"
                className="mt-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <Mail className="size-4" />
                contact@talentpath.com
              </a>
            </div>

            <div className="md:col-span-2">
              <h3 className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Platform
              </h3>
              <ul className="mt-5 space-y-3">
                {[
                  { name: 'Dashboard', href: '/dashboard' },
                  { name: 'Aptitude', href: '/aptitude' },
                  { name: 'Compiler', href: '/compiler' },
                  { name: 'Contests', href: '/contest' },
                ].map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-[15px] transition-colors hover:text-primary"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="md:col-span-2">
              <h3 className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Resources
              </h3>
              <ul className="mt-5 space-y-3">
                {[
                  { name: 'DSA Sheet', href: '/dsasheet' },
                  { name: 'Roadmap', href: '/roadmap' },
                  { name: 'Jobs', href: '/jobs' },
                ].map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-[15px] transition-colors hover:text-primary"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="col-span-2 md:col-span-3">
              <h3 className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Crafted by
              </h3>
              <div className="mt-5 space-y-4">
                {developers.map((dev) => (
                  <div key={dev.name}>
                    <p className="text-[15px] font-medium">{dev.name}</p>
                    <div className="mt-2 flex items-center gap-3.5">
                      <SocialLink href={dev.socials.github} label={`GitHub — ${dev.name}`}>
                        <Github className="size-4" />
                      </SocialLink>
                      <SocialLink
                        href={dev.socials.linkedin}
                        label={`LinkedIn — ${dev.name}`}
                      >
                        <Linkedin className="size-4" />
                      </SocialLink>
                      <SocialLink
                        href={dev.socials.instagram}
                        label={`Instagram — ${dev.name}`}
                      >
                        <Instagram className="size-4" />
                      </SocialLink>
                      <SocialLink
                        href={dev.socials.whatsapp}
                        label={`WhatsApp — ${dev.name}`}
                      >
                        <MessageCircle className="size-4" />
                      </SocialLink>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t pt-8 text-center sm:flex-row sm:text-left">
            <p className="text-sm text-muted-foreground">
              © 2025 TalentPath. All rights reserved.
            </p>
            <div className="flex gap-6">
              <Link
                href="/privacy"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
