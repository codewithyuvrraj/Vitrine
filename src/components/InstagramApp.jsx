import React, { useState, useEffect } from 'react';
import { nhost } from '../lib/nhost';
import Profile from './Profile';
import SharedContent from './SharedContent';
import TestSharePosts from './TestSharePosts';
import Settings from './Settings';

const InstagramApp = () => {
  const [user, setUser] = useState(null);
  const [activeSection, setActiveSection] = useState('home');
  const [viewingProfile, setViewingProfile] = useState(null);
  const [feedOptions, setFeedOptions] = useState({
    filter: 'all',
    sort: 'recent',
    showStories: true,
    showReels: true
  });

  useEffect(() => {
    setUser({ 
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'test@example.com', 
      displayName: 'Test User' 
    })
  }, []);

  const handleLogout = async () => {
    try {
      await nhost.auth.signOut();
      window.location.reload();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const updateFeedOption = (key, value) => {
    setFeedOptions(prev => ({ ...prev, [key]: value }));
  };

  const handleViewProfile = (profileUser) => {
    setViewingProfile(profileUser);
    setActiveSection('profile');
  };

  const handleBackToOwnProfile = () => {
    setViewingProfile(null);
  };

  const sections = [
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'search', label: 'Search', icon: '🔍' },
    { id: 'reels', label: 'Reels', icon: '🎬' },
    { id: 'shared', label: 'Shared', icon: '📤' },
    { id: 'messages', label: 'Messages', icon: '💬' },
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'settings', label: 'Settings', icon: '⚙️' }
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      fontFamily: 'Roboto, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        padding: '1rem',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        background: 'rgba(0,0,0,0.2)'
      }}>
        <div style={{
          maxWidth: '600px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h1 style={{ margin: 0, fontSize: '1.5rem' }}>GENZES CHATS</h1>
          <button onClick={handleLogout} style={{
            padding: '0.5rem 1rem',
            background: '#ff3040',
            border: 'none',
            borderRadius: '6px',
            color: 'white',
            cursor: 'pointer'
          }}>Logout</button>
        </div>
      </div>

      {/* Feed Options */}
      <div style={{
        maxWidth: '600px',
        margin: '0 auto',
        padding: '1rem'
      }}>
        <div style={{
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '12px',
          padding: '1rem',
          marginBottom: '1rem'
        }}>
          <h3 style={{ margin: '0 0 1rem 0' }}>Feed Options</h3>
          
          <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            {/* Filter */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Filter:</label>
              <select
                value={feedOptions.filter}
                onChange={(e) => updateFeedOption('filter', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '6px',
                  color: '#fff'
                }}
              >
                <option value="all" style={{ background: '#333' }}>All Posts</option>
                <option value="following" style={{ background: '#333' }}>Following</option>
                <option value="favorites" style={{ background: '#333' }}>Favorites</option>
                <option value="saved" style={{ background: '#333' }}>Saved</option>
              </select>
            </div>

            {/* Sort */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Sort by:</label>
              <select
                value={feedOptions.sort}
                onChange={(e) => updateFeedOption('sort', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '6px',
                  color: '#fff'
                }}
              >
                <option value="recent" style={{ background: '#333' }}>Most Recent</option>
                <option value="popular" style={{ background: '#333' }}>Most Popular</option>
                <option value="trending" style={{ background: '#333' }}>Trending</option>
              </select>
            </div>
          </div>

          {/* Toggle Options */}
          <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={feedOptions.showStories}
                onChange={(e) => updateFeedOption('showStories', e.target.checked)}
              />
              Show Stories
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={feedOptions.showReels}
                onChange={(e) => updateFeedOption('showReels', e.target.checked)}
              />
              Show Reels
            </label>
          </div>
        </div>

        {/* Navigation */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '1rem',
          flexWrap: 'wrap'
        }}>
          {sections.map(section => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              style={{
                padding: '0.75rem 1rem',
                border: 'none',
                borderRadius: '8px',
                background: activeSection === section.id ? '#0095f6' : 'rgba(255,255,255,0.1)',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <span>{section.icon}</span>
              {section.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeSection === 'profile' ? (
          <Profile 
            user={user} 
            viewingProfile={viewingProfile} 
            currentUser={user}
            onBackToOwnProfile={handleBackToOwnProfile}
          />
        ) : activeSection === 'shared' ? (
          <SharedContent user={user} />
        ) : activeSection === 'settings' ? (
          <Settings user={user} />
        ) : activeSection === 'home' ? (
          <TestSharePosts onViewProfile={handleViewProfile} />
        ) : (
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '12px',
            padding: '2rem',
            textAlign: 'center'
          }}>
            <h2>Current Section: {sections.find(s => s.id === activeSection)?.label}</h2>
            <p>Filter: {feedOptions.filter} | Sort: {feedOptions.sort}</p>
            <p style={{ color: '#8e8e8e', fontSize: '0.9rem' }}>
              Stories: {feedOptions.showStories ? 'Enabled' : 'Disabled'} | 
              Reels: {feedOptions.showReels ? 'Enabled' : 'Disabled'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstagramApp;