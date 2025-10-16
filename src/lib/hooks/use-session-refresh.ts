
'use client';

import { useSession } from 'next-auth/react';
import { useEffect } from 'react';

export function useSessionRefresh(intervalMs: number = 5000) {
  const { data: session, update } = useSession();

  useEffect(() => {
    // Refresh session every 5 seconds to check for role changes
    const interval = setInterval(async () => {
      await update();
    }, intervalMs);

    return () => clearInterval(interval);
  }, [update, intervalMs]);

  return session;
}
