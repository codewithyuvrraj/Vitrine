import React, { useEffect, useState } from 'react'
import { nhost } from '../lib/nhost'
import { uploadToCloudinary } from '../lib/cloudinary'

const Posts = () => {
  const [posts, setPosts] = useState([])
  const [caption, setCaption] = useState('')
  const [file, setFile] = useState(null)

  const loadPosts = async () => {
    const query = `
      query {
        posts(order_by: {created_at: desc}) {
          id
          caption
          image_url
          created_at
          user_id
        }
      }
    `
    const res = await nhost.graphql.request(query)
    setPosts(res.data?.posts || [])
  }

  const createPost = async (e) => {
    e.preventDefault()
    if (!file) return

    const imageUrl = await uploadToCloudinary(file)
    
    const mutation = `
      mutation($caption: String, $image_url: String, $user_id: uuid!) {
        insert_posts_one(object: {
          caption: $caption,
          image_url: $image_url,
          user_id: $user_id
        }) {
          id
        }
      }
    `
    
    await nhost.graphql.request(mutation, {
      caption,
      image_url: imageUrl,
      user_id: nhost.auth.getUser()?.id
    })
    
    setCaption('')
    setFile(null)
    loadPosts()
  }

  useEffect(() => {
    loadPosts()
  }, [])

  return (
    <div style={{ padding: 20 }}>
      <h2>Posts</h2>
      
      <form onSubmit={createPost} style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Caption"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
        />
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files[0])}
        />
        <button type="submit">Create Post</button>
      </form>

      {posts.map(post => (
        <div key={post.id} style={{ border: '1px solid #ccc', margin: 10, padding: 10 }}>
          <img src={post.image_url} alt="" style={{ maxWidth: 300 }} />
          <p>{post.caption}</p>
          <small>{new Date(post.created_at).toLocaleString()}</small>
        </div>
      ))}
    </div>
  )
}

export default Posts