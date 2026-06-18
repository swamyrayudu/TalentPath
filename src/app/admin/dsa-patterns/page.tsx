import React from 'react';
import { Metadata } from 'next';
import DSAPatternsManager from '@/components/admin/dsa-patterns-manager';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'DSA Patterns Management | Admin',
  description: 'Create and manage patterns for the DSA Practice Sheet',
};

export default async function DSAPatternsPage() {
  const session = await auth();

  // @ts-expect-error - role exists on user but not in type definition
  if (!session || session.user?.role !== 'admin') {
    redirect('/dashboard');
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent mb-2">
          DSA Patterns Management
        </h1>
        <p className="text-muted-foreground text-lg">
          Group problems into structural design patterns (e.g. Sliding Window, Two Pointers)
        </p>
      </div>

      <DSAPatternsManager />
    </div>
  );
}
