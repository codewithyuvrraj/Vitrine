// Instagram-like Reels Viewer
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
  document.querySelectorAll('video').forEach(video => {
    video.pause();
    video.currentTime = 0;
  });
  
  // Play current video
  const currentVideo = document.getElementById(`reelVideo${currentReelIndex}`);
  if (currentVideo) {
    currentVideo.muted = false;
    currentVideo.loop = true;
    currentVideo.play().catch(() => {
      console.log('Autoplay blocked, trying muted');
      currentVideo.muted = true;
      currentVideo.play();
    });
  }
}

// Toggle play/pause
function togglePlayPause(video) {
  if (video.paused) {
    video.play().catch(() => {
      video.muted = true;
      video.play();
    });
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
  }
}

// Toggle reel like
async function toggleReelLike(reelId, button) {
  if (!window.currentUser) return;
  
  try {
    const { data: existingLike } = await window.sb.from('reels_likes')
      .select('id')
      .eq('reel_id', reelId)
      .eq('user_id', window.currentUser.id)
      .single();
    
    const likeCount = button.querySelector('div');
    const heartIcon = button.querySelector('svg path');
    
    if (existingLike) {
      await window.sb.from('reels_likes').delete().eq('id', existingLike.id);
      heartIcon.setAttribute('fill', 'none');
      button.style.color = 'white';
      likeCount.textContent = Math.max(0, parseInt(likeCount.textContent) - 1);
    } else {
      await window.sb.from('reels_likes').insert({ reel_id: reelId, user_id: window.currentUser.id });
      heartIcon.setAttribute('fill', 'currentColor');
      button.style.color = '#ff3040';
      likeCount.textContent = parseInt(likeCount.textContent) + 1;
    }
  } catch (error) {
    console.error('Like error:', error);
  }
}

// Open reel comments
function openReelComments(reelId) {
  // Prevent body scrolling
  document.body.classList.add('modal-open');
  
  // Create comments modal
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-backdrop" onclick="closeReelComments()"></div>
    <div class="modal-dialog" style="max-width: 500px; max-height: 80vh;">
      <div class="modal-header">
        <h3>Comments</h3>
        <button onclick="closeReelComments()" class="close-btn">×</button>
      </div>
      <div class="modal-form">
        <div id="reelCommentsList" style="max-height: 400px; overflow-y: auto; padding: 1rem;">
          <div style="text-align: center; color: #666;">Loading comments...</div>
        </div>
        <div style="display: flex; gap: 0.5rem; padding: 1rem; border-top: 1px solid #333;">
          <input id="reelCommentInput" type="text" placeholder="Add a comment..." style="flex: 1; padding: 0.5rem; border: 1px solid #333; border-radius: 20px; background: #000; color: #fff;" onkeypress="handleReelCommentKeyPress(event, '${reelId}')">
          <button onclick="addReelComment('${reelId}')" style="background: #0095f6; color: white; border: none; padding: 0.5rem 1rem; border-radius: 20px; cursor: pointer;">Post</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  
  loadReelComments(reelId);
}

