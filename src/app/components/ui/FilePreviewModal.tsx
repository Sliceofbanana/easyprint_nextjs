'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, ExternalLink, FileText, Loader2, Eye, Trash2 } from 'lucide-react';

interface FilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  fileUrl: string;
  fileType: string;
}

const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  isOpen,
  onClose,
  fileName,
  fileUrl,
  fileType,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ Determine file type from URL or fileType prop
  const isImage = fileType.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(fileUrl);
  const isPDF = fileType === 'application/pdf' || fileUrl.toLowerCase().endsWith('.pdf');

  const handleDownload = async () => {
    try {
      const response = await fetch(fileUrl);
      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      setError('Failed to download file');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-4 md:inset-10 bg-white rounded-2xl shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex-1 min-w-0 mr-4">
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {fileName}
                </h3>
                <p className="text-sm text-gray-500">
                  {isPDF ? 'PDF Document' : isImage ? 'Image' : 'Unknown type'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownload}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Download file"
                >
                  <Download className="w-5 h-5" />
                </button>
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Open in new tab"
                >
                  <ExternalLink className="w-5 h-5" />
                </a>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Close preview"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Preview Content */}
            <div className="flex-1 overflow-auto p-4 bg-gray-50">
              {error ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <FileText className="w-16 h-16 text-red-400 mb-4" />
                  <p className="text-red-600 mb-2">{error}</p>
                  <button
                    onClick={handleDownload}
                    className="px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors"
                  >
                    Try Download
                  </button>
                </div>
              ) : isImage ? (
                <div className="flex items-center justify-center h-full">
                  {loading && (
                    <Loader2 className="w-12 h-12 animate-spin text-blue-900 absolute" />
                  )}
                  <img
                    src={fileUrl}
                    alt={fileName}
                    className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                    onLoad={() => setLoading(false)}
                    onError={() => {
                      setLoading(false);
                      setError('Failed to load image');
                    }}
                  />
                </div>
              ) : isPDF ? (
                <>
                  {loading && (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="w-12 h-12 animate-spin text-blue-900" />
                    </div>
                  )}
                  <iframe
                    src={`${fileUrl}#view=FitH`}
                    className="w-full h-full rounded-lg border-0"
                    title={fileName}
                    onLoad={() => setLoading(false)}
                    onError={() => {
                      setLoading(false);
                      setError('Failed to load PDF');
                    }}
                  />
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <FileText className="w-16 h-16 text-gray-400 mb-4" />
                  <p className="text-gray-600 mb-2">Preview not available</p>
                  <p className="text-sm text-gray-500 mb-4">
                    This file type cannot be previewed in the browser
                  </p>
                  <button
                    onClick={handleDownload}
                    className="px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors"
                  >
                    Download File
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default FilePreviewModal;