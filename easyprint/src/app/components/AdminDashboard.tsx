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
  X,
  CheckCircle,
  Save,
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
  orderNumber?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  totalPrice: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  fileName?: string;
  fileUrl?: string;
  paperSize?: string;
  colorType?: string;
  copies?: number;
  pages?: number;
  bindingType?: string;
  notes?: string;
  adminNotes?: string;
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

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  user: {
    name: string;
    email: string;
  };
  data?: {
    itemName?: string;
    category?: string;
    currentStock?: number;
    requiredStock?: number;
    urgencyLevel?: string;
    notes?: string;
    reportedAt?: string;
  };
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user }) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'overview' | 'inventory' | 'notifications' | 'messages' | 'products' | 'staff' | 'settings'>('overview');
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportPeriod, setReportPeriod] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [showAddInventory, setShowAddInventory] = useState(false);
  const [editingInventory, setEditingInventory] = useState<InventoryItem | null>(null);
  const [staffForm, setStaffForm] = useState({ name: '', email: '', password: '', role: 'STAFF' });
  const [inventoryForm, setInventoryForm] = useState({
    itemName: '',
    category: '',
    quantity: '',
    unit: '',
    minStockLevel: '',
  });

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

        // ✅ Fetch notifications
        try {
          const notifRes = await fetch('/api/notifications');
          if (notifRes.ok) {
            const notifData = await notifRes.json();
            setNotifications(notifData);
            setUnreadCount(notifData.filter((n: any) => !n.isRead).length);
          } else if (notifRes.status === 403) {
            // User doesn't have permission - skip notifications
            console.log('User does not have permission to view notifications');
            setNotifications([]);
            setUnreadCount(0);
          } else {
            console.warn('Failed to fetch notifications:', notifRes.status);
            setNotifications([]);
            setUnreadCount(0);
          }
        } catch (notifError) {
          console.error('Error fetching notifications:', notifError);
          setNotifications([]);
          setUnreadCount(0);
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

    // ✅ Poll for new notifications every 30 seconds
    const interval = setInterval(() => {
      fetch('/api/notifications')
        .then((res) => {
          if (res.ok) {
            return res.json();
          }
          if (res.status === 403) {
            // User lost permission - stop polling
            clearInterval(interval);
            return null;
          }
          throw new Error(`HTTP ${res.status}`);
        })
        .then((data) => {
          if (data) {
            setNotifications(data);
            setUnreadCount(data.filter((n: any) => !n.isRead).length);
          }
        })
        .catch((error) => {
          console.error('Polling error:', error);
        });
    }, 30000);

    return () => clearInterval(interval);
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
    lowStock: notifications.filter((n) => !n.isRead && n.type === 'LOW_STOCK').length,
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

  // ✅ Staff Management Functions
  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(staffForm),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      toast({ title: 'Success', description: 'Staff member created successfully' });
      setShowAddStaff(false);
      setStaffForm({ name: '', email: '', password: '', role: 'STAFF' });
      
      // Refresh staff list
      const staffRes = await fetch('/api/admin/staff');
      const staffData = await staffRes.json();
      setStaffList(staffData);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create staff',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteStaff = async (staffId: string) => {
    if (!confirm('Are you sure you want to delete this staff member?')) return;

    try {
      const response = await fetch(`/api/admin/staff/${staffId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete');

      toast({ title: 'Deleted', description: 'Staff member removed' });
      setStaffList(prev => prev.filter(s => s.id !== staffId));
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete staff', variant: 'destructive' });
    }
  };

  // ✅ Inventory Management Functions
  const handleAddInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inventoryForm),
      });

      if (!response.ok) throw new Error('Failed to add item');

      toast({ title: 'Success', description: 'Inventory item added' });
      setShowAddInventory(false);
      setInventoryForm({ itemName: '', category: '', quantity: '', unit: '', minStockLevel: '' });
      
      // Refresh inventory
      const invRes = await fetch('/api/admin/inventory');
      const invData = await invRes.json();
      setInventory(invData);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to add inventory item', variant: 'destructive' });
    }
  };

  const handleUpdateInventory = async () => {
    if (!editingInventory) return;

    try {
      const response = await fetch(`/api/admin/inventory/${editingInventory.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingInventory),
      });

      if (!response.ok) throw new Error('Failed to update');

      toast({ title: 'Updated', description: 'Inventory item updated' });
      setEditingInventory(null);
      
      const invRes = await fetch('/api/admin/inventory');
      const invData = await invRes.json();
      setInventory(invData);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update item', variant: 'destructive' });
    }
  };

  const handleDeleteInventory = async (itemId: string) => {
    if (!confirm('Delete this inventory item?')) return;

    try {
      const response = await fetch(`/api/admin/inventory/${itemId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete');

      toast({ title: 'Deleted', description: 'Inventory item removed' });
      setInventory(prev => prev.filter(i => i.id !== itemId));
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete item', variant: 'destructive' });
    }
  };

  const downloadDocument = async (order: Order) => {
  if (!order.fileUrl) {
    toast({
      title: 'No File',
      description: 'This order does not have an uploaded document.',
      variant: 'destructive',
    });
    return;
  }

  try {
    toast({
      title: 'Downloading',
      description: 'Starting download...',
    });

    const encodedUrl = encodeURIComponent(order.fileUrl);
    const response = await fetch(`/api/files/proxy?url=${encodedUrl}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = order.fileName || 'document.pdf';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    toast({
      title: 'Downloaded',
      description: `${link.download} downloaded successfully`,
    });
  } catch (error) {
    console.error('Download error:', error);
    toast({
      title: 'Download Failed',
      description: error instanceof Error ? error.message : 'Failed to download document',
      variant: 'destructive',
    });
  }
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
        <div className="flex border-b overflow-x-auto md:overflow-x-visible scrollbar-hide">
          {[
            { id: 'overview', label: 'Overview', icon: TrendingUp },
            { id: 'staff', label: 'Staff Management', icon: Users },
            { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadCount },
            { id: 'messages', label: 'Messages', icon: MessageSquare, badge: stats.unreadMessages },
            { id: 'settings', label: 'Settings', icon: Settings },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors relative whitespace-nowrap flex-shrink-0 ${
                activeTab === tab.id
                  ? 'text-blue-900 border-b-2 border-blue-900 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span>{tab.label}</span>
              {tab.badge > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

          <div className="p-3 md:p-4">
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

                  {/* In the orders section */}
                  {orders.slice(0, 5).map((order) => (
                    <div key={order.id} className="p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold">{order.orderNumber}</p>
                          <p className="text-sm text-gray-600">{order.customerName}</p>
                          <p className="text-xs text-gray-500">{order.customerEmail}</p>
                          
                          {/* ✅ Add view/download buttons */}
                          {order.fileUrl && (
                            <div className="flex gap-3 mt-2">
                              <button
                                onClick={() => {
                                  const encodedUrl = encodeURIComponent(order.fileUrl);
                                  window.open(`/api/files/proxy?url=${encodedUrl}`, '_blank');
                                }}
                                className="text-blue-600 hover:underline text-xs flex items-center gap-1"
                              >
                                <Eye className="w-3 h-3" />
                                View File
                              </button>
                              <button
                                onClick={() => downloadDocument(order)}
                                className="text-green-600 hover:underline text-xs flex items-center gap-1"
                              >
                                <Download className="w-3 h-3" />
                                Download
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">₱{order.totalPrice.toFixed(2)}</p>
                          <span className={`inline-block px-3 py-1 text-xs font-medium rounded-lg mt-1 ${
                            order.status === 'COMPLETED'
                              ? 'bg-green-100 text-green-700'
                              : order.status === 'PENDING'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  </div>
                </motion.div>
              )}
              {activeTab === 'notifications' && (
                <motion.div
                  key="notifications"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold">
                      Low Stock Alerts ({notifications.length})
                    </h2>
                    <div className="flex gap-3">
                      <button
                        onClick={async () => {
                          // Mark all as read (done)
                          await Promise.all(
                            notifications
                              .filter((n) => !n.isRead)
                              .map((n) =>
                                fetch(`/api/notifications/${n.id}`, { method: 'PATCH' })
                              )
                          );
                          const res = await fetch('/api/notifications');
                          const data = await res.json();
                          setNotifications(data);
                          setUnreadCount(0);
                          toast({
                            title: 'Success',
                            description: 'All alerts marked as done',
                          });
                        }}
                        className="text-sm px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                      >
                        Mark All as Done
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {notifications.length === 0 ? (
                      <div className="text-center py-12 bg-gray-50 rounded-lg">
                        <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-600 font-medium mb-2">No Low Stock Alerts</p>
                        <p className="text-sm text-gray-500">
                          Staff will report low stock items here
                        </p>
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <motion.div
                          key={notif.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`rounded-lg border overflow-hidden ${
                            notif.isRead 
                              ? 'bg-gray-50 border-gray-200 opacity-60' 
                              : 'bg-white border-orange-300 shadow-md'
                          }`}
                        >
                          {/* Alert Header */}
                          <div className={`p-4 border-b flex items-center justify-between ${
                            notif.isRead ? 'bg-gray-100' : 'bg-gradient-to-r from-orange-50 to-red-50'
                          }`}>
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                notif.isRead ? 'bg-gray-200' : 'bg-orange-100'
                              }`}>
                                <AlertTriangle className={`w-5 h-5 ${
                                  notif.isRead ? 'text-gray-400' : 'text-orange-600'
                                }`} />
                              </div>
                              <div>
                                <h3 className={`font-bold ${notif.isRead ? 'text-gray-500' : 'text-gray-900'}`}>
                                  {notif.data?.itemName || 'Low Stock Item'}
                                </h3>
                                <p className="text-xs text-gray-500">
                                  Reported by: {notif.user.name} • {new Date(notif.createdAt).toLocaleString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </p>
                              </div>
                            </div>
                            
                            {notif.isRead ? (
                              <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                                DONE ✓
                              </span>
                            ) : (
                              <span className="px-3 py-1 bg-orange-600 text-white text-xs font-bold rounded-full animate-pulse">
                                PENDING
                              </span>
                            )}
                          </div>

                          {/* Alert Body */}
                          <div className="p-4">
                            {notif.data?.itemName ? (
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                                    Category
                                  </p>
                                  <p className="text-sm font-medium text-gray-700">
                                    {notif.data.category}
                                  </p>
                                </div>
                                
                                <div>
                                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                                    Current Stock
                                  </p>
                                  <p className={`text-lg font-bold ${
                                    notif.data.currentStock === 0
                                      ? 'text-red-600'
                                      : notif.data.currentStock < 10
                                      ? 'text-orange-600'
                                      : 'text-gray-900'
                                  }`}>
                                    {notif.data.currentStock}
                                    {notif.data.currentStock === 0 && (
                                      <span className="text-xs text-red-600 font-normal ml-1">
                                        (OUT)
                                      </span>
                                    )}
                                  </p>
                                </div>
                                
                                <div>
                                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                                    Required
                                  </p>
                                  <p className="text-lg font-bold text-gray-900">
                                    {notif.data.requiredStock || 'N/A'}
                                  </p>
                                </div>
                                
                                <div>
                                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                                    Priority
                                  </p>
                                  <span className={`inline-block px-2 py-1 text-xs font-bold rounded ${
                                    notif.data.urgencyLevel === 'URGENT'
                                      ? 'bg-red-100 text-red-700'
                                      : notif.data.urgencyLevel === 'HIGH'
                                      ? 'bg-orange-100 text-orange-700'
                                      : notif.data.urgencyLevel === 'NORMAL'
                                      ? 'bg-yellow-100 text-yellow-700'
                                      : 'bg-blue-100 text-blue-700'
                                  }`}>
                                    {notif.data.urgencyLevel}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <p className="text-sm text-gray-600">{notif.message}</p>
                            )}

                            {notif.data?.notes && (
                              <div className="mt-3 p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
                                <p className="text-xs font-semibold text-blue-900 mb-1">Additional Notes:</p>
                                <p className="text-sm text-gray-700">{notif.data.notes}</p>
                              </div>
                            )}

                            {/* Action Button */}
                            {!notif.isRead && (
                              <div className="mt-4 pt-4 border-t">
                                <button
                                  onClick={async () => {
                                    await fetch(`/api/notifications/${notif.id}`, {
                                      method: 'PATCH',
                                    });
                                    setNotifications((prev) =>
                                      prev.map((n) =>
                                        n.id === notif.id ? { ...n, isRead: true } : n
                                      )
                                    );
                                    setUnreadCount((prev) => Math.max(0, prev - 1));
                                    toast({
                                      title: 'Marked as Done',
                                      description: `${notif.data?.itemName} alert completed`,
                                    });
                                  }}
                                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold flex items-center justify-center gap-2"
                                >
                                  <CheckCircle className="w-5 h-5" />
                                  Mark as Done (Restocked)
                                </button>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>

                  {/* Summary */}
                  {notifications.length > 0 && (
                    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5 text-blue-600" />
                          <p className="text-sm font-medium text-blue-900">
                            {unreadCount} pending alert{unreadCount !== 1 ? 's' : ''} • {notifications.length - unreadCount} completed
                          </p>
                        </div>
                        <button
                          onClick={async () => {
                            // Delete all read notifications
                            await Promise.all(
                              notifications
                                .filter((n) => n.isRead)
                                .map((n) =>
                                  fetch(`/api/notifications/${n.id}`, { method: 'DELETE' })
                                )
                            );
                            const res = await fetch('/api/notifications');
                            const data = await res.json();
                            setNotifications(data);
                            toast({
                              title: 'Cleaned Up',
                              description: 'Completed alerts removed',
                            });
                          }}
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Clear Completed
                        </button>
                      </div>
                    </div>
                  )}
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
              {activeTab === 'staff' && (
                <motion.div
                  key="staff"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold">Staff Management</h2>
                    <button
                      onClick={() => setShowAddStaff(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800"
                    >
                      <Plus className="w-5 h-5" />
                      Add Staff Member
                    </button>
                  </div>

                  {/* Staff List */}
                  <div className="overflow-x-auto bg-white rounded-lg border">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="text-left p-4 font-semibold">Name</th>
                          <th className="text-left p-4 font-semibold">Email</th>
                          <th className="text-left p-4 font-semibold">Role</th>
                          <th className="text-left p-4 font-semibold">Created</th>
                          <th className="text-left p-4 font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {staffList.map((staff) => (
                          <tr key={staff.id} className="border-b hover:bg-gray-50">
                            <td className="p-4">{staff.name}</td>
                            <td className="p-4">{staff.email}</td>
                            <td className="p-4">
                              <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
                                staff.role === 'ADMIN' 
                                  ? 'bg-purple-100 text-purple-700' 
                                  : 'bg-blue-100 text-blue-700'
                              }`}>
                                {staff.role}
                              </span>
                            </td>
                            <td className="p-4 text-sm text-gray-600">
                              {new Date(staff.createdAt).toLocaleDateString()}
                            </td>
                            <td className="p-4">
                              <button
                                onClick={() => handleDeleteStaff(staff.id)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Add Staff Modal */}
                  {showAddStaff && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-xl p-6 max-w-md w-full"
                      >
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-xl font-bold">Add Staff Member</h3>
                          <button onClick={() => setShowAddStaff(false)} className="text-gray-400 hover:text-gray-600">
                            <X className="w-6 h-6" />
                          </button>
                        </div>

                        <form onSubmit={handleCreateStaff} className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium mb-2">Full Name</label>
                            <input
                              type="text"
                              value={staffForm.name}
                              onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                              className="w-full px-4 py-2 border rounded-lg"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-2">Email</label>
                            <input
                              type="email"
                              value={staffForm.email}
                              onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                              className="w-full px-4 py-2 border rounded-lg"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-2">Password</label>
                            <input
                              type="password"
                              value={staffForm.password}
                              onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                              className="w-full px-4 py-2 border rounded-lg"
                              required
                              minLength={8}
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-2">Role</label>
                            <select
                              value={staffForm.role}
                              onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}
                              className="w-full px-4 py-2 border rounded-lg"
                            >
                              <option value="STAFF">Staff</option>
                              <option value="ADMIN">Admin</option>
                            </select>
                          </div>

                          <div className="flex gap-3 pt-4">
                            <button
                              type="button"
                              onClick={() => setShowAddStaff(false)}
                              className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="flex-1 px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800"
                            >
                              Create Staff
                            </button>
                          </div>
                        </form>
                      </motion.div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* ✅ Inventory Tab with Add/Edit */}
              {activeTab === 'inventory' && (
                <motion.div
                  key="inventory"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Inventory Management</h2>
                    <button
                      onClick={() => setShowAddInventory(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800"
                    >
                      <Plus className="w-5 h-5" />
                      Add Item
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full bg-white rounded-lg border">
                      <thead className="border-b bg-gray-50">
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
                            <td className="p-3">
                              {editingInventory?.id === item.id ? (
                                <input
                                  type="text"
                                  value={editingInventory.itemName}
                                  onChange={(e) =>
                                    setEditingInventory({ ...editingInventory, itemName: e.target.value })
                                  }
                                  className="px-2 py-1 border rounded"
                                />
                              ) : (
                                item.itemName
                              )}
                            </td>
                            <td className="p-3">{item.category}</td>
                            <td className="p-3">
                              {editingInventory?.id === item.id ? (
                                <input
                                  type="number"
                                  value={editingInventory.quantity}
                                  onChange={(e) =>
                                    setEditingInventory({ ...editingInventory, quantity: parseInt(e.target.value) })
                                  }
                                  className="w-20 px-2 py-1 border rounded"
                                />
                              ) : (
                                `${item.quantity} ${item.unit}`
                              )}
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
                            <td className="p-3 flex gap-2">
                              {editingInventory?.id === item.id ? (
                                <>
                                  <button
                                    onClick={handleUpdateInventory}
                                    className="text-green-600 hover:text-green-800"
                                  >
                                    <Save className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => setEditingInventory(null)}
                                    className="text-gray-600 hover:text-gray-800"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => setEditingInventory(item)}
                                    className="text-blue-600 hover:text-blue-800"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteInventory(item.id)}
                                    className="text-red-600 hover:text-red-800"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Add Inventory Modal */}
                  {showAddInventory && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-xl p-6 max-w-md w-full"
                      >
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-xl font-bold">Add Inventory Item</h3>
                          <button onClick={() => setShowAddInventory(false)} className="text-gray-400 hover:text-gray-600">
                            <X className="w-6 h-6" />
                          </button>
                        </div>

                        <form onSubmit={handleAddInventory} className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium mb-2">Item Name</label>
                            <input
                              type="text"
                              value={inventoryForm.itemName}
                              onChange={(e) => setInventoryForm({ ...inventoryForm, itemName: e.target.value })}
                              className="w-full px-4 py-2 border rounded-lg"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-2">Category</label>
                            <select
                              value={inventoryForm.category}
                              onChange={(e) => setInventoryForm({ ...inventoryForm, category: e.target.value })}
                              className="w-full px-4 py-2 border rounded-lg"
                              required
                            >
                              <option value="">Select category...</option>
                              <option value="Paper & Supplies">Paper & Supplies</option>
                              <option value="Ink & Toner">Ink & Toner</option>
                              <option value="Binding Materials">Binding Materials</option>
                              <option value="Lamination Supplies">Lamination Supplies</option>
                              <option value="Office Supplies">Office Supplies</option>
                              <option value="Equipment Parts">Equipment Parts</option>
                            </select>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium mb-2">Quantity</label>
                              <input
                                type="number"
                                value={inventoryForm.quantity}
                                onChange={(e) => setInventoryForm({ ...inventoryForm, quantity: e.target.value })}
                                className="w-full px-4 py-2 border rounded-lg"
                                required
                                min="0"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium mb-2">Unit</label>
                              <select
                                value={inventoryForm.unit}
                                onChange={(e) => setInventoryForm({ ...inventoryForm, unit: e.target.value })}
                                className="w-full px-4 py-2 border rounded-lg"
                                required
                              >
                                <option value="">Select...</option>
                                <option value="reams">Reams</option>
                                <option value="bottles">Bottles</option>
                                <option value="pcs">Pieces</option>
                                <option value="boxes">Boxes</option>
                                <option value="rolls">Rolls</option>
                              </select>
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-2">Minimum Stock Level</label>
                            <input
                              type="number"
                              value={inventoryForm.minStockLevel}
                              onChange={(e) => setInventoryForm({ ...inventoryForm, minStockLevel: e.target.value })}
                              className="w-full px-4 py-2 border rounded-lg"
                              required
                              min="0"
                            />
                          </div>

                          <div className="flex gap-3 pt-4">
                            <button
                              type="button"
                              onClick={() => setShowAddInventory(false)}
                              className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="flex-1 px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800"
                            >
                              Add Item
                            </button>
                          </div>
                        </form>
                      </motion.div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* ✅ Products Tab */}
              {activeTab === 'products' && (
                <motion.div
                  key="products"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <div className="text-center py-12">
                    <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Products Management</h3>
                    <p className="text-gray-600 mb-6">Manage your printing products and services</p>
                    <button className="px-6 py-3 bg-blue-900 text-white rounded-lg hover:bg-blue-800">
                      <Plus className="w-5 h-5 inline mr-2" />
                      Add Product
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ✅ Settings Tab */}
              {activeTab === 'settings' && (
                <motion.div
                  key="settings"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <h2 className="text-xl font-semibold mb-6">System Settings</h2>
                  <div className="space-y-6">
                    <div className="bg-white p-6 rounded-lg border">
                      <h3 className="font-semibold mb-4">Business Information</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Business Name</label>
                          <input
                            type="text"
                            defaultValue="MQ Printing - EasyPrint"
                            className="w-full px-4 py-2 border rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Contact Email</label>
                          <input
                            type="email"
                            defaultValue="support@easyprint.com"
                            className="w-full px-4 py-2 border rounded-lg"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg border">
                      <h3 className="font-semibold mb-4">Pricing Settings</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Price per Page (B&W)</label>
                          <input
                            type="number"
                            defaultValue="1.00"
                            step="0.01"
                            className="w-full px-4 py-2 border rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Price per Page (Color)</label>
                          <input
                            type="number"
                            defaultValue="5.00"
                            step="0.01"
                            className="w-full px-4 py-2 border rounded-lg"
                          />
                        </div>
                      </div>
                    </div>

                    <button className="px-6 py-3 bg-blue-900 text-white rounded-lg hover:bg-blue-800">
                      Save Settings
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;