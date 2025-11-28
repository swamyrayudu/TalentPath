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
import { LogOut, Shield, Menu } from 'lucide-react';
import { ModeToggle } from './mode-toggle';
import { ColorPicker } from './color-picker';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const navRoutes = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Aptitude', href: '/aptitude' },
  { name: 'Compiler', href: '/compiler' },
  { name: 'Contest', href: '/contest' },
  { name: 'DSA Sheet', href: '/dsasheet' },
  { name: 'Jobs', href: '/jobs' },
  { name: 'Roadmap', href: '/roadmap' },
];

export default function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isLoading = status === 'loading';

  const handleGoogleSignIn = async () => {
    try {
      await signIn('google', {
        callbackUrl: '/dashboard',
        redirect: true,
      });
    } catch (error) {
      console.error('Sign in error:', error);
    }
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
            <img 
              src="/talentpath-logo.svg" 
              alt="TalentPath Logo" 
              className="h-10 w-10 transition-transform duration-200 hover:scale-105"
            />
            <h1 className="text-xl font-bold tracking-tight text-primary">
              TalentPath
            </h1>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex lg:items-center lg:space-x-1">
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
                        ? 'text-primary'
                        : 'text-muted-foreground group-hover:text-foreground'
                    }`}
                  >
                    {route.name}
                  </span>

                  {/* Bottom border animation */}
                  <span
                    className={`absolute bottom-0 left-0 h-0.5 bg-primary transition-all duration-300 ${
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

          {/* Right Side Actions */}
          <div className="flex items-center space-x-3">
            <div className="transition-transform duration-200 hover:scale-105">
              <ColorPicker />
            </div>
            <div className="transition-transform duration-200 hover:scale-105">
              <ModeToggle />
            </div>

            {/* Desktop User Menu */}
            <div className="hidden md:block">
              {isLoading ? (
                <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
              ) : session?.user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="relative h-10 w-10 rounded-full transition-transform duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary/20">
                      <Avatar className="h-10 w-10 ring-2 ring-primary/20 transition-all duration-300 hover:ring-primary/40">
                        <AvatarImage
                          src={session.user.image || ''}
                          alt={session.user.name || 'User'}
                        />
                        <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
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
                        Profile
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
                            Admin Dashboard
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
                  className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
                >
                  Sign In
                </Button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="lg:hidden">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <button className="inline-flex items-center justify-center rounded-md p-2 transition-all duration-200 hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-primary/20">
                    <Menu className="h-6 w-6" />
                  </button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80 sm:w-96 overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle className="flex items-center space-x-2">
                      <img 
                        src="/talentpath-logo.svg" 
                        alt="TalentPath Logo" 
                        className="h-8 w-8"
                      />
                      <span className="text-primary font-bold">
                        TalentPath
                      </span>
                    </SheetTitle>
                  </SheetHeader>

                  <div className="mt-8 flex flex-col space-y-6">
                    {/* User Info Card */}
                    {session?.user && (
                      <div className="rounded-xl border p-4 bg-primary/5 backdrop-blur-sm transition-all duration-300 hover:shadow-md">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                            <AvatarImage
                              src={session.user.image || ''}
                              alt={session.user.name || 'User'}
                            />
                            <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                              {session.user.name?.charAt(0).toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-1">
                            <p className="text-sm font-semibold">
                              {session.user.name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {session.user.email}
                            </p>
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

                    {/* Mobile Navigation Links */}
                    <div className="space-y-1">
                      {navRoutes.map((route) => {
                        const isActive = pathname === route.href;

                        return (
                          <Link
                            key={route.href}
                            href={route.href}
                            onClick={() => setMobileMenuOpen(false)}
                            className={`group flex items-center justify-between rounded-lg px-4 py-3 text-sm font-medium transition-all duration-300 ${
                              isActive
                                ? 'bg-primary/10 text-primary shadow-sm'
                                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:translate-x-1'
                            }`}
                          >
                            <span>{route.name}</span>
                            {isActive && (
                              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
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
                            className="flex items-center rounded-lg px-4 py-3 text-sm font-medium text-muted-foreground transition-all duration-300 hover:bg-accent hover:text-accent-foreground hover:translate-x-1"
                          >
                            Admin Dashboard
                          </Link>
                        </>
                      )}
                    </div>

                    {/* Auth Button */}
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
                          className="w-full gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
                        >
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
