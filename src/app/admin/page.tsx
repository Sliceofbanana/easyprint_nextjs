'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import AdminDashboard from '../components/AdminDashboard';
import Navbar from '../components/Navbar';
import { Loader2 } from 'lucide-react';

export default function AdminPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const handleLogout = async () => {
    try {
      await signOut({ redirect: false });
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      router.push('/login');
    }
  };

  React.useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/login');
      return;
    }
    const user = session.user as { role?: string };
    if (user.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  const user = session.user as { 
    id?: string; 
    email?: string; 
    role?: string; 
    name?: string 
  };

  return (
    <>
      <Navbar 
        user={{ name: user.name, role: user.role }}
        onLogout={handleLogout}
      />
      <AdminDashboard
        user={{ 
          id: user.id || '', 
          email: user.email || '', 
          role: user.role || 'USER',
          name: user.name
        }}
      />
    </>
  );
}