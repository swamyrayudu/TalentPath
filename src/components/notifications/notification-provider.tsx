'use client';

import { useSession } from 'next-auth/react';
import { NotificationListener } from './notification-listener';

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();

  return (
    <>
      {children}
      {session?.user?.id && <NotificationListener userId={session.user.id} />}
    </>
  );
}
