'use client';

import React, { useRef, useEffect } from 'react';
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
  const [previewModal, setPreviewModal] = React.useState({
    isOpen: false,
    fileName: '',
    fileUrl: '',
    fileType: '',
  });

  const [isDragOver, setIsDragOver] = React.useState(false);
  const [orderTotal, setOrderTotal] = React.useState(0);
  const [orderId, setOrderId] = React.useState('');

  const steps = ['Upload', 'Options', 'Customize', 'Contact', 'Review', 'Payment', 'Complete'];

  // ✅ Handle file upload
  const handleFileUpload = async (fileList: FileList | null) => {
    if (!fileList) return;
    await uploadMultipleFiles(fileList);
  };

  // ✅ Handle payment proof upload
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

  // ✅ Handle file preview
  const handlePreviewFile = (file: any) => {
    setPreviewModal({
      isOpen: true,
      fileName: file.name,
      fileUrl: file.url,
      fileType: file.type,
    });
  };

  // ✅ Calculate total (simplified - add your pricing logic)
  useEffect(() => {
    const calculateTotal = () => {
      const totalPages = files.reduce((sum, f) => sum + f.pages, 0);
      const pricePerPage = formData.printMode === 'black' ? 2 : 5;
      const total = totalPages * pricePerPage * formData.copies;
      setOrderTotal(total);
    };

    calculateTotal();
  }, [files, formData]);

  // ✅ Render file upload step
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

      {/* Uploading Files */}
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

              {/* Progress Bar */}
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

      {/* Uploaded Files */}
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
    </div>
  );

  return (
    <>
      <div className="min-h-screen bg-gray-50 py-8 pt-20">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
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

          {/* Step Indicator */}
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

          {/* Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-xl shadow-lg p-8 mb-8"
            >
              {currentStep === 1 && renderFileUploadStep()}
              {/* Add other steps here */}
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons */}
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

      {/* Preview Modal */}
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