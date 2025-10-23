import React from 'react';
import { Metadata } from 'next';
import DSAVisibilityManager from '@/components/admin/dsa-visibility-manager';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'DSA Sheet Management | Admin',
  description: 'Manage DSA Sheet problem visibility and settings',
};

export default async function DSAManagementPage() {
  const session = await auth();

  // @ts-expect-error - role exists on user but not in type definition
  if (!session || session.user?.role !== 'admin') {
    redirect('/dashboard');
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent mb-2">
          DSA Sheet Management
        </h1>
        <p className="text-muted-foreground text-lg">
          Control which problems are visible to users on the DSA sheet
        </p>
      </div>

      <DSAVisibilityManager />
    </div>
  );
}
