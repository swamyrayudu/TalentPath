'use client';

import { useSession } from 'next-auth/react';
import { useMemo } from 'react';

/**
 * Optimized session hook that caches the result and prevents unnecessary re-renders
 * Use this instead of useSession() directly in components that don't need real-time updates
 */
export function useCachedSession() {
  const { data: session, status } = useSession();
  
  // Memoize the session to prevent unnecessary re-renders
  const cachedSession = useMemo(() => session, [session?.user?.email]);
  
  return {
    session: cachedSession,
    status,
    isAuthenticated: !!cachedSession,
    isLoading: status === 'loading',
  };
}
