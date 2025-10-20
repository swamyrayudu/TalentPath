'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Code, 
  Brain, 
  Trophy, 
  Briefcase, 
  FileSpreadsheet, 
  Map,
  ArrowRight,
  Sparkles,
  Zap,
  Target,
  CheckCircle2
} from 'lucide-react';
import { useSession, signIn } from 'next-auth/react';
import { ContestSubmissionsPreview } from '@/components/home/contest-submissions-preview';
import { useEffect, useState } from 'react';

export default function Home() {
  const { data: session } = useSession();
  const [contestStats, setContestStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    async function fetchContestStats() {
      if (session?.user?.id) {
        setLoadingStats(true);
        try {
          const response = await fetch('/api/contest-stats');
          if (response.ok) {
            const data = await response.json();
            setContestStats(data);
          }
        } catch (error) {
          console.error('Failed to fetch contest stats:', error);
        } finally {
          setLoadingStats(false);
        }
      }
    }
    fetchContestStats();
  }, [session?.user?.id]);

  const handleGoogleSignIn = async () => {
    await signIn('google', { callbackUrl: '/dashboard' });
  };

  const features = [
    {
      icon: Brain,
      title: 'Aptitude Tests',
      description: 'Master quantitative, logical, and verbal reasoning with comprehensive practice tests',
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      icon: Code,
      title: 'Online Compiler',
      description: 'Write and execute code in multiple languages with real-time feedback',
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Trophy,
      title: 'Coding Contests',
      description: 'Compete with developers worldwide and sharpen your problem-solving skills',
      gradient: 'from-yellow-500 to-orange-500',
    },
    {
      icon: FileSpreadsheet,
      title: 'DSA Sheet',
      description: 'Structured curriculum covering essential data structures and algorithms',
      gradient: 'from-green-500 to-emerald-500',
    },
    {
      icon: Briefcase,
      title: 'Job Portal',
      description: 'Discover opportunities at top tech companies and startups',
      gradient: 'from-indigo-500 to-purple-500',
    },
    {
      icon: Map,
      title: 'Career Roadmap',
      description: 'Personalized learning paths tailored to your career goals',
      gradient: 'from-rose-500 to-red-500',
    },
  ];

  const benefits = [
    'Comprehensive learning platform',
    'Real-time code execution',
    'Competitive programming',
    'Career guidance & roadmaps',
    'Job opportunities',
    'Progress tracking',
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section with Gradient Background */}
      <section className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-black dark:via-black dark:to-black">
        <div className="absolute inset-0 bg-grid-slate-900/[0.04] dark:bg-grid-slate-100/[0.03]" />
        <div className="container relative mx-auto px-4 py-24 md:py-32">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-amber-200 dark:border-amber-800 bg-amber-100 dark:bg-amber-900/30">
              <Sparkles className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
                Your Complete Career Platform
              </span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold">
              <span className="bg-gradient-to-r from-amber-600 via-orange-600 to-yellow-600 bg-clip-text text-transparent">
                Master Coding.
              </span>
              <br />
              <span className="text-foreground">Land Your Dream Job.</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              Practice DSA, compete in contests, prepare for aptitude tests, and discover your next opportunity — all in one place.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              {session?.user ? (
                <Link href="/dashboard">
                  <Button size="lg" className="gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg shadow-amber-500/50">
                    Go to Dashboard
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
              ) : (
                <Button 
                  size="lg" 
                  onClick={handleGoogleSignIn}
                  className="gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg shadow-amber-500/50"
                >
                  Get Started Free
                  <ArrowRight className="h-5 w-5" />
                </Button>
              )}
              <Link href="#features">
                <Button size="lg" variant="outline" className="border-2">
                  Explore Features
                </Button>
              </Link>
            </div>

            {/* Benefits Pills */}
            <div className="flex flex-wrap gap-3 justify-center pt-8">
              {benefits.map((benefit, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700"
                >
                  <CheckCircle2 className="h-4 w-4 text-amber-600" />
                  <span className="text-sm font-medium">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-24 dark:bg-black">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold">
            Everything You Need to <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">Excel</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Comprehensive tools and resources to accelerate your tech career
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={index} 
                className="group hover:shadow-2xl transition-all duration-300 border-2 hover:border-transparent hover:scale-105 relative overflow-hidden"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                <CardHeader className="relative">
                  <div className={`p-3 w-fit rounded-xl bg-gradient-to-br ${feature.gradient} mb-4 shadow-lg`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Why Choose Section */}
      <section className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-black dark:to-black py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">
              Why <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">TalentPath</span>?
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-xl shadow-amber-500/30">
                    <Target className="h-12 w-12 text-white" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold">Focused Learning</h3>
                <p className="text-muted-foreground text-lg">
                  Curated content and structured paths designed to help you master essential skills efficiently
                </p>
              </div>
              
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-xl shadow-amber-500/30">
                    <Zap className="h-12 w-12 text-white" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold">Real-Time Practice</h3>
                <p className="text-muted-foreground text-lg">
                  Instant feedback on your code with our powerful online compiler and testing environment
                </p>
              </div>
              
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-xl shadow-amber-500/30">
                    <Sparkles className="h-12 w-12 text-white" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold">Career Growth</h3>
                <p className="text-muted-foreground text-lg">
                  From learning to landing jobs, we support every step of your professional journey
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contest Submissions Stats for Logged-in Users */}
      {session?.user && contestStats && (
        <section className="container mx-auto px-4 py-24">
          <div className="max-w-4xl mx-auto">
            <ContestSubmissionsPreview stats={contestStats} />
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-24">
        <div className="max-w-4xl mx-auto text-center space-y-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl p-12 md:p-16 shadow-2xl shadow-amber-500/30">
          <h2 className="text-4xl md:text-5xl font-bold text-white">
            Ready to Transform Your Career?
          </h2>
          <p className="text-xl text-amber-50">
            Join thousands of developers already advancing their skills and careers with TalentPath
          </p>
          {!session?.user && (
            <Button 
              size="lg" 
              onClick={handleGoogleSignIn}
              className="gap-2 bg-white text-amber-600 hover:bg-amber-50 shadow-xl text-lg px-8"
            >
              Start Your Journey
              <ArrowRight className="h-5 w-5" />
            </Button>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30">
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600">
                <Code className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                TalentPath
              </span>
            </div>
            <p className="text-muted-foreground">
              © 2025 TalentPath. Empowering careers, one line of code at a time.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
