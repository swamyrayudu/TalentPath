import React from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getUserDetailsById } from '@/actions/admin-user-details';
import { UserDetailsView } from '@/components/admin/user-details-view';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface UserSession {
  id?: string;
  name?: string;
  email?: string;
  image?: string;
  role?: string;
  emailVerified?: boolean | string | null;
}

export default async function UserDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const { id } = await params;

  // Check if user is logged in
  if (!session?.user) {
    redirect('/');
  }

  const role = (session.user as UserSession)?.role ?? 'user';
  if (String(role).toLowerCase() !== 'admin') {
    redirect('/');
  }

  let userDetails;
  try {
    userDetails = await getUserDetailsById(id);
  } catch (error) {
    return (
      <div className="container mx-auto p-8">
        <div className="mb-6">
          <Button variant="ghost" asChild>
            <Link href="/admin/viewuser" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Users
            </Link>
          </Button>
        </div>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-destructive">User Not Found</h1>
          <p className="text-muted-foreground mt-2">
            {error instanceof Error ? error.message : 'The requested user could not be found.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link href="/admin/viewuser" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Users
          </Link>
        </Button>
      </div>
      
      <UserDetailsView data={userDetails} />
    </div>
  );
}
