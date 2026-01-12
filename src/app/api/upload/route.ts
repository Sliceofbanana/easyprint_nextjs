import { NextRequest, NextResponse } from 'next/server'
import cloudinary from '@/lib/cloudinary'
import path from 'path'

// Add type for Cloudinary upload result
interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  pages?: number;
}

export async function POST(req: NextRequest) {
  try {
    // ✅ WordPress token auth
    const wpToken = req.headers.get('x-wp-token')

    if (wpToken !== process.env.WORDPRESS_API_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // ✅ File size limit (10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large' }, { status: 400 })
    }

    const originalName = file.name
    const fileNameWithoutExt = path.parse(originalName).name
    const timestamp = Date.now()

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
          if (error) reject(error)
          else resolve(result as CloudinaryUploadResult)
        }
      ).end(buffer)
    })

    return NextResponse.json({
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      fileName: originalName,
      fileSize: file.size,
      fileType: file.type,
      pages: result.pages || 1,
    })
  } catch (error) {
    console.error('❌ Upload error:', error)
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    )
  }
}