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
  Mail,
  Github,
  Linkedin,
  User,
  Heart,
  Instagram,
  MessageCircle
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
      description: 'Master quantitative, logical, and verbal reasoning with practice tests',
      href: '/aptitude',
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      icon: Code,
      title: 'Online Compiler',
      description: 'Write and execute code in multiple languages with real-time feedback',
      href: '/compiler',
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Trophy,
      title: 'Coding Contests',
      description: 'Compete with developers worldwide and sharpen your skills',
      href: '/contest',
      gradient: 'from-yellow-500 to-orange-500',
    },
    {
      icon: FileSpreadsheet,
      title: 'DSA Sheet',
      description: 'Structured curriculum covering data structures and algorithms',
      href: '/dsasheet',
      gradient: 'from-green-500 to-emerald-500',
    },
    {
      icon: Briefcase,
      title: 'Job Portal',
      description: 'Discover opportunities at top tech companies and startups',
      href: '/jobs',
      gradient: 'from-indigo-500 to-purple-500',
    },
    {
      icon: Map,
      title: 'Career Roadmap',
      description: 'Personalized learning paths tailored to your career goals',
      href: '/roadmap',
      gradient: 'from-rose-500 to-red-500',
    },
  ];

  const developers = [
    {
      name: 'R.V.V.Swamy',
      role: 'Full Stack Developer',
      gradient: 'from-blue-500 to-cyan-500',
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
      gradient: 'from-purple-500 to-pink-500',
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
      <section className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-black dark:via-gray-950 dark:to-black min-h-[85vh] md:min-h-screen flex items-center">
        <div className="absolute inset-0 bg-grid-slate-900/[0.04] dark:bg-grid-slate-100/[0.03]" />
        <div className="container relative mx-auto px-4 py-12 md:py-20">
          <div className="max-w-4xl mx-auto text-center space-y-6 md:space-y-8">
            <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold leading-tight">
              <span className="bg-gradient-to-r from-amber-600 via-orange-600 to-yellow-600 bg-clip-text text-transparent">
                Master Coding.
              </span>
              <br />
              <span className="text-foreground">Land Your Dream Job.</span>
            </h1>
            
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
              Practice DSA, compete in contests, prepare for aptitude tests, and discover your next opportunity — all in one place.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center pt-2 sm:pt-4 px-4">
              {session?.user ? (
                <Link href="/dashboard" className="w-full sm:w-auto">
                  <Button 
                    size="lg" 
                    className="gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg transition-all duration-300 hover:scale-105 w-full h-11 sm:h-12"
                  >
                    Go to Dashboard
                    <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                </Link>
              ) : (
                <Button 
                  size="lg" 
                  onClick={handleGoogleSignIn}
                  className="gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg transition-all duration-300 hover:scale-105 w-full sm:w-auto h-11 sm:h-12"
                >
                  Get Started Free
                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-12 sm:py-16 md:py-24">
        <div className="text-center mb-8 sm:mb-12 space-y-2 sm:space-y-3">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold px-4">
            Everything You Need to <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">Excel</span>
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
            Comprehensive tools to accelerate your tech career
          </p>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Link key={index} href={feature.href} className="block h-full">
                <Card className="group hover:shadow-xl transition-all duration-300 hover:scale-105 h-full cursor-pointer">
                  <CardHeader className="p-3 sm:p-4 md:p-6">
                    <div className={`p-2 sm:p-2.5 md:p-3 w-fit rounded-lg sm:rounded-xl bg-gradient-to-br ${feature.gradient} mb-2 sm:mb-2.5 md:mb-3 shadow-md group-hover:shadow-lg transition-shadow duration-300`}>
                      <Icon className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-white" />
                    </div>
                    <CardTitle className="text-sm sm:text-base md:text-lg lg:text-xl mb-1 sm:mb-1.5 leading-tight">
                      {feature.title}
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-xs md:text-sm lg:text-base leading-snug line-clamp-2 sm:line-clamp-3">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Developers Section */}
      <section className="container mx-auto px-4 py-12 sm:py-16 md:py-24 bg-gradient-to-br from-amber-50/50 to-orange-50/50 dark:from-gray-950/50 dark:to-black/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8 sm:mb-12 space-y-2 sm:space-y-3">
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800">
              <Heart className="h-3 w-3 sm:h-4 sm:w-4 text-amber-600 fill-amber-600" />
              <span className="text-xs sm:text-sm font-medium text-amber-700 dark:text-amber-400">
                Built with passion
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold px-4">
              Meet the <span className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">Developers</span>
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground px-4">
              Crafted by dedicated developers committed to your success
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 max-w-3xl mx-auto">
            {developers.map((dev, index) => (
              <div
                key={index}
                className="group relative overflow-hidden rounded-xl sm:rounded-2xl border-2 border-transparent hover:border-amber-500/20 bg-white dark:bg-gray-900 p-6 sm:p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${dev.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                <div className="relative space-y-3 sm:space-y-4">
                  <div className={`p-3 sm:p-4 w-fit rounded-lg sm:rounded-xl bg-gradient-to-br ${dev.gradient} shadow-lg mx-auto`}>
                    <User className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                  </div>
                  <div className="text-center space-y-1.5 sm:space-y-2">
                    <h3 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                      {dev.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground font-medium">
                      {dev.role}
                    </p>
                  </div>
                  
                  {/* Social Links */}
                  <div className="flex justify-center gap-2 sm:gap-3 pt-1 sm:pt-2">
                    <a
                      href={dev.socials.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 sm:p-2.5 rounded-lg bg-muted hover:bg-gray-800 hover:text-white dark:hover:bg-gray-700 transition-all duration-200 hover:scale-110"
                      aria-label="GitHub"
                    >
                      <Github className="h-4 w-4 sm:h-5 sm:w-5" />
                    </a>
                    <a
                      href={dev.socials.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 sm:p-2.5 rounded-lg bg-muted hover:bg-blue-600 hover:text-white transition-all duration-200 hover:scale-110"
                      aria-label="LinkedIn"
                    >
                      <Linkedin className="h-4 w-4 sm:h-5 sm:w-5" />
                    </a>
                    <a
                      href={dev.socials.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 sm:p-2.5 rounded-lg bg-muted hover:bg-gradient-to-br hover:from-purple-600 hover:to-pink-600 hover:text-white transition-all duration-200 hover:scale-110"
                      aria-label="Instagram"
                    >
                      <Instagram className="h-4 w-4 sm:h-5 sm:w-5" />
                    </a>
                    <a
                      href={dev.socials.whatsapp}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 sm:p-2.5 rounded-lg bg-muted hover:bg-green-600 hover:text-white transition-all duration-200 hover:scale-110"
                      aria-label="WhatsApp"
                    >
                      <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!session?.user && (
        <section className="container mx-auto px-4 py-12 sm:py-16 md:py-24">
          <div className="max-w-4xl mx-auto text-center space-y-4 sm:space-y-6 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl sm:rounded-2xl p-8 sm:p-10 md:p-16 shadow-xl">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
              Ready to Transform Your Career?
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-amber-50">
              Join thousands of developers advancing their skills with TalentPath
            </p>
            <Button 
              size="lg" 
              onClick={handleGoogleSignIn}
              className="gap-2 bg-white text-amber-600 hover:bg-amber-50 shadow-lg text-base sm:text-lg px-6 sm:px-8 transition-all duration-300 hover:scale-105 h-11 sm:h-12"
            >
              Start Your Journey
              <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t bg-muted/30 mt-12 sm:mt-16">
        <div className="container mx-auto px-4 py-8 sm:py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-6 sm:gap-8 mb-6 sm:mb-8">
            {/* Brand Section */}
            <div className="md:col-span-3 space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600">
                  <Code className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                  TalentPath
                </span>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Empowering careers, one line of code at a time.
              </p>
            </div>

            {/* Platform Links */}
            <div className="md:col-span-2">
              <h3 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Platform</h3>
              <ul className="space-y-1.5 sm:space-y-2">
                <li>
                  <Link href="/dashboard" className="text-xs sm:text-sm text-muted-foreground hover:text-amber-600 transition-colors duration-200">
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link href="/aptitude" className="text-xs sm:text-sm text-muted-foreground hover:text-amber-600 transition-colors duration-200">
                    Aptitude Tests
                  </Link>
                </li>
                <li>
                  <Link href="/compiler" className="text-xs sm:text-sm text-muted-foreground hover:text-amber-600 transition-colors duration-200">
                    Compiler
                  </Link>
                </li>
                <li>
                  <Link href="/contest" className="text-xs sm:text-sm text-muted-foreground hover:text-amber-600 transition-colors duration-200">
                    Contests
                  </Link>
                </li>
              </ul>
            </div>

            {/* Resources Links */}
            <div className="md:col-span-2">
              <h3 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Resources</h3>
              <ul className="space-y-1.5 sm:space-y-2">
                <li>
                  <Link href="/dsasheet" className="text-xs sm:text-sm text-muted-foreground hover:text-amber-600 transition-colors duration-200">
                    DSA Sheet
                  </Link>
                </li>
                <li>
                  <Link href="/roadmap" className="text-xs sm:text-sm text-muted-foreground hover:text-amber-600 transition-colors duration-200">
                    Roadmap
                  </Link>
                </li>
                <li>
                  <Link href="/jobs" className="text-xs sm:text-sm text-muted-foreground hover:text-amber-600 transition-colors duration-200">
                    Jobs
                  </Link>
                </li>
              </ul>
            </div>

            {/* Connect Section */}
            <div className="md:col-span-2">
              <h3 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Connect</h3>
              <a 
                href="mailto:contact@talentpath.com" 
                className="text-xs sm:text-sm text-muted-foreground hover:text-amber-600 transition-colors duration-200 flex items-center gap-2"
              >
                <Mail className="h-3 w-3 sm:h-4 sm:w-4" />
                Contact Us
              </a>
            </div>

            {/* Crafted by Section */}
            <div className="md:col-span-3">
              <h3 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Crafted by</h3>
              <div className="space-y-3 sm:space-y-4">
                {/* Developer 1 */}
                <div className="space-y-1.5">
                  <p className="text-xs sm:text-sm font-semibold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                    R.V.V. Swamy
                  </p>
                  <div className="flex gap-1.5 sm:gap-2">
                    <a 
                      href="https://github.com/swamyrayudu" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-1.5 rounded bg-muted hover:bg-gray-800 hover:text-white dark:hover:bg-gray-700 transition-all duration-200"
                      aria-label="GitHub - R.V.V. Swamy"
                    >
                      <Github className="h-3 w-3 sm:h-4 sm:w-4" />
                    </a>
                    <a 
                      href="https://www.linkedin.com/in/rayudu-veera-venkata-swamy/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-1.5 rounded bg-muted hover:bg-blue-600 hover:text-white transition-all duration-200"
                      aria-label="LinkedIn - R.V.V. Swamy"
                    >
                      <Linkedin className="h-3 w-3 sm:h-4 sm:w-4" />
                    </a>
                    <a 
                      href="https://www.instagram.com/swamy__rayudu/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-1.5 rounded bg-muted hover:bg-gradient-to-br hover:from-purple-600 hover:to-pink-600 hover:text-white transition-all duration-200"
                      aria-label="Instagram - R.V.V. Swamy"
                    >
                      <Instagram className="h-3 w-3 sm:h-4 sm:w-4" />
                    </a>
                    <a 
                      href="https://wa.me/917288819391" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-1.5 rounded bg-muted hover:bg-green-600 hover:text-white transition-all duration-200"
                      aria-label="WhatsApp - R.V.V. Swamy"
                    >
                      <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                    </a>
                  </div>
                </div>

                {/* Developer 2 */}
                <div className="space-y-1.5">
                  <p className="text-xs sm:text-sm font-semibold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                    P.S.V. Siva Durga Prasad
                  </p>
                  <div className="flex gap-1.5 sm:gap-2">
                    <a 
                      href="https://github.com/Durga62823" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-1.5 rounded bg-muted hover:bg-gray-800 hover:text-white dark:hover:bg-gray-700 transition-all duration-200"
                      aria-label="GitHub - P.S.V. Siva Durga Prasad"
                    >
                      <Github className="h-3 w-3 sm:h-4 sm:w-4" />
                    </a>
                    <a 
                      href="https://www.linkedin.com/in/durga-prasad-peddapalli-1616a8297/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-1.5 rounded bg-muted hover:bg-blue-600 hover:text-white transition-all duration-200"
                      aria-label="LinkedIn - P.S.V. Siva Durga Prasad"
                    >
                      <Linkedin className="h-3 w-3 sm:h-4 sm:w-4" />
                    </a>
                    <a 
                      href="https://www.instagram.com/the_addicted__person_78/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-1.5 rounded bg-muted hover:bg-gradient-to-br hover:from-purple-600 hover:to-pink-600 hover:text-white transition-all duration-200"
                      aria-label="Instagram - P.S.V. Siva Durga Prasad"
                    >
                      <Instagram className="h-3 w-3 sm:h-4 sm:w-4" />
                    </a>
                    <a 
                      href="https://wa.me/919030512334" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-1.5 rounded bg-muted hover:bg-green-600 hover:text-white transition-all duration-200"
                      aria-label="WhatsApp - P.S.V. Siva Durga Prasad"
                    >
                      <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-6 sm:pt-8 border-t border-border">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4 text-center sm:text-left">
              <p className="text-xs sm:text-sm text-muted-foreground">
                © 2025 TalentPath. All rights reserved.
              </p>
              <div className="flex gap-4 sm:gap-6">
                <Link href="/privacy" className="text-xs sm:text-sm text-muted-foreground hover:text-amber-600 transition-colors duration-200">
                  Privacy Policy
                </Link>
                <Link href="/terms" className="text-xs sm:text-sm text-muted-foreground hover:text-amber-600 transition-colors duration-200">
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
