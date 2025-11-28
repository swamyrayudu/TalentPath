'use client';
import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { deleteContest } from '@/actions/contest.actions';
import { useState, useEffect } from 'react';
import { Copy, Trash2 } from 'lucide-react';
import type { contests } from '@/lib/db/schema';
import type { InferSelectModel } from 'drizzle-orm';

type Contest = InferSelectModel<typeof contests>;

interface ContestSettingsProps {
  contest: Contest;
}

export function ContestSettings({ contest }: ContestSettingsProps) {
  const router = useRouter();
  const [contestUrl, setContestUrl] = useState('');

  useEffect(() => {
    setContestUrl(`${window.location.origin}/contest/${contest.slug}`);
  }, [contest.slug]);

  const copyLink = () => {
    navigator.clipboard.writeText(contestUrl);
    toast.success('Contest link copied!');
  };

  const copyAccessCode = () => {
    if (contest.accessCode) {
      navigator.clipboard.writeText(contest.accessCode);
      toast.success('Access code copied!');
    }
  };

  const handleDelete = async () => {
    const result = await deleteContest(contest.id);
    if (result.success) {
      toast.success('Contest deleted successfully');
      router.push('/contest');
      router.refresh();
    } else {
      toast.error(result.error || 'Failed to delete contest');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Share Contest</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">Contest URL</p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={contestUrl}
                readOnly
                className="flex-1 px-3 py-2 text-sm border rounded-md bg-muted"
              />
              <Button size="sm" onClick={copyLink}>
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
            </div>
          </div>

          {contest.visibility === 'private' && contest.accessCode && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Access Code</p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={contest.accessCode}
                  readOnly
                  className="flex-1 px-3 py-2 text-sm border rounded-md bg-muted font-mono"
                />
                <Button size="sm" onClick={copyAccessCode}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-red-200 dark:border-red-800">
        <CardHeader>
          <CardTitle className="text-red-600 dark:text-red-400">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Contest
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete the contest and all associated questions and submissions. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <p className="text-sm text-muted-foreground mt-2">
            This will permanently delete the contest and all associated questions and submissions.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
