'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import StaffDashboard from '../components/StaffDashboard';
import Navbar from '../components/Navbar';

export default function StaffPage() {
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

  const user = session?.user as { id?: string; email?: string; name?: string; role?: string };

  return (
    <>
      <Navbar
        user={{ name: user.name, role: user.role }}
        onLogout={handleLogout}
      />
      <StaffDashboard
        user={{ id: user.id || '', email: user.email || '', name: user.name }}
      />
    </>
  );
}