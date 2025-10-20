'use client';

import React from 'react';
import { useSession, signOut } from 'next-auth/react';
import UserDashboard from '../components/UserDashboard';

export default function UserPage() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <p className="text-center mt-10">Loading...</p>;
  }

  const user = session?.user as { name?: string; email?: string };

  return (
    <UserDashboard
      user={{ name: user.name || 'User', email: user.email || '' }}
      onLogout={() => signOut({ callbackUrl: '/login' })}
    />
  );
}