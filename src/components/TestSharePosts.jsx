import React from 'react';
import Post from './Post';

const TestSharePosts = ({ onViewProfile }) => {
  const samplePosts = [
    {
      id: '1',
      image_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop',
      caption: 'Beautiful sunset view! 🌅',
      user: { id: 'user1', username: 'photographer', displayName: 'Nature Photographer', avatar_url: null },
      created_at: new Date().toISOString()
    },
    {
      id: '2',
      image_url: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=600&fit=crop',
      caption: 'Amazing architecture in the city 🏙️',
      user: { id: 'user2', username: 'cityexplorer', displayName: 'City Explorer', avatar_url: null },
      created_at: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: '3',
      image_url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&h=400&fit=crop',
      caption: 'Nature at its finest 🌿',
      user: { id: 'user3', username: 'naturelover', displayName: 'Nature Lover', avatar_url: null },
      created_at: new Date(Date.now() - 7200000).toISOString()
    }
  ];

  const mockUser = {
    id: 'current-user',
    username: 'testuser'
  };

  const handleLike = async (postId) => {
    console.log('Liked post:', postId);
  };

  const handleComment = async (postId) => {
    console.log('Comment on post:', postId);
  };

  const handleShare = async (postId) => {
    console.log('Share post:', postId);
  };

  const handleDelete = async (postId) => {
    console.log('Delete post:', postId);
  };

  return (
    <div style={{ 
      maxWidth: '600px', 
      margin: '0 auto', 
      padding: '1rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '2rem'
    }}>
      <h2 style={{ color: '#fff', textAlign: 'center', marginBottom: '2rem' }}>
        Test Posts with Share Feature
      </h2>
      
      {samplePosts.map(post => (
        <div key={post.id} style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          overflow: 'hidden'
        }}>
          <Post
            post={post}
            user={mockUser}
            onLike={handleLike}
            onComment={handleComment}
            onShare={handleShare}
            onDelete={handleDelete}
            onViewProfile={onViewProfile}
          />
        </div>
      ))}
      
      <div style={{
        background: 'rgba(0, 149, 246, 0.1)',
        border: '1px solid rgba(0, 149, 246, 0.3)',
        borderRadius: '8px',
        padding: '1rem',
        color: '#0095f6',
        fontSize: '0.9rem',
        textAlign: 'center'
      }}>
        💡 Click the share button on any post to test sharing with images!
      </div>
    </div>
  );
};

export default TestSharePosts;