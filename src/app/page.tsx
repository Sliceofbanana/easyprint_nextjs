'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [mounted, setMounted] = useState(false);

  // ✅ Ensure component is mounted (hydration safety)
  useEffect(() => {
    setMounted(true);
  }, []);

  // ✅ Handle redirect after mount
  useEffect(() => {
    if (!mounted) return;

    if (status === 'loading') return;

    if (status === 'authenticated' && session) {
      router.replace('/dashboard');
    } else {
      router.replace('/login');
    }
  }, [mounted, status, session, router]);

  // ✅ Show loading spinner instead of null
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-blue-900 animate-spin mx-auto mb-4" />
        <p className="text-gray-600 font-medium">Loading MQ Printing...</p>
      </div>
    </div>
  );
}