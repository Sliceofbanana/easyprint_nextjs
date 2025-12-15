'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import UserDashboard from '../components/UserDashboard';
import Navbar from '../components/Navbar';

export default function UserPage() {
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

  const user = session?.user as { name?: string; email?: string; role?: string };

  return (
    <>
      <Navbar
        user={{ name: user.name, role: user.role }}
        onLogout={handleLogout}
      />
      <UserDashboard
        user={{ name: user.name || 'User', email: user.email || '' }}
        onLogout={handleLogout}
      />
    </>
  );
}