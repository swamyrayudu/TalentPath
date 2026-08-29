'use client';
import React from 'react';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { LogIn } from 'lucide-react';

export function SignInButton() {
  const handleGoogleSignIn = async () => {
    await signIn('google', { callbackUrl: window.location.href });
  };

  return (
    <Button size="lg" onClick={handleGoogleSignIn} className="w-full gap-2">
      <LogIn className="size-4" />
      Sign in with Google
    </Button>
  );
}
