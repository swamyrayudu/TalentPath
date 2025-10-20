'use client';

import { useEffect, useCallback, useState } from 'react';
import { useBrowserNotification } from './notification-permission';
import { toast } from 'sonner';

interface NotificationListenerProps {
  userId: string;
}

export function NotificationListener({ userId }: NotificationListenerProps) {
  const { sendNotification } = useBrowserNotification();
  const [lastCheck, setLastCheck] = useState(Date.now());

  const checkForNewNotifications = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications');
      const data = await response.json();
      
      if (data.success && data.data) {
        const newNotifications = data.data.filter(
          (notification: any) => 
            new Date(notification.createdAt).getTime() > lastCheck &&
            !notification.read
        );

        newNotifications.forEach((notification: any) => {
          // Show browser notification
          sendNotification(notification.title, {
            body: notification.message,
            tag: notification.id,
            requireInteraction: notification.type === 'contest_starting',
            data: {
              url: notification.link,
            },
          });

          // Show toast notification
          toast.info(notification.title, {
            description: notification.message,
            action: notification.link ? {
              label: 'View',
              onClick: () => {
                window.location.href = notification.link;
              },
            } : undefined,
          });
        });

        if (newNotifications.length > 0) {
          setLastCheck(Date.now());
        }
      }
    } catch (error) {
      console.error('Failed to check for notifications:', error);
    }
  }, [lastCheck, sendNotification]);

  useEffect(() => {
    // Check for new notifications every 15 seconds
    const interval = setInterval(checkForNewNotifications, 15000);

    // Also check when the page becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkForNewNotifications();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkForNewNotifications]);

  // Handle notification clicks
  useEffect(() => {
    const handleNotificationClick = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail?.url) {
        window.location.href = customEvent.detail.url;
      }
    };

    if ('Notification' in window) {
      // @ts-ignore
      window.addEventListener('notificationclick', handleNotificationClick);
      return () => {
        // @ts-ignore
        window.removeEventListener('notificationclick', handleNotificationClick);
      };
    }
  }, []);

  return null;
}
