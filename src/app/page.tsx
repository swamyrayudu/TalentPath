'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ContainerTextFlip } from '@/components/ui/container-text-flip';
import { AnimatedTooltip } from '@/components/ui/animated-tooltip';
import { 
  Code, 
  Brain, 
  Trophy, 
  Briefcase, 
  FileSpreadsheet, 
  Map,
  ArrowRight,
  Mail,
  Github,
  Linkedin,
  User,
  Heart,
  Instagram,
  MessageCircle,
  Users
} from 'lucide-react';
import { useSession, signIn } from 'next-auth/react';

export default function Home() {
  const { data: session, status } = useSession();
  const [userStats, setUserStats] = useState<{
    totalUsers: number;
    recentUsers: { id: string; name: string; designation: string; image: string }[];
  } | null>(null);

  useEffect(() => {
    fetch('/api/users/stats')
      .then(res => res.json())
      .then(data => setUserStats(data))
      .catch(err => console.error('Failed to fetch user stats:', err));
  }, []);

  const handleGoogleSignIn = async () => {
    await signIn('google', { callbackUrl: '/dashboard' });
  };

  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const features = [
    {
      icon: Brain,
      title: 'Aptitude Tests',
      description: 'Master quantitative, logical, and verbal reasoning with practice tests',
      href: '/aptitude',
    },
    {
      icon: Code,
      title: 'Online Compiler',
      description: 'Write and execute code in multiple languages with real-time feedback',
      href: '/compiler',
    },
    {
      icon: Trophy,
      title: 'Coding Contests',
      description: 'Compete with developers worldwide and sharpen your skills',
      href: '/contest',
    },
    {
      icon: FileSpreadsheet,
      title: 'DSA Sheet',
      description: 'Structured curriculum covering data structures and algorithms',
      href: '/dsasheet',
    },
    {
      icon: Briefcase,
      title: 'Job Portal',
      description: 'Discover opportunities at top tech companies and startups',
      href: '/jobs',
    },
    {
      icon: Map,
      title: 'Career Roadmap',
      description: 'Personalized learning paths tailored to your career goals',
      href: '/roadmap',
    },
  ];

  const developers = [
    {
      name: 'R.V.V.Swamy',
      role: 'Full Stack Developer',
      socials: {
        github: 'https://github.com/swamyrayudu',
        linkedin: 'https://www.linkedin.com/in/rayudu-veera-venkata-swamy/',
        instagram: 'https://www.instagram.com/swamy__rayudu/',
        whatsapp: 'https://wa.me/917288819391',
      }
    },
    {
      name: 'P.S.V.S.Durga Prasad',
      role: 'Full Stack Developer',
      socials: {
        github: 'https://github.com/Durga62823',
        linkedin: 'https://www.linkedin.com/in/durga-prasad-peddapalli-1616a8297/',
        instagram: 'https://www.instagram.com/the_addicted__person_78/',
        whatsapp: 'https://wa.me/919030512334',
      }
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b bg-background h-screen flex items-center">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]" />
        
        <div className="container relative mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto text-center space-y-4 md:space-y-6">
            {/* Badge with animated text */}
            <div className="flex justify-center">
              <ContainerTextFlip 
                words={[
                  'Coder',
                  "Your Complete Career Platform",
                  "Master DSA & Algorithms",
                  "Ace Your Interviews",
                  "Build Your Portfolio",
                  "Land Your Dream Job"
                ]}
                interval={3000}
                className="text-xs sm:text-sm md:text-base font-semibold border-2 shadow-md hover:shadow-lg transition-shadow"
                textClassName=""
              />
            </div>
            
            {/* Main Heading */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
              Master Your Tech Career
              <br />
              <span className="text-muted-foreground">One Step at a Time</span>
            </h1>
            
            {/* Description */}
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Practice problems, compete in contests, prepare for interviews, and land your dream job with our comprehensive platform.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2 px-4">
              {session?.user ? (
                <Link href="/dashboard" className="w-full sm:w-auto">
                  <Button size="default" className="gap-2 w-full h-10 text-sm">
                    Go to Dashboard
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Button 
                    size="default" 
                    onClick={handleGoogleSignIn}
                    className="gap-2 w-full sm:w-auto h-10 text-sm"
                  >
                    Get Started Free
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Link href="#features" className="w-full sm:w-auto">
                    <Button 
                      size="default" 
                      variant="outline"
                      className="gap-2 w-full h-10 text-sm"
                    >
                      Explore Features
                    </Button>
                  </Link>
                </>
              )}
            </div>
            
            {/* User Stats with Animated Tooltips */}
            <div className="flex flex-col items-center gap-3 pt-4 min-h-[100px] justify-center">
              {userStats && userStats.recentUsers.length > 0 ? (
                <>
                  <div className="flex items-center gap-1">
                    <AnimatedTooltip items={userStats.recentUsers.map((user, idx) => ({
                      ...user,
                      id: idx
                    }))} />
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/50 border border-border">
                    <Users className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs sm:text-sm font-semibold">
                      Join <span className="text-primary">{userStats.totalUsers.toLocaleString()}+</span> developers already learning
                    </span>
                  </div>
                </>
              ) : (
                <div className="h-[100px]" />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center mb-12 md:mb-16 space-y-4">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
            Everything You Need
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Comprehensive tools designed to accelerate your tech career
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <Link key={index} href={feature.href} className="block group">
              <Card className="relative h-full overflow-hidden transition-all duration-500 hover:shadow-2xl border hover:border-primary/50 hover:-translate-y-2">
                {/* Animated gradient background on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/0 to-primary/0 group-hover:from-primary/5 group-hover:via-primary/10 group-hover:to-primary/5 transition-all duration-500" />
                
                {/* Shine effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                </div>
                
                <CardHeader className="relative p-6 space-y-3">
                  {/* Number badge */}
                  <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                    {index + 1}
                  </div>
                  
                  <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors duration-300">
                    {feature.title}
                  </CardTitle>
                  
                  <CardDescription className="text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                  
                  {/* Arrow indicator */}
                  <div className="pt-2 flex items-center gap-2 text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors duration-300">
                    <span>Explore</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Developers Section */}
      <section className="border-t bg-muted/30">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12 md:mb-16 space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border bg-card shadow-sm">
                <Heart className="h-4 w-4 text-primary fill-primary" />
                <span className="text-sm font-medium">Built with passion</span>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
                Meet the Team
              </h2>
              <p className="text-lg text-muted-foreground">
                Crafted by dedicated developers committed to your success
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {developers.map((dev, index) => (
                <Card
                  key={index}
                  className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/20"
                >
                  <CardHeader className="p-8 text-center">
                    <div className="mb-4">
                      <div className="inline-flex p-4 rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                        <User className="h-8 w-8" />
                      </div>
                    </div>
                    <div className="space-y-2 mb-4">
                      <h3 className="text-xl font-bold">
                        {dev.name}
                      </h3>
                      <p className="text-sm text-muted-foreground font-medium">
                        {dev.role}
                      </p>
                    </div>
                    
                    {/* Social Links */}
                    <div className="flex justify-center gap-2 pt-2">
                      <a
                        href={dev.socials.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2.5 rounded-lg bg-secondary hover:bg-foreground hover:text-background transition-all duration-200"
                        aria-label="GitHub"
                      >
                        <Github className="h-5 w-5" />
                      </a>
                      <a
                        href={dev.socials.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2.5 rounded-lg bg-secondary hover:bg-blue-600 hover:text-white transition-all duration-200"
                        aria-label="LinkedIn"
                      >
                        <Linkedin className="h-5 w-5" />
                      </a>
                      <a
                        href={dev.socials.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2.5 rounded-lg bg-secondary hover:bg-gradient-to-br hover:from-purple-600 hover:to-pink-600 hover:text-white transition-all duration-200"
                        aria-label="Instagram"
                      >
                        <Instagram className="h-5 w-5" />
                      </a>
                      <a
                        href={dev.socials.whatsapp}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2.5 rounded-lg bg-secondary hover:bg-green-600 hover:text-white transition-all duration-200"
                        aria-label="WhatsApp"
                      >
                        <MessageCircle className="h-5 w-5" />
                      </a>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!session?.user && (
        <section className="container mx-auto px-4 py-16 md:py-24">
          <Card className="max-w-4xl mx-auto border-2 shadow-xl overflow-hidden">
            <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background p-8 md:p-16 text-center space-y-6">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
                Ready to Get Started?
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Join thousands of developers advancing their skills with TalentPath
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button 
                  size="lg" 
                  onClick={handleGoogleSignIn}
                  className="gap-2 h-12 text-base px-8"
                >
                  Start Your Journey
                  <ArrowRight className="h-5 w-5" />
                </Button>
                <Link href="#features">
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="gap-2 h-12 text-base px-8 w-full sm:w-auto"
                  >
                    Learn More
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t bg-muted/30">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-8 mb-8">
            {/* Brand Section */}
            <div className="md:col-span-3 space-y-4">
              <div className="flex items-center gap-2">
                <img 
                  src="/talentpath-logo.svg" 
                  alt="TalentPath Logo" 
                  className="h-10 w-10"
                />
                <span className="text-xl font-bold">
                  TalentPath
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Empowering careers, one line of code at a time.
              </p>
            </div>

            {/* Platform Links */}
            <div className="md:col-span-2">
              <h3 className="font-semibold mb-4">Platform</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link href="/aptitude" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Aptitude Tests
                  </Link>
                </li>
                <li>
                  <Link href="/compiler" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Compiler
                  </Link>
                </li>
                <li>
                  <Link href="/contest" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Contests
                  </Link>
                </li>
              </ul>
            </div>

            {/* Resources Links */}
            <div className="md:col-span-2">
              <h3 className="font-semibold mb-4">Resources</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/dsasheet" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    DSA Sheet
                  </Link>
                </li>
                <li>
                  <Link href="/roadmap" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Roadmap
                  </Link>
                </li>
                <li>
                  <Link href="/jobs" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Jobs
                  </Link>
                </li>
              </ul>
            </div>

            {/* Connect Section */}
            <div className="md:col-span-2">
              <h3 className="font-semibold mb-4">Connect</h3>
              <a 
                href="mailto:contact@talentpath.com" 
                className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
              >
                <Mail className="h-4 w-4" />
                Contact Us
              </a>
            </div>

            {/* Crafted by Section */}
            <div className="md:col-span-3">
              <h3 className="font-semibold mb-4">Crafted by</h3>
              <div className="space-y-4">
                {/* Developer 1 */}
                <div className="space-y-2">
                  <p className="text-sm font-semibold">
                    R.V.V. Swamy
                  </p>
                  <div className="flex gap-2">
                    <a 
                      href="https://github.com/swamyrayudu" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-secondary hover:bg-foreground hover:text-background transition-all"
                      aria-label="GitHub - R.V.V. Swamy"
                    >
                      <Github className="h-4 w-4" />
                    </a>
                    <a 
                      href="https://www.linkedin.com/in/rayudu-veera-venkata-swamy/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-secondary hover:bg-blue-600 hover:text-white transition-all"
                      aria-label="LinkedIn - R.V.V. Swamy"
                    >
                      <Linkedin className="h-4 w-4" />
                    </a>
                    <a 
                      href="https://www.instagram.com/swamy__rayudu/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-secondary hover:bg-gradient-to-br hover:from-purple-600 hover:to-pink-600 hover:text-white transition-all"
                      aria-label="Instagram - R.V.V. Swamy"
                    >
                      <Instagram className="h-4 w-4" />
                    </a>
                    <a 
                      href="https://wa.me/917288819391" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-secondary hover:bg-green-600 hover:text-white transition-all"
                      aria-label="WhatsApp - R.V.V. Swamy"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </a>
                  </div>
                </div>

                {/* Developer 2 */}
                <div className="space-y-2">
                  <p className="text-sm font-semibold">
                    P.S.V. Siva Durga Prasad
                  </p>
                  <div className="flex gap-2">
                    <a 
                      href="https://github.com/Durga62823" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-secondary hover:bg-foreground hover:text-background transition-all"
                      aria-label="GitHub - P.S.V. Siva Durga Prasad"
                    >
                      <Github className="h-4 w-4" />
                    </a>
                    <a 
                      href="https://www.linkedin.com/in/durga-prasad-peddapalli-1616a8297/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-secondary hover:bg-blue-600 hover:text-white transition-all"
                      aria-label="LinkedIn - P.S.V. Siva Durga Prasad"
                    >
                      <Linkedin className="h-4 w-4" />
                    </a>
                    <a 
                      href="https://www.instagram.com/the_addicted__person_78/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-secondary hover:bg-gradient-to-br hover:from-purple-600 hover:to-pink-600 hover:text-white transition-all"
                      aria-label="Instagram - P.S.V. Siva Durga Prasad"
                    >
                      <Instagram className="h-4 w-4" />
                    </a>
                    <a 
                      href="https://wa.me/919030512334" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-secondary hover:bg-green-600 hover:text-white transition-all"
                      aria-label="WhatsApp - P.S.V. Siva Durga Prasad"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
              <p className="text-sm text-muted-foreground">
                © 2025 TalentPath. All rights reserved.
              </p>
              <div className="flex gap-6">
                <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
                <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Terms of Service
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
