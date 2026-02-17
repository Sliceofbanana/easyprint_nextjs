'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import {
  Package,
  Clock,
  CheckCircle,
  Truck,
  FilePlus,
  User,
  HelpCircle,
  CreditCard,
  History,
  TrendingUp,
  Archive,
  LucideIcon,
} from 'lucide-react';
import { useToast } from '../components/ui/Use-Toast';
import { isCurrentMonth } from '@/lib/archive';

interface Order {
  id: string;
  orderNumber?: string;
  total: number;
  totalPrice: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
  filesDeletedAt?: string;
  estimatedCompletion?: string;
  customerName: string;
  customerEmail: string;
  paperSize?: string;
  colorType?: string;
  copies?: number;
  pages?: number;
  details: {
    contactName: string;
    contactEmail: string;
  };
}

interface UserDashboardProps {
  user: { name?: string; email: string };
}

export default function UserDashboard({ user: initialUser }: UserDashboardProps) {
  const { data: session, update } = useSession(); 
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [archivedOrders, setArchivedOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'history' | 'archive'>('active');
  const { toast } = useToast();
  
  const [userData, setUserData] = useState<{ name?: string; email: string }>(initialUser);

  useEffect(() => {
    if (session?.user) {
      const newName = session.user.name || undefined;
      const newEmail = session.user.email || '';
      
      // Only update if data actually changed
      if (userData.name !== newName || userData.email !== newEmail) {
        setUserData({ name: newName, email: newEmail });
      }
    }
  }, [session?.user?.name, session?.user?.email]);

  useEffect(() => {
    const handleProfileUpdate = async () => {
      const updated = await update();
      
      if (updated?.user) {
        setUserData({
          name: updated.user.name || undefined,
          email: updated.user.email || '',
        });
      }
    };
    
    window.addEventListener('profileUpdated', handleProfileUpdate);
    return () => window.removeEventListener('profileUpdated', handleProfileUpdate);
  }, [update]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/orders');
        if (!response.ok) throw new Error('Failed to fetch orders');
        
        const data = await response.json();
        
        setOrders(data);
        
        // ✅ Active orders: Current month, not completed/cancelled
        const active = data.filter((o: Order) => {
          const isCurrentMonthOrder = isCurrentMonth(new Date(o.createdAt));
          const isNotCompleted = !['COMPLETED', 'CANCELLED'].includes(o.status);
          return isCurrentMonthOrder && isNotCompleted;
        });
        
        // ✅ Archived orders: Previous months
        const archived = data.filter((o: Order) => 
          !isCurrentMonth(new Date(o.createdAt))
        );
        
        setActiveOrders(active);
        setArchivedOrders(archived);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load orders',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
    const interval = setInterval(fetchOrders, 15000);
    return () => clearInterval(interval);
  }, [toast]);

  const getStatusInfo = (status: string) => {
    const info: Record<string, { label: string; icon: LucideIcon; color: string }> = {
      PENDING: { label: 'Awaiting Payment', icon: CreditCard, color: 'text-yellow-600' },
      PAYMENT_RECEIVED: { label: 'Payment Confirmed', icon: CheckCircle, color: 'text-teal-600' },
      PROCESSING: { label: 'Processing', icon: Clock, color: 'text-blue-600' },
      READY: { label: 'Ready for Pickup', icon: Package, color: 'text-indigo-600' },
      ON_DELIVERY: { label: 'Out for Delivery', icon: Truck, color: 'text-purple-600' },
      COMPLETED: { label: 'Completed', icon: CheckCircle, color: 'text-green-600' },
      CANCELLED: { label: 'Cancelled', icon: HelpCircle, color: 'text-red-600' },
    };
    return info[status] || { label: 'Unknown', icon: HelpCircle, color: 'text-gray-500' };
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'active':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {activeOrders.length > 0 ? (
              activeOrders.map((order) => (
                <div key={order.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow bg-white">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-bold text-blue-900">
                        {order.orderNumber || `Order #${order.id.slice(0, 8)}`}
                      </p>
                      <p className="text-sm text-gray-500">
                        Placed on: {new Date(order.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <p className="font-semibold text-lg text-gray-900">
                      ₱{(order.totalPrice || order.total || 0).toFixed(2)}
                    </p>
                  </div>
                  
                  <div className="mb-3 text-sm text-gray-600 space-y-1">
                    {order.paperSize && (
                      <p><strong>Paper:</strong> {order.paperSize}</p>
                    )}
                    {order.colorType && (
                      <p><strong>Type:</strong> {order.colorType}</p>
                    )}
                    {order.copies && order.pages && (
                      <p><strong>Quantity:</strong> {order.copies} cop{order.copies > 1 ? 'ies' : 'y'} × {order.pages} page{order.pages > 1 ? 's' : ''}</p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    {React.createElement(getStatusInfo(order.status).icon, {
                      className: `w-5 h-5 ${getStatusInfo(order.status).color}`,
                    })}
                    <p className={`font-semibold ${getStatusInfo(order.status).color}`}>
                      {getStatusInfo(order.status).label}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-white rounded-lg">
                <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-600 mb-4">You have no active orders this month.</p>
                <Link href="/order" className="px-6 py-3 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors inline-block">
                  Place New Order
                </Link>
              </div>
            )}
          </motion.div>
        );

      case 'history':
        const currentMonthOrders = orders.filter(o => isCurrentMonth(new Date(o.createdAt)));
        
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {currentMonthOrders.length > 0 ? (
              <div className="overflow-x-auto bg-white rounded-lg">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="p-3 text-sm font-semibold">Order ID</th>
                      <th className="p-3 text-sm font-semibold">Date</th>
                      <th className="p-3 text-sm font-semibold">Total</th>
                      <th className="p-3 text-sm font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentMonthOrders.map((order) => (
                      <tr key={order.id} className="border-b hover:bg-gray-50 transition-colors">
                        <td className="p-3 font-mono text-sm text-blue-900">
                          {order.orderNumber || `#${order.id.slice(0, 8)}`}
                        </td>
                        <td className="p-3 text-sm text-gray-600">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-3 text-sm font-semibold">
                          ₱{(order.totalPrice || order.total || 0).toFixed(2)}
                        </td>
                        <td className="p-3 text-sm">
                          <span className={`font-semibold ${getStatusInfo(order.status).color}`}>
                            {getStatusInfo(order.status).label}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg">
                <History className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">No orders found for this month.</p>
              </div>
            )}
          </motion.div>
        );

      case 'archive':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {archivedOrders.length > 0 ? (
              <div className="space-y-4">
                {Object.entries(
                  archivedOrders.reduce((groups: Record<string, Order[]>, order) => {
                    const monthKey = new Date(order.createdAt).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long' 
                    });
                    if (!groups[monthKey]) groups[monthKey] = [];
                    groups[monthKey].push(order);
                    return groups;
                  }, {})
                ).map(([month, monthOrders]) => (
                  <div key={month} className="bg-white rounded-lg border-2 border-gray-200">
                    <div className="bg-gray-100 px-4 py-3 border-b flex items-center gap-2">
                      <Archive className="w-5 h-5 text-gray-600" />
                      <h3 className="font-bold text-gray-800">{month}</h3>
                      <span className="ml-auto text-sm text-gray-600">
                        {monthOrders.length} order{monthOrders.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="p-4 space-y-3">
                      {monthOrders.map((order) => (
                        <div key={order.id} className="p-3 border rounded-lg bg-gray-50">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-mono text-sm text-blue-900 font-semibold">
                                {order.orderNumber || `#${order.id.slice(0, 8)}`}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(order.createdAt).toLocaleDateString()}
                              </p>
                              {order.filesDeletedAt && (
                                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                                  <Archive className="w-3 h-3" />
                                  Files deleted
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-gray-900">
                                ₱{(order.totalPrice || order.total || 0).toFixed(2)}
                              </p>
                              <span className={`text-xs font-medium ${getStatusInfo(order.status).color}`}>
                                {getStatusInfo(order.status).label}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg">
                <Archive className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">No archived orders found.</p>
              </div>
            )}
          </motion.div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-full py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-8">
            <motion.h1 
              key={userData.name}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="text-3xl font-bold text-gray-900"
            >
              Hi, {userData.name || 'Customer'}!
            </motion.h1>
            <p className="text-gray-600">
              Ready to print today? You have {activeOrders.length} active order{activeOrders.length !== 1 ? 's' : ''}.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-lg border mb-6 overflow-hidden">
                <div className="flex border-b overflow-x-auto">
                  {[
                    { id: 'active', label: 'Active Orders', icon: TrendingUp },
                    { id: 'history', label: 'This Month', icon: History },
                    { id: 'archive', label: 'Archive', icon: Archive },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as 'active' | 'history' | 'archive')}
                      className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                        activeTab === tab.id
                          ? 'text-blue-900 border-b-2 border-blue-900 bg-blue-50'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <tab.icon className="w-5 h-5" />
                      {tab.label}
                      {tab.id === 'archive' && archivedOrders.length > 0 && (
                        <span className="ml-1 px-2 py-0.5 bg-gray-200 text-gray-700 rounded-full text-xs font-bold">
                          {archivedOrders.length}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                <div className="p-6">
                  <AnimatePresence mode="wait">
                    {renderTabContent()}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FilePlus className="w-6 h-6 text-blue-900" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">New Print Job?</h2>
                <p className="text-gray-600 mb-6 text-sm">Start a new order with just a few clicks.</p>
                <Link
                  href="/order"
                  className="w-full px-6 py-3 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors font-semibold flex items-center justify-center space-x-2"
                >
                  <FilePlus className="w-5 h-5" />
                  <span>Place New Order</span>
                </Link>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Account</h2>
                <nav className="space-y-2">
                  <Link 
                    href="/profile" 
                    className="flex items-center p-3 rounded-lg hover:bg-blue-50 hover:text-blue-900 transition-colors group"
                  >
                    <User className="w-5 h-5 mr-3 text-gray-500 group-hover:text-blue-900" />
                    <span>Profile Settings</span>
                  </Link>
                  <Link 
                    href="/support" 
                    className="flex items-center p-3 rounded-lg hover:bg-blue-50 hover:text-blue-900 transition-colors group"
                  >
                    <HelpCircle className="w-5 h-5 mr-3 text-gray-500 group-hover:text-blue-900" />
                    <span>Help & Support</span>
                  </Link>
                </nav>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}