// Fixed Instagram-like Reels Viewer with proper comment integration
let currentReelIndex = 0;
let totalReels = 0;
let touchStartY = 0;
let touchEndY = 0;

// Initialize reel viewer
function initReelViewer(reelsCount) {
  totalReels = reelsCount;
  currentReelIndex = 0;
  
  // Add touch/swipe listeners
  const reelsContainer = document.getElementById('reelsContainer');
  if (reelsContainer) {
    reelsContainer.addEventListener('touchstart', handleTouchStart, { passive: true });
    reelsContainer.addEventListener('touchend', handleTouchEnd, { passive: true });
    reelsContainer.addEventListener('wheel', handleWheel, { passive: false });
  }
  
  // Auto-play first reel
  playCurrentReel();
}

// Handle touch start
function handleTouchStart(e) {
  touchStartY = e.touches[0].clientY;
}

// Handle touch end
function handleTouchEnd(e) {
  touchEndY = e.changedTouches[0].clientY;
  handleSwipe();
}

// Handle mouse wheel
function handleWheel(e) {
  e.preventDefault();
  if (e.deltaY > 0) {
    nextReel();
  } else {
    previousReel();
  }
}

// Handle swipe gesture
function handleSwipe() {
  const swipeThreshold = 50;
  const diff = touchStartY - touchEndY;
  
  if (Math.abs(diff) > swipeThreshold) {
    if (diff > 0) {
      nextReel(); // Swipe up - next reel
    } else {
      previousReel(); // Swipe down - previous reel
    }
  }
}

// Go to next reel
function nextReel() {
  if (currentReelIndex < totalReels - 1) {
    currentReelIndex++;
    updateReelPosition();
    playCurrentReel();
  }
}

// Go to previous reel
function previousReel() {
  if (currentReelIndex > 0) {
    currentReelIndex--;
    updateReelPosition();
    playCurrentReel();
  }
}

// Update reel position
function updateReelPosition() {
  const reelsContainer = document.getElementById('reelsContainer');
  if (reelsContainer) {
    const translateY = -currentReelIndex * 100;
    reelsContainer.style.transform = `translateY(${translateY}%)`;
  }
}

// Play current reel
function playCurrentReel() {
  // Pause all videos
  document.querySelectorAll('.reel-slide video').forEach(video => {
    video.pause();
  });
  
  // Play current video
  const currentVideo = document.getElementById(`reelVideo${currentReelIndex}`);
  if (currentVideo) {
    currentVideo.play().catch(() => console.log('Autoplay blocked'));
  }
}

// Toggle play/pause
function togglePlayPause(video) {
  if (video.paused) {
    video.play();
  } else {
    video.pause();
  }
}

// Toggle mute/unmute
function toggleMute(videoId) {
  const video = document.getElementById(videoId);
  const muteBtn = document.getElementById(`muteBtn${videoId.replace('reelVideo', '')}`);
  
  if (video && muteBtn) {
    video.muted = !video.muted;
    muteBtn.textContent = video.muted ? '🔇' : '🔊';
    
    // Add visual feedback
    muteBtn.style.transform = 'scale(1.2)';
    setTimeout(() => {
      muteBtn.style.transform = 'scale(1)';
    }, 150);
  }
}

