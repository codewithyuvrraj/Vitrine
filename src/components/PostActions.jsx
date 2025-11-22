import React, { useState } from 'react'

const PostActions = ({ post, onLike, onComment, onShare, onSave }) => {
  const [isLiked, setIsLiked] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [likesCount, setLikesCount] = useState(0)

  const handleLike = () => {
    setIsLiked(!isLiked)
    setLikesCount(prev => isLiked ? prev - 1 : prev + 1)
    onLike?.(post.id, !isLiked)
  }

  const handleSave = () => {
    setIsSaved(!isSaved)
    onSave?.(post.id, !isSaved)
  }

  return (
    <>
      <div className="post-actions" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 16px'
      }}>
        <div className="post-actions-left" style={{ display: 'flex', gap: '16px' }}>
          <button 
            className={`post-action like-btn ${isLiked ? 'liked' : ''}`}
            onClick={handleLike}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '50%',
              transition: 'all 0.2s ease'
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill={isLiked ? '#ff3040' : 'none'} stroke={isLiked ? '#ff3040' : '#ffffff'} strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </button>
          
          <button 
            className="post-action"
            onClick={() => onComment?.(post.id)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '50%',
              transition: 'all 0.2s ease'
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </button>
          
          <button 
            className="post-action"
            onClick={() => onShare?.(post.id)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '50%',
              transition: 'all 0.2s ease'
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2">
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
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '50%',
              transition: 'all 0.2s ease'
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill={isSaved ? '#ffd700' : 'none'} stroke={isSaved ? '#ffd700' : '#ffffff'} strokeWidth="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
            </svg>
          </button>
        </div>
      </div>
      
      <div className="post-stats" style={{ padding: '0 16px 8px' }}>
        <div className="post-likes" style={{ color: '#ffffff', fontWeight: '600', cursor: 'pointer' }}>
          {likesCount} {likesCount === 1 ? 'like' : 'likes'}
        </div>
      </div>
    </>
  )
}

export default PostActions