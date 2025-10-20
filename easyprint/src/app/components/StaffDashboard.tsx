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
  ChevronDown,
  QrCode,
  FileText,
  Download,
  Receipt,
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
  }, [toast]);

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
            .order-id { font-size: 18px; margin-top: 10px; }
            .section { margin: 20px 0; }
            .section-title { font-size: 16px; font-weight: bold; margin-bottom: 10px; color: #1e3a8a; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }
            .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
            .label { font-weight: 600; color: #4b5563; }
            .value { color: #1f2937; }
            .total { font-size: 20px; font-weight: bold; text-align: right; margin-top: 20px; padding: 15px; background: #eff6ff; border-radius: 8px; }
            .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #6b7280; }
            @media print {
              body { margin: 0; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">🖨️ EasyPrint</div>
            <div class="order-id">Order #${order.orderNumber || order.id}</div>
            <div style="font-size: 12px; color: #6b7280; margin-top: 5px;">
              ${new Date(order.createdAt).toLocaleString()}
            </div>
          </div>

          <div class="section">
            <div class="section-title">Customer Information</div>
            <div class="info-row">
              <span class="label">Name:</span>
              <span class="value">${order.customerName}</span>
            </div>
            <div class="info-row">
              <span class="label">Email:</span>
              <span class="value">${order.customerEmail}</span>
            </div>
            ${order.customerPhone ? `
              <div class="info-row">
                <span class="label">Phone:</span>
                <span class="value">${order.customerPhone}</span>
              </div>
            ` : ''}
          </div>

          <div class="section">
            <div class="section-title">Order Details</div>
            ${order.paperSize ? `
              <div class="info-row">
                <span class="label">Paper Size:</span>
                <span class="value">${order.paperSize}</span>
              </div>
            ` : ''}
            ${order.colorType ? `
              <div class="info-row">
                <span class="label">Color Type:</span>
                <span class="value">${order.colorType.replace('_', ' ')}</span>
              </div>
            ` : ''}
            ${order.copies ? `
              <div class="info-row">
                <span class="label">Copies:</span>
                <span class="value">${order.copies}</span>
              </div>
            ` : ''}
            ${order.pages ? `
              <div class="info-row">
                <span class="label">Pages:</span>
                <span class="value">${order.pages}</span>
              </div>
            ` : ''}
            ${order.bindingType && order.bindingType !== 'NONE' ? `
              <div class="info-row">
                <span class="label">Binding:</span>
                <span class="value">${order.bindingType.replace('_', ' ')}</span>
              </div>
            ` : ''}
          </div>

          ${order.notes ? `
            <div class="section">
              <div class="section-title">Customer Notes</div>
              <p style="padding: 10px; background: #f9fafb; border-radius: 6px;">${order.notes}</p>
            </div>
          ` : ''}

          ${order.adminNotes ? `
            <div class="section">
              <div class="section-title">Payment Reference</div>
              <p style="padding: 10px; background: #eff6ff; border-radius: 6px; font-family: monospace;">
                ${order.adminNotes.split('\n')[0].replace('Payment Ref: ', '')}
              </p>
            </div>
          ` : ''}

          <div class="total">
            Total Amount: ₱${order.totalPrice.toFixed(2)}
          </div>

          <div class="footer">
            <p>Thank you for choosing EasyPrint!</p>
            <p style="margin-top: 5px;">For questions, contact us at support@easyprint.com</p>
          </div>

          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
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

      const response = await fetch(order.fileUrl);
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
        description: 'File downloaded successfully',
      });
    } catch (error) {
      toast({
        title: 'Download Failed',
        description: 'Failed to download document',
        variant: 'destructive',
      });
    }
  };

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
          order.id === orderId
            ? { ...order, status: newStatus, updatedAt: new Date().toISOString() }
            : order
        )
      );

      toast({
        title: 'Status Updated',
        description: `Order status changed to ${newStatus}`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update order status',
        variant: 'destructive',
      });
    }
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
    completedToday: orders.filter(
      (o) =>
        o.status === 'COMPLETED' &&
        new Date(o.updatedAt).toDateString() === new Date().toDateString()
    ).length,
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
        {/* ✅ Header WITHOUT Bell Icon */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Staff Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user.name || user.email}!</p>
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
                      <h3 className="font-semibold">{order.orderNumber || `#${order.id}`}</h3>
                      <p className="text-sm text-gray-600">{order.customerName}</p>
                      <p className="text-xs text-gray-500">
                        Created: {new Date(order.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
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
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ✕
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Order ID</p>
                    <p className="font-semibold">{selectedOrder.orderNumber || `#${selectedOrder.id}`}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <span className={`px-3 py-1 rounded-lg text-sm font-medium ${getStatusColor(selectedOrder.status)}`}>
                      {getStatusLabel(selectedOrder.status)}
                    </span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-2">Customer Information</h3>
                  <p><strong>Name:</strong> {selectedOrder.customerName}</p>
                  <p><strong>Email:</strong> {selectedOrder.customerEmail}</p>
                  {selectedOrder.customerPhone && (
                    <p><strong>Phone:</strong> {selectedOrder.customerPhone}</p>
                  )}
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-2">Order Details</h3>
                  {selectedOrder.paperSize && <p><strong>Paper Size:</strong> {selectedOrder.paperSize}</p>}
                  {selectedOrder.colorType && <p><strong>Color:</strong> {selectedOrder.colorType}</p>}
                  {selectedOrder.copies && <p><strong>Copies:</strong> {selectedOrder.copies}</p>}
                  {selectedOrder.pages && <p><strong>Pages:</strong> {selectedOrder.pages}</p>}
                  {selectedOrder.bindingType && <p><strong>Binding:</strong> {selectedOrder.bindingType}</p>}
                  <p><strong>Total:</strong> ₱{selectedOrder.totalPrice}</p>
                </div>

                {selectedOrder.adminNotes && (
                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <QrCode className="w-5 h-5 text-blue-900" />
                      Payment Proof
                    </h3>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm">
                        <strong>Reference Number:</strong>{' '}
                        <span className="font-mono text-blue-900">
                          {selectedOrder.adminNotes.split('\n')[0].replace('Payment Ref: ', '')}
                        </span>
                      </p>
                      {selectedOrder.adminNotes.includes('Screenshot:') && (
                        <div className="mt-2">
                          <p className="text-sm mb-1"><strong>Screenshot:</strong></p>
                          <a
                            href={selectedOrder.adminNotes.split('Screenshot: ')[1]}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 hover:underline text-sm"
                          >
                            View Payment Screenshot
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {selectedOrder.fileName && (
                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-2">Uploaded Document</h3>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <FileText className="w-5 h-5 text-blue-900" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{selectedOrder.fileName}</p>
                        <a
                          href={selectedOrder.fileUrl || '#'}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:underline text-xs"
                        >
                          View Document
                        </a>
                      </div>
                      <button
                        onClick={() => downloadDocument(selectedOrder)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Download Document"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}

                {selectedOrder.notes && (
                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-2">Customer Notes</h3>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{selectedOrder.notes}</p>
                  </div>
                )}

                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-2">Staff Notes</h3>
                  <textarea
                    value={selectedOrder.adminNotes || ''}
                    onChange={(e) => setSelectedOrder({ ...selectedOrder, adminNotes: e.target.value })}
                    className="w-full p-3 border rounded-lg"
                    rows={3}
                    placeholder="Add internal notes here..."
                  />
                  <button
                    onClick={async () => {
                      try {
                        const response = await fetch(`/api/orders/${selectedOrder.id}`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ adminNotes: selectedOrder.adminNotes }),
                        });
                        if (response.ok) {
                          toast({ title: 'Notes Updated', description: 'Staff notes saved successfully.' });
                        }
                      } catch (error) {
                        toast({ title: 'Error', description: 'Failed to update notes', variant: 'destructive' });
                      }
                    }}
                    className="mt-2 px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors"
                  >
                    Save Notes
                  </button>
                </div>

                <div className="border-t pt-4">
                  <button
                    onClick={() => printReceipt(selectedOrder)}
                    className="w-full py-3 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg hover:from-green-700 hover:to-green-600 transition-all flex items-center justify-center gap-2 font-semibold"
                  >
                    <Receipt className="w-5 h-5" />
                    Print Receipt
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffDashboard;