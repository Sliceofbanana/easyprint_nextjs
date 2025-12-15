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
    paymentProof,
    updatePaymentProof,
  } = useOrderForm();

  const [previewModal, setPreviewModal] = useState({
    isOpen: false,
    fileName: '',
    fileUrl: '',
    fileType: '',
  });

  const [paymentUploading, setPaymentUploading] = useState(false);
  const [paymentProgress, setPaymentProgress] = useState(0);
  const [serviceType, setServiceType] = useState<'DOCUMENT_PRINTING' | 'RUSH_ID' | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  
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
    "University of San Carlos - Main Campus",
    "University of San Carlos - Talamban Campus",
    "Cebu Institute of Technology - Main",
    "University of Cebu - Main",
    "Cebu Normal University",
    "University of San Jose Recoletos",
    "Southwestern University - Urgello",
    "University of the Philippines Cebu",
  ];

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

  // ✅ PRICING TABLE: Price per page based on Paper Size and Print Mode
  const PRINT_PRICES: Record<string, Record<string, number>> = {
    short: { 
      black: 1.75,      // Black & White
      partial: 2.75,    // Partial Color
      full: 8.5,        // Full Color
      borderless: 17    // Borderless Print
    },
    a4: { 
      black: 2.0,       // Black & White
      partial: 3.0,     // Partial Color
      full: 9.0,        // Full Color
      borderless: 18    // Borderless Print
    },
    long: { 
      black: 2.5,       // Black & White
      partial: 4.0,     // Partial Color
      full: 10.0,       // Full Color
      borderless: 20    // Borderless Print
    },
    a3: { 
      black: 10.0,      // Black & White
      partial: 15.0,    // Partial Color
      full: 20.0,       // Full Color
      borderless: 30    // Borderless Print
    },
  };

  // ✅ Calculate Total Function
  const calculateTotal = useCallback(() => {
    if (serviceType === 'RUSH_ID') {
      const selectedPackage = RUSH_ID_PACKAGES.find(p => p.id === orderDetails.rushPackage);
      const packageCost = selectedPackage?.price || 0;
      const deliveryCost = orderDetails.deliveryType === "campus" ? 10 : 0;
      const total = Number((packageCost + deliveryCost).toFixed(2));
      setOrderTotal(total);
      return total;
    }

    // ✅ STEP 1: Get total pages from all uploaded files
    const totalPages = files.reduce((sum, f) => sum + (f.pages || 1), 0);
    
    // ✅ STEP 2: Get number of copies user wants
    const copies = Number(orderDetails.copies) || 1;
    
    // ✅ STEP 3: Get price per page based on selected paper size and print mode
    // Example: If user selects "a4" and "black", pricePerPage = 2.00
    const paperSize = orderDetails.paperSize || "a4";
    const printMode = orderDetails.printMode || "black";
    const pricePerPage = PRINT_PRICES[paperSize]?.[printMode] || 0;
    
    // ✅ STEP 4: Calculate printing cost
    // Formula: (pricePerPage × totalPages) × copies
    // Example: (2.00 × 5 pages) × 2 copies = 20.00
    const printingCost = totalPages * copies * pricePerPage;

    // ✅ STEP 5: Add binding cost if selected
    let bindingCost = 0;
    if (orderDetails.binding !== "none") {
      const priceFn = BINDING_PRICES[orderDetails.binding];
      if (priceFn) {
        bindingCost = priceFn(totalPages) * copies;
      }
    }

    // ✅ STEP 6: Add delivery cost if campus delivery is selected
    const deliveryCost = orderDetails.deliveryType === "campus" ? 10 : 0;
    
    // ✅ STEP 7: Calculate grand total
    const total = Number((printingCost + bindingCost + deliveryCost).toFixed(2));
    
    console.log('📊 Price Breakdown:', {
      totalPages,
      copies,
      paperSize,
      printMode,
      pricePerPage,
      printingCost,
      bindingCost,
      deliveryCost,
      total
    });
    
    setOrderTotal(total);
    return total;
  }, [files, orderDetails, serviceType]);

  useEffect(() => {
    calculateTotal();
  }, [calculateTotal]);

  // ✅ Handle Next Step with Validation
  const handleNextStep = () => {
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

    if (currentStep === 6) {
      // ✅ Validate reference number
      if (!paymentProof.ref.trim()) {
        toast({
          title: 'Reference Number Required',
          description: 'Please enter the GCash reference number.',
          variant: 'destructive',
        });
        return;
      }
      
      // ✅ Validate reference number format (should be numeric)
      if (!/^\d+$/.test(paymentProof.ref.trim())) {
        toast({
          title: 'Invalid Reference Number',
          description: 'Reference number should contain only numbers.',
          variant: 'destructive',
        });
        return;
      }
      
      // ✅ Validate screenshot upload
      if (!paymentProof.file || !paymentProof.url) {
        toast({
          title: 'Payment Screenshot Required',
          description: 'Please upload your payment screenshot.',
          variant: 'destructive',
        });
        return;
      }

      // ✅ Validate files exist
      if (files.length === 0) {
        toast({
          title: 'No Files Uploaded',
          description: 'Please go back and upload your files.',
          variant: 'destructive',
        });
        return;
      }

      handleSubmitOrder();
      return;
    }
    setCurrentStep((prev) => prev + 1);
  }

  // ✅ Submit Order Function
  const handleSubmitOrder = async () => {
    try {
      // ✅ Validate files exist
      if (files.length === 0) {
        toast({
          title: 'No Files',
          description: 'Please upload at least one file before submitting.',
          variant: 'destructive',
        });
        return;
      }

      // ✅ Validate payment proof
      if (!paymentProof.url || !paymentProof.ref.trim()) {
        toast({
          title: 'Payment Required',
          description: 'Please upload payment screenshot and enter reference number.',
          variant: 'destructive',
        });
        return;
      }

      // ✅ FIXED: Simplified adminNotes construction
      const adminNotesLines = [
        `Payment Ref: ${paymentProof.ref}`,
        `Screenshot: ${paymentProof.url}`,
        `Service: ${serviceType}`,
      ];

      if (serviceType === 'RUSH_ID') {
        const selectedPackage = RUSH_ID_PACKAGES.find(p => p.id === orderDetails.rushPackage);
        if (selectedPackage) {
          adminNotesLines.push(`Package: ${selectedPackage.name}`);
        }
      }

      adminNotesLines.push(`Delivery: ${orderDetails.deliveryType}`);
      
      if (orderDetails.deliveryType === 'campus' && orderDetails.deliveryLocation) {
        adminNotesLines.push(`Location: ${orderDetails.deliveryLocation}`);
      }

      if (orderDetails.specialInstructions?.trim()) {
        adminNotesLines.push(`Instructions: ${orderDetails.specialInstructions.trim()}`);
      }

      const adminNotes = adminNotesLines.join('\n');
      console.log('📝 Admin Notes being saved:', adminNotes);
      console.log('💳 Payment Proof:', paymentProof);

      // ✅ FIXED: Map internal paper size names to Prisma enum values
      const PAPER_SIZE_MAP: Record<string, string> = {
        'short': 'LETTER',
        'a4': 'A4',
        'long': 'LEGAL',
        'a3': 'A3', 
      };

      // ✅ FIXED: Map internal print mode to Prisma enum values
      const COLOR_TYPE_MAP: Record<string, string> = {
        'black': 'BLACK_AND_WHITE',
        'partial': 'PARTIAL_COLOR',
        'full': 'COLOR',
      };

      // ✅ Base payload that all orders need
      const basePayload = {
        customerName: orderDetails.contactName.trim(),
        customerEmail: orderDetails.contactEmail.trim(),
        customerPhone: orderDetails.contactPhone.trim(),
        totalPrice: orderTotal,
        fileUrl: files[0]?.url || '',
        fileName: files[0]?.name || 'document.pdf',
        adminNotes: adminNotes,
        paymentProofUrl: paymentProof.url,
        paymentReference: paymentProof.ref,
        adminNotes: `Service: ${serviceType}\nDelivery: ${orderDetails.deliveryType}\nLocation: ${orderDetails.deliveryLocation || 'N/A'}`,
      };

      let orderPayload;

      if (serviceType === 'RUSH_ID') {
        const selectedPackage = RUSH_ID_PACKAGES.find(p => p.id === orderDetails.rushPackage);
        
        if (!selectedPackage) {
          toast({
            title: 'Package Not Selected',
            description: 'Please select a Rush ID package.',
            variant: 'destructive',
          });
          return;
        }

        orderPayload = {
          ...basePayload,
          paperSize: 'A4',
          colorType: 'COLOR',
          copies: selectedPackage.copies,
          pages: 1,
          bindingType: 'NONE',
        };
      } else {
        // Document Printing
        const totalPages = files.reduce((sum, f) => sum + (f.pages || 1), 0);
        
        // ✅ FIXED: Map binding type to Prisma enum
        const BINDING_MAP: Record<string, string> = {
          'none': 'NONE',
          'book-soft': 'BOOK_SOFT',
          'book-hard': 'BOOK_HARD',
          'wire-soft': 'WIRE_SOFT',
          'wire-hard': 'WIRE_HARD',
        };

        orderPayload = {
          ...basePayload,
          paperSize: PAPER_SIZE_MAP[orderDetails.paperSize] || 'A4',
          colorType: COLOR_TYPE_MAP[orderDetails.printMode] || 'BLACK_AND_WHITE',
          copies: orderDetails.copies,
          pages: totalPages,
          bindingType: BINDING_MAP[orderDetails.binding] || 'NONE',
        };
      }

      console.log('📤 Submitting order payload:', orderPayload);

      // ✅ Submit order
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });

      // ✅ Get response text first
      const responseText = await response.text();
      console.log('📥 Response status:', response.status);
      console.log('📥 Response body:', responseText);

      if (!response.ok) {
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch {
          errorData = { error: responseText || 'Unknown error' };
        }
        
        console.error('❌ Order creation failed:', errorData);
        
        toast({
          title: 'Order Failed',
          description: errorData.error || errorData.details || 'Failed to create order. Please try again.',
          variant: 'destructive',
        });
        
        throw new Error(errorData.error || 'Failed to create order');
      }

      // ✅ Parse success response
      const data = JSON.parse(responseText);
      console.log('✅ Order created:', data);
      
      setOrderId(data.orderNumber || data.order?.orderNumber || '1001');

      toast({
        title: 'Order Placed! 🎉',
        description: `Your ${serviceType === 'RUSH_ID' ? 'Rush ID' : 'printing'} order has been submitted successfully.`,
        variant: 'success',
      });

      setCurrentStep(7);
    } catch (error) {
      console.error('❌ Order submission error:', error);
      
      // ✅ Only show toast if not already shown
      if (!(error instanceof Error && error.message.includes('Failed to create order'))) {
        toast({
          title: 'Submission Error',
          description: error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.',
          variant: 'destructive',
        });
      }
    }
  };

  const handleFileUpload = async (fileList: FileList | null) => {
    if (!fileList) return;
    await uploadMultipleFiles(fileList);
  };

  // ✅ Handle Payment Screenshot Upload (Separate from documents)
  const handleProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid File Type',
        description: 'Please upload an image file (JPG, PNG, etc.)',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (5MB limit for payment proof)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      toast({
        title: 'File Too Large',
        description: 'Payment screenshot must be less than 5MB',
        variant: 'destructive',
      });
      return;
    }

    setPaymentUploading(true);
    setPaymentProgress(0);

    try {
      // Upload to API with progress tracking
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'payment');

      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = Math.round((e.loaded / e.total) * 100);
          setPaymentProgress(percentComplete);
        }
      });

      xhr.addEventListener('load', async () => {
        if (xhr.status === 200) {
          const result = JSON.parse(xhr.responseText);
          
          updatePaymentProof({
            file,
            url: result.url,
          });

          toast({
            title: 'Upload Successful',
            description: 'Payment screenshot uploaded successfully',
            variant: 'success',
          });
        } else {
          throw new Error('Upload failed');
        }
        setPaymentUploading(false);
      });

      xhr.addEventListener('error', () => {
        toast({
          title: 'Upload Failed',
          description: 'Failed to upload payment screenshot',
          variant: 'destructive',
        });
        setPaymentUploading(false);
      });

      xhr.open('POST', '/api/upload');
      xhr.send(formData);

    } catch (error) {
      console.error('Payment proof upload error:', error);
      toast({
        title: 'Upload Failed',
        description: error instanceof Error ? error.message : 'Failed to upload payment screenshot',
        variant: 'destructive',
      });
      setPaymentUploading(false);
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

      {/* ✅ UPDATED: Document Upload Progress - Matches Payment Screenshot Style */}
      {uploadingFiles.length > 0 && (
        <div className="mt-6 space-y-3">
          <h3 className="font-semibold text-sm text-gray-700">
            Uploading Documents ({uploadingFiles.length})
          </h3>
          {uploadingFiles.map((file) => (
            <motion.div
              key={file.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 border-2 border-blue-200 bg-blue-50 rounded-lg"
            >
              {/* File Info Header */}
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-shrink-0">
                  {file.status === 'uploading' && (
                    <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                  )}
                  {file.status === 'success' && (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-600">
                    {(file.size / 1024).toFixed(2)} KB • {file.type.split('/')[1]?.toUpperCase()}
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              {file.status === 'uploading' && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span>Uploading document...</span>
                    <span className="font-bold text-blue-900">{file.progress}%</span>
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
              )}

              {/* Success Message */}
              {file.status === 'success' && (
                <div className="p-2 bg-green-100 border border-green-300 rounded flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-700" />
                  <span className="text-xs text-green-800 font-medium">
                    Upload complete • {file.pages} page(s) detected
                  </span>
                </div>
              )}

              {/* Error Message */}
              {file.status === 'error' && (
                <div className="p-2 bg-red-100 border border-red-300 rounded flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-700" />
                  <span className="text-xs text-red-800 font-medium">
                    Upload failed
                  </span>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Uploaded Files List */}
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
              className="border-2 border-green-200 bg-green-50 rounded-lg p-4"
            >
              <div className="flex items-start gap-3">
                {/* File Preview/Icon */}
                <div className="flex-shrink-0">
                  {file.type.startsWith('image/') ? (
                    <div className="w-20 h-20 rounded-lg overflow-hidden border-2 border-green-300">
                      <img 
                        src={file.url} 
                        alt={file.name} 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                  ) : (
                    <div className="w-20 h-20 bg-blue-100 rounded-lg flex items-center justify-center border-2 border-blue-300">
                      <FileText className="w-10 h-10 text-blue-900" />
                    </div>
                  )}
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-600">
                        {(file.size / 1024).toFixed(2)} KB • {file.pages} page(s)
                      </p>
                    </div>
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => handlePreviewFile(file)}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      Preview
                    </button>
                    <button
                      onClick={() => removeFile(file.id)}
                      className="text-xs text-red-600 hover:text-red-800 font-medium flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      Remove
                    </button>
                  </div>
                </div>
              </div>

              {/* Success Badge */}
              <div className="mt-3 p-2 bg-green-100 border border-green-300 rounded flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-700" />
                <span className="text-xs text-green-800 font-medium">
                  Document uploaded successfully
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Service Type Selection */}
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
                        ⚡ Ready in {pkg.turnaround}
                      </p>
                    </button>
                  ))}
                </div>

                {orderDetails.rushPackage && (
                  <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-green-700" />
                      <h3 className="font-semibold text-green-900">Package Selected</h3>
                    </div>
                    <p className="text-sm text-gray-700">
                      {RUSH_ID_PACKAGES.find(p => p.id === orderDetails.rushPackage)?.name} - 
                      ₱{RUSH_ID_PACKAGES.find(p => p.id === orderDetails.rushPackage)?.price}
                    </p>
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
                    <option value="short">Letter (8.5" × 11")</option>
                    <option value="a4">A4</option>
                    <option value="long">Legal (8.5" × 13")</option>
                    <option value="a3">A3</option>
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
                      disabled={paymentUploading}
                    />
                    
                    {/* Upload Button */}
                    {!paymentProof.file && !paymentUploading && (
                      <button
                        onClick={() => proofInputRef.current?.click()}
                        className="w-full p-6 border-2 border-dashed rounded-lg hover:border-blue-900 hover:bg-blue-50 transition-colors"
                      >
                        <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm text-gray-600 font-medium">
                          Click to upload payment screenshot
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          JPG, PNG (Max 5MB)
                        </p>
                      </button>
                    )}

                    {/* ✅ Upload Progress Bar */}
                    {paymentUploading && (
                      <div className="p-6 border-2 border-blue-200 bg-blue-50 rounded-lg">
                        <div className="flex items-center gap-3 mb-3">
                          <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              Uploading payment screenshot...
                            </p>
                            <p className="text-xs text-gray-600">
                              Please wait while we upload your file
                            </p>
                          </div>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs text-gray-600">
                            <span>Progress</span>
                            <span className="font-bold text-blue-900">{paymentProgress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                            <motion.div
                              className="bg-blue-600 h-full rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${paymentProgress}%` }}
                              transition={{ duration: 0.3 }}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ✅ Upload Success - Show Preview */}
                    {paymentProof.file && paymentProof.url && !paymentUploading && (
                      <div className="border-2 border-green-200 bg-green-50 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          {/* Preview Image */}
                          <div className="flex-shrink-0">
                            <img
                              src={paymentProof.url}
                              alt="Payment screenshot"
                              className="w-20 h-20 object-cover rounded-lg border-2 border-green-300"
                            />
                          </div>
                          
                          {/* File Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm text-gray-900 truncate">
                                  {paymentProof.file.name}
                                </p>
                                <p className="text-xs text-gray-600">
                                  {(paymentProof.file.size / 1024).toFixed(2)} KB
                                </p>
                              </div>
                              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                            </div>
                            
                            <div className="mt-2 flex gap-2">
                              <button
                                onClick={() => window.open(paymentProof.url, '_blank')}
                                className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                              >
                                <Eye className="w-3 h-3" />
                                View Full Size
                              </button>
                              <button
                                onClick={() => {
                                  updatePaymentProof({ file: null, url: '' });
                                  setPaymentProgress(0);
                                }}
                                className="text-xs text-red-600 hover:text-red-800 font-medium flex items-center gap-1"
                              >
                                <Trash2 className="w-3 h-3" />
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-3 p-2 bg-green-100 border border-green-300 rounded flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-700" />
                          <span className="text-xs text-green-800 font-medium">
                            Payment screenshot uploaded successfully
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Info Box */}
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-800">
                      <p className="font-semibold mb-1">Important:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Make sure the screenshot clearly shows the payment amount and reference number</li>
                        <li>The reference number must match the one you entered above</li>
                        <li>Your order will be verified before processing</li>
                      </ul>
                    </div>
                  </div>
                </div>
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
                onClick={() => setCurrentStep((prev) => Math.max(prev - 1, 1))}
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
                onClick={handleNextStep}
                disabled={isUploading || paymentUploading}
                className="px-6 py-3 bg-blue-900 text-white rounded-lg font-semibold hover:bg-blue-800 transition-colors disabled:opacity-50"
              >
                {isUploading || paymentUploading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Uploading...
                  </span>
                ) : (
                  currentStep === 6 ? 'Submit Payment & Place Order' : 'Next'
                )}
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