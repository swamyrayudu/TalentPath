'use client';

import { useEffect, useState, useCallback } from 'react';
import { updateNotificationPreferences } from '@/actions/notifications.actions';
import { toast } from 'sonner';

interface NotificationPermissionManagerProps {
  enabled?: boolean;
}

export function NotificationPermissionManager({ enabled = false }: NotificationPermissionManagerProps) {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      toast.error('Browser notifications not supported');
      return;
    }

    if (permission === 'granted') return;

    setIsRequesting(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === 'granted') {
        toast.success('Browser notifications enabled!');
        // Update user preferences
        await updateNotificationPreferences({
          browserNotifications: true,
        });

        // Show test notification
        new Notification('TalentPath Notifications', {
          body: 'You will now receive real-time notifications',
          icon: '/favicon.ico',
          badge: '/favicon.ico',
        });
      } else if (result === 'denied') {
        toast.error('Notification permission denied');
        await updateNotificationPreferences({
          browserNotifications: false,
        });
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast.error('Failed to enable notifications');
    } finally {
      setIsRequesting(false);
    }
  }, [permission]);

  // Auto-request permission if enabled is true and permission is default
  useEffect(() => {
    if (enabled && permission === 'default' && !isRequesting) {
      requestPermission();
    }
  }, [enabled, permission, isRequesting, requestPermission]);

  return null;
}

// Hook for sending browser notifications
export function useBrowserNotification() {
  const sendNotification = useCallback((title: string, options?: NotificationOptions) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options,
      });
    }
  }, []);

  return { sendNotification };
}
