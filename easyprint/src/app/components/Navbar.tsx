'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { User, LogOut, LayoutDashboard, Upload, Menu, X } from 'lucide-react';

type NavbarProps = {
  user?: { name?: string; role?: string };
  onLogout: () => void;
};

export default function Navbar({ user, onLogout }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-900 to-blue-700 rounded-lg flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-lg">MQ</span>
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">MQ Printing</p>
              <p className="text-xs text-orange-600 font-medium -mt-1">
                Easy Print
              </p>
            </div>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-4">
            <Link
              href="/order"
              className="px-4 py-2 bg-blue-900 text-white rounded-lg font-medium hover:bg-blue-800 transition-colors flex items-center space-x-2 shadow-md hover:shadow-lg"
            >
              <Upload className="w-4 h-4" />
              <span>New Order</span>
            </Link>

            <div className="flex items-center space-x-2 p-2 rounded-lg border border-gray-200 bg-gray-50">
              <div className="w-8 h-8 bg-blue-900 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="text-sm">
                <p className="font-medium text-gray-700">
                  {user?.name || 'User'}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {user?.role || 'user'}
                </p>
              </div>
            </div>

            <Link
              href="/dashboard"
              className="p-2 text-gray-600 hover:text-blue-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Dashboard"
            >
              <LayoutDashboard className="w-5 h-5" />
            </Link>

            <button
              onClick={onLogout}
              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-gray-200 py-4"
            >
              <div className="space-y-3">
                <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-blue-900 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">
                      {user?.name || 'User'}
                    </p>
                    <p className="text-sm text-gray-500 capitalize">
                      {user?.role || 'user'}
                    </p>
                  </div>
                </div>

                <Link
                  href="/dashboard"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center space-x-2 p-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <LayoutDashboard className="w-5 h-5" />
                  <span>Dashboard</span>
                </Link>

                <Link
                  href="/order"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center space-x-2 p-3 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors"
                >
                  <Upload className="w-5 h-5" />
                  <span>New Order</span>
                </Link>

                <button
                  onClick={() => {
                    onLogout();
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center space-x-2 p-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
