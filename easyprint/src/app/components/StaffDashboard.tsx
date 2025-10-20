'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Package,
  Clock,
  CheckCircle,
  Search,
  Filter,
  Eye,
  Bell,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { useToast } from '../components/ui/Use-Toast';

// --- Types ---
interface StaffDashboardProps {
  user: {
    id: string;
    email: string;
    name?: string;
  };
  onLogout: () => void;
}

interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  totalPrice: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  fileName?: string;
  fileUrl?: string;
}

const StaffDashboard: React.FC<StaffDashboardProps> = ({ user, onLogout }) => {
  const { toast } = useToast();

  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  const statusOptions = [
    { value: 'all', label: 'All Orders' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'PROCESSING', label: 'Processing' },
    { value: 'READY', label: 'Ready for Pickup' },
    { value: 'ON_DELIVERY', label: 'Out for Delivery' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'CANCELLED', label: 'Cancelled' },
  ];

  // ✅ Fetch orders from your API (instead of Supabase directly)
  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/orders');
        if (!response.ok) throw new Error('Failed to fetch orders');
        
        const data = await response.json();
        setOrders(data || []);
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
  }, [toast]);

  // ✅ Filter & search
  useEffect(() => {
    let filtered = orders;

    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
          order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.customerName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    setFilteredOrders(filtered);
  }, [orders, searchTerm, statusFilter]);

  // ✅ Update order status via API
  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update order');

      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, status: newStatus, updatedAt: new Date().toISOString() } : order
        )
      );

      toast({
        title: 'Status Updated',
        description: `Order ${orderId} is now ${getStatusLabel(newStatus)}.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update order status',
        variant: 'destructive',
      });
    }
  };

  // ✅ Helpers
  const getStatusLabel = (status: string) =>
    statusOptions.find((s) => s.value === status)?.label || 'Unknown';

  const getStatusColor = (status: string) =>
    ({
      PENDING: 'bg-yellow-100 text-yellow-700',
      PROCESSING: 'bg-blue-100 text-blue-700',
      READY: 'bg-indigo-100 text-indigo-700',
      ON_DELIVERY: 'bg-orange-100 text-orange-700',
      COMPLETED: 'bg-green-100 text-green-700',
      CANCELLED: 'bg-red-100 text-red-700',
    }[status] || 'bg-gray-200 text-gray-800');

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === 'PENDING').length,
    completedToday: orders.filter(
      (o) =>
        o.status === 'COMPLETED' &&
        new Date(o.updatedAt).toDateString() === new Date().toDateString()
    ).length,
  };

  if (loading) {
    return (
      <p className="text-center mt-10 text-gray-600">Loading orders...</p>
    );
  }

  return (
    <div className="bg-gray-50 min-h-full py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Staff Dashboard</h1>
            <p className="text-gray-600">Welcome back, {user.name || user.email}!</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Bell className="w-6 h-6 text-gray-600" />
              <div className="absolute top-0 right-0 bg-red-500 text-white text-xs px-1.5 rounded-full">3</div>
            </div>
            <button onClick={onLogout} className="p-2 text-gray-600 hover:text-red-600">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            { title: 'Total Orders', value: stats.total, icon: Package, color: 'text-blue-600' },
            { title: 'Pending Orders', value: stats.pending, icon: Clock, color: 'text-orange-600' },
            { title: 'Completed Today', value: stats.completedToday, icon: CheckCircle, color: 'text-green-600' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-6 rounded-xl shadow-lg border"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.title}</p>
                  <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                </div>
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-xl shadow-lg border mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by Order ID or Name..."
                className="w-full pl-10 pr-4 py-3 border rounded-lg"
              />
            </div>
            <div className="relative md:w-64">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border rounded-lg appearance-none"
              >
                {statusOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Orders List */}
        <div className="bg-white rounded-xl shadow-lg border">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Orders ({filteredOrders.length})</h2>
          </div>
          <div className="divide-y">
            {filteredOrders.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No orders found.</p>
              </div>
            ) : (
              filteredOrders.map((order) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-6 hover:bg-gray-50"
                >
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex-1 min-w-[200px]">
                      <h3 className="font-semibold">#{order.id}</h3>
                      <p className="text-sm text-gray-600">{order.customerName}</p>
                      <p className="text-xs text-gray-500">
                        Created: {new Date(order.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="font-semibold">₱{order.totalPrice}</p>
                      <div className="relative group">
                        <button
                          className={`px-3 py-1.5 text-sm font-medium rounded-lg ${getStatusColor(order.status)} flex items-center gap-2`}
                        >
                          {getStatusLabel(order.status)} <ChevronDown size={14} />
                        </button>
                        <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border py-1 hidden group-hover:block z-10">
                          {statusOptions
                            .filter((s) => s.value !== 'all')
                            .map((s) => (
                              <button
                                key={s.value}
                                onClick={() => updateOrderStatus(order.id, s.value)}
                                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                              >
                                {s.label}
                              </button>
                            ))}
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Order Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b flex justify-between items-center">
                <h2 className="text-xl font-semibold">Order Details</h2>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              <div className="p-6 space-y-4">
                <p><strong>Order ID:</strong> {selectedOrder.id}</p>
                <p>
                  <strong>Customer:</strong> {selectedOrder.customerName} (
                  {selectedOrder.customerEmail})
                </p>
                <p><strong>Total:</strong> ₱{selectedOrder.totalPrice}</p>
                <p>
                  <strong>Status:</strong>{' '}
                  <span
                    className={`px-3 py-1 rounded-lg text-sm font-medium ${getStatusColor(
                      selectedOrder.status
                    )}`}
                  >
                    {getStatusLabel(selectedOrder.status)}
                  </span>
                </p>
                {selectedOrder.fileUrl && (
                  <div className="pt-2 border-t">
                    <h3 className="font-semibold">File</h3>
                    <a
                      href={selectedOrder.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {selectedOrder.fileName}
                    </a>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffDashboard;