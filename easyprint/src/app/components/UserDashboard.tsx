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
  LogOut, // ✅ Add this import
} from 'lucide-react';
import { useToast } from '../components/ui/Use-Toast';

interface Order {
  id: string;
  total: number;
  status: string;
  createdAt: string;
  estimatedCompletion?: string;
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
  const { toast } = useToast();

  useEffect(() => {
    const allOrders = JSON.parse(localStorage.getItem('orders') || '[]') as Order[];
    const userOrders = allOrders.filter(
      (order) =>
        order.details.contactEmail === user.email ||
        order.details.contactName === user.name
    );
    setOrders(userOrders);
    setActiveOrders(
      userOrders.filter((o) => !['delivered', 'cancelled'].includes(o.status))
    );
  }, [user]);

  const getStatusInfo = (status: string) => {
    const info: Record<
      string,
      { label: string; icon: any; color: string }
    > = {
      payment: { label: 'Awaiting Payment', icon: CreditCard, color: 'text-yellow-500' },
      received: { label: 'Files Received', icon: CheckCircle, color: 'text-blue-500' },
      printing: { label: 'Printing', icon: Clock, color: 'text-orange-500' },
      completed: { label: 'Print Completed', icon: Package, color: 'text-indigo-500' },
      delivery: { label: 'Out for Delivery', icon: Truck, color: 'text-purple-500' },
      delivered: { label: 'Delivered', icon: CheckCircle, color: 'text-green-500' },
    };
    return info[status] || { label: 'Unknown', icon: HelpCircle, color: 'text-gray-500' };
  };

  return (
    <div className="bg-gray-50 min-h-full py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* ✅ Add Header with Logout */}
          <div className="mb-8 flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Hi, {user.name}!</h1>
              <p className="text-gray-600">
                Ready to print today? You have {activeOrders.length} active orders.
              </p>
            </div>
            {onLogout && (
              <button
                onClick={onLogout}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Active Orders */}
              <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">My Active Orders</h2>
                {activeOrders.length > 0 ? (
                  <div className="space-y-6">
                    {activeOrders.map((order) => (
                      <div key={order.id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-blue-900">Order #{order.id}</p>
                            <p className="text-sm text-gray-500">
                              Placed on: {new Date(order.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <p className="font-semibold text-lg">₱{order.total}</p>
                        </div>
                        <div className="mt-4">
                          <div className="flex items-center space-x-2">
                            {React.createElement(getStatusInfo(order.status).icon, {
                              className: `w-6 h-6 ${getStatusInfo(order.status).color}`,
                            })}
                            <p
                              className={`font-semibold ${getStatusInfo(order.status).color}`}
                            >
                              {getStatusInfo(order.status).label}
                            </p>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            Estimated completion:{' '}
                            {new Date(order.estimatedCompletion || '').toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-600 mb-4">You have no active orders.</p>
                    <Link href="/order" className="btn-primary">
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
                          <th className="p-2">Order ID</th>
                          <th className="p-2">Date</th>
                          <th className="p-2">Total</th>
                          <th className="p-2">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((order) => (
                          <tr key={order.id} className="border-b hover:bg-gray-50">
                            <td className="p-2 font-mono text-sm">#{order.id}</td>
                            <td className="p-2 text-sm">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </td>
                            <td className="p-2 text-sm">₱{order.total}</td>
                            <td className="p-2 text-sm">
                              <span className="font-semibold">
                                {getStatusInfo(order.status).label}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500">No past orders found.</p>
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
                  <Link href="#" className="flex items-center p-2 rounded-lg hover:bg-gray-100">
                    <User className="w-5 h-5 mr-3 text-gray-500" />
                    <span>Profile Settings</span>
                  </Link>
                  <Link href="#" className="flex items-center p-2 rounded-lg hover:bg-gray-100">
                    <Bell className="w-5 h-5 mr-3 text-gray-500" />
                    <span>Notifications</span>
                  </Link>
                  <Link href="#" className="flex items-center p-2 rounded-lg hover:bg-gray-100">
                    <CreditCard className="w-5 h-5 mr-3 text-gray-500" />
                    <span>Payment History</span>
                  </Link>
                  <Link href="#" className="flex items-center p-2 rounded-lg hover:bg-gray-100">
                    <HelpCircle className="w-5 h-5 mr-3 text-gray-500" />
                    <span>Help & Support</span>
                  </Link>
                  {/* ✅ Add Logout Option at Bottom */}
                  {onLogout && (
                    <button
                      onClick={onLogout}
                      className="w-full flex items-center p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                    >
                      <LogOut className="w-5 h-5 mr-3" />
                      <span>Logout</span>
                    </button>
                  )}
                </nav>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}