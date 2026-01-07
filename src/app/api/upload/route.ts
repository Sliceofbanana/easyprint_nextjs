import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import cloudinary from '../../../lib/cloudinary';
import path from 'path';

interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  pages?: number;
  format?: string;
  resource_type?: string;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Check file size (10MB limit)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // ✅ Remove extension from filename
    const originalName = file.name;
    const fileNameWithoutExt = path.parse(originalName).name;
    const timestamp = Date.now();

    console.log('📤 Uploading:', {
      original: originalName,
      withoutExt: fileNameWithoutExt,
      type: file.type,
    });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary
    const result = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: type === 'payment' ? 'easyprint/payments' : 'easyprint/documents',
          resource_type: 'auto',
          // ✅ Use filename WITHOUT extension - Cloudinary adds it automatically
          public_id: `${timestamp}_${fileNameWithoutExt.replace(/\s+/g, '_')}`,
          // ✅ Make publicly accessible
          access_mode: 'public',
          ...(file.type.startsWith('image/') && {
            transformation: [
              { width: 1920, height: 1920, crop: 'limit' },
              { quality: 'auto:good' },
            ],
          }),
        },
        (error, result) => {
          if (error) {
            console.error('❌ Cloudinary error:', error);
            reject(error);
          } else {
            console.log('✅ Upload success:', result?.secure_url);
            resolve(result as CloudinaryUploadResult);
          }
        }
      );
      uploadStream.end(buffer);
    });

    return NextResponse.json({
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      fileName: originalName,
      fileSize: file.size,
      fileType: file.type,
      pages: result.pages || 1,
    });
  } catch (error) {
    console.error('❌ Upload error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to upload file',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}