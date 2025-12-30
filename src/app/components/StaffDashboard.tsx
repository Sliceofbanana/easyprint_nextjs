'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  Clock,
  CheckCircle,
  Search,
  Filter,
  Eye,
  ChevronDown,
  QrCode,
  FileText,
  Download,
  Receipt,
  Settings,
  User,
} from 'lucide-react';
import { useToast } from '../components/ui/Use-Toast';
import { AlertTriangle, Bell } from 'lucide-react';
import LowStockModal from './ui/LowStockModal';
import Image from 'next/image';

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

const StaffDashboard: React.FC<StaffDashboardProps> = ({ user, onLogout }) => {
  const { toast } = useToast();

  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'orders' | 'settings'>('orders');
  const [showLowStockModal, setShowLowStockModal] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, right: 'auto' as 'auto' | number });

  const statusOptions = [
    { value: 'all', label: 'All Orders' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'PROCESSING', label: 'Processing' },
    { value: 'READY', label: 'Ready for Pickup' },
    { value: 'ON_DELIVERY', label: 'Out for Delivery' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'CANCELLED', label: 'Cancelled' },
  ];

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/orders');
        if (!response.ok) throw new Error('Failed to fetch orders');
        const data = await response.json();
        setOrders(data || []);
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

    const interval = setInterval(() => {
      fetch('/api/orders')
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data) setOrders(data);
        })
        .catch(console.error);
    }, 10000);

    return () => clearInterval(interval);
  }, [toast]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdownId && !(event.target as Element).closest('.status-dropdown')) {
        setOpenDropdownId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdownId]);

  // ✅ Calculate dropdown position when opened
  useEffect(() => {
    if (openDropdownId) {
      const calculatePosition = () => {
        const buttonElement = document.querySelector(`[data-order-id="${openDropdownId}"]`);
        if (!buttonElement) return;

        const rect = buttonElement.getBoundingClientRect();
        const dropdownHeight = 210; // Approximate max height
        const gap = 4; // Small gap between button and dropdown

        // Check if there's space below
        const spaceBelow = window.innerHeight - rect.bottom;
        const shouldOpenUpward = spaceBelow < dropdownHeight;

        setDropdownPosition({ 
          top: shouldOpenUpward ? rect.top - dropdownHeight - gap : rect.bottom + gap,
          left: rect.left, // Left-aligned (or use rect.right - 224 for right-aligned)
          right: 'auto' 
        });
      };

      calculatePosition();
      
      window.addEventListener('scroll', calculatePosition, true);
      window.addEventListener('resize', calculatePosition);
      
      return () => {
        window.removeEventListener('scroll', calculatePosition, true);
        window.removeEventListener('resize', calculatePosition);
      };
    }
  }, [openDropdownId]);

  useEffect(() => {
    let filtered = orders;

    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
          (order.id?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
          (order.orderNumber?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
          (order.customerName?.toLowerCase() || '').includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    setFilteredOrders(filtered);
  }, [orders, searchTerm, statusFilter]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setOrders((prev) =>
          prev.map((order) =>
            order.id === orderId ? { ...order, status: newStatus } : order
          )
        );
        toast({ title: 'Status Updated', description: `Order status changed to ${newStatus}` });
        setOpenDropdownId(null);
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' });
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
        variant: 'info'
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
        variant: 'success',
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

  const printReceipt = (order: Order) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        title: 'Error',
        description: 'Please allow popups to print',
        variant: 'destructive',
      });
      return;
    }

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Order #${order.orderNumber}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #1e3a8a; padding-bottom: 20px; }
            .logo { font-size: 24px; font-weight: bold; color: #1e3a8a; }
            .section { margin: 20px 0; }
            .section-title { font-size: 16px; font-weight: bold; margin-bottom: 10px; color: #1e3a8a; }
            .info-row { display: flex; justify-between; padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
            .total { font-size: 20px; font-weight: bold; text-align: right; margin-top: 20px; padding: 15px; background: #eff6ff; border-radius: 8px; }
            .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">🖨️ MQ Printing - EasyPrint</div>
            <div>Order #${order.orderNumber || order.id}</div>
          </div>
          <div class="section">
            <div class="section-title">Customer Information</div>
            <div class="info-row"><span>Name:</span><span>${order.customerName}</span></div>
            <div class="info-row"><span>Email:</span><span>${order.customerEmail}</span></div>
            ${order.customerPhone ? `<div class="info-row"><span>Phone:</span><span>${order.customerPhone}</span></div>` : ''}
          </div>
          <div class="section">
            <div class="section-title">Order Details</div>
            ${order.paperSize ? `<div class="info-row"><span>Paper Size:</span><span>${order.paperSize}</span></div>` : ''}
            ${order.colorType ? `<div class="info-row"><span>Color Type:</span><span>${order.colorType}</span></div>` : ''}
            ${order.copies ? `<div class="info-row"><span>Copies:</span><span>${order.copies}</span></div>` : ''}
            ${order.pages ? `<div class="info-row"><span>Pages:</span><span>${order.pages}</span></div>` : ''}
          </div>
          <div class="total">Total Amount: ₱${order.totalPrice.toFixed(2)}</div>
          <div class="footer">
            <p>Thank you for choosing MQ Printing!</p>
            <p>For questions, contact us at support@mqprinting.com</p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
      
    setTimeout(() => {
      printWindow.print();
    }, 250);

    } catch (err) {  // ✅ FIXED: Rename to 'err' and use it
      console.error('Print error:', err);
      toast({
        title: 'Print Failed',
        description: err instanceof Error ? err.message : 'Failed to generate print preview',
        variant: 'destructive',
      });
    }
  };


  const extractPaymentInfo = (adminNotes?: string) => {
    if (!adminNotes) return null;
    
    const refMatch = adminNotes.match(/Payment\s*Ref(?:erence)?:\s*(.+?)(?:\n|$)/i);
    const screenshotMatch = adminNotes.match(/Screenshot:\s*(.+?)(?:\n|$)/i);
    
    const reference = refMatch ? refMatch[1].trim() : null;
    const screenshotUrl = screenshotMatch ? screenshotMatch[1].trim() : null;

    const paymentInfo = {
      reference: reference || 'No reference provided',
      screenshotUrl: screenshotUrl || null,
    };
    
    return paymentInfo;
  };

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
    processing: orders.filter((o) => o.status === 'PROCESSING').length,
    completedToday: orders.filter(
      (o) =>
        o.status === 'COMPLETED' &&
        new Date(o.updatedAt).toDateString() === new Date().toDateString()
    ).length,
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'orders':
        return (
          <div>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[
                { title: 'Total Orders', value: stats.total, icon: Package, color: 'text-blue-600' },
                { title: 'Pending', value: stats.pending, icon: Clock, color: 'text-orange-600' },
                { title: 'Processing', value: stats.processing, icon: Package, color: 'text-blue-600' },
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
                  filteredOrders.map((order, index) => (
                    <div
                      key={order.id}
                      className="p-6 hover:bg-gray-50 relative"
                      style={{ 
                        position: 'relative',
                        zIndex: filteredOrders.length - index
                      }}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex-1 min-w-[200px]">
                          <h3 className="font-semibold">{order.orderNumber || `#${order.id}`}</h3>
                          <p className="text-sm text-gray-600">{order.customerName}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(order.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <p className="font-semibold">₱{order.totalPrice.toFixed(2)}</p>
                          
                          {/* ✅ Status Dropdown with data-order-id */}
                          <div className="relative status-dropdown" data-order-id={order.id}>
                            <button
                              onClick={() => setOpenDropdownId(openDropdownId === order.id ? null : order.id)}
                              className={`px-3 py-1.5 text-sm font-medium rounded-lg ${getStatusColor(order.status)} flex items-center gap-2 hover:opacity-80 transition-opacity`}
                            >
                              {getStatusLabel(order.status)} <ChevronDown size={14} />
                            </button>
                          </div>

                          <button
                            onClick={() => downloadDocument(order)}
                            disabled={!order.fileUrl}
                            className={`p-2 rounded-lg transition-colors ${
                              order.fileUrl
                                ? 'text-green-600 hover:bg-green-50'
                                : 'text-gray-300 cursor-not-allowed'
                            }`}
                            title="Download Document"
                          >
                            <Download className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        );

      case 'settings':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-xl shadow-lg border"
          >
            <h2 className="text-xl font-semibold mb-6">Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Email Notifications</label>
                <input type="checkbox" className="mr-2" />
                <span className="text-sm text-gray-600">Receive email notifications for new orders</span>
              </div>
            </div>
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
          <p className="text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-full py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Staff Dashboard</h1>
            <p className="text-gray-600">Welcome back, {user.name || user.email}!</p>
          </div>
          
          <button
            onClick={() => setShowLowStockModal(true)}
            className="flex items-center gap-2 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors shadow-lg hover:shadow-xl"
            title="Report Low Stock Items"
          >
            <AlertTriangle className="w-5 h-5" />
            <span>Low Stock Alert</span>
          </button>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg border mb-8">
          <div className="flex border-b overflow-x-auto">
            {[
              { id: 'orders', label: 'Orders', icon: Package },
              { id: 'settings', label: 'Settings', icon: Settings },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'orders' | 'settings')}
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
            {renderTabContent()}
          </div>
        </div>

        {/* ✅ PORTAL DROPDOWN - Fixed positioning */}
        <AnimatePresence>
          {openDropdownId && (() => {
            const buttonElement = document.querySelector(`[data-order-id="${openDropdownId}"]`);
            if (!buttonElement) return null;
            
            return (
              <>
                {/* Backdrop - click to close */}
                <div 
                  className="fixed inset-0 z-[100]" 
                  onClick={() => setOpenDropdownId(null)}
                />
                
                {/* Dropdown Menu */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  className="fixed z-[101] bg-white rounded-lg shadow-2xl border-2 border-gray-200 py-1 w-56"
                  style={{
                    top: `${dropdownPosition.top}px`,
                    left: `${dropdownPosition.left}px`,
                    maxHeight: '300px',
                    overflowY: 'auto',
                    // ✅ Add smooth scrollbar styling
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#cbd5e1 #f1f5f9'
                  }}
                >
                  {statusOptions
                    .filter((s) => s.value !== 'all' && s.value !== orders.find(o => o.id === openDropdownId)?.status)
                    .map((s) => (
                      <button
                        key={s.value}
                        onClick={() => {
                          if (openDropdownId) {
                            updateOrderStatus(openDropdownId, s.value);
                          }
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-100 transition-colors flex items-center gap-2"
                      >
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          s.value === 'PENDING' ? 'bg-yellow-500' :
                          s.value === 'PROCESSING' ? 'bg-blue-500' :
                          s.value === 'READY' ? 'bg-indigo-500' :
                          s.value === 'ON_DELIVERY' ? 'bg-orange-500' :
                          s.value === 'COMPLETED' ? 'bg-green-500' :
                          'bg-red-500'
                        }`}></span>
                        <span>{s.label}</span>
                      </button>
                    ))}
                </motion.div>
              </>
            );
          })()}
        </AnimatePresence>

        {/* Order Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[110] p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b flex justify-between items-center bg-gradient-to-r from-blue-900 to-blue-700">
                <h2 className="text-xl font-semibold text-white">Order Details & Payment Verification</h2>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-white hover:text-gray-200 text-2xl"
                >
                  ✕
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Order Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Order ID</p>
                    <p className="font-semibold text-lg">{selectedOrder.orderNumber || `#${selectedOrder.id}`}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <span className={`px-3 py-1 rounded-lg text-sm font-medium ${getStatusColor(selectedOrder.status)}`}>
                      {getStatusLabel(selectedOrder.status)}
                    </span>
                  </div>
                </div>

                {/* ✅ PAYMENT VERIFICATION SECTION - PROMINENT */}
                {(() => {
                  const paymentInfo = extractPaymentInfo(selectedOrder.adminNotes);
                  console.log('💳 Payment Info Check:', paymentInfo);
                  console.log('📝 Admin Notes:', selectedOrder.adminNotes);
                  
                  return paymentInfo && (
                    <div className="border-2 border-orange-300 bg-gradient-to-br from-orange-50 to-yellow-50 p-6 rounded-xl shadow-lg">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                          <QrCode className="w-6 h-6 text-orange-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-gray-900">Payment Verification Required</h3>
                          <p className="text-sm text-gray-600">Review customer's payment proof below</p>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-6">
                        {/* Payment Reference */}
                        <div className="bg-white p-4 rounded-lg border-2 border-orange-200">
                          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                            GCash Reference Number
                          </p>
                          <div className="flex items-center gap-2">
                            <p className="font-mono font-bold text-xl text-orange-600">
                              {paymentInfo.reference}
                            </p>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(paymentInfo.reference || '');
                                toast({
                                  title: 'Copied!',
                                  description: 'Reference number copied to clipboard',
                                  variant: 'success',
                                });
                              }}
                              className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                              title="Copy reference number"
                            >
                              📋
                            </button>
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            Verify this in your GCash transaction history
                          </p>
                        </div>

                        {/* Payment Screenshot */}
                        {paymentInfo.screenshotUrl && paymentInfo.screenshotUrl !== 'Not uploaded' && (
                          <div className="bg-white p-4 rounded-lg border-2 border-orange-200">
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                              Payment Screenshot
                            </p>
                            <div className="relative group">
                              <img
                                src={paymentInfo.screenshotUrl}
                                alt="Payment Proof"
                                className="w-full h-48 object-contain rounded-lg border-2 border-gray-200 cursor-pointer hover:border-orange-400 transition-all"
                                unoptimized
                                onClick={() => window.open(paymentInfo.screenshotUrl || '', '_blank')}
                                onError={(e) => {
                                  console.error('❌ Failed to load payment screenshot:', paymentInfo.screenshotUrl);
                                  e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23f3f4f6" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%236b7280"%3EImage Error%3C/text%3E%3C/svg%3E';
                                }}
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-lg flex items-center justify-center transition-all">
                                <div className="opacity-0 group-hover:opacity-100 bg-white/90 px-4 py-2 rounded-lg transition-opacity">
                                  <p className="text-xs font-medium text-gray-900 flex items-center gap-2">
                                    <Eye className="w-4 h-4" />
                                    Click to view full size
                                  </p>
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => window.open(paymentInfo.screenshotUrl || '', '_blank')}
                              className="w-full mt-2 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                            >
                              <Eye className="w-4 h-4" />
                              View Full Screenshot
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Payment Amount Verification */}
                      <div className="mt-4 bg-white p-4 rounded-lg border-2 border-orange-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">
                              Expected Payment Amount
                            </p>
                            <p className="text-2xl font-bold text-orange-600">
                              ₱{selectedOrder.totalPrice.toFixed(2)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500 mb-1">Verify this matches</p>
                            <p className="text-xs text-gray-500">the screenshot amount</p>
                          </div>
                        </div>
                      </div>

                      {/* Quick Actions */}
                      {selectedOrder.status === 'PENDING' && (
                        <div className="mt-4 flex gap-3">
                          <button
                            onClick={() => {
                              updateOrderStatus(selectedOrder.id, 'PROCESSING');
                              toast({
                                title: 'Payment Verified',
                                description: 'Order moved to processing',
                                variant: 'success',
                              });
                            }}
                            className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold flex items-center justify-center gap-2"
                          >
                            <CheckCircle className="w-5 h-5" />
                            Approve Payment
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Are you sure you want to reject this payment? This will cancel the order.')) {
                                updateOrderStatus(selectedOrder.id, 'CANCELLED');
                                toast({
                                  title: 'Payment Rejected',
                                  description: 'Order has been cancelled',
                                  variant: 'destructive',
                                });
                              }
                            }}
                            className="px-4 py-3 border-2 border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-semibold"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Customer Information */}
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-900" />
                    Customer Information
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <p className="text-sm"><strong className="text-gray-600">Name:</strong> {selectedOrder.customerName}</p>
                    <p className="text-sm"><strong className="text-gray-600">Email:</strong> {selectedOrder.customerEmail}</p>
                    {selectedOrder.customerPhone && (
                      <p className="text-sm"><strong className="text-gray-600">Phone:</strong> {selectedOrder.customerPhone}</p>
                    )}
                  </div>
                </div>

                {/* Order Details */}
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Package className="w-5 h-5 text-blue-900" />
                    Order Specifications
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg grid grid-cols-2 gap-3">
                    {selectedOrder.paperSize && (
                      <p className="text-sm"><strong className="text-gray-600">Paper:</strong> {selectedOrder.paperSize}</p>
                    )}
                    {selectedOrder.colorType && (
                      <p className="text-sm"><strong className="text-gray-600">Type:</strong> {selectedOrder.colorType}</p>
                    )}
                    {selectedOrder.copies && (
                      <p className="text-sm"><strong className="text-gray-600">Copies:</strong> {selectedOrder.copies}</p>
                    )}
                    {selectedOrder.pages && (
                      <p className="text-sm"><strong className="text-gray-600">Pages:</strong> {selectedOrder.pages}</p>
                    )}
                    {selectedOrder.bindingType && selectedOrder.bindingType !== 'NONE' && (
                      <p className="text-sm"><strong className="text-gray-600">Binding:</strong> {selectedOrder.bindingType}</p>
                    )}
                  </div>
                </div>

                {/* Uploaded Document */}
                {selectedOrder.fileName && (
                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-900" />
                      Uploaded Document
                    </h3>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <FileText className="w-5 h-5 text-blue-900" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{selectedOrder.fileName}</p>
                        <div className="flex gap-3 mt-1">
                          <button
                            onClick={() => {
                              if (selectedOrder.fileUrl) {
                                // ✅ Use direct URL (matches admin dashboard pattern)
                                window.open(selectedOrder.fileUrl, '_blank');
                              }
                            }}
                            className="text-blue-600 hover:underline text-xs flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            View Document
                          </button>
                          <button
                            onClick={() => downloadDocument(selectedOrder)}
                            className="text-green-600 hover:underline text-xs flex items-center gap-1"
                          >
                            <Download className="w-3 h-3" />
                            Download
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Print Receipt Button */}
                <div className="border-t pt-4">
                  <button
                    onClick={() => printReceipt(selectedOrder)}
                    className="w-full py-3 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg hover:from-green-700 hover:to-green-600 transition-all flex items-center justify-center gap-2 font-semibold shadow-lg hover:shadow-xl"
                  >
                    <Receipt className="w-5 h-5" />
                    Print Receipt
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        <LowStockModal
          isOpen={showLowStockModal}
          onClose={() => setShowLowStockModal(false)}
        />
      </div>
    </div>
  );
};

export default StaffDashboard;