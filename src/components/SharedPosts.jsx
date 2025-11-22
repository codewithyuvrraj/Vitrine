import React, { useState, useEffect } from 'react';
import { nhost } from '../lib/nhost';
import { formatTime, showToast } from '../utils/helpers';

const SharedPosts = ({ user }) => {
  const [sharedPosts, setSharedPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadSharedPosts();
    }
  }, [user]);

  const loadSharedPosts = async () => {
    try {
      const query = `
        query GetSharedPosts($userId: uuid!) {
          shared_posts(
            where: { receiver_id: { _eq: $userId } }
            order_by: { created_at: desc }
          ) {
            id
            caption
            created_at
            sender_id
            post {
              id
              image_url
              caption
              created_at
              user {
                id
                username
                displayName
                avatarUrl
              }
            }
            sender {
              id
              username
              displayName
              avatarUrl
            }
          }
        }
      `;
      
      const res = await nhost.graphql.request(query, { userId: user.id });
      setSharedPosts(res.data?.shared_posts || []);
    } catch (error) {
      console.error('Error loading shared posts:', error);
      showToast('Error loading shared posts', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        padding: '2rem', 
        textAlign: 'center', 
        color: '#8e8e8e' 
      }}>
        Loading shared posts...
      </div>
    );
  }

  if (sharedPosts.length === 0) {
    return (
      <div style={{ 
        padding: '2rem', 
        textAlign: 'center', 
        color: '#8e8e8e' 
      }}>
        No posts have been shared with you yet.
      </div>
    );
  }

  return (
    <div style={{ padding: '1rem' }}>
      <h3 style={{ color: '#fff', marginBottom: '1rem' }}>Posts Shared With You</h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {sharedPosts.map(sharedPost => (
          <div
            key={sharedPost.id}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              overflow: 'hidden'
            }}
          >
            {/* Shared by header */}
            <div style={{
              padding: '0.75rem 1rem',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'rgba(0, 149, 246, 0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0095f6" strokeWidth="2">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                <polyline points="16,6 12,2 8,6"/>
                <line x1="12" y1="2" x2="12" y2="15"/>
              </svg>
              <span style={{ color: '#0095f6', fontSize: '0.9rem', fontWeight: '500' }}>
                Shared by {sharedPost.sender?.displayName || sharedPost.sender?.username || 'Someone'}
              </span>
              <span style={{ color: '#8e8e8e', fontSize: '0.8rem', marginLeft: 'auto' }}>
                {formatTime(sharedPost.created_at)}
              </span>
            </div>

            {/* Shared message */}
            {sharedPost.caption && (
              <div style={{
                padding: '0.75rem 1rem',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#fff',
                fontSize: '0.9rem',
                fontStyle: 'italic'
              }}>
                "{sharedPost.caption}"
              </div>
            )}

            {/* Original post */}
            <div style={{ padding: '1rem' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '0.75rem'
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: '#e1306c',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '600',
                  fontSize: '0.8rem'
                }}>
                  {sharedPost.post?.user?.username?.[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                  <div style={{ color: '#fff', fontWeight: '600', fontSize: '0.9rem' }}>
                    {sharedPost.post?.user?.username || 'User'}
                  </div>
                  <div style={{ color: '#8e8e8e', fontSize: '0.8rem' }}>
                    {formatTime(sharedPost.post?.created_at)}
                  </div>
                </div>
              </div>

              {sharedPost.post?.image_url && (
                <div style={{ marginBottom: '0.75rem' }}>
                  <img
                    src={sharedPost.post.image_url}
                    alt="Shared post"
                    style={{
                      width: '100%',
                      maxHeight: '400px',
                      objectFit: 'cover',
                      borderRadius: '8px'
                    }}
                  />
                </div>
              )}

              {sharedPost.post?.caption && (
                <div style={{ color: '#fff', fontSize: '0.9rem' }}>
                  <strong>{sharedPost.post.user?.username || 'User'}</strong> {sharedPost.post.caption}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SharedPosts;