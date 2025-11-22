export const CLOUD_NAME = 'dn7cpjfyz'
export const UPLOAD_PRESET = 'unsigned_upload'

export async function uploadToCloudinary(file, type = 'image') {
  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', 'instagram_profiles')
    
    let endpoint = 'image/upload'
    if (type === 'video') endpoint = 'video/upload'
    if (type === 'audio') endpoint = 'video/upload' // Cloudinary uses video endpoint for audio
    
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${endpoint}`, {
      method: 'POST',
      body: formData
    })

    const data = await res.json()
    
    if (!res.ok || data.error) {
      console.error('❌ Cloudinary upload failed:', data)
      throw new Error(data.error?.message || 'Upload failed')
    }
    
    if (!data.secure_url) {
      throw new Error('No URL returned from Cloudinary')
    }
    
    console.log('✅ Uploaded to Cloudinary:', data.secure_url)
    return data.secure_url
  } catch (error) {
    console.error('❌ Cloudinary error:', error)
    throw error
  }
}