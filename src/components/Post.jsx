import React, { useState } from 'react';
import { formatTime, isVideoFile, showToast } from '../utils/helpers';
import ShareModal from './ShareModal';

const Post = ({ post, user, onLike, onComment, onShare, onDelete, onViewProfile }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const handleLike = async () => {
    try {
      await onLike(post.id);
      setIsLiked(!isLiked);
      setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
    } catch (error) {
      showToast('Error liking post', 'error');
    }
  };

  const handleSave = async () => {
    try {
      // Implement save functionality
      setIsSaved(!isSaved);
      showToast(isSaved ? 'Post unsaved' : 'Post saved');
    } catch (error) {
      showToast('Error saving post', 'error');
    }
  };

  const handleMenuToggle = (e) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await onDelete(post.id);
        showToast('Post deleted successfully');
      } catch (error) {
        showToast('Error deleting post', 'error');
      }
    }
    setShowMenu(false);
  };

  const isOwner = user && post.user_id === user.id;
  const isVideo = isVideoFile(post.image_url);

  return (
    <div className="post">
      <div className="post-header" style={{ display: 'flex', alignItems: 'center', padding: '1rem', gap: '0.75rem' }}>
        <div className="post-avatar">
          {post.user?.avatar_url ? (
            <img 
              src={post.user.avatar_url} 
              alt={post.user.username} 
              style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} 
            />
          ) : (
            <span style={{ 
              width: '32px', 
              height: '32px', 
              borderRadius: '50%', 
              background: '#e1306c', 
              color: 'white', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontWeight: '600' 
            }}>
              {post.user?.username?.[0]?.toUpperCase() || 'U'}
            </span>
          )}
        </div>
        <div 
          className="post-username" 
          style={{ flex: 1, color: '#ffffff', fontWeight: '600', cursor: 'pointer' }}
          onClick={() => {
            if (onViewProfile && post.user) {
              onViewProfile(post.user);
            }
          }}
        >
          {post.user?.displayName || post.user?.username || 'User'}
        </div>
        <div className="post-more-container" style={{ position: 'relative' }}>
          <button className="post-more" onClick={handleMenuToggle}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
            </svg>
          </button>
          {showMenu && (
            <div className="post-menu show">
              <button className="post-menu-item" onClick={() => {
                setShowMenu(false);
                if (onViewProfile && post.user) {
                  onViewProfile(post.user);
                }
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
                Visit Profile
              </button>
              <button className="post-menu-item" onClick={() => setShowMenu(false)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
                </svg>
                Message
              </button>
              <button className="post-menu-item" onClick={() => setShowMenu(false)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                </svg>
                Follow
              </button>
              {isOwner && (
                <button className="post-menu-item" onClick={handleDelete} style={{ color: '#ff4757' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                  </svg>
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {post.image_url && (
        isVideo ? (
          <video 
            src={post.image_url} 
            controls 
            className="post-image" 
            style={{ width: '100%', maxHeight: '600px', objectFit: 'cover' }} 
          />
        ) : (
          <img 
            src={post.image_url} 
            alt="Post" 
            className="post-image" 
            style={{ width: '100%', maxHeight: '600px', objectFit: 'cover' }} 
          />
        )
      )}

      <div className="post-actions">
        <div className="post-actions-left">
          <button 
            className={`post-action like-btn ${isLiked ? 'liked' : ''}`} 
            onClick={handleLike}
            title="Like"
          >
            <svg 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill={isLiked ? '#ff3040' : 'none'} 
              stroke={isLiked ? '#ff3040' : '#ffffff'} 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </button>
          <button className="post-action" onClick={() => onComment(post.id)} title="Comment">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </button>
          <button className="post-action" onClick={() => setShowShareModal(true)} title="Share">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
              <polyline points="16,6 12,2 8,6"/>
              <line x1="12" y1="2" x2="12" y2="15"/>
            </svg>
          </button>
        </div>
        <div className="post-actions-right">
          <button 
            className={`post-action save-btn ${isSaved ? 'saved' : ''}`} 
            onClick={handleSave}
            title="Save"
          >
            <svg 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill={isSaved ? '#ffd700' : 'none'} 
              stroke={isSaved ? '#ffd700' : '#ffffff'} 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="post-stats">
        <div className="post-likes" onClick={() => console.log('Show likes')}>
          {likesCount} {likesCount === 1 ? 'like' : 'likes'}
        </div>
      </div>

      {post.caption && (
        <div className="post-caption">
          <strong>{post.user?.username || 'User'}</strong> {post.caption}
        </div>
      )}
      
      <div className="post-timestamp">{formatTime(post.created_at)}</div>
      
      <ShareModal 
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        post={post}
        user={user}
      />
    </div>
  );
};

export default Post;