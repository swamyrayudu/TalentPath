
'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';

export default function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <SessionProvider 
      // Disable automatic refetching - only fetch when explicitly needed
      refetchInterval={0}
      // Don't refetch on window focus
      refetchOnWindowFocus={false}
      // Cache session - don't refetch unnecessarily
      refetchWhenOffline={false}
    >
      {children}
    </SessionProvider>
  );
}