// Toggle reel like
async function toggleReelLike(reelId, button) {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    showToast('Please log in to like reels', 'error');
    return;
  }
  
  // Disable button while processing
  button.disabled = true;
  
  try {
    const checkQuery = `
      query CheckReelLike($reelId: uuid!, $userId: uuid!) {
        reels_likes(where: {reel_id: {_eq: $reelId}, user_id: {_eq: $userId}}) {
          id
        }
      }
    `;
    
    const { data: checkData } = await makeGraphQLRequest(checkQuery, {
      reelId,
      userId: currentUser.id
    });
    
    const existingLike = checkData?.reels_likes?.[0];
    const likeCount = button.querySelector('.like-count') || button.querySelector('span');
    const heartIcon = button.querySelector('svg path');
    
    if (existingLike) {
      // Unlike
      const unlikeMutation = `
        mutation UnlikeReel($likeId: uuid!) {
          delete_reels_likes_by_pk(id: $likeId) {
            id
          }
        }
      `;
      
      await makeGraphQLRequest(unlikeMutation, { likeId: existingLike.id });
      
      if (heartIcon) heartIcon.setAttribute('fill', 'none');
      button.style.color = 'white';
      button.classList.remove('liked');
      if (likeCount) likeCount.textContent = Math.max(0, parseInt(likeCount.textContent) - 1);
      
    } else {
      // Like
      const likeMutation = `
        mutation LikeReel($reelId: uuid!) {
          insert_reels_likes_one(object: {
            reel_id: $reelId
          }) {
            id
          }
        }
      `;
      
      await makeGraphQLRequest(likeMutation, { reelId });
      
      if (heartIcon) heartIcon.setAttribute('fill', 'currentColor');
      button.style.color = '#ff3040';
      button.classList.add('liked');
      if (likeCount) likeCount.textContent = parseInt(likeCount.textContent) + 1;
      
      // Add like animation
      button.style.animation = 'likeAnimation 0.3s ease';
      setTimeout(() => {
        button.style.animation = '';
      }, 300);
    }
  } catch (error) {
    console.error('Like error:', error);
    showToast('Failed to update like', 'error');
  } finally {
    button.disabled = false;
  }
}

