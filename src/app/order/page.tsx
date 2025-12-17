'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import OrderSystem from '../components/OrderSystem';
import Navbar from '../components/Navbar';

export default function OrderPage() {
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
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const user = session?.user as { name?: string; role?: string };

  return (
    <>
      <Navbar
        user={{ name: user?.name, role: user?.role }}
        onLogout={handleLogout}
      />
      <OrderSystem onBack={() => router.push('/dashboard')} />
    </>
  );
}