'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Upload,
  FileText,
  Trash2,
  CheckCircle,
  Loader2,
  Eye,
  Plus,
  Minus,
  QrCode,
  Image as ImageIcon,
  AlertCircle,
} from 'lucide-react';
import { useToast } from './ui/Use-Toast';
import { useFileUpload } from '../../hooks/useFileUpload';
import { useOrderForm } from '../../hooks/useOrderForm';
import FilePreviewModal from './ui/FilePreviewModal';

interface OrderSystemProps {
  onBack?: () => void;
}

const OrderSystem: React.FC<OrderSystemProps> = ({ onBack }) => {
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const proofInputRef = useRef<HTMLInputElement>(null);

  // ✅ Use custom hooks
  const {
    files,
    uploadingFiles,
    uploadFile,
    uploadMultipleFiles,
    removeFile,
    isUploading,
  } = useFileUpload({
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!,
    uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!,
    maxFiles: 10,
    maxFileSize: 10 * 1024 * 1024,
  });

  const {
    formData,
    updateFormData,
    currentStep,
    nextStep,
    prevStep,
    paymentProof,
    updatePaymentProof,
    resetForm,
  } = useOrderForm();

  // Preview modal state
  const [previewModal, setPreviewModal] = useState({
    isOpen: false,
    fileName: '',
    fileUrl: '',
    fileType: '',
  });

  const [serviceType, setServiceType] = useState<'DOCUMENT_PRINTING' | 'RUSH_ID' | null>(null);
  
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
    contactEmail: "",
  });

  const [isDragOver, setIsDragOver] = useState(false);
  const [orderTotal, setOrderTotal] = useState(0);
  const [orderId, setOrderId] = useState('');

  const steps = [
    "Upload",
    "Configure & Pricing",
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

  const RUSH_ID_PACKAGES = [
    { id: '1x1-basic', name: '1x1 Basic ID', copies: 4, price: 50, turnaround: '30 minutes' },
    { id: '1x1-rush', name: '1x1 Rush ID', copies: 4, price: 70, turnaround: '15 minutes' },
    { id: '2x2-basic', name: '2x2 Basic ID', copies: 4, price: 60, turnaround: '30 minutes' },
    { id: '2x2-rush', name: '2x2 Rush ID', copies: 4, price: 80, turnaround: '15 minutes' },
    { id: 'passport-basic', name: 'Passport Size Basic', copies: 4, price: 70, turnaround: '30 minutes' },
    { id: 'passport-rush', name: 'Passport Size Rush', copies: 4, price: 90, turnaround: '15 minutes' },
  ];

 const calculateTotal = useCallback(() => {
  if (serviceType === 'RUSH_ID') {
    const selectedPackage = RUSH_ID_PACKAGES.find(p => p.id === orderDetails.rushPackage);
    const packageCost = selectedPackage?.price || 0;
    const deliveryCost = orderDetails.deliveryType === "campus" ? 10 : 0;
    const total = Number((packageCost + deliveryCost).toFixed(2));
    setOrderTotal(total);
    return total;
  }

  // Document Printing calculation
  const totalPagesInFiles = files.reduce((sum, f) => sum + (f.pages || 1), 0);
  const copies = Number(orderDetails.copies) || 1;
  const sizeKey = orderDetails.paperSize || "a4";
  const modeKey = orderDetails.printMode || "black";
  const pricePerPage = PRINT_PRICES[sizeKey]?.[modeKey] || 0;
  const printingCost = totalPagesInFiles * copies * pricePerPage;

  let bindingCost = 0;
  if (orderDetails.binding !== "none") {
    const priceFn = BINDING_PRICES[orderDetails.binding];
    if (priceFn) {
      bindingCost = priceFn(totalPagesInFiles) * copies;
    }
  }

  // ✅ FIXED: Add delivery cost for campus delivery
  const deliveryCost = orderDetails.deliveryType === "campus" ? 10 : 0;
  
  // ✅ Include delivery cost in total
  const total = Number((printingCost + bindingCost + deliveryCost).toFixed(2));
  
const handleNextStep = () => {
  // ✅ Step 1 Validation: Files and Service Type
  if (currentStep === 1) {
    if (files.length === 0) {
      toast({
        title: 'No Files',
        description: 'Please upload at least one file.',
        variant: 'destructive',
      });
      return;
    }
    
    if (!serviceType) {
      toast({
        title: 'Service Type Required',
        description: 'Please select Document Printing or Rush ID.',
        variant: 'destructive',
      });
      return;
    }
  }

  // ✅ Step 2 Validation: Rush ID package or Document options
  if (currentStep === 2) {
    if (serviceType === 'RUSH_ID' && !orderDetails.rushPackage) {
      toast({
        title: 'Package Required',
        description: 'Please select a Rush ID package.',
        variant: 'destructive',
      });
      return;
    }
    
    if (serviceType === 'DOCUMENT_PRINTING') {
      if (!orderDetails.paperSize || !orderDetails.printMode || orderDetails.copies < 1) {
        toast({
          title: 'Incomplete Options',
          description: 'Please configure all print options.',
          variant: 'destructive',
        });
        return;
      }
    }
  }

  // ✅ Step 3 Validation: Delivery location for campus delivery
  if (currentStep === 3) {
    if (orderDetails.deliveryType === 'campus' && !orderDetails.deliveryLocation) {
      toast({
        title: 'Location Required',
        description: 'Please select a campus location for delivery.',
        variant: 'destructive',
      });
      return;
    }
  }

  // ✅ Step 4 Validation: Contact information
  if (currentStep === 4) {
    if (!orderDetails.contactName.trim()) {
      toast({
        title: 'Name Required',
        description: 'Please enter your full name.',
        variant: 'destructive',
      });
      return;
    }
    
    if (!orderDetails.contactPhone.trim()) {
      toast({
        title: 'Phone Required',
        description: 'Please enter your phone number.',
        variant: 'destructive',
      });
      return;
    }
    
    // Basic phone validation
    const phoneRegex = /^09\d{9}$/;
    if (!phoneRegex.test(orderDetails.contactPhone.replace(/\s+/g, ''))) {
      toast({
        title: 'Invalid Phone',
        description: 'Please enter a valid Philippine mobile number (e.g., 09XX XXX XXXX).',
        variant: 'destructive',
      });
      return;
    }
    
    if (!orderDetails.contactEmail.trim()) {
      toast({
        title: 'Email Required',
        description: 'Please enter your email address.',
        variant: 'destructive',
      });
      return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(orderDetails.contactEmail)) {
      toast({
        title: 'Invalid Email',
        description: 'Please enter a valid email address.',
        variant: 'destructive',
      });
      return;
    }
  }

  // ✅ Step 6 Validation: Payment proof
  if (currentStep === 6) {
    if (!paymentProof.ref.trim()) {
      toast({
        title: 'Reference Number Required',
        description: 'Please enter the GCash reference number.',
        variant: 'destructive',
      });
      return;
    }
    
    if (!paymentProof.file || !paymentProof.url) {
      toast({
        title: 'Payment Screenshot Required',
        description: 'Please upload your payment screenshot.',
        variant: 'destructive',
      });
      return;
    }

    // ✅ Submit order (Step 6 → 7)
    handleSubmitOrder();
    return;
  }

  // ✅ Proceed to next step
  setCurrentStep((prev) => Math.min(prev + 1, steps.length));
};

const handleSubmitOrder = async () => {
  try {
    const orderPayload = {
      customerName: orderDetails.contactName,
      customerEmail: orderDetails.contactEmail,
      customerPhone: orderDetails.contactPhone,
      serviceType: serviceType || 'DOCUMENT_PRINTING',
      paperSize: orderDetails.paperSize.toUpperCase(),
      colorType: orderDetails.printMode === 'black' ? 'BLACK_AND_WHITE' : 'COLOR',
      copies: orderDetails.copies,
      pages: files.reduce((sum, f) => sum + (f.pages || 1), 0),
      bindingType: orderDetails.binding.toUpperCase().replace('-', '_'),
      fileUrl: files[0]?.url || '',
      fileName: files[0]?.name || 'document.pdf',
      pricePerPage: serviceType === 'RUSH_ID' ? 0 : PRINT_PRICES[orderDetails.paperSize]?.[orderDetails.printMode] || 0,
      totalPrice: orderTotal,
      notes: `Service: ${serviceType}${serviceType === 'RUSH_ID' ? `\nPackage: ${orderDetails.rushPackage}` : ''}\nDelivery: ${orderDetails.deliveryType}\n${orderDetails.specialInstructions || ''}`,
      adminNotes: `Payment Ref: ${paymentProof.ref}\nScreenshot: ${paymentProof.url}`,
      paymentProofUrl: paymentProof.url,
      status: 'PENDING',
    };

    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create order');
    }

    const data = await response.json();
    setOrderId(data.order.orderNumber);

    toast({
      title: 'Order Placed!',
      description: 'Your payment is being verified.',
    });

    // Move to confirmation step
    setCurrentStep(7);
  } catch (error) {
    console.error('Order submission error:', error);
    toast({
      title: 'Error',
      description: error instanceof Error ? error.message : 'Failed to place order.',
      variant: 'destructive',
    });
  }
};

  setOrderTotal(total);
  return total;
}, [files, orderDetails, serviceType]);

  useEffect(() => {
    calculateTotal();
  }, [calculateTotal]);

  const handleFileUpload = async (fileList: FileList | null) => {
    if (!fileList) return;
    await uploadMultipleFiles(fileList);
  };

  const handleProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const result = await uploadFile(file, 'payments');
    if (result) {
      updatePaymentProof({
        file,
        url: result.url,
      });
    }
  };

  const handlePreviewFile = (file: any) => {
    setPreviewModal({
      isOpen: true,
      fileName: file.name,
      fileUrl: file.url,
      fileType: file.type,
    });
  };

  const renderFileUploadStep = () => (
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
        <p className="text-gray-600 mb-4">Drag and drop files here, or click to browse</p>
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
          disabled={isUploading}
          className="px-6 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-50"
        >
          {isUploading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Uploading...
            </span>
          ) : (
            'Browse Files'
          )}
        </button>
        <p className="text-xs text-gray-500 mt-3">
          Supported: PDF, DOC, DOCX, JPG, PNG (Max 10MB each)
        </p>
      </div>

      {uploadingFiles.length > 0 && (
        <div className="mt-6 space-y-3">
          <h3 className="font-semibold text-sm text-gray-700">
            Uploading... ({uploadingFiles.length})
          </h3>
          {uploadingFiles.map((file) => (
            <motion.div
              key={file.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-gray-200 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <FileText className="w-5 h-5 text-blue-900 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 truncate">{file.name}</p>
                    <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                  </div>
                </div>
                {file.status === 'uploading' && (
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0" />
                )}
                {file.status === 'success' && (
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                )}
              </div>

              <div className="mt-2">
                <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                  <span>{file.status === 'success' ? 'Complete' : 'Uploading...'}</span>
                  <span>{file.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <motion.div
                    className="bg-blue-600 h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${file.progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {files.length > 0 && (
        <div className="mt-6 space-y-3">
          <h3 className="font-semibold text-sm text-gray-700">
            Uploaded Files ({files.length})
          </h3>
          {files.map((file) => (
            <motion.div
              key={file.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex-shrink-0">
                    {file.type.startsWith('image/') ? (
                      <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-200">
                        <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-blue-900" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 truncate">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      {(file.size / 1024).toFixed(2)} KB • {file.pages} page(s)
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePreviewFile(file)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Preview file"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => removeFile(file.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove file"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {files.length > 0 && (
        <div className="mt-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-blue-900" />
            <h3 className="font-bold text-blue-900">What service do you need?</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setServiceType('DOCUMENT_PRINTING')}
              className={`p-6 border-2 rounded-xl transition-all ${
                serviceType === 'DOCUMENT_PRINTING'
                  ? 'border-blue-900 bg-blue-100 shadow-lg'
                  : 'border-gray-300 hover:border-blue-400'
              }`}
            >
              <FileText className={`w-10 h-10 mx-auto mb-3 ${
                serviceType === 'DOCUMENT_PRINTING' ? 'text-blue-900' : 'text-gray-400'
              }`} />
              <p className="font-bold text-center">Document Printing</p>
              <p className="text-xs text-gray-600 text-center mt-1">
                Print documents, reports, assignments
              </p>
            </button>

            <button
              onClick={() => setServiceType('RUSH_ID')}
              className={`p-6 border-2 rounded-xl transition-all ${
                serviceType === 'RUSH_ID'
                  ? 'border-blue-900 bg-blue-100 shadow-lg'
                  : 'border-gray-300 hover:border-blue-400'
              }`}
            >
              <ImageIcon className={`w-10 h-10 mx-auto mb-3 ${
                serviceType === 'RUSH_ID' ? 'text-blue-900' : 'text-gray-400'
              }`} />
              <p className="font-bold text-center">Rush ID Photos</p>
              <p className="text-xs text-gray-600 text-center mt-1">
                1x1, 2x2, Passport size photos
              </p>
            </button>
          </div>

          {serviceType && (
            <p className="mt-4 text-sm text-green-700 font-medium flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Selected: {serviceType === 'DOCUMENT_PRINTING' ? 'Document Printing' : 'Rush ID Photos'}
            </p>
          )}
        </div>
      )}
    </div>
  );

  // ✅ ADD THIS FUNCTION - renderStepContent
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderFileUploadStep();

      case 2:
        const totalPages = files.reduce((sum, f) => sum + (f.pages || 1), 0);
        const pricePerPage = PRINT_PRICES[orderDetails.paperSize]?.[orderDetails.printMode] || 0;
        const printingSubtotal = totalPages * orderDetails.copies * pricePerPage;

        return (
          <div>
            <h2 className="text-xl font-bold mb-6">
              {serviceType === 'RUSH_ID' ? 'Select Rush ID Package' : 'Configure Your Print Job'}
            </h2>

            {serviceType === 'RUSH_ID' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {RUSH_ID_PACKAGES.map((pkg) => (
                    <button
                      key={pkg.id}
                      onClick={() => setOrderDetails({ ...orderDetails, rushPackage: pkg.id })}
                      className={`p-6 border-2 rounded-xl transition-all text-left ${
                        orderDetails.rushPackage === pkg.id
                          ? 'border-blue-900 bg-blue-50 shadow-lg'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-bold text-lg">{pkg.name}</h3>
                        <span className="px-3 py-1 bg-blue-100 text-blue-900 rounded-full text-sm font-bold">
                          ₱{pkg.price}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        <strong>{pkg.copies} copies</strong>
                      </p>
                      <p className="text-xs text-gray-500">
                        ⏱️ Ready in: <strong>{pkg.turnaround}</strong>
                      </p>
                    </button>
                  ))}
                </div>

                {orderDetails.rushPackage && (
                  <div className="mt-6 p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-gray-600">Selected Package</p>
                        <p className="text-xl font-bold text-green-900">
                          {RUSH_ID_PACKAGES.find(p => p.id === orderDetails.rushPackage)?.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Total Price</p>
                        <p className="text-3xl font-bold text-green-900">₱{orderTotal.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {serviceType === 'DOCUMENT_PRINTING' && (
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
                  <div className="flex items-center gap-3">
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

                <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Price Calculation
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Pages:</span>
                      <span className="font-semibold">{totalPages} page(s)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Copies:</span>
                      <span className="font-semibold">{orderDetails.copies}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Price per Page:</span>
                      <span className="font-semibold">₱{pricePerPage}</span>
                    </div>
                    <div className="border-t border-blue-200 pt-2 mt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 font-medium">Printing Cost:</span>
                        <span className="text-lg font-bold text-blue-900">
                          ₱{printingSubtotal.toFixed(2)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 text-right">
                        {totalPages} × {orderDetails.copies} × ₱{pricePerPage}
                      </p>
                    </div>
                    {orderDetails.binding !== 'none' && (
                      <div className="flex justify-between pt-2">
                        <span className="text-gray-700 font-medium">Binding:</span>
                        <span className="font-semibold text-blue-900 capitalize">
                          {orderDetails.binding.replace('-', ' ')}
                        </span>
                      </div>
                    )}
                    {/* ✅ REMOVED: Delivery cost display from Step 2 */}
                    <div className="border-t-2 border-blue-300 pt-3 mt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold text-gray-900">Subtotal:</span>
                        <span className="text-2xl font-bold text-blue-900">
                          ₱{(printingSubtotal + (orderDetails.binding !== 'none' ? BINDING_PRICES[orderDetails.binding]?.(totalPages) * orderDetails.copies || 0 : 0)).toFixed(2)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 text-center">
                        Delivery fee will be added at checkout
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
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
                  <option value="pickup">Pickup (FREE)</option>
                  <option value="campus">Campus Delivery (+₱10)</option>
                </select>
              </div>

              {orderDetails.deliveryType === "campus" && (
                <div>
                  <label className="block text-sm font-medium mb-2">Select Campus Location</label>
                  <select
                    value={orderDetails.deliveryLocation}
                    onChange={(e) => setOrderDetails({ ...orderDetails, deliveryLocation: e.target.value })}
                    className="w-full p-3 border rounded-lg"
                    required
                  >
                    <option value="">-- Select Location --</option>
                    {cebuLocations.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
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
          return (
            <div>
              <h2 className="text-xl font-bold mb-6">Review Order Summary</h2>
              <div className="bg-gray-50 p-6 rounded-lg space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Order Details</h3>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Service Type:</span>
                    <span className="font-medium">
                      {serviceType === 'RUSH_ID' ? 'Rush ID Photos' : 'Document Printing'}
                    </span>
                  </div>

                  {serviceType === 'RUSH_ID' ? (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Package:</span>
                      <span className="font-medium">
                        {RUSH_ID_PACKAGES.find(p => p.id === orderDetails.rushPackage)?.name}
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Files:</span>
                        <span className="font-medium">{files.length} file(s)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Pages:</span>
                        <span className="font-medium">{files.reduce((sum, f) => sum + (f.pages || 1), 0)} page(s)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Paper Size:</span>
                        <span className="font-medium capitalize">{orderDetails.paperSize}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Print Mode:</span>
                        <span className="font-medium capitalize">{orderDetails.printMode}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Copies:</span>
                        <span className="font-medium">{orderDetails.copies}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Binding:</span>
                        <span className="font-medium capitalize">{orderDetails.binding.replace('-', ' ')}</span>
                      </div>
                    </>
                  )}

                  {/* ✅ DELIVERY INFO - Only shown in review */}
                  <div className="border-t border-gray-300 pt-3 mt-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Delivery Type:</span>
                      <span className="font-medium capitalize">{orderDetails.deliveryType}</span>
                    </div>
                    {orderDetails.deliveryType === 'campus' && orderDetails.deliveryLocation && (
                      <div className="flex justify-between mt-2">
                        <span className="text-gray-600">Location:</span>
                        <span className="font-medium text-sm">{orderDetails.deliveryLocation}</span>
                      </div>
                    )}
                    <div className="flex justify-between mt-2">
                      <span className="text-gray-600">Delivery Fee:</span>
                      <span className="font-medium">
                        {orderDetails.deliveryType === 'campus' ? '₱10.00' : 'FREE'}
                      </span>
                    </div>
                  </div>

                  {/* ✅ GRAND TOTAL - With delivery fee included */}
                  <div className="border-t-2 border-blue-900 pt-3 mt-3">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-lg text-gray-900">Grand Total:</span>
                      <span className="font-bold text-2xl text-blue-900">₱{orderTotal.toFixed(2)}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 text-right">
                      Including {orderDetails.deliveryType === 'campus' ? '₱10 delivery fee' : 'free pickup'}
                    </p>
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
                      Scan this QR code with your GCash app
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
                      onChange={(e) => updatePaymentProof({ ref: e.target.value })}
                      className="w-full p-3 border rounded-lg"
                      placeholder="Enter reference number"
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
                  setServiceType(null);
                  updatePaymentProof({ file: null, ref: "", url: "" });
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
    <>
      <div className="min-h-screen bg-gray-50 py-8 pt-20">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => (onBack ? onBack() : router.push('/dashboard'))}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft size={20} />
              <span>Back to Dashboard</span>
            </button>
            <h1 className="text-2xl font-bold text-gray-900">New Print Order</h1>
            <div className="w-32" />
          </div>

          <div className="mb-8">
            <div className="flex items-center justify-between">
              {steps.map((step, i) => (
                <div key={i} className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      currentStep === i + 1
                        ? 'bg-blue-900 text-white'
                        : currentStep > i + 1
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {currentStep > i + 1 ? <CheckCircle size={20} /> : i + 1}
                  </div>
                  <div
                    className={`text-xs font-medium mt-2 ${
                      currentStep === i + 1 ? 'text-blue-900' : 'text-gray-500'
                    }`}
                  >
                    {step}
                  </div>
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

      <FilePreviewModal
        isOpen={previewModal.isOpen}
        onClose={() => setPreviewModal({ isOpen: false, fileName: '', fileUrl: '', fileType: '' })}
        fileName={previewModal.fileName}
        fileUrl={previewModal.fileUrl}
        fileType={previewModal.fileType}
      />
    </>
  );
};

export default OrderSystem;