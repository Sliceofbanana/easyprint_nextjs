'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'loading') return;

    if (!session?.user) {
      router.replace('/login');
      return;
    }

    const user = session.user as { role?: string };

    // Redirect to role-specific dashboard
    switch (user.role?.toUpperCase()) {
      case 'ADMIN':
        router.replace('/admin');
        break;
      case 'STAFF':
        router.replace('/staff');
        break;
      case 'USER':
        router.replace('/user');
        break;
      default:
        router.replace('/login');
    }
  }, [session, status, router]);

  return <p className="text-center mt-10">Redirecting...</p>;
}