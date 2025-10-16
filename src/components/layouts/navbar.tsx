'use client';

import { signIn, signOut } from 'next-auth/react';
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
import { 
  LogIn, 
  LogOut, 
  User, 
  Shield, 
  Menu,
  Code,
  Trophy,
  LayoutDashboard,
  FileSpreadsheet,
  Briefcase,
  Map,
  Brain
} from 'lucide-react';
import { ModeToggle } from './mode-toggle';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useSessionRefresh } from '../../lib/hooks/use-session-refresh';

const navRoutes = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Aptitude', href: '/aptitude', icon: Brain },
  { name: 'Compiler', href: '/compiler', icon: Code },
  { name: 'Contest', href: '/contest', icon: Trophy },
  { name: 'DSA Sheet', href: '/dsasheet', icon: FileSpreadsheet },
  { name: 'Jobs', href: '/jobs', icon: Briefcase },
  { name: 'Roadmap', href: '/roadmap', icon: Map },
];

export default function Navbar() {
  // Use auto-refresh hook instead of useSession
  const session = useSessionRefresh(5000); // Refresh every 5 seconds
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isLoading = !session;

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

  const userRole = (session?.user as any)?.role || 'user';
  const isAdmin = userRole === 'admin';

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-amber-600">
              <Code className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-amber-500 to-amber-600 bg-clip-text text-transparent">
              TalentPath
            </h1>
          </Link>

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

          <div className="flex items-center space-x-2">
            <ModeToggle />

            <div className="hidden md:block">
              {isLoading ? (
                <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
              ) : session?.user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar className="h-10 w-10 ring-2 ring-amber-500/20">
                        <AvatarImage 
                          src={session.user.image || ''} 
                          alt={session.user.name || 'User'} 
                        />
                        <AvatarFallback className="bg-gradient-to-br from-amber-500 to-amber-600 text-white">
                          {session.user.name?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-64" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-2">
                        <p className="text-sm font-medium leading-none">
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
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    {isAdmin && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href="/admin" className="cursor-pointer">
                            <Shield className="mr-2 h-4 w-4" />
                            <span>Admin Dashboard</span>
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-red-600 focus:text-red-600">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button onClick={handleGoogleSignIn} className="gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700">
                  <LogIn className="h-4 w-4" />
                  Sign In
                </Button>
              )}
            </div>

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
                    {session?.user && (
                      <div className="rounded-lg border p-4 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-12 w-12 ring-2 ring-amber-500/20">
                            <AvatarImage 
                              src={session.user.image || ''} 
                              alt={session.user.name || 'User'} 
                            />
                            <AvatarFallback className="bg-gradient-to-br from-amber-500 to-amber-600 text-white">
                              {session.user.name?.charAt(0).toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium">{session.user.name}</p>
                            <p className="text-xs text-muted-foreground">{session.user.email}</p>
                            <Badge 
                              variant={isAdmin ? 'default' : 'secondary'} 
                              className="w-fit"
                            >
                              <Shield className="mr-1 h-3 w-3" />
                              {userRole.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    )}

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
                      
                      {session?.user && isAdmin && (
                        <>
                          <div className="my-2 border-t" />
                          <Link
                            href="/admin"
                            onClick={() => setMobileMenuOpen(false)}
                            className="flex items-center space-x-3 rounded-md px-3 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                          >
                            <Shield className="h-5 w-5" />
                            <span>Admin Dashboard</span>
                          </Link>
                        </>
                      )}
                    </div>

                    <div className="space-y-2 pt-4 border-t">
                      {session?.user ? (
                        <Button 
                          onClick={() => {
                            handleSignOut();
                            setMobileMenuOpen(false);
                          }}
                          variant="destructive"
                          className="w-full gap-2"
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
