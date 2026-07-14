'use client';
import React from 'react';
import Link from 'next/link';
import { Crown, ArrowLeft, Zap, Shield, Infinity as InfinityIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PremiumPage() {
  return (
    <div className="min-h-[calc(100vh-65px)] w-full bg-background flex items-center justify-center p-4">
      <div className="max-w-lg w-full text-center space-y-6">
        {/* Crown Icon */}
        <div className="flex justify-center">
          <div className="p-5 bg-amber-500/10 border border-amber-500/20 rounded-full">
            <Crown className="h-12 w-12 text-amber-500" strokeWidth={1.5} />
          </div>
        </div>

        {/* Coming Soon */}
        <div className="space-y-3">
          <span className="inline-block px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-xs font-semibold text-amber-500 uppercase tracking-wider">
            Coming Soon
          </span>
          
          <h1 className="text-3xl font-bold text-foreground">
            TalentPath Premium
          </h1>
          
          <p className="text-muted-foreground text-sm max-w-sm mx-auto">
            Unlock unlimited compilations, advanced features, and exclusive content.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-4 bg-muted/50 border border-border rounded-xl space-y-2">
            <InfinityIcon className="h-5 w-5 text-amber-500 mx-auto" />
            <p className="text-xs font-medium text-foreground">Unlimited Runs</p>
            <p className="text-[10px] text-muted-foreground">No rate limits</p>
          </div>
          <div className="p-4 bg-muted/50 border border-border rounded-xl space-y-2">
            <Zap className="h-5 w-5 text-orange-500 mx-auto" />
            <p className="text-xs font-medium text-foreground">Priority Queue</p>
            <p className="text-[10px] text-muted-foreground">Faster execution</p>
          </div>
          <div className="p-4 bg-muted/50 border border-border rounded-xl space-y-2">
            <Shield className="h-5 w-5 text-yellow-500 mx-auto" />
            <p className="text-xs font-medium text-foreground">Pro Content</p>
            <p className="text-[10px] text-muted-foreground">Exclusive problems</p>
          </div>
        </div>

        {/* Back Button */}
        <Link href="/compiler">
          <Button variant="outline" size="sm" className="mt-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Compiler
          </Button>
        </Link>
      </div>
    </div>
  );
}
