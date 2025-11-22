// Time formatting utilities
export const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  
  if (diff < 60000) return 'now';
  if (diff < 3600000) return Math.floor(diff / 60000) + 'm';
  if (diff < 86400000) return Math.floor(diff / 3600000) + 'h';
  return Math.floor(diff / 86400000) + 'd';
};

export const formatDate = (timestamp) => {
  const date = new Date(timestamp);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffTime = today - messageDate;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return date.toLocaleDateString('en-US', { weekday: 'long' });
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// Animation utilities
export const playNotificationSound = () => {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
  } catch (error) {
    console.log('Could not play notification sound:', error);
  }
};

// File handling utilities
export const handleFileUpload = (file) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No file provided'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(file);
  });
};

export const isVideoFile = (url) => {
  if (!url) return false;
  return url.includes('video') || url.startsWith('data:video');
};

// Local storage utilities
export const getFromStorage = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return defaultValue;
  }
};

export const setToStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Error writing to localStorage:', error);
  }
};

export const removeFromStorage = (key) => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error removing from localStorage:', error);
  }
};

// Recent searches utilities
export const addToRecentSearches = (userId, username) => {
  let recentSearches = getFromStorage('recentSearches', []);
  
  // Remove if already exists
  recentSearches = recentSearches.filter(search => search.userId !== userId);
  
  // Add to beginning
  recentSearches.unshift({ userId, username, timestamp: Date.now() });
  
  // Keep only last 10
  recentSearches = recentSearches.slice(0, 10);
  
  setToStorage('recentSearches', recentSearches);
};

export const removeFromRecentSearches = (userId) => {
  let recentSearches = getFromStorage('recentSearches', []);
  recentSearches = recentSearches.filter(search => search.userId !== userId);
  setToStorage('recentSearches', recentSearches);
};

export const getRecentSearches = () => {
  return getFromStorage('recentSearches', []);
};

