"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Upload,
  FileText,
  Trash2,
  Plus,
  Minus,
  CheckCircle,
  QrCode,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import { useToast } from "../components/ui/Use-Toast";
import { useSession } from 'next-auth/react';

interface OrderSystemProps {
  onBack?: () => void;
}

const OrderSystem: React.FC<OrderSystemProps> = ({ onBack }) => {
  const router = useRouter();
  const { toast } = useToast();
  const { data: session } = useSession();

  const [currentStep, setCurrentStep] = useState(1);
  const [files, setFiles] = useState<any[]>([]);
  const [orderDetails, setOrderDetails] = useState({
    paperSize: "a4",
    printMode: "black",
    copies: 1,
    binding: "none",
    lamination: { enabled: false, micron: 125, size: "a4", qty: 0 },
    rushPackage: "",
    deliveryType: "campus",
    deliveryLocation: "",
    specialInstructions: "",
    contactName: "",
    contactPhone: "",
    contactEmail: "user@example.com",
  });
// Update paymentProof state
const [paymentProof, setPaymentProof] = useState<{ 
  file: File | null; 
  ref: string;
  url?: string;
}>({
  file: null,
  ref: "",
  url: "", 
});
  const [isDragOver, setIsDragOver] = useState(false);
  const [orderTotal, setOrderTotal] = useState(0);
  const [orderId, setOrderId] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const proofInputRef = useRef<HTMLInputElement>(null);

  const steps = [
    "Upload",
    "Options",
    "Delivery",
    "Contact",
    "Review",
    "Payment",
    "Confirmation",
  ];

  const cebuLocations = [
    "University of San Carlos",
    "Cebu Institute of Technology",
    "University of Cebu",
    "Cebu Normal University",
    "University of San Jose Recoletos",
    "Southwestern University",
    "University of the Philippines Cebu",
  ];

  // ✅ FIXED: Corrected per-page pricing
  const PRINT_PRICES: Record<string, Record<string, number>> = {
    short: { black: 1.75, partial: 2.75, full: 8.5, borderless: 17 },
    a4: { black: 2.0, partial: 3.0, full: 9.0, borderless: 18 },
    long: { black: 2.5, partial: 4.0, full: 10.0, borderless: 20 },
    a3: { black: 10.0, partial: 15.0, full: 20.0, borderless: 30 },
  };

  const BINDING_PRICES: Record<string, (pages: number) => number> = {
    "book-soft": (pages) => (pages <= 150 ? 300 : pages <= 300 ? 350 : 400),
    "book-hard": (pages) => (pages <= 150 ? 400 : pages <= 300 ? 450 : 500),
    "wire-soft": (pages) => (pages <= 50 ? 60 : pages <= 100 ? 80 : 80),
    "wire-hard": (pages) => (pages <= 50 ? 110 : pages <= 100 ? 130 : 130),
  };

  // ✅ FIXED: Correct calculation logic
  const calculateTotal = useCallback(() => {
    // Step 1: Calculate total pages from all files
    const totalPagesInFiles = files.reduce((sum, f) => sum + (f.pages || 1), 0);
    
    // Step 2: Get number of copies
    const copies = Number(orderDetails.copies) || 1;
    
    // Step 3: Get price per page based on paper size and print mode
    const sizeKey = orderDetails.paperSize || "a4";
    const modeKey = orderDetails.printMode || "black";
    const pricePerPage = PRINT_PRICES[sizeKey]?.[modeKey] || 0;
    
    // ✅ FIXED: Calculate printing cost correctly
    // Formula: pages × copies × price per page
    // Example: 1 page × 5 copies × ₱2 = ₱10
    const printingCost = totalPagesInFiles * copies * pricePerPage;

    // Step 4: Calculate binding cost (if applicable)
    let bindingCost = 0;
    if (orderDetails.binding !== "none") {
      const priceFn = BINDING_PRICES[orderDetails.binding];
      if (priceFn) {
        // Binding cost is per copy (bind each set separately)
        bindingCost = priceFn(totalPagesInFiles) * copies;
      }
    }

    // Step 5: Calculate delivery cost
    const deliveryCost = orderDetails.deliveryType === "campus" ? 10 : 0;

    // Step 6: Calculate grand total
    const total = Number((printingCost + bindingCost + deliveryCost).toFixed(2));
    
    setOrderTotal(total);
    
    return total;
  }, [files, orderDetails]);

  useEffect(() => {
    calculateTotal();
  }, [calculateTotal]);

  const uploadFileToCloudinary = async (file: File, type: 'document' | 'payment') => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', type);

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to upload file');
  }

  return await response.json();
};

