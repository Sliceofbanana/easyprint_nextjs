'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import AdminDashboard from '../components/AdminDashboard';
import StaffDashboard from '../components/StaffDashboard';
import UserDashboard from '../components/UserDashboard';
import Navbar from '../components/Navbar';
import { signOut } from 'next-auth/react';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    
    setLoading(false);
  }, [status, router]);

  // ✅ FIXED: Proper logout handler
  const handleLogout = async () => {
    try {
      await signOut({ 
        redirect: true,
        callbackUrl: '/login' 
      });
    } catch (error) {
      console.error('Logout error:', error);
      // Fallback: force redirect even if signOut fails
      router.push('/login');
    }
  };

  if (loading || status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  const userRole = session.user.role?.toUpperCase();

  const renderDashboard = () => {
    switch (userRole) {
      case 'ADMIN':
        return (
          <AdminDashboard 
            user={{
              id: session.user.id,
              email: session.user.email,
              role: session.user.role,
            }}
          />
        );

      case 'STAFF':
        return (
          <StaffDashboard
            user={{
              id: session.user.id,
              email: session.user.email,
              name: session.user.name || undefined,
            }}
            onLogout={handleLogout}
          />
        );

      case 'CUSTOMER':
      default:
        return (
          <UserDashboard
            user={{
              name: session.user.name || undefined,
              email: session.user.email,
            }}
            onLogout={handleLogout}
          />
        );
    }
  };

  // ✅ FIXED: Pass handleLogout to Navbar
  return (
    <>
      <Navbar 
        user={{ 
          name: session.user.name || undefined, 
          role: session.user.role 
        }}
        onLogout={handleLogout}
      />
      {renderDashboard()}
    </>
  );
}