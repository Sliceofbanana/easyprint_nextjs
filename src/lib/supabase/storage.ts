import { supabase } from './client'

export async function uploadFile(
  file: File,
  bucket: string,
  path: string
): Promise<{ url: string; path: string } | null> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (error) {
      console.error('Upload error:', error)
      return null
    }

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path)

    return {
      url: publicUrl,
      path: data.path,
    }
  } catch (error) {
    console.error('Upload failed:', error)
    return null
  }
}

export async function deleteFile(
  bucket: string,
  path: string
): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path])

    return !error
  } catch (error) {
    console.error('Delete failed:', error)
    return false
  }
}

export async function downloadFile(
  bucket: string,
  path: string
): Promise<Blob | null> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(path)

    if (error) {
      console.error('Download error:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Download failed:', error)
    return null
  }
}