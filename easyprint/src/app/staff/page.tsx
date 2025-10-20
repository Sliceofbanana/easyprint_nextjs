'use client';

import React from 'react';
import { useSession, signOut } from 'next-auth/react';
import StaffDashboard from '../components/StaffDashboard';
import Navbar from '../components/navbar';

export default function StaffPage() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <p className="text-center mt-10">Loading...</p>;
  }

  const user = session?.user as { id?: string; email?: string; name?: string };

  return (
    <>
      <Navbar
        user={{ name: user.name, role: user.role }}
        onLogout={() => signOut({ callbackUrl: '/login' })}
      />
      <StaffDashboard
        user={{ id: user.id || '', email: user.email || '', name: user.name }}
        onLogout={() => signOut({ callbackUrl: '/login' })}
      />
    </>
  );
}