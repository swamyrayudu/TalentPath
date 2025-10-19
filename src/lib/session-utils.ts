/**
 * Session utility functions
 * Use these when you need to manually refresh the session
 */

/**
 * Force refresh the session from the client side
 * Call this after making changes that affect the user's session (e.g., role changes)
 * 
 * @example
 * ```tsx
 * import { refreshSession } from '@/lib/session-utils';
 * 
 * const updateUserRole = async () => {
 *   await fetch('/api/admin/update-role', { method: 'POST' });
 *   await refreshSession(); // Refresh session to get new role
 * };
 * ```
 */
export async function refreshSession() {
  // Trigger session update by dispatching a storage event
  if (typeof window !== 'undefined') {
    const event = new Event('visibilitychange');
    document.dispatchEvent(event);
  }
}
