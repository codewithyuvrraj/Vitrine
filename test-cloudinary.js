// Test Cloudinary Upload
const CLOUD_NAME = 'dn7cpjfyz'
const UPLOAD_PRESET = 'instagram_preset'

async function testCloudinaryUpload() {
  // Create a test file (1x1 pixel image)
  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#FFD700'
  ctx.fillRect(0, 0, 1, 1)
  
  canvas.toBlob(async (blob) => {
    const formData = new FormData()
    formData.append('file', blob)
    formData.append('upload_preset', UPLOAD_PRESET)
    formData.append('folder', 'instagram_posts')
    
    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formData
      })
      
      if (res.ok) {
        const data = await res.json()
        console.log('✅ Cloudinary test successful:', data.secure_url)
      } else {
        const error = await res.text()
        console.error('❌ Cloudinary test failed:', error)
      }
    } catch (error) {
      console.error('❌ Network error:', error)
    }
  })
}

// Run test if in browser
if (typeof window !== 'undefined') {
  testCloudinaryUpload()
}