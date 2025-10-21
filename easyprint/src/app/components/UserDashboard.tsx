'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
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
} from 'lucide-react';
import { useToast } from '../components/ui/Use-Toast';

interface Order {
  id: string;
  orderNumber?: string;
  total: number;
  totalPrice: number;
  status: string;
  createdAt: string;
  updatedAt: string;
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
  onLogout?: () => void;
}

export default function UserDashboard({ user, onLogout }: UserDashboardProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const { toast } = useToast();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/orders');
        if (!response.ok) throw new Error('Failed to fetch orders');
        
        const data = await response.json();
        console.log('📦 User fetched orders:', data); // ✅ Debug log
        
        setOrders(data);
        
        // ✅ Filter active orders (not completed or cancelled)
        const active = data.filter((o: Order) => 
          !['COMPLETED', 'CANCELLED'].includes(o.status)
        );
        console.log('✅ Active orders:', active); // ✅ Debug log
        
        setActiveOrders(active);
      } catch (error) {
        console.error('Error fetching orders:', error);
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

    // ✅ Poll for updates every 15 seconds
    const interval = setInterval(fetchOrders, 15000);
    return () => clearInterval(interval);
  }, [toast]);

  const getStatusInfo = (status: string) => {
    const info: Record<string, { label: string; icon: any; color: string }> = {
      PENDING: { label: 'Awaiting Payment', icon: CreditCard, color: 'text-yellow-600' },
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
                <p className="text-gray-600 mb-4">You have no active orders.</p>
                <Link href="/order" className="px-6 py-3 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors inline-block">
                  Place New Order
                </Link>
              </div>
            )}
          </motion.div>
        );

      case 'history':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {orders.length > 0 ? (
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
                    {orders.map((order) => (
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
                <p className="text-gray-500">No past orders found.</p>
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
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Hi, {user.name || 'Customer'}!</h1>
            <p className="text-gray-600">
              Ready to print today? You have {activeOrders.length} active order{activeOrders.length !== 1 ? 's' : ''}.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content with Tabs */}
            <div className="lg:col-span-2">
              {/* ✅ Tab Navigation */}
              <div className="bg-white rounded-xl shadow-lg border mb-6 overflow-hidden">
                <div className="flex border-b">
                  {[
                    { id: 'active', label: 'Active Orders', icon: TrendingUp },
                    { id: 'history', label: 'Order History', icon: History },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-medium transition-colors ${
                        activeTab === tab.id
                          ? 'text-blue-900 border-b-2 border-blue-900 bg-blue-50'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <tab.icon className="w-5 h-5" />
                      <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                <div className="p-6">
                  <AnimatePresence mode="wait">
                    {renderTabContent()}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Sidebar - Keep as is */}
            <div className="space-y-6">
              {/* New Print Job Card */}
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

              {/* Account Section */}
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