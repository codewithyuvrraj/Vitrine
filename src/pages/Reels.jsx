import React, { useEffect, useState } from 'react'
import { nhost } from '../lib/nhost'
import ShareModal from '../components/ShareModal'

const Reels = () => {
  const [stories, setStories] = useState([])
  const [showShareModal, setShowShareModal] = useState(false)
  const [selectedStory, setSelectedStory] = useState(null)
  const [user, setUser] = useState(null)

  const loadStories = async () => {
    const query = `
      query {
        stories(where: {expires_at: {_gt: "now()"}}, order_by: {created_at: desc}) {
          id
          media_url
          media_type
          music_name
          music_artist
          created_at
          user_id
        }
      }
    `
    const res = await nhost.graphql.request(query)
    setStories(res.data?.stories || [])
  }

  useEffect(() => {
    loadStories()
    // Get current user
    const currentUser = nhost.auth.getUser()
    setUser(currentUser)
  }, [])

  const handleShare = (story) => {
    setSelectedStory(story)
    setShowShareModal(true)
  }

  return (
    <div style={{ padding: 20, color: '#fff' }}>
      <h2>Reels/Stories</h2>
      
      {stories.length === 0 ? (
        <p>No active stories</p>
      ) : (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {stories.map(story => (
            <div key={story.id} style={{ 
              border: '1px solid rgba(255,255,255,0.2)', 
              padding: 10, 
              width: 200, 
              borderRadius: '12px',
              background: 'rgba(255,255,255,0.05)'
            }}>
              {story.media_type === 'video' ? (
                <video src={story.media_url} controls style={{ width: '100%', borderRadius: '8px' }} />
              ) : (
                <img src={story.media_url} alt="" style={{ width: '100%', borderRadius: '8px' }} />
              )}
              {story.music_name && (
                <p style={{ color: '#fff', fontSize: '0.8rem', margin: '0.5rem 0' }}>
                  🎵 {story.music_name} - {story.music_artist}
                </p>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                <small style={{ color: '#8e8e8e' }}>{new Date(story.created_at).toLocaleString()}</small>
                <button
                  onClick={() => handleShare(story)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#fff',
                    cursor: 'pointer',
                    padding: '0.25rem',
                    borderRadius: '4px'
                  }}
                  title="Share"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                    <polyline points="16,6 12,2 8,6"/>
                    <line x1="12" y1="2" x2="12" y2="15"/>
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {selectedStory && (
        <ShareModal 
          isOpen={showShareModal}
          onClose={() => {
            setShowShareModal(false)
            setSelectedStory(null)
          }}
          post={{
            id: selectedStory.id,
            image_url: selectedStory.media_url,
            caption: selectedStory.music_name ? `🎵 ${selectedStory.music_name} - ${selectedStory.music_artist}` : '',
            user: { username: 'Story User' },
            isReel: true
          }}
          user={user}
        />
      )}
    </div>
  )
}

export default Reels