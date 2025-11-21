'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import AdminDashboard from '../components/AdminDashboard';
import Navbar from '../components/navbar';

export default function AdminPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  // ✅ FIXED: Proper logout handler
  const handleLogout = async () => {
    try {
      await signOut({ 
        redirect: true,
        callbackUrl: '/login' 
      });
    } catch (error) {
      console.error('Logout error:', error);
      router.push('/login');
    }
  };

  if (status === 'loading') {
    return <p className="text-center mt-10">Loading...</p>;
  }

  const user = session?.user as { id?: string; email?: string; role?: string; name?: string };

  return (
   <>
      <Navbar
        user={{ name: user.name, role: user.role }}
        onLogout={handleLogout}
      />
      <AdminDashboard
        user={{ id: user.id || '', email: user.email || '', role: user.role }}
      />
    </>
  );
}