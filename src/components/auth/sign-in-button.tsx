'use client';

import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { LogIn } from 'lucide-react';

export function SignInButton() {
  const handleGoogleSignIn = async () => {
    await signIn('google', { callbackUrl: window.location.href });
  };

  return (
    <Button 
      size="lg" 
      onClick={handleGoogleSignIn}
      className="w-full gap-2 bg-amber-600 hover:bg-amber-700"
    >
      <LogIn className="h-5 w-5" />
      Sign In to Apply
    </Button>
  );
}