// Update handleFileUpload function
const handleFileUpload = async (uploadedFiles: FileList | null) => {
  if (!uploadedFiles) return;
  
  setIsUploading(true);
  
  try {
    const uploadPromises = Array.from(uploadedFiles).map(async (file) => {
      const uploadResult = await uploadFileToCloudinary(file, 'document');
      
      return {
        id: Date.now() + Math.random(),
        file,
        name: file.name,
        size: file.size,
        pages: 1,
        url: uploadResult.url,
        publicId: uploadResult.publicId,
      };
    });

    const newFiles = await Promise.all(uploadPromises);
    setFiles((prev) => [...prev, ...newFiles]);
    
    toast({ 
      title: "Files Uploaded", 
      description: `${newFiles.length} file(s) uploaded successfully.` 
    });
  } catch (error) {
    toast({
      title: "Upload Failed",
      description: "Failed to upload files. Please try again.",
      variant: "destructive",
    });
  } finally {
    setIsUploading(false);
  }
};

// Update handleProofUpload function
const handleProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  setIsUploading(true);

  try {
    const uploadResult = await uploadFileToCloudinary(file, 'payment');
    
    setPaymentProof({
      file,
      ref: paymentProof.ref,
      url: uploadResult.url,
    });

    toast({ 
      title: "Screenshot Uploaded", 
      description: file.name 
    });
  } catch (error) {
    toast({
      title: "Upload Failed",
      description: "Failed to upload payment proof.",
      variant: "destructive",
    });
  } finally {
    setIsUploading(false);
  }
};

  const nextStep = async () => {
    if (currentStep === 1 && files.length === 0) {
      toast({
        title: "No Files",
        description: "Please upload at least one file.",
        variant: "destructive",
      });
      return;
    }

    if (currentStep === 4) {
      if (!orderDetails.contactName || !orderDetails.contactPhone || !orderDetails.contactEmail) {
        toast({
          title: "Incomplete Contact Info",
          description: "Please fill in all contact fields.",
          variant: "destructive",
        });
        return;
      }
    }

    if (currentStep === 6) {
      if (!paymentProof.ref || !paymentProof.url) {
        toast({
          title: "Payment Required",
          description: "Please provide reference number and upload payment screenshot.",
          variant: "destructive",
        });
        return;
      }

      try {
        // ✅ Calculate all required values
        const totalPages = files.reduce((sum, f) => sum + (f.pages || 1), 0);
        const pricePerPage = PRINT_PRICES[orderDetails.paperSize]?.[orderDetails.printMode] || 0;

        // ✅ Map print mode to color type
        const colorTypeMap: Record<string, string> = {
          black: 'BLACK_AND_WHITE',
          partial: 'COLOR',
          full: 'COLOR',
          borderless: 'COLOR',
        };

         const paperSizeMap: Record<string, string> = {
          short: 'LETTER',
          a4: 'A4',
          long: 'LEGAL',
          a3: 'A3',
        };

        // ✅ Map binding type
        const bindingTypeMap: Record<string, string> = {
          none: 'NONE',
          'book-soft': 'BOOK_SOFT',
          'book-hard': 'BOOK_HARD',
          'wire-soft': 'WIRE_SOFT',
          'wire-hard': 'WIRE_HARD',
        };

        const orderPayload = {
          customerName: orderDetails.contactName,
          customerEmail: orderDetails.contactEmail,
          customerPhone: orderDetails.contactPhone,
          serviceType: 'DOCUMENT_PRINTING',
          paperSize: paperSizeMap[orderDetails.paperSize] || 'A4',
          colorType: colorTypeMap[orderDetails.printMode] || 'BLACK_AND_WHITE',
          copies: orderDetails.copies,
          pages: totalPages,
          bindingType: bindingTypeMap[orderDetails.binding] || 'NONE',
          fileUrl: files[0]?.url || '',
          fileName: files[0]?.name || 'document.pdf',
          pricePerPage: pricePerPage,
          totalPrice: orderTotal,
          notes: orderDetails.specialInstructions || '',
          paymentProofUrl: paymentProof.url,
          paymentProof: {
            ref: paymentProof.ref,
            fileName: paymentProof.file?.name || 'payment_proof.jpg',
            url: paymentProof.url,
          },
        };

        console.log('📤 Sending order payload:', orderPayload);

        const response = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderPayload),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('❌ Order creation failed:', errorData);
          throw new Error(errorData.error || 'Failed to create order');
        }

        const data = await response.json();
        setOrderId(data.order.orderNumber);

        toast({
          title: "Order Placed!",
          description: "Your payment is being verified.",
        });
      } catch (error) {
        console.error('Order submission error:', error);
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to place order. Please try again.",
          variant: "destructive",
        });
        return;
      }
    }

    setCurrentStep((prev) => Math.min(prev + 1, steps.length));
  };

  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.push('/dashboard');
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div>
            <h2 className="text-xl font-bold mb-4">Upload Your Files</h2>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragOver ? 'border-blue-900 bg-blue-50' : 'border-gray-300'
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragOver(false);
                handleFileUpload(e.dataTransfer.files);
              }}
            >
              <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 mb-4">
                Drag and drop files here, or click to browse
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={(e) => handleFileUpload(e.target.files)}
                className="hidden"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors"
              >
                Browse Files
              </button>
            </div>

            {files.length > 0 && (
              <div className="mt-6 space-y-2">
                <h3 className="font-semibold mb-2">Uploaded Files ({files.length})</h3>
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-blue-900" />
                      <div>
                        <p className="font-medium text-sm">{file.name}</p>
                        <p className="text-xs text-gray-500">
                          {(file.size / 1024).toFixed(2)} KB • {file.pages} page(s)
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setFiles((prev) => prev.filter((f) => f.id !== file.id))}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div>
            <h2 className="text-xl font-bold mb-6">Print Options</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Paper Size</label>
                <select
                  value={orderDetails.paperSize}
                  onChange={(e) => setOrderDetails({ ...orderDetails, paperSize: e.target.value })}
                  className="w-full p-3 border rounded-lg"
                >
                <option value="short">Letter (8.5" × 11") - from ₱{PRINT_PRICES.short.black}/page</option>
                <option value="a4">A4 - from ₱{PRINT_PRICES.a4.black}/page</option>
                <option value="long">Legal (8.5" × 13") - from ₱{PRINT_PRICES.long.black}/page</option>
                <option value="a3">A3 - from ₱{PRINT_PRICES.a3.black}/page</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Print Mode</label>
                <select
                  value={orderDetails.printMode}
                  onChange={(e) => setOrderDetails({ ...orderDetails, printMode: e.target.value })}
                  className="w-full p-3 border rounded-lg"
                >
                  <option value="black">Black & White - ₱{PRINT_PRICES[orderDetails.paperSize].black}/page</option>
                  <option value="partial">Partial Color - ₱{PRINT_PRICES[orderDetails.paperSize].partial}/page</option>
                  <option value="full">Full Color - ₱{PRINT_PRICES[orderDetails.paperSize].full}/page</option>
                  <option value="borderless">Borderless - ₱{PRINT_PRICES[orderDetails.paperSize].borderless}/page</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Number of Copies</label>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setOrderDetails({ ...orderDetails, copies: Math.max(1, orderDetails.copies - 1) })}
                    className="p-2 border rounded-lg hover:bg-gray-100"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={orderDetails.copies}
                    onChange={(e) => setOrderDetails({ ...orderDetails, copies: parseInt(e.target.value) || 1 })}
                    className="w-20 p-2 border rounded-lg text-center"
                  />
                  <button
                    onClick={() => setOrderDetails({ ...orderDetails, copies: orderDetails.copies + 1 })}
                    className="p-2 border rounded-lg hover:bg-gray-100"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Binding</label>
                <select
                  value={orderDetails.binding}
                  onChange={(e) => setOrderDetails({ ...orderDetails, binding: e.target.value })}
                  className="w-full p-3 border rounded-lg"
                >
                  <option value="none">No Binding - Free</option>
                  <option value="book-soft">Book Binding (Soft Cover) - ₱300-400</option>
                  <option value="book-hard">Book Binding (Hard Cover) - ₱400-500</option>
                  <option value="wire-soft">Wire Binding (Soft Cover) - ₱60-80</option>
                  <option value="wire-hard">Wire Binding (Hard Cover) - ₱110-130</option>
                </select>
              </div>

              {/* ✅ Enhanced Live Price Preview */}
              <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Price Calculation Preview
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Pages:</span>
                    <span className="font-semibold">{files.reduce((sum, f) => sum + (f.pages || 1), 0)} page(s)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Copies:</span>
                    <span className="font-semibold">{orderDetails.copies}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Price per Page:</span>
                    <span className="font-semibold">₱{PRINT_PRICES[orderDetails.paperSize]?.[orderDetails.printMode] || 0}</span>
                  </div>
                  <div className="border-t border-blue-200 pt-2 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700 font-medium">Printing Cost:</span>
                      <span className="text-lg font-bold text-blue-900">
                        ₱{(files.reduce((sum, f) => sum + (f.pages || 1), 0) * orderDetails.copies * (PRINT_PRICES[orderDetails.paperSize]?.[orderDetails.printMode] || 0)).toFixed(2)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 text-right">
                      {files.reduce((sum, f) => sum + (f.pages || 1), 0)} × {orderDetails.copies} × ₱{PRINT_PRICES[orderDetails.paperSize]?.[orderDetails.printMode] || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div>
            <h2 className="text-xl font-bold mb-6">Delivery Options</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Delivery Type</label>
                <select
                  value={orderDetails.deliveryType}
                  onChange={(e) => setOrderDetails({ ...orderDetails, deliveryType: e.target.value })}
                  className="w-full p-3 border rounded-lg"
                >
                  <option value="campus">Campus Delivery (+₱10)</option>
                  <option value="pickup">Pickup at Store (Free)</option>
                </select>
              </div>

              {orderDetails.deliveryType === "campus" && (
                <div>
                  <label className="block text-sm font-medium mb-2">Select Location</label>
                  <select
                    value={orderDetails.deliveryLocation}
                    onChange={(e) => setOrderDetails({ ...orderDetails, deliveryLocation: e.target.value })}
                    className="w-full p-3 border rounded-lg"
                  >
                    <option value="">Select a location...</option>
                    {cebuLocations.map((loc) => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">Special Instructions (Optional)</label>
                <textarea
                  value={orderDetails.specialInstructions}
                  onChange={(e) => setOrderDetails({ ...orderDetails, specialInstructions: e.target.value })}
                  className="w-full p-3 border rounded-lg"
                  rows={4}
                  placeholder="Any special requests or instructions..."
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div>
            <h2 className="text-xl font-bold mb-6">Contact Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Full Name</label>
                <input
                  type="text"
                  value={orderDetails.contactName}
                  onChange={(e) => setOrderDetails({ ...orderDetails, contactName: e.target.value })}
                  className="w-full p-3 border rounded-lg"
                  placeholder="Enter your name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={orderDetails.contactPhone}
                  onChange={(e) => setOrderDetails({ ...orderDetails, contactPhone: e.target.value })}
                  className="w-full p-3 border rounded-lg"
                  placeholder="09XX XXX XXXX"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={orderDetails.contactEmail}
                  onChange={(e) => setOrderDetails({ ...orderDetails, contactEmail: e.target.value })}
                  className="w-full p-3 border rounded-lg"
                  placeholder="your.email@example.com"
                  required
                />
              </div>
            </div>
          </div>
        );

      case 5:
        const totalPages = files.reduce((sum, f) => sum + (f.pages || 1), 0);
        const pricePerPage = PRINT_PRICES[orderDetails.paperSize]?.[orderDetails.printMode] || 0;
        const printingSubtotal = totalPages * orderDetails.copies * pricePerPage;

        return (
          <div>
            <h2 className="text-xl font-bold mb-6">Review Order Summary</h2>
            <div className="bg-gray-50 p-6 rounded-lg space-y-4">
              <h3 className="font-semibold text-lg border-b pb-2">Order Details</h3>
              
              <div className="space-y-3 text-sm">
                {/* Files Info */}
                <div className="flex justify-between">
                  <span className="text-gray-600">Files Uploaded:</span>
                  <span className="font-medium">{files.length} file(s)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Pages:</span>
                  <span className="font-medium">{totalPages} page(s)</span>
                </div>

                {/* Print Options */}
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Paper Size:</span>
                    <span className="font-medium capitalize">{orderDetails.paperSize}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Print Mode:</span>
                    <span className="font-medium capitalize">{orderDetails.printMode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Price per Page:</span>
                    <span className="font-medium">₱{pricePerPage}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Number of Copies:</span>
                    <span className="font-medium">{orderDetails.copies}</span>
                  </div>
                </div>

                {/* Cost Breakdown */}
                <div className="border-t pt-3 mt-3 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Printing Cost:</span>
                    <span className="font-medium">
                      ₱{printingSubtotal.toFixed(2)}
                      <span className="text-xs text-gray-500 ml-1">
                        ({totalPages} × {orderDetails.copies} × ₱{pricePerPage})
                      </span>
                    </span>
                  </div>
                  {orderDetails.binding !== 'none' && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Binding:</span>
                      <span className="font-medium capitalize">{orderDetails.binding}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Delivery:</span>
                    <span className="font-medium">
                      {orderDetails.deliveryType === 'campus' ? '₱10 (Campus)' : 'Free (Pickup)'}
                    </span>
                  </div>
                  {orderDetails.deliveryType === 'campus' && orderDetails.deliveryLocation && (
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Location:</span>
                      <span className="text-gray-700">{orderDetails.deliveryLocation}</span>
                    </div>
                  )}
                </div>

                {/* Grand Total */}
                <div className="border-t-2 border-blue-900 pt-3 mt-3 flex justify-between">
                  <span className="font-bold text-lg text-gray-900">Grand Total:</span>
                  <span className="font-bold text-2xl text-blue-900">₱{orderTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div>
            <h2 className="text-xl font-bold mb-6">Payment</h2>
            <div className="space-y-6">
              <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                <div className="flex items-start gap-4">
                  <QrCode className="w-8 h-8 text-blue-900 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-blue-900 mb-2">Scan to Pay</h3>
                    <p className="text-sm text-gray-700 mb-4">
                      Scan this QR code with your GCash app to complete payment
                    </p>
                    <div className="bg-white p-4 rounded-lg inline-block">
                      <div className="w-48 h-48 bg-gray-200 flex items-center justify-center text-gray-400">
                        <QrCode className="w-24 h-24" />
                      </div>
                    </div>
                    <p className="text-sm font-medium text-gray-700 mt-4">
                      Or send to: <span className="font-bold text-blue-900">0915 XXX XXXX</span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white p-6 rounded-lg">
                <p className="text-sm opacity-90 mb-1">Total Amount to Pay</p>
                <p className="text-3xl font-bold">₱{orderTotal.toFixed(2)}</p>
              </div>

              <div className="bg-white p-6 border-2 border-gray-200 rounded-lg">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-blue-900" />
                  Upload Payment Proof
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      GCash Reference Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={paymentProof.ref}
                      onChange={(e) => setPaymentProof({ ...paymentProof, ref: e.target.value })}
                      className="w-full p-3 border rounded-lg"
                      placeholder="Enter reference number (e.g., 1234567890)"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Payment Screenshot <span className="text-red-500">*</span>
                    </label>
                    <input
                      ref={proofInputRef}
                      type="file"
                      onChange={handleProofUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      onClick={() => proofInputRef.current?.click()}
                      className="w-full p-4 border-2 border-dashed rounded-lg hover:border-blue-900 hover:bg-blue-50 transition-colors"
                    >
                      <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-gray-600">
                        {paymentProof.file ? paymentProof.file.name : 'Click to upload screenshot'}
                      </p>
                    </button>
                  </div>
                </div>

                {paymentProof.file && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-sm text-green-700">Screenshot uploaded successfully</span>
                  </div>
                )}
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-800 font-medium mb-2">⚠️ Important:</p>
                <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
                  <li>Make sure the reference number is correct</li>
                  <li>Screenshot must clearly show payment details</li>
                  <li>Your order will be processed after payment verification</li>
                </ul>
              </div>
            </div>
          </div>
        );

      case 7:
        return (
          <div className="text-center py-12">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.5 }}
            >
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
            </motion.div>
            <h2 className="text-2xl font-bold mb-2 text-gray-900">Order Placed Successfully!</h2>
            <p className="text-gray-600 mb-2">Your order ID: <span className="font-mono font-bold text-blue-900">#{orderId}</span></p>
            <p className="text-sm text-gray-500 mb-8">
              We'll verify your payment and notify you once your order is being processed.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => router.push('/dashboard')}
                className="px-6 py-3 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors font-medium"
              >
                Go to Dashboard
              </button>
              <button
                onClick={() => {
                  setCurrentStep(1);
                  setFiles([]);
                  setPaymentProof({ file: null, ref: "" });
                }}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                New Order
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 pt-20">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back to Dashboard</span>
          </button>
          <h1 className="text-2xl font-bold text-gray-900">New Print Order</h1>
          <div className="w-32" />
        </div>

        <div className="mb-8">
          <div className="flex items-center">
            {steps.map((s, i) => (
              <React.Fragment key={i}>
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 font-semibold text-sm ${currentStep > i ? 'bg-blue-900 border-blue-900 text-white' : currentStep === i + 1 ? 'border-blue-900 text-blue-900' : 'border-gray-300 text-gray-400'}`}>
                  {currentStep > i + 1 ? <CheckCircle size={20} /> : i + 1}
                </div>
                {i < steps.length - 1 && (
                  <div className={`flex-1 h-1 mx-2 ${currentStep > i + 1 ? 'bg-blue-900' : 'bg-gray-300'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            {steps.map((step, i) => (
              <div key={i} className={`text-xs font-medium ${currentStep === i + 1 ? 'text-blue-900' : 'text-gray-500'}`}>
                {step}
              </div>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-xl shadow-lg p-8 mb-8"
          >
            {renderStepContent()}
          </motion.div>
        </AnimatePresence>

        {currentStep < 7 && (
          <div className="flex justify-between">
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                currentStep === 1
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Previous
            </button>
            <button
              onClick={nextStep}
              className="px-6 py-3 bg-blue-900 text-white rounded-lg font-semibold hover:bg-blue-800 transition-colors"
            >
              {currentStep === 6 ? 'Submit Payment & Place Order' : 'Next'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderSystem;