import { useState, useCallback } from 'react';
import { useCloudinary } from './useCloudinary';
import { useToast } from '../app/components/ui/Use-Toast';

export interface UploadedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  pages: number;
  url: string;
  publicId: string;
  progress: number;
  status: 'uploading' | 'success' | 'error';
}

interface UseFileUploadOptions {
  cloudName: string;
  uploadPreset: string;
  maxFiles?: number;
  maxFileSize?: number;
  acceptedTypes?: string[];
}

export const useFileUpload = ({
  cloudName,
  uploadPreset,
  maxFiles = 10,
  maxFileSize = 10 * 1024 * 1024, // 10MB
  acceptedTypes = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'],
}: UseFileUploadOptions) => {
  const { toast } = useToast();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<UploadedFile[]>([]);

  const { uploadToCloudinary } = useCloudinary({
    uploadPreset,
    cloudName,
  });

  const validateFile = useCallback(
    (file: File): string | null => {
      // Check file size
      if (file.size > maxFileSize) {
        return `File size exceeds ${maxFileSize / (1024 * 1024)}MB limit`;
      }

      // Check file type
      const fileExt = `.${file.name.split('.').pop()?.toLowerCase()}`;
      if (!acceptedTypes.includes(fileExt)) {
        return `File type ${fileExt} is not supported`;
      }

      // Check max files
      if (files.length + uploadingFiles.length >= maxFiles) {
        return `Maximum ${maxFiles} files allowed`;
      }

      return null;
    },
    [files.length, uploadingFiles.length, maxFiles, maxFileSize, acceptedTypes]
  );

  const uploadFile = useCallback(
    async (file: File, folder: 'documents' | 'payments' = 'documents') => {
      const fileId = `${Date.now()}_${Math.random()}`;

      // Validate file
      const validationError = validateFile(file);
      if (validationError) {
        toast({
          title: 'Upload Failed',
          description: validationError,
          variant: 'destructive',
        });
        return null;
      }

      // Add to uploading files
      const uploadingFile: UploadedFile = {
        id: fileId,
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        pages: 1,
        url: '',
        publicId: '',
        progress: 0,
        status: 'uploading',
      };

      setUploadingFiles((prev) => [...prev, uploadingFile]);

      try {
        const result = await uploadToCloudinary(file, folder);

        // Update to success
        const completedFile: UploadedFile = {
          ...uploadingFile,
          url: result.url,
          publicId: result.publicId,
          pages: result.pages || 1,
          progress: 100,
          status: 'success',
        };

        // Move from uploading to completed
        setUploadingFiles((prev) => prev.filter((f) => f.id !== fileId));
        setFiles((prev) => [...prev, completedFile]);

        toast({
          title: 'Upload Successful',
          description: `${file.name} uploaded successfully`,
        });

        return completedFile;
      } catch (error) {
        // Mark as error
        setUploadingFiles((prev) =>
          prev.map((f) =>
            f.id === fileId ? { ...f, status: 'error' as const } : f
          )
        );

        toast({
          title: 'Upload Failed',
          description: error instanceof Error ? error.message : 'Upload failed',
          variant: 'destructive',
        });

        return null;
      }
    },
    [uploadToCloudinary, validateFile, toast]
  );

  const uploadMultipleFiles = useCallback(
    async (fileList: FileList | File[]) => {
      const filesArray = Array.from(fileList);
      const uploadPromises = filesArray.map((file) => uploadFile(file));
      const results = await Promise.all(uploadPromises);
      return results.filter((result) => result !== null) as UploadedFile[];
    },
    [uploadFile]
  );

  const removeFile = useCallback((fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
    setUploadingFiles((prev) => prev.filter((f) => f.id !== fileId));
  }, []);

  const clearAllFiles = useCallback(() => {
    setFiles([]);
    setUploadingFiles([]);
  }, []);

  return {
    files,
    uploadingFiles,
    uploadFile,
    uploadMultipleFiles,
    removeFile,
    clearAllFiles,
    isUploading: uploadingFiles.length > 0,
  };
};