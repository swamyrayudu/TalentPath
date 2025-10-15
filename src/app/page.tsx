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
  Shield,
  Zap,
  Users
} from 'lucide-react';
import { useSession, signIn } from 'next-auth/react';

export default function Home() {
  const { data: session } = useSession();

  const handleGoogleSignIn = async () => {
    await signIn('google', { callbackUrl: '/dashboard' });
  };

  const features = [
    {
      icon: Brain,
      title: 'Aptitude Tests',
      description: 'Practice quantitative, logical, and verbal reasoning',
    },
    {
      icon: Code,
      title: 'Online Compiler',
      description: 'Code in multiple languages with real-time execution',
    },
    {
      icon: Trophy,
      title: 'Coding Contests',
      description: 'Participate in competitive programming challenges',
    },
    {
      icon: FileSpreadsheet,
      title: 'DSA Sheet',
      description: 'Curated data structures and algorithms problems',
    },
    {
      icon: Briefcase,
      title: 'Job Portal',
      description: 'Find and apply to top tech companies',
    },
    {
      icon: Map,
      title: 'Career Roadmap',
      description: 'Personalized learning paths for your career',
    },
  ];

  const stats = [
    { icon: Users, value: '10K+', label: 'Active Users' },
    { icon: Code, value: '50K+', label: 'Problems Solved' },
    { icon: Trophy, value: '500+', label: 'Contests Hosted' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 bg-clip-text text-transparent">
            Welcome to TalentPath
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground">
            Your journey to success starts here. Manage your career, connect with opportunities, and grow professionally.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {session?.user ? (
              <Link href="/dashboard">
                <Button size="lg" className="gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700">
                  Go to Dashboard
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            ) : (
              <Button 
                size="lg" 
                onClick={handleGoogleSignIn}
                className="gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
              >
                Get Started
                <ArrowRight className="h-5 w-5" />
              </Button>
            )}
            <Link href="/dashboard">
              <Button size="lg" variant="outline">
                Explore Features
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="text-center space-y-2">
                <div className="flex justify-center">
                  <div className="p-3 rounded-full bg-gradient-to-br from-amber-500/10 to-amber-600/10">
                    <Icon className="h-8 w-8 text-amber-600" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-amber-600">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          Everything You Need to Succeed
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow border-2 hover:border-amber-500/50">
                <CardHeader>
                  <div className="p-2 w-fit rounded-lg bg-gradient-to-br from-amber-500/10 to-amber-600/10 mb-2">
                    <Icon className="h-6 w-6 text-amber-600" />
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Key Benefits Section */}
      <section className="container mx-auto px-4 py-20 bg-gradient-to-r from-amber-500/5 to-amber-600/5 rounded-3xl my-12">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Why Choose TalentPath?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="p-4 rounded-full bg-gradient-to-br from-amber-500 to-amber-600">
                  <Shield className="h-8 w-8 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-semibold">Secure Authentication</h3>
              <p className="text-muted-foreground">
                Google OAuth integration with role-based access control
              </p>
            </div>
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="p-4 rounded-full bg-gradient-to-br from-amber-500 to-amber-600">
                  <Zap className="h-8 w-8 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-semibold">Modern Design</h3>
              <p className="text-muted-foreground">
                Beautiful UI with dark/light mode support and shadcn components
              </p>
            </div>
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="p-4 rounded-full bg-gradient-to-br from-amber-500 to-amber-600">
                  <Code className="h-8 w-8 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-semibold">Type-Safe</h3>
              <p className="text-muted-foreground">
                Built with TypeScript, Next.js 15, and Drizzle ORM
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-2xl mx-auto space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold">
            Ready to Start Your Journey?
          </h2>
          <p className="text-xl text-muted-foreground">
            Join thousands of developers and professionals advancing their careers
          </p>
          {!session?.user && (
            <Button 
              size="lg" 
              onClick={handleGoogleSignIn}
              className="gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
            >
              Sign In with Google
              <ArrowRight className="h-5 w-5" />
            </Button>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">
          <p>© 2025 TalentPath. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