// Open reel comments with proper integration
function openReelComments(reelId) {
  // Prevent body scrolling
  document.body.classList.add('modal-open');
  
  // Create comments modal
  const modal = document.createElement('div');
  modal.className = 'modal reel-comments-modal';
  modal.innerHTML = `
    <div class="modal-backdrop" onclick="closeReelComments()"></div>
    <div class="modal-dialog" style="max-width: 500px; max-height: 80vh;">
      <div class="modal-header">
        <h3>Comments</h3>
        <button onclick="closeReelComments()" class="close-btn">×</button>
      </div>
      <div class="modal-body">
        <div id="reelCommentsList" style="max-height: 400px; overflow-y: auto; padding: 1rem;">
          <div style="text-align: center; color: #666; padding: 2rem;">
            <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">💬</div>
            <div>Loading comments...</div>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <div style="display: flex; gap: 0.5rem; padding: 1rem; border-top: 1px solid #333;">
          <input 
            id="reelCommentInput" 
            type="text" 
            placeholder="Add a comment..." 
            style="flex: 1; padding: 0.75rem; border: 1px solid #333; border-radius: 20px; background: #000; color: #fff;" 
            onkeypress="handleReelCommentKeyPress(event, '${reelId}')"
          >
          <button 
            onclick="addReelComment('${reelId}')" 
            style="background: #0095f6; color: white; border: none; padding: 0.75rem 1rem; border-radius: 20px; cursor: pointer; font-weight: 600;"
          >
            Post
          </button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  
  loadReelComments(reelId);
  
  // Focus on input
  setTimeout(() => {
    const input = document.getElementById('reelCommentInput');
    if (input) input.focus();
  }, 100);
}

// Close reel comments modal
function closeReelComments() {
  document.body.classList.remove('modal-open');
  const modal = document.querySelector('.reel-comments-modal');
  if (modal) {
    modal.remove();
  }
}

// Handle enter key press in comment input
function handleReelCommentKeyPress(event, reelId) {
  if (event.key === 'Enter') {
    event.preventDefault();
    addReelComment(reelId);
  }
}

// Load reel comments
async function loadReelComments(reelId) {
  try {
    const query = `
      query GetReelComments($reelId: uuid!) {
        reels_comments(where: {reel_id: {_eq: $reelId}}, order_by: {created_at: asc}) {
          id
          content
          created_at
          user_id
          user {
            id
            displayName
            avatarUrl
          }
        }
      }
    `;
    
    const { data } = await makeGraphQLRequest(query, { reelId });
    const comments = data?.reels_comments || [];
    
    const commentsList = document.getElementById('reelCommentsList');
    if (!commentsList) return;
    
    if (comments.length === 0) {
      commentsList.innerHTML = `
        <div style="text-align: center; color: #666; padding: 2rem;">
          <div style="font-size: 2rem; margin-bottom: 1rem;">💬</div>
          <div>No comments yet. Be the first to comment!</div>
        </div>
      `;
      return;
    }
    
    commentsList.innerHTML = comments.map(comment => {
      const user = comment.user;
      const initial = user?.displayName?.charAt(0).toUpperCase() || 'U';
      const timeAgo = getTimeAgo(comment.created_at);
      
      return `
        <div class="comment-item" style="display: flex; gap: 0.75rem; margin-bottom: 1rem; padding: 0.5rem; border-radius: 8px; transition: background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.05)'" onmouseout="this.style.background='transparent'">
          <div class="comment-avatar" style="width: 32px; height: 32px; border-radius: 50%; background: ${user?.avatarUrl ? `url('${user.avatarUrl}') center/cover` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 0.8rem; flex-shrink: 0;">
            ${user?.avatarUrl ? '' : initial}
          </div>
          <div style="flex: 1; min-width: 0;">
            <div style="font-weight: 600; color: #fff; margin-bottom: 0.25rem;">@${user?.displayName || 'user'}</div>
            <div style="color: #fff; line-height: 1.4; word-wrap: break-word;">${escapeHtml(comment.content)}</div>
            <div style="color: #666; font-size: 0.8rem; margin-top: 0.25rem;">${timeAgo}</div>
          </div>
        </div>
      `;
    }).join('');
    
    // Scroll to bottom to show latest comments
    commentsList.scrollTop = commentsList.scrollHeight;
  } catch (error) {
    console.error('Load comments error:', error);
    const commentsList = document.getElementById('reelCommentsList');
    if (commentsList) {
      commentsList.innerHTML = `
        <div style="text-align: center; color: #ff6b6b; padding: 2rem;">
          <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">⚠️</div>
          <div>Failed to load comments. Please try again.</div>
        </div>
      `;
    }
  }
}

// Add reel comment
async function addReelComment(reelId) {
  const input = document.getElementById('reelCommentInput');
  const content = input?.value?.trim();
  
  if (!content) {
    showToast('Please enter a comment', 'error');
    return;
  }
  
  const currentUser = getCurrentUser();
  if (!currentUser) {
    showToast('Please log in to comment', 'error');
    return;
  }
  
  // Disable input while posting
  input.disabled = true;
  const button = input.nextElementSibling;
  const originalText = button.textContent;
  button.textContent = 'Posting...';
  button.disabled = true;
  
  try {
    const mutation = `
      mutation AddReelComment($reelId: uuid!, $content: String!) {
        insert_reels_comments_one(object: {
          reel_id: $reelId
          content: $content
        }) {
          id
          content
          created_at
          user {
            id
            displayName
            avatarUrl
          }
        }
      }
    `;
    
    const { data, error } = await makeGraphQLRequest(mutation, {
      reelId,
      content
    });
    
    if (error) {
      throw new Error(error.message || 'Failed to post comment');
    }
    
    if (data?.insert_reels_comments_one) {
      input.value = '';
      showToast('Comment posted!', 'success');
      loadReelComments(reelId);
      
      // Update comment count if visible
      updateReelCommentCount(reelId, 1);
    } else {
      throw new Error('Failed to post comment');
    }
  } catch (error) {
    console.error('Comment error:', error);
    showToast(error.message || 'Failed to post comment', 'error');
  } finally {
    // Re-enable input
    input.disabled = false;
    button.textContent = originalText;
    button.disabled = false;
    input.focus();
  }
}

// Share reel to friends
function shareReelToFriends(reelId) {
  // Prevent body scrolling
  document.body.classList.add('modal-open');
  
  // Create share modal
  const modal = document.createElement('div');
  modal.className = 'modal share-reel-modal';
  modal.innerHTML = `
    <div class="modal-backdrop" onclick="closeShareModal()"></div>
    <div class="modal-dialog" style="max-width: 400px;">
      <div class="modal-header">
        <h3>Share Reel</h3>
        <button onclick="closeShareModal()" class="close-btn">×</button>
      </div>
      <div class="modal-body" style="padding: 1rem;">
        <div id="friendsList" style="max-height: 300px; overflow-y: auto;">
          <div style="text-align: center; color: #666; padding: 2rem;">
            <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">📤</div>
            <div>Loading friends...</div>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  
  loadFriendsForShare(reelId);
}

