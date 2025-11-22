import React, { useState, useEffect } from 'react';
import { nhost } from '../lib/nhost';
import { showToast } from '../utils/helpers';
import '../styles/share.css';

const ShareModal = ({ isOpen, onClose, post, user }) => {
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen]);

  const loadUsers = async () => {
    // Mock users for demo
    setUsers([
      { id: '550e8400-e29b-41d4-a716-446655440000', displayName: 'Demo User 1', email: 'user1@demo.com' },
      { id: '550e8400-e29b-41d4-a716-446655440002', displayName: 'Demo User 2', email: 'user2@demo.com' }
    ]);
  };

  const handleUserSelect = (selectedUser) => {
    setSelectedUsers(prev => {
      const isSelected = prev.find(u => u.id === selectedUser.id);
      if (isSelected) {
        return prev.filter(u => u.id !== selectedUser.id);
      } else {
        return [...prev, selectedUser];
      }
    });
  };

  const handleShare = async () => {
    if (selectedUsers.length === 0) {
      showToast('Please select at least one user to share with', 'error');
      return;
    }

    setIsSharing(true);
    try {
      // Store shared content in database with image
      const mutation = `
        mutation ShareContent(
          $content_type: String!,
          $content_id: uuid!,
          $image_url: String!,
          $caption: String,
          $original_user_id: uuid,
          $sender_id: uuid!,
          $receiver_id: uuid!,
          $share_message: String
        ) {
          insert_shared_content_one(object: {
            content_type: $content_type,
            content_id: $content_id,
            image_url: $image_url,
            caption: $caption,
            original_user_id: $original_user_id,
            sender_id: $sender_id,
            receiver_id: $receiver_id,
            share_message: $share_message
          }) {
            id
          }
        }
      `;

      // For demo purposes, share with a mock user
      const mockReceiverId = '550e8400-e29b-41d4-a716-446655440000';
      
      await nhost.graphql.request(mutation, {
        content_type: post.isReel ? 'reel' : 'post',
        content_id: post.id,
        image_url: post.image_url,
        caption: post.caption || '',
        original_user_id: post.user?.id || user?.id,
        sender_id: user?.id || '550e8400-e29b-41d4-a716-446655440001',
        receiver_id: mockReceiverId,
        share_message: message
      });
      
      showToast(`${post.isReel ? 'Reel' : 'Post'} shared successfully with image!`);
      onClose();
      setSelectedUsers([]);
      setMessage('');
      setSearchTerm('');
    } catch (error) {
      console.error('Error sharing:', error);
      showToast('Error sharing content', 'error');
    } finally {
      setIsSharing(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="share-modal-overlay">
      <div className="share-modal">
        {/* Header */}
        <div className="share-modal-header">
          <h3 style={{ margin: 0, color: '#fff' }}>Share {post.isReel ? 'Reel' : 'Post'}</h3>
          <button
            onClick={onClose}
            className="share-modal-close"
          >
            ×
          </button>
        </div>

        {/* Content Preview */}
        <div className="share-post-preview">
          {post.image_url && (
            <div style={{ position: 'relative' }}>
              <img
                src={post.image_url}
                alt={post.isReel ? 'Reel' : 'Post'}
                className="share-post-image"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div style={{
                display: 'none',
                width: '60px',
                height: '60px',
                borderRadius: '8px',
                backgroundColor: '#333',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: '0.7rem'
              }}>
                {post.isReel ? '🎬' : '📷'}
              </div>
            </div>
          )}
          <div style={{ flex: 1 }}>
            <div style={{ color: '#fff', fontWeight: '600', fontSize: '0.9rem' }}>
              {post.user?.username || 'User'} {post.isReel && '🎬'}
            </div>
            <div style={{ color: '#8e8e8e', fontSize: '0.8rem', marginTop: '0.25rem' }}>
              {post.caption ? post.caption.substring(0, 50) + '...' : `No ${post.isReel ? 'description' : 'caption'}`}
            </div>
          </div>
        </div>



        {/* Users List */}
        <div className="share-users-list">
          {users.map(u => (
            <div
              key={u.id}
              onClick={() => handleUserSelect(u)}
              className={`share-user-item ${selectedUsers.find(su => su.id === u.id) ? 'selected' : ''}`}
            >
              <div className="share-user-avatar">
                {u.displayName?.[0]?.toUpperCase() || u.email?.[0]?.toUpperCase() || 'U'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: '#fff', fontWeight: '600', fontSize: '0.9rem' }}>
                  {u.displayName || u.email}
                </div>
                <div style={{ color: '#8e8e8e', fontSize: '0.8rem' }}>
                  {u.email}
                </div>
              </div>
              {selectedUsers.find(su => su.id === u.id) && (
                <div style={{ color: '#0095f6', fontSize: '1.2rem' }}>✓</div>
              )}
            </div>
          ))}
        </div>

        {/* Message */}
        <div style={{ padding: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <textarea
            placeholder="Add a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="share-message-textarea"
          />
        </div>

        {/* Footer */}
        <div className="share-modal-footer">
          <button
            onClick={onClose}
            className="share-btn share-btn-cancel"
          >
            Cancel
          </button>
          <button
            onClick={handleShare}
            disabled={selectedUsers.length === 0 || isSharing}
            className="share-btn share-btn-primary"
          >
            {isSharing ? 'Sharing...' : 'Share'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;