'use client';

import React from 'react';
import { useSession, signOut } from 'next-auth/react';
import AdminDashboard from '../components/AdminDashboard';
import Navbar from '../components/navbar';

export default function AdminPage() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <p className="text-center mt-10">Loading...</p>;
  }

  const user = session?.user as { id?: string; email?: string; role?: string };

  return (
   <>
      <Navbar
        user={{ name: user.name, role: user.role }}
        onLogout={() => signOut({ callbackUrl: '/login' })}
      />
      <AdminDashboard
        user={{ id: user.id || '', email: user.email || '', role: user.role }}
      />
    </>
  );
}