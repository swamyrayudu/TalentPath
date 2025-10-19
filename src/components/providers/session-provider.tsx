
'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';

export default function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <SessionProvider 
      // Refetch session only every 5 minutes instead of on every page change
      refetchInterval={5 * 60}
      // Don't refetch on window focus - prevents constant API calls when switching tabs
      refetchOnWindowFocus={false}
    >
      {children}
    </SessionProvider>
  );
}