// Close reel comments modal
function closeReelComments() {
  document.body.classList.remove('modal-open');
  const modal = document.querySelector('.modal');
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
    // Use nhost GraphQL instead of supabase
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
    
    const { data } = await window.nhost.graphql.request(query, { reelId });
    const comments = data?.reels_comments || [];
    
    const commentsList = document.getElementById('reelCommentsList');
    if (!commentsList) return;
    
    if (comments.length === 0) {
      commentsList.innerHTML = '<div style="text-align: center; color: #666; padding: 2rem;">No comments yet. Be the first to comment!</div>';
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
      commentsList.innerHTML = '<div style="text-align: center; color: #ff6b6b; padding: 2rem;">Failed to load comments. Please try again.</div>';
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
  
  if (!window.nhost?.auth?.getUser()) {
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
        }
      }
    `;
    
    const { data, error } = await window.nhost.graphql.request(mutation, {
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
  // Create share modal
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-backdrop" onclick="this.parentElement.remove()"></div>
    <div class="modal-dialog" style="max-width: 400px;">
      <div class="modal-header">
        <h3>Share Reel</h3>
        <button onclick="this.closest('.modal').remove()" class="close-btn">×</button>
      </div>
      <div class="modal-form" style="padding: 1rem;">
        <div id="friendsList" style="max-height: 300px; overflow-y: auto;">
          <div style="text-align: center; color: #666;">Loading friends...</div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  
  loadFriendsForShare(reelId);
}

// Load friends for sharing
async function loadFriendsForShare(reelId) {
  try {
    const { data: following } = await window.sb.from('follows')
      .select('followee_id, profiles!follows_followee_id_fkey(username, avatar_url)')
      .eq('follower_id', window.currentUser.id)
      .eq('approved', true);
    
    const friendsList = document.getElementById('friendsList');
    if (!friendsList) return;
    
    if (!following || following.length === 0) {
      friendsList.innerHTML = '<div style="text-align: center; color: #666; padding: 2rem;">No friends to share with</div>';
      return;
    }
    
    friendsList.innerHTML = following.map(follow => {
      const user = follow.profiles;
      const initial = user?.username?.charAt(0).toUpperCase() || 'U';
      
      return `
        <div onclick="shareReelToUser('${reelId}', '${follow.followee_id}', '${user?.username}')" style="display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem; cursor: pointer; border-radius: 8px; transition: background 0.2s;" onmouseover="this.style.background='#333'" onmouseout="this.style.background='transparent'">
          <div style="width: 40px; height: 40px; border-radius: 50%; background: ${user?.avatar_url ? `url('${user.avatar_url}') center/cover` : '#333'}; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">
            ${user?.avatar_url ? '' : initial}
          </div>
          <div style="flex: 1; color: #fff;">@${user?.username || 'user'}</div>
          <div style="color: #0095f6; font-size: 0.9rem;">Send</div>
        </div>
      `;
    }).join('');
  } catch (error) {
    console.error('Load friends error:', error);
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
    
    const currentUser = window.nhost?.auth?.getUser();
    if (!currentUser) {
      throw new Error('Please log in to share reels');
    }
    
    const { data, error } = await window.nhost.graphql.request(mutation, {
      senderId: currentUser.id,
      receiverId: userId,
      reelId
    });
    
    if (error) {
      throw new Error(error.message || 'Failed to share reel');
    }
    
    showToast(`Reel shared with @${username}!`, 'success');
    document.querySelector('.modal:last-child')?.remove();
    
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

// Load shared reels
async function loadSharedReels() {
  try {
    const currentUser = window.nhost?.auth?.getUser();
    if (!currentUser) return [];
    
    const query = `
      query GetSharedReels($userId: uuid!) {
        shared_posts(where: {receiver_id: {_eq: $userId}}, order_by: {created_at: desc}) {
          id
          caption
          created_at
          sender {
            id
            displayName
            avatarUrl
          }
          post {
            id
            video_url
            thumbnail_url
            caption
            duration
            music_name
            music_artist
            views_count
            likes_count
            comments_count
            shares_count
            user {
              id
              displayName
              avatarUrl
            }
          }
        }
      }
    `;
    
    const { data } = await window.nhost.graphql.request(query, { userId: currentUser.id });
    return data?.shared_posts || [];
  } catch (error) {
    console.error('Load shared reels error:', error);
    return [];
  }
}

// Display shared reel
function displaySharedReel(sharedReel) {
  const reel = sharedReel.post;
  const sender = sharedReel.sender;
  
  return `
    <div class="reel-item shared-reel" data-reel-id="${reel.id}">
      <div class="reel-header">
        <div class="shared-info" style="background: rgba(0, 149, 246, 0.1); padding: 8px 12px; border-radius: 8px; margin-bottom: 8px; border-left: 3px solid #0095f6;">
          <span style="color: #0095f6; font-size: 0.9rem;">📤 Shared by @${sender.displayName}</span>
          <span style="color: #8e8e8e; font-size: 0.8rem; margin-left: 8px;">${getTimeAgo(sharedReel.created_at)}</span>
        </div>
        <div class="reel-user-info">
          <div class="reel-avatar">
            ${reel.user?.avatarUrl ? 
              `<img src="${reel.user.avatarUrl}" alt="${reel.user.displayName}" />` : 
              `<span>${reel.user?.displayName?.charAt(0).toUpperCase() || 'U'}</span>`
            }
          </div>
          <div class="reel-username">@${reel.user?.displayName || 'user'}</div>
        </div>
      </div>
      
      <div class="reel-video-container">
        <video 
          id="reelVideo${reel.id}" 
          src="${reel.video_url}" 
          poster="${reel.thumbnail_url || ''}" 
          loop 
          muted
          onclick="togglePlayPause(this)"
          style="width: 100%; height: auto; max-height: 600px; object-fit: contain;"
        ></video>
        
        <div class="reel-sidebar">
          <button class="reel-action" onclick="toggleReelLike('${reel.id}', this)" title="Like">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            <span class="like-count">${reel.likes_count || 0}</span>
          </button>
          
          <button class="reel-action" onclick="openReelComments('${reel.id}')" title="Comment">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <span class="comment-count">${reel.comments_count || 0}</span>
          </button>
          
          <button class="reel-action" onclick="shareReelToFriends('${reel.id}')" title="Share">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
              <polyline points="16,6 12,2 8,6"/>
              <line x1="12" y1="2" x2="12" y2="15"/>
            </svg>
            <span class="share-count">${reel.shares_count || 0}</span>
          </button>
          
          <button class="reel-action" onclick="toggleMute('reelVideo${reel.id}')" title="Mute/Unmute">
            <span id="muteBtn${reel.id}">🔇</span>
          </button>
        </div>
      </div>
      
      <div class="reel-info">
        ${reel.caption ? `<div class="reel-caption">${escapeHtml(reel.caption)}</div>` : ''}
        ${reel.music_name ? `<div class="reel-music">🎵 ${escapeHtml(reel.music_name)} - ${escapeHtml(reel.music_artist || 'Unknown Artist')}</div>` : ''}
        ${sharedReel.caption ? `<div class="shared-caption" style="margin-top: 8px; padding: 8px; background: rgba(255,255,255,0.05); border-radius: 6px; font-style: italic;">${escapeHtml(sharedReel.caption)}</div>` : ''}
      </div>
    </div>
  `;
}

// Close share modal
function closeShareModal() {
  document.body.classList.remove('modal-open');
  const modal = document.querySelector('.modal');
  if (modal) {
    modal.remove();
  }
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
  `;
  document.head.appendChild(style);
}