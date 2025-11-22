import React, { useState, useEffect } from 'react'
import { nhost } from '../lib/nhost'

export default function TestPosts() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPosts()
  }, [])

  const loadPosts = async () => {
    try {
      const query = `
        query GetPosts {
          posts(order_by: {created_at: desc}) {
            id
            caption
            created_at
            author {
              username
              display_name
            }
            post_media {
              storage_path
              mime_type
            }
          }
        }
      `
      
      const { data } = await nhost.graphql.request(query)
      setPosts(data?.posts || [])
    } catch (error) {
      console.error('Error loading posts:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div>Loading posts...</div>

  return (
    <div>
      <h3>Recent Posts</h3>
      {posts.length === 0 ? (
        <p>No posts yet. Upload your first post!</p>
      ) : (
        <div style={{ display: 'grid', gap: '20px' }}>
          {posts.map(post => (
            <div key={post.id} style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px' }}>
              <div style={{ marginBottom: '10px' }}>
                <strong>@{post.author?.username || 'Unknown'}</strong>
                <span style={{ color: '#666', marginLeft: '10px' }}>
                  {new Date(post.created_at).toLocaleDateString()}
                </span>
              </div>
              
              {post.post_media?.map(media => (
                <div key={media.storage_path} style={{ marginBottom: '10px' }}>
                  {media.mime_type?.startsWith('image/') ? (
                    <img 
                      src={media.storage_path} 
                      alt="Post" 
                      style={{ maxWidth: '100%', height: 'auto', borderRadius: '4px' }}
                    />
                  ) : media.mime_type?.startsWith('video/') ? (
                    <video 
                      src={media.storage_path} 
                      controls 
                      style={{ maxWidth: '100%', height: 'auto', borderRadius: '4px' }}
                    />
                  ) : null}
                </div>
              ))}
              
              {post.caption && (
                <p style={{ margin: '10px 0 0 0' }}>{post.caption}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}