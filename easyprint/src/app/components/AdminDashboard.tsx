'use client';

import React, { useEffect, useState } from 'react';
import { useToast } from '../components/ui/Use-Toast';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Package, 
  FileText, 
  TrendingUp, 
  AlertTriangle,
  MessageSquare,
  Download,
  DollarSign,
  Box,
  Settings,
  Bell,
  Plus,
  Edit,
  Trash2,
  Eye,
  ChevronDown,
  Calendar,
} from 'lucide-react';
import * as XLSX from 'xlsx';

// ✅ Define the expected props
interface AdminDashboardProps {
  user: {
    id: string;
    email: string;
    role?: string;
  };
}

interface Staff {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  status: string;
  totalPrice: number;
  createdAt: string;
}

interface InventoryItem {
  id: string;
  itemName: string;
  category: string;
  quantity: number;
  unit: string;
  minStockLevel: number;
}

interface Message {
  id: string;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
  user: {
    name: string;
    email: string;
  };
}

interface SalesReport {
  period: string;
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user }) => {
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'overview' | 'inventory' | 'messages' | 'products' | 'staff' | 'settings'>('overview');
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportPeriod, setReportPeriod] = useState<'daily' | 'weekly' | 'monthly'>('monthly');

  // ✅ Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch staff
        const staffRes = await fetch('/api/admin/staff');
        if (staffRes.ok) {
          const staffData = await staffRes.json();
          setStaffList(staffData);
        }

        // Fetch orders
        const ordersRes = await fetch('/api/orders');
        if (ordersRes.ok) {
          const ordersData = await ordersRes.json();
          setOrders(ordersData);
        }

        // Fetch inventory
        const inventoryRes = await fetch('/api/admin/inventory');
        if (inventoryRes.ok) {
          const inventoryData = await inventoryRes.json();
          setInventory(inventoryData);
        }

        // Fetch messages
        const messagesRes = await fetch('/api/admin/messages');
        if (messagesRes.ok) {
          const messagesData = await messagesRes.json();
          setMessages(messagesData);
        }

      } catch (error) {
        console.error('Error fetching admin data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load dashboard data',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  // ✅ Calculate statistics
  const stats = {
    totalOrders: orders.length,
    pendingOrders: orders.filter((o) => o.status === 'PENDING').length,
    totalRevenue: orders.reduce((sum, o) => sum + o.totalPrice, 0),
    completedToday: orders.filter(
      (o) =>
        o.status === 'COMPLETED' &&
        new Date(o.createdAt).toDateString() === new Date().toDateString()
    ).length,
    lowStock: inventory.filter((i) => i.quantity <= i.minStockLevel).length,
    unreadMessages: messages.filter((m) => m.status === 'PENDING').length,
  };

  // ✅ Export Sales Report to Excel
  const exportSalesReport = () => {
    const getOrdersForPeriod = () => {
      const now = new Date();
      const filtered = orders.filter((order) => {
        const orderDate = new Date(order.createdAt);
        if (reportPeriod === 'daily') {
          return orderDate.toDateString() === now.toDateString();
        } else if (reportPeriod === 'weekly') {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return orderDate >= weekAgo;
        } else {
          return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
        }
      });
      return filtered;
    };

    const periodOrders = getOrdersForPeriod();
    const reportData = periodOrders.map((order) => ({
      'Order Number': order.orderNumber,
      'Customer Name': order.customerName,
      'Customer Email': order.customerEmail,
      'Status': order.status,
      'Total Price': `₱${order.totalPrice.toFixed(2)}`,
      'Date': new Date(order.createdAt).toLocaleDateString(),
    }));

    const summaryData = [
      { Metric: 'Total Orders', Value: periodOrders.length },
      { Metric: 'Total Revenue', Value: `₱${periodOrders.reduce((sum, o) => sum + o.totalPrice, 0).toFixed(2)}` },
      { Metric: 'Average Order Value', Value: `₱${(periodOrders.reduce((sum, o) => sum + o.totalPrice, 0) / periodOrders.length || 0).toFixed(2)}` },
    ];

    const wb = XLSX.utils.book_new();
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    const wsOrders = XLSX.utils.json_to_sheet(reportData);

    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');
    XLSX.utils.book_append_sheet(wb, wsOrders, 'Orders');

    XLSX.writeFile(wb, `Sales_Report_${reportPeriod}_${new Date().toISOString().split('T')[0]}.xlsx`);

    toast({
      title: 'Report Exported',
      description: `${reportPeriod.charAt(0).toUpperCase() + reportPeriod.slice(1)} sales report downloaded successfully.`,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600">Welcome back, {user.email}</p>
          </div>
          <button
            onClick={exportSalesReport}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-5 h-5" />
            Export Report
          </button>
        </div>

        {/* Report Period Selector */}
        <div className="mb-6 flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700">Report Period:</span>
          <div className="flex gap-2">
            {(['daily', 'weekly', 'monthly'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setReportPeriod(period)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  reportPeriod === period
                    ? 'bg-blue-900 text-white'
                    : 'bg-white text-gray-700 border hover:bg-gray-50'
                }`}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            {
              title: 'Total Orders',
              value: stats.totalOrders,
              icon: Package,
              color: 'text-blue-600',
              bg: 'bg-blue-100',
            },
            {
              title: 'Total Revenue',
              value: `₱${stats.totalRevenue.toFixed(2)}`,
              icon: DollarSign,
              color: 'text-green-600',
              bg: 'bg-green-100',
            },
            {
              title: 'Low Stock Items',
              value: stats.lowStock,
              icon: AlertTriangle,
              color: 'text-orange-600',
              bg: 'bg-orange-100',
              alert: stats.lowStock > 0,
            },
            {
              title: 'Unread Messages',
              value: stats.unreadMessages,
              icon: MessageSquare,
              color: 'text-purple-600',
              bg: 'bg-purple-100',
            },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-6 rounded-xl shadow-lg border relative"
            >
              {stat.alert && (
                <div className="absolute top-2 right-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                </div>
              )}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.title}</p>
                  <p className={`text-3xl font-bold ${stat.color} mt-2`}>{stat.value}</p>
                </div>
                <div className={`w-12 h-12 ${stat.bg} rounded-lg flex items-center justify-center`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-lg border mb-8 overflow-hidden">
          <div className="flex border-b overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview', icon: TrendingUp },
              { id: 'inventory', label: 'Inventory', icon: Box },
              { id: 'messages', label: 'Messages', icon: MessageSquare },
              { id: 'products', label: 'Products', icon: Package },
              { id: 'staff', label: 'Staff', icon: Users },
              { id: 'settings', label: 'Settings', icon: Settings },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'text-blue-900 border-b-2 border-blue-900 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <h2 className="text-xl font-semibold mb-4">Recent Orders</h2>
                  <div className="space-y-4">
                    {orders.slice(0, 5).map((order) => (
                      <div key={order.id} className="p-4 border rounded-lg hover:bg-gray-50">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold">{order.orderNumber}</p>
                            <p className="text-sm text-gray-600">{order.customerName}</p>
                            <p className="text-xs text-gray-500">{order.customerEmail}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">₱{order.totalPrice.toFixed(2)}</p>
                            <span
                              className={`inline-block px-3 py-1 text-xs font-medium rounded-lg mt-1 ${
                                order.status === 'COMPLETED'
                                  ? 'bg-green-100 text-green-700'
                                  : order.status === 'PENDING'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}
                            >
                              {order.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'inventory' && (
                <motion.div
                  key="inventory"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Inventory Management</h2>
                    <button className="flex items-center gap-2 px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800">
                      <Plus className="w-5 h-5" />
                      Add Item
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b">
                        <tr>
                          <th className="text-left p-3">Item Name</th>
                          <th className="text-left p-3">Category</th>
                          <th className="text-left p-3">Quantity</th>
                          <th className="text-left p-3">Min Stock</th>
                          <th className="text-left p-3">Status</th>
                          <th className="text-left p-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inventory.map((item) => (
                          <tr key={item.id} className="border-b hover:bg-gray-50">
                            <td className="p-3">{item.itemName}</td>
                            <td className="p-3">{item.category}</td>
                            <td className="p-3">
                              {item.quantity} {item.unit}
                            </td>
                            <td className="p-3">{item.minStockLevel}</td>
                            <td className="p-3">
                              {item.quantity <= item.minStockLevel ? (
                                <span className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm font-medium flex items-center gap-1 w-fit">
                                  <AlertTriangle className="w-4 h-4" />
                                  Low Stock
                                </span>
                              ) : (
                                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
                                  In Stock
                                </span>
                              )}
                            </td>
                            <td className="p-3">
                              <button className="text-blue-600 hover:text-blue-800 mr-3">
                                <Edit className="w-4 h-4" />
                              </button>
                              <button className="text-red-600 hover:text-red-800">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}

              {activeTab === 'messages' && (
                <motion.div
                  key="messages"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <h2 className="text-xl font-semibold mb-4">Customer Inquiries</h2>
                  <div className="space-y-4">
                    {messages.map((msg) => (
                      <div key={msg.id} className="p-4 border rounded-lg hover:bg-gray-50">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-semibold">{msg.subject}</p>
                            <p className="text-sm text-gray-600">
                              From: {msg.user.name} ({msg.user.email})
                            </p>
                          </div>
                          <span
                            className={`px-3 py-1 text-xs font-medium rounded-lg ${
                              msg.status === 'PENDING'
                                ? 'bg-yellow-100 text-yellow-700'
                                : msg.status === 'IN_PROGRESS'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-green-100 text-green-700'
                            }`}
                          >
                            {msg.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">{msg.message}</p>
                        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                          Respond
                        </button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Add similar sections for products, staff, and settings */}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;