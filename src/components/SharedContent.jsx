import React, { useState, useEffect } from 'react';
import { nhost } from '../lib/nhost';
import { formatTime, showToast } from '../utils/helpers';

const SharedContent = ({ user }) => {
  const [sharedContent, setSharedContent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSharedContent();
  }, []);

  const loadSharedContent = async () => {
    try {
      // For demo purposes, use mock data since database might not be set up
      const mockSharedContent = [
        {
          id: '1',
          content_type: 'post',
          content_id: '1',
          image_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop',
          caption: 'Beautiful sunset view! 🌅',
          share_message: 'Check this out!',
          created_at: new Date().toISOString(),
          sender_id: 'user1',
          receiver_id: 'user2'
        },
        {
          id: '2',
          content_type: 'reel',
          content_id: '2',
          image_url: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=600&fit=crop',
          caption: 'Amazing city architecture 🏙️',
          share_message: 'Look at this amazing reel!',
          created_at: new Date(Date.now() - 3600000).toISOString(),
          sender_id: 'user2',
          receiver_id: 'user1'
        }
      ];
      
      setSharedContent(mockSharedContent);
      
      // Uncomment below to try real database query
      /*
      const query = `
        query GetSharedContent {
          shared_content(order_by: { created_at: desc }) {
            id
            content_type
            content_id
            image_url
            caption
            share_message
            created_at
            sender_id
            receiver_id
          }
        }
      `;
      
      const res = await nhost.graphql.request(query);
      setSharedContent(res.data?.shared_content || []);
      */
    } catch (error) {
      console.error('Error loading shared content:', error);
      showToast('Error loading shared content', 'error');
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
        Loading shared content...
      </div>
    );
  }

  if (sharedContent.length === 0) {
    return (
      <div style={{ 
        padding: '2rem', 
        textAlign: 'center', 
        color: '#8e8e8e' 
      }}>
        No content has been shared yet.
      </div>
    );
  }

  return (
    <div style={{ padding: '1rem' }}>
      <h3 style={{ color: '#fff', marginBottom: '1rem' }}>Shared Content</h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {sharedContent.map(content => (
          <div
            key={content.id}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              overflow: 'hidden'
            }}
          >
            {/* Share header */}
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
                Shared {content.content_type}
              </span>
              <span style={{ color: '#8e8e8e', fontSize: '0.8rem', marginLeft: 'auto' }}>
                {formatTime(content.created_at)}
              </span>
            </div>

            {/* Share message */}
            {content.share_message && (
              <div style={{
                padding: '0.75rem 1rem',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#fff',
                fontSize: '0.9rem',
                fontStyle: 'italic'
              }}>
                "{content.share_message}"
              </div>
            )}

            {/* Full image display */}
            <div style={{ padding: '0' }}>
              {content.image_url && (
                <img
                  src={content.image_url}
                  alt={`Shared ${content.content_type}`}
                  style={{
                    width: '100%',
                    maxHeight: '600px',
                    objectFit: 'cover',
                    display: 'block'
                  }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              )}
              
              {/* Caption */}
              {content.caption && (
                <div style={{
                  padding: '1rem',
                  color: '#fff',
                  fontSize: '0.95rem',
                  lineHeight: '1.4'
                }}>
                  <strong style={{ color: '#0095f6' }}>
                    {content.content_type === 'reel' ? '🎬' : '📷'} {content.content_type.toUpperCase()}
                  </strong>
                  <br />
                  {content.caption}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SharedContent;