'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Package,
  Clock,
  CheckCircle,
  Truck,
  FilePlus,
  User,
  Bell,
  HelpCircle,
  CreditCard,
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
  user: { name: string; email: string };
  onLogout?: () => void;
}

export default function UserDashboard({ user, onLogout }: UserDashboardProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/orders');
        if (!response.ok) throw new Error('Failed to fetch orders');
        
        const data = await response.json();
        console.log('📦 Fetched orders:', data);
        
        setOrders(data);
        setActiveOrders(
          data.filter((o: Order) => !['COMPLETED', 'CANCELLED'].includes(o.status))
        );
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
          {/* ✅ Header WITHOUT Logout Button */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Hi, {user.name}!</h1>
            <p className="text-gray-600">
              Ready to print today? You have {activeOrders.length} active order{activeOrders.length !== 1 ? 's' : ''}.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Active Orders */}
              <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">My Active Orders</h2>
                {activeOrders.length > 0 ? (
                  <div className="space-y-4">
                    {activeOrders.map((order) => (
                      <div key={order.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
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
                            ₱{(order.totalPrice || order.total).toFixed(2)}
                          </p>
                        </div>
                        
                        <div className="mb-3 text-sm text-gray-600 space-y-1">
                          {order.paperSize && (
                            <p><strong>Paper:</strong> {order.paperSize}</p>
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
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-600 mb-4">You have no active orders.</p>
                    <Link href="/order" className="btn-primary inline-block">
                      Place New Order
                    </Link>
                  </div>
                )}
              </div>

              {/* Order History */}
              <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Order History</h2>
                {orders.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b">
                          <th className="p-2 text-sm font-semibold">Order ID</th>
                          <th className="p-2 text-sm font-semibold">Date</th>
                          <th className="p-2 text-sm font-semibold">Total</th>
                          <th className="p-2 text-sm font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((order) => (
                          <tr key={order.id} className="border-b hover:bg-gray-50 transition-colors">
                            <td className="p-2 font-mono text-sm text-blue-900">
                              {order.orderNumber || `#${order.id.slice(0, 8)}`}
                            </td>
                            <td className="p-2 text-sm text-gray-600">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </td>
                            <td className="p-2 text-sm font-semibold">
                              ₱{(order.totalPrice || order.total).toFixed(2)}
                            </td>
                            <td className="p-2 text-sm">
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
                  <p className="text-gray-500 text-center py-8">No past orders found.</p>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 text-center">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">New Print Job?</h2>
                <p className="text-gray-600 mb-6">Start a new order with just a few clicks.</p>
                <Link
                  href="/order"
                  className="w-full btn-primary flex items-center justify-center space-x-2"
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