// Chat themes utilities
export const chatThemes = [
  { name: 'Default', background: 'var(--bg-dark)' },
  { name: 'Ocean Waves', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { name: 'Sunset', background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { name: 'Forest', background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
  { name: 'Purple Dream', background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' },
  { name: 'Fire', background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)' },
  { name: 'Night Sky', background: 'linear-gradient(135deg, #0c3483 0%, #a2b6df 100%)' },
  { name: 'Cherry Blossom', background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)' },
  { name: 'Mint', background: 'linear-gradient(135deg, #a8e6cf 0%, #dcedc1 100%)' },
  { name: 'Galaxy', background: 'linear-gradient(135deg, #2c3e50 0%, #4a6741 100%)' },
  { name: 'Rose Gold', background: 'linear-gradient(135deg, #f7971e 0%, #ffd200 100%)' },
  { name: 'Arctic', background: 'linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)' },
  { name: 'Lavender', background: 'linear-gradient(135deg, #e17055 0%, #f39c12 100%)' },
  { name: 'Emerald', background: 'linear-gradient(135deg, #00b894 0%, #00cec9 100%)' },
  { name: 'Coral', background: 'linear-gradient(135deg, #fd79a8 0%, #fdcb6e 100%)' },
  { name: 'Midnight', background: 'linear-gradient(135deg, #2d3436 0%, #636e72 100%)' },
  { name: 'Peachy', background: 'linear-gradient(135deg, #fab1a0 0%, #e17055 100%)' },
  { name: 'Sky Blue', background: 'linear-gradient(135deg, #74b9ff 0%, #a29bfe 100%)' },
  { name: 'Golden Hour', background: 'linear-gradient(135deg, #fdcb6e 0%, #e84393 100%)' },
  { name: 'Deep Sea', background: 'linear-gradient(135deg, #00cec9 0%, #55a3ff 100%)' },
  { name: 'Autumn', background: 'linear-gradient(135deg, #fd79a8 0%, #ff7675 100%)' },
  { name: 'Spring', background: 'linear-gradient(135deg, #a29bfe 0%, #6c5ce7 100%)' },
  { name: 'Tropical', background: 'linear-gradient(135deg, #00b894 0%, #55efc4 100%)' },
  { name: 'Cosmic', background: 'linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%)' },
  { name: 'Warm Sunset', background: 'linear-gradient(135deg, #ff7675 0%, #fd79a8 100%)' }
];

export const applyChatTheme = (themeName, themeBackground) => {
  setToStorage('chatTheme', themeName);
  setToStorage('chatThemeBackground', themeBackground);
  
  const messagesContainer = document.getElementById('messages');
  if (messagesContainer) {
    messagesContainer.style.background = themeBackground;
  }
};

export const loadChatTheme = () => {
  const savedTheme = getFromStorage('chatThemeBackground');
  if (savedTheme) {
    const messagesContainer = document.getElementById('messages');
    if (messagesContainer) {
      messagesContainer.style.background = savedTheme;
    }
  }
};

// Download utilities
export const downloadUserData = async (userData) => {
  try {
    const dataStr = JSON.stringify(userData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `genzes-chat-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading data:', error);
    throw error;
  }
};

export const downloadContent = async (contentUrl, filename) => {
  try {
    const link = document.createElement('a');
    link.href = contentUrl;
    link.download = filename;
    link.target = '_blank';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Error downloading content:', error);
    throw error;
  }
};

// URL utilities
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};

export const shareToWhatsApp = (text, url) => {
  const message = encodeURIComponent(`${text} ${url}`);
  const whatsappUrl = `https://wa.me/?text=${message}`;
  window.open(whatsappUrl, '_blank');
};

// Validation utilities
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateUsername = (username) => {
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
};

export const validatePassword = (password) => {
  return password && password.length >= 6;
};

// UI utilities
export const showToast = (message, type = 'success', duration = 3000) => {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#ff4757' : '#0095f6'};
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    z-index: 10000;
    font-weight: 600;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  `;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  }, duration);
};

export const showModal = (content, options = {}) => {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-backdrop" onclick="this.parentElement.remove()"></div>
    <div class="modal-dialog" style="max-width: ${options.maxWidth || '500px'}">
      <div class="modal-header">
        <h3>${options.title || 'Modal'}</h3>
        <button onclick="this.closest('.modal').remove()" class="close-btn">×</button>
      </div>
      <div class="modal-body">
        ${content}
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  return modal;
};

// Menu utilities
export const closeAllMenus = () => {
  document.querySelectorAll('.post-menu').forEach(menu => {
    menu.classList.remove('show');
  });
};

export const toggleMenu = (menuId) => {
  closeAllMenus();
  const menu = document.getElementById(menuId);
  if (menu) {
    menu.classList.toggle('show');
  }
};

// Image utilities
export const createImagePreview = (file, container) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    if (file.type.startsWith('image/')) {
      container.innerHTML = `<img src="${e.target.result}" style="max-width: 100%; max-height: 200px; border-radius: 8px;" />`;
    } else if (file.type.startsWith('video/')) {
      container.innerHTML = `<video src="${e.target.result}" controls style="max-width: 100%; max-height: 200px; border-radius: 8px;" />`;
    }
  };
  reader.readAsDataURL(file);
};

// Keyboard utilities
export const handleKeyboardNavigation = (event, callbacks) => {
  switch (event.key) {
    case 'ArrowUp':
      event.preventDefault();
      callbacks.up && callbacks.up();
      break;
    case 'ArrowDown':
      event.preventDefault();
      callbacks.down && callbacks.down();
      break;
    case ' ':
      event.preventDefault();
      callbacks.space && callbacks.space();
      break;
    case 'Escape':
      event.preventDefault();
      callbacks.escape && callbacks.escape();
      break;
    default:
      break;
  }
};

// Debounce utility
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Throttle utility
export const throttle = (func, limit) => {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};