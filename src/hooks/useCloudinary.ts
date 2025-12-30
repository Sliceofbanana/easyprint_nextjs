import { useState, useCallback } from 'react';

interface CloudinaryUploadResult {
  url: string;
  publicId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  pages?: number;
}

interface UseCloudinaryOptions {
  uploadPreset: string;
  cloudName: string;
  onProgress?: (progress: number) => void;
  onSuccess?: (result: CloudinaryUploadResult) => void;
  onError?: (error: Error) => void;
}

export const useCloudinary = ({
  uploadPreset,
  cloudName,
  onProgress,
  onSuccess,
  onError,
}: UseCloudinaryOptions) => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  const uploadToCloudinary = useCallback(
    async (
      file: File,
      folder: 'documents' | 'payments' = 'documents'
    ): Promise<CloudinaryUploadResult> => {
      setIsUploading(true);
      setProgress(0);
      setError(null);

      return new Promise((resolve, reject) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', uploadPreset);
        formData.append('folder', `easyprint/${folder}`);

        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percentComplete = Math.round((e.loaded / e.total) * 100);
            setProgress(percentComplete);
            onProgress?.(percentComplete);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            try {
              const response = JSON.parse(xhr.responseText);
              const result: CloudinaryUploadResult = {
                url: response.secure_url,
                publicId: response.public_id,
                fileName: file.name,
                fileSize: file.size,
                fileType: file.type,
                pages: response.pages || 1,
              };

              setIsUploading(false);
              setProgress(100);
              onSuccess?.(result);
              resolve(result);
            } catch {
              // ✅ FIXED: Removed unused _error parameter
              const err = new Error('Failed to parse response');
              setError(err);
              setIsUploading(false);
              onError?.(err);
              reject(err);
            }
          } else {
            const err = new Error(`Upload failed with status ${xhr.status}`);
            setError(err);
            setIsUploading(false);
            onError?.(err);
            reject(err);
          }
        });

        xhr.addEventListener('error', () => {
          const err = new Error('Network error during upload');
          setError(err);
          setIsUploading(false);
          onError?.(err);
          reject(err);
        });

        xhr.addEventListener('abort', () => {
          const err = new Error('Upload cancelled');
          setError(err);
          setIsUploading(false);
          onError?.(err);
          reject(err);
        });

        xhr.open(
          'POST',
          `https://api.cloudinary.com/v1_1/${cloudName}/upload`
        );
        xhr.send(formData);
      });
    },
    [uploadPreset, cloudName, onProgress, onSuccess, onError]
  );

  return {
    uploadToCloudinary,
    isUploading,
    progress,
    error,
  };
};