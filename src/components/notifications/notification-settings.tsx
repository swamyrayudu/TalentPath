'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Bell, Briefcase, Trophy, Mail, Monitor, Settings as SettingsIcon } from 'lucide-react';
import { getNotificationPreferences, updateNotificationPreferences } from '@/actions/notifications.actions';
import { toast } from 'sonner';
import { NotificationPermissionManager } from './notification-permission';

interface NotificationPreferences {
  jobNotifications: boolean;
  contestNotifications: boolean;
  systemNotifications: boolean;
  browserNotifications: boolean;
  emailNotifications: boolean;
}

export function NotificationSettings() {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    jobNotifications: true,
    contestNotifications: true,
    systemNotifications: true,
    browserNotifications: false,
    emailNotifications: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [requestBrowserPermission, setRequestBrowserPermission] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const result = await getNotificationPreferences();
      if (result.success && result.data) {
        setPreferences({
          jobNotifications: result.data.jobNotifications,
          contestNotifications: result.data.contestNotifications,
          systemNotifications: result.data.systemNotifications,
          browserNotifications: result.data.browserNotifications,
          emailNotifications: result.data.emailNotifications,
        });
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
      toast.error('Failed to load notification preferences');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async (key: keyof NotificationPreferences, value: boolean) => {
    const updatedPreferences = { ...preferences, [key]: value };
    setPreferences(updatedPreferences);

    // If enabling browser notifications, trigger permission request
    if (key === 'browserNotifications' && value) {
      setRequestBrowserPermission(true);
    }

    setIsSaving(true);
    try {
      const result = await updateNotificationPreferences({ [key]: value });
      if (result.success) {
        toast.success('Preferences updated');
      } else {
        toast.error('Failed to update preferences');
        // Revert on failure
        setPreferences(preferences);
      }
    } catch (error) {
      console.error('Failed to update preferences:', error);
      toast.error('Failed to update preferences');
      setPreferences(preferences);
    } finally {
      setIsSaving(false);
      if (key === 'browserNotifications') {
        setRequestBrowserPermission(false);
      }
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Settings
          </CardTitle>
          <CardDescription>Loading preferences...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
      <NotificationPermissionManager enabled={requestBrowserPermission} />
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5" />
            Notification Settings
          </CardTitle>
          <CardDescription>
            Manage how you receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Job Notifications */}
          <div className="flex items-center justify-between space-x-4">
            <div className="flex items-start gap-3 flex-1">
              <div className="mt-1">
                <Briefcase className="h-5 w-5 text-blue-500" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="job-notifications" className="font-medium cursor-pointer">
                  Job Postings
                </Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when new jobs or internships are posted
                </p>
              </div>
            </div>
            <Switch
              id="job-notifications"
              checked={preferences.jobNotifications}
              onCheckedChange={(checked) => handleToggle('jobNotifications', checked)}
              disabled={isSaving}
            />
          </div>

          {/* Contest Notifications */}
          <div className="flex items-center justify-between space-x-4">
            <div className="flex items-start gap-3 flex-1">
              <div className="mt-1">
                <Trophy className="h-5 w-5 text-emerald-500" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="contest-notifications" className="font-medium cursor-pointer">
                  Contests
                </Label>
                <p className="text-sm text-muted-foreground">
                  Get notified about contest start times and updates
                </p>
              </div>
            </div>
            <Switch
              id="contest-notifications"
              checked={preferences.contestNotifications}
              onCheckedChange={(checked) => handleToggle('contestNotifications', checked)}
              disabled={isSaving}
            />
          </div>

          {/* System Notifications */}
          <div className="flex items-center justify-between space-x-4">
            <div className="flex items-start gap-3 flex-1">
              <div className="mt-1">
                <Bell className="h-5 w-5 text-purple-500" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="system-notifications" className="font-medium cursor-pointer">
                  System Announcements
                </Label>
                <p className="text-sm text-muted-foreground">
                  Important updates and announcements from TalentPath
                </p>
              </div>
            </div>
            <Switch
              id="system-notifications"
              checked={preferences.systemNotifications}
              onCheckedChange={(checked) => handleToggle('systemNotifications', checked)}
              disabled={isSaving}
            />
          </div>

          <div className="border-t pt-6">
            <h4 className="font-medium mb-4">Notification Channels</h4>
            <div className="space-y-4">
              {/* Browser Notifications */}
              <div className="flex items-center justify-between space-x-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="mt-1">
                    <Monitor className="h-5 w-5 text-orange-500" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="browser-notifications" className="font-medium cursor-pointer">
                      Browser Notifications
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Receive real-time notifications in your browser
                    </p>
                  </div>
                </div>
                <Switch
                  id="browser-notifications"
                  checked={preferences.browserNotifications}
                  onCheckedChange={(checked) => handleToggle('browserNotifications', checked)}
                  disabled={isSaving}
                />
              </div>

              {/* Email Notifications */}
              <div className="flex items-center justify-between space-x-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="mt-1">
                    <Mail className="h-5 w-5 text-rose-500" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="email-notifications" className="font-medium cursor-pointer">
                      Email Notifications
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via email
                    </p>
                  </div>
                </div>
                <Switch
                  id="email-notifications"
                  checked={preferences.emailNotifications}
                  onCheckedChange={(checked) => handleToggle('emailNotifications', checked)}
                  disabled={isSaving}
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              💡 Tip: Enable browser notifications for real-time updates about contests and jobs
            </p>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
