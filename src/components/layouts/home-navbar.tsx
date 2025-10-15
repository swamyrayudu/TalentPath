'use client';

import { useSession, signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ModeToggle } from './mode-toggle';
import Link from 'next/link';
import { 
  Code, 
  LogIn, 
  Menu,
  Trophy,
  LayoutDashboard,
  FileSpreadsheet,
  Briefcase,
  Map,
  Brain
} from 'lucide-react';
import { useState } from 'react';
import { usePathname } from 'next/navigation';

const navRoutes = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Aptitude', href: '/aptitude', icon: Brain },
  { name: 'Compiler', href: '/compiler', icon: Code },
  { name: 'Contest', href: '/contest', icon: Trophy },
  { name: 'DSA Sheet', href: '/dsasheet', icon: FileSpreadsheet },
  { name: 'Jobs', href: '/jobs', icon: Briefcase },
  { name: 'Roadmap', href: '/roadmap', icon: Map },
];

export default function HomeNavbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleGoogleSignIn = async () => {
    await signIn('google', { callbackUrl: '/dashboard' });
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-amber-600">
              <Code className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-amber-500 to-amber-600 bg-clip-text text-transparent">
              TalentPath
            </h1>
          </Link>

          {/* Desktop Navigation - All routes visible */}
          <div className="hidden md:flex md:items-center md:space-x-1">
            {navRoutes.map((route) => {
              const Icon = route.icon;
              const isActive = pathname === route.href;
              
              return (
                <Link
                  key={route.href}
                  href={route.href}
                  className={`flex items-center space-x-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground ${
                    isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{route.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Right Side */}
          <div className="flex items-center space-x-2">
            <ModeToggle />
            
            {/* Desktop Auth */}
            <div className="hidden md:block">
              {session?.user ? (
                <Link href="/dashboard">
                  <Button className="gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700">
                    Go to Dashboard
                  </Button>
                </Link>
              ) : (
                <Button 
                  onClick={handleGoogleSignIn}
                  className="gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
                >
                  <LogIn className="h-4 w-4" />
                  Sign In
                </Button>
              )}
            </div>

            {/* Mobile Menu */}
            <div className="md:hidden">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80">
                  <SheetHeader>
                    <SheetTitle className="flex items-center space-x-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-amber-600">
                        <Code className="h-5 w-5 text-white" />
                      </div>
                      <span className="bg-gradient-to-r from-amber-500 to-amber-600 bg-clip-text text-transparent">
                        TalentPath
                      </span>
                    </SheetTitle>
                  </SheetHeader>

                  <div className="mt-8 flex flex-col space-y-4">
                    {/* Navigation Links */}
                    <div className="space-y-1">
                      {navRoutes.map((route) => {
                        const Icon = route.icon;
                        const isActive = pathname === route.href;
                        
                        return (
                          <Link
                            key={route.href}
                            href={route.href}
                            onClick={() => setMobileMenuOpen(false)}
                            className={`flex items-center space-x-3 rounded-md px-3 py-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground ${
                              isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
                            }`}
                          >
                            <Icon className="h-5 w-5" />
                            <span>{route.name}</span>
                          </Link>
                        );
                      })}
                    </div>

                    {/* Auth Actions */}
                    <div className="space-y-2 pt-4 border-t">
                      {session?.user ? (
                        <Link href="/dashboard">
                          <Button 
                            onClick={() => setMobileMenuOpen(false)}
                            className="w-full gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
                          >
                            Go to Dashboard
                          </Button>
                        </Link>
                      ) : (
                        <Button 
                          onClick={() => {
                            handleGoogleSignIn();
                            setMobileMenuOpen(false);
                          }}
                          className="w-full gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
                        >
                          <LogIn className="h-4 w-4" />
                          Sign In with Google
                        </Button>
                      )}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
