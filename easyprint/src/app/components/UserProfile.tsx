'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { User, Save, Loader2, ArrowLeft } from 'lucide-react';
import { useToast } from '../components/ui/Use-Toast';
import Link from 'next/link';

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // ✅ Initialize form with session data
  useEffect(() => {
    if (session?.user) {
      setName(session.user.name || '');
      setEmail(session.user.email || '');
    }
  }, [session]);

  // ✅ Redirect if not authenticated
  useEffect(() => {
    if (!session && !isLoading) {
      router.push('/login');
    }
  }, [session, isLoading, router]);

  // ✅ Handle profile update
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Name cannot be empty',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update profile');
      }

      const data = await response.json();

      // ✅ Trigger immediate session refresh
      await update({
        ...session,
        user: {
          ...session?.user,
          name: data.user.name,
        },
      });

      toast({
        title: 'Profile Updated! ✅',
        description: 'Your profile has been updated successfully',
      });

      // ✅ Optional: Trigger custom event for other components
      window.dispatchEvent(new Event('profileUpdated'));

    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-900 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Back Button */}
        <Link 
          href="/dashboard"
          className="inline-flex items-center gap-2 text-blue-900 hover:text-blue-700 mb-6 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg border p-8"
        >
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-blue-900" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
              <p className="text-gray-600">Manage your account information</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleUpdateProfile} className="space-y-6">
            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter your full name"
                required
              />
            </div>

            {/* Email Field (Read-only) */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                disabled
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
            </div>

            {/* Account Type */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Account Type
              </label>
              <div className="px-4 py-3 border border-gray-300 rounded-lg bg-gray-50">
                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                  {session.user.role || 'CUSTOMER'}
                </span>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t pt-6">
              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={isSaving || name === session.user.name}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Save Changes
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setName(session.user.name || '');
                    toast({
                      title: 'Changes Discarded',
                      description: 'Your changes have been reset',
                    });
                  }}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                >
                  Reset
                </button>
              </div>
            </div>
          </form>

          {/* Info Box */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              💡 <strong>Tip:</strong> Your profile name will be updated across all your orders and account information.
            </p>
          </div>
        </motion.div>

        {/* Account Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-6 bg-white rounded-xl shadow-lg border p-6"
        >
          <h2 className="text-xl font-semibold mb-4">Account Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500 mb-1">Member Since</p>
              <p className="font-semibold">
                {(() => {
                  const createdAt = (session.user as any)?.createdAt;
                  return new Date(createdAt ?? Date.now()).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  });
                })()}
              </p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Account Status</p>
              <p className="font-semibold text-green-600">Active</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}