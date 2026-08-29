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
import { ColorPicker } from './color-picker';
import Link from 'next/link';
import {
  Code,
  LogOut,
  Shield,
  Menu,
  Trophy,
  LayoutDashboard,
  FileSpreadsheet,
  Briefcase,
  Map,
  Brain,
  FileSearch,
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
  { name: 'ATS Score', href: '/ats', icon: FileSearch },
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
          <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-80">
            <img src="/talentpath-logo.svg" alt="TalentPath Logo" className="h-8 w-8" />
            <span className="text-[17px] font-semibold tracking-tight">TalentPath</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:gap-1">
            {navRoutes.map((route) => {
              const isActive = pathname === route.href || pathname.startsWith(`${route.href}/`);

              return (
                <Link
                  key={route.href}
                  href={route.href}
                  className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
                    isActive
                      ? 'bg-muted font-medium text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {route.name}
                </Link>
              );
            })}
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-2">
            <ColorPicker />
            <ModeToggle />

            {/* Desktop Auth - Profile Avatar or Sign In Button */}
            <div className="hidden md:block">
              {isLoading ? (
                <div className="h-9 w-9 animate-pulse rounded-full bg-muted" />
              ) : session?.user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="relative ml-1 h-9 w-9 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
                      <Avatar className="h-9 w-9 border">
                        <AvatarImage
                          src={session.user.image || ''}
                          alt={session.user.name || 'User'}
                        />
                        <AvatarFallback className="bg-muted font-medium">
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
                      <Link href="/dashboard" className="cursor-pointer">
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    {isAdmin && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href="/admin" className="cursor-pointer">
                            Admin Dashboard
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleSignOut}
                      className="cursor-pointer text-red-600 focus:text-red-600"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button onClick={handleGoogleSignIn} className="ml-1 rounded-full px-5 font-semibold">
                  Sign in
                </Button>
              )}
            </div>

            {/* Mobile Menu */}
            <div className="md:hidden">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Open menu">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80 overflow-y-auto sm:w-96">
                  <SheetHeader>
                    <SheetTitle className="flex items-center gap-2.5">
                      <img src="/talentpath-logo.svg" alt="TalentPath Logo" className="h-7 w-7" />
                      <span className="font-semibold tracking-tight">TalentPath</span>
                    </SheetTitle>
                  </SheetHeader>

                  <div className="mt-6 flex flex-col gap-6 px-4">
                    {/* User Info in Mobile (only if logged in) */}
                    {session?.user && (
                      <div className="rounded-xl border bg-card p-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-11 w-11 border">
                            <AvatarImage
                              src={session.user.image || ''}
                              alt={session.user.name || 'User'}
                            />
                            <AvatarFallback className="bg-muted font-medium">
                              {session.user.name?.charAt(0).toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1 space-y-1">
                            <p className="truncate text-sm font-semibold">{session.user.name}</p>
                            <p className="truncate text-xs text-muted-foreground">
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

                    {/* Navigation Links - Keep Icons in Mobile */}
                    <div className="space-y-1">
                      {navRoutes.map((route) => {
                        const Icon = route.icon;
                        const isActive = pathname === route.href || pathname.startsWith(`${route.href}/`);

                        return (
                          <Link
                            key={route.href}
                            href={route.href}
                            onClick={() => setMobileMenuOpen(false)}
                            className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm transition-colors ${
                              isActive
                                ? 'bg-muted font-medium text-foreground'
                                : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                            }`}
                          >
                            <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
                            <span>{route.name}</span>
                          </Link>
                        );
                      })}

                      {session?.user && isAdmin && (
                        <>
                          <div className="my-2 border-t" />
                          <Link
                            href="/admin"
                            onClick={() => setMobileMenuOpen(false)}
                            className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                          >
                            <Shield className="h-[18px] w-[18px]" strokeWidth={1.75} />
                            <span>Admin Dashboard</span>
                          </Link>
                        </>
                      )}
                    </div>

                    {/* Auth Actions */}
                    <div className="border-t pt-4">
                      {session?.user ? (
                        <Button
                          onClick={() => {
                            handleSignOut();
                            setMobileMenuOpen(false);
                          }}
                          variant="outline"
                          className="w-full gap-2 text-red-600 hover:text-red-600"
                        >
                          <LogOut className="h-4 w-4" />
                          Sign out
                        </Button>
                      ) : (
                        <Button
                          onClick={() => {
                            handleGoogleSignIn();
                            setMobileMenuOpen(false);
                          }}
                          className="w-full"
                        >
                          Sign in with Google
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