// Close share modal
function closeShareModal() {
  document.body.classList.remove('modal-open');
  const modal = document.querySelector('.share-reel-modal');
  if (modal) {
    modal.remove();
  }
}

// Load friends for sharing
async function loadFriendsForShare(reelId) {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      showToast('Please log in to share reels', 'error');
      return;
    }
    
    const query = `
      query GetFollowing($userId: uuid!) {
        follows(where: {follower_id: {_eq: $userId}, approved: {_eq: true}}) {
          followee_id
          followee {
            id
            displayName
            avatarUrl
          }
        }
      }
    `;
    
    const { data } = await makeGraphQLRequest(query, { userId: currentUser.id });
    const following = data?.follows || [];
    
    const friendsList = document.getElementById('friendsList');
    if (!friendsList) return;
    
    if (following.length === 0) {
      friendsList.innerHTML = `
        <div style="text-align: center; color: #666; padding: 2rem;">
          <div style="font-size: 2rem; margin-bottom: 1rem;">👥</div>
          <div>No friends to share with</div>
          <div style="font-size: 0.9rem; margin-top: 0.5rem; color: #888;">Follow some users to share reels with them</div>
        </div>
      `;
      return;
    }
    
    friendsList.innerHTML = following.map(follow => {
      const user = follow.followee;
      const initial = user?.displayName?.charAt(0).toUpperCase() || 'U';
      
      return `
        <div onclick="shareReelToUser('${reelId}', '${follow.followee_id}', '${user?.displayName}')" style="display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem; cursor: pointer; border-radius: 8px; transition: all 0.2s; margin: 4px 0;" onmouseover="this.style.background='rgba(255,255,255,0.1); this.style.transform='translateX(4px)'" onmouseout="this.style.background='transparent'; this.style.transform='translateX(0)'">
          <div style="width: 40px; height: 40px; border-radius: 50%; background: ${user?.avatarUrl ? `url('${user.avatarUrl}') center/cover` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; flex-shrink: 0;">
            ${user?.avatarUrl ? '' : initial}
          </div>
          <div style="flex: 1; color: #fff; min-width: 0;">
            <div style="font-weight: 600;">@${user?.displayName || 'user'}</div>
          </div>
          <div style="color: #0095f6; font-size: 0.9rem; font-weight: 600;">Send</div>
        </div>
      `;
    }).join('');
  } catch (error) {
    console.error('Load friends error:', error);
    const friendsList = document.getElementById('friendsList');
    if (friendsList) {
      friendsList.innerHTML = '<div style="text-align: center; color: #ff6b6b; padding: 2rem;">Failed to load friends. Please try again.</div>';
    }
  }
}

