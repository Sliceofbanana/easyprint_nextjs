'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { User, LogOut, LayoutDashboard, Upload, Menu, X } from 'lucide-react';
import Image from 'next/image';

type NavbarProps = {
  user?: { name?: string; role?: string };
  onLogout: () => void;
};

export default function Navbar({ user, onLogout }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-auto h-12 relative flex-shrink-0">
              <Image
                src="/images/mq2-692025050cdb0.webp"
                alt="MQ Printing Logo"
                width={120}
                height={38}
                className="object-contain h-full w-auto"
                priority
              />
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

            {/* User Dropdown */}
            <div 
              className="relative"
              onMouseEnter={() => setIsUserDropdownOpen(true)}
              onMouseLeave={() => setIsUserDropdownOpen(false)}
            >
              <div className="flex items-center space-x-2 p-2 rounded-lg border border-gray-200 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors">
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

              {/* Dropdown Menu */}
              <AnimatePresence>
                {isUserDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden"
                  >
                    <Link
                      href="/dashboard"
                      className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-900 transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      <span className="font-medium">Dashboard</span>
                    </Link>
                    
                    <div className="border-t border-gray-100"></div>
                    
                    <button
                      onClick={onLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="font-medium">Logout</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
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
                    <Image
                      src="/images/logo.webp"
                      alt="MQ Printing"
                      width={40}
                      height={40}
                      className="object-contain rounded-full"
                    />
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