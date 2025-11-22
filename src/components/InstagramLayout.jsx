import React, { useState, useEffect, useCallback } from 'react'
import { nhost } from '../lib/nhost'
import { uploadToCloudinary } from '../lib/cloudinary'
import ChangeEmail from './ChangeEmail'
import CommentModal from './CommentModal'
import MusicSelector from './MusicSelector'
import UploadModal from './UploadModal'
import { handleUploadSubmit } from './UploadHandler'

// Clear localStorage to prevent quota errors and add CSS
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  localStorage.removeItem('instagram_posts')
  
  // Add progress animation CSS
  const style = document.createElement('style')
  style.textContent = `
    @keyframes progress {
      0% { transform: translateX(-100%); }
      50% { transform: translateX(0%); }
      100% { transform: translateX(100%); }
    }
    @keyframes pulse {
      0% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.8; transform: scale(1.02); }
      100% { opacity: 1; transform: scale(1); }
    }
    
    /* Instagram-like responsive images */
    @media (max-width: 768px) {
      .post-image, .post-video {
        max-height: 50vh !important;
      }
    }
    
    @media (max-width: 480px) {
      .post-image, .post-video {
        max-height: 40vh !important;
      }
    }
    
    /* Custom scrollbar for share modal */
    .share-modal-scroll::-webkit-scrollbar {
      width: 6px;
    }
    
    .share-modal-scroll::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 3px;
    }
    
    .share-modal-scroll::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.3);
      border-radius: 3px;
    }
    
    .share-modal-scroll::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 255, 255, 0.5);
    }
    
    /* Textarea scrollbar */
    textarea.share-modal-scroll::-webkit-scrollbar {
      width: 4px;
    }
    
    textarea.share-modal-scroll::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.05);
    }
    
    textarea.share-modal-scroll::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.2);
      border-radius: 2px;
    }
    
    /* Emoji button hover effects */
    .emoji-btn:hover {
      background: rgba(255, 215, 0, 0.2) !important;
      transform: scale(1.1) !important;
    }
    
    /* Reel menu button hover effects */
    .reel-menu-btn:hover {
      background: rgba(255,255,255,0.1) !important;
    }
  `
  document.head.appendChild(style)
}

const InstagramLayout = () => {
  const [activeTab, setActiveTab] = useState('home')
  const [searchQuery, setSearchQuery] = useState('')
  const [users, setUsers] = useState([])
  const [posts, setPosts] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadType, setUploadType] = useState('post')
  const [uploadData, setUploadData] = useState({ caption: '', file: null, preview: '' })
  const [likedPosts, setLikedPosts] = useState(new Set())
  const [dislikedPosts, setDislikedPosts] = useState(new Set())
  const [postLikes, setPostLikes] = useState({})
  const [postDislikes, setPostDislikes] = useState({})
  const [postComments, setPostComments] = useState({})
  const [commentDetails, setCommentDetails] = useState({})
  const [stories, setStories] = useState([])
  const [followers, setFollowers] = useState({})
  const [following, setFollowing] = useState(new Set())
  const [followersData, setFollowersData] = useState({})
  const [followingData, setFollowingData] = useState({})
  const [showCommentModal, setShowCommentModal] = useState(null)
  const [newComment, setNewComment] = useState('')
  const [uploadProgress, setUploadProgress] = useState({ isUploading: false, message: '', startTime: null })
  const [uploadingSongs, setUploadingSongs] = useState(false)
  const [showDropdown, setShowDropdown] = useState(null)
  const [onlineUsers, setOnlineUsers] = useState(new Set())
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [showFullSettings, setShowFullSettings] = useState(false)
  const [currentTheme, setCurrentTheme] = useState('dark')
  const [showThemes, setShowThemes] = useState(false)
  const [showEditProfile, setShowEditProfile] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [showHelpCentre, setShowHelpCentre] = useState(false)
  const [showAboutUs, setShowAboutUs] = useState(false)
  const [hideChatFromSettings, setHideChatFromSettings] = useState(false)
  const [chatPassword, setChatPassword] = useState('')
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')
  const [passwordAction, setPasswordAction] = useState('')
  
  // Theme configurations
  const themes = {
    dark: { bg: 'linear-gradient(135deg, #000000, #1a1a1a, #333333)', accent: '#FFD700', secondary: '#D4AF37', name: 'Dark Gold' },
    blue: { bg: 'linear-gradient(135deg, #001122, #003366, #004488)', accent: '#00BFFF', secondary: '#4A90E2', name: 'Blue Ocean' },
    purple: { bg: 'linear-gradient(135deg, #1a0033, #330066, #4d0099)', accent: '#9966FF', secondary: '#9B59B6', name: 'Purple Night' },
    green: { bg: 'linear-gradient(135deg, #001100, #003300, #006600)', accent: '#00FF66', secondary: '#27AE60', name: 'Green Forest' },
    red: { bg: 'linear-gradient(135deg, #330000, #660000, #990000)', accent: '#FF3366', secondary: '#E74C3C', name: 'Red Sunset' },
    orange: { bg: 'linear-gradient(135deg, #331100, #663300, #996600)', accent: '#FF9900', secondary: '#F39C12', name: 'Orange Fire' },
    pink: { bg: 'linear-gradient(135deg, #330022, #660044, #990066)', accent: '#FF66CC', secondary: '#E91E63', name: 'Pink Rose' },
    cyan: { bg: 'linear-gradient(135deg, #003333, #006666, #009999)', accent: '#00FFFF', secondary: '#1ABC9C', name: 'Cyan Ice' },
    violet: { bg: 'linear-gradient(135deg, #2d1b69, #4a148c, #6a1b9a)', accent: '#E1BEE7', secondary: '#BA68C8', name: 'Violet Dream' },
    emerald: { bg: 'linear-gradient(135deg, #004d40, #00695c, #00796b)', accent: '#4DB6AC', secondary: '#26A69A', name: 'Emerald Sea' },
    neon: { bg: 'linear-gradient(135deg, #0f0f23, #1a1a3a, #2d2d5f)', accent: '#00ff41', secondary: '#39ff14', name: 'Neon Green' },
    indigo: { bg: 'linear-gradient(135deg, #1a237e, #283593, #3949ab)', accent: '#9FA8DA', secondary: '#7986CB', name: 'Indigo Night' },
    teal: { bg: 'linear-gradient(135deg, #004d40, #00695c, #00838f)', accent: '#4DD0E1', secondary: '#26C6DA', name: 'Teal Wave' },
    lime: { bg: 'linear-gradient(135deg, #33691e, #558b2f, #689f38)', accent: '#C0CA33', secondary: '#9CCC65', name: 'Lime Fresh' },
    brown: { bg: 'linear-gradient(135deg, #3e2723, #5d4037, #795548)', accent: '#BCAAA4', secondary: '#A1887F', name: 'Brown Earth' },
    grey: { bg: 'linear-gradient(135deg, #263238, #37474f, #455a64)', accent: '#90A4AE', secondary: '#78909C', name: 'Grey Steel' },
    deepPurple: { bg: 'linear-gradient(135deg, #4a148c, #6a1b9a, #8e24aa)', accent: '#CE93D8', secondary: '#BA68C8', name: 'Deep Purple' },
    lightBlue: { bg: 'linear-gradient(135deg, #01579b, #0277bd, #0288d1)', accent: '#81D4FA', secondary: '#4FC3F7', name: 'Light Blue' },
    lightGreen: { bg: 'linear-gradient(135deg, #1b5e20, #2e7d32, #388e3c)', accent: '#A5D6A7', secondary: '#81C784', name: 'Light Green' },
    deepOrange: { bg: 'linear-gradient(135deg, #bf360c, #d84315, #f4511e)', accent: '#FFAB91', secondary: '#FF8A65', name: 'Deep Orange' },
    blueGrey: { bg: 'linear-gradient(135deg, #263238, #37474f, #546e7a)', accent: '#B0BEC5', secondary: '#90A4AE', name: 'Blue Grey' },
    crimson: { bg: 'linear-gradient(135deg, #880e4f, #ad1457, #c2185b)', accent: '#F8BBD9', secondary: '#F48FB1', name: 'Crimson Rose' },
    navy: { bg: 'linear-gradient(135deg, #0d47a1, #1565c0, #1976d2)', accent: '#90CAF9', secondary: '#64B5F6', name: 'Navy Blue' },
    forest: { bg: 'linear-gradient(135deg, #1b5e20, #2e7d32, #43a047)', accent: '#C8E6C9', secondary: '#A5D6A7', name: 'Forest Green' },
    sunset: { bg: 'linear-gradient(135deg, #e65100, #f57c00, #ff9800)', accent: '#FFE0B2', secondary: '#FFCC80', name: 'Sunset Orange' },
    midnight: { bg: 'linear-gradient(135deg, #000051, #1a237e, #303f9f)', accent: '#C5CAE9', secondary: '#9FA8DA', name: 'Midnight Blue' },
    aesthetic: { bg: 'linear-gradient(135deg, #ffeef8, #f8e8ff, #e8f0ff)', accent: '#ff69b4', secondary: '#da70d6', name: 'Aesthetic Pink' }
  }
  
  const currentThemeConfig = themes[currentTheme] || themes.dark
  
  // Apply theme to CSS variables for site-wide changes
  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--theme-bg', currentThemeConfig.bg)
    root.style.setProperty('--theme-accent', currentThemeConfig.accent)
    root.style.setProperty('--theme-secondary', currentThemeConfig.secondary)
    root.style.setProperty('--theme-text', '#ffffff')
    root.style.setProperty('--theme-text-secondary', 'rgba(255, 255, 255, 0.8)')
    root.style.setProperty('--theme-border', `${currentThemeConfig.secondary}40`)
    
    // Update body background
    document.body.style.background = currentThemeConfig.bg
    
    // Save theme to localStorage
    localStorage.setItem('selectedTheme', currentTheme)
  }, [currentTheme, currentThemeConfig])
  
  // Load saved theme and chat settings from database when user loads
  useEffect(() => {
    const loadUserSettings = async () => {
      if (currentUser?.id) {
        try {
          const response = await fetch(`https://ofafvhtbuhvvkhuprotc.graphql.ap-southeast-1.nhost.run/v1`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-hasura-admin-secret': '2=o_TVK82F6FKyi8xcbfE9lAm,r,jpq@'
            },
            body: JSON.stringify({
              query: `query GetUserSettings($userId: uuid!) {
                profiles(where: {auth_id: {_eq: $userId}}) {
                  theme
                  hide_chat
                  chat_password
                }
              }`,
              variables: { userId: currentUser.id }
            })
          })
          
          const result = await response.json()
          const userProfile = result.data?.profiles?.[0]
          
          if (userProfile?.theme && themes[userProfile.theme]) {
            setCurrentTheme(userProfile.theme)
          }
          
          if (userProfile?.hide_chat !== undefined) {
            setHideChatFromSettings(userProfile.hide_chat)
          }
          
          if (userProfile?.chat_password) {
            setChatPassword(userProfile.chat_password)
          }
        } catch (error) {
          console.log('Failed to load user settings:', error)
          // Fallback to localStorage
          const savedTheme = localStorage.getItem('selectedTheme')
          if (savedTheme && themes[savedTheme]) {
            setCurrentTheme(savedTheme)
          }
          const savedHideChat = localStorage.getItem('hideChatFromSettings')
          if (savedHideChat !== null) {
            setHideChatFromSettings(savedHideChat === 'true')
          }
        }
      }
    }
    
    loadUserSettings()
  }, [currentUser?.id])
  const [editProfile, setEditProfile] = useState({ displayName: '', avatarUrl: '', bio: '', website: '', file: null, preview: '' })
  const [showStoryModal, setShowStoryModal] = useState(null)
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0)
  const [userStories, setUserStories] = useState([])
  const [storyProgress, setStoryProgress] = useState(0)
  const [storyTimer, setStoryTimer] = useState(null)
  const [storyTextElements, setStoryTextElements] = useState([])
  const [selectedTextElement, setSelectedTextElement] = useState(null)
  const [isEditingText, setIsEditingText] = useState(false)
  const [textInput, setTextInput] = useState('')
  const [textColor, setTextColor] = useState('#FFFFFF')
  const [textSize, setTextSize] = useState(24)
  const [showTextControls, setShowTextControls] = useState(false)
  const [textStyle, setTextStyle] = useState('normal')
  const [textAlign, setTextAlign] = useState('center')
  const [textBackground, setTextBackground] = useState('transparent')
  const [showPhotoEffects, setShowPhotoEffects] = useState(false)
  const [photoFilter, setPhotoFilter] = useState('none')
  const [photoShape, setPhotoShape] = useState('rectangle')
  const [profileTab, setProfileTab] = useState('all')
  const [showPostModal, setShowPostModal] = useState(null)
  const [showProfileDropdown, setShowProfileDropdown] = useState(null)
  const [editingPost, setEditingPost] = useState(null)
  const [editCaption, setEditCaption] = useState('')
  const [viewingProfile, setViewingProfile] = useState(null)
  const [showComments, setShowComments] = useState(false)
  const [showChatModal, setShowChatModal] = useState(null)
  const [chatMessages, setChatMessages] = useState({})
  const [newMessage, setNewMessage] = useState('')
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [lastMessageCount, setLastMessageCount] = useState({})
  const [showMessageMenu, setShowMessageMenu] = useState(null)
  const [editingMessage, setEditingMessage] = useState(null)
  const [editMessageText, setEditMessageText] = useState('')
  const [isAtBottom, setIsAtBottom] = useState(true)
  const [newMessageAlert, setNewMessageAlert] = useState(false)
  const [currentReelIndex, setCurrentReelIndex] = useState(0)
  const [recentSearches, setRecentSearches] = useState([])
  const [multipleFiles, setMultipleFiles] = useState([])
  const [currentFileIndex, setCurrentFileIndex] = useState(0)
  const [showStoryEditMenu, setShowStoryEditMenu] = useState(null)
  const [currentPostImageIndex, setCurrentPostImageIndex] = useState({})
  const [showFollowersModal, setShowFollowersModal] = useState(null)
  const [followersSearchQuery, setFollowersSearchQuery] = useState('')
  const [viewedUsersFromFollowers, setViewedUsersFromFollowers] = useState(new Set())
  const [showProfilePicModal, setShowProfilePicModal] = useState(null)
  const [showProfilePicOptions, setShowProfilePicOptions] = useState(null)
  const [isReelPlaying, setIsReelPlaying] = useState(true)
  const [isReelMuted, setIsReelMuted] = useState(true)
  const [manuallyPausedReels, setManuallyPausedReels] = useState(new Set())
  const [isSponsoredUser, setIsSponsoredUser] = useState(false)
  const [selectedSponsorUser, setSelectedSponsorUser] = useState(null)
  const [showSponsorModal, setShowSponsorModal] = useState(false)
  const [selectedPostForSponsoring, setSelectedPostForSponsoring] = useState(null)
  const [reelTapCount, setReelTapCount] = useState(0)
  const [reelTapTimer, setReelTapTimer] = useState(null)
  const [showShareModal, setShowShareModal] = useState(false)
  const [selectedUsers, setSelectedUsers] = useState(new Set())
  const [shareMessage, setShareMessage] = useState('')
  const [shareSearchQuery, setShareSearchQuery] = useState('')
  const [windowSize, setWindowSize] = useState({ 
    width: typeof window !== 'undefined' ? window.innerWidth : 1920, 
    height: typeof window !== 'undefined' ? window.innerHeight : 1080 
  })
  const [sharedContentReactions, setSharedContentReactions] = useState({})
  const [showReactionBox, setShowReactionBox] = useState(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState(null)
  const [selectedEmoji, setSelectedEmoji] = useState('')
  const [showPlatformButtons, setShowPlatformButtons] = useState(false)
  const [savedPosts, setSavedPosts] = useState(new Set())
  const [showSavedModal, setShowSavedModal] = useState(false)
  const [showMusicModal, setShowMusicModal] = useState(false)
  const [uploadedMusic, setUploadedMusic] = useState([])
  const [selectedMusic, setSelectedMusic] = useState(null)
  const [musicSearchQuery, setMusicSearchQuery] = useState('')
  const [showMusicSelector, setShowMusicSelector] = useState(false)
  
  // Add window resize listener for responsive reels
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight })
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  // Auto-play first reel when reels tab is opened and cleanup when leaving
  useEffect(() => {
    if (activeTab === 'reels') {
      setCurrentReelIndex(0)
      setManuallyPausedReels(new Set())
      // Don't shuffle on every tab switch to prevent lag
    } else {
      // Stop all videos when leaving reels tab
      document.querySelectorAll('video').forEach(video => {
        video.pause()
        video.muted = true
        video.currentTime = 0
      })
    }
    
      // Clear followers modal and tracking variables when leaving profile tab
    if (activeTab !== 'profile') {
      setShowFollowersModal(null)
      setFollowersSearchQuery('')
      setViewedUsersFromFollowers(new Set())
      window.lastFollowersModalType = null
      window.tempViewedUser = null
    }
  }, [activeTab])

  // Handle double tap to refresh reels
  const handleReelTap = async (e) => {
    e.stopPropagation()
    
    const newCount = reelTapCount + 1
    setReelTapCount(newCount)
    
    if (reelTapTimer) {
      clearTimeout(reelTapTimer)
    }
    
    if (newCount === 2) {
      // Double tap detected - refresh reels
      setReelTapCount(0)
      try {
        await loadPosts()
        setPosts(prev => {
          const reels = prev.filter(p => p.type === 'reel').sort(() => Math.random() - 0.5)
          const nonReels = prev.filter(p => p.type !== 'reel')
          return [...reels, ...nonReels]
        })
        setCurrentReelIndex(0)
        
        // Show refresh indicator
        const indicator = document.createElement('div')
        indicator.textContent = '🔄 Refreshed!'
        indicator.style.cssText = `
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: rgba(0,0,0,0.8);
          color: #FFD700;
          padding: 1rem 2rem;
          border-radius: 25px;
          z-index: 9999;
          font-weight: bold;
        `
        document.body.appendChild(indicator)
        setTimeout(() => {
          if (document.body.contains(indicator)) {
            document.body.removeChild(indicator)
          }
        }, 1500)
      } catch (error) {
        console.error('Failed to refresh reels:', error)
      }
    } else {
      // Reset counter after delay
      const timer = setTimeout(() => {
        setReelTapCount(0)
      }, 400)
      setReelTapTimer(timer)
    }
  }

  useEffect(() => {
    const initializeApp = async () => {
      await loadCurrentUser()
      await loadUsers()
      await loadPosts()
      await generateRealTimeData()
    }
    initializeApp()
  }, [])
  
  // Load messages when currentUser is available and set up polling
  useEffect(() => {
    if (currentUser?.id) {
      loadMessages()
      
      // Poll for new messages every 5 seconds (reduced frequency)
      const messageInterval = setInterval(() => {
        if (navigator.onLine) {
          loadMessages()
        }
      }, 5000)
      
      const userInterval = setInterval(() => {
        if (navigator.onLine) {
          loadUsers()
        }
      }, 15000)
      
      return () => {
        clearInterval(messageInterval)
        clearInterval(userInterval)
      }
    }
  }, [currentUser?.id])
  
  // Load stories and followers when current user is available
  useEffect(() => {
    if (currentUser?.id) {
      console.log('📖 Current user loaded, loading data for:', currentUser.id)
      loadStories()
      loadRealFollowers()
      loadSavedPosts()
    }
  }, [currentUser?.id])
  
  // Load saved posts after posts are loaded
  useEffect(() => {
    if (currentUser?.id && posts.length > 0) {
      console.log('🔄 Posts loaded, reloading saved posts for:', currentUser.id)
      loadSavedPosts()
    }
  }, [posts.length, currentUser?.id])

  // Update online status when users array changes
  useEffect(() => {
    if (users.length > 0) {
      const activeUsers = new Set()
      users.forEach(user => {
        if (user?.id) {
          activeUsers.add(user.id)
        }
      })
      if (currentUser?.id) {
        activeUsers.add(currentUser.id)
      }
      console.log('🟢 Updating online users:', Array.from(activeUsers))
      setOnlineUsers(activeUsers)
    }
  }, [users, currentUser?.id])

  useEffect(() => {
    if (currentUser && showSettingsModal) {
      setEditProfile({
        username: currentUser.username || '',
        displayName: currentUser.displayName || '',
        avatarUrl: currentUser.avatarUrl || '',
        bio: currentUser.bio || '',
        website: currentUser.website || '',
        file: null,
        preview: currentUser.avatarUrl || ''
      })
    }
  }, [currentUser, showSettingsModal])

  // Optimized click outside handler
  const handleClickOutside = useCallback((e) => {
    const target = e.target
    if (!target.closest('.dropdown-container')) {
      setShowDropdown(null)
    }
    if (!target.closest('[data-emoji-picker]')) {
      setShowEmojiPicker(null)
    }
  }, [])

  useEffect(() => {
    document.addEventListener('click', handleClickOutside, { passive: true })
    return () => document.removeEventListener('click', handleClickOutside)
  }, [handleClickOutside])

  // Cleanup all videos when component unmounts
  useEffect(() => {
    return () => {
      // Stop all videos and reset their time when component unmounts
      document.querySelectorAll('video').forEach(video => {
        video.pause()
        video.currentTime = 0
      })
    }
  }, [])

  const generateRealTimeData = async () => {
    // Load real likes, followers and stories from database
    await loadRealLikes()
    
    // Only load followers if current user is available
    if (currentUser?.id) {
      await loadRealFollowers()
      await loadStories()
    }
    
    // Load comments only once at startup, not in real-time to prevent overwriting new comments
    if (Object.keys(commentDetails).length === 0) {
      await loadRealComments()
    }
    
    // Real-time user activity - show all users as online for demo
    const updateOnlineStatus = () => {
      const activeUsers = new Set()
      
      // Show all users as online
      users.forEach(user => {
        if (user?.id) {
          activeUsers.add(user.id)
        }
      })
      
      // Always show current user as online
      if (currentUser?.id) {
        activeUsers.add(currentUser.id)
      }
      
      console.log('🟢 Setting online users:', Array.from(activeUsers))
      setOnlineUsers(activeUsers)
    }
    
    updateOnlineStatus()
    const statusInterval = setInterval(updateOnlineStatus, 30000)
    return () => {
      clearInterval(statusInterval)
    }
  }

  const loadMessages = async () => {
    if (!currentUser?.id || loadingMessages) {
      return
    }
    
    setLoadingMessages(true)
    try {
      
      // Get current user's profile ID first
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
              auth_id
            }
          }`,
          variables: { authId: currentUser.id }
        })
      })
      
      const profileResult = await profileResponse.json()
      const currentProfileId = profileResult.data?.profiles?.[0]?.id
      
      if (!currentProfileId) {
        setLoadingMessages(false)
        return
      }
      
      const response = await fetch(`https://ofafvhtbuhvvkhuprotc.graphql.ap-southeast-1.nhost.run/v1`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-hasura-admin-secret': '2=o_TVK82F6FKyi8xcbfE9lAm,r,jpq@'
        },
        body: JSON.stringify({
          query: `query GetUserMessages($profileId: uuid!) {
            messages(where: {
              _or: [
                {sender_id: {_eq: $profileId}},
                {receiver_id: {_eq: $profileId}}
              ]
            }, order_by: {created_at: asc}) {
              id
              content
              sender_id
              receiver_id
              created_at
            }
            profiles {
              id
              auth_id
              display_name
              avatar_url
            }
          }`,
          variables: { profileId: currentProfileId }
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        
        if (result.errors) {
          console.log('❌ Message loading errors:', result.errors)
          setChatMessages({})
          setLoadingMessages(false)
          return
        }
        
        const messages = result.data?.messages || []
        const profiles = result.data?.profiles || []
        const groupedMessages = {}
        
        console.log('📨 Loaded messages:', messages.length)
        console.log('👥 Available profiles:', profiles.length)
        
        const profileMap = {}
        profiles.forEach(profile => {
          profileMap[profile.id] = {
            auth_id: profile.auth_id,
            display_name: profile.display_name,
            avatar_url: profile.avatar_url
          }
        })
        
        // Also ensure users who have messages are loaded into users array
        const messageUserIds = new Set()
        messages.forEach(msg => {
          const otherProfileId = msg.sender_id === currentProfileId ? msg.receiver_id : msg.sender_id
          const otherUserData = profileMap[otherProfileId]
          
          if (otherUserData) {
            messageUserIds.add(otherUserData.auth_id)
            
            if (!groupedMessages[otherUserData.auth_id]) {
              groupedMessages[otherUserData.auth_id] = []
            }
            
            groupedMessages[otherUserData.auth_id].push({
              text: msg.content,
              sender: msg.sender_id === currentProfileId ? currentUser.id : otherUserData.auth_id,
              timestamp: msg.created_at
            })
            
            // Add user to users array if not already present
            setUsers(prevUsers => {
              const existingUser = prevUsers.find(u => u.id === otherUserData.auth_id)
              if (!existingUser) {
                const newUser = {
                  id: otherUserData.auth_id,
                  displayName: otherUserData.display_name || 'User',
                  avatarUrl: otherUserData.avatar_url,
                  email: (otherUserData.display_name || 'user').toLowerCase().replace(/\s+/g, '') + '@example.com'
                }
                console.log('➕ Adding message user to users array:', newUser)
                return [...prevUsers, newUser]
              }
              return prevUsers
            })
          }
        })
        
        console.log('💬 Grouped messages by user:', Object.keys(groupedMessages))
        setChatMessages(groupedMessages)
      }
    } catch (error) {
      console.error('❌ Failed to load messages:', error)
    } finally {
      setLoadingMessages(false)
    }
  }

  const sendMessage = async (receiverId, messageText) => {
    if (!currentUser?.id || !messageText.trim()) {
      console.error('❌ Missing user or message text')
      return false
    }
    
    // Add message to UI immediately for instant display
    const instantMessage = {
      text: messageText.trim(),
      sender: currentUser.id,
      timestamp: new Date().toISOString()
    }
    
    setChatMessages(prev => ({
      ...prev,
      [receiverId]: [...(prev[receiverId] || []), instantMessage]
    }))
    
    try {
      
      // Get profile IDs first
      const profileResponse = await fetch(`https://ofafvhtbuhvvkhuprotc.graphql.ap-southeast-1.nhost.run/v1`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-hasura-admin-secret': '2=o_TVK82F6FKyi8xcbfE9lAm,r,jpq@'
        },
        body: JSON.stringify({
          query: `query GetProfileIds($senderId: uuid!, $receiverId: uuid!) {
            sender: profiles(where: {auth_id: {_eq: $senderId}}) { id }
            receiver: profiles(where: {auth_id: {_eq: $receiverId}}) { id }
          }`,
          variables: {
            senderId: currentUser.id,
            receiverId: receiverId
          }
        })
      })
      
      const profileResult = await profileResponse.json()
      const senderProfileId = profileResult.data?.sender?.[0]?.id
      const receiverProfileId = profileResult.data?.receiver?.[0]?.id
      
      if (!senderProfileId || !receiverProfileId) {
        return false
      }
      
      // Find or create conversation using profile IDs
      const findConversationResponse = await fetch(`https://ofafvhtbuhvvkhuprotc.graphql.ap-southeast-1.nhost.run/v1`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-hasura-admin-secret': '2=o_TVK82F6FKyi8xcbfE9lAm,r,jpq@'
        },
        body: JSON.stringify({
          query: `query FindConversation($userId1: uuid!, $userId2: uuid!) {
            conversations(where: {
              _and: [
                {conversation_members: {user_id: {_eq: $userId1}}},
                {conversation_members: {user_id: {_eq: $userId2}}}
              ]
            }) {
              id
            }
          }`,
          variables: {
            userId1: senderProfileId,
            userId2: receiverProfileId
          }
        })
      })
      
      let conversationId
      const findResult = await findConversationResponse.json()
      
      if (findResult.data?.conversations?.length > 0) {
        conversationId = findResult.data.conversations[0].id
      } else {
        // Create new conversation
        const createConversationResponse = await fetch(`https://ofafvhtbuhvvkhuprotc.graphql.ap-southeast-1.nhost.run/v1`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-hasura-admin-secret': '2=o_TVK82F6FKyi8xcbfE9lAm,r,jpq@'
          },
          body: JSON.stringify({
            query: `mutation CreateConversation {
              insert_conversations_one(object: {}) {
                id
              }
            }`
          })
        })
        
        const createResult = await createConversationResponse.json()
        if (createResult.data?.insert_conversations_one) {
          conversationId = createResult.data.insert_conversations_one.id
          
          // Add members to conversation
          await fetch(`https://ofafvhtbuhvvkhuprotc.graphql.ap-southeast-1.nhost.run/v1`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-hasura-admin-secret': '2=o_TVK82F6FKyi8xcbfE9lAm,r,jpq@'
            },
            body: JSON.stringify({
              query: `mutation AddConversationMembers($conversationId: uuid!, $userId1: uuid!, $userId2: uuid!) {
                insert_conversation_members(objects: [
                  {conversation_id: $conversationId, user_id: $userId1},
                  {conversation_id: $conversationId, user_id: $userId2}
                ]) {
                  affected_rows
                }
              }`,
              variables: {
                conversationId: conversationId,
                userId1: senderProfileId,
                userId2: receiverProfileId
              }
            })
          })
        } else {
          console.error('❌ Failed to create conversation')
          return false
        }
      }
      
      console.log('📤 Sending message to conversation:', conversationId)
      
      // Send message using new table structure
      const response = await fetch(`https://ofafvhtbuhvvkhuprotc.graphql.ap-southeast-1.nhost.run/v1`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-hasura-admin-secret': '2=o_TVK82F6FKyi8xcbfE9lAm,r,jpq@'
        },
        body: JSON.stringify({
          query: `mutation SendMessage($senderId: uuid!, $receiverId: uuid!, $content: String!) {
            insert_messages_one(object: {
              sender_id: $senderId,
              receiver_id: $receiverId,
              content: $content
            }) {
              id
              created_at
            }
          }`,
          variables: {
            senderId: senderProfileId,
            receiverId: receiverProfileId,
            content: messageText.trim()
          }
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log('📤 Send message response:', result)
        
        if (result.errors) {
          console.error('❌ Send message errors:', result.errors)
          result.errors.forEach(error => {
            console.error('❌ Send message error details:', error.message, error.extensions)
          })
          return false
        }
        
        if (result.data?.insert_messages_one) {
          return true
        }
      } else {
        console.error('❌ Send message HTTP error:', response.status, response.statusText)
        const errorText = await response.text()
        console.error('❌ Send message error details:', errorText)
      }
    } catch (error) {
      // Revert the optimistic update on error
      setChatMessages(prev => ({
        ...prev,
        [receiverId]: (prev[receiverId] || []).filter(msg => 
          !(msg.text === messageText.trim() && msg.sender === currentUser.id && 
            Math.abs(new Date(msg.timestamp).getTime() - Date.now()) < 5000)
        )
      }))
    }
    return false
  }

  const loadRealLikes = async () => {
    try {
      const response = await fetch(`https://ofafvhtbuhvvkhuprotc.graphql.ap-southeast-1.nhost.run/v1`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-hasura-admin-secret': '2=o_TVK82F6FKyi8xcbfE9lAm,r,jpq@'
        },
        body: JSON.stringify({
          query: `query GetLikes {
            likes {
              post_id
              user_id
            }
          }`
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log('✅ Likes response:', result)
        
        if (result.errors) {
          console.error('❌ GraphQL errors in likes:', result.errors)
          result.errors.forEach(error => {
            console.error('❌ Like error details:', error.message, error.extensions)
          })
          return
        }
        
        const likesData = result.data?.likes || []
        console.log('📊 Likes data:', likesData)
        
        // Count likes per post/reel
        const likeCounts = {}
        likesData.forEach(like => {
          if (like.post_id) {
            likeCounts[like.post_id] = (likeCounts[like.post_id] || 0) + 1
          }
        })
        
        console.log('📊 Like counts:', likeCounts)
        setPostLikes(likeCounts)
        
        // Set which posts current user has liked
        const userLikes = new Set()
        likesData.forEach(like => {
          if (like.user_id === currentUser?.id && like.post_id) {
            userLikes.add(like.post_id)
          }
        })
        console.log('❤️ User likes:', Array.from(userLikes))
        setLikedPosts(userLikes)
        
        // Load dislikes
        await loadRealDislikes()
      } else {
        console.error('❌ Failed to fetch likes:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('❌ Failed to load likes:', error)
    }
  }

  const loadRealDislikes = async () => {
    try {
      const response = await fetch(`https://ofafvhtbuhvvkhuprotc.graphql.ap-southeast-1.nhost.run/v1`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-hasura-admin-secret': '2=o_TVK82F6FKyi8xcbfE9lAm,r,jpq@'
        },
        body: JSON.stringify({
          query: `query GetDislikes {
            dislikes {
              post_id
              user_id
            }
          }`
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log('👎 Dislikes response:', result)
        
        if (result.errors) {
          console.error('❌ GraphQL errors in dislikes:', result.errors)
          return
        }
        
        const dislikesData = result.data?.dislikes || []
        
        // Count dislikes per post
        const dislikeCounts = {}
        dislikesData.forEach(dislike => {
          if (dislike.post_id) {
            dislikeCounts[dislike.post_id] = (dislikeCounts[dislike.post_id] || 0) + 1
          }
        })
        
        setPostDislikes(dislikeCounts)
        
        // Set which posts current user has disliked
        const userDislikes = new Set()
        dislikesData.forEach(dislike => {
          if (dislike.user_id === currentUser?.id && dislike.post_id) {
            userDislikes.add(dislike.post_id)
          }
        })
        setDislikedPosts(userDislikes)
      }
    } catch (error) {
      console.error('❌ Failed to load dislikes:', error)
    }
  }

  const loadSavedPosts = async () => {
    if (!currentUser?.id) {
      console.log('💾 No current user, skipping saved posts load')
      return
    }
    
    console.log('💾 Loading saved posts for user:', currentUser.id)
    
    try {
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
      })
      const profileResult = await profileResponse.json()
      const profileId = profileResult.data?.profiles?.[0]?.id
      
      console.log('💾 Profile ID found:', profileId)
      
      if (!profileId) {
        console.log('💾 No profile ID found, cannot load saved posts')
        return
      }
      

      const response = await fetch(`https://ofafvhtbuhvvkhuprotc.graphql.ap-southeast-1.nhost.run/v1`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-hasura-admin-secret': '2=o_TVK82F6FKyi8xcbfE9lAm,r,jpq@'
        },
        body: JSON.stringify({
          query: `query GetSavedContent($userId: uuid!) {
            user_saved_content(where: {user_id: {_eq: $userId}}) {
              content_id
              content_type
            }
          }`,
          variables: { userId: profileId }
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log('💾 Saved posts response:', result)
        
        if (result.errors) {
          console.error('💾 GraphQL errors in saved posts:', result.errors)
          result.errors.forEach(error => {
            console.error('💾 Saved posts error details:', error.message, error.extensions)
          })
          return
        }
        
        const savedData = result.data?.user_saved_content || []
        console.log('💾 Raw saved data from DB:', savedData)
        const savedContentIds = new Set(savedData.map(item => item.content_id))
        setSavedPosts(savedContentIds)
        console.log('💾 Loaded saved content:', Array.from(savedContentIds))
        console.log('💾 Current posts available:', posts.map(p => ({ id: p.id, type: p.type })))
        console.log('💾 Matching saved posts:', posts.filter(p => savedContentIds.has(p.id)).map(p => ({ id: p.id, type: p.type, title: p.title })))
      } else {
        console.error('💾 Failed to fetch saved posts:', response.status)
      }
    } catch (error) {
      console.error('💾 Failed to load saved posts:', error)
    }
  }

  const loadRealComments = async () => {
    try {
      const response = await fetch(`https://ofafvhtbuhvvkhuprotc.graphql.ap-southeast-1.nhost.run/v1`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-hasura-admin-secret': '2=o_TVK82F6FKyi8xcbfE9lAm,r,jpq@'
        },
        body: JSON.stringify({
          query: `query GetAllComments {
            comments {
              post_id
              author_id
              text
              created_at
              profile {
                display_name
                avatar_url
              }
            }
          }`
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log('📝 Comments response:', result)
        
        if (result.errors) {
          console.error('❌ GraphQL errors in comments:', result.errors)
          result.errors.forEach(error => {
            console.error('❌ Comment error details:', error.message, error.extensions)
          })
          return
        }
        
        const commentsData = result.data?.comments || []
        console.log('📝 Comments data:', commentsData)
        
        // Count comments per post/reel
        const commentCounts = {}
        const commentsByPost = {}
        
        // Process post comments
        commentsData.forEach(comment => {
          if (comment.post_id) {
            commentCounts[comment.post_id] = (commentCounts[comment.post_id] || 0) + 1
            if (!commentsByPost[comment.post_id]) {
              commentsByPost[comment.post_id] = []
            }
            commentsByPost[comment.post_id].push({
              ...comment,
              userName: comment.profile?.display_name || 'User',
              isReelComment: false
            })
          }
        })
        
        // Note: Reel comments are stored in the same comments table with post_id referencing the reel ID
        
        console.log('📝 Comment counts:', commentCounts)
        console.log('📝 Comments by post:', commentsByPost)
        setPostComments(commentCounts)
        setCommentDetails(commentsByPost)
      } else {
        console.error('❌ Failed to fetch comments:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('❌ Failed to load comments:', error)
    }
  }

  const loadStories = async () => {
    try {
      console.log('📖 Loading stories...')
      const response = await fetch(`https://ofafvhtbuhvvkhuprotc.graphql.ap-southeast-1.nhost.run/v1`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-hasura-admin-secret': '2=o_TVK82F6FKyi8xcbfE9lAm,r,jpq@'
        },
        body: JSON.stringify({
          query: `query GetActiveStories {
            stories(
              where: {created_at: {_gte: "${new Date(Date.now() - 24*60*60*1000).toISOString()}"}}
              order_by: {created_at: desc}
            ) {
              id
              user_id
              storage_path
              created_at
            }
          }`
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log('📖 Stories response:', result)
        
        if (result.errors) {
          console.log('❌ Stories errors:', result.errors)
          result.errors.forEach(error => {
            console.log('❌ Story error details:', error.message, error.extensions)
          })
          return
        }
        
        const storiesData = result.data?.stories || []
        console.log('📖 Found stories (last 24h):', storiesData.length, storiesData)
        
        // Get user profiles for stories
        const storyUserIds = [...new Set(storiesData.map(s => s.user_id))]
        const userProfiles = {}
        
        if (storyUserIds.length > 0) {
          try {
            const profileResponse = await fetch(`https://ofafvhtbuhvvkhuprotc.graphql.ap-southeast-1.nhost.run/v1`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-hasura-admin-secret': '2=o_TVK82F6FKyi8xcbfE9lAm,r,jpq@'
              },
              body: JSON.stringify({
                query: `query GetStoryUserProfiles($userIds: [uuid!]!) {
                  profiles(where: {auth_id: {_in: $userIds}}) {
                    auth_id
                    display_name
                    avatar_url
                  }
                }`,
                variables: { userIds: storyUserIds }
              })
            })
            
            const profileResult = await profileResponse.json()
            profileResult.data?.profiles?.forEach(profile => {
              userProfiles[profile.auth_id] = {
                displayName: profile.display_name,
                avatarUrl: profile.avatar_url,
                authId: profile.auth_id
              }
            })
          } catch (err) {
            console.log('Failed to load story user profiles:', err)
          }
        }
        
        const storiesWithUsers = storiesData.map(story => ({
          ...story,
          user: userProfiles[story.user_id] || { displayName: 'User', avatarUrl: null, authId: story.user_id }
        }))
        
        console.log('📖 User profiles:', userProfiles)
        console.log('📖 Stories with users:', storiesWithUsers)
        console.log('📖 Current user ID:', currentUser?.id)
        
        setStories(storiesWithUsers)
      } else {
        console.log('❌ Stories response not ok:', response.status, response.statusText)
      }
    } catch (error) {
      console.log('❌ Failed to load stories:', error)
    }
  }

  const loadRealFollowers = async () => {
    try {
      console.log('🔄 Loading followers for user:', currentUser?.id)
      const response = await fetch(`https://ofafvhtbuhvvkhuprotc.graphql.ap-southeast-1.nhost.run/v1`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-hasura-admin-secret': '2=o_TVK82F6FKyi8xcbfE9lAm,r,jpq@'
        },
        body: JSON.stringify({
          query: `query GetFollows {
            follows {
              follower_id
              following_id
            }
            profiles {
              id
              auth_id
            }
          }`
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log('👥 Follows response:', result)
        
        if (result.errors) {
          console.error('❌ Follow errors:', result.errors)
          result.errors.forEach(error => {
            console.error('❌ Follow error details:', error.message, error.extensions)
          })
          return
        }
        
        const followsData = result.data?.follows || []
        const profilesData = result.data?.profiles || []
        
        console.log('👥 Follows data:', followsData)
        
        // Create profile ID to auth ID mapping
        const profileMap = {}
        profilesData.forEach(profile => {
          profileMap[profile.id] = profile.auth_id
        })
        
        // Count followers per user (convert profile IDs to auth IDs)
        const followerCounts = {}
        followsData.forEach(follow => {
          const followingAuthId = profileMap[follow.following_id]
          if (followingAuthId) {
            followerCounts[followingAuthId] = (followerCounts[followingAuthId] || 0) + 1
          }
        })
        
        console.log('📊 Follower counts:', followerCounts)
        setFollowers(followerCounts)
        
        // Set who current user is following (convert profile IDs to auth IDs)
        const userFollowing = new Set()
        const userFollowers = new Set()
        const followersDetails = {}
        const followingDetails = {}
        
        followsData.forEach(follow => {
          const followerAuthId = profileMap[follow.follower_id]
          const followingAuthId = profileMap[follow.following_id]
          
          if (followerAuthId === currentUser?.id && followingAuthId) {
            userFollowing.add(followingAuthId)
          }
          
          if (followingAuthId === currentUser?.id && followerAuthId) {
            userFollowers.add(followerAuthId)
          }
          
          // Store followers for each user (who follows them)
          if (followingAuthId) {
            if (!followersDetails[followingAuthId]) {
              followersDetails[followingAuthId] = []
            }
            if (followerAuthId) {
              followersDetails[followingAuthId].push(followerAuthId)
            }
          }
          
          // Store following for each user (who they follow)
          if (followerAuthId) {
            if (!followingDetails[followerAuthId]) {
              followingDetails[followerAuthId] = []
            }
            if (followingAuthId) {
              followingDetails[followerAuthId].push(followingAuthId)
            }
          }
        })
        
        console.log('👤 User following:', Array.from(userFollowing))
        console.log('👥 User followers:', Array.from(userFollowers))
        console.log('📊 All followers details:', followersDetails)
        console.log('📊 All following details:', followingDetails)
        setFollowing(userFollowing)
        setFollowersData(followersDetails)
        setFollowingData(followingDetails)
        
        // Store following details globally for access in modals
        window.followingDetails = followingDetails
      }
    } catch (error) {
      console.log('Failed to load follows:', error)
    }
  }

  const loadCurrentUser = async () => {
    try {
      const user = await nhost.auth.getUser()
      console.log('👤 Raw user data:', user)
      
      const userId = user?.body?.id || user?.id
      const userEmail = user?.body?.email || user?.email
      const userDisplayName = user?.body?.displayName || user?.displayName
      const userAvatarUrl = user?.body?.avatarUrl || user?.avatarUrl
      
      console.log('🔑 User details:', { userId, userEmail, userDisplayName, userAvatarUrl })
      
      if (userId) {
        // Try to fetch from database first
        try {
          const response = await fetch(`https://ofafvhtbuhvvkhuprotc.graphql.ap-southeast-1.nhost.run/v1`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-hasura-admin-secret': '2=o_TVK82F6FKyi8xcbfE9lAm,r,jpq@'
            },
            body: JSON.stringify({
              query: `query GetUserProfile($userId: uuid!) {
                profiles(where: {auth_id: {_eq: $userId}}) {
                  id
                  auth_id
                  username
                  display_name
                  avatar_url
                  bio
                  website
                  user_type
                  created_at
                }
              }`,
              variables: { userId }
            })
          })
          
          if (response.ok) {
            const result = await response.json()
            console.log('🔍 Database response:', result)
            
            if (result.errors) {
              console.log('❌ User fetch errors:', result.errors)
              result.errors.forEach(error => {
                console.log('❌ User error details:', error.message)
              })
            }
            
            if (result.data?.profiles && result.data.profiles.length > 0) {
              const dbProfile = result.data.profiles[0]
              console.log('👤 Database profile found:', dbProfile)
              console.log('🖼️ Avatar URL from DB:', dbProfile.avatar_url)
              
              // Get more complete name from auth metadata if display_name is empty
              const userMetadata = user?.body?.metadata || user?.metadata || {}
              const firstName = userMetadata?.firstName || user?.body?.firstName || ''
              const lastName = userMetadata?.lastName || user?.body?.lastName || ''
              const fullNameFromAuth = firstName && lastName ? `${firstName} ${lastName}` : userDisplayName
              
              const userData = {
                id: userId,
                email: userEmail,
                username: dbProfile.username,
                displayName: dbProfile.display_name || fullNameFromAuth || userEmail?.split('@')[0] || 'User',
                avatarUrl: dbProfile.avatar_url || userAvatarUrl,
                bio: dbProfile.bio || '',
                website: dbProfile.website || '',
                userType: dbProfile.user_type || 'regular'
              }
              
              // Check if user is sponsored admin
              setIsSponsoredUser(dbProfile.user_type === 'sponsored')
              console.log('👤 Setting user with avatar:', userData.avatarUrl)
              
              // If display name is just email or generic, try to update it with auth metadata
              if ((!dbProfile.display_name || dbProfile.display_name === userEmail?.split('@')[0]) && fullNameFromAuth && fullNameFromAuth !== userDisplayName) {
                console.log('🔄 Updating profile with complete name from auth:', fullNameFromAuth)
                try {
                  await fetch(`https://ofafvhtbuhvvkhuprotc.graphql.ap-southeast-1.nhost.run/v1`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'x-hasura-admin-secret': '2=o_TVK82F6FKyi8xcbfE9lAm,r,jpq@'
                    },
                    body: JSON.stringify({
                      query: `mutation UpdateProfileName($userId: uuid!, $displayName: String!) {
                        update_profiles(
                          where: {auth_id: {_eq: $userId}}
                          _set: {display_name: $displayName}
                        ) {
                          affected_rows
                        }
                      }`,
                      variables: {
                        userId: userId,
                        displayName: fullNameFromAuth
                      }
                    })
                  })
                  userData.displayName = fullNameFromAuth
                  console.log('✅ Profile name updated successfully')
                } catch (updateError) {
                  console.log('⚠️ Failed to update profile name:', updateError)
                }
              }
              
              setCurrentUser(userData)
              
              // Always clear localStorage when database data is found
              localStorage.removeItem('user_profile')
              return
            } else {
              console.log('⚠️ No profile found, creating new profile for:', userId)
              
              // Create new profile automatically
              try {
                // Get more complete user data from Nhost auth
                const userMetadata = user?.body?.metadata || user?.metadata || {}
                const firstName = userMetadata?.firstName || user?.body?.firstName || ''
                const lastName = userMetadata?.lastName || user?.body?.lastName || ''
                const fullName = firstName && lastName ? `${firstName} ${lastName}` : (userDisplayName || userEmail?.split('@')[0] || 'User')
                
                console.log('🔍 Creating profile with user data:', {
                  userId,
                  userEmail,
                  userDisplayName,
                  firstName,
                  lastName,
                  fullName,
                  userMetadata
                })
                
                const createResponse = await fetch(`https://ofafvhtbuhvvkhuprotc.graphql.ap-southeast-1.nhost.run/v1`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'x-hasura-admin-secret': '2=o_TVK82F6FKyi8xcbfE9lAm,r,jpq@'
                  },
                  body: JSON.stringify({
                    query: `mutation CreateProfile($userId: uuid!, $displayName: String, $avatarUrl: String, $username: String) {
                      insert_profiles_one(object: {
                        auth_id: $userId,
                        username: $username,
                        display_name: $displayName,
                        avatar_url: $avatarUrl,
                        bio: "",
                        website: ""
                      }) {
                        id
                        auth_id
                        username
                        display_name
                        avatar_url
                        bio
                        website
                      }
                    }`,
                    variables: {
                      userId: userId,
                      username: (fullName || userEmail?.split('@')[0] || 'user').toLowerCase().replace(/[^a-z0-9]/g, ''),
                      displayName: fullName,
                      avatarUrl: userAvatarUrl
                    }
                  })
                })
                
                if (createResponse.ok) {
                  const createResult = await createResponse.json()
                  if (createResult.data?.insert_profiles_one) {
                    const newProfile = createResult.data.insert_profiles_one
                    console.log('✅ Created new profile:', newProfile)
                    
                    const userData = {
                      id: userId,
                      email: userEmail,
                      username: newProfile.username,
                      displayName: newProfile.display_name,
                      avatarUrl: newProfile.avatar_url,
                      bio: newProfile.bio || '',
                      website: newProfile.website || ''
                    }
                    console.log('👤 Setting user with new profile:', userData.avatarUrl)
                    setCurrentUser(userData)
                    return
                  }
                }
              } catch (createError) {
                console.log('❌ Failed to create profile:', createError)
              }
            }
          }
        } catch (dbError) {
          console.log('⚠️ Database error:', dbError)
        }
        
        // Clear any old localStorage data
        localStorage.removeItem('user_profile')
        
        // Fallback to auth user data
        console.log('👤 Using auth fallback')
        const fallbackUser = {
          id: userId,
          email: userEmail,
          displayName: userDisplayName || userEmail?.split('@')[0] || 'User',
          avatarUrl: userAvatarUrl
        }
        console.log('👤 Fallback user avatar:', fallbackUser.avatarUrl)
        setCurrentUser(fallbackUser)
      } else {
        console.log('⚠️ No user found, using demo')
        setCurrentUser({
          id: 'demo-123',
          email: 'demo@example.com',
          displayName: 'Demo User',
          avatarUrl: null
        })
      }
    } catch (error) {
      console.log('❌ Load user error:', error)
      setCurrentUser({
        id: 'guest-123',
        email: 'guest@example.com',
        displayName: 'Guest User',
        avatarUrl: null
      })
    }
  }

  const loadUsers = async () => {
    try {
      // Load ALL users from profiles table (remove limit to see all users)
      const response = await fetch(`https://ofafvhtbuhvvkhuprotc.graphql.ap-southeast-1.nhost.run/v1`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-hasura-admin-secret': '2=o_TVK82F6FKyi8xcbfE9lAm,r,jpq@'
        },
        body: JSON.stringify({
          query: `query GetProfiles {
            profiles(order_by: {created_at: desc}) {
              id
              auth_id
              username
              display_name
              avatar_url
              bio
              created_at
            }
          }`
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        if (result.data?.profiles && result.data.profiles.length > 0) {
          const realUsers = result.data.profiles.map(profile => ({
            id: profile.auth_id,
            username: profile.username,
            displayName: profile.display_name,
            email: profile.display_name?.toLowerCase().replace(/\s+/g, '') + '@example.com',
            avatarUrl: profile.avatar_url,
            bio: profile.bio
          }))
          console.log('✅ Loaded all users from profiles:', realUsers.length)
          setUsers(realUsers)
          return
        }
      }
    } catch (error) {
      console.log('⚠️ Failed to load users from database:', error)
    }
    
    // Only show current user if no other users found
    if (currentUser) {
      setUsers([currentUser])
    } else {
      setUsers([])
    }
  }

  const loadPosts = async () => {
    try {
      const response = await fetch(`https://ofafvhtbuhvvkhuprotc.graphql.ap-southeast-1.nhost.run/v1`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-hasura-admin-secret': '2=o_TVK82F6FKyi8xcbfE9lAm,r,jpq@'
        },
        body: JSON.stringify({
          query: `query GetPostsAndReels {
            posts(order_by: {created_at: desc}) {
              id
              image_url
              caption
              author_id
              sponsored_by
              created_at
            }
            reels(order_by: {created_at: desc}) {
              id
              video_url
              caption
              user_id
              sponsored_by
              created_at
            }
          }`
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log('🔍 Database response:', result)
        
        if (result.errors) {
          console.log('❌ GraphQL errors:', result.errors)
          result.errors.forEach(error => {
            console.log('❌ Error details:', error.message, error.path)
          })
          setPosts([])
          return
        }
        
        const dbPosts = result.data?.posts || []
        const dbReels = result.data?.reels || []
        
        console.log('📸 Found posts:', dbPosts.length, dbPosts)
        console.log('🎥 Found reels:', dbReels.length, dbReels)
        
        // Debug sponsored content
        const sponsoredPosts = dbPosts.filter(p => p.sponsored_by)
        const sponsoredReels = dbReels.filter(r => r.sponsored_by)
        console.log('🎯 Sponsored posts:', sponsoredPosts.length, sponsoredPosts)
        console.log('🎯 Sponsored reels:', sponsoredReels.length, sponsoredReels)
        
        const allPosts = []
        
        // Get user profiles for posts
        const userIds = [...new Set([...dbPosts.map(p => p.author_id), ...dbReels.map(r => r.user_id)])]
        const userProfiles = {}
        
        if (userIds.length > 0) {
          try {
            const profileResponse = await fetch(`https://ofafvhtbuhvvkhuprotc.graphql.ap-southeast-1.nhost.run/v1`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-hasura-admin-secret': '2=o_TVK82F6FKyi8xcbfE9lAm,r,jpq@'
              },
              body: JSON.stringify({
                query: `query GetUserProfiles($userIds: [uuid!]!) {
                  profiles(where: {auth_id: {_in: $userIds}}) {
                    auth_id
                    display_name
                    avatar_url
                  }
                }`,
                variables: { userIds }
              })
            })
            
            const profileResult = await profileResponse.json()
            profileResult.data?.profiles?.forEach(profile => {
              userProfiles[profile.auth_id] = {
                displayName: profile.display_name,
                avatarUrl: profile.avatar_url
              }
            })
          } catch (err) {
            console.log('Failed to load user profiles:', err)
          }
        }
        
        // Add posts
        dbPosts.forEach(post => {
          const userProfile = userProfiles[post.author_id]
          
          // Parse image URL - handle JSON arrays, comma-separated URLs, and single URLs
          let imageUrl = post.image_url
          let fileType = 'image'
          
          console.log('LoadPosts - Raw image_url from DB:', post.image_url, 'Type:', typeof post.image_url)
          
          if (post.image_url) {
            const rawUrl = String(post.image_url).trim()
            
            try {
              // First try to parse as JSON array
              if (rawUrl.startsWith('[') && rawUrl.endsWith(']')) {
                const parsed = JSON.parse(rawUrl)
                if (Array.isArray(parsed) && parsed.length > 0) {
                  // Validate all URLs in array
                  const validUrls = parsed.filter(url => url && typeof url === 'string' && !url.includes(','))
                  if (validUrls.length > 0) {
                    imageUrl = validUrls
                    fileType = validUrls.length > 1 ? 'gallery' : 'image'
                    console.log('LoadPosts - Parsed as JSON array:', imageUrl, 'Valid URLs:', validUrls.length)
                  } else {
                    console.error('LoadPosts - No valid URLs in JSON array')
                    imageUrl = null
                  }
                } else {
                  console.error('LoadPosts - Invalid JSON array format')
                  imageUrl = rawUrl
                }
              }
              // Check if it contains commas (comma-separated URLs)
              else if (rawUrl.includes(',')) {
                const urlArray = rawUrl.split(',').map(url => url.trim()).filter(url => url.length > 0)
                if (urlArray.length > 1) {
                  imageUrl = urlArray
                  fileType = 'gallery'
                  console.log('LoadPosts - Parsed as comma-separated array:', imageUrl, 'Count:', urlArray.length)
                } else if (urlArray.length === 1) {
                  imageUrl = urlArray[0]
                  fileType = 'image'
                  console.log('LoadPosts - Single URL from comma split:', imageUrl)
                } else {
                  console.error('LoadPosts - No valid URLs after comma split')
                  imageUrl = null
                }
              }
              // Single URL
              else {
                imageUrl = rawUrl
                fileType = 'image'
                console.log('LoadPosts - Single URL:', imageUrl)
              }
            } catch (e) {
              console.error('LoadPosts - Parsing error:', e)
              // If parsing fails, check for comma-separated URLs as fallback
              if (rawUrl.includes(',')) {
                const urlArray = rawUrl.split(',').map(url => url.trim()).filter(url => url.length > 0)
                if (urlArray.length > 1) {
                  imageUrl = urlArray
                  fileType = 'gallery'
                  console.log('LoadPosts - Fallback comma parsing:', imageUrl)
                } else if (urlArray.length === 1) {
                  imageUrl = urlArray[0]
                  fileType = 'image'
                  console.log('LoadPosts - Fallback single URL:', imageUrl)
                } else {
                  console.error('LoadPosts - Fallback parsing failed')
                  imageUrl = null
                }
              } else {
                imageUrl = rawUrl
                fileType = 'image'
                console.log('LoadPosts - Fallback single URL:', imageUrl)
              }
            }
            
            // Final validation
            if (Array.isArray(imageUrl)) {
              const hasInvalidUrl = imageUrl.some(url => !url || url.includes(','))
              if (hasInvalidUrl) {
                console.error('LoadPosts - Invalid URLs detected in array:', imageUrl)
                imageUrl = imageUrl.filter(url => url && !url.includes(','))
                if (imageUrl.length === 0) {
                  imageUrl = null
                }
              }
            } else if (imageUrl && imageUrl.includes(',')) {
              console.error('LoadPosts - Single URL contains comma:', imageUrl)
              imageUrl = null
            }
          }
          
          console.log('LoadPosts - Final imageUrl for post:', imageUrl, 'fileType:', fileType, 'isArray:', Array.isArray(imageUrl))
          
          allPosts.push({
            id: post.id,
            title: post.caption,
            content: post.caption,
            type: 'post',
            imageUrl: imageUrl,
            fileType: fileType,
            sponsoredBy: post.sponsored_by,
            user: {
              displayName: post.author_id === currentUser?.id ? 'You' : (userProfile?.displayName || 'User'),
              id: post.author_id,
              avatarUrl: userProfile?.avatarUrl
            },
            createdAt: post.created_at
          })
        })
        
        // Add reels
        dbReels.forEach(reel => {
          const userProfile = userProfiles[reel.user_id]
          allPosts.push({
            id: reel.id,
            title: reel.caption,
            content: reel.caption,
            type: 'reel',
            imageUrl: reel.video_url,
            fileType: 'video',
            sponsoredBy: reel.sponsored_by,
            user: {
              displayName: reel.user_id === currentUser?.id ? 'You' : (userProfile?.displayName || 'User'),
              id: reel.user_id,
              avatarUrl: userProfile?.avatarUrl
            },
            createdAt: reel.created_at
          })
        })
        
        // Randomize posts for variety in home feed
        allPosts.sort(() => Math.random() - 0.5)
        
        console.log('📋 Combined posts:', allPosts)
        setPosts(allPosts)
        console.log('✅ Loaded posts and reels:', allPosts.length)
      }
    } catch (err) {
      console.log('⚠️ Database load failed:', err)
      setPosts([])
    }
  }

  const handleLogout = async () => {
    // Clear all localStorage data
    localStorage.clear()
    
    // Sign out from Nhost
    try {
      await nhost.auth.signOut()
    } catch (error) {
      console.log('Signout error:', error)
    }
    
    // Reload page to reset state
    window.location.reload()
  }

  const handleProfileImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      setEditProfile(prev => ({ ...prev, file }))
      const reader = new FileReader()
      reader.onload = (e) => setEditProfile(prev => ({ ...prev, preview: e.target.result }))
      reader.readAsDataURL(file)
    }
  }

  const saveHideChatSetting = async (hideChat, password = null) => {
    try {
      const response = await fetch(`https://ofafvhtbuhvvkhuprotc.graphql.ap-southeast-1.nhost.run/v1`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-hasura-admin-secret': '2=o_TVK82F6FKyi8xcbfE9lAm,r,jpq@'
        },
        body: JSON.stringify({
          query: `mutation UpdateHideChat($userId: uuid!, $hideChat: Boolean!, $chatPassword: String) {
            update_profiles(
              where: {auth_id: {_eq: $userId}}
              _set: {hide_chat: $hideChat, chat_password: $chatPassword}
            ) {
              affected_rows
            }
          }`,
          variables: {
            userId: currentUser.id,
            hideChat: hideChat,
            chatPassword: password
          }
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        if (result.errors) {
          throw new Error(result.errors[0].message)
        }
        console.log('✅ Hide chat setting saved to database')
        localStorage.setItem('hideChatFromSettings', hideChat.toString())
        if (password !== null) {
          setChatPassword(password)
        }
      } else {
        throw new Error('Database request failed')
      }
    } catch (error) {
      console.error('❌ Failed to save hide chat setting:', error)
      localStorage.setItem('hideChatFromSettings', hideChat.toString())
    }
  }

  const handlePasswordProtectedToggle = () => {
    if (!chatPassword) {
      setPasswordAction('set')
      setPasswordInput('')
      setShowPasswordModal(true)
    } else {
      setPasswordAction('verify')
      setPasswordInput('')
      setShowPasswordModal(true)
    }
  }

  const handlePasswordSubmit = () => {
    if (passwordAction === 'set') {
      if (passwordInput.trim().length < 4) {
        alert('Password must be at least 4 characters long')
        return
      }
      saveHideChatSetting(!hideChatFromSettings, passwordInput.trim())
      setHideChatFromSettings(!hideChatFromSettings)
      
      if (!hideChatFromSettings && activeTab === 'messages') {
        setActiveTab('home')
      }
      
      setShowPasswordModal(false)
      setPasswordInput('')
    } else if (passwordAction === 'verify') {
      if (passwordInput.trim() === chatPassword) {
        setHideChatFromSettings(!hideChatFromSettings)
        saveHideChatSetting(!hideChatFromSettings)
        
        if (!hideChatFromSettings && activeTab === 'messages') {
          setActiveTab('home')
        }
        
        setShowPasswordModal(false)
        setPasswordInput('')
      } else {
        alert('Incorrect password')
        setPasswordInput('')
      }
    }
  }

  const handleSongsUpload = async (files) => {
    if (!files || files.length === 0) return
    
    const audioFiles = Array.from(files).filter(file => file.type.startsWith('audio/'))
    if (audioFiles.length === 0) {
      alert('Please select audio files')
      return
    }
    
    setUploadingSongs(true)
    setUploadProgress({ isUploading: true, message: `Uploading ${audioFiles.length} song(s)...`, startTime: Date.now() })
    
    try {
      let successCount = 0
      const newMusic = []
      for (const file of audioFiles) {
        const url = await uploadToCloudinary(file, 'audio')
        newMusic.push({
          id: Date.now() + Math.random(),
          name: file.name.replace(/\.[^/.]+$/, ''),
          url: url,
          duration: '0:00'
        })
        successCount++
      }
      
      setUploadedMusic(prev => [...prev, ...newMusic])
      alert(`Successfully uploaded ${successCount} song(s) to Cloudinary!`)
    } catch (error) {
      console.error('Songs upload failed:', error)
      alert('Failed to upload songs. Please try again.')
    } finally {
      setUploadingSongs(false)
      setUploadProgress({ isUploading: false, message: '', startTime: null })
    }
  }

  const handleUploadSubmitLocal = async (uploadData) => {
    try {
      await handleUploadSubmit(uploadData, currentUser, setPosts, loadPosts)
      alert('Upload successful!')
    } catch (error) {
      console.error('Upload failed:', error)
      alert('Upload failed. Please try again.')
    }
  }

  const loadUploadedMusic = async () => {
    const saved = localStorage.getItem('uploadedMusic')
    if (saved) {
      setUploadedMusic(JSON.parse(saved))
    }
  }

  useEffect(() => {
    loadUploadedMusic()
  }, [])

  useEffect(() => {
    localStorage.setItem('uploadedMusic', JSON.stringify(uploadedMusic))
  }, [uploadedMusic])

  const handleProfileUpdate = async () => {
    try {
      let avatarUrl = editProfile.avatarUrl
      
      // Upload new profile picture if selected
      if (editProfile.file) {
        try {
          avatarUrl = await uploadToCloudinary(editProfile.file, 'image')
          console.log('✅ Profile pic uploaded to Cloudinary')
        } catch (cloudinaryError) {
          console.log('⚠️ Cloudinary failed, using base64 image')
          // Use base64 as fallback
          avatarUrl = editProfile.preview
        }
      }
      
      // Update user profile in database
      try {
        const mutationVars = {
          userId: currentUser.id,
          username: editProfile.username || currentUser.username,
          displayName: editProfile.displayName || currentUser.displayName,
          avatarUrl: avatarUrl,
          bio: editProfile.bio || '',
          website: editProfile.website || ''
        }
        console.log('💾 Sending mutation with vars:', mutationVars)
        console.log('🖼️ Avatar URL being saved:', avatarUrl)
        
        const response = await fetch(`https://ofafvhtbuhvvkhuprotc.graphql.ap-southeast-1.nhost.run/v1`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-hasura-admin-secret': '2=o_TVK82F6FKyi8xcbfE9lAm,r,jpq@'
          },
          body: JSON.stringify({
            query: `mutation UpdateProfile($userId: uuid!, $username: String, $displayName: String, $avatarUrl: String, $bio: String, $website: String) {
              update_profiles(
                where: {auth_id: {_eq: $userId}}
                _set: {
                  username: $username,
                  display_name: $displayName,
                  avatar_url: $avatarUrl,
                  bio: $bio,
                  website: $website
                }
              ) {
                returning {
                  id
                  auth_id
                  username
                  display_name
                  avatar_url
                  bio
                  website
                }
              }
            }`,
            variables: mutationVars
          })
        })
        
        if (response.ok) {
          const result = await response.json()
          console.log('✅ Profile update response:', result)
          
          if (result.errors) {
            console.log('❌ Profile update errors:', result.errors)
            result.errors.forEach(error => {
              console.log('❌ Update error details:', error.message)
            })
            throw new Error('Profile update failed: ' + result.errors[0].message)
          }
          
          if (result.data?.update_profiles?.returning?.length > 0) {
            const updatedProfile = result.data.update_profiles.returning[0]
            const updatedUser = {
              id: currentUser.id,
              email: currentUser.email,
              username: updatedProfile.username,
              displayName: updatedProfile.display_name,
              avatarUrl: updatedProfile.avatar_url,
              bio: updatedProfile.bio,
              website: updatedProfile.website
            }
            console.log('✅ Updated user from DB:', updatedUser)
            console.log('🖼️ New avatar URL:', updatedUser.avatarUrl)
            console.log('💾 Mutation variables used:', {
              userId: currentUser.id,
              displayName: editProfile.displayName || currentUser.displayName,
              avatarUrl: avatarUrl
            })
            
            setCurrentUser(updatedUser)
            setShowSettingsModal(false)
            
            // Force reload user data to ensure avatar displays
            setTimeout(() => {
              loadCurrentUser()
            }, 500)
            
            alert('Profile updated successfully! All users can now see your changes.')
          } else {
            throw new Error('Database update failed')
          }
        } else {
          throw new Error('Database request failed')
        }
      } catch (dbError) {
        console.error('Database update error:', dbError)
        
        // Fallback to local storage
        const updatedUser = {
          ...currentUser,
          displayName: editProfile.displayName || currentUser.displayName,
          avatarUrl: avatarUrl
        }
        
        setCurrentUser(updatedUser)
        setShowSettingsModal(false)
        alert('Profile updated locally. Database sync failed - only you can see changes.')
      }
    } catch (error) {
      console.error('Profile update error:', error)
      alert('Failed to update profile. Please try again.')
    }
  }

  const HomeIcon = ({ active }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? currentThemeConfig.accent : 'none'} stroke={active ? currentThemeConfig.accent : currentThemeConfig.secondary} strokeWidth="2">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9,22 9,12 15,12 15,22"/>
    </svg>
  )

  const SearchIcon = ({ active }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? currentThemeConfig.accent : currentThemeConfig.secondary} strokeWidth="2">
      <circle cx="11" cy="11" r="8"/>
      <path d="m21 21-4.35-4.35"/>
    </svg>
  )

  const ReelsIcon = ({ active }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? currentThemeConfig.accent : 'none'} stroke={active ? currentThemeConfig.accent : currentThemeConfig.secondary} strokeWidth="2">
      <circle cx="12" cy="12" r="10"/>
      <polygon points="10,8 16,12 10,16 10,8" fill={active ? '#000' : currentThemeConfig.secondary}/>
    </svg>
  )

  const MessageIcon = ({ active }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? currentThemeConfig.accent : 'none'} stroke={active ? currentThemeConfig.accent : currentThemeConfig.secondary} strokeWidth="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  )

  const ProfileIcon = ({ active }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? currentThemeConfig.accent : 'none'} stroke={active ? currentThemeConfig.accent : currentThemeConfig.secondary} strokeWidth="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  )

  const HeartIcon = ({ filled, onClick }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={filled ? '#4285f4' : currentThemeConfig.secondary} onClick={onClick} style={{ cursor: 'pointer' }}>
      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
    </svg>
  )

  const DislikeIcon = ({ filled, onClick }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={filled ? '#ff4444' : currentThemeConfig.secondary} onClick={onClick} style={{ cursor: 'pointer', transform: 'rotate(180deg)' }}>
      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
    </svg>
  )

  const CommentIcon = ({ onClick }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={currentThemeConfig.secondary} strokeWidth="2" onClick={onClick} style={{ cursor: 'pointer' }}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  )

  const ShareIcon = ({ onClick }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={currentThemeConfig.secondary} strokeWidth="2" onClick={onClick} style={{ cursor: 'pointer' }}>
      <circle cx="18" cy="5" r="3"/>
      <circle cx="6" cy="12" r="3"/>
      <circle cx="18" cy="19" r="3"/>
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
    </svg>
  )

  const PlusIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  )

  const CameraIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F8FAFC" strokeWidth="2">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
      <circle cx="12" cy="13" r="4"/>
    </svg>
  )

  const VideoIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F8FAFC" strokeWidth="2">
      <polygon points="23 7 16 12 23 17 23 7"/>
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
    </svg>
  )

  const tabs = [
    { id: 'home', icon: HomeIcon, label: 'Home' },
    { id: 'search', icon: SearchIcon, label: 'Search' },
    { id: 'reels', icon: ReelsIcon, label: 'Reels' },
    ...(hideChatFromSettings ? [] : [{ id: 'messages', icon: MessageIcon, label: 'Messages' }]),
    { id: 'profile', icon: ProfileIcon, label: 'Profile' }
  ]

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div style={{ padding: '0', background: currentThemeConfig.bg, minHeight: '100vh' }}>
            <div style={{ background: 'rgba(0, 0, 0, 0.9)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(212, 175, 55, 0.3)', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, color: currentThemeConfig.accent, fontFamily: 'cursive', fontSize: '1.5rem' }}>Instagram</h2>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button
                  onClick={() => {
                    setUploadType('post')
                    setShowUploadModal(true)
                  }}
                  style={{
                    background: `linear-gradient(45deg, ${currentThemeConfig.accent}, ${currentThemeConfig.secondary})`,
                    border: 'none',
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 4px 15px rgba(255, 215, 0, 0.3)'
                  }}
                >
                  <PlusIcon />
                </button>
              </div>
            </div>
            
            {/* Stories */}
            <div style={{ background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(212, 175, 55, 0.3)', padding: '1rem 0' }}>
              <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', padding: '0 1rem' }}>
                {(() => {
                  // Group stories by user
                  const groupedStories = {}
                  stories.forEach(story => {
                    const userId = story.user?.authId || story.user_id
                    if (!groupedStories[userId]) {
                      groupedStories[userId] = {
                        user: story.user,
                        stories: []
                      }
                    }
                    groupedStories[userId].stories.push(story)
                  })
                  
                  const userGroups = Object.values(groupedStories)
                  
                  return (
                    <>
                      {/* Your Story with + icon */}
                      <div style={{
                        minWidth: '66px',
                        textAlign: 'center'
                      }}>
                        <div 
                          style={{
                            width: '66px',
                            height: '66px',
                            borderRadius: '50%',
                            background: 'linear-gradient(45deg, #FFD700, #FFA500)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#000',
                            fontWeight: 'bold',
                            marginBottom: '0.25rem',
                            cursor: 'pointer',
                            border: stories.some(story => story.user?.authId === currentUser?.id || story.user_id === currentUser?.id) ? '3px solid #8B0000' : '3px solid #D4AF37',
                            position: 'relative',
                            overflow: 'hidden'
                          }}>
                          {/* Story Circle - Click to view stories */}
                          <div 
                            onClick={() => {
                              const userStories = stories.filter(story => story.user?.authId === currentUser?.id || story.user_id === currentUser?.id)
                              if (userStories.length > 0) {
                                setUserStories(userStories)
                                setCurrentStoryIndex(0)
                                setShowStoryModal(userStories[0])
                              }
                            }}
                            style={{
                              width: '100%',
                              height: '100%',
                              borderRadius: '50%',
                              overflow: 'hidden',
                              cursor: stories.some(story => story.user?.authId === currentUser?.id || story.user_id === currentUser?.id) ? 'pointer' : 'default'
                            }}>
                            {currentUser?.avatarUrl ? (
                              <img 
                                src={currentUser.avatarUrl} 
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                alt={currentUser.displayName}
                              />
                            ) : (
                              <div style={{
                                width: '100%',
                                height: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.5rem'
                              }}>
                                {(currentUser?.displayName || 'U')[0]?.toUpperCase()}
                              </div>
                            )}
                          </div>
                          
                          {/* Plus Icon - Click to upload */}
                          <div 
                            onClick={() => {
                              setUploadType('story')
                              setShowUploadModal(true)
                            }}
                            style={{
                              position: 'absolute',
                              bottom: '2px',
                              right: '2px',
                              width: '20px',
                              height: '20px',
                              borderRadius: '50%',
                              background: '#FFD700',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: '2px solid #000',
                              cursor: 'pointer'
                            }}>
                            <span style={{ fontSize: '12px', color: '#000' }}>+</span>
                          </div>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: '#FFD700' }}>
                          Your Story
                        </span>
                      </div>


                      
                      {/* Show other users' stories */}
                      {userGroups.filter(group => group.user?.authId !== currentUser?.id).slice(0, 7).map((group, i) => (
                        <div key={group.user?.authId || i} style={{
                          minWidth: '66px',
                          textAlign: 'center'
                        }}>
                          <div 
                            onClick={() => {
                              setUserStories(group.stories)
                              setCurrentStoryIndex(0)
                              setShowStoryModal(group.stories[0])
                            }}
                            style={{
                              width: '66px',
                              height: '66px',
                              borderRadius: '50%',
                              background: 'linear-gradient(45deg, #FFD700, #FFA500)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#000',
                              fontWeight: 'bold',
                              marginBottom: '0.25rem',
                              cursor: 'pointer',
                              border: '3px solid #8B0000',
                              position: 'relative',
                              overflow: 'hidden'
                            }}>
                            {group.user?.avatarUrl ? (
                              <img 
                                src={group.user.avatarUrl} 
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                alt={group.user.displayName}
                              />
                            ) : (
                              (group.user?.displayName || `User${i+1}`)[0]?.toUpperCase()
                            )}

                          </div>
                          <span style={{ fontSize: '0.75rem', color: '#FFD700' }}>
                            {group.user?.displayName?.split(' ')[0] || `user${i+1}`}
                          </span>
                        </div>
                      ))}
                      
                      {stories.length === 0 && (
                        <div style={{ color: '#D4AF37', fontSize: '0.9rem', padding: '1rem' }}>
                          No active stories
                        </div>
                      )}
                    </>
                  )
                })()}
              </div>
            </div>

            {/* Posts */}
            <div style={{ paddingBottom: '2rem', maxWidth: '600px', margin: '0 auto' }}>
              {posts.length > 0 ? posts.map((post, i) => {
                const postId = post.id || `post-${i}`
                const isLiked = likedPosts.has(postId)
                const isDisliked = dislikedPosts.has(postId)
                const likesCount = postLikes[postId] || 0
                const dislikesCount = postDislikes[postId] || 0
                
                return (
                  <div key={postId} style={{
                    background: 'rgba(0, 0, 0, 0.9)',
                    backdropFilter: 'blur(10px)',
                    marginBottom: '1rem',
                    border: '1px solid rgba(212, 175, 55, 0.3)',
                    borderRadius: '12px',
                    overflow: 'hidden'
                  }}>
                    <div style={{ padding: '1rem', borderBottom: '1px solid rgba(212, 175, 55, 0.2)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div 
                            onClick={() => {
                              if (post.sponsoredBy || post.sponsored_by) {
                                const sponsorUser = users.find(u => u.displayName === (post.sponsoredBy || post.sponsored_by))
                                if (sponsorUser) {
                                  setViewingProfile(sponsorUser)
                                  setActiveTab('profile')
                                  loadRealFollowers()
                                }
                              } else {
                                const userStories = stories.filter(story => story.user?.authId === post.user?.id || story.user_id === post.user?.id)
                                if (userStories.length > 0) {
                                  setUserStories(userStories)
                                  setCurrentStoryIndex(0)
                                  setShowStoryModal(userStories[0])
                                }
                              }
                            }}
                            style={{ 
                              width: '32px', 
                              height: '32px', 
                              borderRadius: '50%', 
                              background: 'linear-gradient(45deg, #FFD700, #FFA500)', 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center', 
                              color: '#000', 
                              fontSize: '0.9rem', 
                              fontWeight: 'bold', 
                              overflow: 'hidden',
                              cursor: 'pointer',
                              border: '2px solid transparent',
                              padding: '2px'
                            }}>
                            <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(45deg, #FFD700, #FFA500)' }}>
                              {(() => {
                                const displayUser = (post.sponsoredBy || post.sponsored_by) ? 
                                  users.find(u => u.displayName === (post.sponsoredBy || post.sponsored_by)) : 
                                  post.user
                                return displayUser?.avatarUrl ? (
                                  <img 
                                    src={displayUser.avatarUrl} 
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    alt="Profile"
                                    onError={(e) => {
                                      e.target.style.display = 'none'
                                      e.target.nextSibling.style.display = 'flex'
                                    }}
                                  />
                                ) : null
                              })()}
                              <span style={{ 
                                display: (() => {
                                  const displayUser = (post.sponsoredBy || post.sponsored_by) ? 
                                    users.find(u => u.displayName === (post.sponsoredBy || post.sponsored_by)) : 
                                    post.user
                                  return displayUser?.avatarUrl ? 'none' : 'flex'
                                })(),
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '100%',
                                height: '100%'
                              }}>
                                {(() => {
                                  const displayUser = (post.sponsoredBy || post.sponsored_by) ? 
                                    users.find(u => u.displayName === (post.sponsoredBy || post.sponsored_by)) : 
                                    post.user
                                  return (displayUser?.displayName || 'U')[0]?.toUpperCase()
                                })()}
                              </span>
                            </div>
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <span 
                                onClick={() => {
                                  console.log('Username clicked:', post.user, 'Current user:', currentUser?.id)
                                  console.log('Available users:', users)
                                  
                                  if (post.sponsoredBy || post.sponsored_by) {
                                    const sponsorUser = users.find(u => u.displayName === (post.sponsoredBy || post.sponsored_by))
                                    console.log('Found sponsor user:', sponsorUser)
                                    if (sponsorUser) {
                                      setViewingProfile(sponsorUser)
                                      setActiveTab('profile')
                                      loadRealFollowers()
                                    }
                                  } else if (post.user?.id && post.user.id !== currentUser?.id) {
                                    // Find the user in users array by ID
                                    let targetUser = users.find(u => u.id === post.user.id)
                                    
                                    // If not found by ID, try by displayName
                                    if (!targetUser) {
                                      targetUser = users.find(u => u.displayName === post.user.displayName)
                                    }
                                    
                                    // Use post.user as fallback
                                    if (!targetUser) {
                                      targetUser = post.user
                                    }
                                    
                                    console.log('Target user found:', targetUser)
                                    
                                    if (targetUser) {
                                      // Clear any existing modal states before navigating
                                      setShowFollowersModal(null)
                                      setFollowersSearchQuery('')
                                      setViewedUsersFromFollowers(new Set())
                                      window.lastFollowersModalType = null
                                      window.tempViewedUser = null
                                      
                                      setViewingProfile(targetUser)
                                      setActiveTab('profile')
                                      loadRealFollowers()
                                    }
                                  }
                                }}
                                style={{ 
                                  color: '#FFD700', 
                                  fontWeight: '600', 
                                  fontSize: '0.9rem',
                                  cursor: 'pointer'
                                }}
                              >
                                {(post.sponsoredBy || post.sponsored_by) ? (post.sponsoredBy || post.sponsored_by) : (post.user?.displayName || 'User')}
                              </span>
                              {(post.sponsoredBy || post.sponsored_by) && (
                                <span style={{ 
                                  color: '#ff6b35', 
                                  fontSize: '0.8rem',
                                  fontWeight: 'bold'
                                }}>
                                  ✓
                                </span>
                              )}
                            </div>
                            {(post.sponsoredBy || post.sponsored_by) && (
                              <div style={{ 
                                color: '#D4AF37', 
                                fontSize: '0.7rem',
                                fontStyle: 'italic',
                                marginTop: '1px'
                              }}>
                                Sponsored
                              </div>
                            )}
                            <div style={{ color: '#D4AF37', fontSize: '0.7rem' }}>
                              {(() => {
                                const displayUser = (post.sponsoredBy || post.sponsored_by) ? 
                                  users.find(u => u.displayName === (post.sponsoredBy || post.sponsored_by)) : 
                                  post.user
                                return followers[displayUser?.id] || 0
                              })()} followers
                            </div>
                          </div>
                        </div>
                        <div className="dropdown-container" style={{ position: 'relative' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setShowDropdown(showDropdown === postId ? null : postId)
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#D4AF37',
                              cursor: 'pointer',
                              fontSize: '1.2rem',
                              padding: '0.25rem'
                            }}
                          >
                            ⋯
                          </button>
                          
                          {showDropdown === postId && (
                            <div style={{
                              position: 'absolute',
                              top: '100%',
                              right: 0,
                              background: 'rgba(0, 0, 0, 0.95)',
                              border: '1px solid rgba(212, 175, 55, 0.5)',
                              borderRadius: '8px',
                              minWidth: '150px',
                              zIndex: 1000,
                              backdropFilter: 'blur(10px)'
                            }}>
                              <button
                                onClick={() => {
                                  setShowEmojiPicker(showEmojiPicker === postId ? null : postId)
                                  setShowDropdown(null)
                                }}
                                style={{
                                  width: '100%',
                                  padding: '0.75rem 1rem',
                                  background: 'none',
                                  border: 'none',
                                  color: '#FFD700',
                                  cursor: 'pointer',
                                  textAlign: 'left',
                                  borderBottom: '1px solid rgba(212, 175, 55, 0.2)'
                                }}
                              >
                                😊 Emoji
                              </button>
                              <button
                                onClick={() => {
                                  alert('Follow feature coming soon!')
                                  setShowDropdown(null)
                                }}
                                style={{
                                  width: '100%',
                                  padding: '0.75rem 1rem',
                                  background: 'none',
                                  border: 'none',
                                  color: '#FFD700',
                                  cursor: 'pointer',
                                  textAlign: 'left',
                                  borderBottom: '1px solid rgba(212, 175, 55, 0.2)'
                                }}
                              >
                                👤 Follow
                              </button>
                              
                              <button
                                onClick={async () => {
                                  const isCurrentlySaved = savedPosts.has(postId)
                                  
                                  if (isCurrentlySaved) {
                                    // Remove from saved
                                    setSavedPosts(prev => {
                                      const newSet = new Set(prev)
                                      newSet.delete(postId)
                                      return newSet
                                    })
                                    
                                    // Remove from database
                                    try {
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
                                      })
                                      const profileResult = await profileResponse.json()
                                      const profileId = profileResult.data?.profiles?.[0]?.id
                                      
                                      await fetch(`https://ofafvhtbuhvvkhuprotc.graphql.ap-southeast-1.nhost.run/v1`, {
                                        method: 'POST',
                                        headers: {
                                          'Content-Type': 'application/json',
                                          'x-hasura-admin-secret': '2=o_TVK82F6FKyi8xcbfE9lAm,r,jpq@'
                                        },
                                        body: JSON.stringify({
                                          query: `mutation RemoveSaved($userId: uuid!, $postId: uuid!) {
                                            delete_user_saved_content(where: {user_id: {_eq: $userId}, content_id: {_eq: $postId}}) {
                                              affected_rows
                                            }
                                          }`,
                                          variables: { userId: profileId, postId: postId }
                                        })
                                      })
                                    } catch (error) {
                                      console.error('Remove saved error:', error)
                                    }
                                    
                                    alert('Post removed from saved!')
                                  } else {
                                    // Add to saved
                                    setSavedPosts(prev => new Set([...prev, postId]))
                                    
                                    // Save to database
                                    try {
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
                                      })
                                      const profileResult = await profileResponse.json()
                                      const profileId = profileResult.data?.profiles?.[0]?.id
                                      
                                      await fetch(`https://ofafvhtbuhvvkhuprotc.graphql.ap-southeast-1.nhost.run/v1`, {
                                        method: 'POST',
                                        headers: {
                                          'Content-Type': 'application/json',
                                          'x-hasura-admin-secret': '2=o_TVK82F6FKyi8xcbfE9lAm,r,jpq@'
                                        },
                                        body: JSON.stringify({
                                          query: `mutation AddSaved($userId: uuid!, $postId: uuid!) {
                                            insert_user_saved_content_one(object: {user_id: $userId, content_id: $postId, content_type: "post"}, on_conflict: {constraint: user_saved_content_user_id_content_id_content_type_key, update_columns: []}) {
                                              id
                                            }
                                          }`,
                                          variables: { userId: profileId, postId: postId }
                                        })
                                      })
                                    } catch (error) {
                                      console.error('Save post error:', error)
                                    }
                                    
                                    alert('Post saved!')
                                  }
                                  setShowDropdown(null)
                                }}
                                style={{
                                  width: '100%',
                                  padding: '0.75rem 1rem',
                                  background: 'none',
                                  border: 'none',
                                  color: '#FFD700',
                                  cursor: 'pointer',
                                  textAlign: 'left',
                                  borderBottom: '1px solid rgba(212, 175, 55, 0.2)'
                                }}
                              >
                                {savedPosts.has(postId) ? '💾 Unsave' : '💾 Save'}
                              </button>
                              
                              {isSponsoredUser && (
                                <button
                                  onClick={() => {
                                    setSelectedPostForSponsoring(post)
                                    setShowSponsorModal(true)
                                    setShowDropdown(null)
                                  }}
                                  style={{
                                    width: '100%',
                                    padding: '0.75rem 1rem',
                                    background: 'none',
                                    border: 'none',
                                    color: '#FFD700',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    borderBottom: '1px solid rgba(212, 175, 55, 0.2)'
                                  }}
                                >
                                  🎯 Sponsor this post
                                </button>
                              )}
                              
                              {post.user?.id === currentUser?.id && (
                                <button
                                  onClick={() => {
                                    if (confirm('Delete this post?')) {
                                      // Delete from database
                                      const deleteQuery = post.type === 'reel' ? 
                                        `mutation DeleteReel($id: uuid!) { delete_reels_by_pk(id: $id) { id } }` :
                                        `mutation DeletePost($id: uuid!) { delete_posts_by_pk(id: $id) { id } }`
                                      
                                      fetch(`https://ofafvhtbuhvvkhuprotc.graphql.ap-southeast-1.nhost.run/v1`, {
                                        method: 'POST',
                                        headers: {
                                          'Content-Type': 'application/json',
                                          'x-hasura-admin-secret': '2=o_TVK82F6FKyi8xcbfE9lAm,r,jpq@'
                                        },
                                        body: JSON.stringify({
                                          query: deleteQuery,
                                          variables: { id: post.id }
                                        })
                                      }).then(() => {
                                        // Remove from posts state
                                        const updatedPosts = posts.filter(p => p.id !== post.id)
                                        setPosts(updatedPosts)
                                        alert('Post deleted!')
                                      }).catch(err => {
                                        console.error('Delete failed:', err)
                                        alert('Failed to delete post')
                                      })
                                    }
                                    setShowDropdown(null)
                                  }}
                                  style={{
                                    width: '100%',
                                    padding: '0.75rem 1rem',
                                    background: 'none',
                                    border: 'none',
                                    color: '#ff4444',
                                    cursor: 'pointer',
                                    textAlign: 'left'
                                  }}
                                >
                                  🗑️ Delete
                                </button>
                              )}
                            </div>
                          )}
                          
                          {/* Emoji Picker */}
                          {showEmojiPicker === postId && (
                            <div data-emoji-picker style={{
                              position: 'absolute',
                              top: '100%',
                              right: 0,
                              background: 'rgba(0, 0, 0, 0.95)',
                              border: '2px solid rgba(255, 215, 0, 0.5)',
                              borderRadius: '12px',
                              padding: '1rem',
                              zIndex: 1001,
                              backdropFilter: 'blur(15px)',
                              boxShadow: '0 8px 32px rgba(0,0,0,0.8)',
                              minWidth: '200px'
                            }}>
                              <div style={{ color: '#FFD700', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>Select Emoji:</div>
                              <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(6, 1fr)',
                                gap: '0.5rem',
                                marginBottom: '0.75rem'
                              }}>
                                {['😀', '😂', '😍', '🥰', '😎', '🤔', '😢', '😡', '👍', '👎', '❤️', '🔥', '💯', '🎉', '😱', '🤯', '😴', '🤗'].map((emoji, index) => (
                                  <button
                                    key={index}
                                    onClick={async () => {
                                      setSelectedEmoji(emoji)
                                      setShowEmojiPicker(null)
                                      
                                      // Send emoji reaction to post author
                                      const post = posts.find(p => p.id === postId)
                                      if (post && post.user?.id && post.user.id !== currentUser?.id) {
                                        const reactionMessage = `${currentUser?.displayName} reacted to your ${post.type === 'reel' ? 'reel' : 'post'} with ${emoji}`
                                        try {
                                          await sendMessage(post.user.id, reactionMessage)
                                          console.log('Emoji reaction sent:', emoji, 'to', post.user.displayName)
                                        } catch (error) {
                                          console.error('Failed to send emoji reaction:', error)
                                        }
                                      }
                                    }}
                                    style={{
                                      background: 'rgba(255, 215, 0, 0.1)',
                                      border: '1px solid rgba(255, 215, 0, 0.3)',
                                      borderRadius: '8px',
                                      padding: '0.5rem',
                                      fontSize: '1.2rem',
                                      cursor: 'pointer',
                                      transition: 'all 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.target.style.background = 'rgba(255, 215, 0, 0.2)'
                                      e.target.style.transform = 'scale(1.1)'
                                    }}
                                    onMouseLeave={(e) => {
                                      e.target.style.background = 'rgba(255, 215, 0, 0.1)'
                                      e.target.style.transform = 'scale(1)'
                                    }}
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                              <button
                                onClick={() => setShowEmojiPicker(null)}
                                style={{
                                  width: '100%',
                                  padding: '0.5rem',
                                  background: 'rgba(255, 215, 0, 0.2)',
                                  border: '1px solid rgba(255, 215, 0, 0.5)',
                                  borderRadius: '6px',
                                  color: '#FFD700',
                                  cursor: 'pointer',
                                  fontSize: '0.8rem'
                                }}
                              >
                                Close
                              </button>
                            </div>
                          )}
                        </div>
                        
                        {/* Selected Emoji Display */}
                        {selectedEmoji && (
                          <div style={{
                            position: 'absolute',
                            top: '10px',
                            right: '10px',
                            background: 'rgba(0, 0, 0, 0.8)',
                            borderRadius: '20px',
                            padding: '0.5rem 0.75rem',
                            fontSize: '1.5rem',
                            border: '2px solid rgba(255, 215, 0, 0.5)',
                            zIndex: 100
                          }}>
                            {selectedEmoji}
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{ background: !post.imageUrl ? 'rgba(212, 175, 55, 0.1)' : '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D4AF37', position: 'relative', minHeight: '200px', maxHeight: '60vh' }}>
                      {(() => {
                        // Parse image URL for feed display
                        let feedImageUrl = post.imageUrl
                        let isFeedGallery = false
                        
                        if (typeof post.imageUrl === 'string' && post.imageUrl.includes(',')) {
                          const urlArray = post.imageUrl.split(',').map(url => url.trim()).filter(url => url.length > 0)
                          if (urlArray.length > 1) {
                            feedImageUrl = urlArray
                            isFeedGallery = true
                          } else {
                            feedImageUrl = urlArray[0] || post.imageUrl
                          }
                        } else if (Array.isArray(post.imageUrl)) {
                          feedImageUrl = post.imageUrl
                          isFeedGallery = post.imageUrl.length > 1
                        }
                        
                        return feedImageUrl ? (
                          (Array.isArray(feedImageUrl) && isFeedGallery) ? (
                            // Gallery post with multiple images
                            <div style={{ width: '100%', height: 'auto', position: 'relative' }}>
                              <div 
                                style={{
                                  display: 'flex',
                                  transform: `translateX(-${(currentPostImageIndex[postId] || 0) * 100}%)`,
                                  transition: 'transform 0.3s ease',
                                  width: '100%',
                                  height: 'auto'
                                }}
                                onTouchStart={(e) => {
                                  e.currentTarget.startX = e.touches[0].clientX
                                }}
                                onTouchEnd={(e) => {
                                  const startX = e.currentTarget.startX
                                  const endX = e.changedTouches[0].clientX
                                  const diff = startX - endX
                                  
                                  if (Math.abs(diff) > 50) {
                                    const currentIndex = currentPostImageIndex[postId] || 0
                                    if (diff > 0 && currentIndex < feedImageUrl.length - 1) {
                                      setCurrentPostImageIndex(prev => ({ ...prev, [postId]: currentIndex + 1 }))
                                    } else if (diff < 0 && currentIndex > 0) {
                                      setCurrentPostImageIndex(prev => ({ ...prev, [postId]: currentIndex - 1 }))
                                    }
                                  }
                                }}
                              >
                                {feedImageUrl.map((url, index) => (
                                  <img 
                                    key={index}
                                    src={url} 
                                    className="post-image"
                                    style={{ width: '100%', height: 'auto', maxHeight: '60vh', maxWidth: '100%', objectFit: 'contain', flexShrink: 0, background: '#000', margin: '0 auto', display: 'block' }}
                                    alt={`${post.title} - ${index + 1}`}
                                    onError={(e) => {
                                      console.log('Feed gallery image failed to load:', url)
                                      e.target.style.display = 'none'
                                    }}
                                  />
                                ))}
                              </div>
                              
                              {/* Gallery indicators */}
                              {feedImageUrl.length > 1 && (
                                <>
                                  <div style={{
                                    position: 'absolute',
                                    top: '10px',
                                    right: '10px',
                                    background: 'rgba(0,0,0,0.7)',
                                    borderRadius: '12px',
                                    padding: '4px 8px',
                                    color: '#fff',
                                    fontSize: '0.7rem'
                                  }}>
                                    {(currentPostImageIndex[postId] || 0) + 1}/{feedImageUrl.length}
                                  </div>
                                  
                                  <div style={{
                                    position: 'absolute',
                                    bottom: '10px',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    display: 'flex',
                                    gap: '4px'
                                  }}>
                                    {feedImageUrl.map((_, index) => (
                                      <div
                                        key={index}
                                        style={{
                                          width: '6px',
                                          height: '6px',
                                          borderRadius: '50%',
                                          background: index === (currentPostImageIndex[postId] || 0) ? '#FFD700' : 'rgba(255,255,255,0.5)',
                                          cursor: 'pointer'
                                        }}
                                        onClick={() => setCurrentPostImageIndex(prev => ({ ...prev, [postId]: index }))}
                                      />
                                    ))}
                                  </div>
                                  
                                  {/* Navigation arrows */}
                                  {(currentPostImageIndex[postId] || 0) > 0 && (
                                    <button
                                      onClick={() => setCurrentPostImageIndex(prev => ({ ...prev, [postId]: (prev[postId] || 0) - 1 }))}
                                      style={{
                                        position: 'absolute',
                                        left: '10px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'rgba(0,0,0,0.5)',
                                        border: 'none',
                                        borderRadius: '50%',
                                        color: '#fff',
                                        width: '30px',
                                        height: '30px',
                                        cursor: 'pointer',
                                        fontSize: '1.2rem'
                                      }}
                                    >
                                      ‹
                                    </button>
                                  )}
                                  
                                  {(currentPostImageIndex[postId] || 0) < feedImageUrl.length - 1 && (
                                    <button
                                      onClick={() => setCurrentPostImageIndex(prev => ({ ...prev, [postId]: (prev[postId] || 0) + 1 }))}
                                      style={{
                                        position: 'absolute',
                                        right: '10px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'rgba(0,0,0,0.5)',
                                        border: 'none',
                                        borderRadius: '50%',
                                        color: '#fff',
                                        width: '30px',
                                        height: '30px',
                                        cursor: 'pointer',
                                        fontSize: '1.2rem'
                                      }}
                                    >
                                      ›
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          ) : (
                            // Single image/video post
                            post.fileType === 'video' ? (
                              <video 
                                src={Array.isArray(feedImageUrl) ? feedImageUrl[0] : feedImageUrl} 
                                className="post-video"
                                style={{ width: '100%', height: 'auto', maxHeight: '60vh', maxWidth: '100%', objectFit: 'contain' }} 
                                controls
                                onClick={(e) => {
                                  const video = e.target
                                  if (video.paused) {
                                    video.play()
                                  } else {
                                    video.pause()
                                  }
                                }}
                                onError={(e) => {
                                  console.log('Feed video failed to load:', Array.isArray(feedImageUrl) ? feedImageUrl[0] : feedImageUrl)
                                }}
                              />
                            ) : (
                              <img 
                                src={Array.isArray(feedImageUrl) ? feedImageUrl[0] : feedImageUrl} 
                                className="post-image"
                                style={{ width: '100%', height: 'auto', maxHeight: '60vh', maxWidth: '100%', objectFit: 'contain', background: '#000', display: 'block', margin: '0 auto' }} 
                                alt={post.title}
                                onError={(e) => {
                                  console.log('Feed image failed to load:', Array.isArray(feedImageUrl) ? feedImageUrl[0] : feedImageUrl)
                                  e.target.style.display = 'none'
                                  e.target.parentElement.innerHTML = '<div style="color: #D4AF37; text-align: center; padding: 2rem;">📷 Image failed to load</div>'
                                }}
                              />
                            )
                          )
                        ) : (
                          '📷 ' + (post.title || 'Post')
                        )
                      })()}
                    </div>
                    <div style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.75rem' }}>
                        <HeartIcon 
                          filled={isLiked} 
                          onClick={async () => {
                            if (isDisliked) {
                              // Remove dislike first
                              try {
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
                                })
                                const profileResult = await profileResponse.json()
                                const profileId = profileResult.data?.profiles?.[0]?.id
                                
                                await fetch(`https://ofafvhtbuhvvkhuprotc.graphql.ap-southeast-1.nhost.run/v1`, {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                    'x-hasura-admin-secret': '2=o_TVK82F6FKyi8xcbfE9lAm,r,jpq@'
                                  },
                                  body: JSON.stringify({
                                    query: `mutation RemoveDislike($userId: uuid!, $postId: uuid!) {
                                      delete_dislikes(where: {user_id: {_eq: $userId}, post_id: {_eq: $postId}}) {
                                        affected_rows
                                      }
                                    }`,
                                    variables: { userId: profileId, postId: postId }
                                  })
                                })
                                
                                setDislikedPosts(prev => {
                                  const newSet = new Set(prev)
                                  newSet.delete(postId)
                                  return newSet
                                })
                                setPostDislikes(prev => ({
                                  ...prev,
                                  [postId]: Math.max(0, (prev[postId] || 0) - 1)
                                }))
                              } catch (error) {
                                console.error('❌ Remove dislike error:', error)
                              }
                            }
                            if (!currentUser?.id) {
                              console.log('❌ No current user for like')
                              return
                            }
                            
                            console.log('❤️ Like clicked:', { postId, isLiked, userId: currentUser.id })
                            
                            try {
                              // Get profile ID first
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
                              })
                              
                              const profileResult = await profileResponse.json()
                              const profileId = profileResult.data?.profiles?.[0]?.id
                              
                              if (!profileId) {
                                throw new Error('Profile not found')
                              }
                              
                              let response, result
                              
                              if (isLiked) {
                                console.log('💔 Removing like...')
                                await fetch(`https://ofafvhtbuhvvkhuprotc.graphql.ap-southeast-1.nhost.run/v1`, {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                    'x-hasura-admin-secret': '2=o_TVK82F6FKyi8xcbfE9lAm,r,jpq@'
                                  },
                                  body: JSON.stringify({
                                    query: `mutation RemoveLike($userId: uuid!, $postId: uuid!) {
                                      delete_likes(where: {user_id: {_eq: $userId}, post_id: {_eq: $postId}}) {
                                        affected_rows
                                      }
                                    }`,
                                    variables: { userId: profileId, postId: postId }
                                  })
                                })
                                
                                setLikedPosts(prev => {
                                  const newSet = new Set(prev)
                                  newSet.delete(postId)
                                  return newSet
                                })
                                setPostLikes(prev => ({
                                  ...prev,
                                  [postId]: Math.max(0, (prev[postId] || 0) - 1)
                                }))
                              } else {
                                console.log('❤️ Adding like...')
                                await fetch(`https://ofafvhtbuhvvkhuprotc.graphql.ap-southeast-1.nhost.run/v1`, {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                    'x-hasura-admin-secret': '2=o_TVK82F6FKyi8xcbfE9lAm,r,jpq@'
                                  },
                                  body: JSON.stringify({
                                    query: `mutation AddLike($userId: uuid!, $postId: uuid!) {
                                      insert_likes_one(object: {user_id: $userId, content_id: $postId, content_type: "reel"}, on_conflict: {constraint: likes_post_id_user_id_key, update_columns: []}) {
                                        id
                                      }
                                    }`,
                                    variables: { userId: profileId, postId: postId }
                                  })
                                })
                                
                                setLikedPosts(prev => new Set([...prev, postId]))
                                setPostLikes(prev => ({
                                  ...prev,
                                  [postId]: (prev[postId] || 0) + 1
                                }))
                              }
                              
                              // Note: Removed reload to keep UI state permanent
                            } catch (error) {
                              console.error('❌ Like error:', error)
                              // Revert optimistic update on error
                              await loadRealLikes()
                              await loadRealDislikes()
                            }
                          }}
                        />
                        <DislikeIcon 
                          filled={isDisliked} 
                          onClick={async () => {
                            if (isLiked) {
                              // Remove like first
                              try {
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
                                })
                                const profileResult = await profileResponse.json()
                                const profileId = profileResult.data?.profiles?.[0]?.id
                                
                                await fetch(`https://ofafvhtbuhvvkhuprotc.graphql.ap-southeast-1.nhost.run/v1`, {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                    'x-hasura-admin-secret': '2=o_TVK82F6FKyi8xcbfE9lAm,r,jpq@'
                                  },
                                  body: JSON.stringify({
                                    query: `mutation RemoveLike($userId: uuid!, $postId: uuid!) {
                                      delete_likes(where: {user_id: {_eq: $userId}, post_id: {_eq: $postId}}) {
                                        affected_rows
                                      }
                                    }`,
                                    variables: { userId: profileId, postId: postId }
                                  })
                                })
                                
                                setLikedPosts(prev => {
                                  const newSet = new Set(prev)
                                  newSet.delete(postId)
                                  return newSet
                                })
                                setPostLikes(prev => ({
                                  ...prev,
                                  [postId]: Math.max(0, (prev[postId] || 0) - 1)
                                }))
                              } catch (error) {
                                console.error('❌ Remove like error:', error)
                              }
                            }
                            
                            if (!currentUser?.id) return
                            
                            try {
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
                              })
                              
                              const profileResult = await profileResponse.json()
                              const profileId = profileResult.data?.profiles?.[0]?.id
                              
                              if (!profileId) throw new Error('Profile not found')
                              
                              if (isDisliked) {
                                // Remove dislike
                                await fetch(`https://ofafvhtbuhvvkhuprotc.graphql.ap-southeast-1.nhost.run/v1`, {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                    'x-hasura-admin-secret': '2=o_TVK82F6FKyi8xcbfE9lAm,r,jpq@'
                                  },
                                  body: JSON.stringify({
                                    query: `mutation RemoveDislike($userId: uuid!, $postId: uuid!) {
                                      delete_dislikes(where: {user_id: {_eq: $userId}, post_id: {_eq: $postId}}) {
                                        affected_rows
                                      }
                                    }`,
                                    variables: { userId: profileId, postId: postId }
                                  })
                                })
                                
                                setDislikedPosts(prev => {
                                  const newSet = new Set(prev)
                                  newSet.delete(postId)
                                  return newSet
                                })
                                setPostDislikes(prev => ({
                                  ...prev,
                                  [postId]: Math.max(0, (prev[postId] || 0) - 1)
                                }))
                              } else {
                                // Add dislike
                                await fetch(`https://ofafvhtbuhvvkhuprotc.graphql.ap-southeast-1.nhost.run/v1`, {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                    'x-hasura-admin-secret': '2=o_TVK82F6FKyi8xcbfE9lAm,r,jpq@'
                                  },
                                  body: JSON.stringify({
                                    query: `mutation AddDislike($userId: uuid!, $postId: uuid!) {
                                      insert_dislikes_one(object: {user_id: $userId, content_id: $postId, content_type: "reel"}, on_conflict: {constraint: dislikes_post_id_user_id_key, update_columns: []}) {
                                        id
                                      }
                                    }`,
                                    variables: { userId: profileId, postId: postId }
                                  })
                                })
                                
                                setDislikedPosts(prev => new Set([...prev, postId]))
                                setPostDislikes(prev => ({
                                  ...prev,
                                  [postId]: (prev[postId] || 0) + 1
                                }))
                              }
                            } catch (error) {
                              console.error('❌ Dislike error:', error)
                            }
                          }}
                        />
                        <CommentIcon onClick={() => setShowCommentModal(postId)} />
                        <ShareIcon onClick={() => {
                          setSelectedPostForSponsoring(post)
                          setShowShareModal(true)
                          setSelectedUsers(new Set())
                          setShareMessage('')
                          setShareSearchQuery('')
                        }} />
                      </div>
                      <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem' }}>
                        <div style={{ color: '#FFD700', fontSize: '0.9rem', fontWeight: '600' }}>
                          {likesCount} likes
                        </div>
                        <div style={{ color: '#ff4444', fontSize: '0.9rem', fontWeight: '600' }}>
                          {dislikesCount} dislikes
                        </div>
                        <div style={{ color: '#FFD700', fontSize: '0.9rem', fontWeight: '600' }}>
                          {postComments[postId] || 0} comments
                        </div>
                      </div>
                      <div style={{ color: '#FFD700', margin: 0, fontSize: '0.9rem' }}>
                        <strong 
                          onClick={() => {
                            console.log('Caption username clicked:', post.user, 'Current user:', currentUser?.id)
                            
                            if (post.user?.id && post.user.id !== currentUser?.id) {
                              // Find the user in users array by ID
                              let targetUser = users.find(u => u.id === post.user.id)
                              
                              // If not found by ID, try by displayName
                              if (!targetUser) {
                                targetUser = users.find(u => u.displayName === post.user.displayName)
                              }
                              
                              // Use post.user as fallback
                              if (!targetUser) {
                                targetUser = post.user
                              }
                              
                              console.log('Caption target user found:', targetUser)
                              
                              if (targetUser) {
                                // Clear any existing modal states before navigating
                                setShowFollowersModal(null)
                                setFollowersSearchQuery('')
                                setViewedUsersFromFollowers(new Set())
                                window.lastFollowersModalType = null
                                window.tempViewedUser = null
                                
                                setViewingProfile(targetUser)
                                setActiveTab('profile')
                                loadRealFollowers()
                              }
                            }
                          }}
                          style={{ 
                            cursor: post.user?.id !== currentUser?.id ? 'pointer' : 'default'
                          }}
                        >
                          {post.user?.displayName || 'User'}
                        </strong> <span style={{ color: '#D4AF37' }}>{post.content || 'Sample post caption...'}</span>
                      </div>
                    </div>
                  </div>
                )
              }) : (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#D4AF37' }}>
                  No posts yet. Start following people to see their posts!
                </div>
              )}
            </div>
          </div>
        )

      case 'search':
        const filteredUsers = users.filter(user => 
          user.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        
        return (
          <div style={{ background: 'linear-gradient(135deg, #000000, #1a1a1a, #333333)', minHeight: '100vh' }}>
            <div style={{ background: 'rgba(0, 0, 0, 0.9)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(212, 175, 55, 0.3)', padding: '1rem' }}>
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(212, 175, 55, 0.5)',
                  background: 'rgba(0, 0, 0, 0.7)',
                  color: '#FFD700',
                  fontSize: '1rem'
                }}
              />
            </div>
            
            <div style={{ padding: '1rem' }}>
              {searchQuery && filteredUsers.length > 0 ? filteredUsers.map((user, i) => {
                const userId = user.id || i
                const isFollowing = following.has(userId)
                
                return (
                  <div 
                    key={userId} 
                    onClick={() => {
                      // Add to recent searches
                      setRecentSearches(prev => {
                        const filtered = prev.filter(u => u.id !== user.id)
                        return [user, ...filtered].slice(0, 10)
                      })
                      // Clear any existing modal states before navigating
                      setShowFollowersModal(null)
                      setFollowersSearchQuery('')
                      setViewedUsersFromFollowers(new Set())
                      window.lastFollowersModalType = null
                      window.tempViewedUser = null
                      
                      setViewingProfile(user)
                      setActiveTab('profile')
                      loadRealFollowers()
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0.75rem 0',
                      borderBottom: '1px solid rgba(212, 175, 55, 0.2)',
                      cursor: 'pointer'
                    }}>
                    <div 
                      onClick={() => {
                        const userStories = stories.filter(story => story.user?.authId === user.id || story.user_id === user.id)
                        if (userStories.length > 0) {
                          setUserStories(userStories)
                          setCurrentStoryIndex(0)
                          setShowStoryModal(userStories[0])
                        }
                      }}
                      style={{ 
                        width: '44px', 
                        height: '44px', 
                        borderRadius: '50%', 
                        background: 'linear-gradient(45deg, #FFD700, #FFA500)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        color: '#000', 
                        marginRight: '0.75rem', 
                        fontSize: '0.9rem', 
                        fontWeight: 'bold', 
                        overflow: 'hidden',
                        border: stories.some(story => story.user?.authId === user.id || story.user_id === user.id) ? '3px solid #FF6B6B' : '3px solid transparent',
                        cursor: stories.some(story => story.user?.authId === user.id || story.user_id === user.id) ? 'pointer' : 'default'
                      }}>
                      {user.avatarUrl ? (
                        <>
                          <img 
                            src={user.avatarUrl} 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            alt={user.displayName}
                            onError={(e) => {
                              e.target.style.display = 'none'
                              e.target.nextSibling.style.display = 'flex'
                            }}
                          />
                          <span style={{ 
                            display: 'none',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '100%',
                            height: '100%',
                            position: 'absolute'
                          }}>
                            {(user.displayName || 'User')[0]?.toUpperCase()}
                          </span>
                        </>
                      ) : (
                        (user.displayName || 'User')[0]?.toUpperCase()
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: '#FFD700', fontWeight: '600', fontSize: '0.9rem' }}>
                        {user.displayName || user.email?.split('@')[0] || 'User'}
                      </div>

                      <div style={{ color: '#D4AF37', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>{followers[userId] || 0} followers</span>
                        <span style={{ color: onlineUsers.has(user.id) ? '#00ff00' : '#888' }}>
                          • {onlineUsers.has(user.id) ? 'Online' : 'Offline'}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              }) : searchQuery ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#D4AF37' }}>
                  No users found for "{searchQuery}"
                </div>
              ) : recentSearches.length > 0 ? (
                <div>
                  <h3 style={{ color: '#FFD700', fontSize: '1rem', marginBottom: '1rem' }}>Recent Searches</h3>
                  {recentSearches.map((user, i) => {
                    const userId = user.id || i
                    return (
                      <div 
                        key={userId} 
                        onClick={() => {
                          // Clear any existing modal states before navigating
                          setShowFollowersModal(null)
                          setFollowersSearchQuery('')
                          setViewedUsersFromFollowers(new Set())
                          window.lastFollowersModalType = null
                          window.tempViewedUser = null
                          
                          setViewingProfile(user)
                          setActiveTab('profile')
                          loadRealFollowers()
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '0.75rem 0',
                          borderBottom: '1px solid rgba(212, 175, 55, 0.2)',
                          cursor: 'pointer'
                        }}>
                        <div 
                          onClick={(e) => {
                            e.stopPropagation()
                            const userStories = stories.filter(story => story.user?.authId === user.id || story.user_id === user.id)
                            if (userStories.length > 0) {
                              setUserStories(userStories)
                              setCurrentStoryIndex(0)
                              setShowStoryModal(userStories[0])
                            }
                          }}
                          style={{ 
                            width: '44px', 
                            height: '44px', 
                            borderRadius: '50%', 
                            background: 'linear-gradient(45deg, #FFD700, #FFA500)', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            color: '#000', 
                            marginRight: '0.75rem', 
                            fontSize: '0.9rem', 
                            fontWeight: 'bold', 
                            overflow: 'hidden',
                            border: stories.some(story => story.user?.authId === user.id || story.user_id === user.id) ? '3px solid #FF6B6B' : '3px solid transparent',
                            cursor: stories.some(story => story.user?.authId === user.id || story.user_id === user.id) ? 'pointer' : 'default'
                          }}>
                          {user.avatarUrl ? (
                            <img 
                              src={user.avatarUrl} 
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              alt={user.displayName}
                            />
                          ) : (
                            (user.displayName || 'User')[0]?.toUpperCase()
                          )}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ color: '#FFD700', fontWeight: '600', fontSize: '0.9rem' }}>
                            {user.displayName || user.email?.split('@')[0] || 'User'}
                          </div>
                          <div style={{ color: '#D4AF37', fontSize: '0.7rem' }}>
                            {followers[userId] || 0} followers
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setRecentSearches(prev => prev.filter(u => u.id !== user.id))
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#D4AF37',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            padding: '0.25rem'
                          }}
                        >
                          ×
                        </button>
                      </div>
                    )
                  })}
                  <button
                    onClick={() => setRecentSearches([])}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: 'none',
                      border: '1px solid rgba(212, 175, 55, 0.3)',
                      borderRadius: '8px',
                      color: '#D4AF37',
                      cursor: 'pointer',
                      marginTop: '1rem'
                    }}
                  >
                    Clear All
                  </button>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#D4AF37' }}>
                  Search for users...
                </div>
              )}
            </div>
          </div>
        )

      case 'reels':
        const reels = posts.filter(post => post.type === 'reel')
        
        return (
          <div style={{ 
            background: '#000', 
            minHeight: '100vh', 
            position: 'relative',
            overflow: 'hidden'
          }}>
            {reels.length > 0 ? (
              <div 
                style={{
                  height: '100vh',
                  overflowY: 'auto',
                  scrollSnapType: 'y mandatory',
                  scrollBehavior: 'smooth'
                }}
                onScroll={(e) => {
                  const scrollTop = e.target.scrollTop
                  const itemHeight = window.innerHeight
                  const newIndex = Math.round(scrollTop / itemHeight)
                  
                  if (newIndex !== currentReelIndex && newIndex >= 0 && newIndex < reels.length) {
                    setCurrentReelIndex(newIndex)
                    
                    // Immediately stop all videos
                    const allVideos = document.querySelectorAll('.reel-video')
                    allVideos.forEach((video, idx) => {
                      if (idx !== newIndex) {
                        video.pause()
                        video.muted = true
                      }
                    })
                    
                    // Play current video
                    const currentVideo = allVideos[newIndex]
                    if (currentVideo && !manuallyPausedReels.has(reels[newIndex]?.id)) {
                      currentVideo.currentTime = 0
                      currentVideo.muted = false
                      currentVideo.play().catch(() => {
                        currentVideo.muted = true
                        currentVideo.play().catch(() => {})
                      })
                    }
                  }
                }}
              >
                {reels.map((reel, index) => {
                  const reelId = reel.id || index
                  const isLiked = likedPosts.has(reelId)
                  const isDisliked = dislikedPosts.has(reelId)
                  const likesCount = postLikes[reelId] || 0
                  const dislikesCount = postDislikes[reelId] || 0
                  const commentsCount = postComments[reelId] || 0
                  
                  return (
                    <div 
                      key={reelId}
                      style={{
                        height: '100vh',
                        width: '100%',
                        position: 'relative',
                        scrollSnapAlign: 'start',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#000'
                      }}
                    >
                      {/* Video */}
                      {reel.imageUrl ? (
                        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                          <video 
                            className="reel-video"
                            ref={(video) => {
                              if (video) {
                                video.loop = true
                                video.playsInline = true
                                video.preload = 'none'
                                video.muted = true
                                
                                if (index === currentReelIndex && !manuallyPausedReels.has(reelId)) {
                                  video.muted = false
                                  video.play().catch(() => {
                                    video.muted = true
                                    video.play().catch(() => {})
                                  })
                                }
                              }
                            }}
                            src={reel.imageUrl}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'contain'
                            }}
                            loop
                            playsInline
                            controls={false}
                            onClick={(e) => {
                              handleReelTap(e)
                              
                              const video = e.target
                              if (video.paused) {
                                setManuallyPausedReels(prev => {
                                  const newSet = new Set(prev)
                                  newSet.delete(reelId)
                                  return newSet
                                })
                                video.muted = false
                                video.play().catch(() => {
                                  video.muted = true
                                  video.play().catch(() => {})
                                })
                              } else {
                                setManuallyPausedReels(prev => new Set([...prev, reelId]))
                                video.pause()
                              }
                            }}
                          />
                          
                          <div
                            style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              zIndex: 5,
                              pointerEvents: 'none',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <div 
                              ref={(iconDiv) => {
                                if (iconDiv) {
                                  const video = iconDiv.parentElement.parentElement.querySelector('.reel-video')
                                  if (video) {
                                    const updateIcon = () => {
                                      iconDiv.style.display = video.paused ? 'flex' : 'none'
                                    }
                                    video.addEventListener('play', updateIcon)
                                    video.addEventListener('pause', updateIcon)
                                    updateIcon()
                                  }
                                }
                              }}
                              style={{
                                background: 'rgba(0,0,0,0.7)',
                                borderRadius: '50%',
                                width: '100px',
                                height: '100px',
                                display: 'none',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '3rem',
                                color: '#fff',
                                pointerEvents: 'none',
                                border: '3px solid rgba(255,255,255,0.8)'
                              }}
                            >
                              ▶
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div style={{
                          width: '100%',
                          height: '100%',
                          background: 'linear-gradient(45deg, #000, #333)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#FFD700',
                          fontSize: '3rem'
                        }}>
                          🎥
                        </div>
                      )}
                      
                      {/* User Info Overlay */}
                      <div style={{
                        position: 'absolute',
                        bottom: '100px',
                        left: '1rem',
                        right: '80px',
                        color: '#fff',
                        zIndex: 10
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                          <div 
                            onClick={() => {
                              const displayUser = (reel.sponsoredBy || reel.sponsored_by) ? 
                                users.find(u => u.displayName === (reel.sponsoredBy || reel.sponsored_by)) : 
                                reel.user
                              
                              if (displayUser) {
                                const userStories = stories.filter(story => story.user?.authId === displayUser.id || story.user_id === displayUser.id)
                                if (userStories.length > 0) {
                                  setUserStories(userStories)
                                  setCurrentStoryIndex(0)
                                  setShowStoryModal(userStories[0])
                                }
                              }
                            }}
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%',
                              background: 'linear-gradient(45deg, #FFD700, #FFA500)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#000',
                              fontWeight: 'bold',
                              overflow: 'hidden',
                              cursor: 'pointer'
                            }}>
                            {(() => {
                              const displayUser = (reel.sponsoredBy || reel.sponsored_by) ? 
                                users.find(u => u.displayName === (reel.sponsoredBy || reel.sponsored_by)) : 
                                reel.user
                              return displayUser?.avatarUrl ? (
                                <img 
                                  src={displayUser.avatarUrl} 
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  alt={displayUser.displayName}
                                />
                              ) : (
                                (displayUser?.displayName || 'U')[0]?.toUpperCase()
                              )
                            })()}
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <span 
                                onClick={() => {
                                  console.log('Reel username clicked:', reel.user, 'Current user:', currentUser?.id)
                                  
                                  if (reel.sponsoredBy || reel.sponsored_by) {
                                    const sponsorUser = users.find(u => u.displayName === (reel.sponsoredBy || reel.sponsored_by))
                                    console.log('Found reel sponsor user:', sponsorUser)
                                    if (sponsorUser) {
                                      setViewingProfile(sponsorUser)
                                      setActiveTab('profile')
                                      loadRealFollowers()
                                    }
                                  } else if (reel.user?.id && reel.user.id !== currentUser?.id) {
                                    // Find the user in users array by ID
                                    let targetUser = users.find(u => u.id === reel.user.id)
                                    
                                    // If not found by ID, try by displayName
                                    if (!targetUser) {
                                      targetUser = users.find(u => u.displayName === reel.user.displayName)
                                    }
                                    
                                    // Use reel.user as fallback
                                    if (!targetUser) {
                                      targetUser = reel.user
                                    }
                                    
                                    console.log('Reel target user found:', targetUser)
                                    
                                    if (targetUser) {
                                      // Clear any existing modal states before navigating
                                      setShowFollowersModal(null)
                                      setFollowersSearchQuery('')
                                      setViewedUsersFromFollowers(new Set())
                                      window.lastFollowersModalType = null
                                      window.tempViewedUser = null
                                      
                                      setViewingProfile(targetUser)
                                      setActiveTab('profile')
                                      loadRealFollowers()
                                    }
                                  }
                                }}
                                style={{ fontWeight: 'bold', fontSize: '0.9rem', cursor: 'pointer' }}
                              >
                                {(reel.sponsoredBy || reel.sponsored_by) ? (reel.sponsoredBy || reel.sponsored_by) : (reel.user?.displayName || 'User')}
                              </span>
                              {(reel.sponsoredBy || reel.sponsored_by) && (
                                <span style={{ 
                                  color: '#ff6b35', 
                                  fontSize: '0.8rem',
                                  fontWeight: 'bold'
                                }}>
                                  ✓
                                </span>
                              )}
                            </div>
                            {(reel.sponsoredBy || reel.sponsored_by) && (
                              <div style={{ 
                                fontSize: '0.7rem', 
                                opacity: 0.9,
                                fontStyle: 'italic',
                                color: '#FFD700'
                              }}>
                                Sponsored
                              </div>
                            )}
                            <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                              {(() => {
                                const displayUser = (reel.sponsoredBy || reel.sponsored_by) ? 
                                  users.find(u => u.displayName === (reel.sponsoredBy || reel.sponsored_by)) : 
                                  reel.user
                                return followers[displayUser?.id] || 0
                              })()} followers
                            </div>
                          </div>
                          {reel.user?.id !== currentUser?.id && (
                            <button
                              style={{
                                background: following.has(reel.user?.id) ? 'rgba(255,255,255,0.2)' : '#fff',
                                color: following.has(reel.user?.id) ? '#fff' : '#000',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '0.25rem 0.75rem',
                                fontSize: '0.8rem',
                                fontWeight: 'bold',
                                cursor: 'pointer'
                              }}
                            >
                              {following.has(reel.user?.id) ? 'Following' : 'Follow'}
                            </button>
                          )}
                        </div>
                        
                        {reel.content && (
                          <div style={{
                            fontSize: '0.9rem',
                            lineHeight: 1.3,
                            marginBottom: '0.5rem',
                            textShadow: '0 1px 2px rgba(0,0,0,0.8)'
                          }}>
                            {reel.content}
                          </div>
                        )}
                      </div>
                      
                      {/* Reel Action Buttons */}
                      <div style={{
                        position: 'absolute',
                        right: '1rem',
                        bottom: '120px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem',
                        alignItems: 'center',
                        zIndex: 10
                      }}>
                        {/* Swipe Down Button */}
                        {index < reels.length - 1 && (
                          <button
                            onClick={() => {
                              const container = document.querySelector('[style*="overflowY: auto"]')
                              if (container) {
                                container.scrollTo({
                                  top: (index + 1) * window.innerHeight,
                                  behavior: 'smooth'
                                })
                              }
                            }}
                            style={{
                              background: 'rgba(0,0,0,0.7)',
                              border: '2px solid rgba(255,255,255,0.3)',
                              borderRadius: '50%',
                              width: '40px',
                              height: '40px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              color: '#fff'
                            }}
                          >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="6,9 12,15 18,9"/>
                            </svg>
                          </button>
                        )}
                        {/* Like Button */}
                        <div style={{ textAlign: 'center', position: 'relative' }}>
                          {/* Emoji Display Above Like Button */}
                          {sharedContentReactions[reelId] && (
                            <div style={{
                              position: 'absolute',
                              top: '-50px',
                              left: '50%',
                              transform: 'translateX(-50%)',
                              background: 'rgba(0,0,0,0.8)',
                              borderRadius: '20px',
                              padding: '0.5rem 0.75rem',
                              fontSize: '1.8rem',
                              border: '2px solid rgba(255,215,0,0.5)',
                              zIndex: 100,
                              animation: 'pulse 2s infinite',
                              boxShadow: '0 4px 15px rgba(0,0,0,0.5)'
                            }}>
                              {sharedContentReactions[reelId]}
                            </div>
                          )}
                          <button
                            onClick={async () => {
                              if (!currentUser?.id) return
                              
                              // If reel is disliked, remove dislike first
                              if (dislikedPosts.has(reelId)) {
                                try {
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
                                  })
                                  const profileResult = await profileResponse.json()
                                  const profileId = profileResult.data?.profiles?.[0]?.id
                                  
                                  await fetch(`https://ofafvhtbuhvvkhuprotc.graphql.ap-southeast-1.nhost.run/v1`, {
                                    method: 'POST',
                                    headers: {
                                      'Content-Type': 'application/json',
                                      'x-hasura-admin-secret': '2=o_TVK82F6FKyi8xcbfE9lAm,r,jpq@'
                                    },
                                    body: JSON.stringify({
                                      query: `mutation RemoveDislike($userId: uuid!, $postId: uuid!) {
                                        delete_dislikes(where: {user_id: {_eq: $userId}, post_id: {_eq: $postId}}) {
                                          affected_rows
                                        }
                                      }`,
                                      variables: { userId: profileId, postId: reelId }
                                    })
                                  })
                                  
                                  setDislikedPosts(prev => {
                                    const newSet = new Set(prev)
                                    newSet.delete(reelId)
                                    return newSet
                                  })
                                  setPostDislikes(prev => ({
                                    ...prev,
                                    [reelId]: Math.max(0, (prev[reelId] || 0) - 1)
                                  }))
                                } catch (error) {
                                  console.error('Remove dislike error:', error)
                                }
                              }
                              
                              try {
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
                                })
                                
                                const profileResult = await profileResponse.json()
                                const profileId = profileResult.data?.profiles?.[0]?.id
                                
                                if (isLiked) {
                                  await fetch(`https://ofafvhtbuhvvkhuprotc.graphql.ap-southeast-1.nhost.run/v1`, {
                                    method: 'POST',
                                    headers: {
                                      'Content-Type': 'application/json',
                                      'x-hasura-admin-secret': '2=o_TVK82F6FKyi8xcbfE9lAm,r,jpq@'
                                    },
                                    body: JSON.stringify({
                                      query: `mutation RemoveLike($userId: uuid!, $postId: uuid!) {
                                        delete_likes(where: {user_id: {_eq: $userId}, post_id: {_eq: $postId}}) {
                                          affected_rows
                                        }
                                      }`,
                                      variables: { userId: profileId, postId: reelId }
                                    })
                                  })
                                  setLikedPosts(prev => {
                                    const newSet = new Set(prev)
                                    newSet.delete(reelId)
                                    return newSet
                                  })
                                  setPostLikes(prev => ({
                                    ...prev,
                                    [reelId]: Math.max(0, (prev[reelId] || 0) - 1)
                                  }))
                                } else {
                                  await fetch(`https://ofafvhtbuhvvkhuprotc.graphql.ap-southeast-1.nhost.run/v1`, {
                                    method: 'POST',
                                    headers: {
                                      'Content-Type': 'application/json',
                                      'x-hasura-admin-secret': '2=o_TVK82F6FKyi8xcbfE9lAm,r,jpq@'
                                    },
                                    body: JSON.stringify({
                                      query: `mutation AddLike($userId: uuid!, $postId: uuid!) {
                                        insert_likes_one(object: {user_id: $userId, content_id: $postId, content_type: "reel"}, on_conflict: {constraint: likes_post_id_user_id_key, update_columns: []}) {
                                          id
                                        }
                                      }`,
                                      variables: { userId: profileId, postId: reelId }
                                    })
                                  })
                                  setLikedPosts(prev => new Set([...prev, reelId]))
                                  setPostLikes(prev => ({
                                    ...prev,
                                    [reelId]: (prev[reelId] || 0) + 1
                                  }))
                                }
                              } catch (error) {
                                console.error('Like error:', error)
                              }
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '0.5rem'
                            }}
                          >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill={isLiked ? '#ff3040' : 'none'} stroke={isLiked ? '#ff3040' : '#fff'} strokeWidth="2">
                              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                            </svg>
                          </button>
                          <div style={{ color: '#fff', fontSize: '0.7rem' }}>{likesCount}</div>
                        </div>
                        
                        {/* Comment Button */}
                        <div style={{ textAlign: 'center' }}>
                          <button
                            onClick={() => setShowCommentModal(reelId)}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '0.5rem'
                            }}
                          >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                            </svg>
                          </button>
                          <div style={{ color: '#fff', fontSize: '0.7rem' }}>{commentsCount}</div>
                        </div>
                        
                        {/* Share Button */}
                        <div style={{ textAlign: 'center' }}>
                          <button
                            onClick={() => {
                              setSelectedPostForSponsoring(reel)
                              setShowShareModal(true)
                              setSelectedUsers(new Set())
                              setShareMessage('')
                              setShareSearchQuery('')
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '0.5rem'
                            }}
                          >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                              <circle cx="18" cy="5" r="3"/>
                              <circle cx="6" cy="12" r="3"/>
                              <circle cx="18" cy="19" r="3"/>
                              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                            </svg>
                          </button>
                        </div>
                        
                        {/* Three Dots Menu */}
                        <div className="dropdown-container" style={{ textAlign: 'center', position: 'relative' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setShowDropdown(showDropdown === reelId ? null : reelId)
                            }}
                            style={{
                              background: 'rgba(0,0,0,0.7)',
                              border: '2px solid rgba(255,255,255,0.3)',
                              borderRadius: '50%',
                              cursor: 'pointer',
                              padding: '0.5rem',
                              width: '40px',
                              height: '40px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff">
                              <circle cx="12" cy="5" r="2"/>
                              <circle cx="12" cy="12" r="2"/>
                              <circle cx="12" cy="19" r="2"/>
                            </svg>
                          </button>
                          
                          {showDropdown === reelId && (
                            <div style={{
                              position: 'fixed',
                              bottom: '20px',
                              right: '20px',
                              background: 'rgba(0, 0, 0, 0.95)',
                              border: '2px solid rgba(255, 255, 255, 0.3)',
                              borderRadius: '12px',
                              minWidth: '200px',
                              zIndex: 9999,
                              backdropFilter: 'blur(15px)',
                              boxShadow: '0 8px 32px rgba(0,0,0,0.8)'
                            }}>

                              <button
                                onClick={async () => {
                                  try {
                                    const response = await fetch(reel.imageUrl)
                                    const blob = await response.blob()
                                    const url = window.URL.createObjectURL(blob)
                                    const a = document.createElement('a')
                                    a.href = url
                                    a.download = `reel_${reelId}.mp4`
                                    document.body.appendChild(a)
                                    a.click()
                                    document.body.removeChild(a)
                                    window.URL.revokeObjectURL(url)
                                    alert('Reel downloaded!')
                                  } catch (error) {
                                    alert('Download failed. Please try again.')
                                  }
                                  setShowDropdown(null)
                                }}
className="reel-menu-btn"
                                style={{
                                  width: '100%',
                                  padding: '1rem 1.5rem',
                                  background: 'none',
                                  border: 'none',
                                  color: '#fff',
                                  cursor: 'pointer',
                                  textAlign: 'left',
                                  borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
                                  fontSize: '0.9rem',
                                  fontWeight: '500'
                                }}
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '0.5rem' }}>
                                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                  <polyline points="7,10 12,15 17,10"/>
                                  <line x1="12" y1="15" x2="12" y2="3"/>
                                </svg>
                                Download
                              </button>
                              

                              

                              

                              
                              <button
                                onClick={async () => {
                                  console.log('💾 Reel save button clicked for reel:', reelId)
                                  console.log('💾 Current saved posts:', Array.from(savedPosts))
                                  const isCurrentlySaved = savedPosts.has(reelId)
                                  console.log('💾 Is currently saved:', isCurrentlySaved)
                                  
                                  if (isCurrentlySaved) {
                                    // Remove from saved
                                    setSavedPosts(prev => {
                                      const newSet = new Set(prev)
                                      newSet.delete(reelId)
                                      return newSet
                                    })
                                    
                                    // Remove from database
                                    try {
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
                                      })
                                      const profileResult = await profileResponse.json()
                                      const profileId = profileResult.data?.profiles?.[0]?.id
                                      
                                      await fetch(`https://ofafvhtbuhvvkhuprotc.graphql.ap-southeast-1.nhost.run/v1`, {
                                        method: 'POST',
                                        headers: {
                                          'Content-Type': 'application/json',
                                          'x-hasura-admin-secret': '2=o_TVK82F6FKyi8xcbfE9lAm,r,jpq@'
                                        },
                                        body: JSON.stringify({
                                          query: `mutation RemoveSaved($userId: uuid!, $postId: uuid!) {
                                            delete_user_saved_content(where: {user_id: {_eq: $userId}, post_id: {_eq: $postId}}) {
                                              affected_rows
                                            }
                                          }`,
                                          variables: { userId: profileId, postId: reelId }
                                        })
                                      })
                                    } catch (error) {
                                      console.error('Remove saved error:', error)
                                    }
                                    
                                    alert('Reel removed from saved!')
                                  } else {
                                    // Add to saved
                                    setSavedPosts(prev => new Set([...prev, reelId]))
                                    
                                    // Save to database
                                    try {
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
                                      })
                                      const profileResult = await profileResponse.json()
                                      const profileId = profileResult.data?.profiles?.[0]?.id
                                      
                                      await fetch(`https://ofafvhtbuhvvkhuprotc.graphql.ap-southeast-1.nhost.run/v1`, {
                                        method: 'POST',
                                        headers: {
                                          'Content-Type': 'application/json',
                                          'x-hasura-admin-secret': '2=o_TVK82F6FKyi8xcbfE9lAm,r,jpq@'
                                        },
                                        body: JSON.stringify({
                                          query: `mutation AddSaved($userId: uuid!, $postId: uuid!) {
                                            insert_user_saved_content_one(object: {user_id: $userId, content_id: $postId, content_type: "reel"}, on_conflict: {constraint: user_saved_content_user_id_content_id_content_type_key, update_columns: []}) {
                                              id
                                            }
                                          }`,
                                          variables: { userId: profileId, postId: reelId }
                                        })
                                      })
                                    } catch (error) {
                                      console.error('Save reel error:', error)
                                    }
                                    
                                    alert('Reel saved!')
                                  }
                                  
                                  // Refresh saved posts to ensure UI is updated
                                  await loadSavedPosts()
                                  console.log('💾 Saved posts refreshed after save operation')
                                  setShowDropdown(null)
                                }}
                                style={{
                                  width: '100%',
                                  padding: '0.75rem 1rem',
                                  background: 'none',
                                  border: 'none',
                                  color: '#fff',
                                  cursor: 'pointer',
                                  textAlign: 'left',
                                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                                }}
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill={savedPosts.has(reelId) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" style={{ marginRight: '0.5rem' }}>
                                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                                </svg>
                                {savedPosts.has(reelId) ? 'Unsave' : 'Save'}
                              </button>
                              
                              <button
                                onClick={() => {
                                  alert('Report feature coming soon!')
                                  setShowDropdown(null)
                                }}
                                style={{
                                  width: '100%',
                                  padding: '0.75rem 1rem',
                                  background: 'none',
                                  border: 'none',
                                  color: '#fff',
                                  cursor: 'pointer',
                                  textAlign: 'left'
                                }}
                              >
                                🚫 Report
                              </button>
                            </div>
                          )}
                          
                          {/* Emoji Picker for Reels */}
                          {showEmojiPicker === reelId && (
                            <div data-emoji-picker style={{
                              position: 'fixed',
                              bottom: '20px',
                              right: '20px',
                              background: 'rgba(0, 0, 0, 0.95)',
                              border: '2px solid rgba(255, 215, 0, 0.5)',
                              borderRadius: '12px',
                              padding: '1rem',
                              zIndex: 10000,
                              backdropFilter: 'blur(15px)',
                              boxShadow: '0 8px 32px rgba(0,0,0,0.8)',
                              minWidth: '200px'
                            }}>
                              <div style={{ color: '#FFD700', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>Select Emoji:</div>
                              <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(6, 1fr)',
                                gap: '0.5rem',
                                marginBottom: '0.75rem'
                              }}>
                                {['😀', '😂', '😍', '🥰', '😎', '🤔', '😢', '😡', '👍', '👎', '❤️', '🔥', '💯', '🎉', '😱', '🤯', '😴', '🤗'].map((emoji, index) => (
                                  <button
                                    key={index}
                                    onClick={() => {
                                      // Store emoji reaction for this specific reel
                                      setSharedContentReactions(prev => ({
                                        ...prev,
                                        [reelId]: emoji
                                      }))
                                      setShowEmojiPicker(null)
                                    }}
                                    style={{
                                      background: 'rgba(255, 215, 0, 0.1)',
                                      border: '1px solid rgba(255, 215, 0, 0.3)',
                                      borderRadius: '8px',
                                      padding: '0.5rem',
                                      fontSize: '1.2rem',
                                      cursor: 'pointer',
                                      transition: 'all 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.target.style.background = 'rgba(255, 215, 0, 0.2)'
                                      e.target.style.transform = 'scale(1.1)'
                                    }}
                                    onMouseLeave={(e) => {
                                      e.target.style.background = 'rgba(255, 215, 0, 0.1)'
                                      e.target.style.transform = 'scale(1)'
                                    }}
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                              <button
                                onClick={() => setShowEmojiPicker(null)}
                                style={{
                                  width: '100%',
                                  padding: '0.5rem',
                                  background: 'rgba(255, 215, 0, 0.2)',
                                  border: '1px solid rgba(255, 215, 0, 0.5)',
                                  borderRadius: '6px',
                                  color: '#FFD700',
                                  cursor: 'pointer',
                                  fontSize: '0.8rem'
                                }}
                              >
                                Close
                              </button>
                            </div>
                          )}
                        </div>
                        
                        {/* Selected Emoji Display for Reels */}
                        {selectedEmoji && (
                          <div style={{
                            position: 'absolute',
                            top: '20px',
                            right: '20px',
                            background: 'rgba(0, 0, 0, 0.8)',
                            borderRadius: '20px',
                            padding: '0.5rem 0.75rem',
                            fontSize: '2rem',
                            border: '2px solid rgba(255, 215, 0, 0.5)',
                            zIndex: 100
                          }}>
                            {selectedEmoji}
                          </div>
                        )}
                      </div>
                      

                    </div>
                  )
                })}
              </div>
            ) : (
              <div style={{
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFD700',
                textAlign: 'center',
                padding: '2rem'
              }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎥</div>
                <h2 style={{ color: '#FFD700', marginBottom: '1rem' }}>No Reels Yet</h2>
                <p style={{ color: '#D4AF37', marginBottom: '2rem' }}>Start creating reels to see them here!</p>
                <button
                  onClick={() => {
                    setUploadType('reel')
                    setShowUploadModal(true)
                  }}
                  style={{
                    background: 'linear-gradient(45deg, #FFD700, #FFA500)',
                    border: 'none',
                    borderRadius: '25px',
                    padding: '0.75rem 1.5rem',
                    color: '#000',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    fontSize: '1rem'
                  }}
                >
                  Create Your First Reel
                </button>
              </div>
            )}
          </div>
        )

      case 'messages':
        // Redirect to home if chat is hidden
        if (hideChatFromSettings) {
          setActiveTab('home')
          return null
        }
        
        const chatUsers = Object.keys(chatMessages).map(userId => {
          let user = users.find(u => u.id === userId)
          
          // If user not found in users array, create a placeholder
          if (!user) {
            user = {
              id: userId,
              displayName: 'User',
              avatarUrl: null,
              email: 'user@example.com'
            }
            console.log('⚠️ User not found in users array, using placeholder:', userId)
          }
          
          const messages = chatMessages[userId] || []
          const lastMessage = messages[messages.length - 1]
          return { user, lastMessage, messages }
        }).filter(chat => chat.user)
        
        return (
          <div style={{ padding: '1rem', background: 'linear-gradient(135deg, #000000, #1a1a1a, #333333)', minHeight: '100vh' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFD700" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              <h2 style={{ color: '#FFD700', margin: 0 }}>Messages</h2>
            </div>
            
            {chatUsers.length > 0 ? chatUsers.map((chat, i) => (
              <div 
                key={chat.user.id} 
                onClick={() => setShowChatModal(chat.user)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '1rem',
                  background: 'rgba(212, 175, 55, 0.1)',
                  border: '1px solid rgba(212, 175, 55, 0.3)',
                  borderRadius: '12px',
                  marginBottom: '0.5rem',
                  cursor: 'pointer'
                }}
              >
                <div 
                  onClick={(e) => {
                    e.stopPropagation()
                    const userStories = stories.filter(story => story.user?.authId === chat.user.id || story.user_id === chat.user.id)
                    if (userStories.length > 0) {
                      setUserStories(userStories)
                      setCurrentStoryIndex(0)
                      setShowStoryModal(userStories[0])
                    }
                  }}
                  style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    background: 'linear-gradient(45deg, #FFD700, #FFA500)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#000',
                    marginRight: '1rem',
                    fontWeight: 'bold',
                    overflow: 'hidden',
                    border: stories.some(story => story.user?.authId === chat.user.id || story.user_id === chat.user.id) ? '3px solid #8B0000' : '3px solid transparent',
                    cursor: stories.some(story => story.user?.authId === chat.user.id || story.user_id === chat.user.id) ? 'pointer' : 'default'
                  }}>
                  {chat.user.avatarUrl ? (
                    <img 
                      src={chat.user.avatarUrl} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      alt={chat.user.displayName}
                    />
                  ) : (
                    (chat.user.displayName || 'U')[0]?.toUpperCase()
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#FFD700', fontWeight: '600' }}>
                    {chat.user.displayName || 'User'}
                  </div>
                  <div style={{ color: '#D4AF37', fontSize: '0.9rem' }}>
                    {chat.lastMessage ? (
                      chat.lastMessage.text.includes('[REEL_PREVIEW:') ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span>🎥</span>
                          <span>Shared a reel</span>
                        </div>
                      ) : chat.lastMessage.text.includes('[POST_PREVIEW:') ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span>📸</span>
                          <span>Shared a post</span>
                        </div>
                      ) : (
                        chat.lastMessage.text
                      )
                    ) : (
                      'Start a conversation'
                    )}
                  </div>
                </div>
                <div style={{ color: '#D4AF37', fontSize: '0.8rem' }}>
                  {chat.lastMessage ? new Date(chat.lastMessage.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                </div>
              </div>
            )) : (
              <div style={{
                textAlign: 'center',
                color: '#D4AF37',
                padding: '2rem',
                fontSize: '0.9rem'
              }}>
                No messages yet. Start a conversation by visiting someone's profile!
              </div>
            )}
          </div>
        )

      case 'profile':
        const profileUser = viewingProfile || currentUser
        const isMyProfile = !viewingProfile || viewingProfile.id === currentUser?.id
        
        console.log('Profile case - currentUser:', currentUser)
        console.log('Profile case - viewingProfile:', viewingProfile)
        console.log('Profile case - profileUser:', profileUser)
        console.log('Profile case - isMyProfile:', isMyProfile)
        
        // Show loading if no user data
        if (!profileUser) {
          return (
            <div style={{ padding: '2rem', textAlign: 'center', background: currentThemeConfig.bg, minHeight: '100vh' }}>
              <div style={{ color: currentThemeConfig.accent, fontSize: '1.2rem' }}>Loading profile...</div>
            </div>
          )
        }
        
        return (
          <div style={{ padding: '1rem', background: currentThemeConfig.bg, minHeight: '100vh' }}>
            {/* Profile Header with Menu/Back Button */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0' }}>
              {!isMyProfile && (
                <button
                  onClick={() => {
                    setViewingProfile(null)
                    // Clear ALL modal tracking variables when going back
                    window.lastFollowersModalType = null
                    window.tempViewedUser = null
                    setShowFollowersModal(null)
                    setFollowersSearchQuery('')
                    setViewedUsersFromFollowers(new Set())
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: currentThemeConfig.accent,
                    fontSize: '1.5rem',
                    cursor: 'pointer'
                  }}
                >
                  ←
                </button>
              )}
              {isMyProfile && (
                <div className="dropdown-container" style={{ position: 'relative', marginLeft: 'auto' }}>
                  <button
                    onClick={() => setShowProfileDropdown(showProfileDropdown === 'menu' ? null : 'menu')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: currentThemeConfig.secondary,
                      cursor: 'pointer',
                      padding: '0.25rem'
                    }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="3"/>
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                    </svg>
                  </button>
                  {showProfileDropdown === 'menu' && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      right: 0,
                      background: 'rgba(0, 0, 0, 0.95)',
                      border: '1px solid rgba(212, 175, 55, 0.5)',
                      borderRadius: '8px',
                      minWidth: '150px',
                      zIndex: 1000,
                      backdropFilter: 'blur(10px)'
                    }}>
                      <button
                        onClick={() => {
                          setShowFullSettings(true)
                          setShowProfileDropdown(null)
                        }}
                        style={{
                          width: '100%',
                          padding: '0.75rem 1rem',
                          background: 'none',
                          border: 'none',
                          color: currentThemeConfig.accent,
                          cursor: 'pointer',
                          textAlign: 'left',
                          borderBottom: `1px solid ${currentThemeConfig.secondary}40`
                        }}
                      >
                        ⚙️ Settings
                      </button>
                      
                      <button
                        onClick={() => {
                          const input = document.createElement('input')
                          input.type = 'file'
                          input.accept = 'audio/*'
                          input.multiple = true
                          input.onchange = (e) => handleSongsUpload(e.target.files)
                          input.click()
                          setShowProfileDropdown(null)
                        }}
                        style={{
                          width: '100%',
                          padding: '0.75rem 1rem',
                          background: 'none',
                          border: 'none',
                          color: currentThemeConfig.accent,
                          cursor: 'pointer',
                          textAlign: 'left',
                          borderBottom: `1px solid ${currentThemeConfig.secondary}40`
                        }}
                      >
                        🎵 Upload Music
                      </button>

                      <button
                        onClick={() => {
                          handleLogout()
                          setShowProfileDropdown(null)
                        }}
                        style={{
                          width: '100%',
                          padding: '0.75rem 1rem',
                          background: 'none',
                          border: 'none',
                          color: '#ff4444',
                          cursor: 'pointer',
                          textAlign: 'left',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff4444" strokeWidth="2">
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                          <polyline points="16,17 21,12 16,7"/>
                          <line x1="21" y1="12" x2="9" y2="12"/>
                        </svg>
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Instagram-style Profile Header - Left Aligned */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '0.5rem', padding: '0' }}>
              {/* Profile Picture - Left Side */}
              <div style={{ 
                width: '90px', 
                height: '90px', 
                borderRadius: '50%', 
                background: 'linear-gradient(45deg, #FFD700, #FFA500)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                color: '#000', 
                fontSize: '2rem', 
                position: 'relative', 
                border: '3px solid #D4AF37', 
                overflow: 'hidden',
                flexShrink: 0
              }}>
                {profileUser?.avatarUrl ? (
                  <>
                    <img 
                      src={profileUser.avatarUrl} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      alt="Profile"
                      onError={(e) => {
                        e.target.style.display = 'none'
                        const fallback = e.target.parentElement.querySelector('.avatar-fallback')
                        if (fallback) fallback.style.display = 'flex'
                      }}
                    />
                    <span className="avatar-fallback" style={{ 
                      fontSize: '2.5rem', 
                      fontWeight: 'bold',
                      display: 'none',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '100%',
                      height: '100%',
                      position: 'absolute',
                      top: 0,
                      left: 0
                    }}>
                      {(profileUser?.displayName || profileUser?.email || 'U')[0]?.toUpperCase()}
                    </span>
                  </>
                ) : (
                  <span style={{ 
                    fontSize: '2.5rem', 
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    height: '100%'
                  }}>
                    {(profileUser?.displayName || profileUser?.email || 'U')[0]?.toUpperCase()}
                  </span>
                )}
                <div style={{
                  position: 'absolute',
                  bottom: '2px',
                  right: '2px',
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  background: '#00ff00',
                  border: '2px solid #000'
                }} />
              </div>

              {/* Profile Info - Right Side (Instagram Style) */}
              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Display Name */}
                <h2 style={{ color: currentThemeConfig.accent, margin: '0 0 0.25rem 0', fontSize: '1.2rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {profileUser?.displayName || 'Profile'}
                  {isMyProfile && isSponsoredUser && (
                    <span style={{ 
                      background: 'linear-gradient(45deg, #FFD700, #FFA500)', 
                      color: '#000', 
                      padding: '0.1rem 0.4rem', 
                      borderRadius: '12px', 
                      fontSize: '0.6rem', 
                      fontWeight: 'bold'
                    }}>
                      🎯 SPONSOR
                    </span>
                  )}
                </h2>
                
                {/* Username */}
                <p style={{ color: currentThemeConfig.secondary, margin: '0 0 0.5rem 0', fontSize: '0.9rem' }}>
                  @{profileUser?.username || (profileUser?.displayName || profileUser?.email?.split('@')[0] || 'username').toLowerCase().replace(/[^a-z0-9]/g, '')}
                </p>

                {/* Bio */}
                {profileUser?.bio && (
                  <p style={{ color: currentThemeConfig.secondary, margin: '0 0 0.5rem 0', fontSize: '0.9rem', lineHeight: 1.4 }}>
                    {profileUser.bio}
                  </p>
                )}
                
                {/* Website URL */}
                {profileUser?.website && (
                  <a 
                    href={profileUser.website.startsWith('http') ? profileUser.website : `https://${profileUser.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ 
                      color: '#4A90E2', 
                      margin: '0 0 1rem 0', 
                      fontSize: '0.9rem', 
                      display: 'block',
                      textDecoration: 'none'
                    }}
                  >
                    {profileUser.website}
                  </a>
                )}
                
                {/* Edit Profile or Follow Button */}
                {isMyProfile ? (
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: profileUser?.website ? '0' : '0.5rem' }}>
                    <button
                      onClick={() => setShowSettingsModal(true)}
                      style={{
                        background: 'linear-gradient(45deg, #FFD700, #FFA500)',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '0.3rem 0.75rem',
                        borderRadius: '15px',
                        color: '#000',
                        fontWeight: '600',
                        fontSize: '0.8rem',
                        width: 'auto'
                      }}
                    >
                      Edit Profile
                    </button>

                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: profileUser?.website ? '0' : '0.5rem' }}>
                    <button 
                      onClick={async (e) => {
                        const button = e.target
                        if (button.disabled) return
                        button.disabled = true
                        
                        const isFollowing = following.has(profileUser.id)
                        
                        try {
                          const profileResponse = await fetch(`https://ofafvhtbuhvvkhuprotc.graphql.ap-southeast-1.nhost.run/v1`, {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              'x-hasura-admin-secret': '2=o_TVK82F6FKyi8xcbfE9lAm,r,jpq@'
                            },
                            body: JSON.stringify({
                              query: `query GetProfileIds($currentUserId: uuid!, $targetUserId: uuid!) {
                                currentUser: profiles(where: {auth_id: {_eq: $currentUserId}}) { id }
                                targetUser: profiles(where: {auth_id: {_eq: $targetUserId}}) { id }
                              }`,
                              variables: {
                                currentUserId: currentUser.id,
                                targetUserId: profileUser.id
                              }
                            })
                          })
                          
                          const profileResult = await profileResponse.json()
                          const currentProfileId = profileResult.data?.currentUser?.[0]?.id
                          const targetProfileId = profileResult.data?.targetUser?.[0]?.id
                          
                          if (isFollowing) {
                            await fetch(`https://ofafvhtbuhvvkhuprotc.graphql.ap-southeast-1.nhost.run/v1`, {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                                'x-hasura-admin-secret': '2=o_TVK82F6FKyi8xcbfE9lAm,r,jpq@'
                              },
                              body: JSON.stringify({
                                query: `mutation Unfollow($followerId: uuid!, $followingId: uuid!) {
                                  delete_follows(where: {follower_id: {_eq: $followerId}, following_id: {_eq: $followingId}}) {
                                    affected_rows
                                  }
                                }`,
                                variables: { followerId: currentProfileId, followingId: targetProfileId }
                              })
                            })
                            setFollowing(prev => {
                              const newSet = new Set(prev)
                              newSet.delete(profileUser.id)
                              return newSet
                            })
                            setFollowers(prev => ({
                              ...prev,
                              [profileUser.id]: Math.max(0, (prev[profileUser.id] || 0) - 1)
                            }))
                          } else {
                            await fetch(`https://ofafvhtbuhvvkhuprotc.graphql.ap-southeast-1.nhost.run/v1`, {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                                'x-hasura-admin-secret': '2=o_TVK82F6FKyi8xcbfE9lAm,r,jpq@'
                              },
                              body: JSON.stringify({
                                query: `mutation Follow($followerId: uuid!, $followingId: uuid!) {
                                  insert_follows_one(
                                    object: {follower_id: $followerId, following_id: $followingId}
                                    on_conflict: {constraint: follows_pkey, update_columns: []}
                                  ) {
                                    id
                                  }
                                }`,
                                variables: { followerId: currentProfileId, followingId: targetProfileId }
                              })
                            })
                            setFollowing(prev => new Set([...prev, profileUser.id]))
                            setFollowers(prev => ({
                              ...prev,
                              [profileUser.id]: (prev[profileUser.id] || 0) + 1
                            }))
                          }
                        } catch (error) {
                          console.error('Follow error:', error)
                        } finally {
                          button.disabled = false
                        }
                      }}
                      style={{
                        padding: '0.5rem 1rem',
                        background: following.has(profileUser.id) ? 'rgba(212, 175, 55, 0.2)' : 'linear-gradient(45deg, #FFD700, #FFA500)',
                        border: following.has(profileUser.id) ? '1px solid #D4AF37' : 'none',
                        borderRadius: '20px',
                        color: following.has(profileUser.id) ? '#D4AF37' : '#000',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '0.9rem'
                      }}
                    >
                      {following.has(profileUser.id) ? 'Following' : 'Follow'}
                    </button>
                    <button
                      onClick={() => setShowChatModal(profileUser)}
                      style={{
                        padding: '0.5rem 1rem',
                        background: 'rgba(212, 175, 55, 0.2)',
                        border: '1px solid #D4AF37',
                        borderRadius: '20px',
                        color: '#D4AF37',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '0.9rem'
                      }}
                    >
                      Message
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-around', gap: '1rem', margin: '1rem 0', padding: '0 1rem' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: currentThemeConfig.accent, fontWeight: '600' }}>{posts.filter(post => post.user?.id === profileUser?.id).length}</div>
                  <div style={{ color: currentThemeConfig.secondary, fontSize: '0.9rem' }}>Posts</div>
                </div>
                <div 
                  style={{ textAlign: 'center', cursor: 'pointer' }}
                  onClick={() => {
                    window.tempViewedUser = profileUser
                    window.lastFollowersModalType = 'followers'
                    setViewedUsersFromFollowers(new Set())
                    setShowFollowersModal('followers')
                    loadRealFollowers()
                  }}
                >
                  <div style={{ color: currentThemeConfig.accent, fontWeight: '600' }}>{followers[profileUser?.id] || 0}</div>
                  <div style={{ color: currentThemeConfig.secondary, fontSize: '0.9rem' }}>Followers</div>
                </div>
                <div 
                  style={{ textAlign: 'center', cursor: 'pointer' }}
                  onClick={() => {
                    window.tempViewedUser = profileUser
                    window.lastFollowersModalType = 'following'
                    setViewedUsersFromFollowers(new Set())
                    setShowFollowersModal('following')
                    loadRealFollowers()
                  }}
                >
                  <div style={{ color: currentThemeConfig.accent, fontWeight: '600' }}>{isMyProfile ? following.size : (followingData[profileUser?.id]?.length || 0)}</div>
                  <div style={{ color: currentThemeConfig.secondary, fontSize: '0.9rem' }}>Following</div>
                </div>
              </div>
              

            {/* Posts/Reels Tabs */}
            <div style={{ display: 'flex', marginBottom: '1rem', borderBottom: '1px solid rgba(212, 175, 55, 0.3)' }}>
              <button
                onClick={() => setProfileTab('all')}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: profileTab === 'all' ? 'rgba(212, 175, 55, 0.2)' : 'transparent',
                  border: 'none',
                  borderBottom: profileTab === 'all' ? '2px solid #FFD700' : '2px solid transparent',
                  color: profileTab === 'all' ? '#FFD700' : '#D4AF37',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '600'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                    <line x1="8" y1="21" x2="16" y2="21"/>
                    <line x1="12" y1="17" x2="12" y2="21"/>
                  </svg>
                  All
                </div>
              </button>
              <button
                onClick={() => setProfileTab('posts')}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: profileTab === 'posts' ? 'rgba(212, 175, 55, 0.2)' : 'transparent',
                  border: 'none',
                  borderBottom: profileTab === 'posts' ? '2px solid #FFD700' : '2px solid transparent',
                  color: profileTab === 'posts' ? '#FFD700' : '#D4AF37',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '600'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                  Posts
                </div>
              </button>
              <button
                onClick={() => setProfileTab('reels')}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: profileTab === 'reels' ? 'rgba(212, 175, 55, 0.2)' : 'transparent',
                  border: 'none',
                  borderBottom: profileTab === 'reels' ? '2px solid #FFD700' : '2px solid transparent',
                  color: profileTab === 'reels' ? '#FFD700' : '#D4AF37',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '600'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="23 7 16 12 23 17 23 7"/>
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                  </svg>
                  Reels
                </div>
              </button>
            </div>

            {/* Posts/Reels Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
              {posts
                .filter(post => post.user?.id === profileUser?.id)
                .filter(post => {
                  if (profileTab === 'all') return true
                  if (profileTab === 'posts') return post.type === 'post'
                  if (profileTab === 'reels') return post.type === 'reel'
                  return false
                })
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .map((post, i) => {
                  // Parse image URL for display - FIXED VERSION
                  let displayImageUrl = null
                  let isGallery = false
                  
                  console.log('Profile grid - Original imageUrl:', post.imageUrl, 'Type:', typeof post.imageUrl)
                  
                  if (post.imageUrl) {
                    // Handle array format (already parsed)
                    if (Array.isArray(post.imageUrl)) {
                      displayImageUrl = post.imageUrl[0]
                      isGallery = post.imageUrl.length > 1
                      console.log('Profile grid - Array format, first URL:', displayImageUrl)
                    }
                    // Handle string format
                    else if (typeof post.imageUrl === 'string') {
                      // Try JSON array format first
                      if (post.imageUrl.trim().startsWith('[') && post.imageUrl.trim().endsWith(']')) {
                        try {
                          const parsed = JSON.parse(post.imageUrl)
                          if (Array.isArray(parsed) && parsed.length > 0) {
                            displayImageUrl = parsed[0]
                            isGallery = parsed.length > 1
                            console.log('Profile grid - Parsed JSON array, first URL:', displayImageUrl)
                          } else {
                            displayImageUrl = post.imageUrl
                          }
                        } catch (e) {
                          console.log('Profile grid - JSON parse failed, treating as single URL:', e)
                          displayImageUrl = post.imageUrl
                        }
                      }
                      // Handle comma-separated URLs
                      else if (post.imageUrl.includes(',')) {
                        const urlArray = post.imageUrl.split(',').map(url => url.trim()).filter(url => url.length > 0)
                        if (urlArray.length > 0) {
                          displayImageUrl = urlArray[0]
                          isGallery = urlArray.length > 1
                          console.log('Profile grid - Split comma URLs, first URL:', displayImageUrl, 'Total URLs:', urlArray.length)
                        } else {
                          displayImageUrl = post.imageUrl
                        }
                      }
                      // Single URL string
                      else {
                        displayImageUrl = post.imageUrl.trim()
                        isGallery = false
                        console.log('Profile grid - Single URL:', displayImageUrl)
                      }
                    }
                    // Fallback
                    else {
                      displayImageUrl = String(post.imageUrl)
                      console.log('Profile grid - Fallback conversion:', displayImageUrl)
                    }
                  }
                  
                  // Ensure we have a valid URL (but allow first image from multiple URLs)
                  if (!displayImageUrl) {
                    console.error('Profile grid - No valid URL found')
                    displayImageUrl = null
                  }
                  
                  console.log('Profile grid - Final displayImageUrl:', displayImageUrl, 'isGallery:', isGallery)
                  
                  return (
                    <div 
                      key={post.id || i} 
                      style={{
                        aspectRatio: '1',
                        width: '100%',
                        background: !displayImageUrl ? 'linear-gradient(45deg, #000, #333)' : 'transparent',
                        border: '1px solid rgba(212, 175, 55, 0.3)',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#FFD700',
                        cursor: 'pointer',
                        overflow: 'hidden',
                        position: 'relative'
                      }}
                    >
                      <div onClick={() => {
                        // Stop all videos before opening modal
                        document.querySelectorAll('video').forEach(video => {
                          video.pause()
                          video.currentTime = 0
                        })
                        setShowPostModal(post)
                      }} style={{ 
                        width: '100%', 
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {displayImageUrl ? (
                          post.fileType === 'video' ? (
                            <>
                              <video 
                                src={displayImageUrl} 
                                style={{ 
                                  width: '100%', 
                                  height: '100%', 
                                  objectFit: 'cover'
                                }} 
                                muted
                                onClick={(e) => {
                                  e.stopPropagation()
                                  const video = e.target
                                  if (video.paused) {
                                    video.play()
                                  } else {
                                    video.pause()
                                  }
                                }}
                                onError={(e) => {
                                  console.error('Profile grid - Video failed to load:', displayImageUrl)
                                  e.target.style.display = 'none'
                                  const fallback = e.target.parentElement.querySelector('.media-fallback')
                                  if (fallback) fallback.style.display = 'flex'
                                }}
                              />
                              <div className="media-fallback" style={{
                                display: 'none',
                                width: '100%',
                                height: '100%',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'linear-gradient(45deg, #000, #333)',
                                color: '#FFD700',
                                fontSize: '2rem'
                              }}>
                                🎥
                              </div>
                              <div style={{
                                position: 'absolute',
                                top: '0.5rem',
                                right: '0.5rem',
                                background: 'rgba(0, 0, 0, 0.7)',
                                borderRadius: '4px',
                                padding: '0.25rem',
                                fontSize: '0.8rem',
                                color: '#fff'
                              }}>
                                🎥
                              </div>
                            </>
                          ) : (
                            <>
                              <img 
                                src={displayImageUrl} 
                                style={{ 
                                  width: '100%', 
                                  height: '100%', 
                                  objectFit: 'cover'
                                }}
                                alt={post.title || 'Post image'}
                                onError={(e) => {
                                  console.error('Profile grid - Image failed to load:', displayImageUrl)
                                  e.target.style.display = 'none'
                                  const fallback = e.target.parentElement.querySelector('.media-fallback')
                                  if (fallback) fallback.style.display = 'flex'
                                }}
                              />
                              <div className="media-fallback" style={{
                                display: 'none',
                                width: '100%',
                                height: '100%',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'linear-gradient(45deg, #000, #333)',
                                color: '#FFD700',
                                fontSize: '2rem'
                              }}>
                                📷
                              </div>
                              {isGallery && (
                                <div style={{
                                  position: 'absolute',
                                  top: '0.5rem',
                                  right: '0.5rem',
                                  background: 'rgba(0, 0, 0, 0.7)',
                                  borderRadius: '4px',
                                  padding: '0.25rem',
                                  fontSize: '0.8rem',
                                  color: '#fff'
                                }}>
                                  📷 {(() => {
                                    if (Array.isArray(post.imageUrl)) {
                                      return post.imageUrl.length
                                    } else if (typeof post.imageUrl === 'string' && post.imageUrl.includes(',')) {
                                      return post.imageUrl.split(',').filter(url => url.trim().length > 0).length
                                    } else {
                                      return 1
                                    }
                                  })()}
                                </div>
                              )}
                            </>
                          )
                        ) : (
                          <div style={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'linear-gradient(45deg, #000, #333)',
                            color: '#FFD700',
                            fontSize: '2rem',
                            flexDirection: 'column',
                            gap: '0.5rem'
                          }}>
                            📷
                            <div style={{ fontSize: '0.6rem', color: '#D4AF37' }}>No Image</div>
                          </div>
                        )}
                      </div>
                    
                    {/* Three Dots Menu */}
                    <div className="dropdown-container" style={{ position: 'absolute', top: '0.5rem', left: '0.5rem' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowProfileDropdown(showProfileDropdown === post.id ? null : post.id)
                        }}
                        style={{
                          background: 'rgba(0, 0, 0, 0.7)',
                          border: 'none',
                          borderRadius: '50%',
                          color: '#FFD700',
                          cursor: 'pointer',
                          width: '24px',
                          height: '24px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.8rem'
                        }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                          <circle cx="12" cy="5" r="2"/>
                          <circle cx="12" cy="12" r="2"/>
                          <circle cx="12" cy="19" r="2"/>
                        </svg>
                      </button>
                      
                      {showProfileDropdown === post.id && (
                        <div style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          background: 'rgba(0, 0, 0, 0.95)',
                          border: '1px solid rgba(212, 175, 55, 0.5)',
                          borderRadius: '8px',
                          minWidth: '120px',
                          zIndex: 1000,
                          backdropFilter: 'blur(10px)'
                        }}>
                          <button
                            onClick={() => {
                              setEditingPost(post)
                              setEditCaption(post.content || '')
                              setShowProfileDropdown(null)
                            }}
                            style={{
                              width: '100%',
                              padding: '0.5rem',
                              background: 'none',
                              border: 'none',
                              color: '#FFD700',
                              cursor: 'pointer',
                              textAlign: 'left',
                              borderBottom: '1px solid rgba(212, 175, 55, 0.2)',
                              fontSize: '0.8rem'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                              </svg>
                              Edit Caption
                            </div>
                          </button>
                          
                          <button
                            onClick={() => {
                              setSelectedPostForSponsoring(post)
                              setShowShareModal(true)
                              setSelectedUsers(new Set())
                              setShareMessage('')
                              setShareSearchQuery('')
                              setShowProfileDropdown(null)
                            }}
                            style={{
                              width: '100%',
                              padding: '0.5rem',
                              background: 'none',
                              border: 'none',
                              color: '#FFD700',
                              cursor: 'pointer',
                              textAlign: 'left',
                              borderBottom: '1px solid rgba(212, 175, 55, 0.2)',
                              fontSize: '0.8rem'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="18" cy="5" r="3"/>
                                <circle cx="6" cy="12" r="3"/>
                                <circle cx="18" cy="19" r="3"/>
                                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                              </svg>
                              Share
                            </div>
                          </button>
                          
                          <button
                            onClick={() => {
                              if (confirm('Delete this ' + post.type + '?')) {
                                const deleteQuery = post.type === 'reel' ? 
                                  `mutation DeleteReel($id: uuid!) { delete_reels_by_pk(id: $id) { id } }` :
                                  `mutation DeletePost($id: uuid!) { delete_posts_by_pk(id: $id) { id } }`
                                
                                fetch(`https://ofafvhtbuhvvkhuprotc.graphql.ap-southeast-1.nhost.run/v1`, {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                    'x-hasura-admin-secret': '2=o_TVK82F6FKyi8xcbfE9lAm,r,jpq@'
                                  },
                                  body: JSON.stringify({
                                    query: deleteQuery,
                                    variables: { id: post.id }
                                  })
                                }).then(() => {
                                  setPosts(prev => prev.filter(p => p.id !== post.id))
                                  alert(post.type + ' deleted!')
                                }).catch(err => {
                                  console.error('Delete failed:', err)
                                  alert('Failed to delete ' + post.type)
                                })
                              }
                              setShowProfileDropdown(null)
                            }}
                            style={{
                              width: '100%',
                              padding: '0.5rem',
                              background: 'none',
                              border: 'none',
                              color: '#ff4444',
                              cursor: 'pointer',
                              textAlign: 'left',
                              fontSize: '0.8rem'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3,6 5,6 21,6"/>
                                <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6"/>
                                <line x1="10" y1="11" x2="10" y2="17"/>
                                <line x1="14" y1="11" x2="14" y2="17"/>
                              </svg>
                              Delete
                            </div>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })
            }
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Check video duration for stories (max 2:30 minutes)
      if (uploadType === 'story' && file.type.startsWith('video/')) {
        const video = document.createElement('video')
        video.preload = 'metadata'
        video.onloadedmetadata = () => {
          if (video.duration > 150) {
            alert('Story videos must be 2:30 minutes or less')
            return
          }
          setUploadData(prev => ({ ...prev, file }))
          const reader = new FileReader()
          reader.onload = (e) => setUploadData(prev => ({ ...prev, preview: e.target.result }))
          reader.readAsDataURL(file)
        }
        video.src = URL.createObjectURL(file)
      } else {
        setUploadData(prev => ({ ...prev, file }))
        const reader = new FileReader()
        reader.onload = (e) => setUploadData(prev => ({ ...prev, preview: e.target.result }))
        reader.readAsDataURL(file)
      }
    }
  }

  const handleMultipleFileUpload = (e) => {
    const files = Array.from(e.target.files)
    if (files.length > 0) {
      const filePromises = files.map(file => {
        return new Promise((resolve) => {
          const reader = new FileReader()
          reader.onload = (e) => {
            resolve({
              file,
              preview: e.target.result,
              type: file.type
            })
          }
          reader.readAsDataURL(file)
        })
      })
      
      Promise.all(filePromises).then(fileData => {
        setMultipleFiles(fileData)
        setCurrentFileIndex(0)
      })
    }
  }

  const handleUpload = async () => {
    if (!uploadData.file || !uploadData.caption) {
      setUploadProgress({ isUploading: false, message: 'Please add a file and caption', startTime: null })
      setTimeout(() => setUploadProgress({ isUploading: false, message: '', startTime: null }), 3000)
      return
    }
    
    const startTime = Date.now()
    setUploadProgress({ isUploading: true, message: 'Preparing upload...', startTime })
    
    try {
      // Upload to Cloudinary
      setUploadProgress({ isUploading: true, message: 'Uploading to Cloudinary...', startTime })
      const fileType = uploadData.file.type.startsWith('video/') ? 'video' : 'image'
      const cloudinaryUrl = await uploadToCloudinary(uploadData.file, fileType)
      
      setUploadProgress({ isUploading: true, message: 'Saving to database...', startTime })
      
      // Save to database
      const user = await nhost.auth.getUser()
      const user_id = user?.body?.id
      
      if (uploadType === 'reel' && fileType === 'video') {
        console.log('🎥 Saving reel to database...')
        
        try {
          const response = await fetch(`https://ofafvhtbuhvvkhuprotc.graphql.ap-southeast-1.nhost.run/v1`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-hasura-admin-secret': '2=o_TVK82F6FKyi8xcbfE9lAm,r,jpq@'
            },
            body: JSON.stringify({
              query: `mutation InsertReel($user_id: uuid!, $video_url: String!, $caption: String!, $sponsored_by: String) {
                insert_reels_one(object: {
                  user_id: $user_id,
                  video_url: $video_url,
                  caption: $caption,
                  sponsored_by: $sponsored_by
                }) {
                  id
                  video_url
                  created_at
                }
              }`,
              variables: {
                user_id: user_id,
                video_url: cloudinaryUrl,
                caption: uploadData.caption,
                sponsored_by: selectedSponsorUser
              }
            })
          })
          
          const result = await response.json()
          if (result.data?.insert_reels_one) {
            console.log('✅ Reel saved to database:', result.data.insert_reels_one)
          }
        } catch (err) {
          console.log('⚠️ Reel save failed:', err)
        }
      } else if (uploadType === 'post' && fileType === 'image') {
        console.log('📷 Saving post to database...')
        
        try {
          const response = await fetch(`https://ofafvhtbuhvvkhuprotc.graphql.ap-southeast-1.nhost.run/v1`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-hasura-admin-secret': '2=o_TVK82F6FKyi8xcbfE9lAm,r,jpq@'
            },
            body: JSON.stringify({
              query: `mutation InsertPost($author_id: uuid!, $caption: String!, $image_url: String!, $sponsored_by: String) {
                insert_posts_one(object: {
                  author_id: $author_id,
                  caption: $caption,
                  image_url: $image_url,
                  sponsored_by: $sponsored_by
                }) {
                  id
                  caption
                  image_url
                  created_at
                }
              }`,
              variables: {
                author_id: user_id,
                caption: uploadData.caption,
                image_url: cloudinaryUrl,
                sponsored_by: selectedSponsorUser
              }
            })
          })
          
          const result = await response.json()
          if (result.data?.insert_posts_one) {
            console.log('✅ Post saved to database:', result.data.insert_posts_one)
          } else if (result.errors) {
            console.log('❌ Post save errors:', result.errors)
          }
        } catch (err) {
          console.log('⚠️ Post save failed:', err)
        }
      } else if (uploadType === 'story') {
        console.log('📖 Saving story to database...')
        
        try {
          // Get profile ID first
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
              variables: { authId: user_id }
            })
          })
          
          const profileResult = await profileResponse.json()
          const profileId = profileResult.data?.profiles?.[0]?.id
          
          if (!profileId) {
            throw new Error('Profile not found')
          }
          
          const response = await fetch(`https://ofafvhtbuhvvkhuprotc.graphql.ap-southeast-1.nhost.run/v1`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-hasura-admin-secret': '2=o_TVK82F6FKyi8xcbfE9lAm,r,jpq@'
            },
            body: JSON.stringify({
              query: `mutation AddStory($userId: uuid!, $authorId: uuid!, $storagePath: String!, $expiresAt: timestamptz!) {
                insert_stories_one(object: {
                  user_id: $userId,
                  author_id: $authorId,
                  storage_path: $storagePath,
                  expires_at: $expiresAt
                }) {
                  id
                  created_at
                }
              }`,
              variables: {
                userId: user_id,
                authorId: profileId,
                storagePath: cloudinaryUrl,
                expiresAt: new Date(Date.now() + 24*60*60*1000).toISOString()
              }
            })
          })
          
          const result = await response.json()
          console.log('📖 Story mutation result:', result)
          
          if (result.data?.insert_stories_one) {
            console.log('✅ Story saved to database:', result.data.insert_stories_one)
          } else if (result.errors) {
            console.log('❌ Story save errors:', result.errors)
            result.errors.forEach(error => {
              console.log('❌ Story error details:', error.message, error.extensions)
            })
          }
        } catch (err) {
          console.log('⚠️ Story save failed:', err)
        }
      }
      
      setUploadProgress({ isUploading: true, message: 'Finalizing upload...', startTime })
      
      // Only create post object for posts and reels, not stories
      if (uploadType !== 'story') {
        const newPost = {
          id: Date.now().toString(),
          title: uploadData.caption,
          content: uploadData.caption,
          type: uploadType,
          imageUrl: cloudinaryUrl,
          fileType: fileType,
          user: {
            displayName: currentUser?.displayName || 'You',
            id: currentUser?.id || 'current-user'
          },
          createdAt: new Date().toISOString()
        }
        
        // Add to posts state immediately
        const updatedPosts = [newPost, ...posts]
        setPosts(updatedPosts)
        
        // Initialize likes and comments for new post (starts at 0)
        setPostLikes(prev => ({ ...prev, [newPost.id]: 0 }))
        setPostComments(prev => ({ ...prev, [newPost.id]: 0 }))
      }
      
      const uploadTime = ((Date.now() - startTime) / 1000).toFixed(1)
      setUploadProgress({ isUploading: false, message: `${uploadType} uploaded successfully in ${uploadTime}s!`, startTime: null })
      
      // Reload posts and stories
      if (uploadType === 'story') {
        setTimeout(() => loadStories(), 1000)
      } else {
        setTimeout(() => loadPosts(), 1000)
      }
      
      // Reset and close modal after delay
      setTimeout(() => {
        setUploadData({ caption: '', file: null, preview: '' })
        setMultipleFiles([])
        setCurrentFileIndex(0)
        setStoryTextElements([])
        setSelectedTextElement(null)
        setIsEditingText(false)
        setShowTextControls(false)
        setShowPhotoEffects(false)
        setPhotoFilter('none')
        setPhotoShape('rectangle')
        setTextStyle('normal')
        setTextAlign('center')
        setTextBackground('transparent')
        setSelectedSponsorUser(null)
        setShowUploadModal(false)
        setUploadProgress({ isUploading: false, message: '', startTime: null })
      }, 2000)
      
    } catch (error) {
      console.error('Upload error:', error)
      const uploadTime = ((Date.now() - startTime) / 1000).toFixed(1)
      setUploadProgress({ isUploading: false, message: `Upload failed after ${uploadTime}s. Please try again.`, startTime: null })
      setTimeout(() => setUploadProgress({ isUploading: false, message: '', startTime: null }), 4000)
    }
  }

  const handleMultipleUpload = async () => {
    if (multipleFiles.length === 0 || !uploadData.caption) {
      setUploadProgress({ isUploading: false, message: 'Please add files and caption', startTime: null })
      setTimeout(() => setUploadProgress({ isUploading: false, message: '', startTime: null }), 3000)
      return
    }
    
    const startTime = Date.now()
    setUploadProgress({ isUploading: true, message: 'Uploading gallery post...', startTime })
    
    try {
      const user = await nhost.auth.getUser()
      const user_id = user?.body?.id
      
      // Upload all files to Cloudinary
      const imageUrls = []
      for (let i = 0; i < multipleFiles.length; i++) {
        const fileData = multipleFiles[i]
        setUploadProgress({ isUploading: true, message: `Uploading image ${i + 1}/${multipleFiles.length}...`, startTime })
        
        const fileType = fileData.file.type.startsWith('video/') ? 'video' : 'image'
        const cloudinaryUrl = await uploadToCloudinary(fileData.file, fileType)
        imageUrls.push(cloudinaryUrl)
      }
      
      // Create single post with multiple images
      const response = await fetch(`https://ofafvhtbuhvvkhuprotc.graphql.ap-southeast-1.nhost.run/v1`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-hasura-admin-secret': '2=o_TVK82F6FKyi8xcbfE9lAm,r,jpq@'
        },
        body: JSON.stringify({
          query: `mutation InsertPost($author_id: uuid!, $caption: String!, $image_url: String!) {
            insert_posts_one(object: {
              author_id: $author_id,
              caption: $caption,
              image_url: $image_url,
              is_reel: false
            }) {
              id
              caption
              image_url
              created_at
            }
          }`,
          variables: {
            author_id: user_id,
            caption: uploadData.caption,
            image_url: JSON.stringify(imageUrls) // Store as JSON array
          }
        })
      })
      
      const result = await response.json()
      if (result.data?.insert_posts_one) {
        const newPost = {
          id: result.data.insert_posts_one.id,
          title: uploadData.caption,
          content: uploadData.caption,
          type: 'post',
          imageUrl: imageUrls, // Array of URLs
          fileType: 'gallery',
          user: {
            displayName: currentUser?.displayName || 'You',
            id: currentUser?.id || 'current-user'
          },
          createdAt: result.data.insert_posts_one.created_at
        }
        
        setPosts(prev => [newPost, ...prev])
        setPostLikes(prev => ({ ...prev, [newPost.id]: 0 }))
        setPostComments(prev => ({ ...prev, [newPost.id]: 0 }))
      }
      
      const uploadTime = ((Date.now() - startTime) / 1000).toFixed(1)
      setUploadProgress({ isUploading: false, message: `Gallery post uploaded successfully in ${uploadTime}s!`, startTime: null })
      
      setTimeout(() => loadPosts(), 1000)
      
      setTimeout(() => {
        setUploadData({ caption: '', file: null, preview: '' })
        setMultipleFiles([])
        setCurrentFileIndex(0)
        setShowUploadModal(false)
        setUploadProgress({ isUploading: false, message: '', startTime: null })
      }, 2000)
      
    } catch (error) {
      console.error('Gallery upload error:', error)
      const uploadTime = ((Date.now() - startTime) / 1000).toFixed(1)
      setUploadProgress({ isUploading: false, message: `Upload failed after ${uploadTime}s. Please try again.`, startTime: null })
      setTimeout(() => setUploadProgress({ isUploading: false, message: '', startTime: null }), 4000)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: currentThemeConfig.bg,
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Main Content */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '60px' }}>
        {renderContent()}
      </div>

      {/* Full Screen Settings */}
      {showFullSettings && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: currentThemeConfig.bg,
          zIndex: 3000,
          overflowY: 'auto'
        }}>
          <div style={{ padding: '1rem' }}>
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '2rem',
              padding: '1rem 0'
            }}>
              <button
                onClick={() => setShowFullSettings(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: currentThemeConfig.accent,
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  marginRight: '1rem'
                }}
              >
                ←
              </button>
              <h2 style={{ color: currentThemeConfig.accent, margin: 0 }}>Settings</h2>
            </div>

            {/* Themes Section */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '12px',
              padding: '1.5rem',
              marginBottom: '2rem'
            }}>
              <div 
                onClick={() => setShowThemes(!showThemes)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  marginBottom: showThemes ? '1.5rem' : '0'
                }}
              >
                <h3 style={{ color: currentThemeConfig.accent, margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={currentThemeConfig.accent} strokeWidth="2">
                    <circle cx="13.5" cy="6.5" r=".5"/>
                    <circle cx="17.5" cy="10.5" r=".5"/>
                    <circle cx="8.5" cy="7.5" r=".5"/>
                    <circle cx="6.5" cy="12.5" r=".5"/>
                    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
                  </svg>
                  Themes
                </h3>
                <span style={{ color: currentThemeConfig.accent, fontSize: '1.5rem' }}>
                  {showThemes ? '▼' : '▶'}
                </span>
              </div>
              
              {showThemes && (
                <div style={{
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(2, 1fr)', 
                  gap: '0.5rem',
                  maxHeight: '300px',
                  overflowY: 'auto'
                }}>
                  {Object.entries(themes).map(([key, theme]) => (
                    <button
                      key={key}
                      onClick={async () => {
                        setCurrentTheme(key)
                        // Save to database
                        try {
                          await fetch(`https://ofafvhtbuhvvkhuprotc.graphql.ap-southeast-1.nhost.run/v1`, {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              'x-hasura-admin-secret': '2=o_TVK82F6FKyi8xcbfE9lAm,r,jpq@'
                            },
                            body: JSON.stringify({
                              query: `mutation UpdateUserTheme($userId: uuid!, $theme: String!) {
                                update_profiles(
                                  where: {auth_id: {_eq: $userId}}
                                  _set: {theme: $theme}
                                ) {
                                  affected_rows
                                }
                              }`,
                              variables: {
                                userId: currentUser?.id,
                                theme: key
                              }
                            })
                          })
                        } catch (error) {
                          console.log('Theme save failed:', error)
                        }
                      }}
                      style={{
                        padding: '0.5rem',
                        background: currentTheme === key ? `${currentThemeConfig.accent}20` : 'rgba(255,255,255,0.1)',
                        border: currentTheme === key ? `2px solid ${currentThemeConfig.accent}` : '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        textAlign: 'center',
                        color: currentTheme === key ? currentThemeConfig.accent : currentThemeConfig.secondary,
                        fontWeight: currentTheme === key ? '600' : '400',
                        fontSize: '0.8rem',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      {theme.name}
                      {currentTheme === key && ' ✓'}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Chat Settings Section */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '12px',
              padding: '1.5rem',
              marginBottom: '2rem'
            }}>
              <h3 style={{ color: currentThemeConfig.accent, margin: '0 0 1rem 0', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={currentThemeConfig.accent} strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                Chat Settings
              </h3>
              
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.75rem 0'
              }}>
                <div>
                  <div style={{ color: currentThemeConfig.secondary, fontSize: '1rem', marginBottom: '0.25rem' }}>
                    Hide Chat Tab
                  </div>
                  <div style={{ color: currentThemeConfig.secondary, fontSize: '0.8rem', opacity: 0.8 }}>
                    Remove the Messages tab from navigation
                  </div>
                </div>
                <label style={{
                  position: 'relative',
                  display: 'inline-block',
                  width: '50px',
                  height: '24px',
                  cursor: 'pointer'
                }}>
                  <input
                    type="checkbox"
                    checked={hideChatFromSettings}
                    onChange={handlePasswordProtectedToggle}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span style={{
                    position: 'absolute',
                    cursor: 'pointer',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: hideChatFromSettings ? currentThemeConfig.accent : 'rgba(255,255,255,0.3)',
                    transition: '0.4s',
                    borderRadius: '24px'
                  }}>
                    <span style={{
                      position: 'absolute',
                      content: '',
                      height: '18px',
                      width: '18px',
                      left: hideChatFromSettings ? '29px' : '3px',
                      bottom: '3px',
                      backgroundColor: '#fff',
                      transition: '0.4s',
                      borderRadius: '50%'
                    }} />
                  </span>
                </label>
              </div>
            </div>
            
            {/* Saved Section */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '12px',
              padding: '1.5rem',
              marginBottom: '1rem'
            }}>
              <h3 
                onClick={async () => {
                  console.log('💾 Saved button clicked, loading saved posts...')
                  console.log('💾 Current user:', currentUser?.id)
                  console.log('💾 Current posts:', posts.length)
                  console.log('💾 Current saved posts before load:', Array.from(savedPosts))
                  await loadSavedPosts()
                  console.log('💾 Saved posts after load:', Array.from(savedPosts))
                  console.log('💾 Opening saved modal...')
                  setShowSavedModal(true)
                  setShowSettingsModal(false)
                }}
                style={{ color: currentThemeConfig.accent, margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={currentThemeConfig.accent} strokeWidth="2">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                </svg>
                Saved
              </h3>
            </div>
            
            {/* Help Centre Section */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '12px',
              padding: '1.5rem',
              marginBottom: '1rem'
            }}>
              <h3 
                onClick={() => setShowHelpCentre(true)}
                style={{ color: currentThemeConfig.accent, margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={currentThemeConfig.accent} strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                Help Centre
              </h3>
            </div>
            
            {/* About Us Section */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '12px',
              padding: '1.5rem',
              marginBottom: '1rem'
            }}>
              <h3 
                onClick={() => setShowAboutUs(true)}
                style={{ color: currentThemeConfig.accent, margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={currentThemeConfig.accent} strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="16" x2="12" y2="12"/>
                  <line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
                About Us
              </h3>
            </div>
            
            {/* Logout Section */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '12px',
              padding: '1.5rem'
            }}>
              <div 
                onClick={() => setShowLogoutConfirm(!showLogoutConfirm)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  marginBottom: showLogoutConfirm ? '1.5rem' : '0'
                }}
              >
                <h3 style={{ color: '#ff4444', margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ff4444" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16,17 21,12 16,7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                  Logout
                </h3>
                <span style={{ color: '#ff4444', fontSize: '1.5rem' }}>
                  {showLogoutConfirm ? '▼' : '▶'}
                </span>
              </div>
              
              {showLogoutConfirm && (
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button
                    onClick={handleLogout}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      background: '#ff4444',
                      border: 'none',
                      borderRadius: '6px',
                      color: '#fff',
                      fontWeight: '600',
                      cursor: 'pointer',
                      fontSize: '0.9rem'
                    }}
                  >
                    Confirm Logout
                  </button>
                  <button
                    onClick={() => setShowLogoutConfirm(false)}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      background: 'rgba(255,255,255,0.1)',
                      border: `1px solid ${currentThemeConfig.secondary}40`,
                      borderRadius: '6px',
                      color: currentThemeConfig.secondary,
                      fontWeight: '600',
                      cursor: 'pointer',
                      fontSize: '0.9rem'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Help Centre Modal */}
      {showHelpCentre && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 4000
        }}>
          <div style={{
            background: currentThemeConfig.bg,
            border: `1px solid ${currentThemeConfig.accent}50`,
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ color: currentThemeConfig.accent, margin: 0 }}>Help Centre</h2>
              <button
                onClick={() => setShowHelpCentre(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: currentThemeConfig.secondary,
                  fontSize: '1.5rem',
                  cursor: 'pointer'
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{ color: currentThemeConfig.secondary, lineHeight: 1.6, fontSize: '0.95rem' }}>
              <h3 style={{ color: currentThemeConfig.accent, marginBottom: '1rem' }}>Welcome to Our Help Centre</h3>
              
              <p style={{ marginBottom: '1rem' }}>
                Welcome to our Help Centre — the dedicated space designed to guide, support, and empower you while using our platform. Whether you're a new user exploring features for the first time or an experienced creator looking to optimize your experience, this Help Centre provides everything you need in one place.
              </p>
              
              <p style={{ marginBottom: '1rem' }}>
                From account setup, profile management, and content uploads to troubleshooting errors, privacy settings, and platform updates, we've organized every topic into clear and easy-to-follow sections.
              </p>
              
              <p style={{ marginBottom: '1rem' }}>
                Our goal is to make sure you always feel informed and confident while using our services. Each article is written to be simple, practical, and helpful, so you can quickly find solutions without any confusion. And if you ever need additional help, our support team is available to assist you anytime.
              </p>
              
              <p>
                Start browsing through the categories and discover step-by-step guidance designed to make your journey smooth, secure, and enjoyable.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* About Us Modal */}
      {showAboutUs && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 4000
        }}>
          <div style={{
            background: currentThemeConfig.bg,
            border: `1px solid ${currentThemeConfig.accent}50`,
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ color: currentThemeConfig.accent, margin: 0 }}>About Us</h2>
              <button
                onClick={() => setShowAboutUs(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: currentThemeConfig.secondary,
                  fontSize: '1.5rem',
                  cursor: 'pointer'
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{ color: currentThemeConfig.secondary, lineHeight: 1.6, fontSize: '0.95rem' }}>
              <p style={{ marginBottom: '1rem' }}>
                Welcome to our platform — a place built to inspire creativity, connect communities, and give every user the tools they need to share their stories with the world. We started this journey with a simple mission: to create a modern, user-friendly space where anyone can express themselves through posts, reels, stories, and meaningful content.
              </p>
              
              <p style={{ marginBottom: '1rem' }}>
                Over time, our platform has grown into a vibrant community of creators, artists, influencers, and everyday users who want to showcase their ideas in a unique and engaging way.
              </p>
              
              <p style={{ marginBottom: '1.5rem' }}>
                Our team works constantly to improve features, enhance performance, and provide a seamless experience for everyone. We believe in innovation, transparency, and empowering our users to shine in their own style.
              </p>
              
              <h3 style={{ color: currentThemeConfig.accent, marginBottom: '1rem' }}>Sponsored Partnerships</h3>
              
              <p style={{ marginBottom: '1rem' }}>
                We collaborate with selected brands and creators to offer exclusive sponsored content, promotions, and unique experiences. Every sponsorship is carefully chosen to ensure it aligns with our values, enhances user experience, and brings real value to our community.
              </p>
              
              <p>
                If you're a brand interested in partnering with us, feel free to reach out — we'd love to work together.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Profile Picture Options Modal */}
      {showProfilePicOptions && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          zIndex: 3000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            background: 'rgba(0, 0, 0, 0.95)',
            borderRadius: '12px',
            padding: '1.5rem',
            border: '1px solid rgba(212, 175, 55, 0.3)',
            backdropFilter: 'blur(10px)',
            minWidth: '250px'
          }}>
            <h3 style={{ color: currentThemeConfig.accent, textAlign: 'center', marginBottom: '1.5rem' }}>
              {showProfilePicOptions.displayName || 'User'}
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <button
                onClick={() => {
                  setShowProfilePicModal(showProfilePicOptions)
                  setShowProfilePicOptions(null)
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'linear-gradient(45deg, #FFD700, #FFA500)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#000',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                📷 Show Profile Photo
              </button>
              
              {(() => {
                const userStories = stories.filter(story => story.user?.authId === showProfilePicOptions.id || story.user_id === showProfilePicOptions.id)
                return userStories.length > 0 && (
                  <button
                    onClick={() => {
                      setUserStories(userStories)
                      setCurrentStoryIndex(0)
                      setShowStoryModal(userStories[0])
                      setShowProfilePicOptions(null)
                    }}
                    style={{
                      padding: '0.75rem 1.5rem',
                      background: 'rgba(212, 175, 55, 0.2)',
                      border: '1px solid #D4AF37',
                      borderRadius: '8px',
                      color: '#D4AF37',
                      fontWeight: '600',
                      cursor: 'pointer',
                      fontSize: '0.9rem'
                    }}
                  >
                    📖 View Story
                  </button>
                )
              })()}
              
              <button
                onClick={() => setShowProfilePicOptions(null)}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'rgba(255, 68, 68, 0.2)',
                  border: '1px solid #ff4444',
                  borderRadius: '8px',
                  color: '#ff4444',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                ❌ Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Screen Profile Picture Modal */}
      {showProfilePicModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.95)',
          zIndex: 3500,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {/* Close button */}
          <button
            onClick={() => setShowProfilePicModal(null)}
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              background: 'rgba(0, 0, 0, 0.7)',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              color: '#fff',
              fontSize: '1.2rem',
              cursor: 'pointer',
              zIndex: 3600
            }}
          >
            ×
          </button>
          
          {/* Profile picture */}
          <div style={{
            maxWidth: '90vw',
            maxHeight: '90vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {showProfilePicModal.avatarUrl ? (
              <img 
                src={showProfilePicModal.avatarUrl}
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  borderRadius: '12px',
                  objectFit: 'contain'
                }}
                alt={`${showProfilePicModal.displayName}'s profile picture`}
              />
            ) : (
              <div style={{
                width: '300px',
                height: '300px',
                borderRadius: '50%',
                background: 'linear-gradient(45deg, #FFD700, #FFA500)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#000',
                fontSize: '6rem',
                fontWeight: 'bold'
              }}>
                {(showProfilePicModal.displayName || 'U')[0]?.toUpperCase()}
              </div>
            )}
          </div>
          
          {/* User info overlay */}
          <div style={{
            position: 'absolute',
            bottom: '2rem',
            left: '50%',
            transform: 'translateX(-50%)',
            textAlign: 'center',
            color: '#fff'
          }}>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem' }}>
              {showProfilePicModal.displayName || 'User'}
            </h3>
            <p style={{ margin: 0, opacity: 0.8, fontSize: '0.9rem' }}>
              @{showProfilePicModal.username || (showProfilePicModal.displayName || 'username').toLowerCase().replace(/[^a-z0-9]/g, '')}
            </p>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'rgba(0, 0, 0, 0.9)',
        backdropFilter: 'blur(10px)',
        borderTop: `1px solid ${currentThemeConfig.accent}40`,
        display: 'flex',
        justifyContent: 'space-around',
        padding: '0.75rem 0',
        zIndex: 1000
      }}>
        {tabs.map(tab => {
          const IconComponent = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.5rem'
              }}
            >
              <IconComponent active={activeTab === tab.id} />
            </button>
          )
        })}
      </div>

      {/* Post Modal */}
      {showPostModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: '#000',
          zIndex: 2000,
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem',
            background: 'rgba(0,0,0,0.8)',
            color: '#FFD700'
          }}>
            <button
              onClick={() => {
                // Stop all videos when closing modal
                document.querySelectorAll('video').forEach(video => {
                  video.pause()
                  video.currentTime = 0
                })
                setShowPostModal(null)
              }}
              style={{
                position: showPostModal.type === 'reel' ? 'absolute' : 'static',
                top: showPostModal.type === 'reel' ? '20px' : 'auto',
                left: showPostModal.type === 'reel' ? '20px' : 'auto',
                zIndex: showPostModal.type === 'reel' ? 10 : 'auto',
                background: showPostModal.type === 'reel' ? 'rgba(0,0,0,0.5)' : 'none',
                border: 'none',
                borderRadius: showPostModal.type === 'reel' ? '50%' : '0',
                width: showPostModal.type === 'reel' ? '40px' : 'auto',
                height: showPostModal.type === 'reel' ? '40px' : 'auto',
                color: '#FFD700',
                fontSize: '1.5rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {showPostModal.type === 'reel' ? '×' : '←'}
            </button>
            <h3 
              onClick={() => {
                if (showPostModal?.user?.id && showPostModal.user.id !== currentUser?.id) {
                  const targetUser = users.find(u => u.id === showPostModal.user.id) || showPostModal.user
                  setViewingProfile(targetUser)
                  setShowPostModal(null)
                  setActiveTab('profile')
                  loadRealFollowers()
                }
              }}
              style={{ 
                margin: 0, 
                cursor: showPostModal?.user?.id !== currentUser?.id ? 'pointer' : 'default',
                color: showPostModal?.user?.id !== currentUser?.id ? '#FFD700' : '#fff'
              }}
            >
              {showPostModal?.user?.displayName || 'Post'}
            </h3>
            <div style={{ width: '24px' }} />
          </div>

          {/* Post Content */}
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative'
          }}>
            {showPostModal?.imageUrl ? (
              Array.isArray(showPostModal.imageUrl) ? (
                // Gallery post
                <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                  <div 
                    style={{
                      display: 'flex',
                      transform: `translateX(-${(currentPostImageIndex[showPostModal.id] || 0) * 100}%)`,
                      transition: 'transform 0.3s ease',
                      width: '100%',
                      height: '100%'
                    }}
                    onTouchStart={(e) => {
                      e.currentTarget.startX = e.touches[0].clientX
                    }}
                    onTouchEnd={(e) => {
                      const startX = e.currentTarget.startX
                      const endX = e.changedTouches[0].clientX
                      const diff = startX - endX
                      
                      if (Math.abs(diff) > 50) {
                        const currentIndex = currentPostImageIndex[showPostModal.id] || 0
                        if (diff > 0 && currentIndex < showPostModal.imageUrl.length - 1) {
                          setCurrentPostImageIndex(prev => ({ ...prev, [showPostModal.id]: currentIndex + 1 }))
                        } else if (diff < 0 && currentIndex > 0) {
                          setCurrentPostImageIndex(prev => ({ ...prev, [showPostModal.id]: currentIndex - 1 }))
                        }
                      }
                    }}
                  >
                    {showPostModal.imageUrl.map((url, index) => (
                      <img 
                        key={index}
                        src={url} 
                        style={{ width: '100%', height: '100%', objectFit: 'contain', flexShrink: 0 }}
                        alt={`${showPostModal.title} - ${index + 1}`}
                      />
                    ))}
                  </div>
                  
                  {/* Gallery indicators */}
                  {showPostModal.imageUrl.length > 1 && (
                    <>
                      <div style={{
                        position: 'absolute',
                        top: '20px',
                        right: '20px',
                        background: 'rgba(0,0,0,0.7)',
                        borderRadius: '12px',
                        padding: '8px 12px',
                        color: '#fff',
                        fontSize: '0.9rem'
                      }}>
                        {(currentPostImageIndex[showPostModal.id] || 0) + 1}/{showPostModal.imageUrl.length}
                      </div>
                      
                      <div style={{
                        position: 'absolute',
                        bottom: '20px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        display: 'flex',
                        gap: '8px'
                      }}>
                        {showPostModal.imageUrl.map((_, index) => (
                          <div
                            key={index}
                            style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              background: index === (currentPostImageIndex[showPostModal.id] || 0) ? '#FFD700' : 'rgba(255,255,255,0.5)',
                              cursor: 'pointer'
                            }}
                            onClick={() => setCurrentPostImageIndex(prev => ({ ...prev, [showPostModal.id]: index }))}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                // Single image/video
                showPostModal.fileType === 'video' ? (
                  <div style={{ position: 'relative', width: '100%', height: showPostModal.type === 'reel' ? '100vh' : 'auto' }}>
                    <video 
                      ref={(video) => {
                        if (video && showPostModal.type === 'reel') {
                          video.muted = isReelMuted
                          video.loop = false
                        }
                      }}
                      src={showPostModal.imageUrl} 
                      style={{ 
                        width: '100%', 
                        height: showPostModal.type === 'reel' ? '100vh' : 'auto', 
                        maxHeight: showPostModal.type === 'reel' ? 'none' : '80vh', 
                        objectFit: showPostModal.type === 'reel' ? 'cover' : 'contain' 
                      }} 
                      controls={showPostModal.type !== 'reel'}
                      autoPlay={showPostModal.type !== 'reel'}
                      muted={showPostModal.type === 'reel' ? isReelMuted : false}
                      playsInline
                      onClick={(e) => {
                        if (showPostModal.type === 'reel') {
                          const video = e.target
                          if (video.paused) {
                            video.play()
                            setIsReelPlaying(true)
                          } else {
                            video.pause()
                            setIsReelPlaying(false)
                          }
                        }
                      }}
                      onEnded={(e) => {
                        if (showPostModal.type === 'reel') {
                          const video = e.target
                          video.pause()
                          setIsReelPlaying(false)
                        }
                      }}
                    />
                    {showPostModal.type === 'reel' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          const video = e.target.closest('div').querySelector('video')
                          if (video) {
                            video.muted = !video.muted
                            setIsReelMuted(video.muted)
                          }
                        }}
                        style={{
                          position: 'absolute',
                          bottom: '100px',
                          right: '20px',
                          background: 'rgba(0,0,0,0.5)',
                          border: 'none',
                          borderRadius: '50%',
                          width: '40px',
                          height: '40px',
                          color: '#fff',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.2rem',
                          zIndex: 10
                        }}
                      >
                        {isReelMuted ? '🔇' : '🔊'}
                      </button>
                    )}
                  </div>
                ) : (
                  <img 
                    src={showPostModal.imageUrl} 
                    style={{ width: '100%', height: 'auto', maxHeight: '80vh', objectFit: 'contain' }} 
                    alt={showPostModal.title}
                  />
                )
              )
            ) : (
              <div style={{ color: '#D4AF37', fontSize: '2rem' }}>📷</div>
            )}
          </div>

          {/* Post Info */}
          <div style={{
            background: 'rgba(0,0,0,0.8)',
            padding: '1rem',
            color: '#FFD700'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'linear-gradient(45deg, #FFD700, #FFA500)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#000',
                fontWeight: 'bold',
                overflow: 'hidden'
              }}>
                {showPostModal?.user?.avatarUrl ? (
                  <img 
                    src={showPostModal.user.avatarUrl} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    alt={showPostModal.user.displayName}
                  />
                ) : (
                  (showPostModal?.user?.displayName || 'U')[0]?.toUpperCase()
                )}
              </div>
              <div>
                <div 
                  onClick={() => {
                    if (showPostModal?.user?.id && showPostModal.user.id !== currentUser?.id) {
                      const targetUser = users.find(u => u.id === showPostModal.user.id) || showPostModal.user
                      setViewingProfile(targetUser)
                      setShowPostModal(null)
                      setActiveTab('profile')
                      loadRealFollowers()
                    }
                  }}
                  style={{ 
                    fontWeight: 'bold',
                    cursor: showPostModal?.user?.id !== currentUser?.id ? 'pointer' : 'default',
                    color: showPostModal?.user?.id !== currentUser?.id ? '#FFD700' : '#fff'
                  }}
                >
                  {showPostModal?.user?.displayName || 'User'}
                </div>
                <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                  {new Date(showPostModal?.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
            {(showPostModal?.content || showPostModal?.title) && (
              <p style={{ margin: 0, lineHeight: 1.4, color: '#fff', fontSize: '0.9rem' }}>
                {showPostModal.content || showPostModal.title || 'No caption'}
              </p>
            )}
          </div>
        </div>
      )}



      {/* Followers/Following Modal */}
      {showFollowersModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div style={{
            background: 'rgba(0, 0, 0, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: '16px',
            width: '90%',
            maxWidth: '400px',
            maxHeight: '80vh',
            border: '1px solid rgba(212, 175, 55, 0.5)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem',
              borderBottom: '1px solid rgba(212, 175, 55, 0.3)'
            }}>
              <h3 style={{ color: '#FFD700', margin: 0 }}>
                {(window.tempViewedUser?.displayName || currentUser?.displayName || 'User')}'s {showFollowersModal === 'followers' ? 'Followers' : 'Following'}
              </h3>
              <button
                onClick={() => {
                  setShowFollowersModal(null)
                  setFollowersSearchQuery('')
                  setViewedUsersFromFollowers(new Set())
                  window.followersModalCloseTime = Date.now()
                  // Clear ALL tracking variables
                  window.tempViewedUser = null
                  window.lastFollowersModalType = null
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#FFD700',
                  fontSize: '1.5rem',
                  cursor: 'pointer'
                }}
              >
                ×
              </button>
            </div>

            {/* Search Bar */}
            <div style={{ padding: '1rem', borderBottom: '1px solid rgba(212, 175, 55, 0.3)' }}>
              <input
                type="text"
                placeholder="Search"
                value={followersSearchQuery}
                onChange={(e) => setFollowersSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(212, 175, 55, 0.5)',
                  background: 'rgba(0, 0, 0, 0.7)',
                  color: '#FFD700',
                  fontSize: '1rem'
                }}
              />
            </div>

            {/* Users List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
              {(() => {
                // Get the relevant user list based on modal type
                let relevantUsers = []
                
                // Determine which user's followers/following to show
                const targetUser = window.tempViewedUser || currentUser
                
                if (showFollowersModal === 'followers') {
                  // Show users who follow the target user
                  const targetUserFollowers = followersData[targetUser?.id] || []
                  relevantUsers = users.filter(user => targetUserFollowers.includes(user.id))
                } else {
                  // Show users that target user follows
                  if (targetUser?.id === currentUser?.id) {
                    // For current user, use the following set
                    relevantUsers = users.filter(user => following.has(user.id))
                  } else {
                    // For other users, use the following details
                    const targetUserFollowing = followingData[targetUser?.id] || []
                    relevantUsers = users.filter(user => targetUserFollowing.includes(user.id))
                  }
                }
                
                // Filter by search query
                const filteredUsers = relevantUsers.filter(user => 
                  user.displayName?.toLowerCase().includes(followersSearchQuery.toLowerCase()) ||
                  user.email?.toLowerCase().includes(followersSearchQuery.toLowerCase())
                )
                
                return filteredUsers.length > 0 ? filteredUsers.map((user, i) => (
                  <div 
                    key={user.id || i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0.75rem 0',
                      borderBottom: '1px solid rgba(212, 175, 55, 0.2)'
                    }}
                  >
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      background: 'linear-gradient(45deg, #FFD700, #FFA500)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#000',
                      marginRight: '0.75rem',
                      fontSize: '0.9rem',
                      fontWeight: 'bold',
                      overflow: 'hidden'
                    }}>
                      {user.avatarUrl ? (
                        <img 
                          src={user.avatarUrl} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          alt={user.displayName}
                        />
                      ) : (
                        (user.displayName || 'User')[0]?.toUpperCase()
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: '#FFD700', fontWeight: '600', fontSize: '0.9rem' }}>
                        {user.displayName || user.email?.split('@')[0] || 'User'}
                      </div>
                      <div style={{ color: '#D4AF37', fontSize: '0.7rem' }}>
                        {followers[user.id] || 0} followers
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setShowFollowersModal(null)
                        setFollowersSearchQuery('')
                        setViewingProfile(user)
                        setActiveTab('profile')
                        // Clear modal tracking
                        window.lastFollowersModalType = null
                        window.tempViewedUser = null
                      }}
                      style={{
                        background: 'rgba(212, 175, 55, 0.2)',
                        border: '1px solid rgba(212, 175, 55, 0.5)',
                        borderRadius: '20px',
                        color: '#FFD700',
                        padding: '0.25rem 0.75rem',
                        fontSize: '0.8rem',
                        cursor: 'pointer'
                      }}
                    >
                      View
                    </button>
                  </div>
                )) : (
                  <div style={{
                    textAlign: 'center',
                    color: '#D4AF37',
                    padding: '2rem',
                    fontSize: '0.9rem'
                  }}>
                    {followersSearchQuery ? 
                      `No ${showFollowersModal} found for "${followersSearchQuery}"` : 
                      `No ${showFollowersModal} yet`
                    }
                  </div>
                )
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div style={{
            background: 'rgba(0, 0, 0, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: '16px',
            padding: '2rem',
            width: '90%',
            maxWidth: '400px',
            border: '1px solid rgba(212, 175, 55, 0.5)'
          }}>
            <h3 style={{ color: '#FFD700', marginBottom: '1rem', textAlign: 'center' }}>Create New {uploadType === 'story' ? 'Story' : uploadType}</h3>
            
            {/* Upload Progress */}
            {(uploadProgress.isUploading || uploadProgress.message) && (
              <div style={{
                background: 'rgba(212, 175, 55, 0.1)',
                border: '1px solid rgba(212, 175, 55, 0.3)',
                borderRadius: '8px',
                padding: '1rem',
                marginBottom: '1rem',
                textAlign: 'center'
              }}>
                {uploadProgress.isUploading && (
                  <div style={{
                    width: '100%',
                    height: '4px',
                    background: 'rgba(212, 175, 55, 0.2)',
                    borderRadius: '2px',
                    marginBottom: '0.5rem',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: '100%',
                      height: '100%',
                      background: 'linear-gradient(45deg, #FFD700, #FFA500)',
                      borderRadius: '2px',
                      animation: 'progress 2s ease-in-out infinite'
                    }} />
                  </div>
                )}
                <div style={{ color: '#FFD700', fontSize: '0.9rem' }}>
                  {uploadProgress.message}
                  {uploadProgress.startTime && (
                    <span style={{ color: '#D4AF37', marginLeft: '0.5rem' }}>
                      ({((Date.now() - uploadProgress.startTime) / 1000).toFixed(1)}s)
                    </span>
                  )}
                </div>
              </div>
            )}
            
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <button
                onClick={() => setUploadType('post')}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: uploadType === 'post' ? 'linear-gradient(45deg, #FFD700, #FFA500)' : 'rgba(212, 175, 55, 0.2)',
                  border: '1px solid rgba(212, 175, 55, 0.5)',
                  borderRadius: '8px',
                  color: uploadType === 'post' ? '#000' : '#FFD700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                <CameraIcon /> Post
              </button>
              <button
                onClick={() => setUploadType('reel')}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: uploadType === 'reel' ? 'linear-gradient(45deg, #FFD700, #FFA500)' : 'rgba(212, 175, 55, 0.2)',
                  border: '1px solid rgba(212, 175, 55, 0.5)',
                  borderRadius: '8px',
                  color: uploadType === 'reel' ? '#000' : '#FFD700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                <VideoIcon /> Reel
              </button>
              <button
                onClick={() => setUploadType('story')}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: uploadType === 'story' ? 'linear-gradient(45deg, #FFD700, #FFA500)' : 'rgba(212, 175, 55, 0.2)',
                  border: '1px solid rgba(212, 175, 55, 0.5)',
                  borderRadius: '8px',
                  color: uploadType === 'story' ? '#000' : '#FFD700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                📖 Story
              </button>
            </div>

            <input
              type="file"
              accept={uploadType === 'reel' ? 'video/*' : uploadType === 'story' ? 'image/*,video/*' : 'image/*'}
              onChange={uploadType === 'post' ? handleMultipleFileUpload : handleFileUpload}
              multiple={uploadType === 'post'}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgba(212, 175, 55, 0.1)',
                border: '1px solid rgba(212, 175, 55, 0.5)',
                borderRadius: '8px',
                color: '#FFD700',
                marginBottom: '1rem'
              }}
            />

            {/* Multiple Files Preview for Posts */}
            {uploadType === 'post' && multipleFiles.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', overflowX: 'auto' }}>
                  {multipleFiles.map((file, index) => (
                    <div 
                      key={index}
                      onClick={() => setCurrentFileIndex(index)}
                      style={{
                        minWidth: '60px',
                        height: '60px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        border: currentFileIndex === index ? '2px solid #FFD700' : '2px solid transparent',
                        cursor: 'pointer',
                        position: 'relative'
                      }}
                    >
                      {file.type.startsWith('video/') ? (
                        <video src={file.preview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <img src={file.preview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setMultipleFiles(prev => prev.filter((_, i) => i !== index))
                          if (currentFileIndex >= multipleFiles.length - 1) {
                            setCurrentFileIndex(Math.max(0, multipleFiles.length - 2))
                          }
                        }}
                        style={{
                          position: 'absolute',
                          top: '2px',
                          right: '2px',
                          background: 'rgba(0,0,0,0.7)',
                          border: 'none',
                          borderRadius: '50%',
                          color: '#fff',
                          width: '16px',
                          height: '16px',
                          fontSize: '10px',
                          cursor: 'pointer'
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <div style={{ textAlign: 'center' }}>
                  {multipleFiles[currentFileIndex]?.type.startsWith('video/') ? (
                    <video src={multipleFiles[currentFileIndex]?.preview} style={{ width: '100%', maxHeight: '200px', borderRadius: '8px' }} controls />
                  ) : (
                    <img src={multipleFiles[currentFileIndex]?.preview} style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: '8px' }} />
                  )}
                </div>
              </div>
            )}

            {/* Full Screen Story/Post Editor */}
            {(uploadType === 'story' || uploadType === 'post') && uploadData.preview && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: '#000',
                zIndex: 3000,
                display: 'flex',
                flexDirection: 'column'
              }}>
                {/* Header */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1rem',
                  background: 'rgba(0,0,0,0.8)',
                  color: '#FFD700'
                }}>
                  <button
                    onClick={() => {
                      setUploadData({ caption: '', file: null, preview: '' })
                      setStoryTextElements([])
                      setSelectedTextElement(null)
                      setIsEditingText(false)
                      setShowTextControls(false)
                      setShowPhotoEffects(false)
                      setPhotoFilter('none')
                      setPhotoShape('rectangle')
                      setTextStyle('normal')
                      setTextAlign('center')
                      setTextBackground('transparent')
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#FFD700',
                      fontSize: '1.5rem',
                      cursor: 'pointer'
                    }}
                  >
                    ×
                  </button>
                  <h3 style={{ margin: 0 }}>Edit {uploadType}</h3>
                  <button
                    onClick={() => {
                      if (uploadType === 'post' && multipleFiles.length > 0) {
                        handleMultipleUpload()
                      } else {
                        handleUpload()
                      }
                    }}
                    style={{
                      background: 'linear-gradient(45deg, #FFD700, #FFA500)',
                      border: 'none',
                      borderRadius: '20px',
                      padding: '0.5rem 1rem',
                      color: '#000',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    Share
                  </button>
                </div>

                {/* Main Editor Area */}
                <div style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative'
                }}>
                  <div 
                    onClick={(e) => {
                      if (isEditingText || uploadType !== 'story') return
                      const rect = e.currentTarget.getBoundingClientRect()
                      const x = ((e.clientX - rect.left) / rect.width) * 100
                      const y = ((e.clientY - rect.top) / rect.height) * 100
                      
                      const newTextElement = {
                        id: Date.now(),
                        text: 'Tap to edit',
                        x: x,
                        y: y,
                        color: textColor,
                        size: textSize,
                        style: textStyle,
                        align: textAlign,
                        background: textBackground
                      }
                      setStoryTextElements(prev => [...prev, newTextElement])
                      setSelectedTextElement(newTextElement.id)
                      setTextInput('Tap to edit')
                      setIsEditingText(true)
                      setShowTextControls(true)
                    }}
                    style={{ 
                      position: 'relative', 
                      cursor: uploadType === 'story' ? 'crosshair' : 'default',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      maxWidth: '100%',
                      maxHeight: '80vh'
                    }}
                  >
                    {uploadData.file?.type.startsWith('video/') ? (
                      <video 
                        src={uploadData.preview} 
                        style={{ 
                          width: '100%', 
                          height: 'auto',
                          maxHeight: '80vh',
                          borderRadius: photoShape === 'circle' ? '50%' : photoShape === 'rounded' ? '20px' : '8px',
                          filter: photoFilter,
                          aspectRatio: photoShape === 'square' ? '1' : 'auto'
                        }} 
                        controls 
                      />
                    ) : (
                      <img 
                        src={uploadData.preview} 
                        style={{ 
                          width: '100%', 
                          height: 'auto',
                          maxHeight: '80vh',
                          objectFit: 'contain', 
                          borderRadius: photoShape === 'circle' ? '50%' : photoShape === 'rounded' ? '20px' : '8px',
                          filter: photoFilter,
                          aspectRatio: photoShape === 'square' ? '1' : 'auto'
                        }} 
                      />
                    )}
                    
                    {/* Text Elements Overlay for Stories */}
                    {uploadType === 'story' && storyTextElements.map(element => (
                      <div
                        key={element.id}
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedTextElement(element.id)
                          setTextInput(element.text)
                          setTextColor(element.color)
                          setTextSize(element.size)
                          setTextStyle(element.style || 'normal')
                          setTextAlign(element.align || 'center')
                          setTextBackground(element.background || 'transparent')
                          setIsEditingText(true)
                          setShowTextControls(true)
                        }}
                        style={{
                          position: 'absolute',
                          left: `${element.x}%`,
                          top: `${element.y}%`,
                          transform: 'translate(-50%, -50%)',
                          color: element.color,
                          fontSize: `${element.size}px`,
                          fontWeight: element.style === 'bold' ? 'bold' : 'normal',
                          fontStyle: element.style === 'italic' ? 'italic' : 'normal',
                          textDecoration: element.style === 'underline' ? 'underline' : 'none',
                          textAlign: element.align || 'center',
                          background: element.background || 'transparent',
                          textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                          cursor: 'pointer',
                          border: selectedTextElement === element.id ? '2px dashed #FFD700' : 'none',
                          padding: '8px',
                          borderRadius: '8px',
                          whiteSpace: 'nowrap',
                          maxWidth: '200px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {element.text}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Caption Input */}
                <div style={{
                  background: 'rgba(0,0,0,0.8)',
                  padding: '1rem'
                }}>
                  <textarea
                    placeholder="Write a caption..."
                    value={uploadData.caption}
                    onChange={(e) => setUploadData(prev => ({ ...prev, caption: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.3)',
                      borderRadius: '8px',
                      color: '#fff',
                      resize: 'none',
                      minHeight: '60px',
                      fontSize: '1rem'
                    }}
                  />
                  
                  {/* Sponsored User Selector */}
                  {isSponsoredUser && (uploadType === 'post' || uploadType === 'reel') && (
                    <div style={{ marginTop: '1rem' }}>
                      <label style={{ color: '#FFD700', display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                        🎯 Sponsor this {uploadType} by:
                      </label>
                      <select
                        value={selectedSponsorUser || ''}
                        onChange={(e) => setSelectedSponsorUser(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          background: 'rgba(255,255,255,0.1)',
                          border: '1px solid rgba(255,255,255,0.3)',
                          borderRadius: '8px',
                          color: '#fff',
                          fontSize: '1rem'
                        }}
                      >
                        <option value="" style={{ background: '#000', color: '#fff' }}>Select user to sponsor by...</option>
                        {users.filter(user => user.id !== currentUser?.id).map(user => (
                          <option key={user.id} value={user.displayName} style={{ background: '#000', color: '#fff' }}>
                            {user.displayName}
                          </option>
                        ))}
                      </select>
                      {selectedSponsorUser && (
                        <div style={{ 
                          marginTop: '0.5rem', 
                          padding: '0.5rem', 
                          background: 'rgba(255, 215, 0, 0.1)', 
                          borderRadius: '6px',
                          color: '#FFD700',
                          fontSize: '0.8rem'
                        }}>
                          ✨ This {uploadType} will show "Sponsored by {selectedSponsorUser}"
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom Tools */}
                <div style={{
                  background: 'rgba(0,0,0,0.8)',
                  padding: '1rem',
                  display: 'flex',
                  gap: '1rem',
                  justifyContent: 'center',
                  flexWrap: 'wrap'
                }}>
                  {uploadType === 'story' && (
                    <>
                      <button
                        onClick={() => setShowTextControls(!showTextControls)}
                        style={{
                          background: showTextControls ? '#FFD700' : 'rgba(255,215,0,0.2)',
                          border: '1px solid #FFD700',
                          borderRadius: '20px',
                          color: showTextControls ? '#000' : '#FFD700',
                          padding: '0.5rem 1rem',
                          cursor: 'pointer',
                          fontSize: '0.9rem'
                        }}
                      >
                        Aa Text
                      </button>
                      <button
                        onClick={() => setShowPhotoEffects(!showPhotoEffects)}
                        style={{
                          background: showPhotoEffects ? '#FFD700' : 'rgba(255,215,0,0.2)',
                          border: '1px solid #FFD700',
                          borderRadius: '20px',
                          color: showPhotoEffects ? '#000' : '#FFD700',
                          padding: '0.5rem 1rem',
                          cursor: 'pointer',
                          fontSize: '0.9rem'
                        }}
                      >
                        🎨 Effects
                      </button>
                      <button
                        onClick={() => {
                          const newElement = {
                            id: Date.now(),
                            text: '😊',
                            x: 50,
                            y: 50,
                            color: '#FFD700',
                            size: 32,
                            style: 'normal',
                            align: 'center',
                            background: 'transparent'
                          }
                          setStoryTextElements(prev => [...prev, newElement])
                        }}
                        style={{
                          background: 'rgba(255,215,0,0.2)',
                          border: '1px solid #FFD700',
                          borderRadius: '20px',
                          color: '#FFD700',
                          padding: '0.5rem 1rem',
                          cursor: 'pointer',
                          fontSize: '0.9rem'
                        }}
                      >
                        😊 Emoji
                      </button>
                      <button
                        onClick={() => {
                          // Add drawing functionality placeholder
                          alert('Drawing feature coming soon!')
                        }}
                        style={{
                          background: 'rgba(255,215,0,0.2)',
                          border: '1px solid #FFD700',
                          borderRadius: '20px',
                          color: '#FFD700',
                          padding: '0.5rem 1rem',
                          cursor: 'pointer',
                          fontSize: '0.9rem'
                        }}
                      >
                        ✏️ Draw
                      </button>
                    </>
                  )}
                  {uploadType === 'post' && (
                    <>
                      <button
                        onClick={() => setShowPhotoEffects(!showPhotoEffects)}
                        style={{
                          background: showPhotoEffects ? '#FFD700' : 'rgba(255,215,0,0.2)',
                          border: '1px solid #FFD700',
                          borderRadius: '20px',
                          color: showPhotoEffects ? '#000' : '#FFD700',
                          padding: '0.5rem 1rem',
                          cursor: 'pointer',
                          fontSize: '0.9rem'
                        }}
                      >
                        🎨 Filters
                      </button>
                      <button
                        onClick={() => {
                          // Add crop functionality placeholder
                          alert('Crop feature coming soon!')
                        }}
                        style={{
                          background: 'rgba(255,215,0,0.2)',
                          border: '1px solid #FFD700',
                          borderRadius: '20px',
                          color: '#FFD700',
                          padding: '0.5rem 1rem',
                          cursor: 'pointer',
                          fontSize: '0.9rem'
                        }}
                      >
                        ✂️ Crop
                      </button>
                      <button
                        onClick={() => {
                          // Add brightness/contrast adjustment
                          alert('Adjust feature coming soon!')
                        }}
                        style={{
                          background: 'rgba(255,215,0,0.2)',
                          border: '1px solid #FFD700',
                          borderRadius: '20px',
                          color: '#FFD700',
                          padding: '0.5rem 1rem',
                          cursor: 'pointer',
                          fontSize: '0.9rem'
                        }}
                      >
                        🔆 Adjust
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Story Creation Mode (Old) */}
            {false && uploadType === 'story' && uploadData.preview && (
              <div style={{ marginBottom: '1rem', position: 'relative' }}>
                <div 
                  onClick={(e) => {
                    if (isEditingText) return
                    const rect = e.currentTarget.getBoundingClientRect()
                    const x = ((e.clientX - rect.left) / rect.width) * 100
                    const y = ((e.clientY - rect.top) / rect.height) * 100
                    
                    const newTextElement = {
                      id: Date.now(),
                      text: 'Tap to edit',
                      x: x,
                      y: y,
                      color: textColor,
                      size: textSize,
                      style: textStyle,
                      align: textAlign,
                      background: textBackground
                    }
                    setStoryTextElements(prev => [...prev, newTextElement])
                    setSelectedTextElement(newTextElement.id)
                    setTextInput('Tap to edit')
                    setIsEditingText(true)
                    setShowTextControls(true)
                  }}
                  style={{ 
                    position: 'relative', 
                    cursor: 'crosshair',
                    borderRadius: '8px',
                    overflow: 'hidden'
                  }}
                >
                  {uploadData.file?.type.startsWith('video/') ? (
                    <video 
                      src={uploadData.preview} 
                      style={{ 
                        width: '100%', 
                        maxHeight: '300px', 
                        borderRadius: photoShape === 'circle' ? '50%' : photoShape === 'rounded' ? '20px' : '8px',
                        filter: photoFilter,
                        aspectRatio: photoShape === 'square' ? '1' : 'auto'
                      }} 
                      controls 
                    />
                  ) : (
                    <img 
                      src={uploadData.preview} 
                      style={{ 
                        width: '100%', 
                        maxHeight: '300px', 
                        objectFit: 'cover', 
                        borderRadius: photoShape === 'circle' ? '50%' : photoShape === 'rounded' ? '20px' : '8px',
                        filter: photoFilter,
                        aspectRatio: photoShape === 'square' ? '1' : 'auto'
                      }} 
                    />
                  )}
                  
                  {/* Text Elements Overlay */}
                  {storyTextElements.map(element => (
                    <div
                      key={element.id}
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedTextElement(element.id)
                        setTextInput(element.text)
                        setTextColor(element.color)
                        setTextSize(element.size)
                        setTextStyle(element.style || 'normal')
                        setTextAlign(element.align || 'center')
                        setTextBackground(element.background || 'transparent')
                        setIsEditingText(true)
                        setShowTextControls(true)
                      }}
                      style={{
                        position: 'absolute',
                        left: `${element.x}%`,
                        top: `${element.y}%`,
                        transform: 'translate(-50%, -50%)',
                        color: element.color,
                        fontSize: `${element.size}px`,
                        fontWeight: element.style === 'bold' ? 'bold' : 'normal',
                        fontStyle: element.style === 'italic' ? 'italic' : 'normal',
                        textDecoration: element.style === 'underline' ? 'underline' : 'none',
                        textAlign: element.align || 'center',
                        background: element.background || 'transparent',
                        textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                        cursor: 'pointer',
                        border: selectedTextElement === element.id ? '2px dashed #FFD700' : 'none',
                        padding: '8px',
                        borderRadius: '8px',
                        whiteSpace: 'nowrap',
                        maxWidth: '200px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {element.text}
                    </div>
                  ))}
                </div>
                
                {/* Photo Effects Button */}
                <button
                  onClick={() => setShowPhotoEffects(!showPhotoEffects)}
                  style={{
                    position: 'absolute',
                    top: '10px',
                    left: '10px',
                    background: 'rgba(0,0,0,0.7)',
                    border: 'none',
                    borderRadius: '20px',
                    color: '#FFD700',
                    padding: '0.5rem 1rem',
                    cursor: 'pointer',
                    fontSize: '0.8rem'
                  }}
                >
                  🎨 Effects
                </button>

                {/* Photo Effects Panel - Fixed Position */}
                {showPhotoEffects && (
                  <div style={{
                    position: 'fixed',
                    bottom: '100px',
                    left: '1rem',
                    right: '1rem',
                    background: 'rgba(0, 0, 0, 0.95)',
                    borderRadius: '12px',
                    padding: '1rem',
                    border: '1px solid rgba(212, 175, 55, 0.5)',
                    zIndex: 4000
                  }}>
                    <div style={{ marginBottom: '0.5rem' }}>
                      <label style={{ color: '#FFD700', fontSize: '0.8rem', marginBottom: '0.25rem', display: 'block' }}>Filters</label>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {[
                          { name: 'None', value: 'none' },
                          { name: 'Sepia', value: 'sepia(100%)' },
                          { name: 'Grayscale', value: 'grayscale(100%)' },
                          { name: 'Blur', value: 'blur(2px)' },
                          { name: 'Bright', value: 'brightness(150%)' },
                          { name: 'Contrast', value: 'contrast(150%)' }
                        ].map(filter => (
                          <button
                            key={filter.value}
                            onClick={() => setPhotoFilter(filter.value)}
                            style={{
                              padding: '0.25rem 0.5rem',
                              background: photoFilter === filter.value ? '#FFD700' : 'rgba(212, 175, 55, 0.2)',
                              border: '1px solid rgba(212, 175, 55, 0.5)',
                              borderRadius: '4px',
                              color: photoFilter === filter.value ? '#000' : '#FFD700',
                              cursor: 'pointer',
                              fontSize: '0.7rem'
                            }}
                          >
                            {filter.name}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label style={{ color: '#FFD700', fontSize: '0.8rem', marginBottom: '0.25rem', display: 'block' }}>Shapes</label>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {[
                          { name: 'Rectangle', value: 'rectangle' },
                          { name: 'Rounded', value: 'rounded' },
                          { name: 'Circle', value: 'circle' },
                          { name: 'Square', value: 'square' }
                        ].map(shape => (
                          <button
                            key={shape.value}
                            onClick={() => setPhotoShape(shape.value)}
                            style={{
                              padding: '0.25rem 0.5rem',
                              background: photoShape === shape.value ? '#FFD700' : 'rgba(212, 175, 55, 0.2)',
                              border: '1px solid rgba(212, 175, 55, 0.5)',
                              borderRadius: '4px',
                              color: photoShape === shape.value ? '#000' : '#FFD700',
                              cursor: 'pointer',
                              fontSize: '0.7rem'
                            }}
                          >
                            {shape.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Text Editing Controls - Fixed Position */}
                {showTextControls && (
                  <div style={{
                    position: 'fixed',
                    bottom: '100px',
                    left: '1rem',
                    right: '1rem',
                    background: 'rgba(0, 0, 0, 0.95)',
                    borderRadius: '12px',
                    padding: '1rem',
                    border: '1px solid rgba(212, 175, 55, 0.5)',
                    zIndex: 4000,
                    maxHeight: '40vh',
                    overflowY: 'auto'
                  }}>
                    <input
                      type="text"
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      placeholder="Enter text..."
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        background: 'rgba(212, 175, 55, 0.1)',
                        border: '1px solid rgba(212, 175, 55, 0.5)',
                        borderRadius: '4px',
                        color: '#FFD700',
                        marginBottom: '0.5rem'
                      }}
                    />
                    
                    {/* Text Style Options */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                      {['normal', 'bold', 'italic', 'underline'].map(style => (
                        <button
                          key={style}
                          onClick={() => setTextStyle(style)}
                          style={{
                            padding: '0.25rem 0.5rem',
                            background: textStyle === style ? '#FFD700' : 'rgba(212, 175, 55, 0.2)',
                            border: '1px solid rgba(212, 175, 55, 0.5)',
                            borderRadius: '4px',
                            color: textStyle === style ? '#000' : '#FFD700',
                            cursor: 'pointer',
                            fontSize: '0.7rem',
                            fontWeight: style === 'bold' ? 'bold' : 'normal',
                            fontStyle: style === 'italic' ? 'italic' : 'normal',
                            textDecoration: style === 'underline' ? 'underline' : 'none'
                          }}
                        >
                          {style.charAt(0).toUpperCase() + style.slice(1)}
                        </button>
                      ))}
                    </div>

                    {/* Text Alignment */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      {['left', 'center', 'right'].map(align => (
                        <button
                          key={align}
                          onClick={() => setTextAlign(align)}
                          style={{
                            padding: '0.25rem 0.5rem',
                            background: textAlign === align ? '#FFD700' : 'rgba(212, 175, 55, 0.2)',
                            border: '1px solid rgba(212, 175, 55, 0.5)',
                            borderRadius: '4px',
                            color: textAlign === align ? '#000' : '#FFD700',
                            cursor: 'pointer',
                            fontSize: '0.7rem'
                          }}
                        >
                          {align === 'left' ? '⬅️' : align === 'center' ? '↔️' : '➡️'}
                        </button>
                      ))}
                    </div>

                    {/* Color Picker */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                      {['#FFFFFF', '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080'].map(color => (
                        <button
                          key={color}
                          onClick={() => setTextColor(color)}
                          style={{
                            width: '30px',
                            height: '30px',
                            borderRadius: '50%',
                            background: color,
                            border: textColor === color ? '3px solid #FFD700' : '2px solid #333',
                            cursor: 'pointer'
                          }}
                        />
                      ))}
                    </div>

                    {/* Background Color */}
                    <div style={{ marginBottom: '0.5rem' }}>
                      <label style={{ color: '#FFD700', fontSize: '0.8rem', marginBottom: '0.25rem', display: 'block' }}>Background</label>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {['transparent', '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00'].map(bg => (
                          <button
                            key={bg}
                            onClick={() => setTextBackground(bg)}
                            style={{
                              width: '25px',
                              height: '25px',
                              borderRadius: '4px',
                              background: bg === 'transparent' ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)' : bg,
                              backgroundSize: bg === 'transparent' ? '8px 8px' : 'auto',
                              backgroundPosition: bg === 'transparent' ? '0 0, 0 4px, 4px -4px, -4px 0px' : 'auto',
                              border: textBackground === bg ? '2px solid #FFD700' : '1px solid #333',
                              cursor: 'pointer'
                            }}
                          />
                        ))}
                      </div>
                    </div>
                    
                    {/* Size Slider */}
                    <div style={{ marginBottom: '0.5rem' }}>
                      <label style={{ color: '#FFD700', fontSize: '0.8rem', marginBottom: '0.25rem', display: 'block' }}>Size: {textSize}px</label>
                      <input
                        type="range"
                        min="16"
                        max="48"
                        value={textSize}
                        onChange={(e) => setTextSize(parseInt(e.target.value))}
                        style={{ width: '100%' }}
                      />
                    </div>
                    
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => {
                          if (selectedTextElement) {
                            setStoryTextElements(prev => prev.map(el => 
                              el.id === selectedTextElement 
                                ? { ...el, text: textInput, color: textColor, size: textSize, style: textStyle, align: textAlign, background: textBackground }
                                : el
                            ))
                          }
                          setIsEditingText(false)
                          setShowTextControls(false)
                          setSelectedTextElement(null)
                        }}
                        style={{
                          flex: 1,
                          padding: '0.5rem',
                          background: 'linear-gradient(45deg, #FFD700, #FFA500)',
                          border: 'none',
                          borderRadius: '4px',
                          color: '#000',
                          cursor: 'pointer',
                          fontWeight: '600'
                        }}
                      >
                        Done
                      </button>
                      <button
                        onClick={() => {
                          if (selectedTextElement) {
                            setStoryTextElements(prev => prev.filter(el => el.id !== selectedTextElement))
                          }
                          setIsEditingText(false)
                          setShowTextControls(false)
                          setSelectedTextElement(null)
                        }}
                        style={{
                          padding: '0.5rem 1rem',
                          background: 'rgba(255, 68, 68, 0.2)',
                          border: '1px solid rgba(255, 68, 68, 0.5)',
                          borderRadius: '4px',
                          color: '#ff4444',
                          cursor: 'pointer'
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Single File Preview for Reels */}
            {uploadType === 'reel' && uploadData.preview && (
              <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
                <video src={uploadData.preview} style={{ width: '100%', maxHeight: '200px', borderRadius: '8px' }} controls />
              </div>
            )}

            <textarea
              placeholder="Write a caption..."
              value={uploadData.caption}
              onChange={(e) => setUploadData(prev => ({ ...prev, caption: e.target.value }))}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgba(212, 175, 55, 0.1)',
                border: '1px solid rgba(212, 175, 55, 0.5)',
                borderRadius: '8px',
                color: '#FFD700',
                resize: 'vertical',
                minHeight: '80px',
                marginBottom: '1rem'
              }}
            />

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => setShowUploadModal(false)}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: 'rgba(212, 175, 55, 0.1)',
                  border: '1px solid rgba(212, 175, 55, 0.5)',
                  borderRadius: '8px',
                  color: '#D4AF37',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (uploadType === 'post' && multipleFiles.length > 0) {
                    handleMultipleUpload()
                  } else {
                    handleUpload()
                  }
                }}
                disabled={uploadProgress.isUploading}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: uploadProgress.isUploading ? 'rgba(212, 175, 55, 0.3)' : 'linear-gradient(45deg, #FFD700, #FFA500)',
                  border: 'none',
                  borderRadius: '8px',
                  color: uploadProgress.isUploading ? '#D4AF37' : '#000',
                  cursor: uploadProgress.isUploading ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  opacity: uploadProgress.isUploading ? 0.6 : 1
                }}
              >
                {uploadProgress.isUploading ? 'Uploading...' : uploadType === 'post' && multipleFiles.length > 1 ? `Share ${multipleFiles.length} Posts` : 'Share'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showSettingsModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(135deg, #000000, #1a1a1a, #333333)',
          zIndex: 2000,
          overflowY: 'auto'
        }}>
          <div style={{
            width: '100%',
            minHeight: '100vh',
            padding: '2rem'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', borderBottom: '1px solid rgba(212, 175, 55, 0.3)', paddingBottom: '1rem' }}>
              <h2 style={{ color: '#FFD700', margin: 0, fontSize: '1.5rem' }}>Edit Profile</h2>
              <button
                onClick={() => setShowSettingsModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#FFD700',
                  cursor: 'pointer',
                  fontSize: '2rem',
                  padding: '0.5rem'
                }}
              >
                ×
              </button>
            </div>
            
            {/* Profile Picture */}
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(45deg, #FFD700, #FFA500)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', margin: '0 auto 1rem', fontSize: '1.5rem', position: 'relative', border: '2px solid #D4AF37', overflow: 'hidden' }}>
                {editProfile.preview ? (
                  <img 
                    src={editProfile.preview} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    alt="Profile Preview"
                  />
                ) : (
                  (editProfile.displayName || currentUser?.displayName || 'U')[0]?.toUpperCase()
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleProfileImageUpload}
                style={{ display: 'none' }}
                id="profile-upload"
              />
              <label
                htmlFor="profile-upload"
                style={{
                  padding: '0.5rem 1rem',
                  background: 'rgba(212, 175, 55, 0.2)',
                  border: '1px solid rgba(212, 175, 55, 0.5)',
                  borderRadius: '6px',
                  color: '#FFD700',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                📷 Change Photo
              </label>
            </div>

            {/* Display Name */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ color: '#FFD700', fontSize: '0.9rem', marginBottom: '0.5rem', display: 'block' }}>Display Name</label>
              <input
                type="text"
                value={editProfile.displayName}
                onChange={(e) => setEditProfile(prev => ({ ...prev, displayName: e.target.value }))}
                placeholder="Enter your display name"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'rgba(212, 175, 55, 0.1)',
                  border: '1px solid rgba(212, 175, 55, 0.5)',
                  borderRadius: '8px',
                  color: '#FFD700',
                  fontSize: '1rem'
                }}
              />
            </div>

            {/* Username */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ color: '#FFD700', fontSize: '0.9rem', marginBottom: '0.5rem', display: 'block' }}>Username</label>
              <input
                type="text"
                value={editProfile.username || ''}
                onChange={(e) => {
                  const username = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 30)
                  setEditProfile(prev => ({ ...prev, username }))
                }}
                placeholder="Enter your username"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'rgba(212, 175, 55, 0.1)',
                  border: '1px solid rgba(212, 175, 55, 0.5)',
                  borderRadius: '8px',
                  color: '#FFD700',
                  fontSize: '1rem'
                }}
              />
              <div style={{ color: '#D4AF37', fontSize: '0.7rem', marginTop: '0.25rem' }}>
                Only lowercase letters, numbers, and underscores allowed (max 30 chars)
              </div>
            </div>

            {/* Bio */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ color: '#FFD700', fontSize: '0.9rem', marginBottom: '0.5rem', display: 'block' }}>Bio</label>
              <textarea
                value={editProfile.bio}
                onChange={(e) => setEditProfile(prev => ({ ...prev, bio: e.target.value.slice(0, 150) }))}
                placeholder="Write a short bio..."
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'rgba(212, 175, 55, 0.1)',
                  border: '1px solid rgba(212, 175, 55, 0.5)',
                  borderRadius: '8px',
                  color: '#FFD700',
                  fontSize: '0.9rem',
                  minHeight: '60px',
                  resize: 'vertical'
                }}
              />
              <div style={{ color: '#D4AF37', fontSize: '0.7rem', marginTop: '0.25rem' }}>
                {(editProfile.bio || '').length}/150 characters
              </div>
            </div>

            {/* Website URL */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ color: '#FFD700', fontSize: '0.9rem', marginBottom: '0.5rem', display: 'block' }}>Website</label>
              <input
                type="url"
                value={editProfile.website}
                onChange={(e) => setEditProfile(prev => ({ ...prev, website: e.target.value }))}
                placeholder="https://yourwebsite.com"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'rgba(212, 175, 55, 0.1)',
                  border: '1px solid rgba(212, 175, 55, 0.5)',
                  borderRadius: '8px',
                  color: '#FFD700',
                  fontSize: '0.9rem'
                }}
              />
              <div style={{ color: '#D4AF37', fontSize: '0.7rem', marginTop: '0.25rem' }}>
                Add your website or social media link
              </div>
            </div>

            {/* Username Preview */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ color: '#FFD700', fontSize: '0.9rem', marginBottom: '0.5rem', display: 'block' }}>Username Preview</label>
              <div style={{
                padding: '0.75rem',
                background: 'rgba(212, 175, 55, 0.05)',
                border: '1px solid rgba(212, 175, 55, 0.3)',
                borderRadius: '8px',
                color: '#D4AF37',
                fontSize: '0.9rem'
              }}>
                @{(editProfile.displayName || currentUser?.displayName || 'username').toLowerCase().replace(/[^a-z0-9]/g, '')}
              </div>
            </div>

            {/* Change Email Section */}
            <div style={{ marginBottom: '1.25rem' }}>
              <h4 style={{ color: '#D4AF37', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Change Email</h4>
              <ChangeEmail />
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => setShowSettingsModal(false)}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: 'rgba(212, 175, 55, 0.1)',
                  border: '1px solid rgba(212, 175, 55, 0.5)',
                  borderRadius: '8px',
                  color: '#D4AF37',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleProfileUpdate}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: 'linear-gradient(45deg, #FFD700, #FFA500)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#000',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Saved Posts Modal */}
      {showSavedModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.95)',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            background: currentThemeConfig.bg,
            borderRadius: '12px',
            width: '90%',
            maxWidth: '600px',
            maxHeight: '80vh',
            overflow: 'hidden',
            border: `1px solid ${currentThemeConfig.secondary}40`
          }}>
            {/* Header */}
            <div style={{
              padding: '1rem',
              borderBottom: `1px solid ${currentThemeConfig.secondary}40`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <h3 style={{ color: currentThemeConfig.accent, margin: 0 }}>Saved</h3>
              <button
                onClick={() => {
                  setShowSavedModal(false)
                  setShowSettingsModal(true)
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: currentThemeConfig.accent,
                  cursor: 'pointer',
                  fontSize: '1.5rem'
                }}
              >
                ×
              </button>
            </div>
            
            {/* Saved Content */}
            <div style={{
              padding: '1rem',
              maxHeight: '60vh',
              overflowY: 'auto'
            }}>
              {(() => {
                console.log('🔍 Debug - All posts:', posts.length)
                console.log('🔍 Debug - Posts by type:', posts.map(p => ({ id: p.id, type: p.type, title: p.title })))
                console.log('🔍 Debug - Saved post IDs:', Array.from(savedPosts))
                const savedPostsList = posts.filter(post => {
                  const isSaved = savedPosts.has(post.id)
                  if (isSaved) console.log('🔍 Debug - Found saved post:', post.id, post.type, post.title)
                  return isSaved
                })
                console.log('🔍 Debug - Filtered saved posts:', savedPostsList.length)
                const savedPostsOnly = savedPostsList.filter(post => post.type !== 'reel')
                const savedReels = savedPostsList.filter(post => post.type === 'reel')
                console.log('🔍 Debug - Posts only:', savedPostsOnly.length, 'Reels only:', savedReels.length)
                
                if (savedPostsList.length === 0) {
                  return (
                    <div style={{
                      textAlign: 'center',
                      padding: '2rem',
                      color: currentThemeConfig.secondary
                    }}>
                      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💾</div>
                      <p>No saved posts or reels yet</p>
                      <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>Save posts and reels to view them here</p>
                    </div>
                  )
                }
                
                return (
                  <div>
                    {/* Posts Section */}
                    {savedPostsOnly.length > 0 && (
                      <div style={{ marginBottom: '2rem' }}>
                        <h4 style={{ color: currentThemeConfig.accent, fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={currentThemeConfig.accent} strokeWidth="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                            <circle cx="8.5" cy="8.5" r="1.5"/>
                            <polyline points="21,15 16,10 5,21"/>
                          </svg>
                          Posts ({savedPostsOnly.length})
                        </h4>
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                          gap: '0.5rem'
                        }}>
                          {savedPostsOnly.map((post) => {
                            const imageUrl = Array.isArray(post.imageUrl) ? post.imageUrl[0] : post.imageUrl
                            
                            return (
                              <div
                                key={post.id}
                                onClick={() => {
                                  setShowPostModal(post)
                                  setShowSavedModal(false)
                                  setShowSettingsModal(false)
                                }}
                                style={{
                                  aspectRatio: '1',
                                  background: '#000',
                                  borderRadius: '8px',
                                  overflow: 'hidden',
                                  cursor: 'pointer',
                                  position: 'relative',
                                  border: `1px solid ${currentThemeConfig.secondary}20`
                                }}
                              >
                                <img
                                  src={imageUrl}
                                  style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover'
                                  }}
                                  alt={post.title}
                                  onError={(e) => {
                                    e.target.style.display = 'none'
                                    e.target.parentElement.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #D4AF37;">📷</div>'
                                  }}
                                />
                                {Array.isArray(post.imageUrl) && post.imageUrl.length > 1 && (
                                  <div style={{
                                    position: 'absolute',
                                    top: '5px',
                                    right: '5px',
                                    background: 'rgba(0,0,0,0.7)',
                                    borderRadius: '4px',
                                    padding: '2px 6px',
                                    color: '#fff',
                                    fontSize: '0.7rem'
                                  }}>
                                    📷 {post.imageUrl.length}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                    
                    {/* Reels Section */}
                    {savedReels.length > 0 && (
                      <div>
                        <h4 style={{ color: currentThemeConfig.accent, fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={currentThemeConfig.accent} strokeWidth="2">
                            <polygon points="23 7 16 12 23 17 23 7"/>
                            <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                          </svg>
                          Reels ({savedReels.length})
                        </h4>
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                          gap: '0.5rem'
                        }}>
                          {savedReels.map((reel) => {
                            const imageUrl = Array.isArray(reel.imageUrl) ? reel.imageUrl[0] : reel.imageUrl
                            
                            return (
                              <div
                                key={reel.id}
                                onClick={() => {
                                  setActiveTab('reels')
                                  const reelIndex = posts.filter(p => p.type === 'reel').findIndex(r => r.id === reel.id)
                                  if (reelIndex !== -1) {
                                    setCurrentReelIndex(reelIndex)
                                  }
                                  setShowSavedModal(false)
                                  setShowSettingsModal(false)
                                }}
                                style={{
                                  aspectRatio: '1',
                                  background: '#000',
                                  borderRadius: '8px',
                                  overflow: 'hidden',
                                  cursor: 'pointer',
                                  position: 'relative',
                                  border: `1px solid ${currentThemeConfig.secondary}20`
                                }}
                              >
                                <video
                                  src={imageUrl}
                                  style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover'
                                  }}
                                  muted
                                />
                                <div style={{
                                  position: 'absolute',
                                  top: '5px',
                                  right: '5px',
                                  background: 'rgba(0,0,0,0.7)',
                                  borderRadius: '4px',
                                  padding: '2px 6px',
                                  color: '#fff',
                                  fontSize: '0.7rem'
                                }}>
                                  🎥
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Comment Modal */}
      {showCommentModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 4000
        }}>
          <div style={{
            background: 'rgba(0, 0, 0, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: '16px',
            padding: '2rem',
            width: '90%',
            maxWidth: '400px',
            border: '1px solid rgba(212, 175, 55, 0.5)'
          }}>
            <h3 style={{ color: '#FFD700', marginBottom: '1rem', textAlign: 'center' }}>Comments</h3>
            
            <div style={{ marginBottom: '1rem', maxHeight: '200px', overflowY: 'auto' }}>
              {commentDetails[showCommentModal] && commentDetails[showCommentModal].length > 0 ? (
                commentDetails[showCommentModal].map((comment, i) => (
                  <div key={i} style={{
                    padding: '0.75rem',
                    borderBottom: '1px solid rgba(212, 175, 55, 0.2)',
                    marginBottom: '0.5rem'
                  }}>
                    <div style={{ color: '#FFD700', fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                      {comment.userName || comment.profile?.display_name || 'User'}
                    </div>
                    <div style={{ color: '#D4AF37', fontSize: '0.9rem' }}>
                      {comment.text}
                    </div>
                    <div style={{ color: '#888', fontSize: '0.7rem', marginTop: '0.25rem' }}>
                      {new Date(comment.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ color: '#D4AF37', fontSize: '0.9rem', textAlign: 'center', padding: '1rem' }}>
                  No comments yet. Be the first to comment!
                </div>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    e.target.nextElementSibling.click()
                  }
                }}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: 'rgba(212, 175, 55, 0.1)',
                  border: '1px solid rgba(212, 175, 55, 0.5)',
                  borderRadius: '8px',
                  color: '#FFD700',
                  fontSize: '0.9rem'
                }}
              />
              <button
                onClick={async () => {
                  if (!newComment.trim() || !currentUser?.id) return
                  
                  try {
                    console.log('💬 Adding comment:', { userId: currentUser.id, postId: showCommentModal, content: newComment.trim() })
                    
                    // Check if this is a shared reel (starts with 'shared-reel-')
                    const isSharedReel = showCommentModal.toString().startsWith('shared-reel-')
                    
                    if (isSharedReel) {
                      // For shared reels, store comments locally only
                      console.log('💬 Adding comment to shared reel locally')
                      
                      // Update local state immediately
                      setPostComments(prev => ({
                        ...prev,
                        [showCommentModal]: (prev[showCommentModal] || 0) + 1
                      }))
                      
                      // Add comment to local details immediately
                      const newCommentObj = {
                        text: newComment.trim(),
                        created_at: new Date().toISOString(),
                        author_id: currentUser.id,
                        userName: currentUser.displayName || 'You',
                        id: Date.now().toString()
                      }
                      setCommentDetails(prev => ({
                        ...prev,
                        [showCommentModal]: [...(prev[showCommentModal] || []), newCommentObj]
                      }))
                      
                      setNewComment('')
                      return
                    }
                    
                    // For regular posts/reels, use database
                    // Get profile ID first
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
                    })
                    
                    const profileResult = await profileResponse.json()
                    const profileId = profileResult.data?.profiles?.[0]?.id
                    
                    if (!profileId) {
                      throw new Error('Profile not found')
                    }
                    
                    const response = await fetch(`https://ofafvhtbuhvvkhuprotc.graphql.ap-southeast-1.nhost.run/v1`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'x-hasura-admin-secret': '2=o_TVK82F6FKyi8xcbfE9lAm,r,jpq@'
                      },
                      body: JSON.stringify({
                        query: `mutation AddComment($userId: uuid!, $postId: uuid!, $content: String!) {
                          insert_comments_one(object: {author_id: $userId, post_id: $postId, text: $content}) {
                            id
                          }
                        }`,
                        variables: {
                          userId: profileId,
                          postId: showCommentModal,
                          content: newComment.trim()
                        }
                      })
                    })
                    
                    const result = await response.json()
                    console.log('💬 Comment result:', result)
                    
                    // Update local state immediately
                    setPostComments(prev => ({
                      ...prev,
                      [showCommentModal]: (prev[showCommentModal] || 0) + 1
                    }))
                    
                    // Add comment to local details immediately with user info
                    const newCommentObj = {
                      text: newComment.trim(),
                      created_at: new Date().toISOString(),
                      author_id: profileId,
                      userName: currentUser.displayName || 'You',
                      id: result.data?.insert_comments_one?.id || Date.now().toString()
                    }
                    setCommentDetails(prev => ({
                      ...prev,
                      [showCommentModal]: [...(prev[showCommentModal] || []), newCommentObj]
                    }))
                    
                    setNewComment('')
                  } catch (error) {
                    console.error('❌ Comment error:', error)
                    alert('Failed to add comment. Please try again.')
                  }
                }}
                style={{
                  padding: '0.75rem 1rem',
                  background: 'linear-gradient(45deg, #FFD700, #FFA500)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#000',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Post
              </button>
            </div>
            
            <button
              onClick={() => setShowCommentModal(null)}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgba(212, 175, 55, 0.1)',
                border: '1px solid rgba(212, 175, 55, 0.5)',
                borderRadius: '8px',
                color: '#D4AF37',
                cursor: 'pointer',
                marginTop: '1rem'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* User Profile View */}
      {viewingProfile && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(135deg, #000000, #1a1a1a, #333333)',
          zIndex: 2000,
          overflowY: 'auto'
        }}>
          <div style={{ padding: '1rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
              <button
                onClick={() => {
                  // Always just close the profile view
                  setViewingProfile(null)
                  // Clear ALL modal tracking variables
                  window.lastFollowersModalType = null
                  window.tempViewedUser = null
                  // Ensure followers modal is closed
                  setShowFollowersModal(null)
                  setFollowersSearchQuery('')
                  setViewedUsersFromFollowers(new Set())
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#FFD700',
                  cursor: 'pointer',
                  fontSize: '1.5rem',
                  marginRight: '1rem'
                }}
              >
                ←
              </button>
              <h2 style={{ color: '#FFD700', margin: 0 }}>{viewingProfile.displayName}</h2>
            </div>
            
            {/* Profile Info */}
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div 
                onClick={() => {
                  // Stop all videos when clicking profile picture
                  document.querySelectorAll('video').forEach(video => {
                    video.pause()
                    video.currentTime = 0
                  })
                  setShowProfilePicOptions(viewingProfile)
                }}
                style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'linear-gradient(45deg, #FFD700, #FFA500)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', margin: '0 auto 1rem', fontSize: '2rem', border: '3px solid #D4AF37', overflow: 'hidden', cursor: 'pointer' }}>
                {viewingProfile.avatarUrl ? (
                  <img 
                    src={viewingProfile.avatarUrl} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    alt={viewingProfile.displayName}
                  />
                ) : (
                  (viewingProfile.displayName || 'U')[0]?.toUpperCase()
                )}
              </div>
              <h2 style={{ color: '#FFD700', margin: '0 0 0.5rem 0' }}>
                {viewingProfile.displayName}
              </h2>
              <p style={{ color: '#D4AF37', margin: 0, fontSize: '0.9rem' }}>
                @{viewingProfile.username || (viewingProfile.displayName || 'username').toLowerCase().replace(/[^a-z0-9]/g, '')}
              </p>
              {viewingProfile.bio && (
                <p style={{ color: '#D4AF37', margin: '0.5rem 0', fontSize: '0.9rem', lineHeight: 1.4 }}>
                  {viewingProfile.bio}
                </p>
              )}
              
              <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', margin: '1rem 0' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#FFD700', fontWeight: '600' }}>{posts.filter(post => post.user?.id === viewingProfile.id).length}</div>
                  <div style={{ color: '#D4AF37', fontSize: '0.9rem' }}>Posts</div>
                </div>
                <div 
                  style={{ textAlign: 'center', cursor: 'pointer' }}
                  onClick={() => {
                    // Show followers modal for the viewed user
                    window.lastFollowersModalType = 'followers'
                    setViewedUsersFromFollowers(new Set())
                    setShowFollowersModal('followers')
                    // Temporarily store the viewed user to show their followers
                    window.tempViewedUser = viewingProfile
                    loadRealFollowers()
                  }}
                >
                  <div style={{ color: '#FFD700', fontWeight: '600' }}>{followers[viewingProfile.id] || 0}</div>
                  <div style={{ color: '#D4AF37', fontSize: '0.9rem' }}>Followers</div>
                </div>
                <div 
                  style={{ textAlign: 'center', cursor: 'pointer' }}
                  onClick={() => {
                    // Show following modal for the viewed user
                    window.lastFollowersModalType = 'following'
                    setViewedUsersFromFollowers(new Set())
                    setShowFollowersModal('following')
                    // Temporarily store the viewed user to show who they follow
                    window.tempViewedUser = viewingProfile
                    loadRealFollowers()
                  }}
                >
                  <div style={{ color: '#FFD700', fontWeight: '600' }}>{followingData[viewingProfile.id]?.length || 0}</div>
                  <div style={{ color: '#D4AF37', fontSize: '0.9rem' }}>Following</div>
                </div>
              </div>
              
              {viewingProfile.id !== currentUser?.id && (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    onClick={async (e) => {
                      e.stopPropagation()
                      const button = e.target
                      if (button.disabled) return
                      button.disabled = true
                      
                      const isFollowing = following.has(viewingProfile.id)
                      
                      try {
                        const profileResponse = await fetch(`https://ofafvhtbuhvvkhuprotc.graphql.ap-southeast-1.nhost.run/v1`, {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            'x-hasura-admin-secret': '2=o_TVK82F6FKyi8xcbfE9lAm,r,jpq@'
                          },
                          body: JSON.stringify({
                            query: `query GetProfileIds($currentUserId: uuid!, $targetUserId: uuid!) {
                              currentUser: profiles(where: {auth_id: {_eq: $currentUserId}}) { id }
                              targetUser: profiles(where: {auth_id: {_eq: $targetUserId}}) { id }
                            }`,
                            variables: {
                              currentUserId: currentUser.id,
                              targetUserId: viewingProfile.id
                            }
                          })
                        })
                        
                        const profileResult = await profileResponse.json()
                        const currentProfileId = profileResult.data?.currentUser?.[0]?.id
                        const targetProfileId = profileResult.data?.targetUser?.[0]?.id
                        
                        if (isFollowing) {
                          await fetch(`https://ofafvhtbuhvvkhuprotc.graphql.ap-southeast-1.nhost.run/v1`, {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              'x-hasura-admin-secret': '2=o_TVK82F6FKyi8xcbfE9lAm,r,jpq@'
                            },
                            body: JSON.stringify({
                              query: `mutation Unfollow($followerId: uuid!, $followingId: uuid!) {
                                delete_follows(where: {follower_id: {_eq: $followerId}, following_id: {_eq: $followingId}}) {
                                  affected_rows
                                }
                              }`,
                              variables: { followerId: currentProfileId, followingId: targetProfileId }
                            })
                          })
                          setFollowing(prev => {
                            const newSet = new Set(prev)
                            newSet.delete(viewingProfile.id)
                            return newSet
                          })
                          setFollowers(prev => ({
                            ...prev,
                            [viewingProfile.id]: Math.max(0, (prev[viewingProfile.id] || 0) - 1)
                          }))
                        } else {
                          await fetch(`https://ofafvhtbuhvvkhuprotc.graphql.ap-southeast-1.nhost.run/v1`, {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              'x-hasura-admin-secret': '2=o_TVK82F6FKyi8xcbfE9lAm,r,jpq@'
                            },
                            body: JSON.stringify({
                              query: `mutation Follow($followerId: uuid!, $followingId: uuid!) {
                                insert_follows_one(
                                  object: {follower_id: $followerId, following_id: $followingId}
                                  on_conflict: {constraint: follows_pkey, update_columns: []}
                                ) {
                                  id
                                }
                              }`,
                              variables: { followerId: currentProfileId, followingId: targetProfileId }
                            })
                          })
                          setFollowing(prev => new Set([...prev, viewingProfile.id]))
                          setFollowers(prev => ({
                            ...prev,
                            [viewingProfile.id]: (prev[viewingProfile.id] || 0) + 1
                          }))
                        }
                      } catch (error) {
                        console.error('Follow error:', error)
                      } finally {
                        button.disabled = false
                      }
                    }}
                    style={{
                      padding: '0.5rem 1.5rem',
                      background: following.has(viewingProfile.id) ? 'rgba(212, 175, 55, 0.2)' : 'linear-gradient(45deg, #FFD700, #FFA500)',
                      border: following.has(viewingProfile.id) ? '1px solid #D4AF37' : 'none',
                      borderRadius: '6px',
                      color: following.has(viewingProfile.id) ? '#D4AF37' : '#000',
                      cursor: 'pointer',
                      fontWeight: '600'
                    }}
                  >
                    {following.has(viewingProfile.id) ? 'Following' : 'Follow'}
                  </button>
                  <button
                    onClick={() => setShowChatModal(viewingProfile)}
                    style={{
                      padding: '0.5rem 1.5rem',
                      background: 'rgba(212, 175, 55, 0.2)',
                      border: '1px solid #D4AF37',
                      borderRadius: '6px',
                      color: '#D4AF37',
                      cursor: 'pointer',
                      fontWeight: '600'
                    }}
                  >
                    Message
                  </button>
                </div>
              )}
            </div>
            
            {/* Posts Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
              {posts
                .filter(post => post.user?.id === viewingProfile.id)
                .map((post, i) => (
                  <div 
                    key={post.id || i} 
                    onClick={() => setShowPostModal(post)}
                    style={{
                      aspectRatio: '1',
                      background: !post.imageUrl ? 'linear-gradient(45deg, #000, #333)' : 'transparent',
                      border: '1px solid rgba(212, 175, 55, 0.3)',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#FFD700',
                      cursor: 'pointer',
                      overflow: 'hidden',
                      position: 'relative'
                    }}
                  >
                    {post.imageUrl ? (
                      post.fileType === 'video' ? (
                        <>
                          <video 
                            src={post.imageUrl} 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                            muted
                            onClick={(e) => {
                              const video = e.target
                              if (video.paused) {
                                video.play()
                              } else {
                                video.pause()
                              }
                            }}
                          />
                          <div style={{
                            position: 'absolute',
                            top: '0.5rem',
                            right: '0.5rem',
                            background: 'rgba(0, 0, 0, 0.7)',
                            borderRadius: '4px',
                            padding: '0.25rem',
                            fontSize: '0.8rem'
                          }}>
                            🎥
                          </div>
                        </>
                      ) : (
                        <img 
                          src={post.imageUrl} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          alt={post.title}
                        />
                      )
                    ) : (
                      '📷'
                    )}
                  </div>
                ))
              }
            </div>
            
            {posts.filter(post => post.user?.id === viewingProfile.id).length === 0 && (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#D4AF37' }}>
                No posts yet
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Caption Modal */}
      {editingPost && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div style={{
            background: 'rgba(0, 0, 0, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: '16px',
            padding: '2rem',
            width: '90%',
            maxWidth: '400px',
            border: '1px solid rgba(212, 175, 55, 0.5)'
          }}>
            <h3 style={{ color: '#FFD700', marginBottom: '1rem', textAlign: 'center' }}>Edit Caption</h3>
            
            <textarea
              value={editCaption}
              onChange={(e) => setEditCaption(e.target.value)}
              placeholder="Write a caption..."
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgba(212, 175, 55, 0.1)',
                border: '1px solid rgba(212, 175, 55, 0.5)',
                borderRadius: '8px',
                color: '#FFD700',
                resize: 'vertical',
                minHeight: '80px',
                marginBottom: '1rem'
              }}
            />
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => setEditingPost(null)}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: 'rgba(212, 175, 55, 0.1)',
                  border: '1px solid rgba(212, 175, 55, 0.5)',
                  borderRadius: '8px',
                  color: '#D4AF37',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    const updateQuery = editingPost.type === 'reel' ?
                      `mutation UpdateReel($id: uuid!, $caption: String!) { update_reels_by_pk(pk_columns: {id: $id}, _set: {caption: $caption}) { id caption } }` :
                      `mutation UpdatePost($id: uuid!, $caption: String!) { update_posts_by_pk(pk_columns: {id: $id}, _set: {caption: $caption}) { id caption } }`
                    
                    await fetch(`https://ofafvhtbuhvvkhuprotc.graphql.ap-southeast-1.nhost.run/v1`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'x-hasura-admin-secret': '2=o_TVK82F6FKyi8xcbfE9lAm,r,jpq@'
                      },
                      body: JSON.stringify({
                        query: updateQuery,
                        variables: { id: editingPost.id, caption: editCaption }
                      })
                    })
                    
                    setPosts(prev => prev.map(p => 
                      p.id === editingPost.id ? { ...p, content: editCaption, title: editCaption } : p
                    ))
                    setEditingPost(null)
                    alert('Caption updated!')
                  } catch (error) {
                    console.error('Update failed:', error)
                    alert('Failed to update caption')
                  }
                }}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: 'linear-gradient(45deg, #FFD700, #FFA500)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#000',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Post/Reel Modal */}
      {showPostModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: showPostModal.type === 'reel' ? '#000' : 'rgba(0,0,0,0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 3000,
          overflow: 'hidden'
        }}>
          <div style={{
            background: showPostModal.type === 'reel' ? '#000' : 'rgba(0, 0, 0, 0.95)',
            backdropFilter: showPostModal.type === 'reel' ? 'none' : 'blur(20px)',
            borderRadius: showPostModal.type === 'reel' ? '0' : '16px',
            width: showPostModal.type === 'reel' ? '100%' : '90%',
            maxWidth: showPostModal.type === 'reel' ? 'none' : '500px',
            maxHeight: showPostModal.type === 'reel' ? '100vh' : '80vh',
            height: showPostModal.type === 'reel' ? '100vh' : 'auto',
            overflow: 'hidden',
            border: '1px solid rgba(212, 175, 55, 0.5)',
            position: 'relative'
          }}>
            {/* Header */}
            <div style={{
              padding: '1rem',
              borderBottom: '1px solid rgba(212, 175, 55, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div 
                  onClick={() => {
                    const userStories = stories.filter(story => story.user?.authId === showPostModal.user?.id || story.user_id === showPostModal.user?.id)
                    if (userStories.length > 0) {
                      setUserStories(userStories)
                      setCurrentStoryIndex(0)
                      setShowStoryModal(userStories[0])
                      setShowPostModal(null)
                    }
                  }}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: 'linear-gradient(45deg, #FFD700, #FFA500)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#000',
                    fontWeight: 'bold',
                    overflow: 'hidden',
                    cursor: stories.some(story => story.user?.authId === showPostModal.user?.id || story.user_id === showPostModal.user?.id) ? 'pointer' : 'default',
                    border: stories.some(story => story.user?.authId === showPostModal.user?.id || story.user_id === showPostModal.user?.id) ? '3px solid #FF6B6B' : '3px solid transparent',
                    padding: '2px'
                  }}>
                  <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(45deg, #FFD700, #FFA500)' }}>
                    {showPostModal.user?.avatarUrl ? (
                      <img 
                        src={showPostModal.user.avatarUrl} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        alt={showPostModal.user.displayName}
                      />
                    ) : (
                      (showPostModal.user?.displayName || 'U')[0]?.toUpperCase()
                    )}
                  </div>
                </div>
                <div>
                  <div 
                    onClick={() => {
                      if (showPostModal?.user?.id && showPostModal.user.id !== currentUser?.id) {
                        const targetUser = users.find(u => u.id === showPostModal.user.id) || showPostModal.user
                        setViewingProfile(targetUser)
                        setShowPostModal(null)
                        setActiveTab('profile')
                        loadRealFollowers()
                      }
                    }}
                    style={{ 
                      color: '#FFD700', 
                      fontWeight: '600', 
                      fontSize: '0.9rem',
                      cursor: showPostModal?.user?.id !== currentUser?.id ? 'pointer' : 'default'
                    }}
                  >
                    {showPostModal.user?.displayName || 'User'}
                  </div>
                  <div style={{ color: '#D4AF37', fontSize: '0.7rem' }}>
                    {showPostModal.type === 'post' ? '📷 Post' : '🎥 Reel'}
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  // Stop all videos when closing modal
                  document.querySelectorAll('video').forEach(video => {
                    video.pause()
                    video.currentTime = 0
                  })
                  setShowPostModal(null)
                  setShowComments(false)
                  setCurrentPostImageIndex(0)
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#FFD700',
                  cursor: 'pointer',
                  fontSize: '1.5rem',
                  padding: '0.25rem'
                }}
              >
                ×
              </button>
            </div>
            
            {/* Content */}
            <div 
              style={{
                maxHeight: '400px',
                background: '#000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                position: 'relative'
              }}
              onTouchStart={(e) => {
                const touch = e.touches[0]
                e.currentTarget.startX = touch.clientX
              }}
              onTouchEnd={(e) => {
                const touch = e.changedTouches[0]
                const startX = e.currentTarget.startX
                const endX = touch.clientX
                const diff = startX - endX
                
                if (Math.abs(diff) > 50) {
                  const userPosts = viewingProfile ? 
                    posts.filter(post => post.user?.id === viewingProfile.id) :
                    posts.filter(post => post.user?.id === currentUser?.id)
                  const currentIndex = userPosts.findIndex(p => p.id === showPostModal.id)
                  
                  if (diff > 0 && currentIndex < userPosts.length - 1) {
                    setShowPostModal(userPosts[currentIndex + 1])
                  } else if (diff < 0 && currentIndex > 0) {
                    setShowPostModal(userPosts[currentIndex - 1])
                  }
                }
              }}
            >
              {(() => {
                const userPosts = viewingProfile ? 
                  posts.filter(post => post.user?.id === viewingProfile.id) :
                  posts.filter(post => post.user?.id === currentUser?.id)
                const currentIndex = userPosts.findIndex(p => p.id === showPostModal.id)
                
                return (
                  <>
                    {/* Left Arrow - Hidden for shared content */}
                    {!showPostModal.isSharedContent && currentIndex > 0 && (
                      <button
                        onClick={() => setShowPostModal(userPosts[currentIndex - 1])}
                        style={{
                          position: 'absolute',
                          left: '10px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'rgba(0, 0, 0, 0.5)',
                          border: 'none',
                          borderRadius: '50%',
                          color: '#fff',
                          cursor: 'pointer',
                          width: '40px',
                          height: '40px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.5rem',
                          zIndex: 10
                        }}
                      >
                        ‹
                      </button>
                    )}
                    
                    {/* Right Arrow - Hidden for shared content */}
                    {!showPostModal.isSharedContent && currentIndex < userPosts.length - 1 && (
                      <button
                        onClick={() => setShowPostModal(userPosts[currentIndex + 1])}
                        style={{
                          position: 'absolute',
                          right: '10px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'rgba(0, 0, 0, 0.5)',
                          border: 'none',
                          borderRadius: '50%',
                          color: '#fff',
                          cursor: 'pointer',
                          width: '40px',
                          height: '40px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.5rem',
                          zIndex: 10
                        }}
                      >
                        ›
                      </button>
                    )}
                    
                    {/* Post indicator dots - Hidden for shared content */}
                    {!showPostModal.isSharedContent && userPosts.length > 1 && (
                      <div style={{
                        position: 'absolute',
                        bottom: '10px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        display: 'flex',
                        gap: '4px',
                        zIndex: 10
                      }}>
                        {userPosts.map((_, index) => (
                          <div
                            key={index}
                            style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              background: index === currentIndex ? '#FFD700' : 'rgba(255,255,255,0.5)'
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </>
                )
              })()}
              {/* Swipe instruction */}
              {(() => {
                const userPosts = viewingProfile ? 
                  posts.filter(post => post.user?.id === viewingProfile.id) :
                  posts.filter(post => post.user?.id === currentUser?.id)
                return userPosts.length > 1 && (
                  <div style={{
                    position: 'absolute',
                    top: '10px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'rgba(0,0,0,0.7)',
                    color: '#fff',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '0.7rem',
                    zIndex: 10
                  }}>
                    Swipe to see more
                  </div>
                )
              })()}
              
              {showPostModal.imageUrl ? (
                showPostModal.fileType === 'video' ? (
                  <video 
                    src={showPostModal.imageUrl} 
                    style={{ width: '100%', height: 'auto', maxHeight: '400px', objectFit: 'contain' }} 
                    controls 
                    autoPlay
                    muted
                  />
                ) : (
                  <img 
                    src={showPostModal.imageUrl} 
                    style={{ width: '100%', height: 'auto', maxHeight: '400px', objectFit: 'contain' }}
                    alt={showPostModal.title}
                  />
                )
              ) : (
                <div style={{ color: '#FFD700', textAlign: 'center', padding: '2rem' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
                    {showPostModal.type === 'post' ? '📷' : '🎥'}
                  </div>
                  <div>{showPostModal.title || 'Content'}</div>
                </div>
              )}
            </div>
            
            {/* Actions */}
            <div style={{
              padding: '1rem',
              borderTop: '1px solid rgba(212, 175, 55, 0.3)'
            }}>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.75rem' }}>
                <HeartIcon 
                  filled={likedPosts.has(showPostModal.id)} 
                  onClick={async () => {
                    const postId = showPostModal.id
                    const isLiked = likedPosts.has(postId)
                    const isDisliked = dislikedPosts.has(postId)
                    
                    if (!currentUser?.id) return
                    
                    // If post is disliked, remove dislike first
                    if (isDisliked) {
                      try {
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
                        })
                        const profileResult = await profileResponse.json()
                        const profileId = profileResult.data?.profiles?.[0]?.id
                        
                        await fetch(`https://ofafvhtbuhvvkhuprotc.graphql.ap-southeast-1.nhost.run/v1`, {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            'x-hasura-admin-secret': '2=o_TVK82F6FKyi8xcbfE9lAm,r,jpq@'
                          },
                          body: JSON.stringify({
                            query: `mutation RemoveDislike($userId: uuid!, $postId: uuid!) {
                              delete_dislikes(where: {user_id: {_eq: $userId}, post_id: {_eq: $postId}}) {
                                affected_rows
                              }
                            }`,
                            variables: { userId: profileId, postId: postId }
                          })
                        })
                        
                        setDislikedPosts(prev => {
                          const newSet = new Set(prev)
                          newSet.delete(postId)
                          return newSet
                        })
                        setPostDislikes(prev => ({
                          ...prev,
                          [postId]: Math.max(0, (prev[postId] || 0) - 1)
                        }))
                      } catch (error) {
                        console.error('❌ Remove dislike error:', error)
                      }
                    }
                    
                    try {
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
                      })
                      
                      const profileResult = await profileResponse.json()
                      const profileId = profileResult.data?.profiles?.[0]?.id
                      
                      if (isLiked) {
                        await fetch(`https://ofafvhtbuhvvkhuprotc.graphql.ap-southeast-1.nhost.run/v1`, {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            'x-hasura-admin-secret': '2=o_TVK82F6FKyi8xcbfE9lAm,r,jpq@'
                          },
                          body: JSON.stringify({
                            query: `mutation RemoveLike($userId: uuid!, $postId: uuid!) {
                              delete_likes(where: {user_id: {_eq: $userId}, post_id: {_eq: $postId}}) {
                                affected_rows
                              }
                            }`,
                            variables: { userId: profileId, postId: postId }
                          })
                        })
                        setLikedPosts(prev => {
                          const newSet = new Set(prev)
                          newSet.delete(postId)
                          return newSet
                        })
                        setPostLikes(prev => ({
                          ...prev,
                          [postId]: Math.max(0, (prev[postId] || 0) - 1)
                        }))
                      } else {
                        await fetch(`https://ofafvhtbuhvvkhuprotc.graphql.ap-southeast-1.nhost.run/v1`, {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            'x-hasura-admin-secret': '2=o_TVK82F6FKyi8xcbfE9lAm,r,jpq@'
                          },
                          body: JSON.stringify({
                            query: `mutation AddLike($userId: uuid!, $postId: uuid!) {
                              insert_likes_one(object: {user_id: $userId, content_id: $postId, content_type: "reel"}, on_conflict: {constraint: likes_post_id_user_id_key, update_columns: []}) {
                                id
                              }
                            }`,
                            variables: { userId: profileId, postId: postId }
                          })
                        })
                        setLikedPosts(prev => new Set([...prev, postId]))
                        setPostLikes(prev => ({
                          ...prev,
                          [postId]: (prev[postId] || 0) + 1
                        }))
                      }
                    } catch (error) {
                      console.error('Like error:', error)
                    }
                  }}
                />
                <DislikeIcon 
                  filled={dislikedPosts.has(showPostModal.id)} 
                  onClick={async () => {
                    const postId = showPostModal.id
                    const isDisliked = dislikedPosts.has(postId)
                    const isLiked = likedPosts.has(postId)
                    
                    if (!currentUser?.id) return
                    
                    // If post is liked, remove like first
                    if (isLiked) {
                      try {
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
                        })
                        const profileResult = await profileResponse.json()
                        const profileId = profileResult.data?.profiles?.[0]?.id
                        
                        await fetch(`https://ofafvhtbuhvvkhuprotc.graphql.ap-southeast-1.nhost.run/v1`, {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            'x-hasura-admin-secret': '2=o_TVK82F6FKyi8xcbfE9lAm,r,jpq@'
                          },
                          body: JSON.stringify({
                            query: `mutation RemoveLike($userId: uuid!, $postId: uuid!) {
                              delete_likes(where: {user_id: {_eq: $userId}, post_id: {_eq: $postId}}) {
                                affected_rows
                              }
                            }`,
                            variables: { userId: profileId, postId: postId }
                          })
                        })
                        
                        setLikedPosts(prev => {
                          const newSet = new Set(prev)
                          newSet.delete(postId)
                          return newSet
                        })
                        setPostLikes(prev => ({
                          ...prev,
                          [postId]: Math.max(0, (prev[postId] || 0) - 1)
                        }))
                      } catch (error) {
                        console.error('❌ Remove like error:', error)
                      }
                    }
                    
                    try {
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
                      })
                      
                      const profileResult = await profileResponse.json()
                      const profileId = profileResult.data?.profiles?.[0]?.id
                      
                      if (isDisliked) {
                        await fetch(`https://ofafvhtbuhvvkhuprotc.graphql.ap-southeast-1.nhost.run/v1`, {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            'x-hasura-admin-secret': '2=o_TVK82F6FKyi8xcbfE9lAm,r,jpq@'
                          },
                          body: JSON.stringify({
                            query: `mutation RemoveDislike($userId: uuid!, $postId: uuid!) {
                              delete_dislikes(where: {user_id: {_eq: $userId}, post_id: {_eq: $postId}}) {
                                affected_rows
                              }
                            }`,
                            variables: { userId: profileId, postId: postId }
                          })
                        })
                        setDislikedPosts(prev => {
                          const newSet = new Set(prev)
                          newSet.delete(postId)
                          return newSet
                        })
                        setPostDislikes(prev => ({
                          ...prev,
                          [postId]: Math.max(0, (prev[postId] || 0) - 1)
                        }))
                      } else {
                        await fetch(`https://ofafvhtbuhvvkhuprotc.graphql.ap-southeast-1.nhost.run/v1`, {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            'x-hasura-admin-secret': '2=o_TVK82F6FKyi8xcbfE9lAm,r,jpq@'
                          },
                          body: JSON.stringify({
                            query: `mutation AddDislike($userId: uuid!, $postId: uuid!) {
                              insert_dislikes_one(object: {user_id: $userId, content_id: $postId, content_type: "reel"}, on_conflict: {constraint: dislikes_post_id_user_id_key, update_columns: []}) {
                                id
                              }
                            }`,
                            variables: { userId: profileId, postId: postId }
                          })
                        })
                        setDislikedPosts(prev => new Set([...prev, postId]))
                        setPostDislikes(prev => ({
                          ...prev,
                          [postId]: (prev[postId] || 0) + 1
                        }))
                      }
                    } catch (error) {
                      console.error('Dislike error:', error)
                    }
                  }}
                />
                <CommentIcon onClick={() => {
                  // Use comment modal for better UX
                  setShowCommentModal(showPostModal.id)
                }} />
                <ShareIcon onClick={() => {
                  setSelectedPostForSponsoring(showPostModal)
                  setShowShareModal(true)
                  setSelectedUsers(new Set())
                  setShareMessage('')
                  setShareSearchQuery('')
                }} />
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem' }}>
                <div style={{ color: '#FFD700', fontSize: '0.9rem', fontWeight: '600' }}>
                  {postLikes[showPostModal.id] || 0} likes
                </div>
                <div style={{ color: '#ff4444', fontSize: '0.9rem', fontWeight: '600' }}>
                  {postDislikes[showPostModal.id] || 0} dislikes
                </div>
                <div style={{ color: '#FFD700', fontSize: '0.9rem', fontWeight: '600' }}>
                  {postComments[showPostModal.id] || 0} comments
                </div>
              </div>
              
              {(showPostModal?.content || showPostModal?.title) && (
                <p style={{ color: '#FFD700', margin: 0, fontSize: '0.9rem' }}>
                  <strong 
                    onClick={() => {
                      if (showPostModal?.user?.id && showPostModal.user.id !== currentUser?.id) {
                        const targetUser = users.find(u => u.id === showPostModal.user.id) || showPostModal.user
                        setViewingProfile(targetUser)
                        setShowPostModal(null)
                        setActiveTab('profile')
                        loadRealFollowers()
                      }
                    }}
                    style={{
                      cursor: showPostModal?.user?.id !== currentUser?.id ? 'pointer' : 'default',
                      color: showPostModal?.user?.id !== currentUser?.id ? '#FFD700' : 'inherit'
                    }}
                  >
                    {showPostModal.user?.displayName || 'User'}
                  </strong> 
                  <span style={{ color: '#D4AF37', marginLeft: '0.5rem' }}>
                    {showPostModal.content || showPostModal.title || 'No caption'}
                  </span>
                </p>
              )}
              
              <div style={{ color: '#888', fontSize: '0.7rem', marginTop: '0.5rem' }}>
                {new Date(showPostModal.createdAt).toLocaleDateString()}
              </div>
              
              {/* Comments Section */}
              {showComments && (
                <>
                  <div style={{ marginTop: '1rem', maxHeight: '150px', overflowY: 'auto' }}>
                    {commentDetails[showPostModal.id] && commentDetails[showPostModal.id].length > 0 ? (
                      commentDetails[showPostModal.id].map((comment, i) => (
                        <div key={i} style={{
                          padding: '0.5rem 0',
                          borderBottom: '1px solid rgba(212, 175, 55, 0.1)'
                        }}>
                          <div style={{ color: '#FFD700', fontSize: '0.8rem', fontWeight: '600' }}>
                            {comment.userName || 'User'}
                          </div>
                          <div style={{ color: '#D4AF37', fontSize: '0.9rem' }}>
                            {comment.text}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ color: '#D4AF37', fontSize: '0.9rem', textAlign: 'center', padding: '1rem' }}>
                        No comments yet
                      </div>
                    )}
                  </div>
                  
                  {/* Add Comment */}
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                    <input
                      type="text"
                      placeholder="Add a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '0.5rem',
                        background: 'rgba(212, 175, 55, 0.1)',
                        border: '1px solid rgba(212, 175, 55, 0.5)',
                        borderRadius: '6px',
                        color: '#FFD700',
                        fontSize: '0.9rem'
                      }}
                    />
                    <button
                      onClick={async () => {
                        if (!newComment.trim() || !currentUser?.id) return
                        
                        try {
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
                          })
                          
                          const profileResult = await profileResponse.json()
                          const profileId = profileResult.data?.profiles?.[0]?.id
                          
                          await fetch(`https://ofafvhtbuhvvkhuprotc.graphql.ap-southeast-1.nhost.run/v1`, {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              'x-hasura-admin-secret': '2=o_TVK82F6FKyi8xcbfE9lAm,r,jpq@'
                            },
                            body: JSON.stringify({
                              query: `mutation AddComment($userId: uuid!, $postId: uuid!, $content: String!) {
                                insert_comments_one(object: {author_id: $userId, post_id: $postId, text: $content}) {
                                  id
                                }
                              }`,
                              variables: {
                                userId: profileId,
                                postId: showPostModal.id,
                                content: newComment.trim()
                              }
                            })
                          })
                          
                          setPostComments(prev => ({
                            ...prev,
                            [showPostModal.id]: (prev[showPostModal.id] || 0) + 1
                          }))
                          
                          const newCommentObj = {
                            text: newComment.trim(),
                            created_at: new Date().toISOString(),
                            userName: currentUser.displayName
                          }
                          setCommentDetails(prev => ({
                            ...prev,
                            [showPostModal.id]: [...(prev[showPostModal.id] || []), newCommentObj]
                          }))
                          
                          setNewComment('')
                        } catch (error) {
                          console.error('Comment error:', error)
                        }
                      }}
                      style={{
                        padding: '0.5rem 1rem',
                        background: 'linear-gradient(45deg, #FFD700, #FFA500)',
                        border: 'none',
                        borderRadius: '6px',
                        color: '#000',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '0.9rem'
                      }}
                    >
                      Post
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Chat Modal */}
      {showChatModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(135deg, #000000, #1a1a1a, #333333)',
          zIndex: 2000,
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{
            background: 'rgba(0, 0, 0, 0.9)',
            backdropFilter: 'blur(10px)',
            borderBottom: '1px solid rgba(212, 175, 55, 0.3)',
            padding: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <button
              onClick={() => setShowChatModal(null)}
              style={{
                background: 'none',
                border: 'none',
                color: '#FFD700',
                cursor: 'pointer',
                fontSize: '1.5rem'
              }}
            >
              ←
            </button>
            
            <div 
              onClick={() => {
                const userStories = stories.filter(story => story.user?.authId === showChatModal.id || story.user_id === showChatModal.id)
                if (userStories.length > 0) {
                  setUserStories(userStories)
                  setCurrentStoryIndex(0)
                  setShowStoryModal(userStories[0])
                  setShowChatModal(null)
                }
              }}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'linear-gradient(45deg, #FFD700, #FFA500)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#000',
                fontWeight: 'bold',
                overflow: 'hidden',
                cursor: stories.some(story => story.user?.authId === showChatModal.id || story.user_id === showChatModal.id) ? 'pointer' : 'default',
                border: stories.some(story => story.user?.authId === showChatModal.id || story.user_id === showChatModal.id) ? '3px solid #FF6B6B' : '3px solid transparent'
              }}>
              {showChatModal.avatarUrl ? (
                <img 
                  src={showChatModal.avatarUrl} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  alt={showChatModal.displayName}
                />
              ) : (
                (showChatModal.displayName || 'U')[0]?.toUpperCase()
              )}
            </div>
            
            <div 
              onClick={() => {
                setViewingProfile(showChatModal)
                setShowChatModal(null)
              }}
              style={{ cursor: 'pointer' }}>
              <div style={{ color: '#FFD700', fontWeight: '600' }}>
                {showChatModal.displayName || 'User'}
              </div>
              <div style={{ color: '#D4AF37', fontSize: '0.8rem' }}>
                {onlineUsers.has(showChatModal.id) ? 'Online' : 'Offline'}
              </div>
            </div>
          </div>
          
          <div 
            ref={(el) => {
              if (el && showChatModal?.id) {
                const currentCount = chatMessages[showChatModal.id]?.length || 0
                const prevCount = lastMessageCount[showChatModal.id] || 0
                
                if (currentCount > prevCount) {
                  if (isAtBottom) {
                    el.scrollTop = el.scrollHeight
                  } else {
                    setNewMessageAlert(true)
                  }
                  setLastMessageCount(prev => ({ ...prev, [showChatModal.id]: currentCount }))
                }
              }
            }}
            onScroll={(e) => {
              const { scrollTop, scrollHeight, clientHeight } = e.target
              const atBottom = scrollHeight - scrollTop - clientHeight < 50
              setIsAtBottom(atBottom)
              if (atBottom) {
                setNewMessageAlert(false)
              }
            }}
            style={{
              flex: 1,
              padding: '1rem',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              position: 'relative'
            }}>
            {chatMessages[showChatModal.id] && chatMessages[showChatModal.id].length > 0 ? (
              chatMessages[showChatModal.id].map((msg, i) => (
                <div key={i} style={{
                  display: 'flex',
                  justifyContent: msg.sender === currentUser?.id ? 'flex-end' : 'flex-start',
                  alignItems: 'flex-end',
                  gap: '0.5rem'
                }}>
                  <div style={{
                    maxWidth: '70%',
                    padding: (msg.text.includes('[REEL_PREVIEW:') || msg.text.includes('[POST_PREVIEW:')) ? '0' : '0.75rem 1rem',
                    borderRadius: '18px',
                    background: msg.sender === currentUser?.id 
                      ? 'linear-gradient(45deg, #FFD700, #FFA500)' 
                      : 'rgba(212, 175, 55, 0.2)',
                    color: msg.sender === currentUser?.id ? '#000' : '#FFD700',
                    wordBreak: 'break-word',
                    overflow: 'hidden'
                  }}>
                    {msg.text.includes('[REEL_PREVIEW:') ? (
                      <div>
                        <div style={{ padding: '0.75rem 1rem', paddingBottom: '0.5rem' }}>
                          {msg.text.split('[REEL_PREVIEW:')[0]}
                        </div>
                        <div style={{
                          background: 'rgba(0,0,0,0.2)',
                          padding: '0.5rem',
                          display: 'flex',
                          gap: '0.5rem',
                          alignItems: 'center',
                          position: 'relative'
                        }}>
                          <div 
                            onClick={() => {
                              const videoUrl = msg.text.match(/\[REEL_PREVIEW:(.+?)\]/)?.[1]
                              if (videoUrl) {
                                // Create full screen reel player
                                const fullScreenDiv = document.createElement('div')
                                fullScreenDiv.style.cssText = `
                                  position: fixed;
                                  top: 0;
                                  left: 0;
                                  width: 100vw;
                                  height: 100vh;
                                  background: #000;
                                  z-index: 10000;
                                  display: flex;
                                  align-items: center;
                                  justify-content: center;
                                `
                                
                                const video = document.createElement('video')
                                video.src = videoUrl
                                video.style.cssText = `
                                  width: 100%;
                                  height: 100%;
                                  object-fit: cover;
                                  max-width: 400px;
                                  max-height: 100vh;
                                `
                                video.controls = false
                                video.autoplay = true
                                video.loop = true
                                video.muted = false
                                
                                // Close button
                                const closeBtn = document.createElement('button')
                                closeBtn.innerHTML = '×'
                                closeBtn.style.cssText = `
                                  position: absolute;
                                  top: 20px;
                                  right: 20px;
                                  background: rgba(0,0,0,0.7);
                                  border: none;
                                  color: white;
                                  font-size: 2rem;
                                  width: 40px;
                                  height: 40px;
                                  border-radius: 50%;
                                  cursor: pointer;
                                  z-index: 10001;
                                `
                                
                                closeBtn.onclick = () => {
                                  document.body.removeChild(fullScreenDiv)
                                }
                                
                                // Click outside to close
                                fullScreenDiv.onclick = (e) => {
                                  if (e.target === fullScreenDiv) {
                                    document.body.removeChild(fullScreenDiv)
                                  }
                                }
                                
                                // Play/pause on video click
                                video.onclick = (e) => {
                                  e.stopPropagation()
                                  if (video.paused) {
                                    video.play()
                                  } else {
                                    video.pause()
                                  }
                                }
                                
                                // Action buttons container
                                const actionsDiv = document.createElement('div')
                                actionsDiv.style.cssText = `
                                  position: absolute;
                                  right: 20px;
                                  bottom: 100px;
                                  display: flex;
                                  flex-direction: column;
                                  gap: 1rem;
                                  align-items: center;
                                  z-index: 10001;
                                `
                                
                                // Like button
                                const likeBtn = document.createElement('button')
                                likeBtn.innerHTML = `
                                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                                  </svg>
                                `
                                likeBtn.style.cssText = `
                                  background: rgba(0,0,0,0.5);
                                  border: none;
                                  border-radius: 50%;
                                  width: 50px;
                                  height: 50px;
                                  cursor: pointer;
                                  display: flex;
                                  align-items: center;
                                  justify-content: center;
                                `
                                likeBtn.onclick = (e) => {
                                  e.stopPropagation()
                                  likeBtn.querySelector('svg').setAttribute('fill', likeBtn.querySelector('svg').getAttribute('fill') === 'red' ? 'none' : 'red')
                                }
                                
                                // Comment button
                                const commentBtn = document.createElement('button')
                                commentBtn.innerHTML = `
                                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                                  </svg>
                                `
                                commentBtn.style.cssText = likeBtn.style.cssText
                                commentBtn.onclick = (e) => {
                                  e.stopPropagation()
                                  // Create a unique ID for the shared reel
                                  const sharedReelId = `shared-reel-${videoUrl.split('/').pop()}`
                                  setShowCommentModal(sharedReelId)
                                  // Close full screen
                                  document.body.removeChild(fullScreenDiv)
                                }
                                
                                // Share button
                                const shareBtn = document.createElement('button')
                                shareBtn.innerHTML = `
                                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                                    <circle cx="18" cy="5" r="3"/>
                                    <circle cx="6" cy="12" r="3"/>
                                    <circle cx="18" cy="19" r="3"/>
                                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                                  </svg>
                                `
                                shareBtn.style.cssText = likeBtn.style.cssText
shareBtn.onclick = (e) => {
                                  e.stopPropagation()
                                  // Create reel object for sharing
                                  const reelObj = {
                                    id: 'shared-reel',
                                    imageUrl: videoUrl,
                                    content: reelCaption,
                                    user: { displayName: reelCreator, id: creatorUser?.id }
                                  }
                                  setSelectedPostForSponsoring(reelObj)
                                  setShowShareModal(true)
                                  setSelectedUsers(new Set())
                                  setShareMessage('')
                                  setShareSearchQuery('')
                                  // Close full screen
                                  document.body.removeChild(fullScreenDiv)
                                }
                                
                                // Three dots menu
                                const menuBtn = document.createElement('button')
                                menuBtn.innerHTML = `
                                  <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                                    <circle cx="12" cy="5" r="2"/>
                                    <circle cx="12" cy="12" r="2"/>
                                    <circle cx="12" cy="19" r="2"/>
                                  </svg>
                                `
                                menuBtn.style.cssText = likeBtn.style.cssText
menuBtn.onclick = (e) => {
                                  e.stopPropagation()
                                  
                                  // Create dropdown menu
                                  const dropdown = document.createElement('div')
                                  dropdown.style.cssText = `
                                    position: absolute;
                                    bottom: 100%;
                                    right: 0;
                                    background: rgba(0, 0, 0, 0.95);
                                    border: 2px solid rgba(255, 255, 255, 0.3);
                                    border-radius: 12px;
                                    min-width: 200px;
                                    z-index: 10002;
                                    backdrop-filter: blur(15px);
                                    box-shadow: 0 8px 32px rgba(0,0,0,0.8);
                                  `
                                  
                                  // Download button
                                  const downloadBtn = document.createElement('button')
                                  downloadBtn.innerHTML = '📥 Download'
                                  downloadBtn.style.cssText = `
                                    width: 100%;
                                    padding: 1rem 1.5rem;
                                    background: none;
                                    border: none;
                                    color: #fff;
                                    cursor: pointer;
                                    text-align: left;
                                    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
                                    font-size: 0.9rem;
                                    font-weight: 500;
                                  `
                                  downloadBtn.onmouseenter = () => downloadBtn.style.background = 'rgba(255,255,255,0.1)'
                                  downloadBtn.onmouseleave = () => downloadBtn.style.background = 'none'
                                  downloadBtn.onclick = async () => {
                                    try {
                                      const response = await fetch(videoUrl)
                                      const blob = await response.blob()
                                      const url = window.URL.createObjectURL(blob)
                                      const a = document.createElement('a')
                                      a.href = url
                                      a.download = `reel_${Date.now()}.mp4`
                                      document.body.appendChild(a)
                                      a.click()
                                      document.body.removeChild(a)
                                      window.URL.revokeObjectURL(url)
                                      alert('Reel downloaded!')
                                    } catch (error) {
                                      alert('Download failed. Please try again.')
                                    }
                                    dropdown.remove()
                                  }
                                  
                                  // Share to platforms button
                                  const platformBtn = document.createElement('button')
                                  platformBtn.innerHTML = '🌐 Share to Platforms'
                                  platformBtn.style.cssText = downloadBtn.style.cssText
                                  platformBtn.onmouseenter = () => platformBtn.style.background = 'rgba(255,255,255,0.1)'
                                  platformBtn.onmouseleave = () => platformBtn.style.background = 'none'
                                  platformBtn.onclick = () => {
                                    const shareText = `Check out this amazing reel by ${reelCreator}! ${reelCaption || ''} ${videoUrl}`
                                    const platforms = [
                                      { name: 'WhatsApp', url: `https://wa.me/?text=${encodeURIComponent(shareText)}` },
                                      { name: 'Twitter', url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}` },
                                      { name: 'Facebook', url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(videoUrl)}` },
                                      { name: 'Telegram', url: `https://t.me/share/url?url=${encodeURIComponent(videoUrl)}&text=${encodeURIComponent(reelCaption || 'Check out this reel!')}` }
                                    ]
                                    
                                    const platformChoice = prompt(`Share to platform:\n${platforms.map((p, i) => `${i+1}. ${p.name}`).join('\n')}\n\nEnter number (1-${platforms.length}):`, '1')
                                    const platformIndex = parseInt(platformChoice) - 1
                                    
                                    if (platformIndex >= 0 && platformIndex < platforms.length) {
                                      window.open(platforms[platformIndex].url, '_blank')
                                    }
                                    dropdown.remove()
                                  }
                                  
                                  // Save button
                                  const saveBtn = document.createElement('button')
                                  const isCurrentlySaved = savedPosts.has(reelId)
                                  saveBtn.innerHTML = isCurrentlySaved ? '💾 Unsave' : '💾 Save'
                                  saveBtn.style.cssText = downloadBtn.style.cssText.replace('border-bottom: 1px solid rgba(255, 255, 255, 0.2);', '')
                                  saveBtn.onmouseenter = () => saveBtn.style.background = 'rgba(255,255,255,0.1)'
                                  saveBtn.onmouseleave = () => saveBtn.style.background = 'none'
                                  saveBtn.onclick = async () => {
                                    console.log('💾 Dynamic reel save button clicked for reel:', reelId)
                                    console.log('💾 Current saved posts:', Array.from(savedPosts))
                                    const isCurrentlySaved = savedPosts.has(reelId)
                                    console.log('💾 Is currently saved:', isCurrentlySaved)
                                    
                                    if (isCurrentlySaved) {
                                      // Remove from saved
                                      setSavedPosts(prev => {
                                        const newSet = new Set(prev)
                                        newSet.delete(reelId)
                                        return newSet
                                      })
                                      
                                      // Remove from database
                                      try {
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
                                        })
                                        const profileResult = await profileResponse.json()
                                        const profileId = profileResult.data?.profiles?.[0]?.id
                                        
                                        await fetch(`https://ofafvhtbuhvvkhuprotc.graphql.ap-southeast-1.nhost.run/v1`, {
                                          method: 'POST',
                                          headers: {
                                            'Content-Type': 'application/json',
                                            'x-hasura-admin-secret': '2=o_TVK82F6FKyi8xcbfE9lAm,r,jpq@'
                                          },
                                          body: JSON.stringify({
                                            query: `mutation RemoveSaved($userId: uuid!, $postId: uuid!) {
                                              delete_user_saved_content(where: {user_id: {_eq: $userId}, post_id: {_eq: $postId}}) {
                                                affected_rows
                                              }
                                            }`,
                                            variables: { userId: profileId, postId: reelId }
                                          })
                                        })
                                      } catch (error) {
                                        console.error('Remove saved error:', error)
                                      }
                                      
                                      alert('Reel removed from saved!')
                                    } else {
                                      // Add to saved
                                      setSavedPosts(prev => new Set([...prev, reelId]))
                                      
                                      // Save to database
                                      try {
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
                                        })
                                        const profileResult = await profileResponse.json()
                                        const profileId = profileResult.data?.profiles?.[0]?.id
                                        
                                        await fetch(`https://ofafvhtbuhvvkhuprotc.graphql.ap-southeast-1.nhost.run/v1`, {
                                          method: 'POST',
                                          headers: {
                                            'Content-Type': 'application/json',
                                            'x-hasura-admin-secret': '2=o_TVK82F6FKyi8xcbfE9lAm,r,jpq@'
                                          },
                                          body: JSON.stringify({
                                            query: `mutation AddSaved($userId: uuid!, $postId: uuid!) {
                                              insert_user_saved_content_one(object: {user_id: $userId, content_id: $postId, content_type: "reel"}, on_conflict: {constraint: user_saved_content_user_id_content_id_content_type_key, update_columns: []}) {
                                                id
                                              }
                                            }`,
                                            variables: { userId: profileId, postId: reelId }
                                          })
                                        })
                                      } catch (error) {
                                        console.error('Save reel error:', error)
                                      }
                                      
                                      alert('Reel saved!')
                                    }
                                    
                                    // Refresh saved posts to ensure UI is updated
                                    await loadSavedPosts()
                                    console.log('💾 Dynamic saved posts refreshed after save operation')
                                    dropdown.remove()
                                  }
                                  
                                  dropdown.appendChild(downloadBtn)
                                  dropdown.appendChild(platformBtn)
                                  dropdown.appendChild(saveBtn)
                                  
                                  // Position relative to menu button
                                  menuBtn.style.position = 'relative'
                                  menuBtn.appendChild(dropdown)
                                  
                                  // Close dropdown when clicking outside
                                  setTimeout(() => {
                                    const closeDropdown = (event) => {
                                      if (!dropdown.contains(event.target) && event.target !== menuBtn) {
                                        dropdown.remove()
                                        document.removeEventListener('click', closeDropdown)
                                      }
                                    }
                                    document.addEventListener('click', closeDropdown)
                                  }, 100)
                                }
                                
                                // User info overlay
                                const userInfoDiv = document.createElement('div')
                                // Extract username from different possible formats
                                let reelCreator = 'User'
                                let reelCaption = ''
                                
                                // Try multiple patterns to extract username
                                const patterns = [
                                  /shared a reel by ([^\n]+)/,
                                  /reel by ([^\n]+)/,
                                  /by ([^\n]+)/
                                ]
                                
                                for (const pattern of patterns) {
                                  const match = msg.text.match(pattern)
                                  if (match && match[1]) {
                                    reelCreator = match[1].trim()
                                    break
                                  }
                                }
                                
                                // Extract caption from quotes
                                const captionMatch = msg.text.match(/"([^"]+)"/)
                                if (captionMatch && captionMatch[1]) {
                                  reelCaption = captionMatch[1]
                                }
                                
                                console.log('Extracted creator:', reelCreator, 'Caption:', reelCaption, 'From text:', msg.text)
                                
                                // Find the user profile for avatar - try multiple matching strategies
                                let creatorUser = users.find(u => u.displayName === reelCreator)
                                if (!creatorUser) {
                                  // Try case-insensitive match
                                  creatorUser = users.find(u => u.displayName?.toLowerCase() === reelCreator.toLowerCase())
                                }
                                if (!creatorUser) {
                                  // Try partial match
                                  creatorUser = users.find(u => u.displayName?.toLowerCase().includes(reelCreator.toLowerCase()))
                                }
                                console.log('Found creator user:', creatorUser, 'for creator name:', reelCreator)
                                
                                // Create user info elements
                                const avatarDiv = document.createElement('div')
                                avatarDiv.style.cssText = `
                                  width: 40px;
                                  height: 40px;
                                  border-radius: 50%;
                                  background: linear-gradient(45deg, #FFD700, #FFA500);
                                  display: flex;
                                  align-items: center;
                                  justify-content: center;
                                  color: #000;
                                  font-weight: bold;
                                  overflow: hidden;
                                  cursor: pointer;
                                `
                                
                                if (creatorUser?.avatarUrl) {
                                  const img = document.createElement('img')
                                  img.src = creatorUser.avatarUrl
                                  img.alt = reelCreator
                                  img.style.cssText = 'width: 100%; height: 100%; object-fit: cover;'
                                  avatarDiv.appendChild(img)
                                } else {
                                  avatarDiv.textContent = reelCreator[0]?.toUpperCase() || 'U'
                                }
                                
                                const usernameDiv = document.createElement('div')
                                usernameDiv.textContent = reelCreator
                                usernameDiv.style.cssText = `
                                  color: white;
                                  font-weight: 600;
                                  font-size: 0.9rem;
                                  cursor: pointer;
                                `
                                
                                // Add click handlers
                                const handleProfileClick = (e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  
                                  let targetUser = creatorUser
                                  if (!targetUser || !targetUser.id) {
                                    targetUser = {
                                      id: `shared-user-${reelCreator.replace(/[^a-zA-Z0-9]/g, '')}`,
                                      displayName: reelCreator,
                                      avatarUrl: creatorUser?.avatarUrl || null,
                                      email: `${reelCreator.toLowerCase().replace(/[^a-z0-9]/g, '')}@example.com`
                                    }
                                  }
                                  
                                  console.log('Opening profile for:', targetUser)
                                  
                                  // Close the full screen reel first
                                  if (document.body.contains(fullScreenDiv)) {
                                    document.body.removeChild(fullScreenDiv)
                                  }
                                  
                                  // Use setTimeout to ensure the reel is closed before navigating
                                  setTimeout(() => {
                                    setViewingProfile(targetUser)
                                    setActiveTab('profile')
                                    loadRealFollowers()
                                  }, 100)
                                }
                                
                                avatarDiv.addEventListener('click', handleProfileClick)
                                usernameDiv.addEventListener('click', handleProfileClick)
                                
                                // Prevent event bubbling on the containers
                                avatarDiv.addEventListener('touchstart', (e) => e.stopPropagation())
                                usernameDiv.addEventListener('touchstart', (e) => e.stopPropagation())
                                
                                // Build the user info structure
                                const userContainer = document.createElement('div')
                                userContainer.style.cssText = `
                                  display: flex;
                                  align-items: center;
                                  gap: 0.75rem;
                                  margin-bottom: 0.5rem;
                                `
                                
                                const textContainer = document.createElement('div')
                                textContainer.appendChild(usernameDiv)
                                
                                userContainer.appendChild(avatarDiv)
                                userContainer.appendChild(textContainer)
                                userInfoDiv.appendChild(userContainer)
                                
                                // Add caption if exists
                                if (reelCaption) {
                                  const captionDiv = document.createElement('div')
                                  captionDiv.textContent = reelCaption
                                  captionDiv.style.cssText = `
                                    color: white;
                                    font-size: 0.9rem;
                                    line-height: 1.3;
                                    margin-bottom: 0.5rem;
                                  `
                                  userInfoDiv.appendChild(captionDiv)
                                }
                                
                                // Prevent user info clicks from bubbling to fullscreen
                                userInfoDiv.addEventListener('click', (e) => {
                                  e.stopPropagation()
                                })
                                
                                // Profile opening is now handled directly by click handlers above
                                
                                userInfoDiv.style.cssText = `
                                  position: absolute;
                                  bottom: 120px;
                                  left: 1rem;
                                  right: 80px;
                                  color: white;
                                  z-index: 10001;
                                `
                                
                                actionsDiv.appendChild(likeBtn)
                                actionsDiv.appendChild(commentBtn)
                                actionsDiv.appendChild(shareBtn)
                                actionsDiv.appendChild(menuBtn)
                                
                                fullScreenDiv.appendChild(video)
                                fullScreenDiv.appendChild(closeBtn)
                                fullScreenDiv.appendChild(userInfoDiv)
                                fullScreenDiv.appendChild(actionsDiv)
                                document.body.appendChild(fullScreenDiv)
                              }
                            }}
                            style={{
                              width: '50px',
                              height: '70px',
                              borderRadius: '6px',
                              overflow: 'hidden',
                              background: '#000',
                              position: 'relative',
                              cursor: 'pointer'
                            }}>
                            {(() => {
                              const videoUrl = msg.text.match(/\[REEL_PREVIEW:(.+?)\]/)?.[1]
                              return videoUrl ? (
                                <>
                                  <video 
                                    src={videoUrl}
                                    style={{
                                      width: '100%',
                                      height: '100%',
                                      objectFit: 'cover'
                                    }}
                                    muted
                                  />
                                  <div style={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    color: '#fff',
                                    fontSize: '1.2rem'
                                  }}>
                                    ▶
                                  </div>
                                </>
                              ) : (
                                <div style={{
                                  width: '100%',
                                  height: '100%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#fff',
                                  fontSize: '1.5rem'
                                }}>
                                  🎥
                                </div>
                              )
                            })()} 
                          </div>
                          <div style={{ flex: 1, fontSize: '0.8rem' }}>
                            <div style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'space-between',
                              marginBottom: '0.25rem'
                            }}>
                              <div style={{ fontWeight: '600' }}>Reel</div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  const messageId = `${msg.sender}-${msg.timestamp}-reel`
                                  setShowReactionBox(showReactionBox === messageId ? null : messageId)
                                }}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#FFD700',
                                  cursor: 'pointer',
                                  fontSize: '0.9rem',
                                  padding: '0.2rem'
                                }}
                              >
                                😊
                              </button>
                            </div>
                            <div style={{ opacity: 0.8 }}>Tap to play</div>
                            
                            {/* Reaction Display */}
                            {(() => {
                              const messageId = `${msg.sender}-${msg.timestamp}-reel`
                              return sharedContentReactions[messageId] && (
                                <div style={{
                                  marginTop: '0.5rem',
                                  display: 'flex',
                                  flexWrap: 'wrap',
                                  gap: '0.25rem'
                                }}>
                                  {Object.entries(sharedContentReactions[messageId]).map(([emoji, count]) => (
                                    <span key={emoji} style={{
                                      background: 'rgba(255,215,0,0.2)',
                                      borderRadius: '12px',
                                      padding: '0.2rem 0.4rem',
                                      fontSize: '0.7rem',
                                      color: '#FFD700'
                                    }}>
                                      {emoji} {count}
                                    </span>
                                  ))}
                                </div>
                              )
                            })()
                            }
                          </div>
                          
                          {/* Reaction Box */}
                          {(() => {
                            const messageId = `${msg.sender}-${msg.timestamp}-reel`
                            return showReactionBox === messageId && (
                              <div style={{
                                position: 'absolute',
                                top: '-50px',
                                right: '10px',
                                background: 'rgba(0,0,0,0.95)',
                                border: '1px solid rgba(255,215,0,0.5)',
                                borderRadius: '25px',
                                padding: '0.5rem',
                                display: 'flex',
                                gap: '0.5rem',
                                zIndex: 1000,
                                backdropFilter: 'blur(10px)'
                              }}>
                                {['❤️', '😂', '😮', '😢', '😡', '👍', '👎'].map(emoji => (
                                  <button
                                    key={emoji}
                                    onClick={() => {
                                      setSharedContentReactions(prev => {
                                        const current = prev[messageId] || {}
                                        const newReactions = {
                                          ...current,
                                          [emoji]: (current[emoji] || 0) + 1
                                        }
                                        return {
                                          ...prev,
                                          [messageId]: newReactions
                                        }
                                      })
                                      setShowReactionBox(null)
                                    }}
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      fontSize: '1.2rem',
                                      cursor: 'pointer',
                                      padding: '0.25rem',
                                      borderRadius: '50%',
                                      transition: 'transform 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.target.style.transform = 'scale(1.2)'}
                                    onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            )
                          })()
                          }
                        </div>
                      </div>
                    ) : msg.text.includes('[POST_PREVIEW:') ? (
                      <div>
                        <div style={{ padding: '0.75rem 1rem', paddingBottom: '0.5rem' }}>
                          {msg.text.split('[POST_PREVIEW:')[0]}
                        </div>
                        <div style={{
                          background: 'rgba(0,0,0,0.2)',
                          padding: '0.5rem',
                          display: 'flex',
                          gap: '0.5rem',
                          alignItems: 'center',
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: '8px',
                          position: 'relative'
                        }}>
                          <div 
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              console.log('Clicked on shared post image')
                              const imageUrl = msg.text.match(/\[POST_PREVIEW:(.+?)\]/)?.[1]
                              console.log('Image URL:', imageUrl)
                              console.log('Current showPostModal state:', showPostModal)
                              if (imageUrl) {
                                // Close any existing modals first
                                setShowCommentModal(null)
                                setShowStoryModal(null)
                                
                                // Find original post by matching image URL
                                const originalPost = posts.find(p => 
                                  (Array.isArray(p.imageUrl) ? p.imageUrl.includes(imageUrl) : p.imageUrl === imageUrl) ||
                                  p.imageUrl === imageUrl
                                )
                                
                                const mockPost = {
                                  id: originalPost?.id || `shared-${Date.now()}`,
                                  imageUrl: imageUrl,
                                  title: originalPost?.title || 'Shared Post',
                                  content: originalPost?.content || 'Shared post',
                                  user: originalPost?.user || { displayName: 'Unknown User', id: 'unknown-user' },
                                  type: originalPost?.type || 'post',
                                  fileType: originalPost?.fileType || 'image',
                                  likes: originalPost?.likes || 0,
                                  comments: originalPost?.comments || [],
                                  createdAt: originalPost?.createdAt,
                                  isSharedContent: true
                                }
                                console.log('Setting mock post:', mockPost)
                                setShowPostModal(mockPost)
                                
                                // Force a small delay to ensure state is set
                                setTimeout(() => {
                                  console.log('Post modal state after timeout:', showPostModal)
                                }, 100)
                              }
                            }}
                            style={{
                            width: '60px',
                            height: '60px',
                            borderRadius: '6px',
                            overflow: 'hidden',
                            background: '#333',
                            flexShrink: 0,
                            cursor: 'pointer'
                          }}>
                            {(() => {
                              const imageUrl = msg.text.match(/\[POST_PREVIEW:(.+?)\]/)?.[1]
                              return imageUrl ? (
                                <img 
                                  src={imageUrl}
                                  style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover'
                                  }}
                                  alt="Shared post"
                                  onError={(e) => {
                                    e.target.style.display = 'none'
                                    e.target.nextSibling.style.display = 'flex'
                                  }}
                                />
                              ) : null
                            })()} 
                            <div style={{
                              display: 'none',
                              width: '100%',
                              height: '100%',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#8e8e8e',
                              fontSize: '1.5rem'
                            }}>
                              📷
                            </div>
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'space-between',
                              marginBottom: '0.25rem'
                            }}>
                              <div style={{ fontWeight: '600', fontSize: '0.8rem' }}>Shared Post</div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  const messageId = `${msg.sender}-${msg.timestamp}-post`
                                  setShowReactionBox(showReactionBox === messageId ? null : messageId)
                                }}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#FFD700',
                                  cursor: 'pointer',
                                  fontSize: '0.9rem',
                                  padding: '0.2rem'
                                }}
                              >
                                😊
                              </button>
                            </div>
                            <div style={{ 
                              fontSize: '0.7rem', 
                              opacity: 0.8,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {(() => {
                                const imageUrl = msg.text.match(/\[POST_PREVIEW:(.+?)\]/)?.[1]
                                return imageUrl || 'Image URL'
                              })()} 
                            </div>
                          </div>
                        </div>
                        
                        {/* Reaction Display */}
                        {(() => {
                          const messageId = `${msg.sender}-${msg.timestamp}-post`
                          return sharedContentReactions[messageId] && (
                            <div style={{
                              marginTop: '0.5rem',
                              display: 'flex',
                              flexWrap: 'wrap',
                              gap: '0.25rem',
                              padding: '0 0.5rem'
                            }}>
                              {Object.entries(sharedContentReactions[messageId]).map(([emoji, count]) => (
                                <span key={emoji} style={{
                                  background: 'rgba(255,215,0,0.2)',
                                  borderRadius: '12px',
                                  padding: '0.2rem 0.4rem',
                                  fontSize: '0.7rem',
                                  color: '#FFD700'
                                }}>
                                  {emoji} {count}
                                </span>
                              ))}
                            </div>
                          )
                        })()
                        }
                        
                        {/* Reaction Box */}
                        {(() => {
                          const messageId = `${msg.sender}-${msg.timestamp}-post`
                          return showReactionBox === messageId && (
                            <div style={{
                              position: 'absolute',
                              top: '-50px',
                              right: '10px',
                              background: 'rgba(0,0,0,0.95)',
                              border: '1px solid rgba(255,215,0,0.5)',
                              borderRadius: '25px',
                              padding: '0.5rem',
                              display: 'flex',
                              gap: '0.5rem',
                              zIndex: 1000,
                              backdropFilter: 'blur(10px)'
                            }}>
                              {['❤️', '😂', '😮', '😢', '😡', '👍', '👎'].map(emoji => (
                                <button
                                  key={emoji}
                                  onClick={() => {
                                    setSharedContentReactions(prev => {
                                      const current = prev[messageId] || {}
                                      const newReactions = {
                                        ...current,
                                        [emoji]: (current[emoji] || 0) + 1
                                      }
                                      return {
                                        ...prev,
                                        [messageId]: newReactions
                                      }
                                    })
                                    setShowReactionBox(null)
                                  }}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    fontSize: '1.2rem',
                                    cursor: 'pointer',
                                    padding: '0.25rem',
                                    borderRadius: '50%',
                                    transition: 'transform 0.2s'
                                  }}
                                  onMouseEnter={(e) => e.target.style.transform = 'scale(1.2)'}
                                  onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          )
                        })()
                        }
                      </div>
                    ) : (
                      msg.text
                    )}
                    <div style={{
                      fontSize: '0.7rem',
                      opacity: 0.7,
                      marginTop: '0.25rem',
                      color: msg.sender === currentUser?.id ? '#333' : '#D4AF37'
                    }}>
                      {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                  </div>
                  
                  {msg.sender === currentUser?.id && (
                    <div style={{ position: 'relative' }}>
                      <button
                        onClick={() => setShowMessageMenu(showMessageMenu === `${i}-${msg.timestamp}` ? null : `${i}-${msg.timestamp}`)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#D4AF37',
                          cursor: 'pointer',
                          fontSize: '1rem',
                          padding: '0.25rem'
                        }}
                      >
                        ⋯
                      </button>
                      
                      {showMessageMenu === `${i}-${msg.timestamp}` && (
                        <div style={{
                          position: 'absolute',
                          bottom: '100%',
                          right: 0,
                          background: 'rgba(0, 0, 0, 0.95)',
                          border: '1px solid rgba(212, 175, 55, 0.5)',
                          borderRadius: '8px',
                          minWidth: '120px',
                          zIndex: 1000
                        }}>
                          <button
                            onClick={() => {
                              setEditingMessage(msg)
                              setEditMessageText(msg.text)
                              setShowMessageMenu(null)
                            }}
                            style={{
                              width: '100%',
                              padding: '0.5rem',
                              background: 'none',
                              border: 'none',
                              color: '#FFD700',
                              cursor: 'pointer',
                              textAlign: 'left',
                              borderBottom: '1px solid rgba(212, 175, 55, 0.2)'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                              </svg>
                              Edit
                            </div>
                          </button>
                          
                          <button
                            onClick={() => {
                              setChatMessages(prev => ({
                                ...prev,
                                [showChatModal.id]: prev[showChatModal.id].filter((_, idx) => idx !== i)
                              }))
                              setShowMessageMenu(null)
                            }}
                            style={{
                              width: '100%',
                              padding: '0.5rem',
                              background: 'none',
                              border: 'none',
                              color: '#FFD700',
                              cursor: 'pointer',
                              textAlign: 'left',
                              borderBottom: '1px solid rgba(212, 175, 55, 0.2)'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3,6 5,6 21,6"/>
                                <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2,2h4a2,2,0,0,1,2,2V6"/>
                                <line x1="10" y1="11" x2="10" y2="17"/>
                                <line x1="14" y1="11" x2="14" y2="17"/>
                              </svg>
                              Delete for You
                            </div>
                          </button>
                          
                          <button
                            onClick={async () => {
                              try {
                                // Get profile IDs first
                                const profileResponse = await fetch(`https://ofafvhtbuhvvkhuprotc.graphql.ap-southeast-1.nhost.run/v1`, {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                    'x-hasura-admin-secret': '2=o_TVK82F6FKyi8xcbfE9lAm,r,jpq@'
                                  },
                                  body: JSON.stringify({
                                    query: `query GetProfileIds($senderId: uuid!, $receiverId: uuid!) {
                                      sender: profiles(where: {auth_id: {_eq: $senderId}}) { id }
                                      receiver: profiles(where: {auth_id: {_eq: $receiverId}}) { id }
                                    }`,
                                    variables: {
                                      senderId: currentUser.id,
                                      receiverId: showChatModal.id
                                    }
                                  })
                                })
                                
                                const profileResult = await profileResponse.json()
                                const senderProfileId = profileResult.data?.sender?.[0]?.id
                                const receiverProfileId = profileResult.data?.receiver?.[0]?.id
                                
                                if (senderProfileId && receiverProfileId) {
                                  // Delete from database
                                  await fetch(`https://ofafvhtbuhvvkhuprotc.graphql.ap-southeast-1.nhost.run/v1`, {
                                    method: 'POST',
                                    headers: {
                                      'Content-Type': 'application/json',
                                      'x-hasura-admin-secret': '2=o_TVK82F6FKyi8xcbfE9lAm,r,jpq@'
                                    },
                                    body: JSON.stringify({
                                      query: `mutation DeleteMessage($content: String!, $senderId: uuid!, $receiverId: uuid!, $timestamp: timestamptz!) {
                                        delete_messages(where: {
                                          content: {_eq: $content},
                                          sender_id: {_eq: $senderId},
                                          receiver_id: {_eq: $receiverId},
                                          created_at: {_eq: $timestamp}
                                        }) {
                                          affected_rows
                                        }
                                      }`,
                                      variables: {
                                        content: msg.text,
                                        senderId: senderProfileId,
                                        receiverId: receiverProfileId,
                                        timestamp: msg.timestamp
                                      }
                                    })
                                  })
                                }
                                
                                // Remove from UI immediately
                                setChatMessages(prev => ({
                                  ...prev,
                                  [showChatModal.id]: prev[showChatModal.id].filter((_, idx) => idx !== i)
                                }))
                                setShowMessageMenu(null)
                              } catch (error) {
                                alert('Failed to unsend message')
                              }
                            }}
                            style={{
                              width: '100%',
                              padding: '0.5rem',
                              background: 'none',
                              border: 'none',
                              color: '#ff4444',
                              cursor: 'pointer',
                              textAlign: 'left'
                            }}
                          >
                            ↩️ Unsend
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div style={{
                textAlign: 'center',
                color: '#D4AF37',
                padding: '2rem',
                fontSize: '0.9rem'
              }}>
                Start a conversation with {showChatModal.displayName}
              </div>
            )}
            
            {/* New Message Alert */}
            {newMessageAlert && (
              <div 
                onClick={() => {
                  const chatContainer = document.querySelector('[style*="overflowY: auto"][style*="flex: 1"]')
                  if (chatContainer) {
                    chatContainer.scrollTo({
                      top: chatContainer.scrollHeight,
                      behavior: 'smooth'
                    })
                  }
                  setNewMessageAlert(false)
                  setIsAtBottom(true)
                }}
                style={{
                  position: 'absolute',
                  bottom: '1rem',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'linear-gradient(45deg, #FFD700, #FFA500)',
                  color: '#000',
                  padding: '0.5rem 1rem',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  boxShadow: '0 4px 15px rgba(255, 215, 0, 0.3)',
                  zIndex: 10,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                ↓ New message
              </div>
            )}
          </div>
          
          <div style={{
            background: 'rgba(0, 0, 0, 0.9)',
            backdropFilter: 'blur(10px)',
            borderTop: '1px solid rgba(212, 175, 55, 0.3)',
            padding: '1rem',
            display: 'flex',
            gap: '0.5rem'
          }}>
            <input
              type="text"
              placeholder={editingMessage ? "Edit message..." : "Message..."}
              value={editingMessage ? editMessageText : newMessage}
              onChange={(e) => editingMessage ? setEditMessageText(e.target.value) : setNewMessage(e.target.value)}
              onKeyPress={async (e) => {
                if (e.key === 'Enter') {
                  if (editingMessage && editMessageText.trim()) {
                    setChatMessages(prev => ({
                      ...prev,
                      [showChatModal.id]: prev[showChatModal.id].map(msg => 
                        msg === editingMessage ? { ...msg, text: editMessageText.trim() } : msg
                      )
                    }))
                    setEditingMessage(null)
                    setEditMessageText('')
                  } else if (newMessage.trim()) {
                    const success = await sendMessage(showChatModal.id, newMessage)
                    if (success) {
                      setNewMessage('')
                    }
                  }
                }
              }}
              style={{
                flex: 1,
                padding: '0.75rem 1rem',
                background: editingMessage ? 'rgba(255, 215, 0, 0.1)' : 'rgba(212, 175, 55, 0.1)',
                border: editingMessage ? '1px solid #FFD700' : '1px solid rgba(212, 175, 55, 0.3)',
                borderRadius: '20px',
                color: '#FFD700',
                outline: 'none'
              }}
            />
            
            {editingMessage && (
              <button
                onClick={() => {
                  setEditingMessage(null)
                  setEditMessageText('')
                }}
                style={{
                  padding: '0.75rem 1rem',
                  background: 'rgba(212, 175, 55, 0.3)',
                  border: 'none',
                  borderRadius: '20px',
                  color: '#D4AF37',
                  cursor: 'pointer',
                  marginRight: '0.5rem'
                }}
              >
                Cancel
              </button>
            )}
            
            <button
              onClick={async () => {
                if (editingMessage && editMessageText.trim()) {
                  setChatMessages(prev => ({
                    ...prev,
                    [showChatModal.id]: prev[showChatModal.id].map(msg => 
                      msg === editingMessage ? { ...msg, text: editMessageText.trim() } : msg
                    )
                  }))
                  setEditingMessage(null)
                  setEditMessageText('')
                } else if (newMessage.trim()) {
                  const success = await sendMessage(showChatModal.id, newMessage)
                  if (success) {
                    setNewMessage('')
                  }
                }
              }}
              style={{
                padding: '0.75rem 1.5rem',
                background: (editingMessage ? editMessageText.trim() : newMessage.trim()) ? 'linear-gradient(45deg, #FFD700, #FFA500)' : 'rgba(212, 175, 55, 0.3)',
                border: 'none',
                borderRadius: '20px',
                color: (editingMessage ? editMessageText.trim() : newMessage.trim()) ? '#000' : '#D4AF37',
                cursor: (editingMessage ? editMessageText.trim() : newMessage.trim()) ? 'pointer' : 'not-allowed',
                fontWeight: '600'
              }}
            >
              {editingMessage ? 'Update' : 'Send'}
            </button>
          </div>
        </div>
      )}

      {/* Story Modal - Full Screen */}
      {showStoryModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: '#000',
          zIndex: 2000,
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{
            width: '100%',
            height: '100vh',
            background: '#000',
            overflow: 'hidden',
            position: 'relative'
          }}>
            {/* Story Progress Bar */}
            <div style={{
              display: 'flex',
              gap: '2px',
              padding: '0.5rem 1rem 0',
              background: 'rgba(0, 0, 0, 0.5)'
            }}>
              {userStories.map((_, i) => (
                <div key={i} style={{
                  flex: 1,
                  height: '2px',
                  background: 'rgba(255, 255, 255, 0.3)',
                  borderRadius: '1px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    background: '#fff',
                    width: i < currentStoryIndex ? '100%' : i === currentStoryIndex ? `${storyProgress}%` : '0%',
                    transition: i === currentStoryIndex ? 'width 0.1s linear' : 'none'
                  }} />
                </div>
              ))}
            </div>
            
            {/* Story Header */}
            <div style={{
              padding: '1rem',
              borderBottom: '1px solid rgba(212, 175, 55, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'linear-gradient(45deg, #FFD700, #FFA500)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#000',
                  fontWeight: 'bold',
                  overflow: 'hidden',
                  border: '3px solid #FF6B6B'
                }}>
                  {showStoryModal.user?.avatarUrl ? (
                    <img 
                      src={showStoryModal.user.avatarUrl} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      alt={showStoryModal.user.displayName}
                    />
                  ) : (
                    (showStoryModal.user?.displayName || 'U')[0]?.toUpperCase()
                  )}
                </div>
                <div>
                  <div 
                    onClick={() => {
                      const storyUser = showStoryModal.user
                      if (storyUser && storyUser.authId !== currentUser?.id) {
                        // Find the user in users array
                        let targetUser = users.find(u => u.id === storyUser.authId)
                        if (!targetUser) {
                          targetUser = users.find(u => u.displayName === storyUser.displayName)
                        }
                        if (!targetUser) {
                          targetUser = {
                            id: storyUser.authId,
                            displayName: storyUser.displayName,
                            avatarUrl: storyUser.avatarUrl
                          }
                        }
                        
                        setViewingProfile(targetUser)
                        setShowStoryModal(null)
                        setActiveTab('profile')
                        loadRealFollowers()
                      }
                    }}
                    style={{ 
                      color: '#FFD700', 
                      fontWeight: '600', 
                      fontSize: '0.9rem',
                      cursor: showStoryModal.user?.authId !== currentUser?.id ? 'pointer' : 'default'
                    }}
                  >
                    {showStoryModal.user?.displayName || 'User'}
                  </div>
                  <div style={{ color: '#D4AF37', fontSize: '0.7rem' }}>
                    {userStories.length > 1 ? `${currentStoryIndex + 1} of ${userStories.length}` : new Date(showStoryModal.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {userStories.length > 1 && (
                  <>
                    <button
                      onClick={() => {
                        const prevIndex = currentStoryIndex > 0 ? currentStoryIndex - 1 : userStories.length - 1
                        setCurrentStoryIndex(prevIndex)
                        setShowStoryModal(userStories[prevIndex])
                        setStoryProgress(0)
                      }}
                      style={{
                        background: 'rgba(255, 215, 0, 0.2)',
                        border: '1px solid rgba(255, 215, 0, 0.5)',
                        borderRadius: '50%',
                        color: '#FFD700',
                        cursor: 'pointer',
                        width: '30px',
                        height: '30px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      ‹
                    </button>
                    <button
                      onClick={() => {
                        if (currentStoryIndex < userStories.length - 1) {
                          const nextIndex = currentStoryIndex + 1
                          setCurrentStoryIndex(nextIndex)
                          setShowStoryModal(userStories[nextIndex])
                          setStoryProgress(0)
                        } else {
                          // Last story - close with animation
                          const modal = document.querySelector('[data-story-modal]')
                          if (modal) {
                            modal.style.transform = 'scale(0.8)'
                            modal.style.opacity = '0'
                            modal.style.transition = 'all 0.3s ease-out'
                          }
                          setTimeout(() => {
                            setShowStoryModal(null)
                            setStoryProgress(0)
                          }, 300)
                        }
                      }}
                      style={{
                        background: 'rgba(255, 215, 0, 0.2)',
                        border: '1px solid rgba(255, 215, 0, 0.5)',
                        borderRadius: '50%',
                        color: '#FFD700',
                        cursor: 'pointer',
                        width: '30px',
                        height: '30px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      ›
                    </button>
                  </>
                )}
  
                {showStoryModal.user?.authId === currentUser?.id && (
                  <button
                    onClick={() => {
                      if (confirm('Delete this story?')) {
                        fetch(`https://ofafvhtbuhvvkhuprotc.graphql.ap-southeast-1.nhost.run/v1`, {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            'x-hasura-admin-secret': '2=o_TVK82F6FKyi8xcbfE9lAm,r,jpq@'
                          },
                          body: JSON.stringify({
                            query: `mutation DeleteStory($storyId: uuid!) {
                              delete_stories_by_pk(id: $storyId) {
                                id
                              }
                            }`,
                            variables: { storyId: showStoryModal.id }
                          })
                        }).then(() => {
                          setStories(prev => prev.filter(s => s.id !== showStoryModal.id))
                          setShowStoryModal(null)
                          alert('Story deleted!')
                        }).catch(err => {
                          console.error('Delete failed:', err)
                          alert('Failed to delete story')
                        })
                      }
                    }}
                    style={{
                      background: 'rgba(255, 68, 68, 0.2)',
                      border: '1px solid rgba(255, 68, 68, 0.5)',
                      borderRadius: '50%',
                      color: '#ff4444',
                      cursor: 'pointer',
                      width: '30px',
                      height: '30px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="12" cy="5" r="2"/>
                      <circle cx="12" cy="12" r="2"/>
                      <circle cx="12" cy="19" r="2"/>
                    </svg>
                  </button>
                )}
                <button
                  onClick={() => {
                    if (storyTimer) clearInterval(storyTimer)
                    setShowStoryModal(null)
                    setStoryProgress(0)
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#FFD700',
                    cursor: 'pointer',
                    fontSize: '1.5rem',
                    padding: '0.25rem'
                  }}
                >
                  ×
                </button>
              </div>
            </div>
            
            {/* Story Content */}
            <div style={{
              height: '400px',
              background: '#000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              position: 'relative'
            }}>
              {/* Left Arrow */}
              <button
                onClick={() => {
                  const groupedStories = {}
                  stories.forEach(story => {
                    const userId = story.user?.authId || story.user_id
                    if (!groupedStories[userId]) {
                      groupedStories[userId] = { user: story.user, stories: [] }
                    }
                    groupedStories[userId].stories.push(story)
                  })
                  const userGroups = Object.values(groupedStories)
                  const currentUserIndex = userGroups.findIndex(group => group.user?.authId === showStoryModal.user?.authId)
                  const prevUserIndex = currentUserIndex > 0 ? currentUserIndex - 1 : userGroups.length - 1
                  const prevUserStories = userGroups[prevUserIndex]?.stories || []
                  if (prevUserStories.length > 0) {
                    setUserStories(prevUserStories)
                    setCurrentStoryIndex(0)
                    setShowStoryModal(prevUserStories[0])
                    setStoryProgress(0)
                  }
                }}
                style={{
                  position: 'absolute',
                  left: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'rgba(0, 0, 0, 0.5)',
                  border: 'none',
                  borderRadius: '50%',
                  color: '#fff',
                  cursor: 'pointer',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  zIndex: 10
                }}
              >
                ‹
              </button>
              
              {/* Right Arrow */}
              <button
                onClick={() => {
                  const groupedStories = {}
                  stories.forEach(story => {
                    const userId = story.user?.authId || story.user_id
                    if (!groupedStories[userId]) {
                      groupedStories[userId] = { user: story.user, stories: [] }
                    }
                    groupedStories[userId].stories.push(story)
                  })
                  const userGroups = Object.values(groupedStories)
                  const currentUserIndex = userGroups.findIndex(group => group.user?.authId === showStoryModal.user?.authId)
                  const nextUserIndex = currentUserIndex < userGroups.length - 1 ? currentUserIndex + 1 : 0
                  const nextUserStories = userGroups[nextUserIndex]?.stories || []
                  if (nextUserStories.length > 0) {
                    setUserStories(nextUserStories)
                    setCurrentStoryIndex(0)
                    setShowStoryModal(nextUserStories[0])
                    setStoryProgress(0)
                  }
                }}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'rgba(0, 0, 0, 0.5)',
                  border: 'none',
                  borderRadius: '50%',
                  color: '#fff',
                  cursor: 'pointer',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  zIndex: 10
                }}
              >
                ›
              </button>
              {showStoryModal.storage_path && showStoryModal.storage_path !== 'shared_post' ? (
                showStoryModal.storage_path.includes('.mp4') || showStoryModal.storage_path.includes('video') ? (
                  <video 
                    src={showStoryModal.storage_path} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    autoPlay
                    onLoadedMetadata={(e) => {
                      if (storyTimer) clearInterval(storyTimer)
                      setStoryProgress(0)
                      // Use actual video duration
                      const duration = e.target.duration * 1000
                      const interval = setInterval(() => {
                        setStoryProgress(prev => {
                          const newProgress = prev + (100 / (duration / 100))
                          if (newProgress >= 100) {
                            clearInterval(interval)
                            // Auto switch to next story or close if last
                            setTimeout(() => {
                              if (currentStoryIndex < userStories.length - 1) {
                                const nextIndex = currentStoryIndex + 1
                                setCurrentStoryIndex(nextIndex)
                                setShowStoryModal(userStories[nextIndex])
                                setStoryProgress(0)
                              } else {
                                // Last story - close with animation
                                const modal = document.querySelector('[data-story-modal]')
                                if (modal) {
                                  modal.style.transform = 'scale(0.8)'
                                  modal.style.opacity = '0'
                                  modal.style.transition = 'all 0.3s ease-out'
                                }
                                setTimeout(() => {
                                  setShowStoryModal(null)
                                  setStoryProgress(0)
                                }, 300)
                              }
                            }, 100)
                            return 100
                          }
                          return newProgress
                        })
                      }, 100)
                      setStoryTimer(interval)
                    }}
                  />
                ) : (
                  <img 
                    src={showStoryModal.storage_path} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    alt="Story content"
                    onLoad={() => {
                      if (storyTimer) clearInterval(storyTimer)
                      setStoryProgress(0)
                      // 35 seconds for images
                      const interval = setInterval(() => {
                        setStoryProgress(prev => {
                          const newProgress = prev + (100 / 350) // 35 seconds = 3500ms / 100ms intervals
                          if (newProgress >= 100) {
                            clearInterval(interval)
                            // Auto switch to next story or close if last
                            setTimeout(() => {
                              if (currentStoryIndex < userStories.length - 1) {
                                const nextIndex = currentStoryIndex + 1
                                setCurrentStoryIndex(nextIndex)
                                setShowStoryModal(userStories[nextIndex])
                                setStoryProgress(0)
                              } else {
                                // Last story - close with animation
                                const modal = document.querySelector('[data-story-modal]')
                                if (modal) {
                                  modal.style.transform = 'scale(0.8)'
                                  modal.style.opacity = '0'
                                  modal.style.transition = 'all 0.3s ease-out'
                                }
                                setTimeout(() => {
                                  setShowStoryModal(null)
                                  setStoryProgress(0)
                                }, 300)
                              }
                            }, 100)
                            return 100
                          }
                          return newProgress
                        })
                      }, 100)
                      setStoryTimer(interval)
                    }}
                  />
                )
              ) : (
                <div style={{
                  color: '#FFD700',
                  textAlign: 'center',
                  padding: '2rem'
                }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📷</div>
                  <div>Shared Story</div>
                  <div style={{ color: '#D4AF37', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                    Content shared to story
                  </div>
                </div>
              )}
            </div>
            

          </div>
        </div>
      )}

      {/* Full-Screen Story Modal */}
      {showStoryModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: '#000',
          zIndex: 3000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            width: '100%',
            height: '100%',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {/* Story Progress Bars */}
            <div style={{
              position: 'absolute',
              top: '20px',
              left: '20px',
              right: '20px',
              display: 'flex',
              gap: '4px',
              zIndex: 10
            }}>
              {userStories.map((_, index) => (
                <div key={index} style={{
                  flex: 1,
                  height: '3px',
                  background: 'rgba(255,255,255,0.3)',
                  borderRadius: '2px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: index < currentStoryIndex ? '100%' : index === currentStoryIndex ? `${storyProgress}%` : '0%',
                    height: '100%',
                    background: '#fff',
                    borderRadius: '2px',
                    transition: index === currentStoryIndex ? 'width 0.1s linear' : 'width 0.3s ease'
                  }} />
                </div>
              ))}
            </div>
            
            {/* User Info */}
            <div style={{
              position: 'absolute',
              top: '50px',
              left: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              zIndex: 10
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'linear-gradient(45deg, #FFD700, #FFA500)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#000',
                fontWeight: 'bold',
                overflow: 'hidden'
              }}>
                {showStoryModal.user?.avatarUrl ? (
                  <img 
                    src={showStoryModal.user.avatarUrl} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    alt={showStoryModal.user.displayName}
                  />
                ) : (
                  (showStoryModal.user?.displayName || 'U')[0]?.toUpperCase()
                )}
              </div>
              <div>
                <div style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold' }}>
                  {showStoryModal.user?.displayName || 'User'}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>
                  {new Date(showStoryModal.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
              </div>
            </div>
            
            {/* Three Dots Menu for Story Owner */}
            {showStoryModal.user?.authId === currentUser?.id && (
              <div className="dropdown-container" style={{ position: 'absolute', top: '20px', right: '70px', zIndex: 10 }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowStoryEditMenu(showStoryEditMenu === showStoryModal.id ? null : showStoryModal.id)
                  }}
                  style={{
                    background: 'rgba(0,0,0,0.5)',
                    border: 'none',
                    borderRadius: '50%',
                    color: '#fff',
                    cursor: 'pointer',
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem'
                  }}
                >
                  ⋯
                </button>
                
                {showStoryEditMenu === showStoryModal.id && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    background: 'rgba(0, 0, 0, 0.95)',
                    border: '1px solid rgba(212, 175, 55, 0.5)',
                    borderRadius: '8px',
                    minWidth: '150px',
                    backdropFilter: 'blur(10px)'
                  }}>
                    <button
                      onClick={async () => {
                        if (confirm('Delete this story?')) {
                          try {
                            const response = await fetch(`https://ofafvhtbuhvvkhuprotc.graphql.ap-southeast-1.nhost.run/v1`, {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                                'x-hasura-admin-secret': '2=o_TVK82F6FKyi8xcbfE9lAm,r,jpq@'
                              },
                              body: JSON.stringify({
                                query: `mutation DeleteStory($id: uuid!) {
                                  delete_stories_by_pk(id: $id) {
                                    id
                                  }
                                }`,
                                variables: { id: showStoryModal.id }
                              })
                            })
                            
                            const result = await response.json()
                            if (result.data?.delete_stories_by_pk) {
                              // Remove from stories state
                              setStories(prev => prev.filter(s => s.id !== showStoryModal.id))
                              setUserStories(prev => prev.filter(s => s.id !== showStoryModal.id))
                              
                              // Close story modal
                              setShowStoryModal(null)
                              setUserStories([])
                              setCurrentStoryIndex(0)
                              setStoryTextElements([])
                              setSelectedTextElement(null)
                              setShowTextControls(false)
                              if (storyTimer) {
                                clearInterval(storyTimer)
                                setStoryTimer(null)
                              }
                              
                              alert('Story deleted!')
                              setTimeout(() => loadStories(), 1000)
                            } else {
                              alert('Failed to delete story')
                            }
                          } catch (error) {
                            console.error('Delete story error:', error)
                            alert('Failed to delete story')
                          }
                        }
                        setShowStoryEditMenu(null)
                      }}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        background: 'none',
                        border: 'none',
                        color: '#ff4444',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontSize: '0.9rem'
                      }}
                    >
                      🗑️ Delete Story
                    </button>
                  </div>
                )}
              </div>
            )}
            
            {/* Close Button */}
            <button
              onClick={() => {
                setShowStoryModal(null)
                setUserStories([])
                setCurrentStoryIndex(0)
                setStoryTextElements([])
                setSelectedTextElement(null)
                setShowTextControls(false)
                setShowStoryEditMenu(null)
                if (storyTimer) {
                  clearInterval(storyTimer)
                  setStoryTimer(null)
                }
              }}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'rgba(0,0,0,0.5)',
                border: 'none',
                borderRadius: '50%',
                color: '#fff',
                cursor: 'pointer',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                zIndex: 10
              }}
            >
              ×
            </button>
            
            {/* Story Content */}
            <div 
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden'
              }}
              onClick={(e) => {
                if (showStoryModal.user?.authId === currentUser?.id && !isEditingText) {
                  const rect = e.currentTarget.getBoundingClientRect()
                  const x = ((e.clientX - rect.left) / rect.width) * 100
                  const y = ((e.clientY - rect.top) / rect.height) * 100
                  
                  const newTextElement = {
                    id: Date.now(),
                    text: 'Tap to edit',
                    x: x,
                    y: y,
                    color: textColor,
                    size: textSize,
                    fontWeight: 'bold',
                    textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
                  }
                  
                  setStoryTextElements(prev => [...prev, newTextElement])
                  setSelectedTextElement(newTextElement)
                  setTextInput(newTextElement.text)
                  setIsEditingText(true)
                  setShowTextControls(true)
                }
              }}
            >
              {showStoryModal.storage_path ? (
                showStoryModal.storage_path.includes('.mp4') || showStoryModal.storage_path.includes('video') ? (
                  <video 
                    src={showStoryModal.storage_path} 
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover'
                    }}
                    autoPlay
                    loop
                  />
                ) : (
                  <img 
                    src={showStoryModal.storage_path} 
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover'
                    }}
                    alt="Story"
                  />
                )
              ) : (
                <div style={{
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: '2rem',
                  textAlign: 'center'
                }}>
                  📖 Story
                </div>
              )}
              
              {/* Text Elements Overlay */}
              {storyTextElements.map((textElement) => (
                <div
                  key={textElement.id}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (showStoryModal.user?.authId === currentUser?.id) {
                      setSelectedTextElement(textElement)
                      setTextInput(textElement.text)
                      setTextColor(textElement.color)
                      setTextSize(textElement.size)
                      setIsEditingText(true)
                      setShowTextControls(true)
                    }
                  }}
                  style={{
                    position: 'absolute',
                    left: `${textElement.x}%`,
                    top: `${textElement.y}%`,
                    transform: 'translate(-50%, -50%)',
                    color: textElement.color,
                    fontSize: `${textElement.size}px`,
                    fontWeight: textElement.fontWeight,
                    textShadow: textElement.textShadow,
                    cursor: showStoryModal.user?.authId === currentUser?.id ? 'pointer' : 'default',
                    userSelect: 'none',
                    zIndex: 8,
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                    maxWidth: '80%',
                    wordWrap: 'break-word',
                    border: selectedTextElement?.id === textElement.id ? '2px dashed rgba(255,255,255,0.5)' : 'none',
                    padding: '4px 8px',
                    borderRadius: '4px'
                  }}
                >
                  {textElement.text}
                </div>
              ))}
            </div>
            
            {/* Text Controls */}
            {showTextControls && showStoryModal.user?.authId === currentUser?.id && (
              <div style={{
                position: 'absolute',
                bottom: '20px',
                left: '20px',
                right: '20px',
                background: 'rgba(0,0,0,0.8)',
                borderRadius: '12px',
                padding: '16px',
                zIndex: 15
              }}>
                {isEditingText ? (
                  <div>
                    <input
                      type="text"
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      placeholder="Enter text..."
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: 'rgba(255,255,255,0.1)',
                        border: '1px solid rgba(255,255,255,0.3)',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '16px',
                        marginBottom: '12px'
                      }}
                      autoFocus
                    />
                    
                    {/* Color Picker */}
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                      {['#FFFFFF', '#000000', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'].map(color => (
                        <button
                          key={color}
                          onClick={() => setTextColor(color)}
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: color,
                            border: textColor === color ? '3px solid #FFD700' : '2px solid rgba(255,255,255,0.3)',
                            cursor: 'pointer'
                          }}
                        />
                      ))}
                    </div>
                    
                    {/* Size Slider */}
                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ color: '#fff', fontSize: '14px', marginBottom: '8px', display: 'block' }}>Size: {textSize}px</label>
                      <input
                        type="range"
                        min="16"
                        max="48"
                        value={textSize}
                        onChange={(e) => setTextSize(parseInt(e.target.value))}
                        style={{
                          width: '100%',
                          height: '4px',
                          borderRadius: '2px',
                          background: 'rgba(255,255,255,0.3)',
                          outline: 'none'
                        }}
                      />
                    </div>
                    
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => {
                          if (selectedTextElement && textInput.trim()) {
                            setStoryTextElements(prev => prev.map(el => 
                              el.id === selectedTextElement.id 
                                ? { ...el, text: textInput.trim(), color: textColor, size: textSize }
                                : el
                            ))
                          }
                          setIsEditingText(false)
                          setSelectedTextElement(null)
                          setShowTextControls(false)
                        }}
                        style={{
                          flex: 1,
                          padding: '12px',
                          background: 'linear-gradient(45deg, #FFD700, #FFA500)',
                          border: 'none',
                          borderRadius: '8px',
                          color: '#000',
                          fontWeight: 'bold',
                          cursor: 'pointer'
                        }}
                      >
                        Done
                      </button>
                      
                      <button
                        onClick={() => {
                          if (selectedTextElement) {
                            setStoryTextElements(prev => prev.filter(el => el.id !== selectedTextElement.id))
                          }
                          setIsEditingText(false)
                          setSelectedTextElement(null)
                          setShowTextControls(false)
                        }}
                        style={{
                          padding: '12px 16px',
                          background: 'rgba(255,68,68,0.2)',
                          border: '1px solid rgba(255,68,68,0.5)',
                          borderRadius: '8px',
                          color: '#ff4444',
                          cursor: 'pointer'
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ color: '#fff', fontSize: '14px', marginBottom: '8px' }}>Tap anywhere to add text</div>
                    <button
                      onClick={() => setShowTextControls(false)}
                      style={{
                        padding: '8px 16px',
                        background: 'rgba(255,255,255,0.2)',
                        border: '1px solid rgba(255,255,255,0.3)',
                        borderRadius: '6px',
                        color: '#fff',
                        cursor: 'pointer'
                      }}
                    >
                      Close
                    </button>
                  </div>
                )}
              </div>
            )}
            
            {/* Add Text Button (only for own stories) */}
            {showStoryModal.user?.authId === currentUser?.id && !showTextControls && (
              <button
                onClick={() => setShowTextControls(true)}
                style={{
                  position: 'absolute',
                  bottom: '20px',
                  right: '20px',
                  background: 'rgba(0,0,0,0.7)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: '50%',
                  color: '#fff',
                  cursor: 'pointer',
                  width: '48px',
                  height: '48px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  zIndex: 10
                }}
              >
                Aa
              </button>
            )}
            
            {/* Navigation Areas */}
            <div style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: '30%',
              height: '100%',
              cursor: 'pointer',
              zIndex: 5
            }}
            onClick={() => {
              if (showTextControls) return
              if (currentStoryIndex > 0) {
                const newIndex = currentStoryIndex - 1
                setCurrentStoryIndex(newIndex)
                setShowStoryModal(userStories[newIndex])
                setStoryProgress(0)
              }
            }}
            />
            
            <div style={{
              position: 'absolute',
              right: 0,
              top: 0,
              width: '30%',
              height: '100%',
              cursor: 'pointer',
              zIndex: 5
            }}
            onClick={() => {
              if (showTextControls) return
              if (currentStoryIndex < userStories.length - 1) {
                const newIndex = currentStoryIndex + 1
                setCurrentStoryIndex(newIndex)
                setShowStoryModal(userStories[newIndex])
                setStoryProgress(0)
              } else {
                setShowStoryModal(null)
                setUserStories([])
                setCurrentStoryIndex(0)
                setStoryTextElements([])
                setSelectedTextElement(null)
                setShowTextControls(false)
              }
            }}
            />
          </div>
        </div>
      )}
      
      {/* Sponsor Modal */}
      {showSponsorModal && selectedPostForSponsoring && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'rgba(0, 0, 0, 0.95)',
            border: '1px solid rgba(212, 175, 55, 0.5)',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '400px',
            width: '90%'
          }}>
            <h3 style={{ color: '#FFD700', marginBottom: '1rem', textAlign: 'center' }}>
              🎯 Sponsor this {selectedPostForSponsoring.type}
            </h3>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ color: '#FFD700', display: 'block', marginBottom: '0.5rem' }}>
                Select user to sponsor by:
              </label>
              <select
                value={selectedSponsorUser || ''}
                onChange={(e) => setSelectedSponsorUser(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid rgba(212, 175, 55, 0.5)',
                  borderRadius: '8px',
                  background: 'rgba(0, 0, 0, 0.7)',
                  color: '#FFD700'
                }}
              >
                <option value="">Select user...</option>
                {users.filter(user => user.id !== currentUser?.id).map(user => (
                  <option key={user.id} value={user.displayName}>
                    {user.displayName}
                  </option>
                ))}
              </select>
            </div>
            
            {selectedSponsorUser && (
              <div style={{ 
                marginBottom: '1rem',
                padding: '0.5rem', 
                background: 'rgba(255, 215, 0, 0.1)', 
                borderRadius: '6px',
                color: '#D4AF37',
                fontSize: '0.9rem'
              }}>
                ✨ This {selectedPostForSponsoring.type} will show "Sponsored by {selectedSponsorUser}"
              </div>
            )}
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => {
                  setShowSponsorModal(false)
                  setSelectedPostForSponsoring(null)
                  setSelectedSponsorUser(null)
                }}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: 'rgba(212, 175, 55, 0.2)',
                  border: '1px solid #D4AF37',
                  borderRadius: '8px',
                  color: '#D4AF37',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!selectedSponsorUser) {
                    alert('Please select a user to sponsor by')
                    return
                  }
                  
                  try {
                    const updateQuery = selectedPostForSponsoring.type === 'reel' ? 
                      `mutation UpdateReel($id: uuid!, $sponsored_by: String!) {
                        update_reels_by_pk(pk_columns: {id: $id}, _set: {sponsored_by: $sponsored_by}) {
                          id
                          sponsored_by
                        }
                      }` :
                      `mutation UpdatePost($id: uuid!, $sponsored_by: String!) {
                        update_posts_by_pk(pk_columns: {id: $id}, _set: {sponsored_by: $sponsored_by}) {
                          id
                          sponsored_by
                        }
                      }`
                    
                    const response = await fetch(`https://ofafvhtbuhvvkhuprotc.graphql.ap-southeast-1.nhost.run/v1`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'x-hasura-admin-secret': '2=o_TVK82F6FKyi8xcbfE9lAm,r,jpq@'
                      },
                      body: JSON.stringify({
                        query: updateQuery,
                        variables: {
                          id: selectedPostForSponsoring.id,
                          sponsored_by: selectedSponsorUser
                        }
                      })
                    })
                    
                    const result = await response.json()
                    if (result.data) {
                      // Update local state with both properties for immediate display
                      setPosts(prev => prev.map(post => 
                        post.id === selectedPostForSponsoring.id 
                          ? { ...post, sponsoredBy: selectedSponsorUser, sponsored_by: selectedSponsorUser }
                          : post
                      ))
                      
                      // Immediately reload posts to get fresh data from database
                      await loadPosts()
                      
                      alert(`${selectedPostForSponsoring.type} sponsored successfully! Check the home feed to see the sponsored content.`)
                      setShowSponsorModal(false)
                      setSelectedPostForSponsoring(null)
                      setSelectedSponsorUser(null)
                    } else {
                      throw new Error('Failed to update')
                    }
                  } catch (error) {
                    console.error('Sponsor error:', error)
                    alert('Failed to sponsor. Please try again.')
                  }
                }}
                disabled={!selectedSponsorUser}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: selectedSponsorUser ? 'linear-gradient(45deg, #FFD700, #FFA500)' : 'rgba(128, 128, 128, 0.3)',
                  border: 'none',
                  borderRadius: '8px',
                  color: selectedSponsorUser ? '#000' : '#666',
                  cursor: selectedSponsorUser ? 'pointer' : 'not-allowed',
                  fontWeight: 'bold'
                }}
              >
                Sponsor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Modal */}
      {showPasswordModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 4000
        }}>
          <div style={{
            background: currentThemeConfig.bg,
            border: `1px solid ${currentThemeConfig.secondary}40`,
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '400px',
            width: '90%',
            textAlign: 'center'
          }}>
            <h3 style={{ color: currentThemeConfig.accent, marginBottom: '1rem' }}>
              {passwordAction === 'set' ? '🔒 Set Chat Password' : '🔐 Enter Password'}
            </h3>
            
            <p style={{ color: currentThemeConfig.secondary, marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              {passwordAction === 'set' 
                ? 'Set a password to protect your chat visibility settings. You\'ll need this password to toggle chat on/off.'
                : 'Enter your password to change chat visibility settings.'
              }
            </p>
            
            <input
              type="password"
              placeholder={passwordAction === 'set' ? 'Create password (min 4 chars)' : 'Enter your password'}
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handlePasswordSubmit()
                }
              }}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                border: `1px solid ${currentThemeConfig.secondary}40`,
                background: 'rgba(0, 0, 0, 0.3)',
                color: currentThemeConfig.accent,
                fontSize: '1rem',
                marginBottom: '1.5rem'
              }}
              autoFocus
            />
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => {
                  setShowPasswordModal(false)
                  setPasswordInput('')
                }}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: 'rgba(128, 128, 128, 0.3)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#ccc',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              
              <button
                onClick={handlePasswordSubmit}
                disabled={!passwordInput.trim()}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: passwordInput.trim() ? `linear-gradient(45deg, ${currentThemeConfig.accent}, ${currentThemeConfig.secondary})` : 'rgba(128, 128, 128, 0.3)',
                  border: 'none',
                  borderRadius: '8px',
                  color: passwordInput.trim() ? '#000' : '#666',
                  cursor: passwordInput.trim() ? 'pointer' : 'not-allowed',
                  fontWeight: 'bold'
                }}
              >
                {passwordAction === 'set' ? 'Set Password' : 'Verify'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Instagram-like Share Modal */}
      {showShareModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000
        }}>
          <div style={{
            background: 'rgba(0, 0, 0, 0.95)',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '16px',
            width: '90%',
            maxWidth: '500px',
            maxHeight: '80vh',
            overflow: 'hidden',
            backdropFilter: 'blur(15px)'
          }}>
            <div style={{
              padding: '1rem',
              borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ color: '#fff', margin: 0, fontSize: '1.1rem' }}>Share {selectedPostForSponsoring?.type || 'Post'}</h3>
              <button
                onClick={() => {
                  setShowShareModal(false)
                  setShowPlatformButtons(false)
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#fff',
                  fontSize: '1.5rem',
                  cursor: 'pointer'
                }}
              >
                ×
              </button>
            </div>
            
            {/* Share Options */}
            <div style={{
              padding: '1rem',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '1rem'
            }}>
              {/* Share to Story */}
              <button
                onClick={async () => {
                  if (!currentUser?.id) {
                    alert('Please log in to share to story')
                    return
                  }
                  
                  try {
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
                    })
                    
                    const profileResult = await profileResponse.json()
                    const profileId = profileResult.data?.profiles?.[0]?.id
                    
                    if (!profileId) throw new Error('Profile not found')
                    
                    const storyResponse = await fetch(`https://ofafvhtbuhvvkhuprotc.graphql.ap-southeast-1.nhost.run/v1`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'x-hasura-admin-secret': '2=o_TVK82F6FKyi8xcbfE9lAm,r,jpq@'
                      },
                      body: JSON.stringify({
                        query: `mutation AddToStory($userId: uuid!, $authorId: uuid!, $storagePath: String!, $expiresAt: timestamptz!) {
                          insert_stories_one(object: {
                            user_id: $userId,
                            author_id: $authorId,
                            storage_path: $storagePath,
                            expires_at: $expiresAt
                          }) {
                            id
                            created_at
                          }
                        }`,
                        variables: {
                          userId: currentUser.id,
                          authorId: profileId,
                          storagePath: Array.isArray(selectedPostForSponsoring?.imageUrl) ? selectedPostForSponsoring.imageUrl[0] : selectedPostForSponsoring?.imageUrl || 'shared_content',
                          expiresAt: new Date(Date.now() + 24*60*60*1000).toISOString()
                        }
                      })
                    })
                    
                    const result = await storyResponse.json()
                    
                    if (result.errors) {
                      throw new Error(result.errors[0].message)
                    }
                    
                    if (result.data?.insert_stories_one) {
                      // Show success notification
                      const notification = document.createElement('div')
                      notification.textContent = 'Shared to your story!'
                      notification.style.cssText = `
                        position: fixed;
                        top: 20px;
                        right: 20px;
                        background: rgba(0,0,0,0.9);
                        color: #FFD700;
                        padding: 0.75rem 1rem;
                        border-radius: 8px;
                        border: 1px solid rgba(255,215,0,0.3);
                        z-index: 10001;
                        font-size: 0.9rem;
                        backdrop-filter: blur(10px);
                      `
                      document.body.appendChild(notification)
                      setTimeout(() => {
                        if (document.body.contains(notification)) {
                          document.body.removeChild(notification)
                        }
                      }, 3000)
                      setTimeout(() => loadStories(), 1000)
                      setShowShareModal(false)
                    }
                  } catch (error) {
                    alert('Failed to share to story: ' + error.message)
                  }
                }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '1rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  borderRadius: '12px',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '0.8rem'
                }}
              >
                <div style={{ marginBottom: '0.5rem' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFD700" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="16"/>
                    <line x1="8" y1="12" x2="16" y2="12"/>
                  </svg>
                </div>
                <span>Add to Story</span>
              </button>
              
              {/* Share on Platforms */}
              <button
                onClick={() => {
                  setShowPlatformButtons(!showPlatformButtons)
                }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '1rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  borderRadius: '12px',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '0.8rem'
                }}
              >
                <div style={{ marginBottom: '0.5rem' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFD700" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="2" y1="12" x2="22" y2="12"/>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                  </svg>
                </div>
                <span>Platforms</span>
              </button>
              
              {/* Platform Buttons */}
              {showPlatformButtons && (
                <div style={{
                  gridColumn: 'span 3',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(5, 1fr)',
                  gap: '0.5rem',
                  marginTop: '1rem'
                }}>
                {(() => {
                  const post = selectedPostForSponsoring
                  const shareText = `Check out this amazing ${post?.type || 'post'} by ${post?.user?.displayName}! ${post?.content || ''}`
                  const shareUrl = Array.isArray(post?.imageUrl) ? post.imageUrl[0] : post?.imageUrl
                  
                  const platforms = [
                    { 
                      name: 'WhatsApp', 
                      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.516"/></svg>,
                      url: `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}` 
                    },
                    { 
                      name: 'Twitter', 
                      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="#1DA1F2"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>,
                      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}` 
                    },
                    { 
                      name: 'Facebook', 
                      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>,
                      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}` 
                    },
                    { 
                      name: 'Telegram', 
                      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="#0088CC"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>,
                      url: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}` 
                    },
                    { 
                      name: 'LinkedIn', 
                      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="#0A66C2"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>,
                      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}` 
                    }
                  ]
                  
                  return platforms.map((platform, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        window.open(platform.url, '_blank')
                        // Show success notification
                        const notification = document.createElement('div')
                        notification.textContent = `Shared to ${platform.name}!`
                        notification.style.cssText = `
                          position: fixed;
                          top: 20px;
                          right: 20px;
                          background: rgba(0,0,0,0.9);
                          color: #FFD700;
                          padding: 0.75rem 1rem;
                          border-radius: 8px;
                          border: 1px solid rgba(255,215,0,0.3);
                          z-index: 10001;
                          font-size: 0.9rem;
                          backdrop-filter: blur(10px);
                        `
                        document.body.appendChild(notification)
                        setTimeout(() => {
                          if (document.body.contains(notification)) {
                            document.body.removeChild(notification)
                          }
                        }, 3000)
                        setShowShareModal(false)
                      }}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        padding: '0.75rem',
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#fff',
                        cursor: 'pointer',
                        fontSize: '0.7rem'
                      }}
                    >
                      <div style={{ marginBottom: '0.25rem' }}>{platform.icon}</div>
                      <span>{platform.name}</span>
                    </button>
                  ))
                })()}
                </div>
              )}
              
              {/* Copy Link */}
              <button
                onClick={() => {
                  const post = selectedPostForSponsoring
                  const shareUrl = Array.isArray(post?.imageUrl) ? post.imageUrl[0] : post?.imageUrl
                  if (shareUrl) {
                    navigator.clipboard.writeText(shareUrl).then(() => {
                      // Show success notification
                      const notification = document.createElement('div')
                      notification.textContent = 'Link copied to clipboard!'
                      notification.style.cssText = `
                        position: fixed;
                        top: 20px;
                        right: 20px;
                        background: rgba(0,0,0,0.9);
                        color: #FFD700;
                        padding: 0.75rem 1rem;
                        border-radius: 8px;
                        border: 1px solid rgba(255,215,0,0.3);
                        z-index: 10001;
                        font-size: 0.9rem;
                        backdrop-filter: blur(10px);
                      `
                      document.body.appendChild(notification)
                      setTimeout(() => {
                        if (document.body.contains(notification)) {
                          document.body.removeChild(notification)
                        }
                      }, 3000)
                      setShowShareModal(false)
                    }).catch(() => {
                      // Show error notification
                      const notification = document.createElement('div')
                      notification.textContent = 'Failed to copy link'
                      notification.style.cssText = `
                        position: fixed;
                        top: 20px;
                        right: 20px;
                        background: rgba(0,0,0,0.9);
                        color: #ff4444;
                        padding: 0.75rem 1rem;
                        border-radius: 8px;
                        border: 1px solid rgba(255,68,68,0.3);
                        z-index: 10001;
                        font-size: 0.9rem;
                        backdrop-filter: blur(10px);
                      `
                      document.body.appendChild(notification)
                      setTimeout(() => {
                        if (document.body.contains(notification)) {
                          document.body.removeChild(notification)
                        }
                      }, 3000)
                    })
                  } else {
                    alert('No link available to copy')
                  }
                }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '1rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  borderRadius: '12px',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '0.8rem'
                }}
              >
                <div style={{ marginBottom: '0.5rem' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFD700" strokeWidth="2">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                  </svg>
                </div>
                <span>Copy Link</span>
              </button>
            </div>
            

            
            {/* Search Box */}
            <div style={{ padding: '1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <input
                type="text"
                value={shareSearchQuery}
                onChange={(e) => setShareSearchQuery(e.target.value)}
                placeholder="Search users to send..."
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '0.9rem'
                }}
              />
            </div>
            
            {/* Selected Users */}
            {selectedUsers.size > 0 && (
              <div style={{
                padding: '1rem',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <div style={{ color: '#fff', fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: '600' }}>
                  Selected ({selectedUsers.size})
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {Array.from(selectedUsers).map(userId => {
                    const user = users.find(u => u.id === userId)
                    if (!user) return null
                    return (
                      <div
                        key={`selected-${userId}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          background: 'rgba(255, 215, 0, 0.2)',
                          border: '1px solid #FFD700',
                          borderRadius: '20px',
                          padding: '0.25rem 0.5rem',
                          fontSize: '0.8rem'
                        }}
                      >
                        <span style={{ color: '#FFD700', marginRight: '0.5rem' }}>
                          {user.displayName}
                        </span>
                        <button
                          onClick={() => {
                            const newSelected = new Set(selectedUsers)
                            newSelected.delete(userId)
                            setSelectedUsers(newSelected)
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#FFD700',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            padding: '0',
                            width: '16px',
                            height: '16px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          ×
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
            
            <div 
              className="share-modal-scroll"
              style={{
                maxHeight: '250px',
                overflowY: 'scroll',
                padding: '1rem',
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(255,255,255,0.3) transparent'
              }}>
              {users
                .filter(u => u.id !== currentUser?.id)
                .filter(u => 
                  !shareSearchQuery || 
                  u.displayName?.toLowerCase().includes(shareSearchQuery.toLowerCase()) ||
                  u.username?.toLowerCase().includes(shareSearchQuery.toLowerCase())
                )
                .map((user, index) => {
                const isSelected = selectedUsers.has(user.id)
                return (
                  <div
                    key={user.id || `user-${index}`}
                    onClick={() => {
                      const newSelected = new Set(selectedUsers)
                      if (isSelected) {
                        newSelected.delete(user.id)
                      } else {
                        newSelected.add(user.id)
                      }
                      setSelectedUsers(newSelected)
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0.75rem',
                      cursor: 'pointer',
                      borderRadius: '8px',
                      background: isSelected ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                      marginBottom: '0.5rem',
                      border: isSelected ? '2px solid #FFD700' : '2px solid transparent'
                    }}
                  >
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'linear-gradient(45deg, #FFD700, #FFA500)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#000',
                      fontWeight: 'bold',
                      marginRight: '1rem',
                      overflow: 'hidden'
                    }}>
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={user.displayName} />
                      ) : (
                        (user.displayName || 'U')[0]?.toUpperCase()
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: '#fff', fontWeight: '600' }}>{user.displayName}</div>
                      <div style={{ color: '#ccc', fontSize: '0.8rem' }}>@{user.username || user.displayName?.toLowerCase()}</div>
                    </div>
                    {isSelected && (
                      <div style={{ color: '#FFD700', fontSize: '1.2rem' }}>✓</div>
                    )}
                  </div>
                )
              })}
            </div>
            
            {selectedUsers.size > 0 && (
              <div style={{
                padding: '1rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.2)',
                position: 'sticky',
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.95)',
                backdropFilter: 'blur(15px)'
              }}>
                <textarea
                  value={shareMessage}
                  onChange={(e) => setShareMessage(e.target.value)}
                  placeholder="Write a message..."
                  className="share-modal-scroll"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '0.9rem',
                    resize: 'none',
                    height: '60px',
                    marginBottom: '1rem',
                    overflowY: 'auto',
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'rgba(255,255,255,0.3) transparent'
                  }}
                />
                
                <button
                  onClick={async () => {
                    const post = selectedPostForSponsoring
                    const customMessage = shareMessage ? `${shareMessage}\n\n` : ''
                    
                    let successCount = 0
                    for (const userId of selectedUsers) {
                      try {
                        let formattedMessage
                        if (post?.type === 'reel') {
                          formattedMessage = `${customMessage ? customMessage + '\n\n' : ''}🎥 ${currentUser?.displayName} shared a reel by ${post.user?.displayName}\n\n"${post.content || 'Check out this reel!'}"\n\n[REEL_PREVIEW:${post.imageUrl}]`
                        } else {
                          const imageUrl = Array.isArray(post?.imageUrl) ? post.imageUrl[0] : post?.imageUrl
                          formattedMessage = `${customMessage ? customMessage + '\n\n' : ''}📸 ${currentUser?.displayName} shared a post by ${post?.user?.displayName}\n\n"${post?.content || 'Check out this post!'}"\n\n[POST_PREVIEW:${imageUrl}]`
                        }
                        
                        await sendMessage(userId, formattedMessage)
                        successCount++
                      } catch (error) {
                        console.error('Failed to send to user:', userId, error)
                      }
                    }
                    
                    // Show success notification
                    const notification = document.createElement('div')
                    notification.textContent = `${post?.type === 'reel' ? 'Reel' : 'Post'} shared with ${successCount} user(s)!`
                    notification.style.cssText = `
                      position: fixed;
                      top: 20px;
                      right: 20px;
                      background: rgba(0,0,0,0.9);
                      color: #FFD700;
                      padding: 0.75rem 1rem;
                      border-radius: 8px;
                      border: 1px solid rgba(255,215,0,0.3);
                      z-index: 10001;
                      font-size: 0.9rem;
                      backdrop-filter: blur(10px);
                    `
                    document.body.appendChild(notification)
                    setTimeout(() => {
                      if (document.body.contains(notification)) {
                        document.body.removeChild(notification)
                      }
                    }, 3000)
                    setShowShareModal(false)
                    setSelectedUsers(new Set())
                    setShareMessage('')
                  }}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'linear-gradient(45deg, #FFD700, #FFA500)',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#000',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  Send to {selectedUsers.size} user{selectedUsers.size > 1 ? 's' : ''}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upload Modal */}
      <UploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        uploadType={uploadType}
        onSubmit={handleUploadSubmitLocal}
      />
    </div>
  )
}

export default InstagramLayout