// Share reel to specific user
async function shareReelToUser(reelId, userId, username) {
  try {
    const mutation = `
      mutation ShareReel($senderId: uuid!, $receiverId: uuid!, $reelId: uuid!) {
        insert_shared_posts_one(object: {
          post_id: $reelId
          sender_id: $senderId
          receiver_id: $receiverId
          caption: "Check out this reel! 🎬"
        }) {
          id
        }
        insert_messages_one(object: {
          sender_id: $senderId
          receiver_id: $receiverId
          content: "Shared a reel with you 🎬"
          message_type: "shared_reel"
          shared_content_id: $reelId
        }) {
          id
        }
      }
    `;
    
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('Please log in to share reels');
    }
    
    const { data, error } = await makeGraphQLRequest(mutation, {
      senderId: currentUser.id,
      receiverId: userId,
      reelId
    });
    
    if (error) {
      throw new Error(error.message || 'Failed to share reel');
    }
    
    showToast(`Reel shared with @${username}!`, 'success');
    closeShareModal();
    
    // Update share count if visible
    updateReelShareCount(reelId, 1);
  } catch (error) {
    console.error('Share error:', error);
    showToast(error.message || 'Failed to share reel', 'error');
  }
}

// Utility functions
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function getTimeAgo(dateString) {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

function showToast(message, type = 'info') {
  // Remove existing toast
  const existingToast = document.querySelector('.toast');
  if (existingToast) {
    existingToast.remove();
  }
  
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    border-radius: 8px;
    color: white;
    font-weight: 500;
    z-index: 10000;
    animation: slideIn 0.3s ease;
    max-width: 300px;
    word-wrap: break-word;
  `;
  
  const colors = {
    success: '#4CAF50',
    error: '#f44336',
    warning: '#ff9800',
    info: '#2196F3'
  };
  
  toast.style.background = colors[type] || colors.info;
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  // Auto remove after 3 seconds
  setTimeout(() => {
    if (toast.parentNode) {
      toast.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }
  }, 3000);
}

// Update reel comment count
function updateReelCommentCount(reelId, increment) {
  const commentBtn = document.querySelector(`[data-reel-id="${reelId}"] .comment-count`);
  if (commentBtn) {
    const currentCount = parseInt(commentBtn.textContent) || 0;
    commentBtn.textContent = Math.max(0, currentCount + increment);
  }
}

// Update reel share count
function updateReelShareCount(reelId, increment) {
  const shareBtn = document.querySelector(`[data-reel-id="${reelId}"] .share-count`);
  if (shareBtn) {
    const currentCount = parseInt(shareBtn.textContent) || 0;
    shareBtn.textContent = Math.max(0, currentCount + increment);
  }
}

// Helper function to get current user (should be implemented based on your auth system)
function getCurrentUser() {
  // This should return the current user object
  // Implementation depends on your authentication system
  return window.currentUser || window.nhost?.auth?.getUser();
}

// Helper function to make GraphQL requests (should be implemented based on your setup)
async function makeGraphQLRequest(query, variables = {}) {
  // This should make a GraphQL request to your backend
  // Implementation depends on your GraphQL setup
  if (window.nhost?.graphql?.request) {
    return await window.nhost.graphql.request(query, variables);
  }
  
  // Fallback implementation
  throw new Error('GraphQL client not available');
}

// Add CSS animations
if (!document.getElementById('reels-animations')) {
  const style = document.createElement('style');
  style.id = 'reels-animations';
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
    
    @keyframes likeAnimation {
      0% { transform: scale(1); }
      50% { transform: scale(1.3); }
      100% { transform: scale(1); }
    }
    
    .shared-reel {
      border-left: 3px solid #0095f6;
    }
    
    .reel-action:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    
    .toast {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      backdrop-filter: blur(10px);
    }
    
    .modal {
      backdrop-filter: blur(5px);
    }
    
    .modal-dialog {
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    }
    
    .comment-item:hover {
      background: rgba(255, 255, 255, 0.05) !important;
    }
    
    body.modal-open {
      overflow: hidden;
    }
  `;
  document.head.appendChild(style);
}

// Export functions for global use
window.initReelViewer = initReelViewer;
window.toggleReelLike = toggleReelLike;
window.openReelComments = openReelComments;
window.shareReelToFriends = shareReelToFriends;
window.toggleMute = toggleMute;
window.togglePlayPause = togglePlayPause;