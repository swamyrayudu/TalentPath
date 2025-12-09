'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';

export function ActivityTracker() {
  const { data: session } = useSession();
  const lastUpdateRef = useRef<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Update user's active time
  const updateActivity = useCallback(async () => {
    if (!session?.user) return;
    
    // Throttle updates to once per minute minimum
    const now = Date.now();
    if (now - lastUpdateRef.current < 60000) return;
    lastUpdateRef.current = now;

    try {
      await fetch('/api/users/activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'activity' }),
      });
    } catch (error) {
      console.error('Failed to update activity:', error);
    }
  }, [session?.user]);

  // Update user's logout/leave time
  const updateLogout = useCallback(() => {
    if (!session?.user) return;
    
    // Use sendBeacon for reliable delivery on page close
    if (navigator.sendBeacon) {
      const data = JSON.stringify({ type: 'logout' });
      navigator.sendBeacon('/api/users/activity', data);
    }
  }, [session?.user]);

  useEffect(() => {
    if (!session?.user) return;

    // Update activity on initial load
    updateActivity();

    // Update activity periodically (every 5 minutes while user is active)
    intervalRef.current = setInterval(updateActivity, 5 * 60 * 1000);

    // Update activity when user interacts with the page
    const handleActivity = () => updateActivity();
    
    // Listen for visibility changes (when user switches back to tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updateActivity();
      } else {
        // User switched away from tab - update logout time
        updateLogout();
      }
    };

    // Update logout time before user leaves the page
    const handleBeforeUnload = () => {
      updateLogout();
    };

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handleBeforeUnload);
    
    // Track user interactions (throttled via updateActivity)
    document.addEventListener('click', handleActivity);
    document.addEventListener('scroll', handleActivity);
    document.addEventListener('keypress', handleActivity);

    return () => {
      // Cleanup
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handleBeforeUnload);
      document.removeEventListener('click', handleActivity);
      document.removeEventListener('scroll', handleActivity);
      document.removeEventListener('keypress', handleActivity);
    };
  }, [session?.user, updateActivity, updateLogout]);

  // This component doesn't render anything
  return null;
}
