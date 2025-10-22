'use client';

import React from 'react'
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { joinContest } from '@/actions/contest.actions';
import { toast } from 'sonner';
import { LogIn, Loader2, Lock } from 'lucide-react';

interface JoinContestButtonProps {
  contestId: string;
  visibility: 'public' | 'private';
}

export function JoinContestButton({ contestId, visibility }: JoinContestButtonProps) {
  const [open, setOpen] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const router = useRouter();

  const handleJoin = async () => {
    setIsLoading(true);

    try {
      const result = await joinContest(contestId, visibility === 'private' ? accessCode : undefined);

      if (result.success) {
        const message = result.message === 'Already joined' 
          ? 'You have already joined this contest!' 
          : 'Successfully joined the contest!';
        toast.success(message);
        setOpen(false);
        setHasJoined(true);
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to join contest');
      }
    } catch (error: Error | unknown) {
      toast.error(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Don't render if already joined
  if (hasJoined) {
    return null;
  }

  if (visibility === 'public') {
    return (
      <Button size="lg" onClick={handleJoin} disabled={isLoading} className="w-full">
        {isLoading ? (
          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
        ) : (
          <LogIn className="h-5 w-5 mr-2" />
        )}
        Join Contest
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="w-full">
          <Lock className="h-5 w-5 mr-2" />
          Join Private Contest
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Join Private Contest</DialogTitle>
          <DialogDescription>
            This is a private contest. Please enter the access code to join.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="accessCode">Access Code</Label>
            <Input
              id="accessCode"
              type="text"
              placeholder="Enter access code"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleJoin();
                }
              }}
            />
          </div>

          <Button onClick={handleJoin} disabled={isLoading || !accessCode.trim()} className="w-full">
            {isLoading ? (
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            ) : (
              <LogIn className="h-5 w-5 mr-2" />
            )}
            Join Contest
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
