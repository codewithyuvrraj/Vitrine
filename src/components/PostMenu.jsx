import React, { useState } from 'react'

const PostMenu = ({ post, user, onClose }) => {
  const [isVisible, setIsVisible] = useState(false)

  const handleMenuClick = (action) => {
    switch(action) {
      case 'visit':
        console.log('Visit profile:', user.username)
        break
      case 'message':
        console.log('Message user:', user.username)
        break
      case 'follow':
        console.log('Follow user:', user.username)
        break
      case 'delete':
        if (confirm('Delete this post?')) {
          console.log('Delete post:', post.id)
        }
        break
    }
    onClose()
  }

  return (
    <div className="post-more-container" style={{ position: 'relative' }}>
      <button 
        className="post-more" 
        onClick={() => setIsVisible(!isVisible)}
        style={{
          background: 'none',
          border: 'none',
          color: '#ffffff',
          cursor: 'pointer',
          padding: '8px',
          borderRadius: '50%',
          transition: 'all 0.2s ease'
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
        </svg>
      </button>
      
      {isVisible && (
        <div 
          className="post-menu"
          style={{
            position: 'absolute',
            top: '100%',
            right: '0',
            background: 'rgba(20, 20, 30, 0.98)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '12px',
            minWidth: '180px',
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(15px)',
            zIndex: 1000,
            overflow: 'hidden'
          }}
        >
          <button 
            className="post-menu-item"
            onClick={() => handleMenuClick('visit')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              width: '100%',
              padding: '14px 18px',
              background: 'none',
              border: 'none',
              color: '#ffffff',
              textAlign: 'left',
              cursor: 'pointer',
              fontSize: '0.95rem',
              fontWeight: '500'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
            Visit Profile
          </button>
          
          <button 
            className="post-menu-item"
            onClick={() => handleMenuClick('message')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              width: '100%',
              padding: '14px 18px',
              background: 'none',
              border: 'none',
              color: '#ffffff',
              textAlign: 'left',
              cursor: 'pointer',
              fontSize: '0.95rem',
              fontWeight: '500'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
            </svg>
            Message
          </button>
          
          <button 
            className="post-menu-item"
            onClick={() => handleMenuClick('follow')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              width: '100%',
              padding: '14px 18px',
              background: 'none',
              border: 'none',
              color: '#ffffff',
              textAlign: 'left',
              cursor: 'pointer',
              fontSize: '0.95rem',
              fontWeight: '500'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
            Follow
          </button>
        </div>
      )}
    </div>
  )
}

export default PostMenu