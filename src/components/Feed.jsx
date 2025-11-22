import React, { useState } from 'react'
import { nhost } from '../lib/nhost'

const Feed = () => {
  const [feedFilter, setFeedFilter] = useState('all')
  const [sortBy, setSortBy] = useState('recent')

  const handleLogout = async () => {
    try {
      await nhost.auth.signOut()
      window.location.reload()
    } catch (err) {
      console.error('Logout error:', err)
      window.location.reload()
    }
  }

  const feedOptions = [
    { id: 'all', label: 'All Posts', icon: '📱' },
    { id: 'following', label: 'Following', icon: '👥' },
    { id: 'favorites', label: 'Favorites', icon: '⭐' },
    { id: 'saved', label: 'Saved', icon: '💾' }
  ]

  const sortOptions = [
    { id: 'recent', label: 'Most Recent' },
    { id: 'popular', label: 'Most Popular' },
    { id: 'trending', label: 'Trending' }
  ]

  return (
    <div style={{
      color: '#fff',
      padding: '1rem',
      maxWidth: '600px',
      margin: '0 auto'
    }}>
      {/* Feed Options Header */}
      <div style={{
        background: 'rgba(255,255,255,0.1)',
        borderRadius: '12px',
        padding: '1rem',
        marginBottom: '1rem',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        <h3 style={{ margin: '0 0 1rem 0', textAlign: 'center' }}>Feed Options</h3>
        
        {/* Filter Options */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Filter:</label>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {feedOptions.map(option => (
              <button
                key={option.id}
                onClick={() => setFeedFilter(option.id)}
                style={{
                  padding: '0.5rem 1rem',
                  border: 'none',
                  borderRadius: '20px',
                  background: feedFilter === option.id ? '#0095f6' : 'rgba(255,255,255,0.1)',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}
              >
                <span>{option.icon}</span>
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sort Options */}
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '0.9rem'
            }}
          >
            {sortOptions.map(option => (
              <option key={option.id} value={option.id} style={{ background: '#333', color: '#fff' }}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Feed Content */}
      <div style={{
        textAlign: 'center',
        padding: '2rem',
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        <h2>Feed: {feedOptions.find(o => o.id === feedFilter)?.label}</h2>
        <p>Sorted by: {sortOptions.find(o => o.id === sortBy)?.label}</p>
        <p style={{ color: '#8e8e8e', fontSize: '0.9rem', marginTop: '1rem' }}>
          Posts will appear here based on your selected options
        </p>
        
        <button
          style={{
            backgroundColor: '#ff3040',
            border: 'none',
            padding: '10px 20px',
            color: '#fff',
            cursor: 'pointer',
            marginTop: '20px',
            borderRadius: '6px'
          }}
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
    </div>
  )
}

export default Feed