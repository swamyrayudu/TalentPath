'use client';
import React from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ModeToggle } from './mode-toggle';
import Link from 'next/link';
import { 
  Code, 
  LogIn, 
  LogOut,
  User,
  Shield,
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
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isLoading = status === 'loading';

  const handleGoogleSignIn = async () => {
    await signIn('google');
  };

  const handleSignOut = async () => {
    try {
      await signOut({ 
        callbackUrl: '/',
        redirect: true,
      });
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const userRole = (session?.user as { role?: string })?.role || 'user';
  const isAdmin = userRole === 'admin';

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link 
            href="/" 
            className="flex items-center space-x-2.5 transition-opacity duration-200 hover:opacity-80"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 shadow-md transition-transform duration-200 hover:scale-105">
              <Code className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 bg-clip-text text-transparent">
              TalentPath
            </h1>
          </Link>

          {/* Desktop Navigation - No Icons */}
          <div className="hidden md:flex md:items-center md:space-x-1">
            {navRoutes.map((route) => {
              const isActive = pathname === route.href;

              return (
                <Link
                  key={route.href}
                  href={route.href}
                  className="relative px-4 py-2 text-sm font-medium transition-all duration-300 group"
                >
                  <span
                    className={`relative z-10 transition-colors duration-300 ${
                      isActive
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-muted-foreground group-hover:text-foreground'
                    }`}
                  >
                    {route.name}
                  </span>

                  {/* Bottom border animation */}
                  <span
                    className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-amber-500 to-orange-600 transition-all duration-300 ${
                      isActive
                        ? 'w-full'
                        : 'w-0 group-hover:w-full'
                    }`}
                  />

                  {/* Hover background */}
                  <span
                    className={`absolute inset-0 rounded-lg bg-accent/50 transition-opacity duration-300 ${
                      isActive
                        ? 'opacity-0'
                        : 'opacity-0 group-hover:opacity-100'
                    }`}
                  />
                </Link>
              );
            })}
          </div>

          {/* Right Side */}
          <div className="flex items-center space-x-3">
            <div className="transition-transform duration-200 hover:scale-105">
              <ModeToggle />
            </div>
            
            {/* Desktop Auth - Profile Avatar or Sign In Button */}
            <div className="hidden md:block">
              {isLoading ? (
                <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
              ) : session?.user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="relative h-10 w-10 rounded-full transition-transform duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-amber-500/20">
                      <Avatar className="h-10 w-10 ring-2 ring-amber-500/20 transition-all duration-300 hover:ring-amber-500/40">
                        <AvatarImage 
                          src={session.user.image || ''} 
                          alt={session.user.name || 'User'} 
                        />
                        <AvatarFallback className="bg-gradient-to-br from-amber-500 to-amber-600 text-white font-semibold">
                          {session.user.name?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-64" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-2">
                        <p className="text-sm font-semibold leading-none">
                          {session.user.name}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {session.user.email}
                        </p>
                        <Badge 
                          variant={isAdmin ? 'default' : 'secondary'} 
                          className="w-fit"
                        >
                          <Shield className="mr-1 h-3 w-3" />
                          {userRole.toUpperCase()}
                        </Badge>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link 
                        href="/dashboard" 
                        className="cursor-pointer transition-colors duration-200"
                      >
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    {isAdmin && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link 
                            href="/admin" 
                            className="cursor-pointer transition-colors duration-200"
                          >
                            <Shield className="mr-2 h-4 w-4" />
                            <span>Admin Dashboard</span>
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={handleSignOut} 
                      className="cursor-pointer text-red-600 focus:text-red-600 transition-colors duration-200"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button 
                  onClick={handleGoogleSignIn}
                  className="gap-2 bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 hover:from-amber-600 hover:via-amber-700 hover:to-orange-700 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
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
                  <button className="inline-flex items-center justify-center rounded-md p-2 transition-all duration-200 hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/20">
                    <Menu className="h-6 w-6" />
                  </button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80 sm:w-96">
                  <SheetHeader>
                    <SheetTitle className="flex items-center space-x-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 shadow-md">
                        <Code className="h-4 w-4 text-white" />
                      </div>
                      <span className="bg-gradient-to-r from-amber-500 to-amber-600 bg-clip-text text-transparent">
                        TalentPath
                      </span>
                    </SheetTitle>
                  </SheetHeader>

                  <div className="mt-8 flex flex-col space-y-6">
                    {/* User Info in Mobile (only if logged in) */}
                    {session?.user && (
                      <div className="rounded-xl border p-4 bg-gradient-to-br from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20 backdrop-blur-sm transition-all duration-300 hover:shadow-md">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-12 w-12 ring-2 ring-amber-500/20">
                            <AvatarImage 
                              src={session.user.image || ''} 
                              alt={session.user.name || 'User'} 
                            />
                            <AvatarFallback className="bg-gradient-to-br from-amber-500 to-amber-600 text-white font-semibold">
                              {session.user.name?.charAt(0).toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-1">
                            <p className="text-sm font-semibold">{session.user.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{session.user.email}</p>
                            <Badge 
                              variant={isAdmin ? 'default' : 'secondary'} 
                              className="w-fit text-xs"
                            >
                              <Shield className="mr-1 h-3 w-3" />
                              {userRole.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Navigation Links - Keep Icons in Mobile */}
                    <div className="space-y-1">
                      {navRoutes.map((route) => {
                        const Icon = route.icon;
                        const isActive = pathname === route.href;
                        
                        return (
                          <Link
                            key={route.href}
                            href={route.href}
                            onClick={() => setMobileMenuOpen(false)}
                            className={`group flex items-center justify-between rounded-lg px-4 py-3 text-sm font-medium transition-all duration-300 ${
                              isActive
                                ? 'bg-gradient-to-r from-amber-500/10 to-orange-500/10 text-amber-600 dark:text-amber-400 shadow-sm'
                                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:translate-x-1'
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <Icon className="h-5 w-5" />
                              <span>{route.name}</span>
                            </div>
                            {isActive && (
                              <span className="h-2 w-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 animate-pulse" />
                            )}
                          </Link>
                        );
                      })}

                      {session?.user && isAdmin && (
                        <>
                          <div className="my-2 border-t" />
                          <Link
                            href="/admin"
                            onClick={() => setMobileMenuOpen(false)}
                            className="flex items-center space-x-3 rounded-lg px-4 py-3 text-sm font-medium text-muted-foreground transition-all duration-300 hover:bg-accent hover:text-accent-foreground hover:translate-x-1"
                          >
                            <Shield className="h-5 w-5" />
                            <span>Admin Dashboard</span>
                          </Link>
                        </>
                      )}
                    </div>

                    {/* Auth Actions */}
                    <div className="space-y-2 pt-4 border-t">
                      {session?.user ? (
                        <Button 
                          onClick={() => {
                            handleSignOut();
                            setMobileMenuOpen(false);
                          }}
                          variant="destructive"
                          className="w-full gap-2 transition-all duration-300 hover:scale-105"
                        >
                          <LogOut className="h-4 w-4" />
                          Sign Out
                        </Button>
                      ) : (
                        <Button 
                          onClick={() => {
                            handleGoogleSignIn();
                            setMobileMenuOpen(false);
                          }}
                          className="w-full gap-2 bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 hover:from-amber-600 hover:via-amber-700 hover:to-orange-700 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
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
