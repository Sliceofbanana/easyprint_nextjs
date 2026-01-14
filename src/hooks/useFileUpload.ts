import { useState, useCallback } from 'react';
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
  maxFiles = 10,
  maxFileSize = 10 * 1024 * 1024,
  acceptedTypes = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'],
}: UseFileUploadOptions) => {
  const { toast } = useToast();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<UploadedFile[]>([]);

  const validateFile = useCallback(
    (file: File): string | null => {
      if (file.size > maxFileSize) {
        return `File size exceeds ${maxFileSize / 1024 / 1024}MB limit`;
      }

      const fileExt = `.${file.name.split('.').pop()?.toLowerCase()}`;
      if (!acceptedTypes.includes(fileExt)) {
        return `File type ${fileExt} is not supported`;
      }

      if (files.length + uploadingFiles.length >= maxFiles) {
        return `Maximum ${maxFiles} files allowed`;
      }

      return null;
    },
    [files.length, uploadingFiles.length, maxFiles, maxFileSize, acceptedTypes]
  );

  const uploadFile = useCallback(
    async (file: File, folder: 'documents' | 'payments' = 'documents'): Promise<UploadedFile | null> => {
      const validationError = validateFile(file);
      if (validationError) {
        toast({
          title: 'Upload Failed',
          description: validationError,
          variant: 'destructive',
        });
        return null;
      }

      const fileId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

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
        // ✅ Upload to Supabase via API route
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', folder);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Upload failed');
        }

        const result = await response.json();

        const completedFile: UploadedFile = {
          ...uploadingFile,
          url: result.url,
          publicId: result.filePath,
          pages: result.pages || 1,
          progress: 100,
          status: 'success',
        };

        setUploadingFiles((prev) => prev.filter((f) => f.id !== fileId));
        setFiles((prev) => [...prev, completedFile]);

        toast({
          title: 'Upload Successful',
          description: `${file.name} uploaded successfully`,
          variant: 'success',
        });

        return completedFile;
      } catch (error) {
        setUploadingFiles((prev) =>
          prev.map((f) =>
            f.id === fileId ? { ...f, status: 'error' as const } : f
          )
        );

        toast({
          title: 'Upload Failed',
          description: error instanceof Error ? error.message : 'Failed to upload file',
          variant: 'destructive',
        });

        return null;
      }
    },
    [validateFile, toast]
  );

  const uploadMultipleFiles = useCallback(
    async (fileList: FileList | File[]) => {
      const filesToUpload = Array.from(fileList);
      
      for (const file of filesToUpload) {
        try {
          await uploadFile(file);
        } catch (error) {
          console.error(`Failed to upload ${file.name}:`, error);
        }
      }
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