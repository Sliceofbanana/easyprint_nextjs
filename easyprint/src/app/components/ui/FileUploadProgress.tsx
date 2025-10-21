'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { FileText, CheckCircle, Loader2, X, Eye } from 'lucide-react';

interface FileUploadProgressProps {
  fileName: string;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  fileSize?: number;
  fileType?: string;
  previewUrl?: string;
  onRemove?: () => void;
  onPreview?: () => void;
}

const FileUploadProgress: React.FC<FileUploadProgressProps> = ({
  fileName,
  progress,
  status,
  fileSize,
  fileType,
  previewUrl,
  onRemove,
  onPreview,
}) => {
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    return bytes < 1024 * 1024
      ? `${(bytes / 1024).toFixed(2)} KB`
      : `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const isImage = fileType?.startsWith('image/');
  const isPDF = fileType === 'application/pdf';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
    >
      <div className="flex items-start gap-3">
        {/* File Icon/Preview */}
        <div className="flex-shrink-0">
          {isImage && previewUrl ? (
            <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-200">
              <img
                src={previewUrl}
                alt={fileName}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-900" />
            </div>
          )}
        </div>

        {/* File Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {fileName}
              </p>
              <p className="text-xs text-gray-500">
                {formatFileSize(fileSize)}
                {fileType && ` • ${fileType.split('/')[1]?.toUpperCase()}`}
              </p>
            </div>

            {/* Status Icon */}
            <div className="flex items-center gap-1">
              {status === 'uploading' && (
                <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
              )}
              {status === 'success' && (
                <>
                  {previewUrl && (
                    <button
                      onClick={onPreview}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="Preview file"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  )}
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </>
              )}
              {status === 'error' && (
                <X className="w-4 h-4 text-red-600" />
              )}
              {status === 'success' && onRemove && (
                <button
                  onClick={onRemove}
                  className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="Remove file"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          {status === 'uploading' && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                <span>Uploading...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                <motion.div
                  className="bg-blue-600 h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          )}

          {/* Success Message */}
          {status === 'success' && (
            <p className="text-xs text-green-600 mt-1">
              ✓ Upload complete
            </p>
          )}

          {/* Error Message */}
          {status === 'error' && (
            <p className="text-xs text-red-600 mt-1">
              ✗ Upload failed
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default FileUploadProgress;