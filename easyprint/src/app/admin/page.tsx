'use client';

import React from 'react';
import { useSession, signOut } from 'next-auth/react';
import AdminDashboard from '../components/AdminDashboard';

export default function AdminPage() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <p className="text-center mt-10">Loading...</p>;
  }

  const user = session?.user as { id?: string; email?: string; role?: string };

  return (
    <AdminDashboard
      user={{ id: user.id || '', email: user.email || '', role: user.role }}
    />
  );
}