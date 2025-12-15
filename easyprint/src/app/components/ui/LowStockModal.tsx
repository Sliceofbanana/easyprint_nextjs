'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Send, Loader2, Package } from 'lucide-react';
import { useToast } from './Use-Toast';

interface LowStockModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LowStockModal({ isOpen, onClose }: LowStockModalProps) {
  const { toast } = useToast();
  const [sending, setSending] = useState(false);
  
  const [formData, setFormData] = useState({
    itemName: '',
    category: '',
    currentStock: '',
    requiredStock: '',
    urgencyLevel: 'NORMAL',
    additionalNotes: '',
  });

  const categories = [
    'Paper & Supplies',
    'Ink & Toner',
    'Binding Materials',
    'Lamination Supplies',
    'Office Supplies',
    'Equipment Parts',
    'Other',
  ];

  const urgencyLevels = [
    { value: 'LOW', label: 'Low Priority', color: 'text-blue-600' },
    { value: 'NORMAL', label: 'Normal Priority', color: 'text-yellow-600' },
    { value: 'HIGH', label: 'High Priority', color: 'text-orange-600' },
    { value: 'URGENT', label: 'Urgent - Out of Stock', color: 'text-red-600' },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.itemName || !formData.category || !formData.currentStock) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setSending(true);

    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'LOW_STOCK',
          title: `🚨 Low Stock Alert: ${formData.itemName}`,
          message: `**Category:** ${formData.category}
**Current Stock:** ${formData.currentStock} ${formData.currentStock === '0' ? '(OUT OF STOCK)' : 'units'}
**Required Stock:** ${formData.requiredStock || 'Not specified'}
**Urgency:** ${urgencyLevels.find(u => u.value === formData.urgencyLevel)?.label}

${formData.additionalNotes ? `**Notes:**\n${formData.additionalNotes}` : ''}

Please restock as soon as possible.`,
          data: {
            itemName: formData.itemName,
            category: formData.category,
            currentStock: parseInt(formData.currentStock) || 0,
            requiredStock: formData.requiredStock ? parseInt(formData.requiredStock) : null,
            urgencyLevel: formData.urgencyLevel,
            notes: formData.additionalNotes,
            reportedAt: new Date().toISOString(),
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send notification');
      }

      toast({
        title: 'Alert Sent',
        description: `Low stock alert for ${formData.itemName} has been sent to admin`,
        variant: 'success',
      });

      // Reset form
      setFormData({
        itemName: '',
        category: '',
        currentStock: '',
        requiredStock: '',
        urgencyLevel: 'NORMAL',
        additionalNotes: '',
      });

      onClose();
    } catch (error) {
      toast({
        title: 'Failed to Send',
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b flex items-center justify-between bg-gradient-to-r from-orange-50 to-red-50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Report Low Stock</h2>
                  <p className="text-sm text-gray-600">Notify admin about items needing restock</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1">
              <div className="space-y-5">
                {/* Item Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Item Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="itemName"
                      value={formData.itemName}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="e.g., A4 Bond Paper"
                      required
                    />
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select category...</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Stock Levels */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Stock <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="currentStock"
                      value={formData.currentStock}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="0"
                      min="0"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">Current quantity in stock</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Required Stock
                    </label>
                    <input
                      type="number"
                      name="requiredStock"
                      value={formData.requiredStock}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="e.g., 50"
                      min="0"
                    />
                    <p className="text-xs text-gray-500 mt-1">Recommended quantity</p>
                  </div>
                </div>

                {/* Urgency Level */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Urgency Level <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {urgencyLevels.map((level) => (
                      <label
                        key={level.value}
                        className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                          formData.urgencyLevel === level.value
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="urgencyLevel"
                          value={level.value}
                          checked={formData.urgencyLevel === level.value}
                          onChange={handleChange}
                          className="mr-3"
                        />
                        <span className={`text-sm font-medium ${level.color}`}>
                          {level.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Additional Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Notes
                  </label>
                  <textarea
                    name="additionalNotes"
                    value={formData.additionalNotes}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                    rows={4}
                    placeholder="Any additional information about this low stock alert..."
                  />
                </div>

                {/* Preview */}
                {formData.itemName && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm font-semibold text-blue-900 mb-2">Preview:</p>
                    <p className="text-sm text-gray-700">
                      <strong>{formData.itemName}</strong> in{' '}
                      <strong>{formData.category || 'category'}</strong> - Current stock:{' '}
                      <span className={formData.currentStock === '0' ? 'text-red-600 font-bold' : ''}>
                        {formData.currentStock || '0'} units
                      </span>
                    </p>
                  </div>
                )}
              </div>
            </form>

            {/* Footer */}
            <div className="p-6 border-t bg-gray-50">
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={sending}
                  className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Sending Alert...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Send to Admin
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}