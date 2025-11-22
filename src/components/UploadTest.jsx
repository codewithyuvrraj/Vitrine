import React from 'react'
import { uploadToCloudinary } from '../lib/cloudinary'

export default function UploadTest() {
  const handleUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const url = await uploadToCloudinary(file)
    alert(`File uploaded to:\n${url}`)
  }

  return (
    <div>
      <h2>Upload Test</h2>
      <input type="file" onChange={handleUpload} />
    </div>
  )
}