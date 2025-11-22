import React, { useState, useEffect } from 'react';
import { nhost } from '../lib/nhost';

const CommentModal = ({ isOpen, onClose, contentId, contentType = 'post', currentUser }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showCommentMenu, setShowCommentMenu] = useState(null);
  const [editingComment, setEditingComment] = useState(null);
  const [editText, setEditText] = useState('');

  useEffect(() => {
    if (isOpen && contentId) {
      loadComments();
    }
  }, [isOpen, contentId, contentType]);

  const loadComments = async () => {
    setLoading(true);
    try {
      // Use comments table for both posts and reels
      const query = `
        query GetComments($contentId: uuid!) {
          comments(
            where: {post_id: {_eq: $contentId}}
            order_by: {created_at: asc}
          ) {
            id
            text
            created_at
            author_id
            profile {
              display_name
              avatar_url
            }
          }
        }
      `;

      const response = await fetch(`https://ofafvhtbuhvvkhuprotc.graphql.ap-southeast-1.nhost.run/v1`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-hasura-admin-secret': '2=o_TVK82F6FKyi8xcbfE9lAm,r,jpq@'
        },
        body: JSON.stringify({
          query,
          variables: { contentId }
        })
      });
      
      if (!response.ok) {
        console.error('Error loading comments:', response.status);
        return;
      }

      const result = await response.json();
      
      if (result.errors) {
        console.error('GraphQL errors loading comments:', result.errors);
        return;
      }

      const commentsData = result.data?.comments || [];
      
      // Attach user info to comments
      const commentsWithUsers = commentsData.map(comment => ({
        ...comment,
        user_id: comment.author_id,
        content: comment.text,
        user: {
          displayName: comment.profile?.display_name || 'User',
          avatarUrl: comment.profile?.avatar_url
        }
      }));
      
      setComments(commentsWithUsers);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const addComment = async () => {
    if (!newComment.trim() || !currentUser?.id || submitting) return;

    setSubmitting(true);
    try {
      // Get current user's profile ID
      const profileResponse = await fetch(`https://ofafvhtbuhvvkhuprotc.graphql.ap-southeast-1.nhost.run/v1`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-hasura-admin-secret': '2=o_TVK82F6FKyi8xcbfE9lAm,r,jpq@'
        },
        body: JSON.stringify({
          query: `query GetProfileId($authId: uuid!) {
            profiles(where: {auth_id: {_eq: $authId}}) {
              id
            }
          }`,
          variables: { authId: currentUser.id }
        })
      });
      
      const profileResult = await profileResponse.json();
      const profileId = profileResult.data?.profiles?.[0]?.id;
      
      if (!profileId) {
        alert('Profile not found. Please try again.');
        return;
      }
      
      // Add comment using comments table for both posts and reels
      const response = await fetch(`https://ofafvhtbuhvvkhuprotc.graphql.ap-southeast-1.nhost.run/v1`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-hasura-admin-secret': '2=o_TVK82F6FKyi8xcbfE9lAm,r,jpq@'
        },
        body: JSON.stringify({
          query: `mutation AddComment($postId: uuid!, $authorId: uuid!, $text: String!) {
            insert_comments_one(object: {
              post_id: $postId
              author_id: $authorId
              text: $text
            }) {
              id
              text
              created_at
              author_id
            }
          }`,
          variables: {
            postId: contentId,
            authorId: profileId,
            text: newComment.trim()
          }
        })
      });

      if (!response.ok) {
        console.error('Error adding comment:', response.status);
        alert('Failed to add comment. Please try again.');
        return;
      }

      const result = await response.json();
      
      if (result.errors) {
        console.error('GraphQL errors adding comment:', result.errors);
        alert('Failed to add comment. Please try again.');
        return;
      }

      if (result.data?.insert_comments_one) {
        const newCommentData = {
          ...result.data.insert_comments_one,
          user_id: currentUser.id,
          content: newComment.trim(),
          user: {
            displayName: currentUser.displayName,
            avatarUrl: currentUser.avatarUrl
          }
        };
        setComments(prev => [...prev, newCommentData]);
        setNewComment('');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addComment();
    }
  };

  const handleEditComment = (comment) => {
    setEditingComment(comment.id);
    setEditText(comment.content || comment.text);
    setShowCommentMenu(null);
  };

  const handleDeleteComment = async (comment) => {
    if (!window.confirm('Delete this comment?')) return;
    
    try {
      const response = await fetch(`https://ofafvhtbuhvvkhuprotc.graphql.ap-southeast-1.nhost.run/v1`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-hasura-admin-secret': '2=o_TVK82F6FKyi8xcbfE9lAm,r,jpq@'
        },
        body: JSON.stringify({
          query: `mutation DeleteComment($id: uuid!) {
            delete_comments_by_pk(id: $id) {
              id
            }
          }`,
          variables: { id: comment.id }
        })
      });
      
      if (!response.ok) {
        console.error('Error deleting comment:', response.status);
        return;
      }

      const result = await response.json();
      
      if (result.errors) {
        console.error('GraphQL errors deleting comment:', result.errors);
        return;
      }

      setComments(prev => prev.filter(c => c.id !== comment.id));
      setShowCommentMenu(null);
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const handleSaveEdit = async () => {
    if (!editText.trim()) return;
    
    try {
      const response = await fetch(`https://ofafvhtbuhvvkhuprotc.graphql.ap-southeast-1.nhost.run/v1`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-hasura-admin-secret': '2=o_TVK82F6FKyi8xcbfE9lAm,r,jpq@'
        },
        body: JSON.stringify({
          query: `mutation UpdateComment($id: uuid!, $text: String!) {
            update_comments_by_pk(pk_columns: {id: $id}, _set: {text: $text}) {
              id
              text
            }
          }`,
          variables: { 
            id: editingComment, 
            text: editText.trim() 
          }
        })
      });
      
      if (!response.ok) {
        console.error('Error updating comment:', response.status);
        return;
      }

      const result = await response.json();
      
      if (result.errors) {
        console.error('GraphQL errors updating comment:', result.errors);
        return;
      }

      setComments(prev => prev.map(c => 
        c.id === editingComment 
          ? { ...c, text: editText.trim(), content: editText.trim() }
          : c
      ));
      setEditingComment(null);
      setEditText('');
    } catch (error) {
      console.error('Error updating comment:', error);
    }
  };

  const formatTime = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <div className="modal" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div className="modal-dialog" style={{
        background: '#1a1a1a',
        borderRadius: '12px',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid #333'
      }}>
        {/* Header */}
        <div className="modal-header" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1rem',
          borderBottom: '1px solid #333'
        }}>
          <h3 style={{ margin: 0, color: '#fff' }}>Comments</h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#fff',
              fontSize: '1.5rem',
              cursor: 'pointer',
              padding: '0.25rem'
            }}
          >
            ×
          </button>
        </div>

        {/* Comments List */}
        <div className="comments-list" style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1rem',
          maxHeight: '400px'
        }}>
          {loading ? (
            <div style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>
              Loading comments...
            </div>
          ) : comments.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>
              No comments yet. Be the first to comment!
            </div>
          ) : (
            comments.map(comment => (
              <div key={comment.id} className="comment-item" style={{
                display: 'flex',
                gap: '0.75rem',
                marginBottom: '1rem',
                padding: '0.5rem',
                borderRadius: '8px',
                position: 'relative'
              }}>
                <div className="comment-avatar" style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: comment.user?.avatarUrl 
                    ? `url('${comment.user.avatarUrl}') center/cover` 
                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '0.8rem',
                  flexShrink: 0
                }}>
                  {!comment.user?.avatarUrl && (comment.user?.displayName?.[0]?.toUpperCase() || 'U')}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: '600', color: '#fff', marginBottom: '0.25rem' }}>
                    @{comment.user?.displayName || 'user'}
                  </div>
                  {editingComment === comment.id ? (
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <input
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        style={{
                          flex: 1,
                          padding: '0.25rem 0.5rem',
                          background: '#333',
                          border: '1px solid #555',
                          borderRadius: '4px',
                          color: '#fff',
                          fontSize: '0.9rem'
                        }}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') handleSaveEdit();
                          if (e.key === 'Escape') { setEditingComment(null); setEditText(''); }
                        }}
                        autoFocus
                      />
                      <button
                        onClick={handleSaveEdit}
                        style={{
                          background: '#0095f6',
                          color: 'white',
                          border: 'none',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.8rem'
                        }}
                      >
                        Save
                      </button>
                      <button
                        onClick={() => { setEditingComment(null); setEditText(''); }}
                        style={{
                          background: '#666',
                          color: 'white',
                          border: 'none',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.8rem'
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div style={{ color: '#fff', lineHeight: 1.4, wordWrap: 'break-word' }}>
                      {comment.content || comment.text}
                    </div>
                  )}
                  <div style={{ color: '#666', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                    {formatTime(comment.created_at)}
                  </div>
                </div>
                {comment.user_id === currentUser?.id && (
                  <div style={{ position: 'relative' }}>
                    <button
                      onClick={() => setShowCommentMenu(showCommentMenu === comment.id ? null : comment.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#666',
                        cursor: 'pointer',
                        padding: '0.25rem',
                        fontSize: '1rem'
                      }}
                    >
                      ⋯
                    </button>
                    {showCommentMenu === comment.id && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        right: 0,
                        background: '#2a2a2a',
                        border: '1px solid #444',
                        borderRadius: '8px',
                        minWidth: '120px',
                        zIndex: 1000,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                      }}>
                        <button
                          onClick={() => handleEditComment(comment)}
                          style={{
                            width: '100%',
                            padding: '0.5rem 0.75rem',
                            background: 'none',
                            border: 'none',
                            color: '#fff',
                            cursor: 'pointer',
                            textAlign: 'left',
                            borderBottom: '1px solid #444'
                          }}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleDeleteComment(comment)}
                          style={{
                            width: '100%',
                            padding: '0.5rem 0.75rem',
                            background: 'none',
                            border: 'none',
                            color: '#ff4757',
                            cursor: 'pointer',
                            textAlign: 'left'
                          }}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Comment Input */}
        <div className="comment-form" style={{
          display: 'flex',
          gap: '0.5rem',
          padding: '1rem',
          borderTop: '1px solid #333'
        }}>
          <input
            type="text"
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={submitting}
            style={{
              flex: 1,
              padding: '0.75rem',
              border: '1px solid #333',
              borderRadius: '20px',
              background: '#000',
              color: '#fff',
              fontSize: '0.9rem'
            }}
          />
          <button
            onClick={addComment}
            disabled={!newComment.trim() || submitting}
            style={{
              background: newComment.trim() && !submitting ? '#0095f6' : '#666',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1rem',
              borderRadius: '20px',
              cursor: newComment.trim() && !submitting ? 'pointer' : 'not-allowed',
              fontWeight: '600',
              fontSize: '0.9rem'
            }}
          >
            {submitting ? 'Posting...' : 'Post'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommentModal;