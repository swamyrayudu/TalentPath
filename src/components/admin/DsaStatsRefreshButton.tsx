'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function DsaStatsRefreshButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleRefresh = async () => {
    setLoading(true);
    setMessage(null);
    
    try {
      const response = await fetch('/api/dsa-stats', {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setMessage({ 
          type: 'success', 
          text: `${data.message} - Updated at ${new Date(data.timestamp).toLocaleTimeString()}` 
        });
        
        // Clear cache so next visit fetches fresh data
        const difficulties = ['EASY', 'MEDIUM', 'HARD'];
        const platforms = ['LEETCODE', 'GEEKSFORGEEKS'];
        difficulties.forEach(diff => {
          platforms.forEach(platform => {
            sessionStorage.removeItem(`dsa-stats-v2-${diff}-${platform}`);
            sessionStorage.removeItem(`dsa-stats-v2-${diff}-${platform}-timestamp`);
          });
        });
        
        setTimeout(() => setMessage(null), 5000);
      } else {
        setMessage({ 
          type: 'error', 
          text: data.error || 'Failed to refresh statistics' 
        });
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="w-5 h-5" />
          DSA Topic Statistics
        </CardTitle>
        <CardDescription>
          Manually refresh the optimized topic statistics table. 
          This happens automatically when problems are added/edited/deleted, but you can trigger it manually here.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={handleRefresh} 
          disabled={loading}
          className="w-full sm:w-auto"
        >
          {loading ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Refreshing...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Stats Now
            </>
          )}
        </Button>
        
        {message && (
          <Alert 
            className="mt-4" 
            variant={message.type === 'error' ? 'destructive' : 'default'}
          >
            {message.type === 'success' ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
