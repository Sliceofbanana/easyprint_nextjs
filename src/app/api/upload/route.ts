import { NextRequest, NextResponse } from 'next/server'
import cloudinary from '@/lib/cloudinary'
import path from 'path'
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Add type for Cloudinary upload result
interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  pages?: number;
}

export async function POST(req: NextRequest) {
  try {
    console.log('📤 Upload API called');

    // ✅ Check for either WordPress token OR NextAuth session
    const wpToken = req.headers.get('x-wp-token');
    const session = await getServerSession(authOptions);

    console.log('🔐 Auth check:', { 
      hasWpToken: !!wpToken, 
      hasSession: !!session?.user 
    });

    if (!wpToken && !session?.user) {
      console.error('❌ Unauthorized - No token or session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;

    console.log('📁 File received:', { 
      name: file?.name, 
      size: file?.size, 
      type: file?.type,
      uploadType: type 
    });

    if (!file) {
      console.error('❌ No file provided');
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // ✅ File size limit (10MB)
    if (file.size > 10 * 1024 * 1024) {
      console.error('❌ File too large:', file.size);
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 })
    }

    const originalName = file.name
    const fileNameWithoutExt = path.parse(originalName).name
    const timestamp = Date.now()

    console.log('☁️ Uploading to Cloudinary...');

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const result: CloudinaryUploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: type === 'payment'
            ? 'easyprint/payments'
            : 'easyprint/documents',
          resource_type: 'auto',
          public_id: `${timestamp}_${fileNameWithoutExt.replace(/\s+/g, '_')}`,
          access_mode: 'public',
        },
        (error, result) => {
          if (error) {
            console.error('❌ Cloudinary error:', error);
            reject(error)
          } else {
            console.log('✅ Cloudinary upload success:', result?.secure_url);
            resolve(result as CloudinaryUploadResult)
          }
        }
      ).end(buffer)
    })

    const response = {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      fileName: originalName,
      fileSize: file.size,
      fileType: file.type,
      pages: result.pages || 1,
    };

    console.log('✅ Upload complete:', response);

    return NextResponse.json(response)
  } catch (error) {
    console.error('❌ Upload error:', error)
    
    // ✅ Better error handling
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error details:', errorMessage);

    return NextResponse.json(
      { error: 'Upload failed', details: errorMessage },
      { status: 500 }
    )
  }
}