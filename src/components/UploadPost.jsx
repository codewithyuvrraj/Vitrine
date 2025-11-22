import React, { useState } from 'react'
import { nhost } from '../lib/nhost'

const CLOUD_NAME = 'dn7cpjfyz'
const UPLOAD_PRESET = 'nhost_upload'

export default function UploadPost() {
  const [file, setFile] = useState(null)
  const [caption, setCaption] = useState('')
  const [uploading, setUploading] = useState(false)
  const [url, setUrl] = useState(null)

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', UPLOAD_PRESET)

    // Upload to Cloudinary (unsigned)
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`, {
      method: 'POST',
      body: formData
    })
    const data = await res.json()
    const fileUrl = data.secure_url
    setUrl(fileUrl)

    // Save post to Nhost (GraphQL)
    const mutation = `
      mutation InsertPost($caption: String!, $url: String!) {
        insert_posts_one(object: {
          caption: $caption,
          is_reel: false,
          post_media: { data: { storage_path: $url } }
        }) {
          id
          caption
        }
      }
    `
    await nhost.graphql.request(mutation, { caption, url: fileUrl })
    setUploading(false)
    alert('Post uploaded and saved to DB')
  }

  return (
    <div>
      <h3>Upload Post</h3>
      <input type="file" onChange={(e) => setFile(e.target.files[0])} />
      <input value={caption} onChange={(e)=>setCaption(e.target.value)} placeholder="Caption" />
      <button onClick={handleUpload} disabled={uploading}>{uploading ? 'Uploading...' : 'Upload'}</button>
      {url && <p>Uploaded: <a href={url} target="_blank" rel="noreferrer">{url}</a></p>}
    </div>
  )
}