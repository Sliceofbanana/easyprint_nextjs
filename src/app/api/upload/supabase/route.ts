import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string || 'document'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Check file size (10MB limit)
    const MAX_SIZE = 10 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    
    // Create unique file path
    const timestamp = Date.now()
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const filePath = `${type}/${timestamp}_${sanitizedName}`

    console.log('📤 Uploading to Supabase:', {
      bucket: 'easyprint-files',
      path: filePath,
      size: file.size,
      type: file.type,
    })

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('easyprint-files')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (error) {
      console.error('❌ Supabase upload error:', error)
      return NextResponse.json(
        { error: 'Upload failed', details: error.message },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('easyprint-files')
      .getPublicUrl(data.path)

    console.log('✅ Upload success:', publicUrl)

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName: file.name,
      filePath: data.path,
      fileSize: file.size,
      fileType: file.type,
      pages: 1,
    })
  } catch (error) {
    console.error('❌ Upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}