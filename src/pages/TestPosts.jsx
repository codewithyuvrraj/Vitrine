import React, { useEffect, useState } from 'react'
import { nhost } from '../lib/nhost'

const TestPosts = () => {
  const [posts, setPosts] = useState([])

  useEffect(() => {
    const load = async () => {
      const query = `
        query {
          posts(limit: 5, order_by: {created_at: desc}) {
            id
            caption
            created_at
          }
        }
      `
      const res = await nhost.graphql.request(query)
      setPosts(res.data.posts)
    }
    load()
  }, [])

  return (
    <div style={{ padding: 20 }}>
      <h1>Recent Posts</h1>
      {posts.length === 0 ? (
        <p>No posts yet.</p>
      ) : (
        <ul>
          {posts.map(p => (
            <li key={p.id}>
              <strong>{p.caption}</strong> — {new Date(p.created_at).toLocaleString()}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default TestPosts